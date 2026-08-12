// ─────────────────────────────────────────────────────────────────
// Subscribable calendar feed for the posting schedule.
//
// Why a feed and not emailed invites: subscribe once on the phone and every
// post becomes a calendar event with an alert. When the schedule changes here,
// the phone updates itself — no re-sending, no stale invites, no inbox.
//
// Subscribe on iOS: Settings → Calendar → Accounts → Add Account → Other →
// Add Subscribed Calendar → paste this URL (use webcal:// so it opens directly).
// ─────────────────────────────────────────────────────────────────

import { redis } from '../../lib/redis';

const CALENDAR_KEY = 'portfolio:calendar:posts';
const POSTED_KEY = 'portfolio:calendar:posted';

/** RFC 5545 text escaping — order matters, backslash first. */
function esc(s = '') {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Fold to 75 octets per line. Long DESCRIPTIONs are silently dropped otherwise. */
function fold(line) {
  const out = [];
  let buf = '';
  let bytes = 0;
  for (const ch of line) {
    const n = Buffer.byteLength(ch, 'utf8');
    if (bytes + n > 74) {
      out.push(buf);
      buf = ' ';           // continuation lines begin with a space
      bytes = 1;
    }
    buf += ch;
    bytes += n;
  }
  out.push(buf);
  return out.join('\r\n');
}

/** Local (floating) time — fires at 7:30am wherever the phone is. */
function stamp(date, time = '09:00') {
  const [h = '09', m = '00'] = String(time).split(':');
  return `${date.replace(/-/g, '')}T${h.padStart(2, '0')}${m.padStart(2, '0')}00`;
}

function addMinutes(date, time, mins) {
  const [h, m] = String(time || '09:00').split(':').map(Number);
  const d = new Date(Date.UTC(2000, 0, 1, h, m + mins));
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

export default async function handler(req, res) {
  let posts = [];
  let posted = {};
  try {
    posts = (await redis.get(CALENDAR_KEY)) || [];
    posted = (await redis.get(POSTED_KEY)) || {};
  } catch (e) {
    console.error('[calendar.ics] read failed', e);
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Portfolio Content OS//Posting Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Posting schedule',
    'X-WR-CALDESC:What to post and when. Updates automatically.',
    // Ask clients to re-poll hourly rather than the multi-hour default.
    'X-PUBLISHED-TTL:PT1H',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
  ];

  for (const p of posts) {
    if (!p.date) continue;
    const done = Boolean(posted[p.id]);
    const start = stamp(p.date, p.time);
    const end = stamp(p.date, addMinutes(p.date, p.time, 15));

    // The copy rides in the event body, so the reminder itself is postable —
    // no need to open anything if he just wants to paste and go.
    const body = [
      p.copy || '',
      '',
      `— ${p.channelLabel || ''}${p.type ? ` · ${p.type}` : ''}`,
    ].join('\n');

    lines.push(
      'BEGIN:VEVENT',
      `UID:${p.id}@portfolio-content-os`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      fold(`SUMMARY:${esc(`${done ? '✅ ' : ''}${p.channelLabel || 'POST'} · ${p.title || ''}`)}`),
      fold(`DESCRIPTION:${esc(body)}`),
      `STATUS:${done ? 'CANCELLED' : 'CONFIRMED'}`,
      `CATEGORIES:${esc((p.brand || '').toUpperCase())}`,
    );

    // No alarm on something already posted.
    if (!done) {
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'TRIGGER:-PT15M',
        fold(`DESCRIPTION:${esc(`Post in 15 min: ${p.title || ''}`)}`),
        'END:VALARM',
      );
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=900');
  res.setHeader('Content-Disposition', 'inline; filename="posting-schedule.ics"');
  return res.status(200).send(lines.join('\r\n'));
}
