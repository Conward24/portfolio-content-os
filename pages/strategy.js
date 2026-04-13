import Layout from '../components/Layout';

const TEAL = '#2C4D45';
const YELLOW = '#c9a000';
const INDIGO = '#5e17eb';
const GRAY = '#888780';

function Rule({ icon, title, children }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '0.5px solid var(--border)' }}>
      <div style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>{children}</div>
      </div>
    </div>
  );
}

function ChannelCard({ color, name, handle, days, times, max, note, weekNote }) {
  return (
    <div className="card" style={{ borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{handle}</div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${color}18`, color }}>
          {max}x / week max
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3, fontWeight: 600, letterSpacing: '0.05em' }}>BEST DAYS</div>
          <div style={{ fontSize: 12, fontWeight: 600, color }}>{days}</div>
        </div>
        <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3, fontWeight: 600, letterSpacing: '0.05em' }}>BEST TIMES (ET)</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{times}</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 6 }}>{note}</div>
      {weekNote && <div style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>{weekNote}</div>}
    </div>
  );
}

function DayRow({ day, posts }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 12, padding: '12px 0', borderBottom: '0.5px solid var(--border)', alignItems: 'start' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', paddingTop: 4 }}>{day}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {posts.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 10px', borderRadius: 7, background: `${p.color}12`, border: `0.5px solid ${p.color}30` }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flexShrink: 0, marginTop: 4 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: p.color }}>{p.channel}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.type} · {p.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Strategy() {
  return (
    <Layout title="Strategy guide" active="strategy">
      <div className="page-header">
        <span className="page-title">Strategy guide</span>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>Scheduling logic, cadence rules, and reactive playbook</span>
      </div>

      <div className="page-body" style={{ maxWidth: 1000 }}>

        {/* Alert banner */}
        <div style={{ background: '#fffbe6', border: '0.5px solid #FAC775', borderRadius: 12, padding: '14px 18px', marginBottom: 28, fontSize: 13, color: '#7a5f00', lineHeight: 1.7 }}>
          <strong>The core rule:</strong> Mike's personal profile is the engine. Company pages amplify and support — they never post the same caption. External links always go in the <strong>first comment</strong>, never the caption body (kills reach by ~60%).
        </div>

        {/* Channel cards */}
        <div className="section-label mb-12">The four channels</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 32 }}>
          <ChannelCard
            color={GRAY}
            name="Mike Personal"
            handle="linkedin.com/in/michaelconward"
            days="Tue, Wed, Thu (Fri ok)"
            times="7–9 AM or 5–6 PM"
            max={5}
            note="Primary engine. Gets 8x more organic reach than company pages. Every high-signal post goes here first. This is the account that builds the relationship with health plan VPs, investors, and IBM ecosystem."
            weekNote="4–5 posts/week is the target. Consistency beats volume — 3 strong posts beats 5 weak ones."
          />
          <ChannelCard
            color={TEAL}
            name="MyLÚA Company Page"
            handle="linkedin.com/company/myluahealth"
            days="Mon, Wed, Fri"
            times="8–10 AM"
            max={3}
            note="Never copy Mike's caption. Use a different frame — 'Our CTO just posted something worth reading...' or a complementary stat card or quote card that links back. Always anchor back to the IBM case study."
            weekNote="If Mike posts on Wed, company page posts the echo on Thu morning. Different frame, same signal window."
          />
          <ChannelCard
            color={YELLOW}
            name="Henway Company Page"
            handle="linkedin.com/company/henway"
            days="Tue, Thu"
            times="8–9 AM"
            max={2}
            note="Early stage — 2x/week is enough while you're building. Henway posts should feel like editorial intelligence, not startup promotion. Reposts Mike's Henway-relevant posts with a brief intro from the company voice."
            weekNote="Don't stretch to 3x/week until the page has 500+ followers. Quality over frequency at this stage."
          />
          <ChannelCard
            color={INDIGO}
            name="Blabbing Company Page"
            handle="linkedin.com/company/blabbing"
            days="Mon, Wed, Fri"
            times="7–8 AM"
            max={3}
            note="The proof loop account. Best posts: 'We flagged this Tuesday. TechCrunch covered it Thursday.' Monday morning works because professionals are doing week-ahead research and receptive to intelligence tools."
            weekNote="This channel does its own work — it doesn't echo Mike. The signal proof card is the highest-performing format here."
          />
        </div>

        {/* Weekly rhythm */}
        <div className="section-label mb-12">Default weekly rhythm</div>
        <div className="card mb-24">
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14, lineHeight: 1.6 }}>
            This is the default cadence. Two flex slots (Wed + Fri) are reserved for reactive Blabbing signals. If no strong signal, use them for a planned post or skip.
          </div>
          <DayRow day="Mon" posts={[
            { channel: 'MyLÚA Company', type: 'Quote card or stat card', time: '8 AM', color: TEAL },
            { channel: 'Blabbing Company', type: 'Signal proof card', time: '7 AM', color: INDIGO },
          ]} />
          <DayRow day="Tue" posts={[
            { channel: 'Mike Personal', type: 'Market Signal brief (Blabbing weekly wrap)', time: '7–9 AM', color: GRAY },
            { channel: 'Henway Company', type: 'Echo of Mike\'s post or standalone', time: '9 AM', color: YELLOW },
          ]} />
          <DayRow day="Wed" posts={[
            { channel: 'Mike Personal', type: '⚡ FLEX — Sentiment post if signal is strong, else Applied use case', time: '7–9 AM', color: GRAY },
            { channel: 'MyLÚA Company', type: 'Complementary to Mike\'s post', time: '9–10 AM', color: TEAL },
          ]} />
          <DayRow day="Thu" posts={[
            { channel: 'Mike Personal', type: 'Systems Thinking or Founder Lens post', time: '7–9 AM', color: GRAY },
            { channel: 'Henway Company', type: 'Echo or standalone intelligence post', time: '9 AM', color: YELLOW },
          ]} />
          <DayRow day="Fri" posts={[
            { channel: 'MyLÚA Company', type: '⚡ FLEX — Event card, BMHW, IBM moment, or proof point', time: '8–9 AM', color: TEAL },
            { channel: 'Blabbing Company', type: 'Intelligence brief or signal card', time: '7 AM', color: INDIGO },
          ]} />
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text3)', lineHeight: 1.6, padding: '10px 0 0', borderTop: '0.5px solid var(--border)' }}>
            Total: up to 10 posts/week across 4 channels · Mike personal: 3 guaranteed + 1 flex · Company pages: 2–3 each
          </div>
        </div>

        {/* Reactive interrupt rules */}
        <div className="section-label mb-12">When news breaks — the reactive playbook</div>
        <div className="card mb-24">
          <Rule icon="⚡" title="High-urgency signal (rising frustration at peak, emerging signal)">
            Post on Mike personal within 4 hours. Don't wait for a "better" day. Algorithm rewards velocity when sentiment is live. MyLÚA or Blabbing company page echoes within 24 hours. Bump the lowest-priority planned post that week — usually Systems Thinking or Founder Lens, since those aren't tied to a news cycle.
          </Rule>
          <Rule icon="📊" title="New data drops (maternal mortality study, CDC report, CMS rule change)">
            MyLÚA company page gets a stat card same day or next morning. Mike personal follows with the systems-level take — "here's what this means for health plans." Don't post both the same hour. Stagger by 2–4 hours minimum.
          </Rule>
          <Rule icon="🔵" title="IBM announcement or WatsonX update">
            Mike personal leads — tag IBM, reference the case study. MyLÚA company page echoes with the IBM badge graphic. This is a co-tagging opportunity — check if IBM's company page has already posted and engage with that post first before your own.
          </Rule>
          <Rule icon="🌸" title="BMHW and awareness moments (Black Maternal Health Week, May awareness month)">
            Plan these 2 weeks ahead using the Event card template. BMHW (April 11–17) is the biggest annual window — Mike posts Mon + Wed + Fri that week, all MyLÚA. Company page posts Tue + Thu. Front-load the most powerful stat (80% preventable) on Day 1.
          </Rule>
          <Rule icon="📰" title="Blabbing proof loop moment (you flagged it before mainstream press)">
            Blabbing company page posts the Signal Proof card immediately. Mike personal references it within 48 hours as a systems thinking angle. This is Blabbing's best organic marketing — document every instance.
          </Rule>
          <Rule icon="🏆" title="What to bump when you need to add a reactive post">
            Bump in this order: (1) Founder Lens post — least time-sensitive, (2) Systems Thinking post — frameworks don't expire, (3) Weekly brief — reschedule to next Monday. Never bump: sentiment posts (they're time-sensitive), BMHW content (window is fixed), IBM co-tagging posts (momentum fades).
          </Rule>
        </div>

        {/* Company page rules */}
        <div className="section-label mb-12">Company page rules — never violate these</div>
        <div className="card mb-24">
          <Rule icon="✗" title="Never copy Mike's caption verbatim">
            LinkedIn's algorithm penalizes duplicate content. More importantly, it's a wasted opportunity. Company pages have different audiences — use a complementary angle, not the same words.
          </Rule>
          <Rule icon="→" title="Always frame company posts relative to Mike's post">
            "Our CTO shared something this week that every health plan VP should read —" or "The signal our team has been watching just confirmed what we've been seeing in our pilot data." This cross-promotes Mike's post and gives the company page its own voice.
          </Rule>
          <Rule icon="🔗" title="Every MyLÚA company post links back to the IBM case study">
            ibm.com/case-studies/mylua-health is the anchor asset. It goes in the first comment (never the caption). Mention it at least 2x per week across company posts.
          </Rule>
          <Rule icon="⏱" title="Stagger company posts from Mike's posts by at least 2 hours">
            If Mike posts at 7 AM, company page posts at 9 AM or later. This extends the content window and avoids cannibalization.
          </Rule>
          <Rule icon="📈" title="Henway company page: don't stretch until 500+ followers">
            At sub-500 followers, posting more than 2x/week returns diminishing engagement. Use that energy on Mike's personal posts instead. Once Henway hits 500, move to 3x/week.
          </Rule>
        </div>

        {/* Content type timing */}
        <div className="section-label mb-12">Which post type wins on which day</div>
        <div className="card" style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0 16px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>Monday</span>
            <span>Weekly intelligence brief — professionals are planning their week and receptive to intelligence. Signal proof cards for Blabbing.</span>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>Tuesday</span>
            <span>Proof points and use cases — mid-week engagement peak. Enterprise buyers are most active Tue–Wed.</span>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>Wednesday</span>
            <span>Sentiment posts and reactive content — highest reach day of the week. Save your strongest signal for here.</span>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>Thursday</span>
            <span>Systems thinking and frameworks — people are wrapping the week mentally, receptive to patterns and analysis.</span>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>Friday</span>
            <span>Event cards, BMHW, milestone announcements — people share more on Fridays. End the week with something worth forwarding.</span>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>Carousel</span>
            <span>Any day Tue–Thu. Carousels get 6.6% avg engagement vs 2–3% for text. Post at 7–8 AM for maximum dwell time measurement.</span>
          </div>
        </div>

      </div>
    </Layout>
  );
}
