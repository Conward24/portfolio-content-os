import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { YTDLP, WHISPER_MODEL } from './env.mjs';

const run = promisify(execFile);

// The disk on this Mac runs near full, so a post's media lives in its own
// temp folder only while it is being read, and the folder is deleted after.

async function download(url, file) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/136 Safari/537.36' } });
  if (!res.ok) throw new Error(`download ${res.status}`);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

async function shrink(src, dst, width) {
  await run('/usr/bin/sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '72', '--resampleWidth', String(width), src, '--out', dst]);
  return dst;
}

async function probeDuration(file) {
  const { stderr } = await run('ffmpeg', ['-hide_banner', '-i', file], { timeout: 30000 }).catch(e => e);
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(stderr || '');
  return m ? (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]) : null;
}

// Hard cuts per second, from ffmpeg's scene score. A rough pacing number.
async function cutCount(file) {
  const { stderr } = await run('ffmpeg', ['-hide_banner', '-i', file, '-vf', "scale=160:-2,select='gt(scene,0.32)',showinfo", '-an', '-f', 'null', '-'], { timeout: 180000, maxBuffer: 32 * 1024 * 1024 }).catch(e => e);
  return ((stderr || '').match(/pts_time:/g) || []).length;
}

async function frameAt(file, t, out) {
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-ss', String(t), '-i', file, '-frames:v', '1', '-vf', 'scale=480:-2', '-q:v', '5', '-y', out], { timeout: 30000 });
  return fs.existsSync(out) ? out : null;
}

async function transcribe(file, dir) {
  if (!fs.existsSync(WHISPER_MODEL)) return null;
  const wav = path.join(dir, 'a.wav');
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', file, '-ar', '16000', '-ac', '1', '-y', wav], { timeout: 120000 });
  await run('whisper-cli', ['-m', WHISPER_MODEL, '-f', wav, '-osrt', '-of', path.join(dir, 't'), '-np'], { timeout: 300000 });
  const srt = fs.readFileSync(path.join(dir, 't.srt'), 'utf8');
  // Keep timestamps, trimmed: "[0.0] line". The first seconds are the hook.
  const lines = [];
  for (const block of srt.split(/\n\n+/)) {
    const m = /(\d+):(\d+):(\d+),(\d+) -->[^\n]*\n([\s\S]*)/.exec(block);
    if (m) lines.push(`[${(+m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000).toFixed(1)}s] ${m[5].replace(/\n/g, ' ').trim()}`);
  }
  const text = lines.join('\n');
  return text.replace(/\[[\d.]+s\]\s*(\[BLANK_AUDIO\]|\(music\)|\[Music\])?\s*/gi, '').trim() ? text : null;
}

// → { frames: [{t, file}], slides: [file], transcript, duration, cuts, cover }
export async function readMedia(post, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const out = { frames: [], slides: [], transcript: null, duration: post.durationSec, cuts: null, cover: null, notes: [] };

  if (post.coverUrl) {
    try { out.cover = await shrink(await download(post.coverUrl, path.join(dir, 'cover.src')), path.join(dir, 'cover.jpg'), 540); }
    catch (e) { out.notes.push(`cover: ${e.message}`); }
  }

  if (post.kind === 'carousel' || post.kind === 'image') {
    const urls = post.slideUrls.length ? post.slideUrls : (post.coverUrl ? [post.coverUrl] : []);
    for (const [i, u] of urls.slice(0, 10).entries()) {
      try { out.slides.push(await shrink(await download(u, path.join(dir, `s${i}.src`)), path.join(dir, `s${i}.jpg`), 720)); }
      catch (e) { out.notes.push(`slide ${i + 1}: ${e.message}`); }
    }
    if (!out.cover && out.slides[0]) out.cover = out.slides[0];
    return out;
  }

  let video = null;
  try {
    if (post.videoUrl) video = await download(post.videoUrl, path.join(dir, 'v.mp4'));
    else {
      await run(YTDLP, ['--impersonate', 'chrome', '-q', '-f', 'b[height<=720]/b', '-o', path.join(dir, 'v.%(ext)s'), post.url], { timeout: 240000 });
      video = fs.readdirSync(dir).map(f => path.join(dir, f)).find(f => /\/v\.(mp4|webm|mov|mkv)$/.test(f)) || null;
    }
  } catch (e) { out.notes.push(`video: ${String(e.message).split('\n').pop().slice(0, 120)}`); }
  if (!video) return out;

  out.duration = (await probeDuration(video)) || out.duration;
  const d = out.duration || 15;
  // Dense at the start (the hook decides the scroll), then spread out.
  const times = [0.1, 1, 2, 3.5, d * 0.3, d * 0.5, d * 0.7, Math.max(d - 1, 0.2)].filter((t, i, a) => t < d && a.indexOf(t) === i);
  for (const [i, t] of times.entries()) {
    try { const f = await frameAt(video, t.toFixed(2), path.join(dir, `f${i}.jpg`)); if (f) out.frames.push({ t: +t.toFixed(1), file: f }); }
    catch (e) { out.notes.push(`frame ${t}: ${e.message}`); }
  }
  if (!out.cover && out.frames[0]) out.cover = out.frames[0].file;
  try { out.cuts = await cutCount(video); } catch {}
  try { out.transcript = await transcribe(video, dir); } catch (e) { out.notes.push(`transcript: ${String(e.message).slice(0, 120)}`); }
  fs.rmSync(video, { force: true });
  return out;
}
