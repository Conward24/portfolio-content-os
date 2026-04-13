import Layout from '../components/Layout';
import { MYLUA_TOPICS, HENWAY_TOPICS, BLABBING_TOPICS } from '../lib/constants';

const FREQ_STYLE = {
  'daily': { bg: '#FAECE7', color: '#993C1D' },
  '3x/week': { bg: '#E6F1FB', color: '#185FA5' },
  'weekly': { bg: '#F1EFE8', color: '#444441' },
};

function TopicList({ topics, brand, clusterLabels }) {
  const clusters = [...new Set(topics.map(t => t.cluster))];
  return (
    <div>
      {clusters.map(cluster => (
        <div key={cluster} style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 8
          }}>
            {clusterLabels?.[cluster] || `Cluster ${cluster}`}
          </div>
          {topics.filter(t => t.cluster === cluster).map((topic, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '7px 0', borderBottom: '0.5px solid var(--border)',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                background: brand === 'mylua' ? '#2C4D45' : brand === 'henway' ? '#c9a000' : '#5e17eb'
              }} />
              <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1, lineHeight: 1.5 }}>{topic.name}</span>
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 10, flexShrink: 0,
                background: FREQ_STYLE[topic.freq]?.bg,
                color: FREQ_STYLE[topic.freq]?.color,
              }}>{topic.freq}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Topics() {
  return (
    <Layout title="Topic feeds" active="topics">
      <div className="page-header">
        <span className="page-title">Blabbing topic feeds</span>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>47 topics across 3 companies</span>
      </div>

      <div className="page-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 1100 }}>

        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: '#085041', marginBottom: 16, letterSpacing: '0.05em' }}>
            MYLÚA HEALTH — 22 topics
          </div>
          <TopicList
            topics={MYLUA_TOPICS}
            brand="mylua"
            clusterLabels={{ A: 'Cluster A — Policy & Payer (daily)', B: 'Cluster B — Market & Clinical (3x/week)', C: 'Cluster C — Awareness & Advocacy (weekly)' }}
          />
        </div>

        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7a5f00', marginBottom: 16, letterSpacing: '0.05em' }}>
            HENWAY — 25 topics
          </div>
          <TopicList
            topics={HENWAY_TOPICS}
            brand="henway"
            clusterLabels={{ A: 'Cluster A — Hot right now (daily)', B: 'Cluster B — Core identity (3x/week)', C: 'Cluster C — Partners & institutions (weekly)' }}
          />
        </div>

        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: '#3C3489', marginBottom: 16, letterSpacing: '0.05em' }}>
            BLABBING — signal categories
          </div>
          <TopicList
            topics={BLABBING_TOPICS}
            brand="blabbing"
            clusterLabels={{ A: 'Cluster A — Daily monitoring', B: 'Cluster B — Core segments (3x/week)', C: 'Cluster C — Competitive (weekly)' }}
          />

          <div style={{ marginTop: 20, padding: '12px 14px', background: 'var(--bg2)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>The proof loop</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
              Mike uses Blabbing internally across MyLÚA and Henway → documents the competitive advantage it creates → turns those results into Blabbing's marketing. One action, multiple outputs.
            </div>
          </div>

          <div style={{ marginTop: 14, padding: '12px 14px', background: '#EEEDFE', borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: '#3C3489' }}>Week 1 load order</div>
            <div style={{ fontSize: 12, color: '#3C3489', lineHeight: 1.8 }}>
              1. Black maternal mortality<br />
              2. Doula reimbursement legislation<br />
              3. Black Maternal Health Week<br />
              4. HRSA and NIH maternal funding<br />
              5. Preventable maternal death<br />
              6. Agentic AI in healthcare<br />
              7. Medicaid maternal policy
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
