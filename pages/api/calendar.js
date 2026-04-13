import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const CALENDAR_KEY = 'portfolio:calendar:posts';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const posts = await redis.get(CALENDAR_KEY) || [];
      return res.status(200).json({ posts });
    } catch (e) {
      console.error(e);
      return res.status(200).json({ posts: [] });
    }
  }

  if (req.method === 'POST') {
    const newPost = req.body;
    if (!newPost?.id) return res.status(400).json({ error: 'Missing post id' });
    try {
      const current = await redis.get(CALENDAR_KEY) || [];
      const updated = [newPost, ...current];
      await redis.set(CALENDAR_KEY, updated);
      return res.status(200).json({ success: true, post: newPost });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Failed to save post' });
    }
  }

  if (req.method === 'PATCH') {
    const { id, date } = req.body;
    if (!id || !date) return res.status(400).json({ error: 'Missing id or date' });
    try {
      const current = await redis.get(CALENDAR_KEY) || [];
      const updated = current.map(p => p.id === id ? { ...p, date } : p);
      await redis.set(CALENDAR_KEY, updated);
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to reschedule' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    try {
      const current = await redis.get(CALENDAR_KEY) || [];
      const updated = current.filter(p => p.id !== id);
      await redis.set(CALENDAR_KEY, updated);
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to delete post' });
    }
  }

  return res.status(405).end();
}
