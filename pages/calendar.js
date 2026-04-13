import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { BRANDS, SENTIMENT_TYPES, WEEK_SEED_POSTS } from '../lib/constants';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function getWeekStart(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(now.setDate(diff + offset * 7));
  return mon;
}

function formatWeekLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDateForDay(weekStart, dayIdx) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayIdx);
  return d.toISOString().split('T')[0];
}

export default function Calendar() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [savedPosts, setSavedPosts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadCalendar();
  }, []);

  async function loadCalendar() {
    setLoading(true);
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      setSavedPosts(data.posts || []);
    } catch (e) {
      console.error(e);
      setSavedPosts([]);
    }
    setLoading(false);
  }

  async function deletePost(id) {
    try {
      await fetch('/api/calendar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setSavedPosts(prev => prev.filter(p => p.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (e) { console.error(e); }
  }

  async function reschedule(id, newDate) {
    try {
      await fetch('/api/calendar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, date: newDate }),
      });
      setSavedPosts(prev => prev.map(p => p.id === id ? { ...p, date: newDate } : p));
    } catch (e) { console.error(e); }
  }

  const weekStart = getWeekStart(weekOffset);
  const weekLabel = `Week of ${formatWeekLabel(weekStart)}`;

  // Merge seed posts + saved posts
  const seedForWeek = WEEK_SEED_POSTS.filter(p => p.weekOffset === weekOffset);
  const allPosts = [...seedForWeek, ...savedPosts];
  const filtered = filter === 'all' ? allPosts : allPosts.filter(p => p.brand === filter);

  function getPostsForDay(day) {
    return filtered.filter(p => {
      if (p.day) return p.day === day; // seed posts
      const dayIdx = DAYS.indexOf(day);
      const targetDate = getDateForDay(weekStart, dayIdx);
      return p.date === targetDate;
    });
  }

  const brandCounts = Object.keys(BRANDS).reduce((acc, b) => {
    acc[b] = allPosts.filter(p => p.brand === b).length;
    return acc;
  }, {});

  return (
    <Layout title="Calendar" active="calendar">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn" onClick={() => setWeekOffset(w => w - 1)} style={{ padding: '6px 12px' }}>← prev</button>
          <span style={{ fontSize: 14, fontWeight: 500, minWidth: 200 }}>{weekLabel}</span>
          <button className="btn" onClick={() => setWeekOffset(w => w + 1)} style={{ padding: '6px 12px' }}>next →</button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'mylua', 'henway', 'blabbing', 'mike'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer',
                border: filter === f ? '1.5px solid var(--text)' : '0.5px solid var(--border2)',
                background: filter === f ? 'var(--bg3)' : 'var(--bg)',
                color: 'var(--text2)', fontFamily: 'inherit', fontWeight: filter === f ? 600 : 400,
              }}
            >
              {f === 'all' ? 'All brands' : BRANDS[f]?.name || f}
            </button>
          ))}
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: 1100 }}>

        {/* Stats row */}
        <div className="grid-4 mb-24">
          <div className="metric-card">
            <div className="metric-num">{allPosts.length}</div>
            <div className="metric-label">posts this week</div>
          </div>
          <div className="metric-card">
            <div className="metric-num" style={{ color: 'var(--mylua-primary)' }}>{brandCounts.mylua || 0}</div>
            <div className="metric-label">MyLÚA</div>
          </div>
          <div className="metric-card">
            <div className="metric-num" style={{ color: '#c9a000' }}>{brandCounts.henway || 0}</div>
            <div className="metric-label">Henway</div>
          </div>
          <div className="metric-card">
            <div className="metric-num" style={{ color: 'var(--blabbing-primary)' }}>{brandCounts.blabbing || 0}</div>
            <div className="metric-label">Blabbing</div>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="card mb-16" style={{ borderLeft: `3px solid ${selected.brand === 'henway' ? '#c9a000' : BRANDS[selected.brand]?.color || '#888'}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className={`brand-badge badge-${selected.brand}`}>{BRANDS[selected.brand]?.name}</span>
                {selected.sentiment && (
                  <span className={`stag stag-${selected.sentiment}`}>{SENTIMENT_TYPES[selected.sentiment]?.name}</span>
                )}
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{selected.type || selected.postType}</span>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{selected.channel || ''}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" style={{ fontSize: 12, padding: '5px 12px' }}
                  onClick={() => navigator.clipboard.writeText(selected.copy)}>Copy</button>
                {selected.id?.startsWith('post-') && (
                  <button className="btn" style={{ fontSize: 12, padding: '5px 12px', color: '#A32D2D' }}
                    onClick={() => deletePost(selected.id)}>Delete</button>
                )}
                <button className="btn" style={{ fontSize: 12, padding: '5px 12px' }}
                  onClick={() => setSelected(null)}>×</button>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{selected.title}</div>
            <div style={{
              fontSize: 13, color: 'var(--text2)', lineHeight: 1.75,
              padding: '12px 14px', background: 'var(--bg2)', borderRadius: 8,
              whiteSpace: 'pre-line', marginBottom: 10
            }}>{selected.copy}</div>
            {selected.sentiment && (
              <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>
                Timing: {SENTIMENT_TYPES[selected.sentiment]?.timing}
              </div>
            )}
            {selected.date && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>Reschedule:</span>
                <input type="date" defaultValue={selected.date} style={{ width: 'auto', fontSize: 12 }}
                  onChange={e => reschedule(selected.id, e.target.value)} />
              </div>
            )}
          </div>
        )}

        {/* Calendar grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Loading calendar...</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px repeat(5, 1fr)',
            gap: 10,
          }}>
            {/* Headers */}
            <div />
            {DAYS.map(day => {
              const dayIdx = DAYS.indexOf(day);
              const date = getDateForDay(weekStart, dayIdx);
              const d = new Date(date);
              return (
                <div key={day} style={{ textAlign: 'center', paddingBottom: 8, borderBottom: '0.5px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.06em' }}>{day.toUpperCase()}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
              );
            })}

            {/* Row label */}
            <div style={{ fontSize: 11, color: 'var(--text3)', paddingTop: 12, lineHeight: 1.3 }}>Posts</div>

            {/* Day columns */}
            {DAYS.map(day => {
              const posts = getPostsForDay(day);
              return (
                <div key={day} style={{ minHeight: 120 }}>
                  {posts.length === 0 ? (
                    <div style={{
                      height: 80, border: '0.5px dashed var(--border)',
                      borderRadius: 8, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: 'var(--text3)', fontSize: 11
                    }}>—</div>
                  ) : (
                    posts.map((post, i) => (
                      <div
                        key={post.id || i}
                        className={`post-card brand-${post.brand}`}
                        onClick={() => setSelected(post)}
                        style={{ marginBottom: i < posts.length - 1 ? 6 : 0 }}
                      >
                        <div className={`post-card-brand brand-${post.brand}`}>
                          {post.channelLabel || (post.brand === 'mylua' ? 'MYLÚA' : (post.brand || '').toUpperCase())}
                        </div>
                        <div className="post-card-title">{post.title}</div>
                        <div className="post-card-type">
                          {post.type || post.postType}
                          {post.time && ` · ${post.time}`}
                          {post.sentiment && ` · ${SENTIMENT_TYPES[post.sentiment]?.name}`}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
          {Object.values(BRANDS).map(b => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: b.id === 'henway' ? '#c9a000' : (b.color || '#888')
              }} />
              {b.name}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
