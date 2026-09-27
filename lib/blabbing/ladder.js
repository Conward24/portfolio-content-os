// ─────────────────────────────────────────────────────────────────
// The conversation ladder: when does a story stop being news and become a
// conversation worth posting about?
//
// Backtested 2026-09-27 on 930 Daily Pulse emails (15 topics, Jun 20 to Sep 27):
// of 505 new names that entered a topic's pulse, 83% appeared once and never came
// back. Names that showed up in 3 of their first 5 pulses were about 20x more likely
// to still be there two weeks later (23% vs 1%). Small sample (13), so "conversation"
// means worth your attention, not guaranteed to last.
//
// Stages, per named thing inside a topic:
//   mention      first appearance, nothing more yet        → log it, don't post
//   repeat       2 of its first 5 pulses                    → watch it
//   conversation 3+ of its first 5 pulses                   → check sources, draft
//   still-going  crossed, 2+ weeks on, in 2 of the last 3   → best time for a point of view
//   went-quiet   crossed, but absent from the last 3 pulses → only with a dated hook
// Plus dated hooks: sentences in the latest pulses that name a date still ahead.
// ─────────────────────────────────────────────────────────────────

const STOP = new Set(`The This These That Those However Furthermore Additionally Moreover Meanwhile While As In On At For By With From Many Some Recent Recently Overall Despite Although Key Several Both Other Its It A An And Or Of To Also Such Most More Others Each Every Major Effective Practical Successful Traditional Generative Responsible Strategic Its Their There Here When Where What Which Who Why How Despite Following According Currently Similarly Likewise Notably Ultimately Consequently Organizations Companies Firms Employers States Experts Studies Research Data January February March April May June July August September October November December Monday Tuesday Wednesday Thursday Friday Saturday Sunday AI Artificial Intelligence United States U.S. US America American Federal State Congress Medicaid Medicare Health Healthcare`.split(/\s+/));
const MONTH_NAMES = new Set('January February March April May June July August September October November December'.split(' '));
const GENERIC = new Set('PHI BAA BAAs EPDS PHQ-9 HIPAA CHW CHWs ROI HR IT CEO CEOs FAQ FAQs LLM LLMs GenAI API APIs EHR EHRs SaaS KPI KPIs'.split(' '));
const GENERIC_SUFFIX = /-(related|driven|powered|based|native|assisted|enabled|first|led)$/i;

const ENTITY = /\b(?:[A-Z][a-zA-Z0-9&'.\-]+(?:\s+(?:of|for|and|the|on|&|de)\s+|\s+)){1,6}[A-Z][a-zA-Z0-9&'.\-]+\b|\b[A-Z]{2,}[\-\d]*[A-Za-z\d]*\b|\b[A-Z][a-z]+[A-Z][A-Za-z]+\b|\b[A-Z][a-z]{3,}\b/g;

export function extractEntities(text) {
  const out = new Map(); // entity → sentence it appeared in
  const sentences = (text || '').split(/(?<=[.!?])\s+/);
  for (const s of sentences) {
    for (const m of s.matchAll(ENTITY)) {
      let words = m[0].replace(/[.'’]+$/, '').split(/\s+/);
      while (words.length && (STOP.has(words[0]) || /^(of|for|and|the|on|de|&)$/.test(words[0]))) words = words.slice(1);
      if (words.length === 1 && MONTH_NAMES.has(words[0])) continue;
      const e = words.join(' ');
      if (e.length < 4 || STOP.has(e) || GENERIC.has(e) || GENERIC_SUFFIX.test(e)) continue;
      if (/^[A-Z]{2,}s$/.test(e) || /'s$/.test(e)) continue;
      // a lone capitalized word at the very start of a sentence is just grammar
      if (!/\s/.test(e) && m.index === 0 && !/[A-Z].*[A-Z]/.test(e)) continue;
      if (!out.has(e)) out.set(e, s.trim());
    }
  }
  // keep the longest form when one entity is a prefix of another ("Menopausal Workers' Fairness Act" vs "Menopausal Workers")
  const keys = [...out.keys()];
  for (const k of keys) if (keys.some(o => o !== k && o.includes(k) && o.length > k.length + 2)) out.delete(k);
  return out;
}

// Which brand a topic feeds. Topics are Michael's own B4B topics; unknown ones go to Blabbing.
export function brandFor(topic) {
  const t = (topic || '').toLowerCase();
  if (/(maternal|doula|perinatal|postpartum|menopause|midlife|women's health|family formation|health worker|healthcare|hipaa|medicaid)/.test(t)) return 'mylua';
  if (/(enterprise ai|consulting|agency firms|upskilling|learning & development|human resources|pilot projects)/.test(t)) return 'henway';
  return 'blabbing';
}

const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];
const HOOK_WORDS = /(effective|take effect|takes effect|deadline|mandatory|become mandatory|begin|begins|start|starts|launch|expand|delayed|vote|comment period|due|goes into effect|will require|plans to|scheduled|expected)/i;
const DATE_RX = /\b(?:(January|February|March|April|May|June|July|August|September|October|November|December)\s+(?:(\d{1,2}),?\s+)?)?(20\d\d)\b/g;

// Sentences in the latest pulses that name a date still ahead of `today`.
export function extractHooks(history, today) {
  const recent = history.slice(-3);
  const seen = new Set();
  const hooks = [];
  for (const p of recent) {
    for (const s of p.text.split(/(?<=[.!?])\s+/)) {
      if (!HOOK_WORDS.test(s)) continue;
      for (const m of s.matchAll(DATE_RX)) {
        const year = +m[3];
        const month = m[1] ? MONTHS.indexOf(m[1].toLowerCase()) + 1 : 1;
        const day = m[2] ? +m[2] : 1;
        const when = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const precision = m[2] ? 'day' : m[1] ? 'month' : 'year';
        if (when <= today) continue;
        const key = s.slice(0, 80);
        if (seen.has(key)) continue;
        seen.add(key);
        hooks.push({ when, precision, sentence: s.trim(), pulseDate: p.date });
      }
    }
  }
  return hooks.sort((a, b) => a.when.localeCompare(b.when));
}

// Stage every named thing in one topic's history.
export function analyzeTopic(history) {
  const n = history.length;
  if (n < 4) return [];
  const E = history.map(p => extractEntities(p.text));
  const baseline = new Set();
  for (let i = 0; i < 3; i++) for (const e of E[i].keys()) baseline.add(e);

  const firstSeen = new Map();
  E.forEach((es, i) => { for (const e of es.keys()) if (!baseline.has(e) && !firstSeen.has(e)) firstSeen.set(e, i); });

  const items = [];
  for (const [e, i] of firstSeen) {
    const present = [];
    for (let j = i; j < n; j++) if (E[j].has(e)) present.push(j);
    const k5 = present.filter(j => j < i + 5).length;
    const age = n - i;                       // pulses since it entered, including that one
    const lastSeen = present[present.length - 1];
    const recent7 = present.filter(j => j >= n - 7).length;
    const crossed = k5 >= 3;

    let stage = null;
    if (lastSeen < n - 3) {
      // gone from the last 3 pulses: only worth showing if it had been a real conversation, recently
      if ((crossed || present.length >= 5) && lastSeen >= n - 8) stage = 'went-quiet';
    } else if (age <= 10) {
      if (crossed) stage = 'conversation';
      else if (age <= 5) stage = k5 === 2 ? 'repeat' : (age <= 2 ? 'mention' : null);
    } else if ((crossed || present.length >= 4) && recent7 >= 2) {
      stage = 'still-going';
    }
    if (!stage) continue;

    items.push({
      entity: e,
      stage,
      firstSeen: history[i].date,
      lastSeen: history[lastSeen].date,
      firstFive: k5,
      appearances: present.length,
      since: age,
      context: E[lastSeen].get(e),
      // presence over the last 14 pulses, oldest first, for the dot strip
      strip: history.slice(-14).map((p, idx) => ({ date: p.date, on: E[n - Math.min(14, n) + idx].has(e) })),
    });
  }
  return items;
}

const STAGE_ORDER = { conversation: 0, 'still-going': 1, repeat: 2, mention: 3, 'went-quiet': 4 };

// The whole board: every topic that has pulsed in the last `activeDays` days.
export function buildBoard(histories, { today, activeDays = 3, checked = {} } = {}) {
  const cutoff = new Date(Date.parse(today) - activeDays * 86400000).toISOString().slice(0, 10);
  const topics = [];
  for (const { slug, topic, history } of histories) {
    if (!history.length || history[history.length - 1].date < cutoff) continue;
    const latest = history[history.length - 1];
    const items = analyzeTopic(history)
      .map(it => ({ ...it, key: `${slug}|${it.entity}`, checked: !!checked[`${slug}|${it.entity}`] }))
      .sort((a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage] || b.appearances - a.appearances);
    topics.push({
      slug, topic, brand: brandFor(topic),
      pulses: history.length, from: history[0].date, latestDate: latest.date,
      latest: { text: latest.text, scores: latest.scores },
      items,
      hooks: extractHooks(history, today),
    });
  }
  const count = s => topics.reduce((a, t) => a + t.items.filter(i => i.stage === s).length, 0);
  return {
    today,
    summary: {
      topics: topics.length,
      conversation: count('conversation'),
      stillGoing: count('still-going'),
      watch: count('repeat') + count('mention'),
      wentQuiet: count('went-quiet'),
      hooks: topics.reduce((a, t) => a + t.hooks.length, 0),
    },
    topics,
  };
}
