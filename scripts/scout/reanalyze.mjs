#!/usr/bin/env node
// Add the craft spec (lib/scout/craft.mjs) to cards made before it existed.
// Re-downloads each post for dense, sharper frames (yt-dlp, no Apify spend);
// if the post can't be fetched, falls back to the frames already stored on
// the card. Writes card.analysis.craft back to Redis. Nothing else changes.
//
//   node scripts/scout/reanalyze.mjs              every card without a craft spec
//   node scripts/scout/reanalyze.mjs --all        redo every card
//   node scripts/scout/reanalyze.mjs --id <id>    one card

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { loadEnv, TMP, SCOUT_HOME } from './env.mjs';

loadEnv();
const req = createRequire(path.join(SCOUT_HOME, 'package.json'));
const load = name => import(pathToFileURL(req.resolve(name, { paths: [SCOUT_HOME, process.cwd()] })).href);
const { Redis } = await load('@upstash/redis');
const { readMedia } = await import('./media.mjs');
const { describe, img, extractJson } = await import('./analyze.mjs');
const { CRAFT_SHAPE, CRAFT_ASK } = await import('../../lib/scout/craft.mjs');
const K = await import('../../lib/scout/keys.mjs');

const args = process.argv.slice(2);
const ALL = args.includes('--all');
const ONE = args.includes('--id') ? args[args.indexOf('--id') + 1] : null;
const MODEL = 'claude-opus-5-5';
// Own temp folder: the 5-minute inbox job empties ~/scout/tmp (tmpClean).
const RE_TMP = path.join(SCOUT_HOME, 'tmp-reanalyze');
const redis = new Redis({ url: process.env.SCOUT_REDIS_URL, token: process.env.SCOUT_REDIS_TOKEN });

async function fetchTo(url, file) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

async function craftFor(card) {
  const dir = path.join(RE_TMP, card.id.replace(/[^a-z0-9]/gi, '_'));
  fs.mkdirSync(dir, { recursive: true });
  const p = { ...card, ...card.metrics, slideUrls: [], videoUrl: null, coverUrl: null };
  let media = { frames: [], slides: [], transcript: card.transcript, duration: card.durationSec, cuts: card.cuts, notes: [] };
  let fresh = false;
  try {
    if (card.kind === 'video') {
      const m = await readMedia(p, dir, { skipTranscript: !!card.transcript });
      if (m.frames.length) { media = { ...m, transcript: m.transcript || card.transcript }; fresh = true; }
    }
  } catch {}
  if (!fresh) {
    for (const [i, f] of (card.frames || []).entries()) media.frames.push({ t: f.t, file: await fetchTo(f.url, path.join(dir, `old${i}.jpg`)) });
    for (const [i, u] of (card.slides || []).entries()) media.slides.push(await fetchTo(u, path.join(dir, `olds${i}.jpg`)));
  }
  const content = [...media.frames.map(f => img(f.file)), ...media.slides.map(img)];
  content.push({ type: 'text', text: `${describe(p, card.why || { reason: 'outlier' }, media)}

This post already has a breakdown ("${card.analysis?.formatName}": ${card.analysis?.recipe || ''}). Now measure its CRAFT for Michael's editor, who is matching his own cuts to it.
${CRAFT_ASK}
Reply with JSON only, this shape:
${CRAFT_SHAPE}` });
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 10000, system: 'You are a short-form video editor who reverse-engineers posts that travelled on Instagram and TikTok, precisely enough that another editor can replicate the look, pacing and packaging.', messages: [{ role: 'user', content }] }),
  });
  fs.rmSync(dir, { recursive: true, force: true });
  if (!res.ok) throw new Error(`claude ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const craft = extractJson(data.content.find(b => b.type === 'text')?.text || '');
  if (!craft?.captions) throw new Error('unreadable craft');
  return { craft: { ...craft, measuredFrom: fresh ? `${media.frames.length} fresh frames` : `${media.frames.length + media.slides.length} stored frames`, at: new Date().toISOString() }, usage: data.usage };
}

const all = (await redis.hgetall(K.SCOUT_CARDS)) || {};
const todo = Object.values(all).filter(c => c && (ONE ? c.id === ONE : ALL || !c.analysis?.craft));
console.log(`${todo.length} cards to measure`);
let inTok = 0, outTok = 0, done = 0;
const queue = [...todo];
async function worker() {
  while (queue.length) {
    const c = queue.shift();
    try {
      const { craft, usage } = await craftFor(c);
      inTok += usage.input_tokens; outTok += usage.output_tokens;
      const cur = await redis.hget(K.SCOUT_CARDS, c.id);
      await redis.hset(K.SCOUT_CARDS, { [c.id]: { ...cur, analysis: { ...cur.analysis, craft } } });
      done++;
      console.log(`· @${c.handle} "${c.analysis?.formatName}" (${craft.measuredFrom})`);
    } catch (e) { console.error(`! @${c.handle} ${c.id}: ${e.message}`); }
  }
}
await Promise.all(Array.from({ length: 5 }, worker));
console.log(`done ${done}/${todo.length}; claude ${inTok} in / ${outTok} out tokens`);
