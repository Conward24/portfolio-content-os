// Dev helper: seed sample Blabbing signals into a running app so you can try the
// Signals inbox → Draft flow without waiting on real emails.
//
//   node scripts/seed-blabbing.mjs            # posts to http://localhost:3000
//   BASE=https://your-app.vercel.app node scripts/seed-blabbing.mjs
//
// Reads BLABBING_INGEST_SECRET from the env (same value the app uses).
// Sends the same topic across two days (yesterday cooler, today hotter) so
// day-over-day momentum shows "rising", plus two other archetypes.

// Load .env.local if present so the secret matches the running app automatically.
import { readFileSync } from 'fs';
try {
  for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* no .env.local — fall back to shell env */ }

const BASE = process.env.BASE || 'http://localhost:3000';
const SECRET = process.env.BLABBING_INGEST_SECRET;
if (!SECRET) { console.error('Set BLABBING_INGEST_SECRET in .env.local (same value as the app).'); process.exit(1); }

const HEALTHCARE = 'Healthcare AI agents and their associated marketplaces for development, distribution, and deployment';

const signals = [
  // Same topic, two days — yesterday moderate, today peak → momentum "rising".
  {
    id: 'seed_2026-06-22_healthcare', generatedAt: '2026-06-22T00:01:14-04:00', topic: HEALTHCARE,
    sentiment: 'Positive',
    emotions: { joy: 50, trust: 48, anticipation: 46, surprise: 12, fear: 14, sadness: 5, disgust: 5, anger: 5 },
    summary: 'Healthcare AI agents are gaining traction as platforms add EHR integrations and vetted marketplaces.',
    analysis: 'Para 1...\n\nPara 2...\n\nPara 3...\n\nPara 4...',
  },
  {
    id: 'seed_2026-06-23_healthcare', generatedAt: '2026-06-23T00:01:14-04:00', topic: HEALTHCARE,
    sentiment: 'Positive',
    emotions: { joy: 82, trust: 78, anticipation: 80, surprise: 20, fear: 12, sadness: 3, disgust: 3, anger: 2 },
    summary: 'The market for healthcare AI agents is accelerating toward ~$7B by 2030 as marketplaces become the main distribution channel.',
    analysis: 'The market for AI agents in healthcare is experiencing significant growth...\n\nDevelopment occurs on specialized platforms...\n\nMarketplaces are emerging as the primary channel...\n\nDeploying into live clinical settings presents governance challenges...',
  },
  // Anger/disgust-led → "Rising frustration".
  {
    id: 'seed_2026-06-23_prior-auth', generatedAt: '2026-06-23T00:01:14-04:00',
    topic: 'Insurer prior-authorization delays automated by AI draw provider backlash',
    sentiment: 'Negative',
    emotions: { joy: 8, trust: 14, anticipation: 18, surprise: 22, fear: 38, sadness: 30, disgust: 58, anger: 72 },
    summary: 'Providers are pushing back as payers deploy AI to automate prior-authorization denials, citing patient-safety risk.',
    analysis: 'Para 1...\n\nPara 2...\n\nPara 3...',
  },
  // Surprise-led → "Emerging signal".
  {
    id: 'seed_2026-06-23_robotic-surgery', generatedAt: '2026-06-23T00:01:14-04:00',
    topic: 'Unexpected FDA pathway opens for autonomous robotic surgery assistants',
    sentiment: 'Neutral',
    emotions: { joy: 40, trust: 35, anticipation: 60, surprise: 72, fear: 30, sadness: 8, disgust: 8, anger: 8 },
    summary: 'A surprise regulatory pathway could fast-track autonomous surgical assistants, catching the field off guard.',
    analysis: 'Para 1...\n\nPara 2...\n\nPara 3...',
  },
];

const res = await fetch(`${BASE}/api/ingest/blabbing`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-B4B-Secret': SECRET },
  body: JSON.stringify({ signals }),
});
const out = await res.json();
console.log(res.status, JSON.stringify(out, null, 2));
