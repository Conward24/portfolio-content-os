// Seed a launch campaign into the Content OS calendar from a JSON file.
//
//   node scripts/seed-henway-birthday.mjs posts.json --dry-run          # validate + print, write nothing
//   node scripts/seed-henway-birthday.mjs posts.json --wipe-tag henway-birthday-2026
//   BASE=https://portfolio-content-os.vercel.app node scripts/seed-henway-birthday.mjs posts.json --api
//   node scripts/seed-henway-birthday.mjs --list-ids --api https://portfolio-content-os.vercel.app
//   node scripts/seed-henway-birthday.mjs posts.json --wipe-ids stale.json --wipe-tag henway-birthday-2026
//
// Flags
//   --dry-run          validate and print exactly what would be written; uploads nothing
//   --wipe-tag <tag>   first delete every calendar post whose `tag` equals <tag> (and its
//                      posted-tick), so reseeding the same campaign is idempotent
//   --wipe-ids <file>  first delete every calendar post whose id is in <file> (a JSON array of
//                      ids, or { ids: [...] }), plus their posted-ticks. For posts that carry no
//                      `tag`, e.g. the stale untagged Henway seed (Aug 17 → Sep 14). Ids not on
//                      the live calendar are reported and skipped, never an error.
//   --list-ids         GET only: print id · brand · date · channelLabel · title of every live post
//                      (oldest date first) and exit. No posts file needed. Use it to pick ids for
//                      --wipe-ids. Works with --api or direct Redis creds.
//   --tag <tag>        default `tag` stamped on posts that do not carry one
//                      (default: henway-birthday-2026)
//   --api [BASE]       write through the running app's HTTP API instead of Redis/Blob
//                      directly. BASE defaults to $BASE or http://localhost:3000.
//
// Transport
//   Default is DIRECT: the same Redis keys and Blob paths the app uses
//   (pages/api/calendar.js, pages/api/upload.js, pages/api/posted.js). Needs the
//   NewRedis_/KV_/UPSTASH_ Redis vars and BLOB_READ_WRITE_TOKEN in .env.local
//   (`vercel env pull .env.local`) plus `npm install` for @upstash/redis and @vercel/blob.
//   --api needs neither, but /api/upload runs inside a Vercel function whose request body
//   is capped at ~4.5MB, so large mp4s must go DIRECT (or already be in the library).
//
// Input file: an array of posts, or { tag, posts: [...] }. Post shape (see
// ~/gtm-advisor/passes/henway-assets-2026-09-02/CONTENT-OS-CONTRACT.md):
//   {
//     "id":           optional; generated as post-<tag>-<slug(title)>; MUST start with "post-"
//     "brand":        "henway" | "mylua" | "blabbing" | "mike"
//     "channelLabel": "PERSONAL" | "COMPANY" | "TIKTOK" | "CROSSOVER" | "EMAIL"  (EMAIL = a Kit send)
//     "channel":      optional free label, e.g. "LinkedIn company", "TikTok", "Personal IG Story"
//     "date":         "YYYY-MM-DD"        (local Eastern, no timezone)
//     "time":         "HH:MM" 24h         (Eastern; the ICS feed treats it as floating local time)
//     "title":        short calendar label
//     "copy":         the paste-ready caption, hashtags included
//     "type":         optional, e.g. "Text post" | "Video" | "Carousel" | "Card" | "IG Story"
//     "kind":         optional, "post" (default) | "camera"  — camera posts carry a script
//     "script":       required when kind === "camera"; the on-camera script
//     "notes":        optional production note (existing field on live posts)
//     "firstComment": optional (existing field on live posts)
//     "assets":       optional ["file-in-library.mp4", ...] matched by NAME against the photo library
//     "asset":        optional local path (or array of paths) to upload to Blob; its basename is
//                     appended to `assets`. Skipped if the library already has that name.
//     "tag":          optional; defaults to --tag
//   }

import { readFileSync, existsSync, statSync } from 'fs';
import path from 'path';

// Load .env.local if present so Redis/Blob creds match the running app automatically.
try {
  for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* no .env.local — fall back to shell env */ }

// ── constants shared with the app ──────────────────────────────────────────
const CALENDAR_KEY = 'portfolio:calendar:posts';   // pages/api/calendar.js
const POSTED_KEY = 'portfolio:calendar:posted';    // pages/api/posted.js
const PHOTO_INDEX_KEY = 'portfolio:photo:index';   // pages/api/upload.js
const PHOTO_KEY = id => `portfolio:photo:${id}`;

const BRANDS = ['henway', 'mylua', 'blabbing', 'mike'];
const CHANNEL_LABELS = ['PERSONAL', 'COMPANY', 'TIKTOK', 'CROSSOVER', 'EMAIL'];   // lib/constants.js CHANNEL_LABELS (advisor.js schema lacks EMAIL on purpose)
const DEFAULT_CHANNEL = { PERSONAL: 'LinkedIn personal', COMPANY: 'LinkedIn company', TIKTOK: 'TikTok', CROSSOVER: 'Crossover', EMAIL: 'Kit email' };
const KINDS = ['post', 'camera'];
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4', '.mov': 'video/quicktime' };

// ── args ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--') && !isFlagValue(a));
const DRY = args.includes('--dry-run');
const flag = (name) => { const i = args.indexOf(`--${name}`); return i === -1 ? undefined : args[i + 1]; };
function isFlagValue(a) {
  const i = args.indexOf(a);
  if (i <= 0 || a.startsWith('--')) return false;
  if (['--wipe-tag', '--tag', '--wipe-ids'].includes(args[i - 1])) return true;
  return args[i - 1] === '--api' && /^https?:\/\//.test(a);   // --api takes a URL only
}
const WIPE_TAG = flag('wipe-tag');
const WIPE_IDS_FILE = flag('wipe-ids');
const LIST_IDS = args.includes('--list-ids');
const DEFAULT_TAG = flag('tag') || 'henway-birthday-2026';
const USE_API = args.includes('--api');
const BASE = (USE_API && /^https?:\/\//.test(flag('api') || '') ? flag('api') : null) || process.env.BASE || 'http://localhost:3000';

if (!file && !LIST_IDS) {
  console.error('usage: node scripts/seed-henway-birthday.mjs <posts.json> [--dry-run] [--wipe-tag <tag>] [--wipe-ids <ids.json>] [--tag <tag>] [--api [BASE]]');
  console.error('       node scripts/seed-henway-birthday.mjs --list-ids [--api [BASE]]');
  process.exit(1);
}

// --wipe-ids: a JSON array of ids (or { ids: [...] }). Read up front so a typo fails before any network call.
let WIPE_IDS = [];
if (WIPE_IDS_FILE) {
  const rawIds = JSON.parse(readFileSync(WIPE_IDS_FILE, 'utf8'));
  WIPE_IDS = Array.isArray(rawIds) ? rawIds : rawIds?.ids;
  if (!Array.isArray(WIPE_IDS) || !WIPE_IDS.every(x => typeof x === 'string' && x.trim())) {
    console.error(`--wipe-ids ${WIPE_IDS_FILE}: expected a JSON array of id strings, or { ids: [...] }`);
    process.exit(1);
  }
  WIPE_IDS = [...new Set(WIPE_IDS.map(s => s.trim()))];
}

// ── load + validate ────────────────────────────────────────────────────────
// --list-ids is a pure read: no posts file, no validation, no write section.
const raw = LIST_IDS ? [] : JSON.parse(readFileSync(file, 'utf8'));
const input = Array.isArray(raw) ? raw : raw?.posts;
const fileTag = Array.isArray(raw) ? null : raw?.tag;
if (!LIST_IDS && (!Array.isArray(input) || !input.length)) { console.error('Input must be a non-empty array of posts, or { tag, posts: [...] }.'); process.exit(1); }

const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
const errors = [];
const seenIds = new Set();

const posts = input.map((p, i) => {
  const where = `post[${i}]${p.title ? ` "${p.title}"` : ''}`;
  const err = msg => errors.push(`${where}: ${msg}`);

  for (const k of ['brand', 'channelLabel', 'date', 'time', 'title', 'copy']) if (!p[k]) err(`missing required "${k}"`);
  if (p.brand && !BRANDS.includes(p.brand)) err(`brand must be one of ${BRANDS.join('|')}`);
  if (p.channelLabel && !CHANNEL_LABELS.includes(p.channelLabel)) err(`channelLabel must be one of ${CHANNEL_LABELS.join('|')}`);
  if (p.date && !/^\d{4}-\d{2}-\d{2}$/.test(p.date)) err('date must be YYYY-MM-DD');
  // 24h HH:MM is the only form the ICS feed (calendar.ics.js stamp()) and /today (niceTime) parse.
  if (p.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(p.time)) err('time must be 24h HH:MM (e.g. "11:30"), not "11:30 AM"');
  const kind = p.kind || 'post';
  if (!KINDS.includes(kind)) err(`kind must be ${KINDS.join('|')}`);
  if (kind === 'camera' && !(p.script && String(p.script).trim())) err('kind "camera" requires a non-empty "script"');
  if (p.assets !== undefined && !(Array.isArray(p.assets) && p.assets.every(a => typeof a === 'string'))) err('assets must be an array of library file names');

  const uploads = p.asset ? (Array.isArray(p.asset) ? p.asset : [p.asset]) : [];
  for (const a of uploads) {
    const abs = path.resolve(path.dirname(path.resolve(file)), a);
    if (!existsSync(abs)) err(`asset not found: ${abs}`);
    else if (!MIME[path.extname(abs).toLowerCase()]) err(`asset type not supported: ${path.extname(abs)}`);
  }

  const tag = p.tag || fileTag || DEFAULT_TAG;
  const id = p.id || `post-${slug(tag)}-${slug(p.title || i)}`;
  if (!id.startsWith('post-')) err('id must start with "post-" (the calendar Delete button is gated on that prefix)');
  if (seenIds.has(id)) err(`duplicate id ${id}`); seenIds.add(id);

  const hasVideo = [...(p.assets || []), ...uploads].some(a => /\.(mp4|mov)$/i.test(a));
  return {
    id,
    brand: p.brand,
    date: p.date,
    time: p.time,
    title: p.title,
    channel: p.channel || DEFAULT_CHANNEL[p.channelLabel] || p.channelLabel,
    channelLabel: p.channelLabel,
    type: p.type || (kind === 'camera' ? 'Video' : hasVideo ? 'Video' : 'Text post'),
    copy: p.copy,
    kind,
    script: kind === 'camera' ? String(p.script).trim() : (p.script || null),
    notes: p.notes || null,
    firstComment: p.firstComment || null,
    assets: [...(p.assets || [])],           // upload basenames appended after upload
    tag,
    seededAt: new Date().toISOString(),
    __uploads: uploads.map(a => path.resolve(path.dirname(path.resolve(file)), a)),
  };
});

if (errors.length) {
  console.error(`\n${errors.length} problem(s), nothing written:\n  ${errors.join('\n  ')}`);
  process.exit(1);
}

// ── transports ─────────────────────────────────────────────────────────────
// Each exposes: readCalendar, writeCalendar, readPosted, writePosted, readPhotos, uploadPhoto.
async function directTransport() {
  const url = process.env.NewRedis_KV_REST_API_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.NewRedis_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('No Redis creds. Run `vercel env pull .env.local` (NewRedis_KV_REST_API_URL/TOKEN) or use --api.');
  const { Redis } = await import('@upstash/redis');       // lazy: dry-run must work without node_modules
  const redis = new Redis({ url, token });
  return {
    name: `direct redis ${new URL(url).host}`,
    readCalendar: async () => (await redis.get(CALENDAR_KEY)) || [],
    writeCalendar: (arr) => redis.set(CALENDAR_KEY, arr),
    readPosted: async () => (await redis.get(POSTED_KEY)) || {},
    writePosted: (obj) => redis.set(POSTED_KEY, obj),
    readPhotos: async () => {
      const index = (await redis.get(PHOTO_INDEX_KEY)) || [];
      const rows = await Promise.all(index.map(id => redis.get(PHOTO_KEY(id))));
      return rows.filter(Boolean).map(r => (typeof r === 'string' ? JSON.parse(r) : r));
    },
    uploadPhoto: async (abs, brand) => {
      if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN missing; cannot upload assets directly.');
      const { put } = await import('@vercel/blob');
      const name = path.basename(abs);
      const blob = await put(`portfolio/${brand}/${Date.now()}-${name}`, readFileSync(abs), {
        access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN, contentType: MIME[path.extname(abs).toLowerCase()],
      });
      // Mirror pages/api/upload.js exactly: one key per photo (JSON string) + an id index.
      const photoId = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const photo = { id: photoId, url: blob.url, name, brand, uploadedAt: new Date().toISOString() };
      await redis.set(PHOTO_KEY(photoId), JSON.stringify(photo));
      const index = (await redis.get(PHOTO_INDEX_KEY)) || [];
      await redis.set(PHOTO_INDEX_KEY, [photoId, ...index]);
      return photo;
    },
  };
}

async function apiTransport() {
  const headers = { 'Content-Type': 'application/json' };
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || process.env.VERCEL_BYPASS;
  if (bypass) headers['x-vercel-protection-bypass'] = bypass;
  const j = async (r) => { if (!r.ok) throw new Error(`${r.status} ${await r.text()}`); return r.json(); };
  const get = (p) => fetch(`${BASE}${p}`, { headers, redirect: 'manual' }).then(j);
  let pendingDeletes = [];
  return {
    name: `api ${BASE}`,
    readCalendar: async () => (await get('/api/calendar')).posts || [],
    // The API has no bulk write: replace = DELETE existing ids, then POST each new post.
    writeCalendar: async (arr, { removedIds = [], added = [] } = {}) => {
      for (const id of removedIds) await fetch(`${BASE}/api/calendar`, { method: 'DELETE', headers, body: JSON.stringify({ id }) });
      for (const p of added) await j(await fetch(`${BASE}/api/calendar`, { method: 'POST', headers, body: JSON.stringify(p) }));
    },
    readPosted: async () => (await get('/api/posted')).posted || {},
    writePosted: async (_obj, { removedIds = [] } = {}) => {
      for (const id of removedIds) await fetch(`${BASE}/api/posted`, { method: 'POST', headers, body: JSON.stringify({ id, done: false }) });
    },
    readPhotos: async () => (await get('/api/photos?limit=1000')).photos || [],
    uploadPhoto: async (abs, brand) => {
      const size = statSync(abs).size;
      if (size > 4 * 1024 * 1024) throw new Error(`${path.basename(abs)} is ${(size / 1e6).toFixed(1)}MB; /api/upload is capped near 4.5MB on Vercel. Upload it DIRECT (drop --api) or via the Photo library.`);
      const form = new FormData();
      form.append('file', new Blob([readFileSync(abs)], { type: MIME[path.extname(abs).toLowerCase()] }), path.basename(abs));
      form.append('brand', brand);
      const h = { ...headers }; delete h['Content-Type'];
      return (await j(await fetch(`${BASE}/api/upload`, { method: 'POST', headers: h, body: form }))).photo;
    },
  };
}

// ── plan ───────────────────────────────────────────────────────────────────
if (LIST_IDS) console.log(`\nLIST IDS (read only)`);
else {
  console.log(`\n${DRY ? 'DRY RUN' : 'SEED'} · ${posts.length} post(s) from ${file}`);
  console.log(`tag: ${DEFAULT_TAG}${fileTag ? ` (file tag ${fileTag})` : ''}${WIPE_TAG ? ` · wipe-tag: ${WIPE_TAG}` : ''}${WIPE_IDS.length ? ` · wipe-ids: ${WIPE_IDS.length} from ${WIPE_IDS_FILE}` : ''}`);
}

let transport = null;
try {
  transport = USE_API ? await apiTransport() : await directTransport();
  console.log(`transport: ${transport.name}`);
} catch (e) {
  if (!DRY && !LIST_IDS) { console.error(`\n${e.message}`); process.exit(1); }
  if (LIST_IDS) { console.error(`\n${e.message}`); process.exit(1); }
  console.log(`transport: none (${e.message.split('.')[0]}); dry run continues without reading the live calendar`);
}

// Read state (read-only, safe in dry-run too).
let current = [], posted = {}, photos = [];
if (transport) {
  try {
    [current, posted, photos] = await Promise.all([transport.readCalendar(), transport.readPosted(), transport.readPhotos()]);
    console.log(`live: ${current.length} calendar posts · ${Object.keys(posted).length} posted ticks · ${photos.length} library assets`);
  } catch (e) {
    if (!DRY) { console.error(`\nread failed: ${e.message}`); process.exit(1); }
    console.log(`live read failed (${e.message.split('\n')[0]}); continuing dry run blind`);
  }
}

// --list-ids: print every live post and stop. GET only; nothing below this runs.
if (LIST_IDS) {
  const rows = [...current].sort((a, b) => `${a.date || ''} ${a.time || ''}`.localeCompare(`${b.date || ''} ${b.time || ''}`));
  const w = Math.max(2, ...rows.map(p => String(p.id || '').length));
  console.log(`\n${'id'.padEnd(w)}  brand     date        time   label      tag                     title  (✅ = posted, 🎥 = camera)`);
  for (const p of rows) {
    console.log(`${String(p.id || '').padEnd(w)}  ${String(p.brand || '').padEnd(8)}  ${String(p.date || '').padEnd(10)}  ${String(p.time || '').padEnd(5)}  ${String(p.channelLabel || '').padEnd(9)}  ${String(p.tag || '(no tag)').padEnd(22)}  ${posted[p.id] ? '✅ ' : ''}${p.kind === 'camera' ? '🎥 ' : ''}${p.title || ''}`);
  }
  console.log(`\n${rows.length} live post(s). Nothing written.`);
  process.exit(0);
}

const newIds = new Set(posts.map(p => p.id));
const liveIds = new Set(current.map(p => p.id));
const wipeIdSet = new Set(WIPE_IDS);
const wiped = current.filter(p => (WIPE_TAG && p.tag === WIPE_TAG) || wipeIdSet.has(p.id));
const wipeIdsMissing = WIPE_IDS.filter(id => !liveIds.has(id));
const replaced = current.filter(p => newIds.has(p.id) && !wiped.includes(p));
const removedIds = [...wiped, ...replaced].map(p => p.id);
const libraryNames = new Set(photos.map(p => p.name));

// Asset plan: which local files upload, which library names resolve.
for (const p of posts) {
  for (const abs of p.__uploads) {
    const name = path.basename(abs);
    if (libraryNames.has(name)) { p.assets.push(name); p.__skipUpload = [...(p.__skipUpload || []), name]; }
    else p.__doUpload = [...(p.__doUpload || []), abs];
  }
  p.__missing = p.assets.filter(n => photos.length && !libraryNames.has(n));
}

console.log('\nPLAN');
if (WIPE_TAG) {
  const byTag = wiped.filter(p => p.tag === WIPE_TAG);
  console.log(`  wipe ${byTag.length} post(s) tagged "${WIPE_TAG}"${byTag.length ? ': ' + byTag.map(p => p.id).join(', ') : ''}`);
}
if (WIPE_IDS.length) {
  const byId = wiped.filter(p => wipeIdSet.has(p.id));
  console.log(`  wipe ${byId.length} post(s) by id from ${WIPE_IDS_FILE}${byId.length ? ': ' + byId.map(p => `${p.id} (${p.date} ${p.title || ''})`).join(', ') : ''}`);
  if (wipeIdsMissing.length) console.log(`  ${wipeIdsMissing.length} id(s) in --wipe-ids not on the live calendar, skipped: ${wipeIdsMissing.join(', ')}`);
}
if (replaced.length) console.log(`  replace ${replaced.length} existing id(s): ${replaced.map(p => p.id).join(', ')}`);
for (const p of posts) {
  const flags = [p.kind === 'camera' ? 'CAMERA' : null, p.assets.length ? `assets=${p.assets.join(',')}` : null].filter(Boolean).join(' ');
  console.log(`  + ${p.date} ${p.time} [${p.brand}/${p.channelLabel}] ${p.id} · ${p.title}${flags ? ` · ${flags}` : ''}`);
  for (const abs of p.__doUpload || []) console.log(`      upload ${abs} (${(statSync(abs).size / 1e6).toFixed(2)}MB)`);
  for (const n of p.__skipUpload || []) console.log(`      reuse library asset ${n} (already uploaded)`);
  for (const n of p.__missing) console.log(`      WARNING assets name not in library: ${n} (/today will show no asset)`);
}

if (DRY) {
  console.log('\nWOULD WRITE (normalized posts):');
  console.log(JSON.stringify(posts.map(({ __uploads, __doUpload, __skipUpload, __missing, ...p }) => ({ ...p, assets: [...p.assets, ...(__doUpload || []).map(a => path.basename(a))] })), null, 2));
  console.log(`\nDry run: nothing uploaded, nothing written. Feed: ${BASE}/api/calendar.ics`);
  process.exit(0);
}

// ── write ──────────────────────────────────────────────────────────────────
for (const p of posts) {
  for (const abs of p.__doUpload || []) {
    const photo = await transport.uploadPhoto(abs, p.brand);
    p.assets.push(photo.name);
    console.log(`uploaded ${photo.name} → ${photo.url}`);
  }
}

const clean = posts.map(({ __uploads, __doUpload, __skipUpload, __missing, ...p }) => p);
const kept = current.filter(p => !removedIds.includes(p.id));
// Same ordering as pages/api/calendar.js POST: newest first.
await transport.writeCalendar([...clean, ...kept], { removedIds, added: clean });

const postedNext = { ...posted };
const untick = removedIds.filter(id => postedNext[id]);
for (const id of untick) delete postedNext[id];
if (untick.length) await transport.writePosted(postedNext, { removedIds: untick });

console.log(`\nDone. removed ${removedIds.length}, wrote ${clean.length}, calendar now ${clean.length + kept.length} posts.`);
console.log(`Subscribe: webcal://${BASE.replace(/^https?:\/\//, '')}/api/calendar.ics · phone queue: ${BASE}/today`);
