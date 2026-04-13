import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { BRANDS, SENTIMENT_TYPES, PLATFORM_SIZES } from '../lib/constants';
import { getTemplatesForBrand } from '../lib/renderGraphic';

const PLATFORMS = Object.keys(PLATFORM_SIZES);

// Channel definitions — who posts what and when
const CHANNELS = {
  mike_personal: {
    id: 'mike_personal',
    label: 'Mike Personal',
    sub: 'linkedin.com/in/michaelconward',
    note: 'Primary engine. 8x more reach than company pages.',
    bestDays: ['Tue', 'Wed', 'Thu', 'Fri'],
    bestTimes: ['7:00 AM', '8:00 AM', '9:00 AM', '5:00 PM', '6:00 PM'],
    weeklyMax: 5,
    color: '#888780',
  },
  mylua_company: {
    id: 'mylua_company',
    label: 'MyLÚA Company Page',
    sub: 'linkedin.com/company/myluahealth',
    note: 'Never copy Mike\'s exact caption. Different frame, same signal.',
    bestDays: ['Mon', 'Wed', 'Fri'],
    bestTimes: ['8:00 AM', '9:00 AM', '10:00 AM'],
    weeklyMax: 3,
    color: '#2C4D45',
  },
  henway_company: {
    id: 'henway_company',
    label: 'Henway Company Page',
    sub: 'linkedin.com/company/henway',
    note: 'Early stage — 2x/week is enough. Tue + Thu.',
    bestDays: ['Tue', 'Thu'],
    bestTimes: ['8:00 AM', '9:00 AM'],
    weeklyMax: 2,
    color: '#c9a000',
  },
  blabbing_company: {
    id: 'blabbing_company',
    label: 'Blabbing Company Page',
    sub: 'linkedin.com/company/blabbing',
    note: 'Proof loop posts perform Mon AM. Signal cards mid-week.',
    bestDays: ['Mon', 'Wed', 'Fri'],
    bestTimes: ['7:00 AM', '8:00 AM', '9:00 AM'],
    weeklyMax: 3,
    color: '#5e17eb',
  },
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function getNextWeekday(dayName, afterDate = new Date()) {
  const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 };
  const target = dayMap[dayName];
  const d = new Date(afterDate);
  const current = d.getDay(); // 0=Sun
  let daysAhead = target - current;
  if (daysAhead <= 0) daysAhead += 7;
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

function getDayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
}

export default function Staging() {
  const router = useRouter();
  const [drafts, setDrafts] = useState([]);
  const [meta, setMeta] = useState({});
  const [idx, setIdx] = useState(0);
  const [platform, setPlatform] = useState('LinkedIn Feed');
  const [template, setTemplate] = useState('');
  const [copy, setCopy] = useState('');
  const [channel, setChannel] = useState('mike_personal');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [approved, setApproved] = useState([]);
  const [weekPosts, setWeekPosts] = useState([]);
  const [showStrategy, setShowStrategy] = useState(false);
  const [hashtags, setHashtags] = useState([]);
  const [newHashtag, setNewHashtag] = useState('');
  const [graphicUrl, setGraphicUrl] = useState(null);
  const [graphicLoading, setGraphicLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('drafts');
    const rawMeta = sessionStorage.getItem('draftMeta');
    if (!raw) { router.push('/'); return; }
    const d = JSON.parse(raw);
    const m = rawMeta ? JSON.parse(rawMeta) : {};
    setDrafts(d);
    setMeta(m);
    setCopy(d[0]?.copy || '');
    const templates = getTemplatesForBrand(m.brand || 'mylua');
    setTemplate(templates[0]?.id || '');
    // Set smart channel default based on brand
    const defaultChannel = m.brand === 'blabbing' ? 'blabbing_company'
      : m.brand === 'henway' ? 'mike_personal'
      : 'mike_personal';
    setChannel(defaultChannel);
    // Set smart date default
    const ch = CHANNELS[defaultChannel];
    const nextDate = getNextWeekday(ch.bestDays[1] || ch.bestDays[0]);
    setScheduleDate(nextDate);
    setScheduleTime(ch.bestTimes[0]);
    loadWeekPosts();
  }, []);

  const [graphicUrl, setGraphicUrl] = useState(null);
  const [graphicLoading, setGraphicLoading] = useState(false);

  useEffect(() => {
    if (!drafts[idx]) return;
    const draftCopy = drafts[idx].copy || '';
    setCopy(draftCopy);
    const extracted = extractHashtags(draftCopy);
    setHashtags(extracted);
  }, [idx]);

  useEffect(() => {
    if (!copy) return;
    const withoutHashtags = stripHashtags(copy);
    const hashtagLine = hashtags.length ? '\n' + hashtags.join(' ') : '';
    const synced = withoutHashtags.trimEnd() + hashtagLine;
    if (synced !== copy) setCopy(synced);
  }, [hashtags]);

  // Render graphic via server-side API (real fonts, production quality)
  useEffect(() => {
    if (!meta.brand || !template) return;
    const timer = setTimeout(async () => {
      setGraphicLoading(true);
      try {
        const lines = copy.split('\n').filter(Boolean);
        const quote = lines.find(l => l.length > 30 && l.length < 150) || lines[0] || '';
        const res = await fetch('/api/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand: meta.brand,
            template,
            data: {
              headline: lines[0] || 'MyLÚA Health',
              subhead: lines[1] || '',
              quote: quote.replace(/['"]/g, ''),
              attribution: 'Mother, Pilot User',
              stat: '90%+',
              statLabel: 'first-trimester PPD risk accuracy',
              eventLabel: 'Black Maternal Health Week 2026',
              contextLabel: 'Black Maternal Health Week 2026',
            }
          }),
        });
        const data = await res.json();
        if (data.image) setGraphicUrl(data.image);
      } catch (e) {
        console.error('Render error:', e);
      }
      setGraphicLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [template, meta.brand]);

  async function loadWeekPosts() {
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      setWeekPosts(data.posts || []);
    } catch (e) {}
  }

  // Count how many posts this channel has this week
  function getChannelWeekCount(channelId) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return weekPosts.filter(p => {
      if (p.channel !== channelId) return false;
      const d = new Date(p.date);
      return d >= startOfWeek && d <= endOfWeek;
    }).length;
  }

  function getChannelStatus(channelId) {
    const ch = CHANNELS[channelId];
    const count = getChannelWeekCount(channelId);
    const pct = count / ch.weeklyMax;
    if (pct >= 1) return { label: 'Full this week', color: '#A32D2D' };
    if (pct >= 0.6) return { label: `${count}/${ch.weeklyMax} this week`, color: '#BA7517' };
    return { label: `${count}/${ch.weeklyMax} this week`, color: '#1D9E75' };
  }

  function getSmartDayRecommendation() {
    const ch = CHANNELS[channel];
    const selectedDay = scheduleDate ? getDayOfWeek(scheduleDate) : null;
    if (!selectedDay) return null;
    if (!ch.bestDays.includes(selectedDay)) {
      return { type: 'warning', text: `${selectedDay} isn't ideal for ${ch.label}. Best days: ${ch.bestDays.join(', ')}.` };
    }
    const count = getChannelWeekCount(channel);
    if (count >= CHANNELS[channel].weeklyMax) {
      return { type: 'warning', text: `${ch.label} is at its weekly max (${ch.weeklyMax} posts). Consider bumping a lower-priority post.` };
    }
    return { type: 'ok', text: `Good slot. ${ch.bestDays.includes(selectedDay) ? selectedDay + ' is a strong day for this channel.' : ''}` };
  }

  // Hashtag helpers
  function extractHashtags(text) {
    const matches = text.match(/#[A-Za-z][A-Za-z0-9]*/g) || [];
    return [...new Set(matches)];
  }

  function stripHashtags(text) {
    return text.replace(/#[A-Za-z][A-Za-z0-9]*/g, '').replace(/\n+$/, '').trimEnd();
  }

  function removeHashtag(tag) {
    setHashtags(prev => prev.filter(h => h !== tag));
  }

  function addHashtag() {
    if (!newHashtag.trim()) return;
    let tag = newHashtag.trim();
    if (!tag.startsWith('#')) tag = '#' + tag;
    // PascalCase it
    tag = '#' + tag.slice(1).charAt(0).toUpperCase() + tag.slice(2);
    if (!hashtags.includes(tag)) setHashtags(prev => [...prev, tag]);
    setNewHashtag('');
  }

  async function approve() {
    if (!scheduleDate) { alert('Pick a date.'); return; }
    if (!scheduleTime) { alert('Pick a time slot.'); return; }
    setSaving(true);
    try {
      await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `post-${Date.now()}-${idx}`,
          brand: meta.brand,
          copy,
          platform,
          template,
          channel,
          channelLabel: CHANNELS[channel]?.label,
          date: scheduleDate,
          time: scheduleTime,
          type: meta.postType,
          sentiment: meta.sentiment || null,
          title: copy.split('\n')[0].slice(0, 60),
        }),
      });
      setApproved(prev => [...prev, idx]);
      await loadWeekPosts();
      if (idx < drafts.length - 1) setIdx(idx + 1);
      else router.push('/calendar');
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  function skip() {
    if (idx < drafts.length - 1) setIdx(idx + 1);
    else router.push('/calendar');
  }

  function downloadGraphic() {
    if (!graphicUrl) return;
    const a = document.createElement('a');
    a.href = graphicUrl;
    a.download = `${meta.brand}-${template}-${Date.now()}.png`;
    a.click();
  }

  if (!drafts.length) return <Layout title="Staging" active="staging"><div className="page-body">Loading...</div></Layout>;

  const draft = drafts[idx];
  const b = BRANDS[meta.brand] || BRANDS.mylua;
  const templates = getTemplatesForBrand(meta.brand);
  const isApproved = approved.includes(idx);
  const ch = CHANNELS[channel];
  const rec = getSmartDayRecommendation();
  const status = getChannelStatus(channel);

  return (
    <Layout title="Staging" active="staging">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="page-title">Review post {idx + 1} of {drafts.length}</span>
          <span className={`brand-badge badge-${meta.brand}`}>{b.name}</span>
          {meta.sentiment && <span className={`stag stag-${meta.sentiment}`}>{SENTIMENT_TYPES[meta.sentiment]?.name}</span>}
        </div>
        <button
          onClick={() => setShowStrategy(!showStrategy)}
          style={{ fontSize: 12, padding: '5px 12px', borderRadius: 7, border: '0.5px solid var(--border2)', background: showStrategy ? 'var(--bg3)' : 'var(--bg)', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text2)' }}
        >
          {showStrategy ? 'Hide' : 'Show'} scheduling guide
        </button>
      </div>

      {/* Inline scheduling strategy panel */}
      {showStrategy && (
        <div style={{ margin: '0 28px 20px', background: '#fffbe6', border: '0.5px solid #FAC775', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7a5f00', marginBottom: 12, letterSpacing: '0.05em' }}>SCHEDULING STRATEGY — DON'T FORGET</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
            {Object.values(CHANNELS).map(c => (
              <div key={c.id} style={{ background: 'white', borderRadius: 8, padding: '10px 12px', border: '0.5px solid #FAC775' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{c.label}</span>
                </div>
                <div style={{ fontSize: 11, color: '#7a5f00', marginBottom: 3 }}>Best days: <strong>{c.bestDays.join(', ')}</strong></div>
                <div style={{ fontSize: 11, color: '#7a5f00', marginBottom: 3 }}>Max/week: <strong>{c.weeklyMax} posts</strong></div>
                <div style={{ fontSize: 11, color: '#888', lineHeight: 1.5 }}>{c.note}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#7a5f00', lineHeight: 1.8, borderTop: '0.5px solid #FAC775', paddingTop: 10 }}>
            <strong>Weekly rhythm:</strong> Mon — MyLÚA + Blabbing company pages · Tue — Mike personal + Henway company · Wed — Mike personal + MyLÚA company · Thu — Mike personal + Henway company · Fri — MyLÚA + Blabbing company pages<br />
            <strong>When news breaks:</strong> Mike personal within 4hrs (sentiment post) → company page echoes within 24hrs → bump lowest-priority planned post (usually Systems Thinking or Founder Lens)<br />
            <strong>Company pages:</strong> Never copy Mike's exact caption. Different frame, same signal. Always reference/link back to Mike's post or IBM case study.<br />
            <strong>Best times:</strong> 7–9am ET or 5–6pm ET · External links always go in first comment, never caption body
          </div>
        </div>
      )}

      <div className="page-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 1000 }}>

        {/* Left — graphic */}
        <div>
          <div className="section-label mb-8">Graphic preview</div>
          <div style={{ background: '#f0f0f0', borderRadius: 12, padding: 16, marginBottom: 12, minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {graphicLoading ? (
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>Rendering graphic...</div>
            ) : graphicUrl ? (
              <img src={graphicUrl} alt="Graphic preview" style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }} />
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>Select a template to preview</div>
            )}
          </div>

          <div className="mb-12">
            <div className="section-label mb-8">Platform</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PLATFORMS.map(p => (
                <button key={p} onClick={() => setPlatform(p)} style={{
                  padding: '5px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer',
                  border: platform === p ? '1.5px solid var(--text)' : '0.5px solid var(--border2)',
                  background: platform === p ? 'var(--text)' : 'var(--bg)',
                  color: platform === p ? 'var(--bg)' : 'var(--text2)',
                  fontFamily: 'inherit',
                }}>{p}</button>
              ))}
            </div>
          </div>

          <div className="mb-12">
            <div className="section-label mb-8">Template</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {templates.map(t => (
                <button key={t.id} onClick={() => setTemplate(t.id)} style={{
                  padding: '5px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer',
                  border: template === t.id ? '1.5px solid var(--text)' : '0.5px solid var(--border2)',
                  background: template === t.id ? 'var(--bg3)' : 'var(--bg)',
                  color: 'var(--text2)', fontFamily: 'inherit',
                }}>{t.label}</button>
              ))}
            </div>
          </div>

          <button className="btn" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }} onClick={downloadGraphic}>
            Download graphic PNG
          </button>
        </div>

        {/* Right — copy + scheduling */}
        <div>
          <div className="mb-16">
            <div className="section-label mb-8">Caption</div>
            <textarea value={copy} onChange={e => {
              setCopy(e.target.value);
              setHashtags(extractHashtags(e.target.value));
            }} rows={10} style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.7 }} />
          </div>

          {/* Hashtag chip editor */}
          <div className="mb-16">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div className="section-label" style={{ marginBottom: 0 }}>Hashtags</div>
              <span style={{ fontSize: 10, color: hashtags.length === 3 ? '#1D9E75' : hashtags.length > 3 ? '#A32D2D' : '#BA7517', fontWeight: 600 }}>
                {hashtags.length} / 3 ideal for LinkedIn
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {hashtags.map(tag => (
                <div key={tag} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 20,
                  background: 'var(--bg3)', border: '0.5px solid var(--border2)',
                  fontSize: 12, color: 'var(--text)',
                }}>
                  {tag}
                  <button onClick={() => removeHashtag(tag)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text3)', fontSize: 14, lineHeight: 1,
                    padding: '0 0 0 2px', fontFamily: 'inherit',
                  }}>×</button>
                </div>
              ))}
              {hashtags.length === 0 && (
                <span style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>No hashtags detected — generate a post or type one below</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                value={newHashtag}
                onChange={e => setNewHashtag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addHashtag()}
                placeholder="Add hashtag (e.g. BlackMaternalHealth)"
                style={{ flex: 1, fontSize: 12 }}
              />
              <button className="btn" onClick={addHashtag} style={{ padding: '6px 14px', fontSize: 12, flexShrink: 0 }}>
                Add
              </button>
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
              LinkedIn: 3 ideal · Instagram: 8–10 · X: 0–1 · Always PascalCase · Links go in first comment
            </div>
          </div>

          {/* Channel selector */}
          <div className="mb-14">
            <div className="section-label mb-8">Posting channel</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.values(CHANNELS).map(c => {
                const s = getChannelStatus(c.id);
                const isSelected = channel === c.id;
                return (
                  <button key={c.id} onClick={() => {
                    setChannel(c.id);
                    const nextDate = getNextWeekday(c.bestDays[0]);
                    setScheduleDate(nextDate);
                    setScheduleTime(c.bestTimes[0]);
                  }} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', borderRadius: 9, cursor: 'pointer', textAlign: 'left',
                    border: isSelected ? `1.5px solid ${c.color}` : '0.5px solid var(--border2)',
                    background: isSelected ? `${c.color}10` : 'var(--bg)',
                    fontFamily: 'inherit',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: isSelected ? 600 : 400, color: 'var(--text)' }}>{c.label}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>Best: {c.bestDays.join(', ')} · {c.bestTimes[0]}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: s.color }}>{s.label}</span>
                  </button>
                );
              })}
            </div>
            {ch && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--bg2)', borderRadius: 8, fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
                {ch.note}
              </div>
            )}
          </div>

          {/* Date + time */}
          <div className="mb-12">
            <div className="section-label mb-8">Schedule</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Date</div>
                <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Time (ET)</div>
                <select value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}>
                  {ch?.bestTimes.map(t => <option key={t} value={t}>{t} ET ⭐</option>)}
                  <option value="6:00 AM">6:00 AM ET</option>
                  <option value="10:00 AM">10:00 AM ET</option>
                  <option value="12:00 PM">12:00 PM ET</option>
                  <option value="2:00 PM">2:00 PM ET</option>
                  <option value="4:00 PM">4:00 PM ET</option>
                  <option value="7:00 PM">7:00 PM ET</option>
                </select>
              </div>
            </div>

            {/* Smart recommendation */}
            {rec && (
              <div style={{
                padding: '8px 12px', borderRadius: 8, fontSize: 11, lineHeight: 1.5,
                background: rec.type === 'ok' ? '#E1F5EE' : '#FAEEDA',
                color: rec.type === 'ok' ? '#085041' : '#633806',
              }}>
                {rec.type === 'ok' ? '✓ ' : '⚠ '}{rec.text}
              </div>
            )}
          </div>

          {/* Sentiment timing tip */}
          {meta.sentiment && (
            <div style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 12, background: 'var(--bg2)', fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--text)' }}>Sentiment timing:</strong> {SENTIMENT_TYPES[meta.sentiment]?.timing}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '11px 0' }}
              onClick={approve} disabled={saving || isApproved}>
              {saving ? 'Saving...' : isApproved ? '✓ Approved' : 'Approve + schedule →'}
            </button>
            <button className="btn" onClick={skip} style={{ padding: '11px 18px' }}>Skip</button>
          </div>

          <button className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            onClick={() => navigator.clipboard.writeText(copy)}>
            Copy caption
          </button>
        </div>
      </div>
    </Layout>
  );
}
