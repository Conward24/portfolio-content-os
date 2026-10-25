#!/usr/bin/env node
// The Scout worker. Runs on Michael's Mac from launchd (see scripts/scout/README.md):
// collect posts from watched accounts, hashtags, searches and shared links →
// score each against its own account's usual → break the winners down with
// Claude → write pattern cards to Redis for the /scout page.
//
//   node scripts/scout/run.mjs            full run
//   node scripts/scout/run.mjs --dry      collect + score, print, write nothing
//   node scripts/scout/run.mjs --inbox    shared links only (no watch-list spend)
//   node scripts/scout/run.mjs --limit 2  analyse at most 2 posts

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { loadEnv, TMP, DATA, SCOUT_HOME } from './env.mjs';

loadEnv();
// The worker's two packages live in ~/scout/node_modules, not the repo's:
// repo node_modules get cleaned up when disk runs low, and the schedule
// shouldn't die with them. Falls back to the repo's if present.
const req = createRequire(path.join(SCOUT_HOME, 'package.json'));
const load = name => import(pathToFileURL(req.resolve(name, { paths: [SCOUT_HOME, process.cwd()] })).href);
const { Redis } = await load('@upstash/redis');
const { put } = await load('@vercel/blob');
const { collectWatched, resolveShared, messagesLinks, tmpClean } = await import('./collect.mjs');
const { loadHistory, saveHistory, recordPosts, scorePost, pick } = await import('./score.mjs');
const { readMedia } = await import('./media.mjs');
const { analyzePost } = await import('./analyze.mjs');
const { apifyReady } = await import('./apify.mjs');
const K = await import('../../lib/scout/keys.mjs');

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const INBOX_ONLY = args.includes('--inbox');
const LIMIT = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;

const here = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(here, '../../scout/config.json'), 'utf8'));

const errors = [], info = [];
const log = {
  info: m => { info.push(m); console.log(`· ${m}`); },
  error: m => { errors.push(m); console.error(`! ${m}`); },
};

fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(DATA, { recursive: true });
const LOCK = path.join(SCOUT_HOME, 'run.lock');
if (fs.existsSync(LOCK) && Date.now() - fs.statSync(LOCK).mtimeMs < 3 * 3600e3) {
  console.error('another run is in progress (run.lock); exiting');
  process.exit(0);
}
fs.writeFileSync(LOCK, String(process.pid));

const redis = new Redis({ url: process.env.SCOUT_REDIS_URL, token: process.env.SCOUT_REDIS_TOKEN });

async function upload(file, name) {
  if (!file) return null;
  const blob = await put(`scout/${name}`, fs.readFileSync(file), { access: 'public', contentType: 'image/jpeg', token: process.env.BLOB_READ_WRITE_TOKEN });
  return blob.url;
}

// What he kept and what he passed on, so the breakdowns learn his taste.
async function tasteNotes() {
  const all = (await redis.hgetall(K.SCOUT_CARDS)) || {};
  const acted = Object.values(all).filter(c => c && c.status && c.status !== 'new' && c.statusAt)
    .sort((a, b) => Date.parse(b.statusAt) - Date.parse(a.statusAt)).slice(0, 24);
  return acted.map(c => `${c.status.toUpperCase()}: ${c.analysis?.formatName || c.kind} by @${c.handle} (${c.platform})${c.mock ? `, mocked for ${c.mock.brand}` : ''}`).join('\n');
}

async function main() {
  const startedAt = new Date().toISOString();
  const history = (globalThis.__scoutHistory = loadHistory());
  const budget = { spent: 0, max: config.budget.apifyMaxUsdPerDay, perRun: config.budget.apifyMaxUsdPerActorRun };
  const sources = { apify: apifyReady(), messages: 'unknown' };

  // 1. Shared links: the inbox list plus anything texted to him.
  const inbox = DRY ? [] : ((await redis.lrange(K.SCOUT_INBOX, 0, -1)) || []).map(x => (typeof x === 'string' ? JSON.parse(x) : x));
  if (!DRY && inbox.length) await redis.del(K.SCOUT_INBOX);
  const msgs = await messagesLinks(history, log);
  sources.messages = msgs.blocked ? 'needs Full Disk Access' : 'on';
  const sharedLinks = [...inbox, ...msgs.links];
  const shared = await resolveShared(sharedLinks, budget, log);
  if (!DRY) for (const r of shared.retry) await redis.rpush(K.SCOUT_INBOX, JSON.stringify(r));
  if (sharedLinks.length) log.info(`shared links: ${sharedLinks.length} in, ${shared.posts.length} resolved`);

  // 2. The watch list and discovery net.
  const autoWatch = (await redis.hgetall(K.SCOUT_WATCH_AUTO)) || {};
  const watched = INBOX_ONLY ? [] : await collectWatched(config, autoWatch, budget, log);
  log.info(`collected ${watched.length} watched posts, apify spend $${budget.spent.toFixed(2)}`);

  // 3. Score. History first, so a batch can baseline against itself.
  const all = [...shared.posts, ...watched];
  recordPosts(history, all);
  const seen = new Set();
  const scored = [];
  for (const p of all) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    const s = scorePost(history, p, config);
    if (!s.keep) continue;
    if (history.analyzed[p.id]) {
      // Already a card. A shared link to it still matters: note who sent it.
      if (p.source === 'shared' && !DRY) {
        const c = await redis.hget(K.SCOUT_CARDS, p.id);
        if (c && !c.shared) await redis.hset(K.SCOUT_CARDS, { [p.id]: { ...c, shared: p.sourceDetail, status: c.status === 'passed' ? 'new' : c.status } });
      }
      continue;
    }
    scored.push({ p, s });
  }
  const chosen = pick(scored, config).slice(0, LIMIT);
  log.info(`${scored.length} new outliers, analysing ${chosen.length}`);

  if (DRY) {
    for (const { p, s } of chosen) console.log(`  ${p.platform} ${p.kind} @${p.handle} [${p.lane || 'shared'}] ${s.reason}  ${p.url}`);
    return { startedAt, made: 0 };
  }

  // 4. Break each one down and write the card.
  const taste = await tasteNotes().catch(() => '');
  let made = 0, claudeIn = 0, claudeOut = 0;
  for (const { p, s } of chosen) {
    const dir = path.join(TMP, p.id.replace(/[^a-z0-9]/gi, '_'));
    try {
      const media = await readMedia(p, dir);
      if (!media.frames.length && !media.slides.length && !media.cover) throw new Error(`no media readable (${media.notes.join('; ')})`);
      const { analysis, usage } = await analyzePost(p, s, media, taste, config.activeLanes);
      claudeIn += usage?.input_tokens || 0; claudeOut += usage?.output_tokens || 0;

      const slug = p.id.replace(/[^a-z0-9]/gi, '-');
      const cover = await upload(media.cover, `${slug}/cover.jpg`);
      const frames = [];
      for (const f of media.frames) frames.push({ t: f.t, url: await upload(f.file, `${slug}/f-${f.t}.jpg`) });
      const slides = [];
      for (const [i, f] of media.slides.entries()) slides.push(await upload(f, `${slug}/s-${i + 1}.jpg`));

      const fits = config.activeLanes.map(l => Number(analysis.fit?.[l]?.score) || 0);
      const card = {
        id: p.id, platform: p.platform, url: p.url, handle: p.handle, followers: p.followers, kind: p.kind,
        caption: (p.caption || '').slice(0, 1200), postedAt: p.postedAt,
        metrics: { views: p.views, likes: p.likes, comments: p.comments, shares: p.shares, saves: p.saves },
        durationSec: media.duration ? Math.round(media.duration) : null, cuts: media.cuts, music: p.music,
        lane: p.lane, source: p.source, sourceDetail: p.sourceDetail, shared: p.source === 'shared' ? p.sourceDetail : null,
        why: { reason: s.reason, multiple: s.multiple, basis: s.basis || null },
        transcript: media.transcript ? media.transcript.slice(0, 3000) : null,
        cover, frames, slides,
        analysis, bestFit: Math.max(0, ...fits),
        status: 'new', createdAt: new Date().toISOString(),
      };
      await redis.hset(K.SCOUT_CARDS, { [p.id]: card });
      await redis.zadd(K.SCOUT_FEED, { score: Date.now(), member: p.id });
      history.analyzed[p.id] = card.createdAt;
      made++;
      log.info(`card: ${p.platform} @${p.handle} "${analysis.formatName}" best fit ${card.bestFit}`);

      // Creators who keep producing usable formats join the watch list, so
      // they get a real baseline from the next run on.
      if (analysis.watchCreator && card.bestFit >= 4 && p.source !== 'account') {
        const key = `${p.platform}:${p.handle}`;
        const count = Object.keys(autoWatch).filter(k => k.startsWith(p.platform)).length;
        const seeded = Object.values(config.lanes).some(L => (L[p.platform]?.accounts || []).map(h => h.toLowerCase()).includes(p.handle.toLowerCase()));
        if (!seeded && !autoWatch[key] && count < config.collect.maxAutoAccountsPerPlatform) {
          const lane = p.lane || Object.entries(analysis.fit).sort((a, b) => (b[1]?.score || 0) - (a[1]?.score || 0))[0][0];
          autoWatch[key] = { lane, addedAt: card.createdAt, fromCard: p.id };
          await redis.hset(K.SCOUT_WATCH_AUTO, { [key]: autoWatch[key] });
          log.info(`watching @${p.handle} on ${p.platform} (${lane})`);
        }
      }
    } catch (e) {
      log.error(`${p.platform} @${p.handle} ${p.url}: ${e.message}`);
      // Don't retry a post forever; a shared one goes back to the inbox once.
      if (p.source !== 'shared') history.analyzed[p.id] = `failed ${new Date().toISOString()}`;
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
  return { startedAt, made, claudeIn, claudeOut, apifyUsd: budget.spent, sources };
}

let result = {};
try {
  result = await main();
} catch (e) {
  log.error(`run failed: ${e.stack || e.message}`);
} finally {
  if (!DRY && globalThis.__scoutHistory) { try { saveHistory(globalThis.__scoutHistory); } catch (e) { console.error('history save failed', e.message); } }
  fs.rmSync(LOCK, { force: true });
  try { tmpClean(TMP); } catch {}
}

if (!DRY) {
  const meta = {
    at: new Date().toISOString(), startedAt: result.startedAt, made: result.made || 0,
    apifyUsd: Number((result.apifyUsd || 0).toFixed(3)),
    claudeTokens: { in: result.claudeIn || 0, out: result.claudeOut || 0 },
    sources: result.sources || null, info: info.slice(-30), errors: errors.slice(-30),
  };
  await redis.set(K.SCOUT_META, meta).catch(e => console.error('meta write failed', e.message));
}
console.log(`done: ${result.made || 0} card(s), ${errors.length} error(s)`);
