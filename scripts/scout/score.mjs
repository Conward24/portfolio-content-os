import fs from 'node:fs';
import path from 'node:path';
import { DATA } from './env.mjs';

// Local memory the scorer needs: every post ever seen (for per-account
// baselines), what has already been analysed, and the Messages cursor.
const FILE = path.join(DATA, 'history.json');

export function loadHistory() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
  catch { return { posts: {}, analyzed: {}, messagesRowid: 0 }; }
}
export function saveHistory(h) {
  // Drop posts older than 120 days so the file stays small.
  const cutoff = Date.now() - 120 * 86400e3;
  for (const [id, p] of Object.entries(h.posts)) if (Date.parse(p.postedAt || p.seenAt) < cutoff) delete h.posts[id];
  fs.writeFileSync(FILE + '.tmp', JSON.stringify(h));
  fs.renameSync(FILE + '.tmp', FILE);
}

// One number per post that means "how much attention it got". Views where the
// platform shows them; otherwise engagement, scaled so the two are roughly
// comparable (IG carousels have no public views).
export function attention(p) {
  if (p.views) return p.views;
  const eng = (p.likes || 0) + 3 * (p.comments || 0) + 4 * (p.shares || 0) + 4 * (p.saves || 0);
  return eng ? eng * 25 : 0;
}

const median = xs => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export function recordPosts(history, posts) {
  const now = new Date().toISOString();
  for (const p of posts) {
    const prev = history.posts[p.id];
    history.posts[p.id] = {
      platform: p.platform, handle: p.handle.toLowerCase(), kind: p.kind, postedAt: p.postedAt,
      attention: Math.max(attention(p), prev?.attention || 0), seenAt: prev?.seenAt || now, lastSeen: now,
    };
  }
}

function accountBaseline(history, p) {
  const key = p.handle.toLowerCase();
  const xs = Object.entries(history.posts)
    // Posts under 3 days old are still collecting views; counting them drags
    // the median down and makes everything look like an outlier.
    .filter(([id, h]) => h.platform === p.platform && h.handle === key && id !== p.id && h.attention > 0 && Date.now() - Date.parse(h.postedAt) > 3 * 86400e3)
    .sort((a, b) => Date.parse(b[1].postedAt) - Date.parse(a[1].postedAt))
    .slice(0, 30)
    .map(([, h]) => h.attention);
  return { n: xs.length, median: xs.length ? median(xs) : null };
}

// Why a post is in the feed, in words the card can show.
export function scorePost(history, p, cfg) {
  const S = cfg.score;
  const att = attention(p);
  const ageDays = p.postedAt ? (Date.now() - Date.parse(p.postedAt)) / 86400e3 : null;
  if (p.source === 'shared') return { keep: true, rank: 1e9, reason: 'Someone sent you this', multiple: null, ageDays };
  // Discovery finds formats that are still travelling weeks later; watched
  // accounts are judged on what they posted recently.
  const maxAge = p.source === 'account' ? S.maxPostAgeDays : (S.maxDiscoveryAgeDays || S.maxPostAgeDays);
  if (ageDays != null && ageDays > maxAge) return { keep: false };
  if (!att) return { keep: false };

  const base = accountBaseline(history, p);
  if (base.n >= S.minAccountHistory && base.median > 0) {
    const multiple = att / base.median;
    if (multiple >= S.accountOutlierMin) {
      return { keep: true, rank: Math.log10(att) * Math.log2(1 + multiple), multiple, basis: 'account', reason: `${multiple.toFixed(1)}× @${p.handle}'s usual ${p.views ? 'views' : 'engagement'}`, ageDays };
    }
    return { keep: false };
  }
  if (p.platform === 'tiktok' && p.followers && p.views >= S.tiktokMinViews) {
    const reach = p.views / p.followers;
    if (reach >= S.tiktokReachMin) {
      return { keep: true, rank: Math.log10(att) * Math.log2(1 + reach), multiple: reach, basis: 'followers', reason: `${reach.toFixed(1)}× views per follower (${fmt(p.views)} views, ${fmt(p.followers)} followers)`, ageDays };
    }
    return { keep: false };
  }
  if (p.platform === 'instagram' && p.source !== 'account' && ((p.views || 0) >= S.igDiscoveryMinPlays || (p.likes || 0) >= S.igDiscoveryMinLikes)) {
    return { keep: true, rank: Math.log10(att) * 3, multiple: null, basis: 'hashtag', reason: `Top reel in #${p.sourceDetail || 'a watched hashtag'} (${p.views ? `${fmt(p.views)} plays` : `${fmt(p.likes)} likes`})`, ageDays };
  }
  return { keep: false };
}

export function fmt(n) {
  if (n == null) return '';
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K`;
  return String(n);
}

// Shared links first, then the strongest outliers, spread across lanes and
// alternating platforms so one app's numbers can't crowd out the other.
export function pick(scored, cfg) {
  const S = cfg.score;
  const shared = scored.filter(x => x.p.source === 'shared');
  const byPlatform = { instagram: [], tiktok: [] };
  for (const x of scored.filter(x => x.p.source !== 'shared').sort((a, b) => b.s.rank - a.s.rank)) (byPlatform[x.p.platform] ||= []).push(x);
  const perLane = {};
  const out = [...shared];
  const queues = Object.values(byPlatform).filter(q => q.length);
  while (out.length < S.maxCardsPerRun + shared.length && queues.some(q => q.length)) {
    for (const q of queues) {
      while (q.length) {
        const x = q.shift();
        if ((perLane[x.p.lane] || 0) >= S.maxCardsPerLane) continue;
        perLane[x.p.lane] = (perLane[x.p.lane] || 0) + 1;
        out.push(x);
        break;
      }
      if (out.length >= S.maxCardsPerRun + shared.length) break;
    }
  }
  return out;
}
