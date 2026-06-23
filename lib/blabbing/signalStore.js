// ─────────────────────────────────────────────────────────────────
// Blabbing signal store (Upstash Redis)
//
// Keys (namespace `blabbing:`):
//   blabbing:seen                 Set  — dedup ids (sourceMessageId/contract id)
//   blabbing:recent               List — newest-first signals (capped), for the dashboard
//   blabbing:day:<YYYY-MM-DD>     List — signals for one day
//   blabbing:topic:<slug>         List — per-topic history (oldest→newest), for momentum
//
// Dedup is on `sourceMessageId` (email Message-Id) when present, else the
// content `id`. Re-ingesting the same email/payload is a no-op.
// ─────────────────────────────────────────────────────────────────

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const SEEN = 'blabbing:seen';
const RECENT = 'blabbing:recent';
const RECENT_CAP = 500;
const TOPIC_CAP = 60;            // ~2 months of daily history per topic

const dayKey = (d) => `blabbing:day:${d}`;
const topicKey = (slug) => `blabbing:topic:${slug}`;

export function topicSlug(topic) {
  return (topic || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

function dedupId(signal) {
  return signal.sourceMessageId || signal.id;
}

// ── compute day-over-day momentum from a topic's history (oldest→newest) ──
// `prior` = the most recent earlier entry for the same topic.
export function computeMomentum(prior, current) {
  if (!prior) return { trend: 'new', deltaIntensity: 0, priorDateKey: null, days: 0 };

  const pi = prior.derived?.intensity ?? 0;
  const ci = current.derived?.intensity ?? 0;
  const delta = ci - pi;

  let days = 0;
  if (prior.dateKey && current.dateKey) {
    days = Math.round((Date.parse(current.dateKey) - Date.parse(prior.dateKey)) / 86400000);
  }

  let trend;
  if (delta > 0) trend = 'rising';
  else if (delta < 0) trend = 'cooling';
  else if (prior.derived?.type !== current.derived?.type) trend = 'shifting';
  else trend = 'flat';

  return { trend, deltaIntensity: delta, priorType: prior.derived?.type || null, priorDateKey: prior.dateKey, days };
}

// ── store one signal; returns { stored, reason, signal } ──
export async function saveSignal(signal) {
  if (!signal || !signal.topic) return { stored: false, reason: 'invalid' };
  const key = dedupId(signal);
  if (!key) return { stored: false, reason: 'no-dedup-key' };

  // Atomic-ish dedup: SADD returns 1 if newly added, 0 if already present.
  const isNew = await redis.sadd(SEEN, key);
  if (!isNew) return { stored: false, reason: 'duplicate', signal };

  const slug = topicSlug(signal.topic);

  // Momentum vs. the latest prior entry for this topic (before we push today's).
  const history = (await redis.lrange(topicKey(slug), 0, -1)) || [];
  const prior = history.length ? history[history.length - 1] : null;
  signal.topicSlug = slug;
  signal.momentum = computeMomentum(prior, signal);

  // Persist: per-topic history (append), per-day list, recent feed (prepend + cap).
  await redis.rpush(topicKey(slug), signal);
  await redis.ltrim(topicKey(slug), -TOPIC_CAP, -1);
  if (signal.dateKey) await redis.rpush(dayKey(signal.dateKey), signal);
  await redis.lpush(RECENT, signal);
  await redis.ltrim(RECENT, 0, RECENT_CAP - 1);

  return { stored: true, reason: 'ok', signal };
}

// ── store many; returns a summary ──
export async function saveSignals(signals) {
  const results = [];
  for (const s of signals) results.push(await saveSignal(s));
  const stored = results.filter(r => r.stored);
  return {
    received: signals.length,
    stored: stored.length,
    duplicates: results.filter(r => r.reason === 'duplicate').length,
    skipped: results.filter(r => !r.stored && r.reason !== 'duplicate').length,
    needEnrichment: stored.filter(r => r.signal?.needsEnrichment).length,
    signals: stored.map(r => r.signal),
  };
}

export async function getRecentSignals(limit = 50) {
  return (await redis.lrange(RECENT, 0, limit - 1)) || [];
}

export async function getSignalsByDate(dateKey) {
  return (await redis.lrange(dayKey(dateKey), 0, -1)) || [];
}

export async function getTopicHistory(slug) {
  return (await redis.lrange(topicKey(slug), 0, -1)) || [];
}
