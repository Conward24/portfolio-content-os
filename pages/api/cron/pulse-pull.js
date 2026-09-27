// Daily pull of B4B Daily Pulse emails into the pulse store.
//
// Replaces the Apps Script forwarder (it stopped on 2026-08-10). The pulses land in
// michael@debenservices.com, which bookme already reads with gmail.readonly, so this
// asks bookme's mail API for the last few days of pulses and stores each one.
// Re-running is safe: the store is keyed by topic and date.
//
// Auth: Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Manual runs may pass
// the same header, or `X-B4B-Secret: $BLABBING_INGEST_SECRET`.
// Optional: ?days=N to look further back (default 3, max 14).

import { parsePulseMail, savePulses, setMeta, PULSE_SENDER, getAllHistories, saveBoardCache, easternDate } from '../../../lib/blabbing/pulse';
import { buildBoard } from '../../../lib/blabbing/ladder';

export const config = { maxDuration: 300 };

const ACCOUNT = 'michael@debenservices.com';

function authorized(req) {
  const auth = req.headers.authorization || '';
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return true;
  const s = req.headers['x-b4b-secret'];
  return !!(process.env.BLABBING_INGEST_SECRET && s === process.env.BLABBING_INGEST_SECRET);
}

async function mail(params) {
  const base = process.env.BOOKME_MAIL_URL || 'https://bookme-omega-smoky.vercel.app/api/mail';
  const url = `${base}?${new URLSearchParams(params)}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    let last = `HTTP error`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${process.env.BOOKME_MAIL_TOKEN}` } });
    if (r.ok) {
      const d = await r.json();
      // bookme reports Gmail quota errors inside a 200 ("errors" with no "hits"); retry those
      if (!(d && d.errors && d.errors.length && !(d.hits && d.hits.length))) return d;
      last = JSON.stringify(d.errors).slice(0, 200);
    } else {
      last = `HTTP ${r.status}`;
    }
    if (attempt === 3) throw new Error(`bookme mail API failed (${params.q ? 'search' : 'read'}): ${last}`);
    await new Promise(res => setTimeout(res, 5000 * (attempt + 1)));
  }
}

export default async function handler(req, res) {
  if (!authorized(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (!process.env.BOOKME_MAIL_TOKEN) return res.status(503).json({ error: 'Set BOOKME_MAIL_TOKEN' });

  const days = Math.min(parseInt(req.query.days || '3', 10) || 3, 14);
  try {
    const search = await mail({ q: `from:${PULSE_SENDER} subject:"Daily Pulse" newer_than:${days}d`, accounts: 'debenservices.com', max: '50' });
    const hits = search.hits || [];
    const pulses = [];
    for (const h of hits) {
      const m = await mail({ account: ACCOUNT, id: h.id });
      const p = parsePulseMail(m);
      if (p) pulses.push(p);
    }
    const saved = await savePulses(pulses);
    await saveBoardCache(buildBoard(await getAllHistories(), { today: easternDate(new Date().toISOString()) }));
    await setMeta({ lastPull: new Date().toISOString(), lastPullCount: String(saved), lastPullError: '' });
    return res.status(200).json({ found: hits.length, saved });
  } catch (e) {
    console.error('[cron/pulse-pull]', e);
    await setMeta({ lastPull: new Date().toISOString(), lastPullError: String(e.message || e).slice(0, 300) });
    return res.status(502).json({ error: String(e.message || e) });
  }
}
