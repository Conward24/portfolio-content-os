// ─────────────────────────────────────────────────────────────────
// Daily Pulse store: one reading per topic per day, kept for the whole history.
//
// Keys (namespace `pulse:`):
//   pulse:topics        Hash  slug → topic name
//   pulse:t:<slug>      Hash  YYYY-MM-DD → JSON { topic, date, text, scores, msgId }
//   pulse:meta          Hash  lastPull, lastPullCount, lastPullError
//   pulse:checked       Hash  "<slug>|<entity>" → JSON { at } (Michael checked the sources)
//
// Why a separate namespace from `blabbing:`: the old store keeps capped lists
// (60 per topic, 500 recent) and dedups by message id, which is right for a
// dashboard feed but wrong for the conversation ladder. The ladder needs the full
// day-by-day history per topic, and a date-keyed hash makes re-ingesting any day a
// no-op instead of a duplicate.
// ─────────────────────────────────────────────────────────────────

import { redis } from '../redis';

export const PULSE_SENDER = 'notifications@appuser.io';
const EMOTIONS = ['Joy', 'Trust', 'Fear', 'Sadness', 'Anger', 'Surprise', 'Disgust', 'Anticipation'];

export function topicSlug(topic) {
  return (topic || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

// The pulse is sent around 11am ET; the date that matters is the Eastern calendar day.
export function easternDate(iso) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(d); // YYYY-MM-DD
}

// Parse the plain-text body of a Daily Pulse email (as returned by the bookme mail API).
// Returns null when the message isn't a pulse.
export function parsePulseMail({ id, date, subject, body }) {
  if (!body || !/Daily Pulse/i.test(subject || '')) return null;
  const m = body.match(/following topic:\s*\n(.+?)\n/);
  const topic = (m ? m[1] : (subject || '').replace(/^Daily Pulse:\s*/i, '')).trim();
  if (!topic) return null;
  const after = body.split(topic).slice(1).join(topic);
  const text = after.split(/\nSentiment:/)[0].trim();
  const scores = {};
  for (const k of ['Sentiment', ...EMOTIONS]) {
    const s = after.match(new RegExp(`\\n${k}:\\s*(-?[\\d.]+)`));
    scores[k] = s ? parseFloat(s[1]) : null;
  }
  return { topic, date: easternDate(date), text, scores, msgId: id || null };
}

export async function savePulses(pulses) {
  // One write per topic, not per pulse: a backfill of hundreds stays within a request.
  const byTopic = new Map();
  for (const p of pulses) {
    if (!p || !p.topic || !p.date) continue;
    const slug = topicSlug(p.topic);
    if (!byTopic.has(slug)) byTopic.set(slug, { topic: p.topic, fields: {} });
    byTopic.get(slug).fields[p.date] = JSON.stringify(p);
  }
  if (!byTopic.size) return 0;
  const names = {};
  for (const [slug, { topic }] of byTopic) names[slug] = topic;
  await redis.hset('pulse:topics', names);
  let saved = 0;
  for (const [slug, { fields }] of byTopic) {
    await redis.hset(`pulse:t:${slug}`, fields);
    saved += Object.keys(fields).length;
  }
  return saved;
}

function parseVal(v) {
  if (v == null) return null;
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return null; } }
  return v;
}

// Every topic with its full, date-sorted history.
export async function getAllHistories() {
  const topics = (await redis.hgetall('pulse:topics')) || {};
  return Promise.all(Object.entries(topics).map(async ([slug, topic]) => {
    const h = (await redis.hgetall(`pulse:t:${slug}`)) || {};
    const history = Object.values(h).map(parseVal).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date));
    return { slug, topic, history };
  }));
}

export async function getChecked() {
  const c = (await redis.hgetall('pulse:checked')) || {};
  const out = {};
  for (const [k, v] of Object.entries(c)) out[k] = parseVal(v) || { at: null };
  return out;
}

export async function setChecked(key, checked) {
  if (checked) await redis.hset('pulse:checked', { [key]: JSON.stringify({ at: new Date().toISOString() }) });
  else await redis.hdel('pulse:checked', key);
}

export async function setMeta(fields) {
  await redis.hset('pulse:meta', fields);
}

export async function getMeta() {
  return (await redis.hgetall('pulse:meta')) || {};
}

// The computed board is cached so page loads don't re-read every topic's history.
// The daily pull rebuilds it; "sources checked" ticks are merged in live on read.
export async function saveBoardCache(board) {
  await redis.set('pulse:board', JSON.stringify(board));
}

export async function getBoardCache() {
  return parseVal(await redis.get('pulse:board'));
}
