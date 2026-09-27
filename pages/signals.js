import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { BRANDS } from '../lib/constants';

// The signal board. Every active Blabbing topic, staged on the conversation ladder
// (see lib/blabbing/ladder.js for the rules and the backtest behind them).

const STAGES = {
  conversation:  { label: 'Crossed into conversation', short: 'Conversation', bg: '#FFF1D9', color: '#8A5600', blurb: 'In 3 of its first 5 pulses. Check the sources, then draft.' },
  'still-going': { label: 'Still going', short: 'Still going', bg: '#EDE5FF', color: '#4A10C4', blurb: 'Two weeks or more on and still in the pulse. The best time for a point of view.' },
  repeat:        { label: 'Watch', short: 'Repeat', bg: '#F1EFE8', color: '#444441', blurb: 'Showed up twice. Not a conversation yet.' },
  mention:       { label: 'Watch', short: 'New mention', bg: '#F1EFE8', color: '#444441', blurb: 'First appearance. Most never come back.' },
  'went-quiet':  { label: 'Went quiet', short: 'Went quiet', bg: '#F4F4F4', color: '#777', blurb: 'Had a run, gone from the last 3 pulses. Only post with a dated hook.' },
};
const SECTIONS = [
  { id: 'conversation', stages: ['conversation'] },
  { id: 'still-going', stages: ['still-going'] },
  { id: 'hooks' },
  { id: 'watch', stages: ['repeat', 'mention'], title: 'Watch list' },
  { id: 'went-quiet', stages: ['went-quiet'] },
];
const BRAND_TABS = [['all', 'All'], ['mylua', 'MyLÚA'], ['henway', 'Henway'], ['blabbing', 'Blabbing']];

function fmt(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
function fmtHook(h) {
  const [y, m, d] = h.when.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (h.precision === 'year') return String(y);
  if (h.precision === 'month') return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function BrandChip({ brand }) {
  const b = BRANDS[brand] || BRANDS.blabbing;
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: b.colorLight, color: b.colorText, whiteSpace: 'nowrap' }}>{b.short || b.name}</span>;
}

function Strip({ strip }) {
  return (
    <span title="Last 14 pulses, oldest first" style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {strip.map((s, i) => (
        <span key={i} title={fmt(s.date)} style={{ width: 7, height: 7, borderRadius: '50%', background: s.on ? '#5e17eb' : 'transparent', border: s.on ? 'none' : '1px solid #d6d2de' }} />
      ))}
    </span>
  );
}

export default function Signals() {
  const router = useRouter();
  const [board, setBoard] = useState(null);
  const [error, setError] = useState('');
  const [brand, setBrand] = useState('all');

  useEffect(() => {
    try { const b = localStorage.getItem('signals.brand'); if (b) setBrand(b); } catch {}
    fetch('/api/signals/board')
      .then(r => r.json())
      .then(d => (d.error ? setError(d.error) : setBoard(d)))
      .catch(() => setError('Could not load the board.'));
  }, []);

  function pickBrand(b) { setBrand(b); try { localStorage.setItem('signals.brand', b); } catch {} }

  async function toggleChecked(item) {
    const next = !item.checked;
    setBoard(prev => ({ ...prev, topics: prev.topics.map(t => ({ ...t, items: t.items.map(i => (i.key === item.key ? { ...i, checked: next } : i)) })) }));
    await fetch('/api/signals/board', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: item.key, checked: next }) });
  }

  function draftThis(topic, item) {
    const stage = STAGES[item.stage];
    const input = [
      `${item.entity}: ${stage.short.toLowerCase()} in the Blabbing pulse for "${topic.topic}".`,
      `In the pulse since ${fmt(item.firstSeen)}, ${item.appearances} appearances, ${item.firstFive} of its first 5 pulses. Last seen ${fmt(item.lastSeen)}.`,
      `Latest line: ${item.context}`,
      item.checked ? 'Sources checked by Michael.' : 'Sources NOT checked yet. Verify every fact before posting.',
    ].join('\n\n');
    sessionStorage.setItem('incomingSignal', JSON.stringify({
      topic: topic.topic,
      analysis: input,
      brand: topic.brand,
      blabSignal: { topic: topic.topic, entity: item.entity, stage: item.stage, firstSeen: item.firstSeen, pulseDate: topic.latestDate, sourcesChecked: item.checked },
    }));
    router.push('/');
  }

  const topics = board ? board.topics.filter(t => brand === 'all' || t.brand === brand) : [];
  const flat = topics.flatMap(t => t.items.map(i => ({ t, i })));
  const hooks = topics.flatMap(t => t.hooks.map(h => ({ t, h }))).sort((a, b) => a.h.when.localeCompare(b.h.when));

  return (
    <Layout title="Signals" active="signals">
      <div className="page-header">
        <span className="page-title">Signal board</span>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
          {board ? `${board.summary.topics} topics · pulses through ${fmt(board.topics.reduce((a, t) => (t.latestDate > a ? t.latestDate : a), ''))}` : ''}
          {board?.meta?.lastPullError ? ' · last pull failed' : ''}
        </span>
      </div>

      <div className="page-body" style={{ maxWidth: 900 }}>
        <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.6, margin: '0 0 14px' }}>
          A story becomes a conversation when it shows up in 3 of its first 5 pulses. Most names appear once and never
          come back (83% in our backtest). The ones that cross were about 20 times more likely to still be around two
          weeks later. Tick <b>Sources checked</b> once you've verified the facts, then draft.
        </p>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {BRAND_TABS.map(([id, label]) => (
            <button key={id} onClick={() => pickBrand(id)} style={{
              fontSize: 13, padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
              border: brand === id ? '1.5px solid #5e17eb' : '0.5px solid var(--border2)',
              background: brand === id ? '#EEEDFE' : 'var(--bg)', color: 'var(--text)', fontWeight: brand === id ? 600 : 400,
            }}>{label}</button>
          ))}
        </div>

        {error && <div style={{ color: '#a33', fontSize: 13 }}>{error}</div>}
        {!board && !error && <div style={{ color: 'var(--text3)', fontSize: 13 }}>Loading…</div>}

        {board && SECTIONS.map(sec => {
          if (sec.id === 'hooks') {
            if (!hooks.length) return null;
            return (
              <section key="hooks" style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 15, margin: '0 0 4px' }}>Coming up</h2>
                <p style={{ fontSize: 12.5, color: 'var(--text3)', margin: '0 0 10px' }}>Dates ahead named in the latest pulses. Put the good ones on the calendar as hooks.</p>
                {hooks.map(({ t, h }, k) => (
                  <div key={k} style={{ display: 'grid', gridTemplateColumns: '92px 1fr', gap: 12, padding: '10px 0', borderTop: '0.5px solid var(--border2)' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{fmtHook(h)}</span>
                    <span style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--text2)' }}>{h.sentence} <span style={{ whiteSpace: 'nowrap' }}><BrandChip brand={t.brand} /></span></span>
                  </div>
                ))}
              </section>
            );
          }
          const rows = flat.filter(({ i }) => sec.stages.includes(i.stage));
          if (!rows.length) return null;
          const s = STAGES[sec.stages[0]];
          return (
            <section key={sec.id} style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 15, margin: '0 0 4px' }}>{sec.title || s.label} <span style={{ color: 'var(--text3)', fontWeight: 400 }}>{rows.length}</span></h2>
              <p style={{ fontSize: 12.5, color: 'var(--text3)', margin: '0 0 10px' }}>{s.blurb}</p>
              {rows.map(({ t, i }) => {
                const st = STAGES[i.stage];
                const actionable = i.stage === 'conversation' || i.stage === 'still-going';
                return (
                  <div key={i.key} style={{ border: '0.5px solid var(--border2)', borderRadius: 12, padding: '14px 16px', marginBottom: 10, background: 'var(--bg)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{i.entity}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: st.bg, color: st.color }}>{st.short}</span>
                      <BrandChip brand={t.brand} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>{t.topic}</div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--text2)', marginBottom: 10 }}>{i.context}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', alignItems: 'center', fontSize: 12, color: 'var(--text3)' }}>
                      <Strip strip={i.strip} />
                      <span>since {fmt(i.firstSeen)} · {i.firstFive} of first 5 · {i.appearances} total · last {fmt(i.lastSeen)}</span>
                    </div>
                    {actionable && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                        <button onClick={() => toggleChecked(i)} style={{
                          fontSize: 12.5, padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                          border: i.checked ? '1px solid #1D9E75' : '0.5px solid var(--border2)',
                          background: i.checked ? '#E1F5EE' : 'var(--bg)', color: i.checked ? '#085041' : 'var(--text2)',
                        }}>{i.checked ? '✓ Sources checked' : 'Sources checked?'}</button>
                        <button onClick={() => draftThis(t, i)} style={{
                          fontSize: 12.5, padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                          border: 'none', background: '#5e17eb', color: '#fff', fontWeight: 600,
                        }}>Draft this →</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          );
        })}

        {board && !flat.length && !hooks.length && (
          <div style={{ color: 'var(--text3)', fontSize: 13 }}>Nothing on the board for this brand yet.</div>
        )}
      </div>
    </Layout>
  );
}
