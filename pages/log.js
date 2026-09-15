// ─────────────────────────────────────────────────────────────────
// "I posted this."
//
// For posts written outside the system. Paste the copy, say when it went out,
// and it lands in the calendar already marked posted — which is what /today
// and /replies both read from. After logging, the reply drafter can pull this
// post as context instead of guessing from the comment alone.
// ─────────────────────────────────────────────────────────────────

import { useState } from 'react';
import Link from 'next/link';
import { BRANDS } from '../lib/constants';
import Layout from '../components/Layout';

const CHANNELS = [
  { id: 'mike_personal', label: "Michael's personal profile" },
  { id: 'mylua_company', label: 'MyLÚA Health company page' },
  { id: 'henway_company', label: 'Henway company page' },
  { id: 'blabbing_company', label: 'Blabbing company page' },
];

const PLATFORMS = ['LinkedIn Feed', 'Instagram Feed', 'Instagram Story', 'TikTok', 'X', 'Other'];

// Local, never toISOString(). In Eastern that reports tomorrow all evening,
// which files an evening post under the wrong day and hides it from /today.
const pad = n => String(n).padStart(2, '0');
const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const localTime = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default function LogPost() {
  const [copy, setCopy] = useState('');
  const [brand, setBrand] = useState('mylua');
  const [channel, setChannel] = useState('mike_personal');
  const [platform, setPlatform] = useState('LinkedIn Feed');
  const [date, setDate] = useState(localDate());
  const [time, setTime] = useState(localTime());
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!copy.trim()) { setErr('Paste the post copy. The reply drafter needs it for context.'); return; }
    setLoading(true); setErr(''); setSaved(null);
    try {
      const postedAt = new Date(`${date}T${time || '12:00'}:00`).toISOString();
      const r = await fetch('/api/log-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          copy, brand, channel, platform, date, time, postedAt,
          channelLabel: CHANNELS.find(c => c.id === channel)?.label,
          note: note || null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to log');
      setSaved(d);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout active="log">
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 4px' }}>
        <h1 style={{ fontFamily: 'Raleway, sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
          I posted this
        </h1>
        <p style={{ color: '#5B6470', fontSize: 14, marginBottom: 24, lineHeight: 1.55 }}>
          For anything written outside this system. It gets filed in the calendar as already posted,
          so <strong>Today</strong> starts its engagement check-in windows and <strong>Replies</strong>
          can use it as context when drafting.
        </p>

        {saved && (
          <div style={{
            border: '1px solid #1E7A54', background: '#EDF7F2', borderRadius: 8,
            padding: '14px 16px', marginBottom: 20, fontSize: 14, lineHeight: 1.6,
          }}>
            <strong>{saved.duplicate ? 'Already logged.' : 'Logged and marked posted.'}</strong>{' '}
            {saved.duplicate && 'Same copy, same day, so this is the existing entry rather than a duplicate. '}
            Now go to{' '}
            <Link href="/replies" style={{ color: '#1E7A54', fontWeight: 600 }}>Replies</Link>{' '}
            and pick it from the post dropdown, or{' '}
            <Link href="/today" style={{ color: '#1E7A54', fontWeight: 600 }}>Today</Link>{' '}
            to see the check-in windows.
          </div>
        )}

        <label style={lbl}>The post, exactly as published</label>
        <textarea
          value={copy} onChange={e => setCopy(e.target.value)} rows={14}
          placeholder="Paste the full copy, hashtags included."
          style={{ ...input, fontFamily: 'Inter, sans-serif', lineHeight: 1.6, resize: 'vertical' }}
        />
        <div style={{ fontSize: 12, color: '#8A929C', marginTop: 4, marginBottom: 18 }}>
          {copy.length.toLocaleString()} characters
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={lbl}>Brand</label>
            <select value={brand} onChange={e => setBrand(e.target.value)} style={input}>
              {Object.entries(BRANDS).map(([k, b]) => (
                <option key={k} value={k}>{b.short || b.name || k}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Posted where</label>
            <select value={channel} onChange={e => setChannel(e.target.value)} style={input}>
              {CHANNELS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Platform</label>
            <select value={platform} onChange={e => setPlatform(e.target.value)} style={input}>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={input} />
            </div>
            <div>
              <label style={lbl}>Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} style={input} />
            </div>
          </div>
        </div>

        <label style={{ ...lbl, marginTop: 18 }}>Note to self (optional)</label>
        <input
          value={note} onChange={e => setNote(e.target.value)} style={input}
          placeholder="e.g. carries the Care Recommendation Agent demo video"
        />

        {err && <div style={{ color: '#A32D2D', fontSize: 14, marginTop: 14 }}>{err}</div>}

        <button
          onClick={submit} disabled={loading}
          style={{
            marginTop: 22, padding: '13px 26px', borderRadius: 8, border: 'none',
            background: loading ? '#8A929C' : '#111', color: '#fff',
            fontSize: 15, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Logging…' : 'Log it and mark posted'}
        </button>
      </div>
    </Layout>
  );
}

const lbl = {
  display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '.06em',
  textTransform: 'uppercase', color: '#5B6470', marginBottom: 6,
};
const input = {
  width: '100%', padding: '11px 13px', borderRadius: 8,
  border: '1px solid #D8DDE3', fontSize: 14, background: '#fff',
  fontFamily: 'Inter, sans-serif',
};
