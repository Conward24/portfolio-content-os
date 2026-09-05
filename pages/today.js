import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { BRANDS, labelColors } from '../lib/constants';

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

/**
 * Engagement check-ins, computed from when he ACTUALLY posted rather than when
 * it was scheduled, so the windows are right even when he posts late.
 *
 * LinkedIn decides how far a post travels on the first 60-90 minutes. Replies
 * inside that window are worth roughly a third more visibility, a reply within
 * 15 minutes of a comment lands hardest, and comments carry 8-15x the weight of
 * a like. The useful shape is therefore three short sweeps and then stop, not
 * grazing the notifications all day.
 */
const WINDOWS = [
  { at: 15, label: 'Reply now', note: 'Highest-leverage sweep. Answer everything, ask something back.' },
  { at: 45, label: 'Second sweep', note: 'Still inside the golden hour.' },
  { at: 90, label: 'Last call', note: 'Golden hour closing. After this you can leave it.' },
];

function engagementState(postedAt, now) {
  const t0 = new Date(postedAt).getTime();
  const mins = Math.floor((now - t0) / 60000);
  if (mins > 150) return null;                       // long done, stop nagging
  const next = WINDOWS.find(w => mins < w.at);
  const due = WINDOWS.filter(w => mins >= w.at).length;
  return {
    mins,
    due,
    next,
    closesIn: Math.max(0, 90 - mins),
    open: mins <= 90,
  };
}

/** 07:30 → 7:30am. Reads faster than 24h on a glance. */
function niceTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h < 12 ? 'am' : 'pm';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${ampm}`;
}

/**
 * Resolve a post's assets.
 *
 * An explicit `assets: ["filename.png"]` on the post wins. Everything else falls
 * back to the naming conventions the library was seeded with, which only work
 * for the bulk Henway sets — a one-off asset like a conference tile matches
 * nothing, and the alternative (bending the filename to fit a convention) makes
 * the filename carry meaning it should not have to.
 */
function matchAssets(post, photos) {
  if (Array.isArray(post.assets) && post.assets.length) {
    const named = post.assets.map(n => photos.find(p => p.name === n)).filter(Boolean);
    if (named.length) return named;
  }
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
  const [saving, setSaving] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  // The engagement windows are time-sensitive by definition, so the screen has to
  // move on its own rather than showing whatever was true when it loaded.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

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

  /**
   * Get an asset onto the phone.
   *
   * iOS Safari has no download affordance on a <video> element, and the
   * `download` attribute is ignored on a cross-origin URL, so tapping a blob
   * link just navigates and plays it. The route that actually works is the Web
   * Share API with a File: it opens the native sheet, which offers "Save Video"
   * straight to Photos and shares directly into TikTok or Instagram.
   *
   * Fetching is possible because the blob store sends access-control-allow-origin: *.
   * Falls back to an object-URL download, where `download` IS honoured because
   * blob: counts as same-origin.
   */
  async function saveAsset(asset) {
    setSaving(asset.id);
    try {
      const res = await fetch(asset.url);
      const blob = await res.blob();
      const file = new File([blob], asset.name, { type: blob.type });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const href = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = href;
        a.download = asset.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(href), 30000);
      }
    } catch (e) {
      // AbortError just means he dismissed the share sheet, which is not a failure.
      if (e?.name !== 'AbortError') window.open(asset.url, '_blank');
    }
    setSaving(null);
  }

  const t = todayStr();
  // Nothing before the schedule starts, and missed items only from the last 3 days —
  // a week of guilt on the top of the screen is not useful in a queue.
  // Local, not toISOString(). Grouping used local dates while the window used UTC
  // ones, so every evening past ~8pm Eastern the two disagreed by a day.
  const shift = n => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const from = shift(-3);
  const to = shift(3);
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
                  background: 'var(--bg)',
                  zIndex: 2,
                }}
              >
                {dayLabel(date)}
              </div>

              {groups[date].map(p => {
                const done = Boolean(posted[p.id]);
                const assets = matchAssets(p, photos);
                const isOpen = open === p.id;
                // EMAIL (a Kit send) keeps its own colour whatever the brand; everything else is brand-coloured.
                const badge = labelColors(p.channelLabel) || BADGE[p.brand] || { bg: 'var(--text3)', fg: '#fff' };
                const hasVideo = assets.some(a => /\.mp4$/i.test(a.name));
                const isCamera = p.kind === 'camera' || Boolean(p.script);

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
                      {p.channel ? (
                        <span style={{ fontSize: 11, color: 'var(--text3)', flex: '0 0 auto', marginTop: 2, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.channel}
                        </span>
                      ) : null}
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
                        <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span>
                            {niceTime(p.time)}
                            {assets.length > 0 && ` · ${assets.length} ${hasVideo ? 'video' : 'image'}${assets.length > 1 ? 's' : ''}`}
                          </span>
                          {isCamera && (
                            <span style={{
                              fontSize: 9.5, fontWeight: 700, letterSpacing: '.04em', padding: '2px 6px', borderRadius: 4,
                              background: '#FFF4D6', color: '#7A5A00', border: '0.5px solid #F0D48A',
                            }}>🎥 camera</span>
                          )}
                        </div>
                      </div>
                      <span style={{ color: 'var(--text3)', fontSize: 12, flex: '0 0 auto', marginTop: 3 }}>
                        {isOpen ? '▴' : '▾'}
                      </span>
                    </div>

                    {done && (() => {
                      const e = engagementState(posted[p.id], now);
                      if (!e) return null;
                      return (
                        <div style={{
                          margin: '0 14px 12px', padding: '10px 12px', borderRadius: 8,
                          background: e.open ? '#F0F7F2' : 'var(--bg2)',
                          border: `1px solid ${e.open ? '#3FA46A' : 'var(--border)'}`,
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: e.open ? '#2C7A4B' : 'var(--text3)', marginBottom: 3 }}>
                            {e.open
                              ? `Golden hour · ${e.closesIn} min left`
                              : 'Golden hour closed'}
                          </div>
                          <div style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.55 }}>
                            {e.next
                              ? `Check-in ${e.due + 1} of 3 at +${e.next.at} min. ${e.next.note}`
                              : 'All three check-ins done. Late comments still worth answering, just not urgent.'}
                          </div>
                        </div>
                      );
                    })()}

                    {isOpen && (
                      <div style={{ padding: '0 14px 14px' }}>
                        {/* Script first: he films before he captions. */}
                        {p.script && (
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.09em', color: '#7A5A00' }}>🎥 ON CAMERA · SAY THIS</span>
                              <button
                                className="btn"
                                onClick={() => copy(p.script, `${p.id}:script`)}
                                style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600 }}
                              >
                                {copied === `${p.id}:script` ? 'Copied ✓' : 'Copy script'}
                              </button>
                            </div>
                            <div
                              style={{
                                fontSize: 15,
                                lineHeight: 1.7,
                                whiteSpace: 'pre-line',
                                background: '#FFFBEA',
                                border: '1px solid #F0D48A',
                                borderLeft: '4px solid #FFCC00',
                                borderRadius: 8,
                                padding: '12px 13px',
                              }}
                            >
                              {p.script}
                            </div>
                          </div>
                        )}
                        {p.script && p.copy && (
                          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.09em', color: 'var(--text3)', marginBottom: 5 }}>CAPTION</div>
                        )}
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
                        {p.firstComment && (
                          <div style={{ marginTop: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.09em', color: 'var(--text3)' }}>FIRST COMMENT</span>
                              <button
                                className="btn"
                                onClick={() => copy(p.firstComment, `${p.id}:firstComment`)}
                                style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600 }}
                              >
                                {copied === `${p.id}:firstComment` ? 'Copied ✓' : 'Copy'}
                              </button>
                            </div>
                            <div style={{ fontSize: 13.5, lineHeight: 1.6, whiteSpace: 'pre-line', background: 'var(--bg2)', borderRadius: 8, padding: '10px 13px' }}>
                              {p.firstComment}
                            </div>
                          </div>
                        )}
                        {p.notes && (
                          <div style={{ marginTop: 10, fontSize: 12.5, lineHeight: 1.55, color: 'var(--text2)', whiteSpace: 'pre-line' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text3)', letterSpacing: '.06em', fontSize: 10.5 }}>NOTES · </span>
                            {p.notes}
                          </div>
                        )}

                        {assets.length > 0 && (
                          <>
                            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginTop: 10, paddingBottom: 2 }}>
                              {assets.map(a => {
                                const isVid = /\.mp4$/i.test(a.name);
                                return (
                                  <div key={a.id} style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {isVid ? (
                                      <video
                                        src={a.url}
                                        controls
                                        playsInline
                                        preload="metadata"
                                        style={{ height: 190, borderRadius: 8, background: '#000', display: 'block' }}
                                      />
                                    ) : (
                                      <img
                                        src={a.url}
                                        alt={a.name}
                                        style={{ height: 190, borderRadius: 8, border: '1px solid var(--border)', display: 'block' }}
                                      />
                                    )}
                                    {/* The only reliable way onto an iPhone: the native share
                                        sheet, which offers Save to Photos and posts straight
                                        into TikTok or Instagram. */}
                                    <button
                                      className="btn"
                                      onClick={() => saveAsset(a)}
                                      disabled={saving === a.id}
                                      style={{ padding: '10px 0', fontSize: 13, fontWeight: 600, width: '100%' }}
                                    >
                                      {saving === a.id ? 'Preparing…' : isVid ? 'Save video' : 'Save image'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 7 }}>
                              Save opens the share sheet. Choose Save to Photos, or send it
                              straight to TikTok or Instagram.
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
