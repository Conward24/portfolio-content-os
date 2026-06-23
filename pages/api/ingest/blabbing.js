// ─────────────────────────────────────────────────────────────────
// Blabbing ingestion endpoint — the single entry point for Daily Pulse signals.
//
// Accepts (auth via X-B4B-Secret header == BLABBING_INGEST_SECRET):
//   POST { signals: [ {contract payload}, ... ] }   ← B4B webhook batch (Option 2)
//   POST { ...one contract payload }                  ← B4B webhook single
//   POST { raw: "<full .eml string>" }                ← email path (Gmail poller)
//   GET  ?date=YYYY-MM-DD | ?limit=N                  ← read back for the dashboard
//
// Whatever the source, signals are normalized to one shape, deduped, stored,
// and tagged with day-over-day momentum. See docs/blabbing-ingestion-contract.md.
// ─────────────────────────────────────────────────────────────────

import { parseBlabbingEmail, normalizeContractPayload } from '../../../lib/blabbing/parseSignal';
import { saveSignals, getRecentSignals, getSignalsByDate } from '../../../lib/blabbing/signalStore';

export default async function handler(req, res) {
  // ── read path ──
  if (req.method === 'GET') {
    try {
      const { date, limit } = req.query;
      const signals = date
        ? await getSignalsByDate(date)
        : await getRecentSignals(limit ? parseInt(limit, 10) : 50);
      return res.status(200).json({ signals });
    } catch (e) {
      console.error('[ingest/blabbing] read failed', e);
      return res.status(200).json({ signals: [] });
    }
  }

  if (req.method !== 'POST') return res.status(405).end();

  // ── auth ──
  const secret = process.env.BLABBING_INGEST_SECRET;
  if (!secret) {
    return res.status(503).json({ error: 'Ingest not configured: set BLABBING_INGEST_SECRET' });
  }
  const provided = req.headers['x-b4b-secret'];
  if (provided !== secret) return res.status(401).json({ error: 'Unauthorized' });

  // ── normalize whatever shape arrived into an array of signals ──
  const body = req.body || {};
  let signals = [];
  try {
    if (typeof body.raw === 'string') {
      const s = parseBlabbingEmail(body.raw);
      if (s) signals = [s];
    } else if (Array.isArray(body.signals)) {
      signals = body.signals.map(p => normalizeContractPayload(p)).filter(Boolean);
    } else if (body.topic) {
      const s = normalizeContractPayload(body);
      if (s) signals = [s];
    }
  } catch (e) {
    console.error('[ingest/blabbing] parse failed', e);
    return res.status(400).json({ error: 'Could not parse payload' });
  }

  if (!signals.length) {
    return res.status(422).json({ error: 'No valid Blabbing signal found in payload' });
  }

  try {
    const summary = await saveSignals(signals);
    return res.status(200).json(summary);
  } catch (e) {
    console.error('[ingest/blabbing] store failed', e);
    const urlVars = ['KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL', 'REDIS_URL', 'KV_URL'];
    const activeUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
    let host = '';
    try { host = new URL(activeUrl).host; } catch { host = '(unparseable/empty)'; }
    return res.status(500).json({
      error: 'Failed to store signals',
      detail: String(e?.message || e),
      dialingHost: host,
      presentUrlVars: urlVars.filter(k => !!process.env[k]),
    });
  }
}
