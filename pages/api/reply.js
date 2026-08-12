// ─────────────────────────────────────────────────────────────────
// Comment reply drafting.
//
// Replaces the screenshot-to-Claude loop: paste the comment (text or a
// screenshot), pick the platform, and get replies in the right register.
//
// Two things make this better than a general chat:
//  1. PLATFORM AWARENESS. A LinkedIn reply and a TikTok reply are different
//     crafts. Same comment, same brand, different register — encoded below.
//  2. POST CONTEXT. The calendar already holds what was posted, so a reply
//     can reference the actual claim the commenter is reacting to instead of
//     guessing from the comment alone.
// ─────────────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk';
import { redis } from '../../lib/redis';
import { BRANDS } from '../../lib/constants';

const client = new Anthropic();

const CALENDAR_KEY = 'portfolio:calendar:posts';

// Register per platform. These are craft differences, not tone preferences —
// a LinkedIn reply pasted into TikTok reads as a brand account trying too hard.
const PLATFORMS = {
  linkedin: {
    name: 'LinkedIn',
    brief: `Peer-to-peer, professional but not corporate. 1-3 short paragraphs is the ceiling; most
good replies are 2-4 sentences. You may disagree, add a distinct point, or ask a real question —
LinkedIn rewards replies that extend the conversation rather than close it. Use the commenter's
first name once. No emoji unless the comment used them first. Never restate the post.
The reply thread is public and is read by people who did not comment, so write for the lurker too.`,
  },
  tiktok: {
    name: 'TikTok',
    brief: `Lowercase, casual, fast. One or two lines maximum — a long reply reads as a brand
account that does not belong here. Emoji are native and fine. Humour lands better than
explanation. If the comment deserves a real answer, the strongest move is often
"replying to this with a video" rather than a text wall. Never use marketing voice.`,
  },
  instagram: {
    name: 'Instagram',
    brief: `Warm, short, conversational. One or two lines. Emoji fine. Closer to TikTok than
LinkedIn, but slightly less jokey. Story replies and DMs are where the real conversation goes,
so a public reply can be brief and move the substance to DM.`,
  },
};

// The installed SDK is 0.20.9 (2024) — it has no `messages.parse()` and no
// `output_config`, and upgrading it would touch generate.js and advisor.js.
// So the shape is specified in the prompt and parsed tolerantly below.
const OUTPUT_SHAPE = `Return ONLY a JSON object, no prose around it, in exactly this shape:

{
  "read": "One or two sentences on what the commenter is actually doing beneath the surface text.",
  "intent": "question | objection | praise | lead | peer | spam | tangent",
  "priority": "reply-now | reply-today | optional | do-not-reply",
  "replies": [
    {
      "angle": "three or four words naming the move, e.g. answer + open question",
      "text": "the reply, ready to paste, no surrounding quotes",
      "why": "one sentence on what this option does that the others do not"
    }
  ],
  "dm": "a short DM to send alongside the public reply — ONLY when intent is lead, otherwise null",
  "caution": "a flag ONLY when replying carries real risk (a claim you cannot verify, a consent issue, someone visibly upset) — otherwise null"
}

"replies" holds two or three options. Use "reply-now" for a lead, or for a public objection that
shapes how everyone else reads the thread.`;

/** Pull the JSON object out of the response, tolerating code fences or stray prose. */
function extractJson(text) {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function systemPrompt(brand, platform, post) {
  const b = BRANDS[brand];
  return `You draft replies to comments on ${b?.name || brand}'s social posts, for Dr. Michael Conward.

## The brand's voice
${b?.systemPrompt || 'Write plainly and specifically. No hype.'}

## The platform: ${PLATFORMS[platform].name}
${PLATFORMS[platform].brief}

${post ? `## The post being commented on
Title: ${post.title}
Channel: ${post.channelLabel} · ${post.date}

${post.copy}

Reply as though you remember writing this. You may reference a specific line from it. Do NOT
restate it back at the commenter.` : `## The post
Not supplied. Write a reply that stands on its own and do not invent what the post said.`}

## How to write these
Reply as Michael, first person. A comment is a person, not a lead-gen event — the reply that earns
the next one is specific, and it treats the commenter as a peer.

Give two or three options that make genuinely DIFFERENT moves (answer it / push back / ask them
something / take it to DM), not one reply written three ways. If one option is clearly right, still
give a second so there is a real choice.

Never invent a statistic, a customer, or a capability. If answering well would need a fact you do
not have, write the reply so it holds without the fact and note that in "why".

If the honest answer is that this comment does not need a reply, say so with priority
"do-not-reply" and still give one option in case he disagrees.

## Output
${OUTPUT_SHAPE}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { comment, image, platform = 'linkedin', brand = 'henway', postId } = req.body || {};

  if (!comment && !image) {
    return res.status(400).json({ error: 'Paste the comment text or a screenshot of it.' });
  }
  if (!PLATFORMS[platform]) {
    return res.status(400).json({ error: `Unknown platform: ${platform}` });
  }

  // Pull the post from the calendar so the reply knows what it is replying about.
  let post = null;
  if (postId) {
    try {
      const posts = (await redis.get(CALENDAR_KEY)) || [];
      post = posts.find(p => p.id === postId) || null;
    } catch (e) {
      console.error('[reply] calendar lookup failed', e);   // non-fatal, drafts without context
    }
  }

  // Screenshots arrive as data URLs from the paste handler.
  const content = [];
  if (image) {
    const m = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(image);
    if (!m) return res.status(400).json({ error: 'Image must be a base64 data URL' });
    content.push({ type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } });
    content.push({
      type: 'text',
      text: comment
        ? `Screenshot of the comment thread, plus what he typed: ${comment}`
        : 'Screenshot of the comment thread. Read the comment (and any replies already on it) and draft replies to the most recent one that needs an answer.',
    });
  } else {
    content.push({ type: 'text', text: `The comment:\n\n${comment}` });
  }

  try {
    const response = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 8000,
      system: systemPrompt(brand, platform, post),
      messages: [{ role: 'user', content }],
    });

    if (response.stop_reason === 'refusal') {
      return res.status(200).json({ error: 'Declined to draft a reply to this one.' });
    }

    // Find the text block by type — do NOT index content[0]. Thinking is on by
    // default on this model, so content[0] can be a thinking block with no .text.
    const text = response.content.find(b => b.type === 'text')?.text || '';
    const parsed = extractJson(text);
    if (!parsed?.replies?.length) {
      console.error('[reply] unparseable response', text.slice(0, 400));
      return res.status(200).json({ error: 'Got a reply back but could not read it. Try again.' });
    }

    return res.status(200).json({
      ...parsed,
      post: post ? { title: post.title, date: post.date, channelLabel: post.channelLabel } : null,
    });
  } catch (err) {
    console.error('[reply] draft failed', err);
    return res.status(500).json({ error: 'Could not draft a reply', details: err.message });
  }
}
