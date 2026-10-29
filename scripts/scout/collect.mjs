import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { runActor, apifyReady } from './apify.mjs';
import { YTDLP, HOME } from './env.mjs';
import { cardId, parsePostUrl } from '../../lib/scout/keys.mjs';

const run = promisify(execFile);
const IG_ACTOR = 'apify/instagram-scraper';
// Hashtag pages on the main scraper return the NEWEST posts (0-5 likes); the
// hashtag scraper's reels mode returns the popular ones. Tested 2026-10-25.
const IG_TAG_ACTOR = 'apify/instagram-hashtag-scraper';
const TT_ACTOR = 'clockworks/tiktok-scraper';

// ── Normalisers: every source becomes the same Post shape ───────────────────

const num = v => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : null);

export function fromInstagram(it, source) {
  const kind = it.type === 'Sidecar' ? 'carousel' : it.type === 'Video' ? 'video' : 'image';
  const slides = kind === 'carousel'
    ? (it.images?.length ? it.images : (it.childPosts || []).map(c => c.displayUrl)).filter(Boolean)
    : [];
  return {
    id: cardId('instagram', it.shortCode || it.id),
    platform: 'instagram',
    url: it.url || `https://www.instagram.com/p/${it.shortCode}/`,
    handle: it.ownerUsername || '',
    followers: null,
    kind,
    caption: it.caption || '',
    postedAt: it.timestamp || null,
    views: num(it.videoPlayCount) ?? num(it.igPlayCount) ?? num(it.videoViewCount),
    likes: num(it.likesCount),
    comments: num(it.commentsCount),
    shares: num(it.sharesCount),
    saves: null,
    durationSec: num(it.videoDuration),
    coverUrl: it.displayUrl || null,
    videoUrl: it.videoUrl || null,
    slideUrls: slides.slice(0, 10),
    music: it.musicInfo ? [it.musicInfo.song_name, it.musicInfo.artist_name].filter(Boolean).join(' · ') : null,
    ...source,
  };
}

export function fromTikTok(it, source) {
  const slides = (it.slideshowImageLinks || []).map(s => s.downloadLink || s.tiktokLink).filter(Boolean);
  const kind = it.isSlideshow || slides.length ? 'carousel' : 'video';
  return {
    id: cardId('tiktok', it.id),
    platform: 'tiktok',
    url: it.webVideoUrl || `https://www.tiktok.com/@${it.authorMeta?.name}/video/${it.id}`,
    handle: it.authorMeta?.name || '',
    followers: num(it.authorMeta?.fans),
    kind,
    caption: it.text || '',
    postedAt: it.createTimeISO || null,
    views: num(it.playCount),
    likes: num(it.diggCount),
    comments: num(it.commentCount),
    shares: num(it.shareCount),
    saves: num(it.collectCount),
    durationSec: num(it.videoMeta?.duration),
    coverUrl: it.videoMeta?.coverUrl || it.videoMeta?.originalCoverUrl || null,
    videoUrl: null, // downloaded with yt-dlp from url; TikTok's CDN links need cookies
    slideUrls: slides.slice(0, 10),
    music: it.musicMeta ? `${it.musicMeta.musicName || ''}${it.musicMeta.musicOriginal ? ' (original)' : ''}`.trim() : null,
    ...source,
  };
}

function fromYtdlp(j, source) {
  return {
    id: cardId('tiktok', j.id),
    platform: 'tiktok',
    url: j.webpage_url || j.url || `https://www.tiktok.com/@${j.uploader}/video/${j.id}`,
    handle: j.uploader || j.channel || '',
    followers: num(j.channel_follower_count),
    kind: 'video',
    caption: j.description || j.title || '',
    postedAt: j.timestamp ? new Date(j.timestamp * 1000).toISOString() : null,
    views: num(j.view_count),
    likes: num(j.like_count),
    comments: num(j.comment_count),
    shares: num(j.repost_count),
    saves: num(j.save_count),
    durationSec: num(j.duration),
    coverUrl: j.thumbnail || null,
    videoUrl: null,
    slideUrls: [],
    music: j.track ? [j.track, j.artist].filter(Boolean).join(' · ') : null,
    ...source,
  };
}

// ── Sources ─────────────────────────────────────────────────────────────────

async function ytdlpJson(args) {
  const { stdout } = await run(YTDLP, ['--impersonate', 'chrome', '-J', ...args], { maxBuffer: 64 * 1024 * 1024, timeout: 120000 });
  return JSON.parse(stdout);
}

// Free path for TikTok profiles. Flaky (TikTok often answers "private" to a
// logged-out request), so it is a fallback, not the primary source.
async function tiktokProfileFree(handle, lane, limit) {
  const j = await ytdlpJson(['--flat-playlist', '--playlist-end', String(limit), `https://www.tiktok.com/@${handle}`]);
  return (j.entries || []).map(e => fromYtdlp({ ...e, uploader: e.uploader || handle }, { lane, source: 'account', sourceDetail: `@${handle}` }));
}

// Runs per lane so every post knows which lane found it.
export async function collectWatched(config, autoWatch, budget, log) {
  const posts = [];
  const c = config.collect;
  const jobs = [];

  // Discovery (hashtags, searches) is most of the spend, so it rotates: each
  // day covers `discoveryLanesPerDay` lanes. Watched accounts run every day.
  const laneNames = config.activeLanes;
  const perDay = Math.min(c.discoveryLanesPerDay || laneNames.length, laneNames.length);
  const day = Math.floor(Date.now() / 86400e3);
  const discoverToday = new Set(Array.from({ length: perDay }, (_, i) => laneNames[(day * perDay + i) % laneNames.length]));
  log.info(`discovery today: ${[...discoverToday].join(', ')}`);

  for (const lane of laneNames) {
    const L = config.lanes[lane];
    const discover = discoverToday.has(lane);
    const auto = Object.entries(autoWatch).filter(([, v]) => v.lane === lane).map(([k]) => k.split(':'));
    const igAccounts = [...new Set([...(L.instagram?.accounts || []), ...auto.filter(([p]) => p === 'instagram').map(([, h]) => h)])];
    const ttAccounts = [...new Set([...(L.tiktok?.accounts || []), ...auto.filter(([p]) => p === 'tiktok').map(([, h]) => h)])];

    if (apifyReady()) {
      if (igAccounts.length) jobs.push({ lane, what: 'ig accounts', actor: IG_ACTOR, norm: fromInstagram, source: 'account', input: {
        directUrls: igAccounts.map(h => `https://www.instagram.com/${h}/`), resultsType: 'posts',
        resultsLimit: c.accountPostsPerRun, onlyPostsNewerThan: `${c.accountWindowDays} days`, addParentData: true } });
      if (discover && L.instagram?.hashtags?.length) jobs.push({ lane, what: 'ig hashtag reels', actor: IG_TAG_ACTOR, norm: fromInstagram, source: 'hashtag', tags: L.instagram.hashtags, input: {
        hashtags: L.instagram.hashtags, resultsType: 'reels', resultsLimit: c.hashtagPostsPerRun } });
      if (ttAccounts.length) jobs.push({ lane, what: 'tt accounts', actor: TT_ACTOR, norm: fromTikTok, source: 'account', input: {
        profiles: ttAccounts, resultsPerPage: c.accountPostsPerRun, profileSorting: 'latest', excludePinnedPosts: true,
        shouldDownloadSlideshowImages: true, shouldDownloadVideos: false, shouldDownloadCovers: false } });
      const tags = L.tiktok?.hashtags || [], q = L.tiktok?.searches || [];
      if (discover && (tags.length || q.length)) jobs.push({ lane, what: 'tt discovery', actor: TT_ACTOR, norm: fromTikTok, source: 'discovery', input: {
        hashtags: tags, searchQueries: q, searchSection: '/video', resultsPerPage: c.searchPostsPerRun,
        shouldDownloadSlideshowImages: true, shouldDownloadVideos: false, shouldDownloadCovers: false } });
    } else {
      for (const h of ttAccounts) {
        try { posts.push(...await tiktokProfileFree(h, lane, c.accountPostsPerRun)); }
        catch (e) { log.error(`tiktok @${h} (free path): ${String(e.message).split('\n').pop().slice(0, 140)}`); }
      }
    }
  }

  for (const job of jobs) {
    if (budget.spent >= budget.max) { log.error(`budget reached ($${budget.spent.toFixed(2)}), skipped ${job.lane} ${job.what}`); continue; }
    try {
      const { items, usd, status } = await runActor(job.actor, job.input, { maxUsd: Math.min(budget.perRun, budget.max - budget.spent) });
      budget.spent += usd;
      let n = 0;
      for (const it of items) {
        if (it.error || it.errorCode) continue;
        const tag = job.tags && (job.tags.find(t => (it.hashtags || []).map(h => String(h).toLowerCase()).includes(t.toLowerCase())) || job.tags[0]);
        const detail = tag ? tag : it.inputUrl ? it.inputUrl.replace(/^https:\/\/www\.instagram\.com\//, '').replace(/\/$/, '') : (it.authorMeta?.name && job.source === 'account' ? `@${it.authorMeta.name}` : (it.searchQuery || it.input || ''));
        const source = job.source === 'discovery' ? (it.searchQuery ? 'search' : 'hashtag') : job.source;
        posts.push(job.norm(it, { lane: job.lane, source, sourceDetail: String(detail || '').slice(0, 80) }));
        n++;
      }
      log.info(`${job.lane} ${job.what}: ${n} posts, $${usd.toFixed(3)} (${status})`);
    } catch (e) {
      log.error(`${job.lane} ${job.what}: ${e.message}`);
    }
  }
  return posts.filter(p => p.handle && p.id);
}

// Links people sent: the app's paste box / share-sheet inbox.
export async function resolveShared(links, budget, log) {
  const out = [];
  const ig = [], ttApify = [];
  for (const l of links) {
    let p = parsePostUrl(l.url);
    if (!p) { log.error(`not an Instagram/TikTok post link: ${l.url}`); continue; }
    const source = { lane: null, source: 'shared', sourceDetail: l.note || l.source || 'shared with you', sharedAt: l.at || null };
    if (p.platform === 'instagram') { ig.push({ p, source }); continue; }
    try {
      const j = await ytdlpJson([p.url]);
      if (j._type === 'playlist') throw new Error('photo post');
      out.push(fromYtdlp(j, source));
    } catch (e) {
      ttApify.push({ p, source });
    }
  }
  if ((ig.length || ttApify.length) && !apifyReady()) {
    log.error(`${ig.length + ttApify.length} shared link(s) need APIFY_TOKEN (Instagram, or TikTok photo posts); kept in the inbox`);
    return { posts: out, retry: [...ig, ...ttApify].map(x => ({ url: x.p.url, note: x.source.sourceDetail, at: x.source.sharedAt })) };
  }
  if (ig.length) {
    try {
      const { items, usd } = await runActor(IG_ACTOR, { directUrls: ig.map(x => x.p.url), resultsType: 'posts', resultsLimit: 1 }, { maxUsd: budget.perRun });
      budget.spent += usd;
      for (const it of items) {
        if (it.error) continue;
        const match = ig.find(x => x.p.shortcode === it.shortCode) || ig[0];
        out.push(fromInstagram(it, match.source));
      }
    } catch (e) { log.error(`shared instagram: ${e.message}`); }
  }
  if (ttApify.length) {
    try {
      const { items, usd } = await runActor(TT_ACTOR, { postURLs: ttApify.map(x => x.p.url), shouldDownloadSlideshowImages: true }, { maxUsd: budget.perRun });
      budget.spent += usd;
      for (const it of items) if (!it.error) out.push(fromTikTok(it, ttApify[0].source));
    } catch (e) { log.error(`shared tiktok: ${e.message}`); }
  }
  return { posts: out, retry: [] };
}

export function tmpClean(dir) {
  for (const f of fs.readdirSync(dir)) fs.rmSync(path.join(dir, f), { recursive: true, force: true });
}
