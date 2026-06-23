// ─────────────────────────────────────────────────────────────────
// Presentational helpers — turn a normalized Blabbing signal's `derived`
// field into human-readable "why we suggested this" copy for the UI.
// Pure functions; safe to import in React pages.
// ─────────────────────────────────────────────────────────────────

import { SENTIMENT_TYPES, INTENSITY_LABELS } from '../constants';

// Top N emotions by score, e.g. [{ name: 'Anger', value: 70 }, ...]
export function topEmotions(emotions, n = 3) {
  if (!emotions) return [];
  return Object.entries(emotions)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => ({ name: k[0].toUpperCase() + k.slice(1), value: v }));
}

// One-line trend label for momentum, e.g. "Rising (+1 vs Jun 21)".
export function describeMomentum(momentum) {
  if (!momentum) return null;
  const { trend, deltaIntensity, priorDateKey, days } = momentum;
  const when = priorDateKey
    ? new Date(priorDateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;
  switch (trend) {
    case 'new': return 'First time this topic has appeared';
    case 'rising': return `Heating up (+${deltaIntensity} intensity vs ${when})`;
    case 'cooling': return `Cooling (${deltaIntensity} intensity vs ${when})`;
    case 'shifting': return `Mood shifted from ${SENTIMENT_TYPES[momentum.priorType]?.name || momentum.priorType} (${when})`;
    case 'flat': return `Steady${days ? ` over ${days}d` : ''}`;
    default: return null;
  }
}

// The "why we pre-selected this archetype × intensity" explanation.
// Returns { archetype, intensityLabel, reason, confidence }.
export function explainSuggestion(signal) {
  const d = signal?.derived;
  if (!d) return null;
  const archetype = SENTIMENT_TYPES[d.type]?.name || d.type;
  const intensityLabel = INTENSITY_LABELS[d.intensity] || `level ${d.intensity}`;

  let reason;
  if (d.basis === 'emotions') {
    const tops = topEmotions(signal.emotions, 2).map(e => `${e.name} ${e.value}`).join(' + ');
    reason = `From the Pulse breakdown (${tops}).`;
  } else if (d.basis === 'sentiment') {
    reason = `From B4B's sentiment label (${signal.sentiment}) — no emotion breakdown in this signal yet.`;
  } else {
    reason = `No sentiment or emotion data in this signal — this is a best guess. Pick the direction yourself.`;
  }

  return { archetype, intensityLabel, reason, confidence: d.confidence };
}
