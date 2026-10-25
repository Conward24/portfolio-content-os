# The Scout

Finds Instagram and TikTok posts that beat their own account's usual, breaks each
one down into a format we can borrow, and puts it on `/scout` in Content OS.
Borrow the format, never the content.

## How it runs

The worker runs on Michael's Mac, not on Vercel. It needs ffmpeg, whisper-cli and
yt-dlp, and those don't run in a serverless function.

| When | What |
|---|---|
| 6:30am daily (or on wake) | Full run: watched accounts, hashtags, searches, shared links |
| every 30 min | Shared links only: the `/scout` paste box, the share-sheet Shortcut, Messages |

`~/scout/install.sh` turns the schedule on. To check it's on, run
`launchctl list | grep scout`. Logs are in `~/scout/logs/run-<date>.log`.

To run it by hand from this folder:

```
node scripts/scout/run.mjs --dry       # collect + score, print, write nothing (collecting still costs Apify credit)
node scripts/scout/run.mjs --limit 2   # full run, analyse at most 2 posts
node scripts/scout/run.mjs --inbox     # shared links only
```

## Pipeline

1. **Collect** (`collect.mjs`). Instagram and TikTok come through Apify
   (`apify/instagram-scraper`, `clockworks/tiktok-scraper`), one actor run per lane
   per source. Each run has a spend cap, and there's a daily cap
   (`scout/config.json` → `budget`). If there's no `APIFY_TOKEN`, TikTok accounts
   fall back to yt-dlp, which is free but patchy, and Instagram is off.
2. **Score** (`score.mjs`). A post earns a card when it gets at least 3× the median
   of that account's last 30 posts. Posts under 3 days old are left out of the
   median because they're still collecting views. TikTok discovery posts with no
   baseline use views per follower instead (2× or more, with at least 20K views).
   Instagram hashtag posts need at least 1,500 likes. Shared links always get a card.
3. **Read** (`media.mjs`). It downloads the post into a temp folder and pulls 8
   frames (dense in the first 3.5s), a hard-cut count, a local whisper transcript,
   and the carousel slides. The folder is deleted afterwards, because the disk is
   nearly full.
4. **Break down** (`analyze.mjs`). Claude gets the frames, slides, transcript,
   metrics and the lane rules in `lib/scout/rules.mjs`. It returns the hook, the
   structure, pacing, text style, audio, why it worked, a reusable recipe, a fit
   score for each lane, and ideas. Saves and passes feed back in as taste.
5. **Write**. Images go to Vercel Blob and the card goes to Redis
   (`lib/scout/keys.mjs`). A creator found through discovery who scores 4+ joins
   the watch list (`scout:watch:auto`), so they get a real baseline from the next
   run on.

**Mock it** (`/api/scout/mock`) drafts our version of a card for one lane: a
beat sheet for video, slide copy for a carousel. Any claim that needs a source
comes back as `[NEEDS SOURCE]` and is listed under "Confirm first".

## Setup (one-time)

- **`~/scout/.env`**: holds `ANTHROPIC_API_KEY`, `SCOUT_REDIS_URL`/`TOKEN` (the live
  Content OS store, set-grizzly), `BLOB_READ_WRITE_TOKEN` and `APIFY_TOKEN`. It is
  never committed.
- **`~/scout/.venv`**: yt-dlp plus curl_cffi, installed with
  `python3 -m venv ~/scout/.venv && ~/scout/.venv/bin/pip install yt-dlp "curl_cffi>=0.10,<0.14"`.
- **Messages**: reading links texted to you needs Full Disk Access. Go to System
  Settings → Privacy & Security → Full Disk Access, then add `/usr/local/bin/node`
  and `/bin/zsh`. The worker keeps only the link and the date, never the message
  or who sent it.
- **Share sheet** (iPhone): in Shortcuts, make a new shortcut. Turn on "Show in Share
  Sheet" and set it to accept URLs and text. Add a "Get Contents of URL" action
  pointed at
  `https://portfolio-content-os.vercel.app/api/scout/inbox?url=[Shortcut Input]`.
  Then sharing any reel or TikTok to "Scout" queues it.

## Tuning

Everything is in `scout/config.json`: lanes (accounts, hashtags, searches),
thresholds and budget. Seed accounts that don't resolve are logged as issues on
the page. `activeLanes` picks which lanes run (Henway and Mike since 2026-10-25; MyLÚA
and Blabbing are parked, not deleted). With two lanes, a full run costs about $0.50 in Apify
plus one Claude call per card. A 67s video measured 2026-10-25 used about 7K
input and 4K output tokens. Each run's spend is on the `/scout` header.
