import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { SENTIMENT_TYPES, INTENSITY_LABELS } from '../lib/constants';
import { topEmotions, describeMomentum, explainSuggestion } from '../lib/blabbing/describe';

const TREND_STYLE = {
  rising:   { label: '↗ rising',   bg: '#FAECE7', color: '#993C1D' },
  cooling:  { label: '↘ cooling',  bg: '#E6F1FB', color: '#185FA5' },
  shifting: { label: '⇄ shifting', bg: '#F3ECFB', color: '#5e17eb' },
  new:      { label: '✦ new',      bg: '#F1EFE8', color: '#444441' },
  flat:     { label: '→ steady',   bg: '#F1EFE8', color: '#666' },
};

export default function Signals() {
  const router = useRouter();
  const [signals, setSignals] = useState(null);

  useEffect(() => {
    fetch('/api/ingest/blabbing?limit=50')
      .then(r => r.json())
      .then(d => setSignals(d.signals || []))
      .catch(() => setSignals([]));
  }, []);

  function draftThis(signal) {
    // Hand the signal to the generate page; it pre-fills input + archetype + intensity.
    sessionStorage.setItem('incomingSignal', JSON.stringify(signal));
    router.push('/');
  }

  return (
    <Layout title="Signals" active="signals">
      <div className="page-header">
        <span className="page-title">Blabbing signals</span>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
          {signals ? `${signals.length} ingested` : ''}
        </span>
      </div>

      <div className="page-body" style={{ maxWidth: 820 }}>
        {signals === null && <div style={{ color: 'var(--text3)', fontSize: 13 }}>Loading…</div>}

        {signals && signals.length === 0 && (
          <div style={{ color: 'var(--text3)', fontSize: 13, lineHeight: 1.7 }}>
            No signals yet. They appear here once B4B Daily Pulse emails are ingested via{' '}
            <code>/api/ingest/blabbing</code>. See <code>docs/blabbing-ingestion-contract.md</code>.
          </div>
        )}

        {signals && signals.map((s, i) => {
          const sug = explainSuggestion(s);
          const arche = SENTIMENT_TYPES[s.derived?.type];
          const trend = TREND_STYLE[s.momentum?.trend] || TREND_STYLE.new;
          const tops = topEmotions(s.emotions, 3);
          return (
            <div key={s.id || i} style={{
              border: '0.5px solid var(--border2)', borderRadius: 12,
              padding: '16px 18px', marginBottom: 12, background: 'var(--bg)',
            }}>
              {/* header row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: 'var(--text)' }}>{s.topic}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
                    {s.dateKey}{s.source ? ` · ${s.source}` : ''}
                  </div>
                </div>
                <span style={{
                  fontSize: 10, padding: '3px 8px', borderRadius: 10, whiteSpace: 'nowrap',
                  background: trend.bg, color: trend.color, fontWeight: 600,
                }}>{trend.label}</span>
              </div>

              {/* derived archetype */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                {arche && (
                  <span style={{
                    fontSize: 11, padding: '3px 9px', borderRadius: 8, fontWeight: 600,
                    border: `1px solid ${arche.selectedStyle.borderColor}`,
                    background: arche.selectedStyle.background,
                  }}>
                    {arche.icon} {arche.name} · {INTENSITY_LABELS[s.derived?.intensity]}
                  </span>
                )}
                {tops.map(e => (
                  <span key={e.name} style={{ fontSize: 10, color: 'var(--text3)' }}>{e.name} {e.value}</span>
                ))}
                {s.needsEnrichment && (
                  <span title={`Missing: ${s.missing?.join(', ')}`} style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 8,
                    background: '#FCF3D9', color: '#8A6D0B', fontWeight: 600,
                  }}>⚠ needs enrichment</span>
                )}
              </div>

              {/* summary */}
              {s.summary && (
                <div style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 10 }}>
                  {s.summary.length > 240 ? s.summary.slice(0, 240) + '…' : s.summary}
                </div>
              )}

              {/* why + momentum + action */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
                  {sug && <span><strong style={{ color: 'var(--text2)' }}>Suggested:</strong> {sug.reason}</span>}
                  {describeMomentum(s.momentum) && <span> · {describeMomentum(s.momentum)}</span>}
                </div>
                <button
                  className="btn btn-primary"
                  style={{ padding: '7px 14px', fontSize: 12, whiteSpace: 'nowrap' }}
                  onClick={() => draftThis(s)}
                >Draft this →</button>
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
