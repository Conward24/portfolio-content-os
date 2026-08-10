export const BRANDS = {
  mylua: {
    id: 'mylua',
    name: 'MyLÚA Health',
    short: 'MYLÚA',
    color: '#2C4D45',
    colorLight: '#e1f5ee',
    colorText: '#085041',
    colorBorder: '#9FE1CB',
    font: 'Poppins',
    logoUrl: 'https://raw.githubusercontent.com/Conward24/flask-chatbot/main/MyLUA%20Logo%2012.23.25.png',
    ibmLogoUrl: 'https://raw.githubusercontent.com/Conward24/flask-chatbot/main/IBM_Partner_Plus_silver_partner_mark_pos_black_RGB.jpg',
    website: 'myluahealth.com',
    systemPrompt: `You write LinkedIn posts for MyLÚA Health, an enterprise agentic AI maternal health platform co-founded by Dr. Michael Conward PhD (CEO) and J'Vanay Santos-Fabian MBA (Co-Founder).
Titles updated Aug 2026 — Michael is CEO. The live announcement credits "Michael Conward, Ph.D.,
CEO and Co-Founder" and "J'Vanay Santos-Fabian, MBA, Co-Founder". Never write Michael as CTO
of MyLÚA, and never assign J'Vanay the CEO title.

ICP: Health plan VPs, payer executives, care management directors, employers, enterprise AI buyers, investors.

Voice: Mission-driven, warm but credible. Builder-founder talking to peers. Specific proof over generic claims. Never preachy.

Available proof points (from university research pilot — NEVER attribute to IBM):
- 90%+ first-trimester PPD risk identification accuracy
- 64% health risk assessment completion rate (exceeds digital health benchmarks)
- 79% of users comfortable sharing sensitive data
- 48% engaged with wellness activities
- 20% proactively logged symptoms
- 44% viewed trimester-specific education

IBM partnership: Built on watsonx Orchestrate + watsonx.ai + IBM Cloud Code Engine. IBM case study live: ibm.com/case-studies/mylua-health. IBM Silver Ecosystem Partner.

Validated user quotes available:
- "It felt targeted to my specific needs, so I trusted the information more." — Mother, Pilot User
- "When mothers have the right resources early, it decreases the hopelessness." — SVP of Health Services, Payer
- "Having everything in one place is brilliant because it gives people what they need in the moment." — Director of Care Management, Payer

HARD RULES:
- NEVER attribute pilot stats to IBM
- NEVER say "certified" for J'Vanay's doula work — she is a doula and maternal wellness strategist
- NEVER say: revolutionizing, transforming, disrupting, game-changing, excited to announce
- No external links in caption body (goes in first comment)
- 3 PascalCase hashtags, niche-specific, at the end
- IBM case study link when relevant: ibm.com/case-studies/mylua-health
- Patent-pending multimodal AI framework — NEVER reveal mechanics, architecture, or training pipeline`,
  },

  henway: {
    id: 'henway',
    name: 'Henway',
    short: 'HENWAY',
    color: '#FFCC00',
    colorDark: '#000000',
    colorLight: '#fffbe6',
    colorText: '#7a5f00',
    colorBorder: '#FAC775',
    font: 'Raleway',
    logoBlackUrl: 'https://raw.githubusercontent.com/Conward24/henway-website/main/public/images/logo-black.png',
    logoWhiteUrl: 'https://raw.githubusercontent.com/Conward24/henway-website/main/White%20-%20Henway%20Logo%20(50%20x%20200%20px)%20(200%20x%2050%20px)%20(2).png',
    eggUrl: 'https://raw.githubusercontent.com/Conward24/henway-website/main/public/images/egg-circuit.png',
    website: 'henwayai.com',
    systemPrompt: `
You write LinkedIn content for Henway.

WHAT HENWAY IS
The translation layer between a person and AI. Someone describes their work in plain
language; Henway turns it into a build-ready brief, points them at the right tool, and gets
them to a working first version.

THE THESIS (lead with this, it is the whole argument)
People are not short of ideas or of AI access. They cannot say what they need in a way a
machine can act on. So they try once, get a weak result, decide AI is not for them, and stop.
The gap is translation, and right now almost nobody owns it.

Site headline: "Turn what you already know into what AI can build."

TWO WAYS TO BUY
1. Self-serve app — a ~7-minute flow that recommends which of 13 real AI tools to build with
   and writes your first prompt. Free to start, no card.
2. Done-for-you ("Have Us Build It") — Michael designs and builds the AI system end to end.
   Regulated industries especially: healthcare, finance, legal.

PLANS (verified against the live site — do not quote from memory)
- Founder $29/mo — 10 discoveries/month, save and resume, branded PDF briefs
- Consultant $139/mo — unlimited discoveries, white-label, embeddable widget, client
  CRM + continue-links, up to 3 workspaces
- Agency $249/mo — everything in Consultant, plus unlimited workspaces, admin panel,
  API access, priority support
No AppSumo. No lifetime deals. Monthly subscriptions only.

ICPs, IN PRIORITY ORDER
1. Consultants and agencies as a CHANNEL (Consultant/Agency tiers). They buy Henway to
   deliver to their clients under their own brand. Their pain: every client demands an AI
   story and all they have to hand them is slideware and training that does not stick.
   This is the paying beachhead — lead here.
2. HR and L&D leaders handed an AI adoption mandate with no plan. Sell design-partner
   PILOTS here, never "shipped enterprise" — the admin and cross-employee capture layer
   does not exist yet.
3. Individual small operators self-serve (Founder tier): nail techs, freelancers, barbers,
   bookkeepers, tutors. Broad top-of-funnel, not the revenue centre.
4. Regulated-industry operators with budget and a real build problem → done-for-you.

THE PROPRIETARY RESEARCH (strongest asset — no competitor can copy it)
Every stuck moment across four real sessions was coded. Blocks split two ways:
- COGNITIVE — in the person, cleared by a move (cannot produce an idea on demand, cannot
  see their own role, wants everything at once).
- INTERFACE — manufactured by the tool, fixed only by design (question too abstract,
  options looked identical, output was a summary not a result, forced typing on someone
  who thinks out loud).
Headline finding: the more capable the user, the higher the share of their stuckness that
traces to the tool rather than to them — a third to two thirds across the corpus, climbing
with capability.
The most consequential single block is the Deliverable-gap: they finish and deflate,
because what they are holding is a summary rather than a result.

CREDIBILITY ANCHORS (use these, do not invent others)
1. The research above.
2. The case studies: Henway Deal Workspace (finance) and AI Video Production Studio
   (media). Real projects with real user quotes.
3. The app itself — 13 tools, ~7-minute flow, live and free. The product is the demo.
4. Michael's track record: Ph.D. engineer, real AI systems in regulated industries,
   HIPAA / FDA / IRB / financial compliance from actual deployments.
5. Consented quotes only: Michael Cole (Magnolia pilot) and Rossi (dentist). Everyone else
   in the corpus is aggregate-only.

VOICE
Calm, precise, peer-to-peer. An engineer talking to operators. Specific over clever.
Hook first, never open with a question. Short paragraphs, none over three lines.
3 PascalCase hashtags. Links go in the first comment, never the caption.

HARD RULES — NEVER VIOLATE
- Always "I" voice, never "we." Henway is a solo founder operation.
- Never claim an IBM partnership. IBM is a MyLÚA relationship, not a Henway one.
- Never reference watsonx, the IBM Think keynote, TechXchange, or the NIH award as Henway
  credentials. Those are MyLÚA's.
- Never reference AppSumo or lifetime deals.
- Never quote Consultant at $99. It is $139. The $99 figure is retired.
- Never describe Henway as a venture-architecture consultancy, or reference CUNY, NSF,
  SBIR/STTR, non-dilutive capital or university programs. That positioning is retired.
- Never frame enterprise as shipped. Design-partner pilots only.
- Never publish a statistic without a named, checkable, primary source. A name is not a
  verification. Reject "industry research" style phrases that cite nobody.
- Banned words: revolutionizing, transforming, disrupting, game-changing,
  excited to announce.
- Michael's other companies are context for his experience, never Henway proof points.
`,
  },

  blabbing: {
    id: 'blabbing',
    name: 'Blabbing',
    short: 'BLABBING',
    color: '#5e17eb',
    colorGold: '#ffbd59',
    colorDeep: '#381d5c',
    colorLight: '#EEEDFE',
    colorText: '#3C3489',
    colorBorder: '#AFA9EC',
    logoUrl: 'https://raw.githubusercontent.com/Conward24/flask-chatbot/main/Blabbing%20Logo%20-%20Blabbing%20Light%20Background.png',
    website: 'blabbing.io',
    systemPrompt: `You write LinkedIn posts for Blabbing (blabbing.io), an AI market intelligence and sentiment monitoring platform co-founded by Mike Conward and Jelani McLean.

ICP: Commercial real estate, PR/comms, university presidents, financial services, public sector professionals.

Voice: Editorial, authoritative, data-forward. Positioning: "Know your market before everyone else does."

Critical differentiators to use:
- Not Google Alerts: Google Alerts finds links. Blabbing reads them, analyzes sentiment, explains why it matters, and turns intelligence into actionable drafts.
- Not ChatGPT: ChatGPT remixes existing knowledge. Blabbing monitors live sources daily — it knows what happened in your market today.
- Not CARMA/Meltwater: Those are PR brand monitoring for enterprise comms teams. Blabbing is market intelligence for any professional vertical, accessible on price, built for individuals and small teams.

The proof loop: Show what Blabbing caught, when, and what happened next. Make the reader feel the intelligence gap they're missing by not using it.

Pricing context: $625/mo Starter, $1,600/mo Pro, Enterprise custom.

HARD RULES:
- Never oversell — let the signal and timing speak
- No external links in caption body
- 3 PascalCase hashtags at the end
- Show the intelligence advantage, don't just describe the product`,
  },

  mike: {
    id: 'mike',
    name: 'Mike Personal',
    short: 'MIKE',
    color: '#888780',
    colorLight: '#F1EFE8',
    colorText: '#444441',
    colorBorder: '#D3D1C7',
    photoUrl: 'https://raw.githubusercontent.com/Conward24/henway-website/main/public/images/mike.jpg',
    systemPrompt: `You write LinkedIn posts for Dr. Michael Conward's personal profile.

Bio: PhD AI systems architect, engineer, serial founder. Co-Founder & CEO of MyLÚA Health (enterprise agentic AI maternal health platform). Co-Founder of Blabbing (AI market intelligence). Founder of Henway (the translation layer between people and AI). PCORI Senior Advisory Board member. IBM Data & AI Customer Advisory Board member (2026). Background: aerospace, semiconductors, digital health.

Unified founder narrative: "I build AI systems that create real-world leverage — in maternal health, in venture creation, and in market intelligence. Here's what I'm learning."

Content split: 60% MyLÚA (fundraising active, strongest proof points), 25% Henway (venture architecture, founder enablement), 15% Blabbing (market intelligence, signal vs. noise).

Voice: Builder-founder, engineer-first, mission-driven, credible but never preachy. Specific proof over generic claims. Reads like a builder talking to peers, not a startup pitching investors.

HARD RULES:
- NEVER: revolutionizing, transforming, disrupting, game-changing, excited to announce
- No external links in caption body (goes in first comment)
- 3 PascalCase hashtags at the end
- When referencing MyLÚA pilot stats, NEVER attribute to IBM
- NEVER say "certified" for J'Vanay's doula work`,
  },
};

export const SENTIMENT_TYPES = {
  fr: {
    id: 'fr',
    name: 'Rising frustration',
    icon: '↗',
    desc: 'Anger or urgency building. Name it — people share what articulates what they already feel.',
    colorClass: 'stag-fr',
    selectedStyle: { borderColor: '#D85A30', background: '#FAECE7' },
    timing: 'Post within 4 hours of signal peak. Engagement velocity is highest when frustration is live — not after it resolves.',
    instructions: {
      1: "Sentiment shows subtle frustration building. Acknowledge the friction precisely — don't overdramatize. Give the audience language for something they've noticed but haven't named yet.",
      2: "Frustration is clearly rising. Name it directly in the first line. Don't soften it. People share posts that articulate what they already feel. Then pivot to what this means — what the signal tells us, what should change.",
      3: "Peak frustration signal — the highest engagement moment. Open with the most direct, unhedged statement of the problem. Make the reader feel seen immediately. Then provide the specific insight that makes this worth sharing beyond just venting."
    }
  },
  em: {
    id: 'em',
    name: 'Emerging signal',
    icon: '◆',
    desc: 'Building before mainstream. Post early, be the first voice cited when it breaks.',
    colorClass: 'stag-em',
    selectedStyle: { borderColor: '#5e17eb', background: '#EEEDFE' },
    timing: 'Post immediately. The entire value of this signal type is being first. Every hour you wait, someone else gets there.',
    instructions: {
      1: "This is an early whisper — frame as something worth watching. Position yourself as someone with their finger on the pulse, not making a bold claim too early.",
      2: "The signal is building but not mainstream yet. Frame as early intelligence. 'Something is shifting in [space] and most people haven't noticed yet.' Give 2-3 specific data points showing the pattern forming.",
      3: "This is about to break. Post now, own the conversation before it explodes. Open with the pattern, explain why it matters, end with a specific prediction. When mainstream picks it up, your post is already there."
    }
  },
  po: {
    id: 'po',
    name: 'Accelerating positive',
    icon: '↑',
    desc: 'Hope or momentum building. Amplify with specifics — your audience wants something to believe in.',
    colorClass: 'stag-po',
    selectedStyle: { borderColor: '#1D9E75', background: '#E1F5EE' },
    timing: 'Post at peak engagement hours (7–9am or 5–6pm) to ride the positive momentum with maximum reach.',
    instructions: {
      1: "Positive momentum building quietly. Acknowledge it with specificity — not cheerleading. Tie the good news to concrete implications for your audience.",
      2: "Real momentum is building and your audience wants something to believe in. Lead with specific proof of progress — numbers, names, events. Explain why this matters more than it looks on the surface.",
      3: "Breakthrough moment. Open with the most specific, most compelling proof of the positive shift. Let the data do the work. Don't over-editorialize — the moment speaks for itself when framed correctly."
    }
  },
  co: {
    id: 'co',
    name: 'Shifting consensus',
    icon: '△',
    desc: 'The room is changing its mind. Contrarian framing — "everyone said X, the data says Y."',
    colorClass: 'stag-co',
    selectedStyle: { borderColor: '#BA7517', background: '#FAEEDA' },
    timing: 'Post while the shift is still news. Contrarian posts lose power once the new consensus forms — you want to be ahead of it.',
    instructions: {
      1: "Conventional wisdom is showing early cracks. Frame carefully — 'the conversation is starting to shift.' Provide evidence without overstating.",
      2: "The room is actually changing its mind. Lead with the old consensus, then the new signal. Use contrarian framing — 'everyone said X. The data is now saying something different.' Gets more shares than agreement.",
      3: "Consensus has flipped. Open with the strongest version of what everyone believed, then drop the data that contradicts it. End with the implication — what does this mean if you act now versus in 6 months?"
    }
  },
};

export const POST_TYPES = [
  { id: 'signal', label: 'Signal text post', desc: 'Blabbing intelligence → Mike\'s take' },
  { id: 'sentiment', label: 'Sentiment post', desc: 'Trending signal + emotional direction' },
  { id: 'stat', label: 'Stat card', desc: 'One number, one insight, graphic' },
  { id: 'carousel', label: 'Carousel script', desc: '6-slide LinkedIn carousel' },
  { id: 'brief', label: 'Weekly intelligence brief', desc: 'Monday signal wrap' },
  { id: 'usecase', label: 'Use case story', desc: 'Real deployment, no client names' },
  { id: 'quote', label: 'Quote card', desc: 'Pull quote for Instagram repurpose' },
];

export const MYLUA_TOPICS = [
  { name: 'Black maternal mortality and racial disparities research', freq: 'daily', cluster: 'A' },
  { name: 'Doula reimbursement legislation and state bills', freq: 'daily', cluster: 'A' },
  { name: 'Black Maternal Health Week and BMMA movement', freq: 'daily', cluster: 'A' },
  { name: 'HRSA and NIH maternal health funding announcements', freq: 'daily', cluster: 'A' },
  { name: 'Preventable maternal death and hospital accountability', freq: 'daily', cluster: 'A' },
  { name: 'Agentic AI in healthcare and clinical decision support', freq: 'daily', cluster: 'A' },
  { name: 'Medicaid maternal health policy and postpartum coverage', freq: 'daily', cluster: 'A' },
  { name: 'Maternal mental health and perinatal depression awareness', freq: '3x/week', cluster: 'B' },
  { name: 'Health equity and social determinants of maternal outcomes', freq: '3x/week', cluster: 'B' },
  { name: 'WatsonX and IBM health cloud deployment updates', freq: '3x/week', cluster: 'B' },
  { name: 'Employer maternal health benefits and workforce wellbeing', freq: '3x/week', cluster: 'B' },
  { name: 'Digital health for underserved and low-income populations', freq: '3x/week', cluster: 'B' },
  { name: 'CMS innovation models and value-based maternal care', freq: '3x/week', cluster: 'B' },
  { name: 'Maternal digital health startup funding and exits', freq: '3x/week', cluster: 'B' },
  { name: 'Black women founders in healthtech and femtech', freq: '3x/week', cluster: 'B' },
  { name: 'FQHC and community health center digital health adoption', freq: '3x/week', cluster: 'B' },
  { name: 'Patient experience and healthcare navigation pain points', freq: 'weekly', cluster: 'C' },
  { name: 'AI ethics, bias, and health equity in clinical algorithms', freq: 'weekly', cluster: 'C' },
  { name: 'Maternal telehealth and remote monitoring adoption', freq: 'weekly', cluster: 'C' },
  { name: 'Birth justice and midwifery advocacy', freq: 'weekly', cluster: 'C' },
  { name: 'Perinatal care coordination and care team collaboration', freq: 'weekly', cluster: 'C' },
  { name: 'Doula access, training, and certification trends', freq: 'weekly', cluster: 'C' },
];

export const HENWAY_TOPICS = [
  { name: 'Agentic AI governance and human-in-the-loop design', freq: 'daily', cluster: 'A' },
  { name: 'State vs. federal AI regulation (post-March 2026 White House Framework)', freq: 'daily', cluster: 'A' },
  { name: 'AI capital concentration squeezing early-stage founders', freq: 'daily', cluster: 'A' },
  { name: 'Maternal health policy and Black maternal health equity', freq: 'daily', cluster: 'A' },
  { name: 'Non-dilutive funding for tech startups (SBIR/STTR, grants)', freq: 'daily', cluster: 'A' },
  { name: 'AI adoption in underserved markets', freq: '3x/week', cluster: 'B' },
  { name: 'Black and underrepresented founder ecosystems', freq: '3x/week', cluster: 'B' },
  { name: 'AI venture strategy and startup architecture', freq: '3x/week', cluster: 'B' },
  { name: 'Equitable AI and algorithmic bias', freq: '3x/week', cluster: 'B' },
  { name: 'RAG pipelines and LLM architecture patterns', freq: '3x/week', cluster: 'B' },
  { name: 'Healthcare AI and digital health innovation', freq: '3x/week', cluster: 'B' },
  { name: 'Founder equity preservation strategies', freq: '3x/week', cluster: 'B' },
  { name: 'Generative AI for SMEs', freq: '3x/week', cluster: 'B' },
  { name: 'IBM WatsonX and enterprise AI deployment', freq: 'weekly', cluster: 'C' },
  { name: 'NYCEDC and NYC innovation ecosystem', freq: 'weekly', cluster: 'C' },
  { name: 'University tech commercialization and spinouts', freq: 'weekly', cluster: 'C' },
  { name: 'Mission-driven venture capital and impact investing', freq: 'weekly', cluster: 'C' },
  { name: 'NSF and NIH innovation funding trends', freq: 'weekly', cluster: 'C' },
  { name: 'CUNY and university AI programs', freq: 'weekly', cluster: 'C' },
  { name: 'Corporate innovation programs and pilot partnerships', freq: 'weekly', cluster: 'C' },
  { name: 'Responsible AI policy and governance frameworks', freq: 'weekly', cluster: 'C' },
  { name: 'FDA and HIPAA AI compliance developments', freq: 'weekly', cluster: 'C' },
  { name: 'AI workforce displacement and reskilling', freq: 'weekly', cluster: 'C' },
  { name: 'Civic tech and public interest AI', freq: 'weekly', cluster: 'C' },
  { name: 'Perinatal and postpartum mental health research', freq: 'weekly', cluster: 'C' },
];

export const BLABBING_TOPICS = [
  { name: 'Commercial real estate market sentiment', freq: 'daily', cluster: 'A' },
  { name: 'PR and comms industry signals', freq: 'daily', cluster: 'A' },
  { name: 'AI-generated content and regulation', freq: 'daily', cluster: 'A' },
  { name: 'University president and admin intelligence', freq: '3x/week', cluster: 'B' },
  { name: 'Financial services AI sentiment', freq: '3x/week', cluster: 'B' },
  { name: 'Public sector innovation signals', freq: '3x/week', cluster: 'B' },
  { name: 'Competitive intelligence landscape (vs. Meltwater/CARMA)', freq: 'weekly', cluster: 'C' },
];

/* ------------------------------------------------------------------ *
 * PULSE BUDGET — the hard constraint the topic lists ignore.
 *
 * Monitoring runs on michael@debenservices.com, which funds TEN pulses a day, total, across
 * all three companies. MYLUA_TOPICS + HENWAY_TOPICS + BLABBING_TOPICS is 54 topics — five
 * times what is actually funded. Treat those arrays as the monitoring BACKLOG (what we would
 * watch with an unlimited budget) and PULSE_SLOTS as what is actually running.
 *
 * Anything not in PULSE_SLOTS is not being monitored, no matter what the topics page shows.
 * ------------------------------------------------------------------ */

export const PULSE_BUDGET = {
  total: 10,
  account: 'michael@debenservices.com',
  cadence: 'daily',
  note: 'Ten topic slots, shared across MyLÚA, Henway and Blabbing. Adding a slot means removing one.',
};

/**
 * HOW BLABBING NAMES A TOPIC  (learned 2026-08-09, from the Add Topic screen)
 *
 * You type a description; Blabbing rewrites it and the REWRITE is what gets monitored
 * ("This will be the topic that is used to monitor daily pulses on your interest"). The
 * strings in PULSE_SLOTS above are therefore the AI-generated forms, not what was typed,
 * because history is keyed on a slug of the monitored string.
 *
 * CONSEQUENCE, and it is the important one: NEVER delete and re-add a topic you want to
 * keep. Re-adding sends it back through the rewriter, which will not reproduce the same
 * string, which mints a new slug and orphans every day of history behind it. Editing the
 * list is safe; re-adding is not.
 *
 * The five carried-over topics were already stored in their rewritten form, so they are
 * unaffected as long as they are left alone.
 */
export const PULSE_SLOTS = [
  // Set 2026-08-09. Ten FIXED topics, no float slot.
  //
  // WHY NO FLOAT: a slot reassigned weekly never accumulates a baseline. The scoring layer
  // needs ~14 days of the SAME topic before it can say whether today is unusual, so a
  // rotating slot would sit permanently at day one and never produce a comparative signal.
  //
  // WHY THE WORDING IS FROZEN: history is stored under a slug of the topic string, so
  // rewording a topic orphans its history. The five marked `since` below carry real history
  // and their text must be pasted into Blabbing character-for-character.

  // --- Carried over, with history (ingested from 2026-08-01ish; emotion data only goes
  //     back 7-10 days because earlier pulses were topic text alone).
  { slot: 1, brand: 'shared', since: '2026-08', topic:
    'Healthcare artificial intelligence agents and their associated marketplaces for development, distribution, and deployment',
    why: 'Double duty: agentic AI in healthcare for MyLUA, AI adoption for Henway.' },
  { slot: 2, brand: 'mylua', since: '2026-08', topic:
    'Midlife women\u2019s health, menopause care, and hormone replacement therapy policy developments',
    why: 'Kept at Michael\u2019s direction; already banking a baseline.' },
  { slot: 3, brand: 'mylua', since: '2026-08', topic:
    'Medicaid reimbursement and coverage policies for doula and community health worker services',
    why: 'The payer-ICP signal. Deliberately NOT split into doula-vs-Medicaid: splitting one '
       + 'topic into two destroys the baseline and there are no spare slots.' },
  { slot: 4, brand: 'mylua', since: '2026-08', topic:
    'Perinatal mental health and postpartum depression screening policies',
    why: 'Content pillar with history already accumulating.' },
  { slot: 5, brand: 'shared', since: '2026-08', topic:
    'Regulatory developments for artificial intelligence in healthcare data privacy, including HIPAA compliance standards',
    why: 'High velocity; also feeds the PR/comms newsletter audience.' },

  // --- New 2026-08-09. Baselines start at zero; comparative scoring ~2026-08-23.
  { slot: 6, brand: 'henway', since: '2026-08-09', topic:
    'Challenges and failures in enterprise AI adoption, including stalled pilot projects and return on investment scrutiny',
    why: 'The core wedge every carousel and one-pager opens on.' },
  { slot: 7, brand: 'henway', since: '2026-08-09', topic:
    'Consulting and agency firms productizing artificial intelligence services and solutions for enterprise clients',
    why: 'Channel beachhead, and the audience for the outbound sequence.' },
  { slot: 8, brand: 'henway', since: '2026-08-09', topic:
    'Human Resources and Learning & Development policies and strategies for artificial intelligence upskilling in the workforce',
    why: 'Second ICP, the design-partner pilot audience.' },
  { slot: 9, brand: 'blabbing', since: '2026-08-09', topic:
    'Current trends and developments in public relations and corporate communications, including crisis response and reputation management.',
    why: 'The Crisis Radar BUYER\u2019s own world. Pairs with slot 10: 9 is what PR teams worry '
       + 'about, 10 is what they are worrying about.' },
  { slot: 10, brand: 'blabbing', since: '2026-08-09', topic:
    'Corporate reputation crises, brand backlash, and consumer boycott campaigns targeting companies and brands',
    why: 'The Crisis Radar demo well. Slot 9 covers the BUYER\\u2019s world (what PR teams talk '
       + 'about); this covers the RAW MATERIAL the product acts on, so every day produces a '
       + 'worked example of what Crisis Radar would have caught. Also the richest emotional '
       + 'signal of the ten: crises run on anger and disgust, the highest-arousal emotions, so '
       + 'this is where the anomaly detector has the most to detect.' },
];

/**
 * Retired 2026-08-09. Kept as a record of what stopped being monitored, since a topic
 * vanishing from the pulse is otherwise indistinguishable from a topic going quiet.
 */
export const PULSE_SLOTS_RETIRED = [
  'Maternal mortality and racial disparities in Black maternal health outcomes in the United States',
  'Trends in employer benefits and policies related to women\u2019s health and family formation',
  'Tracking venture capital funding and Series A/B investment trends for healthcare AI companies in',
  'IBM, Microsoft, Google, and AWS partnerships in enterprise artificial intelligence and healthcare',
  'Investment and funding for underrepresented founders, including Black and women entrepreneurs, in the technology sector.',
];

/**
 * Considered and rejected 2026-08-09: commercial real estate market sentiment. It had the
 * best raw data properties of any candidate (real volume, proven vertical) but Blabbing is
 * not selling into CRE right now -- Crisis Radar is the GTM focus. Monitoring a market you
 * are not pursuing spends a tenth of the budget on content nobody is waiting for.
 */
export const PULSE_SLOTS_REJECTED = [
  { topic: 'Commercial real estate market sentiment', why: 'Not the current GTM market; Crisis Radar is.' },
];

/**
 * RISK, stated so it is not discovered later: The Early Signal ships weekly on Tuesday and
 * its entire premise is "we caught this before the news cycle." Two Blabbing pulses may not
 * surface a publishable catch every single week. Mitigations, in order of preference:
 *   1. Default the float slot to Blabbing on any week with no Henway/MyLÚA moment.
 *   2. Keep a backlog of caught-but-unpublished signals so a quiet week still ships.
 *   3. Only if those fail, rebalance to 3 Blabbing pulses and drop MyLÚA to 3.
 */
export const PULSE_RISKS = {
  earlySignalSupply: 'Weekly newsletter vs 2 dedicated Blabbing pulses. Resolved without a float '
    + 'slot: a PR/comms audience also cares about slots 1, 5, 6 and 8 (AI regulation, adoption '
    + 'failure, upskilling mandates), so The Early Signal draws on six wells, not two.',
};

export const INTENSITY_LABELS = { 1: 'subtle shift', 2: 'moderate', 3: 'peak signal' };

export const PLATFORM_SIZES = {
  'Instagram Feed': { w: 1080, h: 1080 },
  'LinkedIn Feed': { w: 1200, h: 627 },
  'X/Twitter': { w: 1200, h: 675 },
  'Instagram Story': { w: 1080, h: 1920 },
  'Carousel': { w: 1080, h: 1350 },
};

export const WEEK_SEED_POSTS = [
  {
    id: 'w1-mon',
    weekOffset: 0, day: 'Mon',
    brand: 'mylua',
    title: 'BMHW preview — what\'s at stake',
    type: 'Signal text',
    pillar: 'Mission & advocacy',
    channel: 'Mike personal + MyLÚA company',
    sentiment: null,
    copy: `Black Maternal Health Week starts Friday.\n\n80% of maternal deaths are preventable.\nBlack women die at 2-3x the rate of white women.\nMedicaid covers 40%+ of U.S. births — and postpartum coverage gaps remain a crisis.\n\nMyLÚA exists because the system wasn't built for the people who need it most.\n\nThis week, we'll be sharing what we're doing about it.\n\n#BlackMaternalHealth #MaternalHealthEquity #HealthEquity`
  },
  {
    id: 'w1-tue',
    weekOffset: 0, day: 'Tue',
    brand: 'henway',
    title: 'Agentic AI governance — the founder blind spot',
    type: 'Signal text',
    pillar: 'Market Signal',
    channel: 'Mike personal',
    sentiment: 'em',
    copy: `Gartner says 40% of enterprise apps will embed AI agents by end of 2026.\n\nFounders are racing to add agents. Almost none are designing the governance layer first.\n\nWhat gets skipped:\n→ Human-in-the-loop checkpoints\n→ Escalation logic when the agent hits uncertainty\n→ Audit trails for regulated decisions\n\nThe founders who build this in from the start will be fundable. The ones who don't will get crushed in due diligence.\n\nThis is the work Henway focuses on.\n\n#AgenticAI #AIGovernance #VentureArchitecture`
  },
  {
    id: 'w1-wed',
    weekOffset: 0, day: 'Wed',
    brand: 'blabbing',
    title: 'Market intelligence vs. Google Alerts',
    type: 'Signal text',
    pillar: 'Category education',
    channel: 'Blabbing company page',
    sentiment: 'co',
    copy: `Google Alerts finds the link.\nBlabbing reads it, analyzes sentiment, and tells you why it matters to your business.\n\nTwo completely different things.\n\nThis week's signal across CRE and PR clients: sentiment around AI-generated content is shifting from curiosity to regulatory anxiety.\n\nThat's not a link. That's intelligence.\n\n#MarketIntelligence #AIContent #Blabbing`
  },
  {
    id: 'w1-thu',
    weekOffset: 0, day: 'Thu',
    brand: 'mylua',
    title: 'IBM CAB — what it means for regulated AI founders',
    type: 'Proof point',
    pillar: 'Credibility anchor',
    channel: 'Mike personal',
    sentiment: null,
    copy: `Last month I joined IBM's Data & AI Customer Advisory Board.\n\nPractically, this means I'm in rooms where enterprise AI infrastructure decisions are made — as an advisor, not a vendor.\n\nFor MyLÚA: our roadmap is informed by where healthcare AI is actually going, not where we think it's going.\n\nFor founders building in regulated sectors: the governance decisions you make in year one determine whether you scale or stall.\n\nBuilding on watsonx.ai taught us that.\n\n#IBMwatsonx #HealthcareAI #AgenticAI`
  },
  {
    id: 'w1-fri',
    weekOffset: 0, day: 'Fri',
    brand: 'henway',
    title: 'State vs. federal AI regulation — what founders must know now',
    type: 'Intelligence brief',
    pillar: 'Market Signal',
    channel: 'Mike personal',
    sentiment: 'fr',
    copy: `The White House AI Framework dropped March 20.\n\nHere's what's actually happening in the regulatory stack right now:\n\n→ Federal: voluntary guidelines, no enforcement teeth yet\n→ California: SB 1047 fallout still reshaping dev decisions\n→ Colorado: algorithmic discrimination law live\n→ New York: AI in employment decisions — enforcement active\n\nIf you're building AI in healthcare, HR, or finance: you have a compliance problem whether or not you've thought about it.\n\nThis is the infrastructure founders need to design before writing a line of code.\n\n#AIRegulation #ResponsibleAI #FounderStrategy`
  },
  {
    id: 'w2-mon',
    weekOffset: 1, day: 'Mon',
    brand: 'mylua',
    title: 'BMHW Day 1 — the stat that moves people',
    type: 'Stat card',
    pillar: 'Mission & advocacy',
    channel: 'MyLÚA company + Mike personal',
    sentiment: 'fr',
    copy: `80% of maternal deaths are preventable.\n\nThat's not a statistic. That's a system failure.\n\nBlack Maternal Health Week 2026.\n\nThis is why MyLÚA exists.\n\n#BMHW2026 #BlackMaternalHealth #PreventableDeath`
  },
  {
    id: 'w2-tue',
    weekOffset: 1, day: 'Tue',
    brand: 'blabbing',
    title: 'Blabbing signal — doula reimbursement legislation accelerating',
    type: 'Signal text',
    pillar: 'Market intelligence',
    channel: 'Blabbing company + Mike personal',
    sentiment: 'po',
    copy: `Blabbing flagged a surge in doula reimbursement legislation coverage this week.\n\n4 new state bills introduced in Q1 2026.\nSentiment: accelerating positive.\n\nFor health plans: this is a distribution shift, not a trend.\nFor founders in maternal health: the market is moving toward you.\n\nKnowing before everyone else is the only edge that compounds.\n\n#MarketIntelligence #MaternalHealth #Doulas`
  },
  {
    id: 'w2-wed',
    weekOffset: 1, day: 'Wed',
    brand: 'mylua',
    title: 'BMHW — the IBM case study moment',
    type: 'Proof point',
    pillar: 'Credibility anchor',
    channel: 'Mike personal + MyLÚA company',
    sentiment: 'po',
    copy: `79% of women in our pilot felt comfortable sharing sensitive health data with MyLÚA.\n\nIn maternal health, that number is everything.\n\nTrust is the product. The AI is the delivery system.\n\nFull story in comments.\n\n#BlackMaternalHealthWeek #AgenticAI #HealthEquity`
  },
  {
    id: 'w2-thu',
    weekOffset: 1, day: 'Thu',
    brand: 'henway',
    title: 'Non-dilutive capital — why founders leave it on the table',
    type: 'Carousel script',
    pillar: 'Systems Thinking',
    channel: 'Mike personal',
    sentiment: null,
    copy: `Most early-stage founders don't know what they qualify for.\n\nHere's the stack they miss:\n\n→ NSF SBIR Phase I — up to $275K, no equity\n→ NIH STTR — research commercialization path\n→ State innovation funds — faster, lower competition\n→ NYCEDC programs — NYC-specific, underutilized\n→ HRSA grants — health equity space\n\nNon-dilutive capital doesn't just preserve equity.\nIt buys you time to build real traction before VC enters the room.\n\nThat changes the whole conversation.\n\n#NonDilutiveFunding #SBIR #FounderStrategy`
  },
  {
    id: 'w2-fri',
    weekOffset: 1, day: 'Fri',
    brand: 'mylua',
    title: 'BMHW close — what the signal said this week',
    type: 'Weekly brief',
    pillar: 'Signal Summary',
    channel: 'Mike personal + MyLÚA company',
    sentiment: 'po',
    copy: `Black Maternal Health Week 2026 — what the data showed:\n\n→ Doula reimbursement coverage: +340% this week\n→ Postpartum Medicaid extension: 3 new state bills in motion\n→ "Preventable maternal death" search sentiment: highest in 18 months\n\nThe conversation is getting louder.\nThe policy is moving.\nThe market is ready.\n\nMyLÚA is built for this moment.\n\n#BMHW2026 #MaternalHealth #BlackWomensHealth`
  },
];
