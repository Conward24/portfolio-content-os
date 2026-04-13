import Anthropic from '@anthropic-ai/sdk';
import { BRANDS, SENTIMENT_TYPES, INTENSITY_LABELS } from '../../lib/constants';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─────────────────────────────────────────────────────────────────
// COMPOSITE PERSONA LAYER
// Applied on top of brand voice — different blend per brand
// ─────────────────────────────────────────────────────────────────

const PERSONA_LAYERS = {
  // MyLÚA: Hormozi (value/offer clarity) + Walker (B2B demand gen) + Moore (category design)
  mylua: `
WRITING PERSONA (apply these lenses to every post):
- Hormozi lens: Lead with the value proposition, not the feature. "This increases postpartum screening compliance" not "MyLÚA has a screening feature." Make the outcome concrete and measurable.
- Chris Walker lens: Build trust before conversion. Enterprise buyers (health plan VPs, care management directors) need to feel understood before they feel sold to. Lead with their problem, not your solution.
- Geoffrey Moore lens: MyLÚA is creating a new market category — "preventive agentic maternal care." Frame posts around category creation language: "This is what it looks like when maternal care shifts from reactive to preventive." Help enterprise buyers understand the category before they buy the product.
- Apply these lenses invisibly — the post should feel like Mike talking, not like a marketing framework.`,

  // Henway: Naval (leverage + positioning) + Moore (beachhead market) + Hormozi (offer clarity)
  henway: `
WRITING PERSONA (apply these lenses to every post):
- Naval lens: Think in leverage. Henway gives founders non-dilutive capital leverage, technical architecture leverage, and institutional network leverage. Posts should communicate that building with Henway multiplies what a founder can do, not just helps them do it.
- Geoffrey Moore lens: Henway is crossing the chasm from "AI consulting" to "venture architecture platform." The beachhead is early-stage AI founders in regulated sectors who need both technical depth and capital access. Every post should speak directly to that specific customer.
- Hormozi lens: Make the offer clear. "We help you go from idea to fundable prototype with $0 of your equity at risk" is cleaner than "we provide AI architecture services." State what the founder gets, what it costs them, and what they leave with.
- Keep it calm and peer-to-peer. Naval's voice, not a pitch deck.`,

  // Blabbing: Gary Vee (distribution + attention) + Walker (demand gen) + Hormozi (value clarity)
  blabbing: `
WRITING PERSONA (apply these lenses to every post):
- Gary Vee lens: Attention is the asset. Blabbing posts should be written for people scrolling fast. The hook has to stop the scroll in under 2 seconds. Use platform-native language — what real professionals in CRE, PR, and finance actually say.
- Chris Walker lens: Demand generation, not lead generation. Don't ask for a demo. Build the belief that intelligence gaps are costing people money, then let them come to you. Show the proof loop ("we caught it 11 days early") rather than describing the product.
- Hormozi lens: The value is already clear — "know your market before everyone else does." Don't dilute it. Every post should make the reader feel the cost of NOT having Blabbing, not just the benefit of having it.`,

  // Mike Personal: All five personas blend — he's the unified founder voice
  mike: `
WRITING PERSONA (apply these lenses to every post):
- Hormozi lens: Be specific about value. "Our pilot showed 90%+ PPD accuracy in the first trimester" beats "we have strong clinical validation." Numbers over adjectives.
- Gary Vee lens: Platform-native. Mike's personal posts should feel native to LinkedIn — not polished marketing copy, not academic writing. A builder thinking out loud, sharing what he's learning.
- Chris Walker lens: B2B demand gen. When writing about MyLÚA for enterprise buyers, lead with the buyer's problem. "Health plans are paying for postpartum care complications that should have been caught 6 months earlier" is the hook — not "MyLÚA is an agentic AI platform."
- Naval lens: Think in systems and leverage. Posts about Henway and AI governance should feel like first-principles thinking — the kind of insight that makes founders say "I've never heard it framed that way."
- Geoffrey Moore lens: Category design. Mike is building three new market categories simultaneously. Posts should occasionally zoom out to the category level: "We're not building a maternal health app. We're building the infrastructure layer for preventive maternal care."`,
};

// ─────────────────────────────────────────────────────────────────
// HASHTAG BANKS
// ─────────────────────────────────────────────────────────────────

const HASHTAG_BANKS = {
  mylua: {
    tier1: ['#BlackMaternalHealth', '#MaternalHealthEquity', '#PerinatalMentalHealth', '#PostpartumDepression', '#AgenticAI', '#HealthEquity', '#MaternalMortality', '#BMHW2026', '#BlackMaternalHealthWeek', '#PostpartumCare', '#Doulas', '#BirthJustice', '#MaternalMentalHealth', '#IBMwatsonx', '#HealthcareAI', '#ValueBasedCare', '#Medicaid', '#DigitalHealth'],
    never: ['#Health', '#AI', '#Tech', '#Women', '#Baby', '#Pregnancy', '#WomensHealth'],
    contextRules: {
      payer: ['#ValueBasedCare', '#HealthPlan', '#MemberEngagement', '#CareManagement'],
      policy: ['#Medicaid', '#HealthPolicy', '#HRSA', '#CMSInnovation', '#PostpartumExtension'],
      ibm: ['#IBMwatsonx', '#AgenticAI', '#WatsonxOrchestrate', '#IBMPartner'],
      bmhw: ['#BMHW2026', '#BlackMaternalHealthWeek', '#RootedInJusticeAndJoy', '#BlackMaternalHealth'],
      mental_health: ['#PerinatalMentalHealth', '#PostpartumDepression', '#MaternalMentalHealth', '#PPD'],
      doula: ['#Doulas', '#BirthWorkers', '#DoulaReimbursement', '#BirthJustice'],
      data: ['#MaternalMortality', '#HealthDisparities', '#RacialHealthEquity', '#PreventableDeath'],
      enterprise: ['#HealthcareAI', '#AgenticAI', '#DigitalHealth', '#ValueBasedCare'],
    },
  },
  henway: {
    tier1: ['#VentureArchitecture', '#NonDilutiveFunding', '#AIGovernance', '#FounderStrategy', '#SBIR', '#STTR', '#AgenticAI', '#StartupFunding', '#AIFounders', '#AIRegulation', '#ResponsibleAI', '#HumanInTheLoop', '#FounderEquity', '#BlackFounders', '#IBMwatsonx'],
    never: ['#Startup', '#Entrepreneur', '#Business', '#AI', '#Tech', '#Innovation', '#Hustle'],
    contextRules: {
      regulation: ['#AIRegulation', '#AIGovernance', '#ResponsibleAI', '#AIPolicy', '#HumanInTheLoop'],
      funding: ['#NonDilutiveFunding', '#SBIR', '#STTR', '#GrantFunding', '#NSFFunding', '#FounderEquity'],
      governance: ['#AgenticAI', '#HumanInTheLoop', '#AIGovernance', '#TrustableAI', '#ResponsibleAI'],
      capital: ['#VentureArchitecture', '#FounderEquity', '#StartupFunding', '#EarlyStageAI'],
      diversity: ['#BlackFounders', '#UnderrepresentedFounders', '#EquitableAI', '#InclusiveTech'],
    },
  },
  blabbing: {
    tier1: ['#MarketIntelligence', '#CompetitiveIntelligence', '#SentimentAnalysis', '#AIContent', '#PRStrategy', '#MediaMonitoring', '#MarketResearch', '#BusinessIntelligence', '#ThoughtLeadership', '#CRE', '#CommercialRealEstate'],
    never: ['#Marketing', '#Content', '#Business', '#AI', '#Data', '#News'],
    contextRules: {
      cre: ['#CRE', '#CommercialRealEstate', '#PropTech', '#RealEstateInvesting', '#CREInvestment'],
      pr: ['#PRStrategy', '#MediaRelations', '#CrisisCommunications', '#Comms', '#PublicRelations'],
      proof_loop: ['#MarketIntelligence', '#CompetitiveIntelligence', '#EarlySignal', '#AheadOfTheCurve'],
      education: ['#HigherEd', '#UniversityLeadership', '#InstitutionalStrategy', '#HigherEducation'],
    },
  },
  mike: {
    tier1: ['#AIArchitecture', '#SerialFounder', '#AgenticAI', '#HealthcareAI', '#BlackMaternalHealth', '#VentureArchitecture', '#NonDilutiveFunding', '#MarketIntelligence', '#ResponsibleAI', '#AIGovernance', '#FounderStrategy', '#BlackFounders', '#IBMwatsonx'],
    never: ['#AI', '#Tech', '#Hustle', '#Grind', '#Entrepreneur', '#Startup'],
    contextRules: {
      mylua: ['#BlackMaternalHealth', '#AgenticAI', '#IBMwatsonx', '#HealthcareAI', '#MaternalHealthEquity'],
      henway: ['#VentureArchitecture', '#NonDilutiveFunding', '#AIGovernance', '#FounderStrategy', '#SBIR'],
      blabbing: ['#MarketIntelligence', '#CompetitiveIntelligence', '#AIContent', '#SentimentAnalysis'],
      ibm: ['#IBMwatsonx', '#AgenticAI', '#EnterpriseAI', '#IBMPartner', '#IBMDataAndAI'],
    },
  },
};

const PLATFORM_HASHTAG_RULES = {
  linkedin: { ideal: 3, note: '3 niche hashtags. Never broad (#AI, #Tech). PascalCase. Quality over quantity — LinkedIn 2026 algorithm rewards relevance not volume.' },
  instagram: { ideal: 8, note: 'Up to 10 community hashtags. Mix niche (under 500K posts) and mid-size. Avoid mega-hashtags over 5M.' },
  twitter: { ideal: 1, note: '0-1 hashtags. Only use for live events (#BMHW2026). Otherwise 0 is fine on X in 2026.' },
};

function buildHashtagInstruction(brand, platform, signal) {
  const bank = HASHTAG_BANKS[brand] || HASHTAG_BANKS.mike;
  const platformKey = platform?.toLowerCase().includes('instagram') ? 'instagram'
    : platform?.toLowerCase().includes('twitter') || platform?.toLowerCase().includes('x/') ? 'twitter'
    : 'linkedin';
  const rules = PLATFORM_HASHTAG_RULES[platformKey];
  const tier1Sample = bank.tier1.slice(0, 10).join(', ');
  const neverList = (bank.never || []).join(', ');
  const contextRulesList = bank.contextRules
    ? Object.entries(bank.contextRules).map(([ctx, tags]) => `  - Post about ${ctx}: consider ${tags.join(', ')}`).join('\n')
    : '';

  return `
HASHTAG RULES:
Platform: ${platformKey} — ${rules.note}
Use exactly ${rules.ideal} hashtags.

Selection process:
1. Read the post carefully. What specific topic is this post actually about?
2. Choose hashtags that match those specific topics — not generic brand hashtags.
3. Pull from Tier 1 pool: ${tier1Sample}
4. Context-based additions:
${contextRulesList}
5. NEVER use: ${neverList}
6. PascalCase format always (#BlackMaternalHealth not #blackmaternalhealth)
7. Place all hashtags on their own line at the very end.
8. Hashtags must reflect what THIS post is about — relevance beats brand consistency.`;
}

// ─────────────────────────────────────────────────────────────────
// POST TYPE INSTRUCTIONS
// ─────────────────────────────────────────────────────────────────

const POST_TYPE_INSTRUCTIONS = {
  signal: `Write a LinkedIn signal text post. Lead with one strong, unhedged claim grounded in the signal. Short paragraphs, 1-3 sentences each. Use → arrows for any list items. End with a question, CTA, or forward-looking statement.`,
  sentiment: `Write a LinkedIn sentiment post calibrated to the emotional direction and intensity specified. The power comes from naming what the audience is already feeling — don't soften it. Then pivot to the insight or implication.`,
  stat: `Write a LinkedIn stat card post. One number leads everything. Stat is the hook — everything else supports it. 3-4 short lines max.`,
  carousel: `Write a LinkedIn carousel script. Output 6 slide scripts: SLIDE 1 (hook — bold claim, ends "Swipe →"), SLIDES 2-5 (one point each — title + 2 sentences), SLIDE 6 (closing question or key takeaway + follow CTA). Keep each slide tight — it's a small card.`,
  brief: `Write a LinkedIn weekly intelligence brief. Lead with the sharpest signal. Use → for 3-4 intelligence items. Close with Mike's take on what it means. Editorial, informed, builder-voice.`,
  usecase: `Write a LinkedIn use case story post. No client names. Use "In a recent [sector] deployment..." framing. Problem → architecture approach → outcome. Engineer sharing what they learned.`,
  quote: `Write a LinkedIn quote card post. Single sharpest insight as pull quote. 2-3 lines context. Attribution line. Short. Clean. Will be repurposed as Instagram quote card.`,
};

function extractHashtags(text) {
  const matches = text.match(/#[A-Za-z][A-Za-z0-9]*/g) || [];
  return [...new Set(matches)];
}

// ─────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { brand, postType, postCount, input, sentiment, intensity, platform } = req.body;
  if (!input?.trim()) return res.status(400).json({ error: 'No input provided' });

  const brandConfig = BRANDS[brand];
  if (!brandConfig) return res.status(400).json({ error: 'Invalid brand' });

  const personaLayer = PERSONA_LAYERS[brand] || PERSONA_LAYERS.mike;
  const postTypeInstruction = POST_TYPE_INSTRUCTIONS[postType] || POST_TYPE_INSTRUCTIONS.signal;
  const hashtagInstruction = buildHashtagInstruction(brand, platform, input);

  let sentimentContext = '';
  if (postType === 'sentiment' && sentiment) {
    const s = SENTIMENT_TYPES[sentiment];
    const intensityLevel = intensity || 2;
    sentimentContext = `
SENTIMENT: ${s?.name} at ${INTENSITY_LABELS[intensityLevel]} intensity.
Instruction: ${s?.instructions?.[intensityLevel]}
Timing note for user: ${s?.timing}`;
  }

  const formatRules = `
FORMAT:
- Hook first — one strong specific unhedged claim. Never open with a question.
- Short paragraphs, 1-3 sentences max
- → arrows for lists, never bullets or dashes
- Specific data point behind every claim
- End with question, CTA, or forward-looking statement — before hashtags
- No external links in caption body (first comment only)
- NEVER: revolutionizing, transforming, disrupting, game-changing, excited to announce
- Write only the post. No preamble, no explanation.`;

  const systemPrompt = `${brandConfig.systemPrompt}
${personaLayer}
POST TYPE: ${postTypeInstruction}
${sentimentContext}
${hashtagInstruction}
${formatRules}`;

  const count = Math.min(postCount || 1, 3);
  const userMessage = count > 1
    ? `Signal/idea: ${input}\n\nWrite ${count} distinct posts. Separate with "---POST---". Different angle, hook, or framing for each. Each ends with exactly ${PLATFORM_HASHTAG_RULES.linkedin.ideal} contextually derived hashtags.`
    : `Signal/idea: ${input}\n\nWrite the post.`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const rawText = message.content[0]?.text || '';
    let drafts;
    if (count > 1) {
      drafts = rawText.split('---POST---').map(t => t.trim()).filter(Boolean).map((copy, i) => ({
        id: `draft-${Date.now()}-${i}`, copy, brand, postType,
        sentiment: postType === 'sentiment' ? sentiment : null,
        hashtags: extractHashtags(copy),
      }));
    } else {
      drafts = [{ id: `draft-${Date.now()}-0`, copy: rawText.trim(), brand, postType,
        sentiment: postType === 'sentiment' ? sentiment : null,
        hashtags: extractHashtags(rawText),
      }];
    }

    return res.status(200).json({ drafts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Generation failed', details: err.message });
  }
}
