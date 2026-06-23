import React from 'react';
import { tokensFor, SENTIMENT_PILL } from '../brandTokens';

// ─────────────────────────────────────────────────────────────────
// TEMPLATE ENGINE (Satori / @vercel/og)
// Flexbox-only. Every node is a flex container per Satori's rules.
// render.js resolves logos into data URIs and passes them in `data`.
// ─────────────────────────────────────────────────────────────────

const h = React.createElement;

// Layout helpers — everything is display:flex (Satori requirement)
const col = (style, children) =>
  h('div', { style: { display: 'flex', flexDirection: 'column', ...style } }, children);
const row = (style, children) =>
  h('div', { style: { display: 'flex', flexDirection: 'row', ...style } }, children);
const text = (style, content) =>
  h('div', { style: { display: 'flex', ...style } }, content);

function logoOrWordmark(data, { color, font, size = 30 }) {
  if (data.logoDataUri) {
    return h('img', { src: data.logoDataUri, height: size, style: { objectFit: 'contain' } });
  }
  return text({ fontFamily: font, fontSize: size, fontWeight: 700, color, letterSpacing: -0.5 }, data.label || '');
}

// Concentric ring motif (replaces hand-drawn lotus — pure flex, always renders)
function rings(color, base = 220) {
  const sizes = [1, 0.72, 0.46, 0.24];
  return col(
    { position: 'absolute', alignItems: 'center', justifyContent: 'center', width: base, height: base },
    sizes.map((s, i) =>
      h('div', {
        key: i,
        style: {
          position: 'absolute',
          width: base * s,
          height: base * s,
          borderRadius: base,
          border: `2px solid ${color}`,
          opacity: 0.15 + i * 0.18,
        },
      })
    )
  );
}

// ── MyLÚA ────────────────────────────────────────────────────────
function myluaStat(t, w, h2, data) {
  const stat = data.stat || '90%+';
  const statLabel = data.statLabel || 'first-trimester PPD risk accuracy';
  const headline = data.headline || 'Early validation from our pilot.';
  return col(
    { width: w, height: h2, backgroundColor: t.bg, fontFamily: t.font, padding: 84, justifyContent: 'space-between', position: 'relative' },
    [
      h('div', { key: 'bar', style: { position: 'absolute', left: 0, top: 0, width: 10, height: h2, backgroundColor: t.bgDark } }),
      h('div', { key: 'r', style: { position: 'absolute', right: -60, bottom: -60, display: 'flex' } }, rings(t.accentWarm, 360)),
      text({ key: 'k', fontSize: 17, fontWeight: 700, letterSpacing: 3, color: t.bgDark, textTransform: 'uppercase' }, 'Pilot Outcome'),
      col({ key: 'mid' }, [
        text({ fontSize: 240, fontWeight: 800, color: t.accent, lineHeight: 1, letterSpacing: -6 }, stat),
        text({ fontSize: 38, fontWeight: 500, color: t.bgDark, marginTop: 8, maxWidth: w * 0.7, lineHeight: 1.2 }, statLabel),
      ]),
      col({ key: 'foot' }, [
        h('div', { style: { width: '100%', height: 1, backgroundColor: t.hairline, marginBottom: 22 } }),
        row({ alignItems: 'center', justifyContent: 'space-between' }, [
          col({}, [
            text({ fontSize: 26, fontWeight: 700, color: t.bgDark, letterSpacing: -0.5 }, headline),
            text({ fontSize: 18, fontWeight: 400, color: t.inkSoft, marginTop: 4 }, t.website),
          ]),
          logoOrWordmark(data, { color: t.bgDark, font: t.font, size: 40 }),
        ]),
      ]),
    ]
  );
}

function myluaQuote(t, w, h2, data) {
  const quote = data.quote || 'It felt targeted to my specific needs, so I trusted the information more.';
  const attribution = data.attribution || 'Mother, Pilot User';
  const [name, ...rest] = attribution.split(',');
  return col(
    { width: w, height: h2, backgroundColor: t.bg, fontFamily: t.font, padding: 96, justifyContent: 'space-between', position: 'relative' },
    [
      text({ key: 'mark', fontSize: 200, fontWeight: 800, color: t.accentWarm, lineHeight: 0.8, height: 120 }, '“'),
      col({ key: 'q', flexGrow: 1, justifyContent: 'center' }, [
        text({ fontSize: 56, fontWeight: 600, color: t.bgDark, lineHeight: 1.28, letterSpacing: -1 }, quote),
      ]),
      col({ key: 'a' }, [
        h('div', { style: { width: 80, height: 4, backgroundColor: t.accent, marginBottom: 22 } }),
        text({ fontSize: 30, fontWeight: 700, color: t.bgDark }, name.trim()),
        text({ fontSize: 22, fontWeight: 400, color: t.inkSoft, marginTop: 2 }, rest.join(',').trim()),
        row({ marginTop: 36, alignItems: 'center', justifyContent: 'space-between' }, [
          logoOrWordmark(data, { color: t.bgDark, font: t.font, size: 34 }),
          text({ fontSize: 18, color: t.inkSoft }, t.website),
        ]),
      ]),
    ]
  );
}

function myluaAnnounce(t, w, h2, data) {
  const headline = data.headline || 'Enterprise agentic AI for perinatal care.';
  const stat = data.stat || '80%';
  const statLabel = data.statLabel || 'of maternal deaths are preventable';
  return col(
    { width: w, height: h2, backgroundColor: t.bgDark, fontFamily: t.font, padding: 88, justifyContent: 'space-between', position: 'relative' },
    [
      h('div', { key: 'r', style: { position: 'absolute', right: -80, top: -40, display: 'flex' } }, rings(t.accentWarm, 420)),
      row({ key: 'top', alignItems: 'center', justifyContent: 'space-between' }, [
        logoOrWordmark(data, { color: t.onDark, font: t.font, size: 40 }),
        text({ fontSize: 16, fontWeight: 700, letterSpacing: 2.5, color: t.accentWarm, textTransform: 'uppercase' }, data.eventLabel || 'Black Maternal Health Week'),
      ]),
      col({ key: 'mid', flexGrow: 1, justifyContent: 'center' }, [
        text({ fontSize: 60, fontWeight: 700, color: t.onDark, lineHeight: 1.18, letterSpacing: -1.5, maxWidth: w * 0.82 }, headline),
      ]),
      col({ key: 'chip' }, [
        h('div', { style: { width: '100%', height: 1, backgroundColor: 'rgba(223,172,122,0.35)', marginBottom: 26 } }),
        row({ alignItems: 'flex-end' }, [
          text({ fontSize: 120, fontWeight: 800, color: t.accentWarm, lineHeight: 0.9, letterSpacing: -4 }, stat),
          text({ fontSize: 28, fontWeight: 400, color: t.onDarkSoft, marginLeft: 28, marginBottom: 14, maxWidth: w * 0.5, lineHeight: 1.25 }, statLabel),
        ]),
      ]),
    ]
  );
}

// ── Henway ───────────────────────────────────────────────────────
function henwayStat(t, w, h2, data) {
  const stat = data.stat || '$275K';
  const statLabel = data.statLabel || 'NSF SBIR Phase I — non-dilutive, no equity';
  const headline = data.headline || 'Capital founders leave on the table.';
  return col(
    { width: w, height: h2, backgroundColor: t.bgDark, fontFamily: t.font, padding: 84, justifyContent: 'space-between' },
    [
      row({ key: 'top', alignItems: 'center', justifyContent: 'space-between' }, [
        logoOrWordmark(data, { color: t.accent, font: t.font, size: 36 }),
        text({ fontSize: 15, fontWeight: 700, letterSpacing: 3, color: t.accent, textTransform: 'uppercase' }, 'Founder Brief'),
      ]),
      col({ key: 'mid', flexGrow: 1, justifyContent: 'center' }, [
        text({ fontSize: 260, fontWeight: 800, color: t.accent, lineHeight: 0.92, letterSpacing: -8 }, stat),
        text({ fontSize: 38, fontWeight: 600, color: t.onDark, marginTop: 16, maxWidth: w * 0.78, lineHeight: 1.2, letterSpacing: -0.5 }, statLabel),
      ]),
      col({ key: 'foot' }, [
        h('div', { style: { width: 96, height: 6, backgroundColor: t.accent, marginBottom: 22 } }),
        text({ fontSize: 30, fontWeight: 700, color: t.onDark, letterSpacing: -0.5 }, headline),
        text({ fontSize: 18, color: t.onDarkSoft, marginTop: 6 }, t.website),
      ]),
    ]
  );
}

function henwayQuote(t, w, h2, data) {
  const quote = data.quote || 'Build the governance layer before you write a line of agent code.';
  const attribution = data.attribution || 'Dr. Michael Conward, Founder';
  return row(
    { width: w, height: h2, backgroundColor: t.bg, fontFamily: t.font },
    [
      h('div', { key: 'bar', style: { width: 24, height: h2, backgroundColor: t.accent } }),
      col({ key: 'body', flexGrow: 1, padding: 88, justifyContent: 'space-between' }, [
        logoOrWordmark(data, { color: t.ink, font: t.font, size: 34 }),
        text({ fontSize: 54, fontWeight: 700, color: t.ink, lineHeight: 1.25, letterSpacing: -1 }, quote),
        col({}, [
          h('div', { style: { width: 70, height: 4, backgroundColor: t.accent, marginBottom: 18 } }),
          text({ fontSize: 26, fontWeight: 600, color: t.ink }, attribution),
        ]),
      ]),
    ]
  );
}

function henwaySignal(t, w, h2, data) {
  const headline = data.headline || 'Most founders skip the governance layer.';
  const body = data.body || 'Gartner says 40% of enterprise apps will embed AI agents by end of 2026. Almost none are designing escalation logic, audit trails, or human-in-the-loop checkpoints first.';
  return col(
    { width: w, height: h2, backgroundColor: t.bgDark, fontFamily: t.font, padding: 84, justifyContent: 'space-between' },
    [
      row({ key: 'top', alignItems: 'center' }, [
        h('div', { style: { width: 14, height: 14, backgroundColor: t.accent, marginRight: 14 } }),
        text({ fontSize: 16, fontWeight: 700, letterSpacing: 3, color: t.accent, textTransform: 'uppercase' }, 'Market Signal'),
      ]),
      col({ key: 'mid', flexGrow: 1, justifyContent: 'center' }, [
        text({ fontSize: 64, fontWeight: 800, color: t.onDark, lineHeight: 1.12, letterSpacing: -1.5, maxWidth: w * 0.86 }, headline),
        text({ fontSize: 30, fontWeight: 400, color: t.onDarkSoft, marginTop: 32, lineHeight: 1.4, maxWidth: w * 0.82 }, body),
      ]),
      row({ key: 'foot', alignItems: 'center', justifyContent: 'space-between' }, [
        logoOrWordmark(data, { color: t.accent, font: t.font, size: 32 }),
        text({ fontSize: 18, color: t.onDarkSoft }, t.website),
      ]),
    ]
  );
}

// ── Blabbing ─────────────────────────────────────────────────────
function blabbingBrief(t, w, h2, data) {
  const headline = data.headline || 'Sentiment on AI-generated content is shifting from curiosity to regulatory anxiety.';
  const body = data.body || 'Detected across CRE and PR feeds this week. The conversation is moving toward compliance — early movers are already adjusting their messaging.';
  const source = data.source || 'Blabbing market intelligence · live source monitoring';
  const pill = SENTIMENT_PILL[data.sentiment] || null;
  return row(
    { width: w, height: h2, backgroundColor: t.bgDark, fontFamily: t.font },
    [
      h('div', { key: 'bar', style: { width: 16, height: h2, backgroundColor: t.accent } }),
      col({ key: 'body', flexGrow: 1, padding: 80, justifyContent: 'space-between' }, [
        row({ alignItems: 'center', justifyContent: 'space-between' }, [
          text({ fontSize: 17, fontWeight: 700, letterSpacing: 3.5, color: t.accentWarm, textTransform: 'uppercase' }, 'Intelligence Brief'),
          logoOrWordmark(data, { color: t.onDark, font: t.font, size: 28 }),
        ]),
        col({ flexGrow: 1, justifyContent: 'center' }, [
          pill
            ? row({ marginBottom: 30 }, [
                text({ fontSize: 15, fontWeight: 700, letterSpacing: 2, color: '#0a0a12', backgroundColor: pill.color, paddingTop: 8, paddingBottom: 8, paddingLeft: 18, paddingRight: 18, borderRadius: 100 }, pill.label),
              ])
            : col({}, []),
          text({ fontSize: 58, fontWeight: 700, color: t.onDark, lineHeight: 1.18, letterSpacing: -1, maxWidth: w * 0.82 }, headline),
          text({ fontSize: 28, fontWeight: 400, color: t.onDarkSoft, marginTop: 28, lineHeight: 1.42, maxWidth: w * 0.8 }, body),
        ]),
        col({}, [
          h('div', { style: { width: '100%', height: 1, backgroundColor: t.hairline, marginBottom: 20 } }),
          text({ fontSize: 18, fontWeight: 400, color: t.onDarkSoft }, source),
        ]),
      ]),
    ]
  );
}

function blabbingProof(t, w, h2, data) {
  const flagged = data.flagged || 'Blabbing flagged doula-reimbursement momentum';
  const outcome = data.outcome || 'Politico ran the story 11 days later';
  return col(
    { width: w, height: h2, backgroundColor: t.bgDark, fontFamily: t.font, padding: 88, justifyContent: 'space-between' },
    [
      text({ key: 'k', fontSize: 17, fontWeight: 700, letterSpacing: 3.5, color: t.accentWarm, textTransform: 'uppercase' }, 'Signal Proof'),
      col({ key: 'mid', flexGrow: 1, justifyContent: 'center' }, [
        row({ alignItems: 'center', marginBottom: 36 }, [
          text({ fontSize: 30, fontWeight: 800, color: '#0a0a12', backgroundColor: t.accent, width: 56, height: 56, borderRadius: 100, justifyContent: 'center', alignItems: 'center', marginRight: 26 }, '1'),
          text({ fontSize: 40, fontWeight: 600, color: t.onDark, lineHeight: 1.2, maxWidth: w * 0.72 }, flagged),
        ]),
        h('div', { style: { width: 4, height: 70, backgroundColor: t.accentWarm, marginLeft: 26, marginBottom: 36 } }),
        row({ alignItems: 'center' }, [
          text({ fontSize: 30, fontWeight: 800, color: '#0a0a12', backgroundColor: t.accentWarm, width: 56, height: 56, borderRadius: 100, justifyContent: 'center', alignItems: 'center', marginRight: 26 }, '2'),
          text({ fontSize: 40, fontWeight: 600, color: t.accentWarm, lineHeight: 1.2, maxWidth: w * 0.72 }, outcome),
        ]),
      ]),
      row({ key: 'foot', alignItems: 'center', justifyContent: 'space-between' }, [
        logoOrWordmark(data, { color: t.onDark, font: t.font, size: 30 }),
        text({ fontSize: 18, color: t.onDarkSoft }, 'Know your market before everyone else does.'),
      ]),
    ]
  );
}

// ── Mike personal ────────────────────────────────────────────────
function mikeInsight(t, w, h2, data) {
  const quote = data.quote || data.headline || 'I build AI systems that create real-world leverage.';
  const attribution = data.attribution || 'Dr. Michael Conward · AI systems architect';
  return col(
    { width: w, height: h2, backgroundColor: t.bg, fontFamily: t.font, padding: 96, justifyContent: 'space-between' },
    [
      text({ key: 'mark', fontSize: 28, fontWeight: 700, letterSpacing: 3, color: t.accent, textTransform: 'uppercase' }, 'Founder Note'),
      col({ key: 'q', flexGrow: 1, justifyContent: 'center' }, [
        text({ fontSize: 60, fontWeight: 700, color: t.ink, lineHeight: 1.25, letterSpacing: -1, maxWidth: w * 0.84 }, quote),
      ]),
      row({ key: 'a', alignItems: 'center' }, [
        data.photoDataUri
          ? h('img', { src: data.photoDataUri, width: 72, height: 72, style: { borderRadius: 100, objectFit: 'cover', marginRight: 22 } })
          : h('div', { style: { width: 72, height: 72, borderRadius: 100, backgroundColor: t.accent, marginRight: 22 } }),
        col({}, [
          h('div', { style: { width: 60, height: 3, backgroundColor: t.accentWarm, marginBottom: 12 } }),
          text({ fontSize: 26, fontWeight: 600, color: t.ink }, attribution),
        ]),
      ]),
    ]
  );
}

// ── Registry ─────────────────────────────────────────────────────
const TEMPLATES = {
  mylua:    { stat: myluaStat, quote: myluaQuote, announce: myluaAnnounce },
  henway:   { stat: henwayStat, quote: henwayQuote, signal: henwaySignal },
  blabbing: { brief: blabbingBrief, proof: blabbingProof },
  mike:     { insight: mikeInsight },
};

const TEMPLATE_META = {
  mylua: [
    { id: 'stat', label: 'Stat card', desc: 'Cream · one hero number' },
    { id: 'quote', label: 'Quote card', desc: 'Pilot user pull quote' },
    { id: 'announce', label: 'Announce', desc: 'Teal · headline + stat chip' },
  ],
  henway: [
    { id: 'stat', label: 'Stat card', desc: 'Black · yellow number' },
    { id: 'quote', label: 'Quote card', desc: 'Yellow bar pull quote' },
    { id: 'signal', label: 'Market Signal', desc: 'Black · headline + body' },
  ],
  blabbing: [
    { id: 'brief', label: 'Intelligence Brief', desc: 'Dark · sentiment pill' },
    { id: 'proof', label: 'Signal Proof', desc: 'Proof loop card' },
  ],
  mike: [
    { id: 'insight', label: 'Founder Note', desc: 'Neutral · insight + photo' },
  ],
};

export function getTemplatesForBrand(brand) {
  return TEMPLATE_META[brand] || TEMPLATE_META.mike;
}

export function defaultTemplate(brand) {
  return (TEMPLATE_META[brand] || TEMPLATE_META.mike)[0].id;
}

// Returns the React element tree for @vercel/og to rasterize.
export function renderTemplate({ brand, template, width, height, data = {} }) {
  const t = tokensFor(brand);
  const brandSet = TEMPLATES[brand] || TEMPLATES.mike;
  const fn = brandSet[template] || brandSet[Object.keys(brandSet)[0]];
  // Brand label/website default in from tokens so the wordmark fallback
  // is never empty when no logo image is used.
  const merged = { label: t.label, website: t.website, ...data };
  return fn(t, width, height, merged);
}

export { TEMPLATE_META };
