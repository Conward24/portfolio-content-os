import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// The worker runs from launchd, which starts with an empty environment, so
// everything it needs lives in ~/scout/.env (never in the repo).
export const HOME = os.homedir();
export const SCOUT_HOME = process.env.SCOUT_HOME || path.join(HOME, 'scout');
export const TMP = path.join(SCOUT_HOME, 'tmp');
export const DATA = path.join(SCOUT_HOME, 'data');
export const YTDLP = path.join(SCOUT_HOME, '.venv/bin/yt-dlp');
export const WHISPER_MODEL = path.join(HOME, '.cache/whisper/ggml-base.en.bin');

export function loadEnv() {
  const file = path.join(SCOUT_HOME, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    const val = m[2].replace(/^["']|["']$/g, '');
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
  // launchd PATH is /usr/bin:/bin; ffmpeg and whisper-cli live in /usr/local/bin
  process.env.PATH = ['/usr/local/bin', '/opt/homebrew/bin', process.env.PATH].join(':');
}
