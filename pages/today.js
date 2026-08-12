import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { BRANDS } from '../lib/constants';

// Phone posting screen. One job: standing in a queue, know what to post,
// copy it, grab the asset, mark it done. Everything else is noise.

const BADGE = {
  henway: { bg: '#FFCC00', fg: '#000' },
  mylua: { bg: BRANDS.mylua?.color || '#2C4D45', fg: '#fff' },
  blabbing: { bg: '#5E17EB', fg: '#fff' },
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function dayLabel(date) {
  const t = todayStr();
  if (date === t) return 'Today';
  const diff = Math.round((new Date(date + 'T12:00:00') - new Date(t + 'T12:00:00')) / 86400000);
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return diff === -1 ? 'Yesterday · missed' : `${Math.abs(diff)} days ago · missed`;
  return new Date(date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long' });
}

/** 07:30 → 7:30am. Reads faster than 24h on a glance. */
function niceTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h < 12 ? 'am' : 'pm';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${ampm}`;
}

/** Match a post to library assets by the naming convention the library was seeded with. */
function matchAssets(post, photos) {
  const t = (post.title || '').toLowerCase();
  const pick = pre => photos.filter(p => p.name.toLowerCase().startsWith(pre));
  const card = /card (\d+)/.exec(t);
  if (card && !t.includes('egg')) return pick(`card-${card[1].padStart(2, '0')}`);
  if (t.includes('egg card')) return pick('egg-');
  if (t.includes('consultant carousel')) return pick('carousel-consultant');
  if (t.includes('hr/l&d carousel') || t.includes('hr carousel')) return pick('carousel-hr');
  if (t.includes('agency') && t.includes('carousel')) return pick('carousel-agency');
  const file = /✅ BUILT · (\S+)/.exec(post.copy || '');
  if (file) return photos.filter(p => p.name === file[1]);
  return [];
}

export default function Today() {
  const [posts, setPosts] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [posted, setPosted] = useState({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/calendar').then(r => r.json()).catch(() => ({ posts: [] })),
      fetch('/api/photos').then(r => r.json()).catch(() => ({ photos: [] })),
      fetch('/api/posted').then(r => r.json()).catch(() => ({ posted: {} })),
    ]).then(([c, ph, po]) => {
      setPosts(c.posts || []);
      setPhotos(ph.photos || []);
      setPosted(po.posted || {});
      setLoading(false);
    });
  }, []);

  async function mark(id, done) {
    setPosted(p => {
      const n = { ...p };
      if (done) n[id] = new Date().toISOString();
      else delete n[id];
      return n;
    });
    if (done && navigator.vibrate) navigator.vibrate(12);
    await fetch('/api/posted', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, done }),
    }).catch(() => {});
  }

  function copy(text, id) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    if (navigator.vibrate) navigator.vibrate(8);
    setTimeout(() => setCopied(null), 1800);
  }

  const t = todayStr();
  // Nothing before the schedule starts, and missed items only from the last 3 days —
  // a week of guilt on the top of the screen is not useful in a queue.
  const from = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
  const to = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const due = posts
    .filter(p => p.date >= from && p.date <= to)
    .filter(p => !(p.date < t && posted[p.id]))     // hide finished past work
    .sort((a, b) => (a.date === b.date ? (a.time || '').localeCompare(b.time || '') : a.date < b.date ? -1 : 1));

  const groups = due.reduce((m, p) => ((m[p.date] = m[p.date] || []).push(p), m), {});
  const todays = groups[t] || [];
  const doneToday = todays.filter(p => posted[p.id]).length;
  const left = todays.length - doneToday;

  return (
    <Layout title="Today" active="today">
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <header style={{ padding: '2px 0 14px' }}>
          <h1 style={{ fontSize: 21, margin: '0 0 3px', letterSpacing: '-0.01em' }}>
            {loading ? ' ' : left === 0 ? (todays.length ? 'Today is done' : 'Nothing due today') : `${left} to post today`}
          </h1>
          {!loading && todays.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(doneToday / todays.length) * 100}%`,
                    height: '100%',
                    background: '#3FA46A',
                    transition: 'width .25s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>
                {doneToday}/{todays.length}
              </span>
            </div>
          )}
        </header>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="card" style={{ height: 76, opacity: 0.35 - i * 0.09 }} />
            ))}
          </div>
        )}

        {!loading && due.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 30, color: 'var(--text3)', fontSize: 14 }}>
            Nothing scheduled in the next few days.
          </div>
        )}

        {Object.keys(groups).map(date => {
          const past = date < t;
          return (
            <section key={date} style={{ marginBottom: 22 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '.09em',
                  textTransform: 'uppercase',
                  color: past ? '#A32D2D' : date === t ? 'var(--text)' : 'var(--text3)',
                  padding: '8px 2px 6px',
                  position: 'sticky',
                  top: 0,
                  background: 'var(--bg1)',
                  zIndex: 2,
                }}
              >
                {dayLabel(date)}
              </div>

              {groups[date].map(p => {
                const done = Boolean(posted[p.id]);
                const assets = matchAssets(p, photos);
                const isOpen = open === p.id;
                const badge = BADGE[p.brand] || { bg: 'var(--text3)', fg: '#fff' };
                const hasVideo = assets.some(a => /\.mp4$/i.test(a.name));

                return (
                  <article
                    key={p.id}
                    className="card"
                    style={{ marginBottom: 8, padding: 0, opacity: done ? 0.45 : 1, overflow: 'hidden' }}
                  >
                    {/* Whole header is the tap target — no separate Open button */}
                    <div
                      onClick={() => setOpen(isOpen ? null : p.id)}
                      style={{ padding: '13px 14px', cursor: 'pointer', display: 'flex', gap: 11, alignItems: 'flex-start' }}
                    >
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 800,
                          letterSpacing: '.06em',
                          padding: '4px 7px',
                          borderRadius: 4,
                          background: badge.bg,
                          color: badge.fg,
                          flex: '0 0 auto',
                          marginTop: 1,
                        }}
                      >
                        {p.channelLabel}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14.5,
                            fontWeight: 600,
                            lineHeight: 1.35,
                            textDecoration: done ? 'line-through' : 'none',
                          }}
                        >
                          {p.title}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 3 }}>
                          {niceTime(p.time)}
                          {assets.length > 0 && ` · ${assets.length} ${hasVideo ? 'video' : 'image'}${assets.length > 1 ? 's' : ''}`}
                        </div>
                      </div>
                      <span style={{ color: 'var(--text3)', fontSize: 12, flex: '0 0 auto', marginTop: 3 }}>
                        {isOpen ? '▴' : '▾'}
                      </span>
                    </div>

                    {isOpen && (
                      <div style={{ padding: '0 14px 14px' }}>
                        {p.copy && (
                          <div
                            style={{
                              fontSize: 14,
                              lineHeight: 1.7,
                              whiteSpace: 'pre-line',
                              background: 'var(--bg2)',
                              borderRadius: 8,
                              padding: '12px 13px',
                            }}
                          >
                            {p.copy}
                          </div>
                        )}

                        {assets.length > 0 && (
                          <>
                            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 10, paddingBottom: 2 }}>
                              {assets.map(a =>
                                /\.mp4$/i.test(a.name) ? (
                                  <video
                                    key={a.id}
                                    src={a.url}
                                    controls
                                    playsInline
                                    preload="metadata"
                                    style={{ height: 190, borderRadius: 8, flex: '0 0 auto', background: '#000' }}
                                  />
                                ) : (
                                  <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" style={{ flex: '0 0 auto' }}>
                                    <img
                                      src={a.url}
                                      alt={a.name}
                                      style={{ height: 104, borderRadius: 8, border: '1px solid var(--border)', display: 'block' }}
                                    />
                                  </a>
                                ),
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 7 }}>
                              {hasVideo
                                ? 'Tap ⋯ on the player → Download to save it to Photos.'
                                : 'Tap to open, then long-press to save to Photos.'}
                            </div>
                          </>
                        )}

                        <div style={{ display: 'flex', gap: 8, marginTop: 13 }}>
                          {p.copy && (
                            <button
                              className="btn"
                              onClick={() => copy(p.copy, p.id)}
                              style={{ flex: 1, padding: '12px 0', fontSize: 13.5, fontWeight: 600 }}
                            >
                              {copied === p.id ? 'Copied ✓' : 'Copy text'}
                            </button>
                          )}
                          <button
                            className="btn"
                            onClick={() => mark(p.id, !done)}
                            style={{
                              flex: 1,
                              padding: '12px 0',
                              fontSize: 13.5,
                              fontWeight: 600,
                              background: done ? 'transparent' : '#3FA46A',
                              color: done ? 'var(--text3)' : '#fff',
                              borderColor: done ? 'var(--border)' : '#3FA46A',
                            }}
                          >
                            {done ? 'Undo' : 'Mark posted'}
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
    </Layout>
  );
}
