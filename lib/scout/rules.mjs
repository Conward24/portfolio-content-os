// Rules the Scout's prompts carry. Shared by the worker (breakdowns) and
// /api/scout/mock (our version). Platform rules are condensed from
// ~/promo-advisor/research/tiktok-instagram-2026.md (checked 2026-09-05,
// re-verify by 2026-12-05); change them there first, then here.

const LANE_RULES = {
  mylua: `- mylua: MyLÚA Health, agentic AI for maternal health, sold to doula AGENCIES and care teams (never to solo doulas, never promising moms access). Healthcare authority register: state the principle, show the architecture, no "I discovered" stories. Care roles (coordinator, nurse, doula) are they/them; the member/mom is "her". The companion LÚA has no gender.`,
  henway: `- henway: Henway, turns an idea into a working app without code. IG is the first bite: every example names one of Michael's real audiences (healthcare pros with a side business, entrepreneurs, creators, travel, fitness, tech) first person and aspirational, never a generic example. Say "build message", never "prompt". Henway is solo (Michael alone). Videos are audio-first: Tiffany (the hen's voice) tells the story in first person.`,
  mike: `- mike: Michael's personal account. PhD mechanical engineer turned serial founder, CEO of MyLÚA, IBM and PCORI advisor, travel/fitness/lifestyle. Opens on a scene, one reframe line ("X, not Y"), contractions, NO em dashes anywhere.`,
  blabbing: `- blabbing: Blabbing, AI market intelligence that tells you when news becomes a conversation (co-founded with Jelani). Audience: PR/comms, CRE, finance, university leaders.`,
};

// Only the active lanes (scout/config.json → activeLanes) go into a prompt, so
// parked brands never get fit scores or ideas.
export function brandRules(lanes) {
  return `Michael Conward, Ph.D. is posting short-form for ${lanes.length} lanes. Each idea must name ONE of them.
${lanes.map(l => LANE_RULES[l]).join('\n')}
Hard rules for every lane: no em dashes; never invent stats, quotes, customers or results (write [NEEDS SOURCE] where a number would go); an example person is framed as a hypothetical ("if you're a nurse with a side business..."), never as someone who really used the product, unless Michael names a real one; copy the FORMAT, never the creator's content, wording or personal story.`;
}

export const SHORT_FORM_RULES = `Short-form rules (promo advisor, checked 2026-09-05):
- First line on screen inside 3s, payoff clear inside 6s. On-screen text 5-10 words/sec, 9:16, sound on.
- Original footage only: Instagram stops recommending accounts that mostly post unoriginal work (Apr 2026), TikTok makes re-uploads with another app's watermark ineligible for For You. One clean master, uploaded natively to each app.
- Instagram ranks on watch time, likes per reach and sends per reach; give someone a reason to SEND it to one person.
- Reels: 30-60s has the best reach rate; under 3 min to be recommended. Carousels win saves; Reels win reach for accounts under 50K.
- TikTok: longer wins when completion holds (over 60s beats 30-60s); don't pad.
- 3-5 specific hashtags (both apps cap at 5). Put the plain phrase a stranger would search in the caption, the on-screen text and the spoken line.
- "Link in bio" is fine on Instagram. Captions aren't clickable on either app.`;
