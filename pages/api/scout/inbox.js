import { redis } from '../../../lib/redis';
import { SCOUT_INBOX, parsePostUrl } from '../../../lib/scout/keys.mjs';

// A link someone sent, queued for the worker's next run.
// POST { url, note? }  — from the /scout paste box or the iOS share-sheet
// Shortcut. GET ?url=... works too, so a Shortcut can call it with no body.
export default async function handler(req, res) {
  const src = req.method === 'POST' ? (req.body || {}) : req.query;
  if (!['POST', 'GET'].includes(req.method)) return res.status(405).end();
  if (process.env.SCOUT_INBOX_KEY && src.key !== process.env.SCOUT_INBOX_KEY) return res.status(401).json({ error: 'Wrong key' });

  // The share sheet often hands over "caption text https://..." — pull the link out.
  const raw = String(src.url || '').match(/https?:\/\/\S+/)?.[0] || '';
  const parsed = parsePostUrl(raw);
  if (!parsed) return res.status(400).json({ error: 'That is not an Instagram or TikTok post link.' });

  await redis.rpush(SCOUT_INBOX, JSON.stringify({
    url: parsed.url, note: String(src.note || '').slice(0, 200) || 'you added this', source: src.source || 'inbox', at: new Date().toISOString(),
  }));
  const queued = await redis.llen(SCOUT_INBOX);
  return res.status(200).json({ ok: true, url: parsed.url, queued });
}
