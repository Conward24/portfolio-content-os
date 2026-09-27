// The signal board: every active Blabbing topic, staged on the conversation ladder.
//   GET                → { today, summary, topics[], meta }   (also read by the MyLÚA morning routine)
//   GET ?brand=mylua   → only that brand's topics
//   POST { key, checked } → Michael ticks "sources checked" on one item

import { getAllHistories, getChecked, setChecked, getMeta, easternDate, getBoardCache, saveBoardCache } from '../../../lib/blabbing/pulse';
import { buildBoard } from '../../../lib/blabbing/ladder';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { key, checked } = req.body || {};
    if (!key || typeof key !== 'string') return res.status(400).json({ error: 'Missing key' });
    await setChecked(key, !!checked);
    return res.status(200).json({ success: true });
  }
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const today = easternDate(new Date().toISOString());
    const [cached, checked, meta] = await Promise.all([getBoardCache(), getChecked(), getMeta()]);
    let board = cached;
    if (!board || board.today !== today || req.query.fresh) {
      board = buildBoard(await getAllHistories(), { today });
      await saveBoardCache(board);
    }
    board = { ...board, topics: board.topics.map(t => ({ ...t, items: t.items.map(i => ({ ...i, checked: !!checked[i.key] })) })) };
    if (req.query.brand) board.topics = board.topics.filter(t => t.brand === req.query.brand);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ...board, meta });
  } catch (e) {
    console.error('[signals/board]', e);
    return res.status(500).json({ error: 'Board failed to build' });
  }
}
