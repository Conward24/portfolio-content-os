// Redis layout for the Scout, shared by the local worker (scripts/scout) and
// the API routes. The worker writes cards; the app reads them and writes
// status and mocks back onto the same hash.
//
//   scout:cards         hash  id -> card JSON
//   scout:feed          zset  id scored by createdAt (ms), newest first in the UI
//   scout:inbox         list  links waiting for the worker ({url, note, source, at})
//   scout:watch:auto    hash  "<platform>:<handle>" -> {lane, addedAt, fromCard}
//   scout:meta          JSON  last run: {at, stats, errors, spentUsd, sources}

export const SCOUT_CARDS = 'scout:cards';
export const SCOUT_FEED = 'scout:feed';
export const SCOUT_INBOX = 'scout:inbox';
export const SCOUT_WATCH_AUTO = 'scout:watch:auto';
export const SCOUT_META = 'scout:meta';

export const SCOUT_STATUSES = ['new', 'saved', 'made', 'passed'];

// Cards whose best brand fit is below this are kept (so the worker never
// re-analyses them) but hidden from the feed by default.
export const SCOUT_FIT_FLOOR = 3;

export function cardId(platform, nativeId) {
  return `${platform}:${nativeId}`;
}

// A shared link, normalised so the same post sent twice is one card.
export function parsePostUrl(raw) {
  let u;
  try { u = new URL(String(raw).trim()); } catch { return null; }
  const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
  if (host.endsWith('instagram.com')) {
    const m = u.pathname.match(/^\/(?:[^/]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
    if (!m) return null;
    return { platform: 'instagram', shortcode: m[2], url: `https://www.instagram.com/${m[1] === 'p' ? 'p' : 'reel'}/${m[2]}/` };
  }
  if (host.endsWith('tiktok.com')) {
    const m = u.pathname.match(/\/(video|photo)\/(\d+)/);
    if (m) return { platform: 'tiktok', id: m[2], url: `https://www.tiktok.com${u.pathname.split('?')[0]}` };
    // vm.tiktok.com / tiktok.com/t/ short links resolve later in the worker
    if (host.startsWith('vm.') || host.startsWith('vt.') || u.pathname.startsWith('/t/')) return { platform: 'tiktok', short: true, url: u.toString() };
  }
  return null;
}
