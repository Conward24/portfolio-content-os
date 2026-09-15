// ─────────────────────────────────────────────────────────────────
// Log a post that was published OUTSIDE this system.
//
// Everything here keys off the calendar: /today reads it to know what is due
// and to run the engagement check-in windows, and /replies reads it so a reply
// can reference the actual claim a commenter is reacting to.
//
// A post drafted anywhere else (a doc, a chat, straight into LinkedIn) has no
// calendar entry, so it is invisible to both. This writes the entry and marks
// it posted in one call, which is the whole gap.
//
// Deliberately writes through the SAME two Redis keys the rest of the app uses
// rather than inventing a third store, so /today, /calendar and /replies all
// pick it up with no other change.
// ─────────────────────────────────────────────────────────────────

import { redis } from '../../lib/redis';

const CALENDAR_KEY = 'portfolio:calendar:posts';
const POSTED_KEY = 'portfolio:calendar:posted';

// Local date, not UTC. toISOString() reports tomorrow all evening in Eastern,
// which would file an evening post under the wrong day and break /today.
function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function localTime(d = new Date()) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    copy,
    brand = 'mylua',
    channel = 'mike_personal',
    channelLabel,
    platform = 'LinkedIn Feed',
    date,
    time,
    postedAt,          // ISO. Defaults to now. Drives the engagement windows on /today.
    type = 'external',
    note,
  } = req.body || {};

  if (!copy || !copy.trim()) {
    return res.status(400).json({ error: 'Missing copy. The reply drafter needs the post text for context, so an empty entry is worse than none.' });
  }

  const now = new Date();
  const when = postedAt ? new Date(postedAt) : now;
  if (Number.isNaN(when.getTime())) {
    return res.status(400).json({ error: 'postedAt is not a valid date' });
  }

  const post = {
    id: `ext-${when.getTime()}`,
    brand,
    copy: copy.trim(),
    platform,
    channel,
    channelLabel: channelLabel || null,
    template: null,
    date: date || localDate(when),
    time: time || localTime(when),
    type,
    sentiment: null,
    title: copy.trim().split('\n')[0].slice(0, 60),
    assets: [],
    external: true,        // written outside the system; shown as such in the UI
    note: note || null,
  };

  try {
    const current = (await redis.get(CALENDAR_KEY)) || [];

    // Same copy already logged for the same day is almost always a double
    // submit, not a real second post. Return the existing one rather than
    // creating a duplicate that then splits the reply context.
    const dupe = current.find(p => p.date === post.date && p.copy === post.copy);
    if (dupe) {
      return res.status(200).json({ success: true, post: dupe, duplicate: true });
    }

    await redis.set(CALENDAR_KEY, [post, ...current]);

    // Mark posted in the same call. Logging something you already published and
    // then having to tick it off separately is a step that exists for no reason.
    const posted = (await redis.get(POSTED_KEY)) || {};
    posted[post.id] = when.toISOString();
    await redis.set(POSTED_KEY, posted);

    return res.status(200).json({ success: true, post, postedAt: when.toISOString() });
  } catch (e) {
    console.error('[log-post]', e);
    return res.status(500).json({ error: 'Failed to log post' });
  }
}
