// Tracks which scheduled posts have actually gone out.
// Drives the ✅ in the calendar feed and the "done" state on /today.

import { redis } from '../../lib/redis';

const POSTED_KEY = 'portfolio:calendar:posted';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      return res.status(200).json({ posted: (await redis.get(POSTED_KEY)) || {} });
    } catch (e) {
      return res.status(200).json({ posted: {} });
    }
  }

  if (req.method === 'POST') {
    const { id, done } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Missing id' });
    try {
      const current = (await redis.get(POSTED_KEY)) || {};
      if (done) current[id] = new Date().toISOString();
      else delete current[id];
      await redis.set(POSTED_KEY, current);
      return res.status(200).json({ success: true, posted: current });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to save' });
    }
  }

  return res.status(405).end();
}
