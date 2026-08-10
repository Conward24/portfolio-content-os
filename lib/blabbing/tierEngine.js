/**
 * tierEngine.js — Calm · Watch · Act · Crisis, computed from OUR OWN accumulated history.
 *
 * The key insight (Michael's, and it corrects an earlier assumption of mine): the daily
 * pulse does not need to carry a baseline, because we receive one reading per topic per day
 * and signalStore already keeps 60 days of it. The baseline is something we build, not
 * something B4B has to send.
 *
 * WHAT THAT MAKES COMPUTABLE TODAY, from sentiment + the 8 emotions alone:
 *   sentShift  — today's sentiment vs our rolling mean
 *   sentDir    — sign of that move
 *   accel      — is today's deviation larger than yesterday's
 *   arousal    — intensity of the dominant emotion
 *
 * WHAT IS STILL MISSING, and cannot be derived from a daily scalar:
 *   volZ       — volume deviation. The email carries no mention count.
 *   breadth    — distinct credible sources. The email carries no source list.
 *   activity   — absolute volume, which the spec uses as the noise floor.
 *
 * Consequence, stated plainly rather than papered over: the CRISIS and ACT gates in the
 * spec both require `breadth`, so they cannot fire correctly yet. But the WATCH gate's
 * `accel >= A_HIGH` branch — which the spec itself calls "the single most important line
 * for the 'before it goes mainstream' promise" — needs only sentiment over time. That is
 * live today.
 *
 * So this ships as a genuine early-warning layer with its top two tiers degraded, and it
 * says which ones are degraded rather than inventing the inputs.
 */

// signalStore is imported lazily inside tierForTopic so the pure scoring maths stays
// testable (and importable) without a Redis connection.

export const CONFIG = {
  CRISIS_SCORE: 9,
  ACT_SCORE: 7,
  WATCH_SCORE: 4,
  S_MED: 0.4,
  S_HIGH: 0.6,
  B_MED: 0.4,
  B_HIGH: 0.6,
  A_HIGH: 0.6,
  BASELINE_MIN: 14,        // days of history before anything scores
  DEESCALATE_HOLD: 2,      // days a lower tier must hold before dropping
};

export const TIERS = ['CALIBRATING', 'CALM', 'WATCH', 'ACT', 'CRISIS'];
const rank = (t) => TIERS.indexOf(t);

const EMOTIONS = ['joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation'];
const NEGATIVE = ['fear', 'sadness', 'disgust', 'anger'];

/**
 * Arousal weights per the Signal Strength spec §3: "anger/fear/outrage high,
 * anticipation/surprise mid, trust/contentment low". Arousal is about which emotion
 * dominates, not how loud the loudest number is — a calm negative shift matters less
 * than a fearful one, so intensity alone is the wrong measure.
 */
const AROUSAL_WEIGHT = {
  anger: 1.0, fear: 1.0, disgust: 0.9, sadness: 0.7,
  surprise: 0.6, anticipation: 0.5, joy: 0.4, trust: 0.3,
};

/**
 * Component weights, Signal Strength spec §2. Volume (30%) and Breadth (15%) require
 * per-day mention counts and distinct-source counts, which the Daily Pulse email does not
 * carry — the spec itself flags this at §5 as "the one small build item — flag to Jelani".
 * Until B4B emits them, we score on the 55% that IS derivable and renormalise so the
 * output still spans 1–10, labelled `partial` so nobody reads it as the full score.
 */
export const WEIGHTS = { volume: 0.30, sentiment: 0.30, arousal: 0.15, breadth: 0.15, accel: 0.10 };
export const DERIVABLE = ['sentiment', 'arousal', 'accel'];
export const AWAITING_FEED = ['volume', 'breadth'];

const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const stdev = (a) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(mean(a.map((v) => (v - m) ** 2)));
};

/** Sentiment as a signed scalar. Accepts the numeric field or the word form. */
function sentimentScalar(sig) {
  if (typeof sig?.sentimentRaw === 'number') {
    const v = sig.sentimentRaw;
    // A 0..1 feed cannot express direction; map to 0..1 and let emotions carry polarity.
    return v >= -1 && v <= 1 ? v : Math.max(-1, Math.min(1, v / 100));
  }
  const word = { Positive: 1, Neutral: 0, Negative: -1 };
  if (sig?.sentiment in word) return word[sig.sentiment];
  return null;
}

/** Net emotional polarity, used when the sentiment field carries no sign. */
function emotionPolarity(emotions) {
  if (!emotions) return null;
  const pos = (emotions.joy || 0) + (emotions.trust || 0) + (emotions.anticipation || 0);
  const neg = NEGATIVE.reduce((s, k) => s + (emotions[k] || 0), 0);
  const total = pos + neg;
  return total ? (pos - neg) / total : 0;   // −1 … +1
}

/**
 * Does the emotion channel actually vary, or is it pinned?
 * This answers empirically what a single email cannot: whether the saturated 1.0 readings
 * are a real "today is intense" signal or a constant. If an emotion never moves across the
 * window it carries no information and should be excluded from scoring.
 */
export function emotionVariance(history) {
  const report = {};
  for (const k of EMOTIONS) {
    const series = history.map((h) => h?.emotions?.[k]).filter((v) => typeof v === 'number');
    report[k] = {
      n: series.length,
      sd: Number(stdev(series).toFixed(2)),
      min: series.length ? Math.min(...series) : null,
      max: series.length ? Math.max(...series) : null,
      informative: stdev(series) > 1,        // moves at all on a 0–100 scale
    };
  }
  const live = Object.values(report).filter((r) => r.informative).length;
  return {
    perEmotion: report,
    informativeCount: live,
    verdict: history.length < 7
      ? 'too-early — need ~7 days before judging whether the emotion channel moves'
      : live === 0
        ? 'DEAD — no emotion varies across the window. Exclude emotions from scoring and tell Jelani.'
        : live <= 2
          ? 'WEAK — only a couple of emotions move; treat archetype derivation as low confidence'
          : 'OK — emotions discriminate',
  };
}

/**
 * Compute the tier for a topic from its own accumulated history.
 * `history` is oldest→newest, as signalStore returns it. Today's reading is the last entry.
 */
export function computeTier(history, opts = {}) {
  const cfg = { ...CONFIG, ...opts };
  const unavailable = ['volZ', 'breadth', 'activity'];

  if (!history?.length) {
    return { tier: 'CALIBRATING', direction: null, reason: 'no history', unavailable };
  }
  if (history.length < cfg.BASELINE_MIN) {
    return {
      tier: 'CALIBRATING',
      direction: null,
      daysOfHistory: history.length,
      daysNeeded: cfg.BASELINE_MIN - history.length,
      reason: `baseline needs ${cfg.BASELINE_MIN} days; have ${history.length}`,
      unavailable,
    };
  }

  const today = history[history.length - 1];
  const prior = history.slice(0, -1);

  // Build the series from whichever signed channel exists.
  const series = prior.map((h) => {
    const s = sentimentScalar(h);
    return s === null ? emotionPolarity(h?.emotions) : s;
  }).filter((v) => typeof v === 'number');

  const todayVal = sentimentScalar(today) ?? emotionPolarity(today?.emotions);
  if (todayVal === null || series.length < 2) {
    return { tier: 'CALIBRATING', direction: null, reason: 'no usable sentiment series', unavailable };
  }

  const base = mean(series);
  const sd = stdev(series) || 0.0001;

  // Deviation in standard deviations, squashed to 0–1 for the spec's thresholds.
  const zRaw = (todayVal - base) / sd;
  const sentShift = Math.min(1, Math.abs(zRaw) / 3);
  const sentDir = zRaw < 0 ? -1 : 1;

  // Acceleration: is today's deviation larger than yesterday's?
  const yVal = series[series.length - 1];
  const yShift = Math.min(1, Math.abs((yVal - mean(series.slice(0, -1))) / (stdev(series.slice(0, -1)) || 0.0001)) / 3);
  const accel = Math.min(1, Math.max(0, sentShift - yShift) * 2);

  // Arousal, spec §3: arousal_weight(dominant emotion) × its intensity. The dominant
  // emotion is the one with the highest weighted contribution, so a topic pinned by fear
  // scores higher than one pinned by trust at the same raw level.
  const emo = today?.emotions || {};
  let dominant = null, arousal = 0;
  for (const k of EMOTIONS) {
    const contribution = ((emo[k] || 0) / 100) * (AROUSAL_WEIGHT[k] ?? 0.5);
    if (contribution > arousal) { arousal = contribution; dominant = k; }
  }

  // ── Signal Strength Score, spec §3, over the derivable components only ──
  const availableWeight = DERIVABLE.reduce((s, k) => s + WEIGHTS[k], 0);   // 0.55
  const raw =
    (WEIGHTS.sentiment * sentShift + WEIGHTS.arousal * arousal + WEIGHTS.accel * accel)
    / availableWeight;                                                      // renormalised to 0–1
  const score = Math.round(1 + 9 * Math.max(0, Math.min(1, raw)));

  const components = {
    sentShift: Number(sentShift.toFixed(3)),
    sentDir,
    accel: Number(accel.toFixed(3)),
    arousal: Number(arousal.toFixed(3)),
    dominantEmotion: dominant,
    baseline: Number(base.toFixed(3)),
    today: Number(todayVal.toFixed(3)),
    daysOfHistory: history.length,
  };

  // Decomposition is the trust mechanic (spec §7: never show the score without its
  // drivers reachable). Contributions are of the renormalised total.
  const decomposition = {
    sentimentShift: Number(((WEIGHTS.sentiment * sentShift) / availableWeight).toFixed(3)),
    emotionalArousal: Number(((WEIGHTS.arousal * arousal) / availableWeight).toFixed(3)),
    acceleration: Number(((WEIGHTS.accel * accel) / availableWeight).toFixed(3)),
    volumeDeviation: null,
    sourceBreadth: null,
  };

  const band = score >= 9 ? 'Critical' : score >= 7 ? 'Strong signal' : score >= 4 ? 'Movement' : 'Baseline';

  // ── Tier waterfall, spec §4. Score bands now work because we have a partial score;
  //    the breadth-gated OR-branches stay disabled and say so. ──
  const notes = [];
  let tier = 'CALM';

  if (score >= cfg.CRISIS_SCORE && sentDir < 0) {
    tier = 'CRISIS';
    notes.push('CRISIS on score band. Breadth unverified, so confirm before acting.');
  } else if (score >= cfg.ACT_SCORE) {
    tier = 'ACT';
    notes.push(sentDir < 0 ? 'ACT ▼ on score band.' : 'ACT ▲ — opportunity, not crisis.');
  } else if (score >= cfg.WATCH_SCORE || accel >= cfg.A_HIGH ||
             (sentShift >= cfg.S_MED && arousal >= 0.5)) {
    tier = 'WATCH';
    if (accel >= cfg.A_HIGH) {
      notes.push('WATCH via the acceleration branch — the early-warning line, and fully ' +
                 'computable from daily sentiment alone. This is the "before it goes ' +
                 'mainstream" catch.');
    }
  }

  // Crisis is negative-only by design (Tier spec §1): good news never labels as crisis.
  if (tier === 'CRISIS' && sentDir > 0) { tier = 'ACT'; notes.push('Positive move capped at ACT ▲.'); }

  notes.push('Score omits Volume Deviation (30%) and Source Breadth (15%) — not in the ' +
             'feed. Renormalised over the remaining 55%. Treat as directional, not final.');

  return {
    tier,
    direction: sentDir < 0 ? '▼' : '▲',
    score,
    band,
    components,
    decomposition,
    unavailable,
    notes,
    confidence: 'partial',
    scoredOnWeight: availableWeight,
  };
}

/** Escalate immediately, de-escalate slowly. Prevents day-to-day flip-flopping. */
export function applyHysteresis(candidate, currentTier, lowStreak = 0, hold = CONFIG.DEESCALATE_HOLD) {
  if (!currentTier) return { tier: candidate, lowStreak: 0 };
  if (rank(candidate) > rank(currentTier)) return { tier: candidate, lowStreak: 0 };
  if (rank(candidate) < rank(currentTier)) {
    const n = lowStreak + 1;
    return n >= hold ? { tier: candidate, lowStreak: 0 } : { tier: currentTier, lowStreak: n };
  }
  return { tier: currentTier, lowStreak: 0 };
}

/** Convenience: tier a topic straight from the store. */
export async function tierForTopic(topic) {
  const { getTopicHistory, topicSlug } = await import('./signalStore.js');
  const slug = topicSlug(topic);
  const history = await getTopicHistory(slug);
  return { slug, ...computeTier(history), emotionHealth: emotionVariance(history) };
}

export default computeTier;
