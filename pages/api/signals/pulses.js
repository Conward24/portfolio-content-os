// Backfill: POST { pulses: [ { id, date, subject, body } ] } with X-B4B-Secret.
// Each item is a bookme mail_read result for one Daily Pulse email. Idempotent.

import { parsePulseMail, savePulses } from '../../../lib/blabbing/pulse';

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const secret = process.env.BLABBING_INGEST_SECRET;
  if (!secret || req.headers['x-b4b-secret'] !== secret) return res.status(401).json({ error: 'Unauthorized' });
  const items = (req.body && req.body.pulses) || [];
  const parsed = items.map(parsePulseMail).filter(Boolean);
  const saved = await savePulses(parsed);
  return res.status(200).json({ received: items.length, saved });
}
