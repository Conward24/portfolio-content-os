import fs from 'node:fs';
import { fmt } from './score.mjs';
import { BRAND_RULES, SHORT_FORM_RULES } from '../../lib/scout/rules.mjs';

const MODEL = 'claude-opus-5-5';

function img(file) {
  return { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: fs.readFileSync(file).toString('base64') } };
}

function extractJson(text) {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const raw = fenced ? fenced[1] : text;
  const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
  if (s === -1 || e <= s) return null;
  try { return JSON.parse(raw.slice(s, e + 1)); } catch { return null; }
}

function describe(p, why, media) {
  const m = [
    `Platform: ${p.platform}. Format: ${p.kind}${p.kind === 'carousel' ? ` (${media.slides.length} slides shown, in order)` : ''}.`,
    `Creator: @${p.handle}${p.followers ? ` (${fmt(p.followers)} followers)` : ''}. Posted: ${p.postedAt || 'unknown'}.`,
    `Numbers: ${[p.views && `${fmt(p.views)} views`, p.likes != null && `${fmt(p.likes)} likes`, p.comments != null && `${fmt(p.comments)} comments`, p.shares && `${fmt(p.shares)} shares`, p.saves && `${fmt(p.saves)} saves`].filter(Boolean).join(', ')}.`,
    `Why it was picked: ${why.reason}.`,
    p.source === 'shared' ? `Someone sent this to Michael (${p.sourceDetail}).` : `Found via ${p.source} ${p.sourceDetail || ''} in the ${p.lane} lane.`,
    media.duration ? `Length: ${Math.round(media.duration)}s.${media.cuts != null ? ` Hard cuts detected: ${media.cuts} (${(media.cuts / Math.max(media.duration, 1)).toFixed(2)}/s).` : ''}` : '',
    p.music ? `Sound: ${p.music}.` : '',
    `Caption:\n${(p.caption || '(none)').slice(0, 1500)}`,
    media.transcript ? `Transcript (local whisper, timestamps in seconds, may mishear names):\n${media.transcript.slice(0, 4000)}` : (p.kind === 'video' ? 'No speech transcript (music-only, or audio unavailable).' : ''),
    media.frames.length ? `Frames attached, at seconds: ${media.frames.map(f => f.t).join(', ')}.` : '',
  ];
  return m.filter(Boolean).join('\n');
}

const SHAPE = `{
  "formatName": "3-6 word name for the FORMAT, e.g. 'POV text over B-roll', 'Myth vs fact carousel'",
  "hook": { "visual": "what is on screen in the first 2s / slide 1", "text": "on-screen text, verbatim", "spoken": "first spoken line, verbatim, or null", "whyItStops": "one sentence" },
  "structure": [ { "at": "0-2s or 'slide 1'", "beat": "what happens" } ],
  "pacing": "one line: length, cut rate, rhythm",
  "textStyle": "one line: caption/overlay style, placement, size, font feel",
  "audio": "one line: voiceover, trending sound, original audio, music bed",
  "cta": "how it asks for the follow/save/comment, or null",
  "whyItWorked": ["2-4 specific reasons tied to what you SEE in this post, not generic advice"],
  "recipe": "the reusable template with the creator's content removed, 2-3 sentences, written so an editor could shoot it",
  "fit": { "mylua": {"score": 0, "why": ""}, "henway": {"score": 0, "why": ""}, "mike": {"score": 0, "why": ""}, "blabbing": {"score": 0, "why": ""} },
  "ideas": [ { "brand": "mylua|henway|mike|blabbing", "title": "", "hook": "the first line/frame of OUR version", "angle": "2 sentences", "assets": "what Michael would need: app screen recording, him on camera, Tiffany voiceover, slides only...", "effort": "low|medium|high" } ],
  "cautions": ["anything risky: licensed trend audio, claims we can't back, a format that would read as copying this creator"],
  "watchCreator": true
}`;

export async function analyzePost(p, why, media, taste) {
  const content = [];
  for (const f of media.frames) content.push(img(f.file));
  for (const s of media.slides) content.push(img(s));
  if (!media.frames.length && !media.slides.length && media.cover) content.push(img(media.cover));
  content.push({ type: 'text', text: `${describe(p, why, media)}

Break this post down for Michael's editor. What made it travel, and how would each of his lanes borrow the FORMAT?
Fit scores: 0 = no use, 3 = usable with a clear angle, 5 = shoot this week. Be strict: most posts are a 2 for most lanes. Give 1-3 ideas, only for lanes scoring 3+, and make them concrete to that lane (a real product moment, a real audience), never generic.
${taste ? `\nMichael's recent taste (learn from it, don't mention it):\n${taste}\n` : ''}
Reply with JSON only, this shape:
${SHAPE}` });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 8000, system: `You are a short-form video and carousel editor who studies what travels on Instagram and TikTok and adapts formats for a founder's brands.\n\n${BRAND_RULES}\n\n${SHORT_FORM_RULES}`, messages: [{ role: 'user', content }] }),
  });
  if (!res.ok) throw new Error(`claude ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  if (data.stop_reason === 'refusal') throw new Error('claude declined');
  // Thinking is on by default on this model: find the text block, don't index [0].
  const text = data.content.find(b => b.type === 'text')?.text || '';
  const out = extractJson(text);
  if (!out?.fit) throw new Error(`unreadable analysis: ${text.slice(0, 160)}`);
  return { analysis: out, usage: data.usage };
}
