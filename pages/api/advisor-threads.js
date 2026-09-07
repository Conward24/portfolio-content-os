// ─────────────────────────────────────────────────────────────────
// Advisor conversations, kept.
//
// Until this existed a conversation with the advisor lived only in the React
// state of one browser tab: navigate away, reload, or let the phone sleep and
// it was gone, and a request that timed out took the question with it. The
// calendar and the posted ticks were in Redis; the advice never was.
//
// Two keys, same store as everything else:
//   portfolio:advisor:threads        index: [{ id, title, updatedAt, turns }]
//   portfolio:advisor:thread:<id>    { id, title, messages, apiMessages, updatedAt }
//
// Images are NOT kept. A pasted screenshot is base64 in the API messages and
// would blow through the value limit in a few turns; it is replaced with a
// one-line placeholder so the model still knows an image was there.
// ─────────────────────────────────────────────────────────────────
import { redis } from '../../lib/redis';

const INDEX_KEY = 'portfolio:advisor:threads';
const threadKey = (id) => `portfolio:advisor:thread:${id}`;
const MAX_THREADS = 200;

export const config = { api: { bodyParser: { sizeLimit: '8mb' } } };

function stripImages(apiMessages) {
  return (apiMessages || []).map((m) => {
    if (!Array.isArray(m.content)) return m;
    return {
      ...m,
      content: m.content.map((b) => (b.type === 'image'
        ? { type: 'text', text: '[an image was attached here; it is not kept between sessions]' }
        : b)),
    };
  });
}

function titleFor(messages) {
  const first = (messages || []).find((m) => m.role === 'user');
  const t = (typeof first?.content === 'string' ? first.content : '') || 'Image question';
  return t.replace(/\s+/g, ' ').trim().slice(0, 72);
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { id } = req.query;
      if (id) {
        const t = await redis.get(threadKey(id));
        return t ? res.status(200).json(t) : res.status(404).json({ error: 'No such conversation' });
      }
      return res.status(200).json({ threads: (await redis.get(INDEX_KEY)) || [] });
    }

    if (req.method === 'POST') {
      const { id, messages, apiMessages, title } = req.body || {};
      if (!id || !Array.isArray(messages)) return res.status(400).json({ error: 'id and messages required' });
      const updatedAt = new Date().toISOString();
      const thread = {
        id,
        title: title || titleFor(messages),
        // Blob previews die with the tab; drop them, keep the text.
        messages: messages.map(({ imagePreview, ...m }) => ({ ...m, hadImage: !!imagePreview || !!m.hadImage })),
        apiMessages: stripImages(apiMessages),
        updatedAt,
      };
      await redis.set(threadKey(id), thread);
      const index = ((await redis.get(INDEX_KEY)) || []).filter((t) => t.id !== id);
      index.unshift({ id, title: thread.title, updatedAt, turns: thread.messages.length });
      await redis.set(INDEX_KEY, index.slice(0, MAX_THREADS));
      return res.status(200).json({ id, title: thread.title, updatedAt });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      await redis.del(threadKey(id));
      const index = ((await redis.get(INDEX_KEY)) || []).filter((t) => t.id !== id);
      await redis.set(INDEX_KEY, index);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  } catch (e) {
    console.error('[advisor-threads]', e);
    return res.status(500).json({ error: e.message });
  }
}
