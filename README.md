# Portfolio Content OS

Unified content operating system for Dr. Michael Conward's three-brand portfolio: MyLÚA Health, Henway, and Blabbing.

## What this is

- **Generate** — Input screen: pick brand, post type (including Sentiment post), paste Blabbing signal, get 1-3 AI-drafted posts
- **Staging** — Review drafts with live graphic preview, edit copy, pick platform + template, schedule to calendar
- **Calendar** — Unified week view showing all 3 brands color-coded simultaneously. Click any post for full detail + copy.
- **Photo library** — Brand-tagged photo uploads shared via Vercel Blob
- **Topic feeds** — All 47 Blabbing monitoring topics (22 MyLÚA + 25 Henway + Blabbing categories)

## Sentiment post type

4 sentiment directions × 3 intensity levels = 12 distinct prompt instructions:
- **Rising frustration** — Names what the audience already feels. Posts at peak signal.
- **Emerging signal** — Be first. Post immediately before it breaks mainstream.
- **Accelerating positive** — Amplify momentum with specifics. Post at 7-9am or 5-6pm.
- **Shifting consensus** — Contrarian framing. Post while the shift is still news.

## Deploy to Vercel

1. Create a new GitHub repo: `Conward24/portfolio-content-os`
2. Push all files to that repo
3. Go to vercel.com → New Project → import that repo
4. Add environment variables (see `.env.example`)
5. Deploy

## Environment variables needed

- `ANTHROPIC_API_KEY` — from console.anthropic.com
- `KV_REST_API_URL` — from a NEW Upstash Redis instance at upstash.com
- `KV_REST_API_TOKEN` — from same Upstash instance
- `BLOB_READ_WRITE_TOKEN` — from a NEW Vercel Blob store at vercel.com/storage

## Brand systems

### MyLÚA Health
- Colors: #2C4D45 primary, #A86D53 secondary, #DFAC7A tertiary, #FAF7F2 cream
- Font: Poppins
- ICP: Health plan VPs, payer execs, care management directors, enterprise AI buyers, investors
- Anchor: ibm.com/case-studies/mylua-health

### Henway
- Colors: #FFCC00 yellow, #000000 black, #3A3A3A charcoal
- Font: Raleway, -0.02em letter-spacing on headlines
- ICP: Early-stage AI founders, university programs, institutional partners
- Templates: Stat card (black/yellow), Carousel hook, Quote card (white/yellow bars)

### Blabbing
- Colors: #5e17eb indigo, #ffbd59 gold, #381d5c deep indigo
- Font: Inter
- ICP: CRE, PR/comms, university presidents, financial services, public sector
- Positioning: Know your market before everyone else does

## Content rules (baked into all prompts)

- Never attribute MyLÚA pilot stats to IBM
- Never say "certified" for J'Vanay's doula work
- Never reveal patent mechanics, model architecture, or training pipeline
- Never: revolutionizing, transforming, disrupting, game-changing, excited to announce
- No external links in LinkedIn captions (always first comment)
- 3 PascalCase hashtags per post
- LinkedIn personal profile is the primary engine (8x more engagement than company pages)

## Blabbing topic feed load order (Week 1)

1. Black maternal mortality and racial disparities research
2. Doula reimbursement legislation
3. Black Maternal Health Week and BMMA
4. HRSA and NIH maternal health funding
5. Preventable maternal death and hospital accountability
6. Agentic AI in healthcare
7. Medicaid maternal health policy

## Blabbing brand system (confirmed April 2026)

### Color palette (from Canva brand kit)
- Black: #111111
- Primary indigo: #5e17eb
- White: #f8f8f8
- Gold: #ffbd59
- Sage: #a0d2b4
- Tan: #c2b280
- Lavender: #e6e0f8
- Deep indigo: #381d5c
- Yellow: #f5e042
- Dark gray: #333333

### Dark background palette
- Background: #111111 or #0a0a12
- Accent 1: #5e17eb (indigo)
- Accent 2: #ffbd59 (gold)
- Text on dark: #f8f8f8

### Logo URLs
- Light background (black logo): https://raw.githubusercontent.com/Conward24/flask-chatbot/main/Blabbing%20Logo%20-%20Blabbing%20Light%20Background.png
- Dark background (white logo): https://raw.githubusercontent.com/Conward24/flask-chatbot/main/Blabbing%20Dark%20Background.png%20(1).png

### Graphic templates
1. Intelligence Brief — dark bg (#0a0a12), indigo left bar, gold "INTELLIGENCE BRIEF" label, sentiment pill, headline, body, source attribution
2. Signal Proof Card — dark bg (#111111), proof loop format: "Blabbing flagged [day] → [Publication] ran it [X days later]"

### Typography
- Font: Inter
- Voice: Editorial, authoritative, data-forward
- Positioning: "Know your market before everyone else does"
