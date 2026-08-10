// ─────────────────────────────────────────────────────────────────
// Blabbing (B4B) "Daily Pulse" email → normalized Content OS signal
//
// Reality (as of 2026-06): B4B sends ONE email per topic (~10/day), from
//   notifications@appuser.io, subject "Daily Pulse: <topic>". Today the body
//   carries only the topic + a 1-paragraph teaser. B4B will be enriched to
//   include the full analysis + sentiment + the 8-emotion Pulse breakdown
//   (see docs/blabbing-ingestion-contract.md).
//
// This parser is built against the FULL contract and degrades gracefully:
//   1. Preferred:  an embedded  <!--B4B_SIGNAL_V1 {json} /B4B_SIGNAL_V1-->  block.
//   2. Fallback:   labeled "Sentiment:" / "Emotions:" footer text.
//   3. Floor:      today's lossy email — topic from subject, summary from body.
// Missing fields stay null; nothing is invented. The moment B4B ships the
// richer email, full-fidelity signals appear with no parser change.
// ─────────────────────────────────────────────────────────────────

export const BLABBING_SENDER = 'notifications@appuser.io';
const SIGNAL_BEGIN = 'B4B_SIGNAL_V1';
const SIGNAL_END = '/B4B_SIGNAL_V1';

const EMOTION_KEYS = ['joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation'];

// ── quoted-printable decode (Content-Transfer-Encoding: quoted-printable) ──
function decodeQuotedPrintable(input) {
  return input
    .replace(/=\r?\n/g, '')                 // soft line breaks
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// ── strip HTML to readable text, preserving paragraph breaks ──
function htmlToText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')        // comments (incl. our signal block — handled separately)
    // Drop <style>/<script> CONTENTS, not just their tags. Stripping the tag alone leaves the
    // CSS behind as body text, which is how styled-components rules ended up rendered as the
    // summary on the signals page.
    .replace(/<\s*style[^>]*>[\s\S]*?<\s*\/\s*style\s*>/gi, '')
    .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*(\/p|br|\/div|\/tr)\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#36;|&dollar;/g, '$').replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── split a raw .eml into { headers, body } ──
function splitEml(raw) {
  const idx = raw.search(/\r?\n\r?\n/);
  if (idx === -1) return { headerBlock: '', body: raw };
  return { headerBlock: raw.slice(0, idx), body: raw.slice(idx).replace(/^\r?\n\r?\n/, '') };
}

function getHeader(headerBlock, name) {
  // RFC822 folded headers: continuation lines begin with whitespace
  const re = new RegExp(`^${name}:\\s*((?:.*(?:\\r?\\n[ \\t].*)*))`, 'im');
  const m = headerBlock.match(re);
  return m ? m[1].replace(/\r?\n[ \t]+/g, ' ').trim() : null;
}

// ── try the embedded JSON block ──
function extractSignalBlock(decodedBody) {
  const start = decodedBody.indexOf(SIGNAL_BEGIN);
  if (start === -1) return null;
  const end = decodedBody.indexOf(SIGNAL_END, start);
  if (end === -1) return null;
  const json = decodedBody.slice(start + SIGNAL_BEGIN.length, end).trim();
  try { return JSON.parse(json); } catch { return null; }
}

// ── fallback: labeled footer ──
// Handles BOTH shapes seen in the wild:
//   A. one line   "Sentiment: Positive" + "Emotions: joy 80, trust 72, ..."   (the contract)
//   B. per-line   "Sentiment: 1" then "Joy: 1" / "Trust: 1" / "Disgust: 0.38" (what B4B
//      actually sends as of 2026-08-06 — numeric sentiment, one emotion per line, 0–1 scale)
// Everything is normalised to 0–100 internally so deriveContentSignal's thresholds hold.
function normaliseEmotionValue(raw) {
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return null;
  // 0–1 decimal scale → percent. Anything above 1 is already on a 0–100 scale.
  return Math.max(0, Math.min(100, n <= 1 ? Math.round(n * 100) : Math.round(n)));
}

function extractLabeledMetrics(text) {
  const out = {};

  // Sentiment: word form (contract) or numeric form (current B4B).
  const sentWord = text.match(/Sentiment:\s*(Positive|Neutral|Negative)/i);
  if (sentWord) {
    out.sentiment = sentWord[1][0].toUpperCase() + sentWord[1].slice(1).toLowerCase();
  } else {
    const sentNum = text.match(/Sentiment:\s*(-?\d*\.?\d+)/i);
    if (sentNum) {
      const v = parseFloat(sentNum[1]);
      out.sentimentRaw = v;
      // -1..1 signed scale is the only one that can express direction. A 0..1 scale
      // cannot, so record it and let the caller flag it rather than guessing polarity.
      if (v < 0) out.sentiment = 'Negative';
      else if (v > 0.66) out.sentiment = 'Positive';
      else if (v > 0.33) out.sentiment = 'Neutral';
      else out.sentiment = 'Negative';
    }
  }

  const emotions = {};

  // Shape A: a single "Emotions: joy 80, trust 72" line.
  const emoLine = text.match(/Emotions?:\s*([^\n]+)/i);
  if (emoLine) {
    for (const [, k, v] of emoLine[1].matchAll(/([a-z]+)\s*[:=]?\s*(\d*\.?\d+)/gi)) {
      const key = k.toLowerCase();
      if (EMOTION_KEYS.includes(key)) {
        const val = normaliseEmotionValue(v);
        if (val !== null) emotions[key] = val;
      }
    }
  }

  // Shape B: one emotion per line, e.g. "Joy: 1" / "Disgust: 0.38".
  for (const key of EMOTION_KEYS) {
    if (emotions[key] !== undefined) continue;
    const m = text.match(new RegExp(`^\\s*${key}\\s*:\\s*(-?\\d*\\.?\\d+)\\s*$`, 'im'));
    if (m) {
      const val = normaliseEmotionValue(m[1]);
      if (val !== null) emotions[key] = val;
    }
  }

  if (Object.keys(emotions).length) {
    out.emotions = emotions;
    // Saturation check. If most emotions sit at the ceiling there is no dominant
    // emotion, and any archetype derived from them is arbitrary. Flag rather than
    // silently classify — this is the current state of the B4B feed.
    const vals = Object.values(emotions);
    const maxed = vals.filter((v) => v >= 95).length;
    if (vals.length >= 4 && maxed / vals.length >= 0.5) {
      out.emotionsSaturated = true;
    }
  }

  return Object.keys(out).length ? out : null;
}

function slugify(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

// ─────────────────────────────────────────────────────────────────
// Public: parse a raw .eml string (or an object with {subject, html, date, messageId})
// Returns a normalized signal, or null if it isn't a Blabbing email.
// ─────────────────────────────────────────────────────────────────
export function parseBlabbingEmail(input) {
  let subject, html, dateRaw, messageId, fromRaw, cte = '';

  if (typeof input === 'string') {
    const { headerBlock, body } = splitEml(input);
    subject = getHeader(headerBlock, 'Subject');
    dateRaw = getHeader(headerBlock, 'Date');
    messageId = getHeader(headerBlock, 'Message-Id');
    fromRaw = getHeader(headerBlock, 'From');
    cte = (getHeader(headerBlock, 'Content-Transfer-Encoding') || '').toLowerCase();
    html = body;
  } else {
    ({ subject, html, date: dateRaw, messageId, from: fromRaw } = input);
    cte = (input.contentTransferEncoding || '').toLowerCase();
  }

  const decoded = cte.includes('quoted-printable') ? decodeQuotedPrintable(html || '') : (html || '');

  // Identify the email. Accept by sender OR the "Daily Pulse" subject so a
  // forwarded/relabeled copy still parses.
  const looksLikeBlabbing =
    (fromRaw && fromRaw.includes(BLABBING_SENDER)) ||
    (subject && /daily pulse/i.test(subject));
  if (!looksLikeBlabbing) return null;

  // Topic: subject after "Daily Pulse:" is the canonical source.
  const topic = subject
    ? subject.replace(/^.*?daily pulse:\s*/i, '').trim()
    : null;

  // 1) Preferred: embedded JSON block.
  const block = extractSignalBlock(decoded);

  // Body text (used for fallback summary + labeled metrics).
  const text = htmlToText(decoded);
  const labeled = extractLabeledMetrics(text);

  // Summary fallback: the analytical paragraph that sits between the topic line
  // and the "Thanks, Blabbing Team" sign-off in today's email.
  let bodySummary = null;
  if (text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const stop = lines.findIndex(l => /thanks,?\s*blabbing/i.test(l));
    const candidates = (stop === -1 ? lines : lines.slice(0, stop))
      .filter(l => l.length > 120 && !/^(hi\b|below is your daily pulse)/i.test(l));
    bodySummary = candidates.sort((a, b) => b.length - a.length)[0] || null;
  }

  const generatedAt = block?.generatedAt || parseDate(dateRaw);
  const dateKey = (generatedAt || '').slice(0, 10) || null;

  return finalizeSignal({
    schema: 'b4b.signal/1',
    source: 'email',
    sourceMessageId: messageId || null,         // dedup key from the email
    id: block?.id || (dateKey && topic ? `b4b_${dateKey}_${slugify(topic)}` : null),
    topic: block?.topic || topic,
    generatedAt: generatedAt || null,
    dateKey,
    sentiment: block?.sentiment || labeled?.sentiment || null,
    emotions: normalizeEmotions(block?.emotions || labeled?.emotions),
    summary: block?.summary || bodySummary || null,
    analysis: block?.analysis || null,
    viewUrl: block?.viewUrl || null,
  });
}

// ─────────────────────────────────────────────────────────────────
// Public: normalize a direct contract JSON payload (B4B webhook, Option 2 in
// docs/blabbing-ingestion-contract.md) into the same shape parseBlabbingEmail
// produces. Returns null if it isn't a usable payload.
// ─────────────────────────────────────────────────────────────────
export function normalizeContractPayload(p, { source = 'webhook' } = {}) {
  if (!p || !p.topic) return null;
  const generatedAt = p.generatedAt || null;
  const dateKey = (generatedAt || '').slice(0, 10) || null;
  return finalizeSignal({
    schema: 'b4b.signal/1',
    source,
    sourceMessageId: p.id || null,              // contract id is the dedup key here
    id: p.id || (dateKey && p.topic ? `b4b_${dateKey}_${slugify(p.topic)}` : null),
    topic: p.topic,
    generatedAt,
    dateKey,
    sentiment: p.sentiment || null,
    emotions: normalizeEmotions(p.emotions),
    summary: p.summary || null,
    analysis: p.analysis || null,
    viewUrl: p.viewUrl || null,
  });
}

// Attach derived content-brain signal + enrichment flags. Never invents fields.
function finalizeSignal(signal) {
  signal.derived = deriveContentSignal(signal);
  signal.missing = [
    !signal.analysis && 'analysis',
    !signal.sentiment && 'sentiment',
    !signal.emotions && 'emotions',
  ].filter(Boolean);
  signal.needsEnrichment = signal.missing.length > 0;
  return signal;
}

function parseDate(dateRaw) {
  if (!dateRaw) return null;
  const d = new Date(dateRaw);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function normalizeEmotions(e) {
  if (!e || typeof e !== 'object') return null;
  const out = {};
  let any = false;
  for (const k of EMOTION_KEYS) {
    if (typeof e[k] === 'number') { out[k] = Math.max(0, Math.min(100, Math.round(e[k]))); any = true; }
  }
  return any ? out : null;
}

// ─────────────────────────────────────────────────────────────────
// Map B4B output → Content OS signal archetype × intensity.
//   Archetypes (lib/constants.js SENTIMENT_TYPES):
//     fr = Rising frustration | em = Emerging signal
//     po = Accelerating positive | co = Shifting consensus
//   Intensity 1–3 (INTENSITY_LABELS): subtle / moderate / peak.
// Heuristic + tunable. `confidence` reflects how much data we had.
// ─────────────────────────────────────────────────────────────────
export function deriveContentSignal({ emotions, sentiment, emotionsSaturated }) {
  // Saturated feed: six of eight emotions at the ceiling means there is no dominant
  // emotion, so any archetype picked from them is arbitrary. Say so instead of
  // manufacturing confidence. Fix is upstream — see docs/blabbing-ingestion-contract.md.
  if (emotionsSaturated) {
    return {
      type: 'co', intensity: 1, confidence: 'unusable', basis: 'emotions-saturated',
      note: 'Emotion scores are saturated (most at max), so no dominant emotion exists. ' +
            'Archetype is a placeholder. B4B needs to emit discriminating scores.',
    };
  }
  if (emotions) {
    const e = emotions;
    const positive = (e.joy || 0) + (e.trust || 0) + (e.anticipation || 0);
    const negative = (e.anger || 0) + (e.disgust || 0) + (e.fear || 0) + (e.sadness || 0);
    const peak = Math.max(...EMOTION_KEYS.map(k => e[k] || 0));

    let type;
    if ((e.anger || 0) + (e.disgust || 0) > positive * 0.6 && negative >= positive) {
      type = 'fr';                               // anger/disgust-led → rising frustration
    } else if ((e.surprise || 0) >= 45 && (e.surprise || 0) >= (e.joy || 0)) {
      type = 'em';                               // surprise-led novelty outweighs settled optimism → emerging signal
    } else if (positive > negative * 1.4) {
      type = 'po';                               // optimism-led → accelerating positive
    } else {
      type = 'co';                               // balanced/mixed → shifting consensus
    }
    const intensity = peak >= 70 ? 3 : peak >= 45 ? 2 : 1;
    return { type, intensity, confidence: 'high', basis: 'emotions' };
  }

  if (sentiment) {
    const map = { Positive: 'po', Negative: 'fr', Neutral: 'co' };
    return { type: map[sentiment] || 'co', intensity: 2, confidence: 'medium', basis: 'sentiment' };
  }

  // Floor: no sentiment, no emotions (today's lossy email). Treat as an emerging
  // signal at low intensity until B4B enriches the feed.
  return { type: 'em', intensity: 1, confidence: 'low', basis: 'none' };
}
