import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const PHOTOS_KEY = 'portfolio:library:photos';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const photos = await redis.get(PHOTOS_KEY) || [];
      return res.status(200).json({ photos });
    } catch (e) {
      return res.status(200).json({ photos: [] });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    try {
      const current = await redis.get(PHOTOS_KEY) || [];
      const updated = current.filter(p => p.id !== id);
      await redis.set(PHOTOS_KEY, updated);
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to delete photo' });
    }
  }

  return res.status(405).end();
}
