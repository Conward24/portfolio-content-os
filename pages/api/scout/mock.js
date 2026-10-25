import Anthropic from '@anthropic-ai/sdk';
import { redis } from '../../../lib/redis';
import { SCOUT_CARDS } from '../../../lib/scout/keys.mjs';
import { brandRules, SHORT_FORM_RULES } from '../../../lib/scout/rules.mjs';
import { MICHAEL_VOICE } from '../../../lib/voice';
import scoutConfig from '../../../scout/config.json';

export const config = { maxDuration: 300 };

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const LANES = scoutConfig.activeLanes;

function extractJson(text) {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

const VIDEO_SHAPE = `{
  "kind": "video",
  "title": "working title",
  "lengthSec": 45,
  "voice": "who is heard: Tiffany voiceover | Michael on camera | Michael voiceover | text only + sound",
  "hook": { "visual": "", "onScreen": "", "spoken": "" },
  "beats": [ { "at": "0-3s", "visual": "what is on screen, from footage Michael actually has or can shoot", "onScreen": "overlay text", "spoken": "line, or null" } ],
  "caption": "the post caption",
  "hashtags": ["3 to 5, specific"],
  "cta": "",
  "assets": ["each thing to capture or pull: e.g. screen recording of the Henway build screen, 10s of Michael walking into the office"],
  "openQuestions": ["facts Michael must confirm before posting; every [NEEDS SOURCE]"]
}`;
const CAROUSEL_SHAPE = `{
  "kind": "carousel",
  "title": "working title",
  "slides": [ { "n": 1, "headline": "", "body": "", "visual": "what the slide shows" } ],
  "caption": "",
  "hashtags": ["3 to 5, specific"],
  "cta": "",
  "designNotes": "type, colour, layout, in the brand's system",
  "openQuestions": ["facts Michael must confirm before posting; every [NEEDS SOURCE]"]
}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { id, brand, idea, direction } = req.body || {};
  if (!id || !LANES.includes(brand)) return res.status(400).json({ error: 'id and brand are required' });
  const card = await redis.hget(SCOUT_CARDS, id);
  if (!card) return res.status(404).json({ error: 'No such card' });

  const a = card.analysis || {};
  const asCarousel = card.kind === 'carousel' || card.kind === 'image';
  const chosen = Number.isInteger(idea) ? a.ideas?.[idea] : a.ideas?.find(i => i.brand === brand);

  const system = `You are Michael Conward's short-form editor. You turn a format that is working on ${card.platform} into a ready-to-shoot ${asCarousel ? 'carousel' : 'vertical video'} for one of his lanes.

${brandRules(LANES)}

${SHORT_FORM_RULES}
${brand === 'mike' ? `\nHis personal voice, adapted from LinkedIn to short-form (keep the opener and reframe habits):\n${MICHAEL_VOICE.slice(0, 2500)}` : ''}

Reply with JSON only.`;

  const user = `THE FORMAT TO BORROW (from @${card.handle}, ${card.why?.reason || ''})
Format: ${a.formatName}
Recipe: ${a.recipe}
Hook they used: ${JSON.stringify(a.hook)}
Structure: ${(a.structure || []).map(s => `${s.at}: ${s.beat}`).join(' | ')}
Pacing: ${a.pacing}
Text style: ${a.textStyle}
Audio: ${a.audio}
Why it worked: ${(a.whyItWorked || []).join(' / ')}
Fit for ${brand}: ${a.fit?.[brand]?.score}/5, ${a.fit?.[brand]?.why || ''}
${chosen ? `Starting idea: ${chosen.title}. Hook: ${chosen.hook}. Angle: ${chosen.angle}. Assets: ${chosen.assets}` : 'No starting idea for this lane; find the strongest honest angle.'}
${direction ? `Michael's direction: ${direction}` : ''}

Write OUR version for the ${brand} lane. Same format and rhythm, entirely our own content. Use only things that are true about the brand; anything that needs a number or a claim gets [NEEDS SOURCE] and an openQuestions entry.
Shape:
${asCarousel ? CAROUSEL_SHAPE : VIDEO_SHAPE}`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 8000,
      system,
      messages: [{ role: 'user', content: user }],
    });
    if (response.stop_reason === 'refusal') return res.status(200).json({ error: 'Declined to draft this one.' });
    // Thinking is on by default on this model: find the text block, don't index [0].
    const text = response.content.find(b => b.type === 'text')?.text || '';
    const mock = extractJson(text);
    if (!mock?.kind) {
      console.error('[scout/mock] unparseable', text.slice(0, 400));
      return res.status(200).json({ error: 'Got a draft back but could not read it. Try again.' });
    }
    const entry = { ...mock, brand, direction: direction || null, createdAt: new Date().toISOString() };
    // Re-read before writing so a status change made meanwhile isn't lost.
    const latest = (await redis.hget(SCOUT_CARDS, id)) || card;
    const next = { ...latest, mocks: [entry, ...(latest.mocks || [])].slice(0, 6), status: latest.status === 'new' ? 'saved' : latest.status, statusAt: latest.status === 'new' ? entry.createdAt : latest.statusAt };
    await redis.hset(SCOUT_CARDS, { [id]: next });
    return res.status(200).json({ ok: true, mock: entry, card: next });
  } catch (e) {
    console.error('[scout/mock]', e);
    return res.status(500).json({ error: 'The draft failed. Try again.' });
  }
}
