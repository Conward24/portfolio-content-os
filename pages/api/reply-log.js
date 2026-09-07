// Every reply the Replies page drafted, newest first, so a comment thread has a
// memory: the next comment on the same post is drafted knowing what was said.
// Written by /api/reply; read here. Screenshots are not stored.
import { redis } from '../../lib/redis';

export const LOG_KEY = 'portfolio:replies:log';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const { postId, limit } = req.query;
    let log = (await redis.get(LOG_KEY)) || [];
    if (postId) log = log.filter((e) => e.postId === postId);
    return res.status(200).json({ entries: log.slice(0, Number(limit) || 50) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
