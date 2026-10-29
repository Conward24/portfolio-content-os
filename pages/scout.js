import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { BRANDS } from '../lib/constants';
import scoutConfig from '../scout/config.json';

// The Scout. Posts that beat their own account's usual on Instagram and
// TikTok, found overnight by the worker on Michael's Mac
// (scripts/scout/run.mjs), each broken down into a format we can borrow.

// Parked lanes stay in scout/config.json but drop out of the page.
const LANE_LABELS = { mylua: 'MyLÚA', henway: 'Henway', mike: 'Mike', blabbing: 'Blabbing' };
const LANES = [['all', 'All'], ...scoutConfig.activeLanes.map(id => [id, LANE_LABELS[id]])];
const STATUS_TABS = [['new', 'New'], ['saved', 'Saved'], ['made', 'Made'], ['passed', 'Passed']];
const KINDS = [['all', 'All formats'], ['video', 'Video'], ['carousel', 'Carousel']];
const FIT_FLOOR = 3;

function ago(iso) {
  if (!iso) return '';
  const h = (Date.now() - Date.parse(iso)) / 3600e3;
  if (h < 1) return 'just now';
  if (h < 24) return `${Math.round(h)}h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function n(x) {
  if (x == null) return null;
  if (x >= 1e6) return `${(x / 1e6).toFixed(x >= 1e7 ? 0 : 1)}M`;
  if (x >= 1e3) return `${(x / 1e3).toFixed(x >= 1e4 ? 0 : 1)}K`;
  return String(x);
}

function Chip({ children, bg = '#F1EFE8', color = '#444441', title }) {
  return <span title={title} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: bg, color, whiteSpace: 'nowrap' }}>{children}</span>;
}
function BrandChip({ brand, score }) {
  const b = BRANDS[brand] || BRANDS.mike;
  return <Chip bg={b.colorLight} color={b.colorText} title={`Fit ${score}/5`}>{b.short} {score}/5</Chip>;
}
function Btn({ children, onClick, primary, disabled, small }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontSize: small ? 12 : 13, padding: small ? '5px 10px' : '7px 14px', borderRadius: 8, cursor: disabled ? 'default' : 'pointer',
      border: primary ? '1px solid #111' : '0.5px solid var(--border2)', background: primary ? '#111' : 'var(--bg)',
      color: primary ? '#fff' : 'var(--text)', fontWeight: 600, opacity: disabled ? 0.5 : 1,
    }}>{children}</button>
  );
}

function Media({ card }) {
  const imgs = card.slides?.length ? card.slides.map((u, i) => ({ u, label: `${i + 1}` })) : (card.frames || []).map(f => ({ u: f.url, label: `${f.t}s` }));
  return (
    <div className="scout-media">
      <a href={card.url} target="_blank" rel="noopener noreferrer">
        <img src={card.cover || imgs[0]?.u} alt="" style={{ width: '100%', aspectRatio: card.kind === 'carousel' ? '4 / 5' : '9 / 16', objectFit: 'cover', borderRadius: 10, background: '#eee', display: 'block' }} />
      </a>
      {imgs.length > 1 && (
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', marginTop: 6, paddingBottom: 2 }}>
          {imgs.map((im, i) => (
            <a key={i} href={im.u} target="_blank" rel="noopener noreferrer" style={{ flex: '0 0 auto', textAlign: 'center', textDecoration: 'none' }}>
              <img src={im.u} alt="" style={{ width: 44, height: card.kind === 'carousel' ? 55 : 78, objectFit: 'cover', borderRadius: 4, display: 'block' }} />
              <span style={{ fontSize: 9.5, color: 'var(--text3)' }}>{im.label}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, children }) {
  if (!children) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '92px 1fr', gap: 10, padding: '7px 0', borderTop: '0.5px solid var(--border2)', fontSize: 13, lineHeight: 1.5 }}>
      <span style={{ color: 'var(--text3)', fontSize: 12 }}>{label}</span>
      <span style={{ color: 'var(--text2)' }}>{children}</span>
    </div>
  );
}

function mockText(m) {
  const lines = [`${m.title} (${BRANDS[m.brand]?.name || m.brand})`, ''];
  if (m.kind === 'carousel') {
    for (const s of m.slides || []) lines.push(`SLIDE ${s.n}: ${s.headline}`, s.body || '', `  visual: ${s.visual || ''}`, '');
    if (m.designNotes) lines.push(`Design: ${m.designNotes}`, '');
  } else {
    lines.push(`Length ~${m.lengthSec}s · Voice: ${m.voice}`, ...(m.lengths ? [`Cuts: Shorts ${m.lengths.shorts}s · TikTok ${m.lengths.tiktok}s · Reels ${m.lengths.reels}s${m.lengths.plan ? ` (${m.lengths.plan})` : ''}`] : []), `HOOK: ${m.hook?.visual} | on screen: "${m.hook?.onScreen}" | spoken: "${m.hook?.spoken || ''}"`, '');
    for (const b of m.beats || []) lines.push(`${b.at}  ${b.visual}`, b.onScreen ? `   text: ${b.onScreen}` : '', b.spoken ? `   says: ${b.spoken}` : '');
    lines.push('', `Assets: ${(m.assets || []).join('; ')}`);
  }
  lines.push('', `Caption: ${m.caption}`, (m.hashtags || []).map(h => (h.startsWith('#') ? h : `#${h}`)).join(' '), `CTA: ${m.cta || ''}`);
  if (m.openQuestions?.length) lines.push('', 'CONFIRM BEFORE POSTING:', ...m.openQuestions.map(q => `- ${q}`));
  return lines.filter(l => l !== null).join('\n');
}

function Mock({ m }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(mockText(m)).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  }
  return (
    <div style={{ border: '0.5px solid var(--border2)', borderRadius: 10, padding: 14, marginTop: 12, background: 'var(--bg2, #fafafa)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{m.title} <BrandChip brand={m.brand} score="mock" /></span>
        <Btn small onClick={copy}>{copied ? 'Copied' : 'Copy all'}</Btn>
      </div>
      {m.direction && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Direction: {m.direction}</div>}
      {m.kind === 'carousel' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8, marginTop: 10 }}>
          {(m.slides || []).map(s => (
            <div key={s.n} style={{ border: '0.5px solid var(--border2)', borderRadius: 8, padding: 10, background: 'var(--bg)', fontSize: 12.5, lineHeight: 1.45 }}>
              <div style={{ fontSize: 10.5, color: 'var(--text3)' }}>Slide {s.n}</div>
              <div style={{ fontWeight: 700, margin: '3px 0' }}>{s.headline}</div>
              <div style={{ color: 'var(--text2)' }}>{s.body}</div>
              <div style={{ color: 'var(--text3)', fontSize: 11.5, marginTop: 4 }}>{s.visual}</div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12.5, color: 'var(--text3)', marginTop: 6 }}>~{m.lengthSec}s · {m.voice}{m.lengths ? ` · Shorts ${m.lengths.shorts}s, TikTok ${m.lengths.tiktok}s, Reels ${m.lengths.reels}s` : ''}</div>
          <div style={{ marginTop: 8 }}>
            {(m.beats || []).map((b, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '58px 1fr', gap: 8, padding: '6px 0', borderTop: '0.5px solid var(--border2)', fontSize: 12.5, lineHeight: 1.45 }}>
                <span style={{ fontWeight: 600 }}>{b.at}</span>
                <span>
                  <span style={{ color: 'var(--text2)' }}>{b.visual}</span>
                  {b.onScreen && <><br /><span style={{ color: 'var(--text3)' }}>Text:</span> {b.onScreen}</>}
                  {b.spoken && <><br /><span style={{ color: 'var(--text3)' }}>Says:</span> “{b.spoken}”</>}
                </span>
              </div>
            ))}
          </div>
          {m.assets?.length > 0 && <Row label="To capture">{m.assets.join(' · ')}</Row>}
        </>
      )}
      <Row label="Caption">{m.caption} <span style={{ color: 'var(--text3)' }}>{(m.hashtags || []).map(h => (h.startsWith('#') ? h : `#${h}`)).join(' ')}</span></Row>
      {m.openQuestions?.length > 0 && <Row label="Confirm first"><span style={{ color: '#8A5600' }}>{m.openQuestions.join(' · ')}</span></Row>}
    </div>
  );
}

function Card({ card, lane, onStatus, onCard }) {
  const a = card.analysis || {};
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState(lane !== 'all' ? lane : (Object.entries(a.fit || {}).sort((x, y) => (y[1]?.score || 0) - (x[1]?.score || 0))[0]?.[0] || 'henway'));
  const [direction, setDirection] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fits = Object.entries(a.fit || {}).filter(([b]) => LANE_LABELS[b] && scoutConfig.activeLanes.includes(b)).filter(([, f]) => (f?.score || 0) >= FIT_FLOOR).sort((x, y) => y[1].score - x[1].score);
  const m = card.metrics || {};
  const stats = [m.views != null && `${n(m.views)} views`, m.likes != null && `${n(m.likes)} likes`, m.comments != null && `${n(m.comments)} comments`, m.shares && `${n(m.shares)} shares`, m.saves && `${n(m.saves)} saves`].filter(Boolean).join(' · ');

  useEffect(() => { if (lane !== 'all') setBrand(lane); }, [lane]);

  async function mock() {
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/scout/mock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: card.id, brand, direction: direction.trim() || undefined }) });
      const d = await r.json();
      if (d.error) setErr(d.error); else { onCard(d.card); setOpen(true); }
    } catch { setErr('The draft failed. Try again.'); }
    setBusy(false);
  }

  return (
    <article style={{ border: '0.5px solid var(--border2)', borderRadius: 14, padding: 14, marginBottom: 14, background: 'var(--bg)' }}>
      <div className="scout-card-grid">
        <Media card={card} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
            <Chip bg="#111" color="#fff">{card.platform === 'tiktok' ? 'TikTok' : 'Instagram'}</Chip>
            <Chip>{card.kind === 'carousel' ? `Carousel · ${card.slides?.length || '?'} slides` : `Video${card.durationSec ? ` · ${card.durationSec}s` : ''}`}</Chip>
            {card.shared && <Chip bg="#E6F4FF" color="#0B5394">Shared: {card.shared}</Chip>}
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>@{card.handle} · posted {ago(card.postedAt)}</span>
          </div>
          <h3 style={{ fontSize: 17, margin: '2px 0 4px', lineHeight: 1.25 }}>{a.formatName}</h3>
          <div style={{ fontSize: 13, color: '#8A5600', fontWeight: 600 }}>{card.why?.reason}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{stats}</div>

          <div style={{ fontSize: 13.5, lineHeight: 1.5, margin: '10px 0 8px' }}>
            <span style={{ color: 'var(--text3)' }}>Hook:</span> {a.hook?.text ? `“${a.hook.text}” ` : ''}{a.hook?.spoken && a.hook.spoken !== a.hook.text ? <span style={{ color: 'var(--text2)' }}>(says: “{a.hook.spoken}”) </span> : null}
            <span style={{ color: 'var(--text2)' }}>{a.hook?.whyItStops}</span>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {fits.length ? fits.map(([b, f]) => <BrandChip key={b} brand={b} score={f.score} />) : <Chip>Low fit for every lane</Chip>}
          </div>

          {(a.ideas || []).filter(i => scoutConfig.activeLanes.includes(i.brand)).slice(0, open ? 3 : 1).map((i, k) => (
            <div key={k} style={{ fontSize: 13, lineHeight: 1.5, padding: '8px 10px', background: 'var(--bg2, #fafafa)', borderRadius: 8, marginBottom: 6 }}>
              <BrandChip brand={i.brand} score={a.fit?.[i.brand]?.score ?? '?'} /> <b>{i.title}</b>
              <div style={{ color: 'var(--text2)', marginTop: 3 }}>{i.hook} {open && <span style={{ color: 'var(--text3)' }}>{i.angle} Needs: {i.assets}. Effort: {i.effort}.</span>}</div>
            </div>
          ))}

          {open && (
            <div style={{ marginTop: 8 }}>
              <Row label="Why it worked">{(a.whyItWorked || []).map((w, i) => <div key={i}>• {w}</div>)}</Row>
              <Row label="The recipe">{a.recipe}</Row>
              <Row label="Structure">{(a.structure || []).map((s, i) => <div key={i}><b>{s.at}</b> {s.beat}</div>)}</Row>
              {a.presenter && <Row label="On camera">{a.presenter}</Row>}
              <Row label="Pacing">{a.pacing}</Row>
              <Row label="Text">{a.textStyle}</Row>
              <Row label="Audio">{a.audio}</Row>
              <Row label="CTA">{a.cta}</Row>
              <Row label="Careful">{a.cautions?.length ? a.cautions.join(' · ') : null}</Row>
              <Row label="Caption">{card.caption ? <span style={{ whiteSpace: 'pre-wrap' }}>{card.caption.slice(0, 600)}</span> : null}</Row>
              {card.transcript && <Row label="Transcript"><details><summary style={{ cursor: 'pointer', color: 'var(--text3)' }}>show</summary><pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 12, margin: '6px 0 0' }}>{card.transcript}</pre></details></Row>}
              <Row label="Found">{card.source === 'shared' ? 'Shared with you' : `${card.source} ${card.sourceDetail || ''} · ${card.lane} lane`} · scouted {ago(card.createdAt)}</Row>
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
            <select value={brand} onChange={e => setBrand(e.target.value)} style={{ fontSize: 13, padding: '6px 8px', borderRadius: 8, border: '0.5px solid var(--border2)' }}>
              {LANES.slice(1).map(([id, label]) => <option key={id} value={id}>{label}{a.fit?.[id] ? ` (${a.fit[id].score}/5)` : ''}</option>)}
            </select>
            <input value={direction} onChange={e => setDirection(e.target.value)} placeholder="Direction (optional)" style={{ fontSize: 13, padding: '6px 10px', borderRadius: 8, border: '0.5px solid var(--border2)', flex: '1 1 160px', minWidth: 0 }} />
            <Btn primary onClick={mock} disabled={busy}>{busy ? 'Drafting… (~1 min)' : 'Mock it'}</Btn>
          </div>
          {err && <div style={{ color: '#a33', fontSize: 12.5, marginTop: 6 }}>{err}</div>}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            <Btn small onClick={() => setOpen(o => !o)}>{open ? 'Less' : 'Full breakdown'}</Btn>
            {card.status !== 'saved' && <Btn small onClick={() => onStatus(card, 'saved')}>Save</Btn>}
            {card.status !== 'made' && <Btn small onClick={() => onStatus(card, 'made')}>We made one</Btn>}
            {card.status !== 'passed' && <Btn small onClick={() => onStatus(card, 'passed')}>Pass</Btn>}
            {card.status !== 'new' && <Btn small onClick={() => onStatus(card, 'new')}>Back to new</Btn>}
            <a href={card.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, alignSelf: 'center', color: 'var(--text3)' }}>Open original ↗</a>
          </div>

          {(card.mocks || []).map((mk, i) => <Mock key={mk.createdAt || i} m={mk} />)}
        </div>
      </div>
    </article>
  );
}

function Health({ meta, count }) {
  if (!meta) return <div style={{ fontSize: 13, color: '#a33' }}>The worker hasn't run yet.</div>;
  const hours = (Date.now() - Date.parse(meta.at)) / 3600e3;
  const notes = [];
  if (hours > 36) notes.push({ bad: true, t: `Last run ${ago(meta.at)}. The Mac may have been off; it catches up when it wakes.` });
  if (meta.sources && !meta.sources.apify) notes.push({ t: 'Instagram is off until the Apify key is in ~/scout/.env (TikTok runs on the free path, which is patchy).' });
  if (meta.sources?.messages === 'needs Full Disk Access') notes.push({ t: 'Links texted to you are not being read yet: give node Full Disk Access (see the Scout README).' });
  return (
    <div style={{ fontSize: 12.5, color: 'var(--text3)', lineHeight: 1.6 }}>
      Last run {ago(meta.at)} · {meta.made} new card{meta.made === 1 ? '' : 's'} · {count} in the feed{meta.apifyUsd ? ` · scraping $${meta.apifyUsd.toFixed(2)}` : ''}{meta.errors?.length ? ` · ${meta.errors.length} issue${meta.errors.length === 1 ? '' : 's'}` : ''}
      {notes.map((x, i) => <div key={i} style={{ color: x.bad ? '#a33' : '#8A5600' }}>{x.t}</div>)}
      {meta.errors?.length > 0 && <details><summary style={{ cursor: 'pointer' }}>issues</summary>{meta.errors.map((e, i) => <div key={i} style={{ fontSize: 11.5 }}>{e}</div>)}</details>}
    </div>
  );
}

export default function Scout() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [lane, setLane] = useState('all');
  const [status, setStatus] = useState('new');
  const [kind, setKind] = useState('all');
  const [lowFit, setLowFit] = useState(false);
  const [link, setLink] = useState('');
  const [linkMsg, setLinkMsg] = useState('');

  useEffect(() => {
    try { const l = localStorage.getItem('scout.lane'); if (l) setLane(l); } catch {}
    fetch('/api/scout/feed').then(r => r.json()).then(d => (d.error ? setError(d.error) : setData(d))).catch(() => setError('Could not load the Scout feed.'));
  }, []);

  function pickLane(l) { setLane(l); try { localStorage.setItem('scout.lane', l); } catch {} }
  function replace(card) { setData(prev => ({ ...prev, cards: prev.cards.map(c => (c.id === card.id ? card : c)) })); }
  async function onStatus(card, s) {
    replace({ ...card, status: s, statusAt: new Date().toISOString() });
    await fetch('/api/scout/feed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: card.id, status: s }) });
  }
  async function addLink(e) {
    e.preventDefault();
    setLinkMsg('');
    const r = await fetch('/api/scout/inbox', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: link, source: 'paste box' }) });
    const d = await r.json();
    if (d.error) setLinkMsg(d.error); else { setLink(''); setLinkMsg('Queued. It shows up here after the next inbox check (every 30 minutes while the Mac is awake).'); }
  }

  const cards = useMemo(() => {
    if (!data) return [];
    let xs = data.cards.filter(c => (c.status || 'new') === status);
    if (kind !== 'all') xs = xs.filter(c => (kind === 'carousel' ? c.kind === 'carousel' || c.kind === 'image' : c.kind === 'video'));
    if (lane !== 'all') {
      xs = xs.filter(c => lowFit || (c.analysis?.fit?.[lane]?.score || 0) >= FIT_FLOOR);
      xs = [...xs].sort((a, b) => (b.shared ? 1 : 0) - (a.shared ? 1 : 0) || (b.analysis?.fit?.[lane]?.score || 0) - (a.analysis?.fit?.[lane]?.score || 0) || Date.parse(b.createdAt) - Date.parse(a.createdAt));
    } else if (!lowFit) {
      xs = xs.filter(c => c.shared || scoutConfig.activeLanes.some(l => (c.analysis?.fit?.[l]?.score || 0) >= FIT_FLOOR));
    }
    return xs;
  }, [data, lane, status, kind, lowFit]);

  const counts = useMemo(() => Object.fromEntries(STATUS_TABS.map(([s]) => [s, data ? data.cards.filter(c => (c.status || 'new') === s).length : 0])), [data]);

  return (
    <Layout title="Scout" active="scout">
      <div className="page-header">
        <span className="page-title">Scout</span>
      </div>
      <div className="page-body" style={{ maxWidth: 980 }}>
        <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.6, margin: '0 0 8px' }}>
          Posts that beat their own account's usual on Instagram and TikTok, found overnight and broken down into a format we can borrow.
          Borrow the format, never the content. <b>Mock it</b> drafts our version for a lane; Save and Pass teach it your taste.
        </p>
        {data && <Health meta={data.meta} count={data.cards.length} />}

        <form onSubmit={addLink} style={{ display: 'flex', gap: 6, margin: '14px 0 4px', flexWrap: 'wrap' }}>
          <input value={link} onChange={e => setLink(e.target.value)} placeholder="Someone sent you one? Paste the Instagram or TikTok link" style={{ flex: '1 1 260px', minWidth: 0, fontSize: 13.5, padding: '8px 12px', borderRadius: 8, border: '0.5px solid var(--border2)' }} />
          <Btn primary disabled={!link.trim()}>Add</Btn>
        </form>
        {linkMsg && <div style={{ fontSize: 12.5, color: 'var(--text3)' }}>{linkMsg}</div>}

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '16px 0 8px' }}>
          {LANES.map(([id, label]) => (
            <button key={id} onClick={() => pickLane(id)} style={{
              fontSize: 13, padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
              border: lane === id ? '1.5px solid #111' : '0.5px solid var(--border2)',
              background: lane === id ? '#F1EFE8' : 'var(--bg)', color: 'var(--text)', fontWeight: lane === id ? 600 : 400,
            }}>{label}</button>
          ))}
        </div>
        <div className="scout-filters" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18, fontSize: 13 }}>
          {STATUS_TABS.map(([id, label]) => (
            <button key={id} onClick={() => setStatus(id)} style={{ background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', fontSize: 13, color: status === id ? 'var(--text)' : 'var(--text3)', fontWeight: status === id ? 700 : 400, borderBottom: status === id ? '2px solid #111' : '2px solid transparent' }}>
              {label} {counts[id] ? `(${counts[id]})` : ''}
            </button>
          ))}
          <select value={kind} onChange={e => setKind(e.target.value)} style={{ fontSize: 12.5, padding: '4px 6px', borderRadius: 6, border: '0.5px solid var(--border2)' }}>
            {KINDS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
          <label style={{ fontSize: 12.5, color: 'var(--text3)', display: 'flex', gap: 4, alignItems: 'center' }}>
            <input type="checkbox" checked={lowFit} onChange={e => setLowFit(e.target.checked)} /> show low fit
          </label>
        </div>

        {error && <div style={{ color: '#a33', fontSize: 13 }}>{error}</div>}
        {!data && !error && <div style={{ color: 'var(--text3)', fontSize: 13 }}>Loading…</div>}
        {data && !cards.length && <div style={{ color: 'var(--text3)', fontSize: 13.5, padding: '24px 0' }}>Nothing here{lane !== 'all' ? ` for ${LANES.find(l => l[0] === lane)[1]}` : ''} yet. The worker runs Sunday mornings.</div>}
        {cards.map(c => <Card key={c.id} card={c} lane={lane} onStatus={onStatus} onCard={replace} />)}
      </div>
      <style jsx>{`
        :global(.scout-card-grid) { display: grid; grid-template-columns: 170px 1fr; gap: 16px; }
        :global(.scout-card-grid select) { width: auto; }
        :global(.scout-filters select) { width: auto; }
        @media (max-width: 768px) { :global(.scout-card-grid) { grid-template-columns: 1fr; } :global(.scout-media) { max-width: 200px; } }
      `}</style>
    </Layout>
  );
}
