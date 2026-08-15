/**
 * Platform distribution rules, checked against current sources.
 *
 * ⚠️ VERIFIED 2026-08-12. Algorithm behaviour moves faster than any codebase.
 * Re-check before a major launch and update the date. An unchecked rule here is
 * worse than no rule, because it gets followed.
 *
 * Sources consulted 2026-08-12:
 *  - Forbes, "5 LinkedIn Content Moves LinkedIn Started Punishing In 2026" (2026-07-23)
 *  - Forbes, "The LinkedIn Link Penalty Cutting Your Reach By 60%" (2026-07-30)
 *  - Sprout Social / Buffer / Kanbox (4.8M posts) timing studies, 2026
 *  - Metricool 2026 posting-frequency study
 *  - Aggregated 2026 hashtag studies (ContentIn, Writio, meet-lea)
 */

export const PLATFORM_RULES_VERIFIED = '2026-08-15';

export const LINKEDIN_RULES = `## LinkedIn distribution, verified 2026-08-12

### External links — the first-comment workaround is DEAD
This reverses the long-standing rule and it is the single most important change.

- An external link in the post body costs roughly 60% of reach (one 1.3M-post study
  measured 18.8% on median reach; the widely reported figure is far higher).
- **Putting the link in the first comment no longer avoids it.** LinkedIn now detects
  "bridge behaviour" — a post clearly built to funnel people to a link in the comments —
  and applies the same penalty. Comments containing external links are themselves
  suppressed, reportedly by up to 80%.

What to do instead, in order of preference:
1. **Make the post self-contained.** Say the thing. No link needed.
2. **Give people a searchable handle** rather than a URL — a session code, a title, a
   name they can look up. Costs nothing, no penalty.
3. **Offer the link to people who engage**, by DM or in reply to a comment asking for it.
   This is now the recommended pattern and it doubles as a warm-lead filter.
4. **Go native** — a LinkedIn article, document carousel, or newsletter carries no
   link penalty because the destination is on-platform.
5. **Accept the penalty deliberately** when conversion genuinely matters more than reach
   (a launch post with a real CTA). Make it a decision, not a default.

### Hashtags — 3 is fine, but they are not the lever
Data is mixed and the effect is small either way. The 3-5 range is the consistent
recommendation; more than 10 measurably hurts. Keep the current 3.

**Keywords in the body of the post teach the algorithm what you write about far more
reliably than the tags at the end.** If a post is about agentic AI in healthcare, those
words should appear in the copy, not only in the hashtags.

### What actually drives distribution now
- **Saves are worth roughly 5x a like.** Write things worth keeping: a framework, a
  checklist, a number with its interpretation, something re-readable.
- **Dwell time decides distribution.** A post someone reads slowly beats a post someone
  likes quickly. This rewards substance and specificity over punchy and empty.
- **Generic AI content is algorithmically ignored** — not flagged, just skipped in under
  three seconds, and the dead dwell time suppresses it. This is a distribution reason to
  sound human, on top of the taste reason.
- **Comment bait is actively suppressed.** No "Comment YES if you agree", no
  "drop a 🙌 below". Asking a real question is fine; asking for a keyword is not.
- **Engagement pods are neutralised** and suppress every post involved. Do not use them.

### Timing — days were right, times were not
**Days:** Tue/Wed/Thu, Wednesday strongest. Sunday is the worst day on LinkedIn (28/100)
and weekends run 50-70% below weekdays. Fridays underperform for B2B. Unchanged.

**Times: post 10:00-14:00 ET, not 07:00-09:00.** The old 7-9am window predates the current
data and sits before a B2B audience arrives; reach peaks 10-11am. It also lands at 4-6am
Pacific, and much of a US B2B audience is west of Eastern. One source reports afternoons
(3-8pm) now outperforming mornings, with Wednesday 4pm the single strongest slot of the
week. That conflicts with the majority view, so treat it as something to TEST on a couple
of posts rather than a switch to make wholesale.

Practical reason that outranks both: the algorithm weighs the first 60-90 minutes heavily,
so post when you can actually answer comments. 10am is workable. 7:30am is not.

### Spacing between posts on the same account — checked 2026-08-15
**Leave 18-24 hours minimum, and prefer more.** Two posts inside a 4-hour window and the
algorithm kills the first to test the second. That is the hard floor, but it is not the
target: a strong post now accumulates reach for **48-72 hours**, so a next-day post competes
with your own still-circulating one rather than being killed by it.

The practical rule: give the posts that matter clear air on both sides. Routine cadence at
2-4/week naturally lands 48h+ apart anyway; the mistake is stacking a launch and its
follow-up on consecutive days, which is exactly what spends the launch's tail.

One dissenting source claims the current algorithm supports "content velocity" at up to three
posts a day without cannibalisation. It is a minority view against several others, so treat it
as something to test, not a licence to stack.

### Instagram — checked 2026-08-15, first time this file has covered it
**Days: Wednesday strongest, then Thursday and Tuesday.** Same shape as LinkedIn.
**Times: 6-9am, 11am-1pm, and 7-9pm ET.** Two peaks, a morning scroll and an evening
wind-down, which is what separates it from LinkedIn's single midday window. Avoid weeknights
after 10pm.

Because the peaks do not overlap, a LinkedIn post at 10am and an Instagram post at 7pm can
carry the same news on the same day without competing. Different platforms, different
audiences, no shared feed.

Caveat worth respecting: his own Instagram Insights beat any benchmark here. These are
starting points, not findings about HIS audience.

### Cadence — the plan is inside the bands
Company pages 3-4/week (plan: 4). Personal 2-5/week (plan: 1-2 Henway, plus MyLÚA and
Blabbing sharing the same profile). Metricool's 2026 study puts real-world averages at
2.34 company and 3.05 personal, so the plan runs slightly above average, which is fine.
Consistency beats frequency: several times a week sustained beats a burst then silence.

### ⚠️ The strategic finding, bigger than any schedule change
**Personal profiles reach far further than company pages** — reported at 500%+ more reach
for identical content and 238% more comments. Company pages get shared roughly 15x more,
so they still matter for spreading a message beyond your own network.

The current split is 18 company posts to 8 personal, which optimises the weaker surface.
The reason is real (one personal profile shared across three brands), but "the company
page is the workhorse" deserves revisiting, and the rule about commenting from personal
on every company-page post is doing more work than it looks like.

### After posting — the golden hour, and when to stop
LinkedIn shows a new post to a small slice of the network and decides from the response in
the **first 60-90 minutes** whether to widen it. Concretely:
- Replying to comments lifts engagement ~30%; replying within the first hour is worth
  roughly a 35% visibility boost.
- A reply within **15 minutes** of a comment has the strongest effect, because it lands
  inside the evaluation window.
- **Comments carry 8-15x the algorithmic weight of a like.** One real reply beats fifty
  reactions, which is why answering is worth more than posting more.

So the useful shape is three short sweeps and then stop, not grazing all day:
**+15 min** (the one that matters most), **+45 min**, **+90 min**. After 90 minutes the
distribution decision is largely made; late comments are still worth answering for the
relationship, just not urgently.

This is implemented rather than left as advice: the ICS feed carries alarms at +15, +45 and
+90 on every post, and /today shows a live golden-hour countdown once a post is marked
posted, computed from when he actually posted rather than when it was scheduled.

### Still holds
Replying to comments quickly, and commenting from the personal profile on company-page
posts, both remain sound — they generate genuine engagement rather than simulating it.`;

export const TIKTOK_RULES = `## TikTok, verified 2026-08-12
Links in captions are not clickable, so the bio remains the only route. Unchanged.
Trending audio still matters, which is why masters ship silent and the sound is chosen
at upload.

### Timing — checked 2026-08-12, and deliberately NOT changed
The aggregate studies contradict each other badly enough to be unusable:

- Buffer (7M posts): best slots are Sunday 9am, Monday 1pm, Sunday 1pm; engagement rises
  in the evening, 6-11pm.
- Sprout (~2B engagements, 307K profiles): weekday afternoons win and **weekends are the
  weakest days** — the direct opposite of Buffer on weekends.
- Others put Wednesday/Thursday on top at 9am and again 4-8pm, and one rates Saturday the
  single best day while another calls 12-5pm the lowest-engagement window of the day.

Two major studies disagreeing on whether weekends are best or worst is not a signal, so the
calendar's existing slots stand: 18:00 weekdays (inside the widely cited 6-11pm evening
window) and 11:00 at weekends.

**The bigger reason not to tune this yet: the Henway account is brand new with no followers.**
"Post when your audience is online" assumes an audience. TikTok is an interest graph — it
pushes a new video to a test audience and decides from that first-hour response, largely
regardless of clock time. For the first 10-20 videos, content and consistency decide
everything and posting hour is noise. This matches what the launch doc already expects:
"Expect the new account to do very little for its first 10-20 videos."

**Decision point:** after ~15-20 videos, open TikTok Analytics → Followers → most active
times, and set the schedule from his own data. That will beat every aggregate above, because
it describes the audience he actually has.`;
