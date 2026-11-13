#!/usr/bin/env node
// Check one of OUR finished cuts against the formats in the Scout library.
// Measures our cut with the same craft spec the cards carry
// (lib/scout/craft.mjs), picks the 2-3 closest cards that travelled, and
// lists every gap: captions, fonts, graphics, camera, actions, edit, sound,
// post caption, hashtags, cover. Each gap says whether it is fixed in the
// post copy, a re-render, or only a reshoot.
//
//   node scripts/scout/compare.mjs <master.mp4> --posts <calendar id,id> [--out file.json]

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { loadEnv, SCOUT_HOME } from './env.mjs';

loadEnv();
const req = createRequire(path.join(SCOUT_HOME, 'package.json'));
const load = name => import(pathToFileURL(req.resolve(name, { paths: [SCOUT_HOME, process.cwd()] })).href);
const { Redis } = await load('@upstash/redis');
const { probeDuration, cutCount, frameAt, transcribe } = await import('./media.mjs');
const { img, extractJson } = await import('./analyze.mjs');
const { CRAFT_SHAPE, CRAFT_ASK } = await import('../../lib/scout/craft.mjs');
const { brandRules, SHORT_FORM_RULES, HIS_NUMBERS } = await import('../../lib/scout/rules.mjs');
const K = await import('../../lib/scout/keys.mjs');

const args = process.argv.slice(2);
const master = args[0];
const postIds = (args.includes('--posts') ? args[args.indexOf('--posts') + 1] : '').split(',').filter(Boolean);
const OUT = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
const MODEL = 'claude-opus-5-5';
const CONTENT_OS = 'https://portfolio-content-os.vercel.app';
const redis = new Redis({ url: process.env.SCOUT_REDIS_URL, token: process.env.SCOUT_REDIS_TOKEN });

async function claude(system, content, max = 12000) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: max, system, messages: [{ role: 'user', content }] }),
  });
  if (!res.ok) throw new Error(`claude ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const out = extractJson(data.content.find(b => b.type === 'text')?.text || '');
  if (!out) throw new Error('unreadable reply');
  return { out, usage: data.usage };
}

// 1. Our cut: frames dense at the hook, words from the small model.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scout-cmp-'));
const dur = await probeDuration(master);
const times = [0.1, 0.6, 1.2, 2, 3, 4.5, dur * 0.3, dur * 0.45, dur * 0.6, dur * 0.75, dur * 0.9, Math.max(dur - 0.5, 0.2)].sort((a, b) => a - b);
const frames = [];
for (const [i, t] of times.entries()) { const f = await frameAt(master, t.toFixed(2), path.join(dir, `f${i}.jpg`)); if (f) frames.push({ t: +t.toFixed(1), file: f }); }
const cuts = await cutCount(master);
const transcript = await transcribe(master, dir);

const cal = await (await fetch(`${CONTENT_OS}/api/calendar`)).json();
const posts = (cal.posts || cal).filter(p => postIds.includes(p.id));
const postText = posts.map(p => `--- ${p.channel} (${p.date} ${p.time}) "${p.title}"\nCaption:\n${p.copy}\nNotes: ${p.notes || ''}`).join('\n\n');

// 2. The library: every card with a craft spec.
const all = Object.values((await redis.hgetall(K.SCOUT_CARDS)) || {}).filter(c => c?.analysis?.craft);
const menu = all.map(c => `${c.id} | @${c.handle} ${c.platform} | ${c.metrics?.views ? Math.round(c.metrics.views / 1000) + 'K views' : ''} | "${c.analysis.formatName}" | presenter ${c.analysis.presenter} | henway fit ${c.analysis.fit?.henway?.score ?? '?'} | ${c.analysis.craft.editing?.layout || ''} | ${String(c.analysis.recipe || '').slice(0, 220)}`).join('\n');

const ourDesc = `OUR CUT: ${path.basename(master)}, ${dur.toFixed(1)}s, ${cuts} hard cuts.
Transcript (small whisper model):\n${transcript || '(none)'}
Frames attached at seconds: ${frames.map(f => f.t).join(', ')}.
The posts this cut goes out as:\n${postText}`;

const sys = `You are a short-form video editor who matches a founder's own cuts to formats that travelled on Instagram and TikTok.\n\n${brandRules(['henway', 'mike'])}\n\n${SHORT_FORM_RULES}\n\n${HIS_NUMBERS}`;

const pickRes = await claude(sys, [...frames.slice(0, 6).map(f => img(f.file)), { type: 'text', text: `${ourDesc}

Here is the Scout library (posts that beat their account's usual), one per line:
${menu}

Pick the 3 cards whose FORMAT this cut is closest to or should move toward, the ones whose craft we'd copy to raise its odds. Prefer formats with a person on camera. Reply JSON only: {"refs": [{"id": "", "why": "one line"}]}` }], 2000);
const refs = pickRes.out.refs.map(r => ({ ...r, card: all.find(c => c.id === r.id) })).filter(r => r.card);

// 3. Measure ours, lay it against the refs, list the gaps.
const refText = refs.map((r, i) => `REF ${i + 1}: @${r.card.handle} (${r.card.platform}, ${r.card.metrics?.views || '?'} views, ${r.card.durationSec}s) "${r.card.analysis.formatName}". Why picked: ${r.why}\nCraft: ${JSON.stringify(r.card.analysis.craft)}`).join('\n\n');
const refImgs = [];
for (const [i, r] of refs.entries()) {
  for (const f of (r.card.frames || []).slice(0, 2)) {
    const file = path.join(dir, `r${i}-${f.t}.jpg`);
    fs.writeFileSync(file, Buffer.from(await (await fetch(f.url)).arrayBuffer()));
    refImgs.push(img(file));
  }
}
const cmp = await claude(sys, [...frames.map(f => img(f.file)), ...refImgs, { type: 'text', text: `${ourDesc}

The first ${frames.length} images are OUR cut. The last ${refImgs.length} are the first two frames of each reference, in order (2 per ref).

${refText}

1. Measure OUR cut with the craft spec. ${CRAFT_ASK}
2. Compare ours to the references, area by area: hook/first frame, captions (font, size, case, color, treatment, position, words per screen, animation), headline text, graphics, camera, performer actions, edit (layout, cut rate, jump cuts, punch-ins), length, sound, color, cover, post caption, hashtags, CTA.
3. For every gap, give the change. "fix" says where it gets fixed: "post copy" (caption, hashtags, first comment, cover pick: free, do before posting), "re-render" (captions, graphics, layout, trims, zooms, music: our editor can do it from the existing footage), or "reshoot" (camera, actions, delivery). Don't propose anything the brand rules forbid; we don't mirror-flip his footage, don't add a person who isn't in the footage, and don't invent claims or numbers.
4. Rewrite the post captions for each post listed, keeping what works: TikTok/Shorts first words stay "AI app builder"; 3-5 specific hashtags; no em dashes; say "doesn't", not "never". Change only what the references show will help, and say why.

Reply JSON only:
{
  "ours": ${CRAFT_SHAPE},
  "refs": [{"id": "", "takeaway": "the one thing this ref does that ours doesn't"}],
  "gaps": [{"area": "", "ours": "", "refs": "what the references do", "change": "exact instruction", "fix": "post copy | re-render | reshoot", "priority": 1, "impact": "high | medium | low", "why": ""}],
  "captions": [{"postId": "", "copy": "full new caption", "changed": "what changed and why"}],
  "cover": "which frame/text to use as the cover",
  "verdict": "post as is | post with copy fixes | re-render first | reshoot",
  "oneChange": "the single change most likely to raise its odds"
}` }], 16000);

fs.rmSync(dir, { recursive: true, force: true });
const result = { master, durationSec: +dur.toFixed(1), cuts, transcript, posts: postIds, refs: refs.map(r => ({ id: r.id, handle: r.card.handle, url: r.card.url, views: r.card.metrics?.views, format: r.card.analysis.formatName, why: r.why })), ...cmp.out, usage: [pickRes.usage, cmp.usage] };
if (OUT) fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
console.log(JSON.stringify({ verdict: result.verdict, oneChange: result.oneChange, refs: result.refs.map(r => `@${r.handle} ${r.format}`), gaps: result.gaps?.length }, null, 1));
