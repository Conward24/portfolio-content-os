import { redis } from '../../lib/redis';

export default async function handler(req, res) {

  if (req.method === 'GET') {
    try {
      // Get the index of photo IDs
      const index = await redis.get('portfolio:photo:index') || [];

      if (!index.length) return res.status(200).json({ photos: [] });

      // Each photo is its own key, so the old 1MB-array limit no longer applies
      // and the hard slice(0, 50) that guarded it became the real ceiling —
      // it silently hid every asset past the 50 most recent. Bounded, not fixed.
      const limit = Math.min(parseInt(req.query.limit, 10) || 500, 1000);
      const photoPromises = index.slice(0, limit).map(id =>
        redis.get(`portfolio:photo:${id}`).then(data => {
          if (!data) return null;
          try {
            return typeof data === 'string' ? JSON.parse(data) : data;
          } catch { return null; }
        })
      );

      const photos = (await Promise.all(photoPromises)).filter(Boolean);
      return res.status(200).json({ photos });
    } catch (e) {
      console.error(e);
      return res.status(200).json({ photos: [] });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    try {
      // Remove from index
      const index = await redis.get('portfolio:photo:index') || [];
      await redis.set('portfolio:photo:index', index.filter(pid => pid !== id));
      // Delete the individual key
      await redis.del(`portfolio:photo:${id}`);
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to delete' });
    }
  }

  return res.status(405).end();
}
