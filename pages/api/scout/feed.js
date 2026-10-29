import { redis } from '../../../lib/redis';
import { SCOUT_CARDS, SCOUT_FEED, SCOUT_META, SCOUT_STATUSES, SCOUT_WATCH_AUTO } from '../../../lib/scout/keys.mjs';

// GET  → { cards (newest first), meta (last worker run), watching }
// POST { id, status } → sets a card's status (new | saved | made | passed).
//      The worker reads these back as Michael's taste.
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { id, status } = req.body || {};
    if (!id || !SCOUT_STATUSES.includes(status)) return res.status(400).json({ error: 'id and a valid status are required' });
    const card = await redis.hget(SCOUT_CARDS, id);
    if (!card) return res.status(404).json({ error: 'No such card' });
    const next = { ...card, status, statusAt: new Date().toISOString() };
    await redis.hset(SCOUT_CARDS, { [id]: next });
    return res.status(200).json({ ok: true, card: next });
  }

  if (req.method !== 'GET') return res.status(405).end();
  try {
    const [ids, meta, watching] = await Promise.all([
      redis.zrange(SCOUT_FEED, 0, 299, { rev: true }),
      redis.get(SCOUT_META),
      redis.hgetall(SCOUT_WATCH_AUTO),
    ]);
    let cards = [];
    if (ids?.length) {
      const rows = await redis.hmget(SCOUT_CARDS, ...ids);
      cards = ids.map(id => rows?.[id]).filter(Boolean);
    }
    return res.status(200).json({ cards, meta: meta || null, watching: Object.keys(watching || {}) });
  } catch (e) {
    console.error('[scout/feed]', e);
    return res.status(500).json({ error: 'Could not load the Scout feed.' });
  }
}
