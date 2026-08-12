import { useState, useEffect } from 'react';
import Link from 'next/link';

// Mobile-first posting screen. The job: standing in a coffee queue, know what
// to post, copy it, grab the asset, mark it done. Nothing else.

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayLabel(date) {
  const t = todayStr();
  if (date === t) return 'Today';
  const d = new Date(date + 'T12:00:00');
  const now = new Date(t + 'T12:00:00');
  const diff = Math.round((d - now) / 86400000);
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  return d.toLocaleDateString(undefined, { weekday: 'long' });
}

/**
 * Match a post to library assets by naming convention. The library was seeded
 * with names derived from the same asset numbering the calendar refers to.
 */
function matchAssets(post, photos) {
  const t = (post.title || '').toLowerCase();
  const pick = pre => photos.filter(p => p.name.toLowerCase().startsWith(pre));

  const card = /card (\d+)/.exec(t);
  if (card && !t.includes('egg')) return pick(`card-${card[1].padStart(2, '0')}`);
  if (t.includes('egg card')) return pick('egg-');
  if (t.includes('consultant carousel')) return pick('carousel-consultant');
  if (t.includes('hr/l&d carousel') || t.includes('hr carousel')) return pick('carousel-hr');
  if (t.includes('agency') && t.includes('carousel')) return pick('carousel-agency');

  // TikToks name their file in the copy: "✅ BUILT · <filename>"
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
      setPhotos(ph.photos || ph || []);
      setPosted(po.posted || {});
      setLoading(false);
    });
  }, []);

  async function mark(id, done) {
    setPosted(p => (done ? { ...p, [id]: new Date().toISOString() } : Object.fromEntries(Object.entries(p).filter(([k]) => k !== id))));
    await fetch('/api/posted', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, done }),
    }).catch(() => {});
  }

  function copy(text, id) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  }

  const t = todayStr();
  // Everything still owed, plus the next few days. Nothing older than a week.
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const due = posts
    .filter(p => p.date >= weekAgo && p.date <= soon)
    .filter(p => !(p.date < t && posted[p.id]))
    .sort((a, b) => (a.date === b.date ? (a.time || '').localeCompare(b.time || '') : a.date < b.date ? -1 : 1));

  const groups = due.reduce((m, p) => ((m[p.date] = m[p.date] || []).push(p), m), {});
  const remainingToday = (groups[t] || []).filter(p => !posted[p.id]).length;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 12px 80px' }}>
      <div style={{ padding: '4px 0 16px' }}>
        <h1 style={{ fontSize: 20, margin: '0 0 2px' }}>
          {remainingToday === 0 ? 'All clear today' : `${remainingToday} to post today`}
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0 }}>
          Tap the copy, save the asset, mark it done.
        </p>
      </div>

      {loading && <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)' }}>Loading…</div>}

      {!loading && due.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 28, color: 'var(--text3)' }}>
          Nothing scheduled in the next few days.
        </div>
      )}

      {Object.keys(groups).map(date => (
        <div key={date} style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: date < t ? '#A32D2D' : 'var(--text3)',
              padding: '6px 2px',
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
            return (
              <div
                key={p.id}
                className="card"
                style={{ marginBottom: 10, opacity: done ? 0.5 : 1, padding: 14 }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '.06em',
                      padding: '3px 7px',
                      borderRadius: 4,
                      background: p.brand === 'henway' ? '#FFCC00' : '#2C4D45',
                      color: p.brand === 'henway' ? '#000' : '#fff',
                    }}
                  >
                    {p.channelLabel}
                  </span>
                  {p.time && <span style={{ fontSize: 12, color: 'var(--text3)' }}>{p.time}</span>}
                </div>

                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    lineHeight: 1.35,
                    textDecoration: done ? 'line-through' : 'none',
                  }}
                >
                  {p.title}
                </div>

                {isOpen && p.copy && (
                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: 1.7,
                      whiteSpace: 'pre-line',
                      background: 'var(--bg2)',
                      borderRadius: 8,
                      padding: '12px 13px',
                      marginTop: 10,
                    }}
                  >
                    {p.copy}
                  </div>
                )}

                {isOpen && assets.length > 0 && (
                  <>
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 10, paddingBottom: 4 }}>
                      {assets.map(a =>
                        /\.mp4$/i.test(a.name) ? (
                          // preload metadata only — don't pull megabytes over cellular
                          <video
                            key={a.id}
                            src={a.url}
                            controls
                            playsInline
                            preload="metadata"
                            style={{ height: 180, borderRadius: 6, border: '1px solid var(--border)', flex: '0 0 auto', background: '#000' }}
                          />
                        ) : (
                          <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" style={{ flex: '0 0 auto' }}>
                            <img
                              src={a.url}
                              alt={a.name}
                              style={{ height: 96, borderRadius: 6, border: '1px solid var(--border)', display: 'block' }}
                            />
                          </a>
                        ),
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                      {assets.some(a => /\.mp4$/i.test(a.name))
                        ? 'Tap ⋯ on the player → Download to save it to Photos, then upload in the app.'
                        : 'Tap to open full size, then long-press to save to Photos.'}
                    </div>
                  </>
                )}

                {/* Thumb-sized controls, full width, no precision tapping */}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {p.copy && (
                    <button
                      className="btn"
                      onClick={() => copy(p.copy, p.id)}
                      style={{ flex: 1, padding: '11px 0', fontSize: 13, fontWeight: 600 }}
                    >
                      {copied === p.id ? 'Copied ✓' : 'Copy'}
                    </button>
                  )}
                  <button
                    className="btn"
                    onClick={() => setOpen(isOpen ? null : p.id)}
                    style={{ flex: '0 0 auto', padding: '11px 14px', fontSize: 13 }}
                  >
                    {isOpen ? 'Hide' : 'Open'}
                  </button>
                  <button
                    className="btn"
                    onClick={() => mark(p.id, !done)}
                    style={{
                      flex: '0 0 auto',
                      padding: '11px 14px',
                      fontSize: 13,
                      fontWeight: 600,
                      background: done ? 'transparent' : 'var(--text1)',
                      color: done ? 'var(--text3)' : '#fff',
                    }}
                  >
                    {done ? 'Undo' : 'Done'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Link href="/replies" style={{ fontSize: 13, color: 'var(--text3)' }}>
          Got a comment to answer? →
        </Link>
      </div>
    </div>
  );
}
