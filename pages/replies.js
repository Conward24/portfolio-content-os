import { useState, useEffect, useRef } from 'react';
import { BRANDS } from '../lib/constants';
import Layout from '../components/Layout';

const PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
];

const PRIORITY = {
  'reply-now': { label: 'Reply now', color: '#A32D2D' },
  'reply-today': { label: 'Reply today', color: '#B87400' },
  optional: { label: 'Optional', color: '#5B6470' },
  'do-not-reply': { label: "Don't reply", color: '#5B6470' },
};

export default function Replies() {
  const [comment, setComment] = useState('');
  const [image, setImage] = useState(null);
  const [platform, setPlatform] = useState('linkedin');
  const [brand, setBrand] = useState('henway');
  const [postId, setPostId] = useState('');
  const [posts, setPosts] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(null);
  const boxRef = useRef(null);

  // Recent + upcoming posts, so a comment can be tied to what it's replying to.
  useEffect(() => {
    fetch('/api/calendar')
      .then(r => r.json())
      .then(d => {
        const all = (d.posts || []).filter(p => p.copy);
        all.sort((a, b) => (a.date < b.date ? 1 : -1));
        setPosts(all.slice(0, 40));
      })
      .catch(() => {});
  }, []);

  // Screenshot-and-paste is the actual workflow, so make paste the primary input.
  useEffect(() => {
    function onPaste(e) {
      const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'));
      if (!item) return;
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  async function draft() {
    if (!comment.trim() && !image) {
      setErr('Paste the comment, or a screenshot of it.');
      return;
    }
    setLoading(true);
    setErr('');
    setResult(null);
    try {
      const res = await fetch('/api/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment, image, platform, brand, postId: postId || null }),
      });
      const data = await res.json();
      if (data.error) setErr(data.error);
      else setResult(data);
    } catch (e) {
      setErr('Request failed. Try again.');
    }
    setLoading(false);
  }

  function copy(text, i) {
    navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 1600);
  }

  const filteredPosts = posts.filter(p => p.brand === brand);

  return (
    <Layout title="Replies" active="replies">
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 16px 64px' }}>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>Replies</h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 0, marginBottom: 20 }}>
          Paste a comment or screenshot it and hit ⌘V anywhere on this page.
        </p>

        <div className="card mb-16">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                className="btn"
                onClick={() => setPlatform(p.id)}
                style={{
                  fontSize: 12,
                  padding: '5px 12px',
                  background: platform === p.id ? 'var(--text)' : 'transparent',
                  color: platform === p.id ? '#fff' : 'var(--text2)',
                }}
              >
                {p.label}
              </button>
            ))}
            <span style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
            {Object.keys(BRANDS).map(b => (
              <button
                key={b}
                className="btn"
                onClick={() => { setBrand(b); setPostId(''); }}
                style={{
                  fontSize: 12,
                  padding: '5px 12px',
                  background: brand === b ? (b === 'henway' ? '#c9a000' : BRANDS[b].color) : 'transparent',
                  color: brand === b ? '#fff' : 'var(--text2)',
                }}
              >
                {BRANDS[b].short}
              </button>
            ))}
          </div>

          <select
            value={postId}
            onChange={e => setPostId(e.target.value)}
            style={{ width: '100%', fontSize: 13, marginBottom: 10 }}
          >
            <option value="">Which post is it on? (optional, but makes the reply specific)</option>
            {filteredPosts.map(p => (
              <option key={p.id} value={p.id}>
                {p.date} · {p.channelLabel} · {p.title.slice(0, 60)}
              </option>
            ))}
          </select>

          <textarea
            ref={boxRef}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Paste the comment here — or just ⌘V a screenshot"
            rows={4}
            style={{ width: '100%', fontSize: 14, marginBottom: 10 }}
          />

          {image && (
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <img
                src={image}
                alt="Pasted comment screenshot"
                style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }}
              />
              <button
                className="btn"
                onClick={() => setImage(null)}
                style={{ position: 'absolute', top: 8, right: 8, fontSize: 12, padding: '4px 10px' }}
              >
                Remove
              </button>
            </div>
          )}

          <button className="btn" onClick={draft} disabled={loading} style={{ fontSize: 13 }}>
            {loading ? 'Reading it…' : 'Draft replies'}
          </button>
          {err && <span style={{ fontSize: 12, color: '#A32D2D', marginLeft: 12 }}>{err}</span>}
        </div>

        {result && (
          <>
            <div className="card mb-16">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: PRIORITY[result.priority]?.color,
                  }}
                >
                  {PRIORITY[result.priority]?.label || result.priority}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{result.intent}</span>
                {result.post && (
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                    · on “{result.post.title.slice(0, 44)}”
                  </span>
                )}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text2)' }}>{result.read}</div>
              {result.caution && (
                <div
                  style={{
                    marginTop: 12,
                    padding: '10px 12px',
                    background: '#FFF6E4',
                    border: '1px solid #FFBD59',
                    borderRadius: 6,
                    fontSize: 13,
                    color: '#6B4A00',
                  }}
                >
                  {result.caution}
                </div>
              )}
            </div>

            {result.replies.map((r, i) => (
              <div className="card mb-16" key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{r.angle}</span>
                  <button className="btn" onClick={() => copy(r.text, i)} style={{ fontSize: 12, padding: '4px 12px' }}>
                    {copied === i ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.75,
                    whiteSpace: 'pre-line',
                    padding: '12px 14px',
                    background: 'var(--bg2)',
                    borderRadius: 8,
                  }}
                >
                  {r.text}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', marginTop: 8 }}>{r.why}</div>
              </div>
            ))}

            {result.dm && (
              <div className="card mb-16" style={{ borderLeft: '3px solid #c9a000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Send this as a DM too</span>
                  <button className="btn" onClick={() => copy(result.dm, 'dm')} style={{ fontSize: 12, padding: '4px 12px' }}>
                    {copied === 'dm' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.75, whiteSpace: 'pre-line' }}>{result.dm}</div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
