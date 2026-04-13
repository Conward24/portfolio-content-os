import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { BRANDS, POST_TYPES, SENTIMENT_TYPES, INTENSITY_LABELS } from '../lib/constants';

export default function Home() {
  const router = useRouter();
  const [brand, setBrand] = useState('mylua');
  const [postType, setPostType] = useState('signal');
  const [postCount, setPostCount] = useState(1);
  const [input, setInput] = useState('');
  const [sentiment, setSentiment] = useState(null);
  const [intensity, setIntensity] = useState(2);
  const [loading, setLoading] = useState(false);

  const isSentiment = postType === 'sentiment';

  async function generate() {
    if (!input.trim()) return;
    if (isSentiment && !sentiment) { alert('Select a sentiment direction.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, postType, postCount, input, sentiment: isSentiment ? sentiment : null, intensity }),
      });
      const data = await res.json();
      if (data.drafts) {
        sessionStorage.setItem('drafts', JSON.stringify(data.drafts));
        sessionStorage.setItem('draftMeta', JSON.stringify({ brand, postType, sentiment, intensity }));
        router.push('/staging');
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const b = BRANDS[brand];

  return (
    <Layout title="Generate" active="generate">
      <div className="page-header">
        <span className="page-title">New post</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1, 2, 3].map(n => (
            <button
              key={n}
              onClick={() => setPostCount(n)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--border2)',
                background: postCount === n ? 'var(--text)' : 'var(--bg)',
                color: postCount === n ? 'var(--bg)' : 'var(--text2)',
                fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: postCount === n ? 600 : 400
              }}
            >
              {n} post{n > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="page-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900 }}>

        {/* Left col */}
        <div>
          {/* Brand selector */}
          <div className="mb-16">
            <div className="section-label mb-8">Brand</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.values(BRANDS).map(br => (
                <button
                  key={br.id}
                  onClick={() => setBrand(br.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 10,
                    border: brand === br.id ? `1.5px solid ${br.color === '#FFCC00' ? '#c9a000' : (br.color || '#888')}` : '0.5px solid var(--border2)',
                    background: brand === br.id ? (br.colorLight || 'var(--bg2)') : 'var(--bg)',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  }}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: br.id === 'henway' ? '#c9a000' : (br.color || '#888'),
                  }} />
                  <span style={{ fontSize: 13, fontWeight: brand === br.id ? 600 : 400, color: 'var(--text)' }}>{br.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Post type */}
          <div className="mb-16">
            <div className="section-label mb-8">Post type</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {POST_TYPES.map(pt => (
                <button
                  key={pt.id}
                  onClick={() => setPostType(pt.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 14px', borderRadius: 9,
                    border: postType === pt.id ? '1.5px solid var(--text)' : '0.5px solid var(--border2)',
                    background: postType === pt.id ? 'var(--bg3)' : 'var(--bg)',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: postType === pt.id ? 600 : 400 }}>{pt.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{pt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div>
          {/* Signal input */}
          <div className="mb-16">
            <div className="section-label mb-8">
              {isSentiment ? 'Blabbing signal' : 'Signal, news, or raw idea'}
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={6}
              placeholder={
                isSentiment
                  ? 'Paste the Blabbing signal, headline, or data point — e.g. "Frustration around postpartum Medicaid gaps up 34% this week across 847 sources. Peaked Thursday."'
                  : 'Paste a Blabbing signal, industry news, data point, or raw idea...'
              }
            />
          </div>

          {/* Sentiment options — shown only for sentiment post type */}
          {isSentiment && (
            <div className="mb-16">
              <div className="section-label mb-8">Sentiment direction</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {Object.values(SENTIMENT_TYPES).map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSentiment(s.id)}
                    style={{
                      padding: '10px 12px', borderRadius: 10, textAlign: 'left',
                      border: sentiment === s.id ? `1.5px solid ${s.selectedStyle.borderColor}` : '0.5px solid var(--border2)',
                      background: sentiment === s.id ? s.selectedStyle.background : 'var(--bg)',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ fontSize: 15, marginBottom: 3 }}>{s.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.4 }}>{s.desc}</div>
                  </button>
                ))}
              </div>

              {sentiment && (
                <div>
                  <div className="section-label mb-8">Signal intensity</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="range" min={1} max={3} step={1} value={intensity}
                      onChange={e => setIntensity(Number(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 600, minWidth: 80, color: 'var(--text2)' }}>
                      {INTENSITY_LABELS[intensity]}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                    <span>subtle shift</span><span>peak signal</span>
                  </div>

                  {/* Timing tip */}
                  <div style={{
                    marginTop: 12, padding: '10px 14px', borderRadius: 8,
                    background: 'var(--bg2)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.6
                  }}>
                    <strong style={{ color: 'var(--text)', fontWeight: 600 }}>Timing:</strong>{' '}
                    {SENTIMENT_TYPES[sentiment]?.timing}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 14 }}
            onClick={generate}
            disabled={loading}
          >
            {loading ? 'Generating...' : `Generate ${postCount > 1 ? postCount + ' posts' : 'post'} →`}
          </button>
        </div>
      </div>
    </Layout>
  );
}
