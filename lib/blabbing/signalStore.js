// ─────────────────────────────────────────────────────────────────
// Blabbing signal store (Upstash Redis)
//
// Keys (namespace `blabbing:`):
//   blabbing:seen                 Set  — dedup ids (sourceMessageId/contract id)
//   blabbing:recent               List — newest-first signals (capped), for the dashboard
//   blabbing:day:<YYYY-MM-DD>     List — signals for one day
//   blabbing:topic:<slug>         List — per-topic history (oldest→newest), for momentum
//   blabbing:raw                  List — source .eml archive, for server-side re-parsing
//
// Dedup is on `sourceMessageId` (email Message-Id) when present, else the
// content `id`. Re-ingesting the same email/payload is a no-op.
//
// WHY THE RAW ARCHIVE EXISTS:
// Signals used to be stored parsed and nothing else. When a parser bug was fixed there was
// nothing to re-derive from, so repairing already-ingested days meant going back to Gmail —
// which only the mailbox owner can do, and only inside the forwarder's search window. Keeping
// the source .eml makes a parser fix repairable in place, by anyone with the ingest secret,
// forever. Cheap insurance: the archive is capped, and it is the only copy of the input.
// ─────────────────────────────────────────────────────────────────

import { redis } from '../redis';

const SEEN = 'blabbing:seen';
const RECENT = 'blabbing:recent';
const RAW = 'blabbing:raw';
const RECENT_CAP = 500;
const TOPIC_CAP = 60;            // ~2 months of daily history per topic
const RAW_CAP = 400;             // ~40 days at 10 pulses/day
const RAW_MAX_BYTES = 300_000;   // per-email ceiling, so one huge email can't blow the store

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
  // Append order is NOT chronological order: a backfill posts newest-first, so the last
  // element can be *newer* than what we're storing. Pick the most recent entry that
  // genuinely predates this one, or none — never compare against the future.
  const history = (await redis.lrange(topicKey(slug), 0, -1)) || [];
  const prior = history
    .filter((h) => h.dateKey && signal.dateKey && h.dateKey < signal.dateKey)
    .sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1))
    .pop() || null;
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

/**
 * Keep the source .eml so a future parser fix can be applied without going back
 * to the mailbox. Stored newest-first and capped. Oversized emails are skipped
 * rather than truncated: a half-email would re-parse into plausible nonsense,
 * which is worse than a gap we can see.
 */
export async function archiveRaw(raw) {
  if (typeof raw !== 'string' || !raw) return { archived: false, reason: 'empty' };
  if (raw.length > RAW_MAX_BYTES) return { archived: false, reason: 'oversize' };
  await redis.lpush(RAW, raw);
  await redis.ltrim(RAW, 0, RAW_CAP - 1);
  return { archived: true };
}

/** Every derived key, i.e. everything except the raw archive. */
async function derivedKeys() {
  const keys = new Set([SEEN, RECENT]);
  for (const s of (await redis.lrange(RECENT, 0, -1)) || []) {
    if (s?.topicSlug) keys.add(topicKey(s.topicSlug));
    if (s?.dateKey) keys.add(dayKey(s.dateKey));
  }
  return [...keys];
}

/**
 * Wipe every stored signal, including the dedup set, so a corrected parser can
 * re-ingest from scratch. Leaves the raw archive intact — that is the only copy
 * of the input, and destroying it is what made the first parser bug expensive.
 *
 * Destructive and secret-gated at the route. Returns what it removed.
 */
export async function resetSignals() {
  const keys = await derivedKeys();
  await Promise.all(keys.map((k) => redis.del(k)));
  return { cleared: keys };
}

/**
 * Re-derive every signal from the archived .eml files using the current parser.
 * This is the repair path for a parser fix: no mailbox access, no re-send, no
 * dependence on the forwarder's search window.
 *
 * Takes the parser as an argument so this module keeps no dependency on it.
 */
export async function reparseAll(parse) {
  const raws = (await redis.lrange(RAW, 0, -1)) || [];
  if (!raws.length) return { reparsed: 0, stored: 0, archived: 0, note: 'raw archive empty' };

  // Clear derived state first so the dedup set does not reject the re-run.
  const keys = await derivedKeys();
  await Promise.all(keys.map((k) => redis.del(k)));

  // Oldest-first, so momentum sees history in the order it actually happened.
  const signals = [];
  for (const raw of raws.slice().reverse()) {
    try {
      const s = parse(raw);
      if (s) signals.push(s);
    } catch {
      // A single unparseable email must not sink the repair.
    }
  }

  const summary = await saveSignals(signals);
  return { reparsed: signals.length, archived: raws.length, ...summary };
}
