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
 *  - Aggregated 2026 hashtag studies (ContentIn, Writio, meet-lea)
 */

export const PLATFORM_RULES_VERIFIED = '2026-08-12';

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

### Still holds
Replying to comments quickly, and commenting from the personal profile on company-page
posts, both remain sound — they generate genuine engagement rather than simulating it.`;

export const TIKTOK_RULES = `## TikTok, verified 2026-08-12
Links in captions are not clickable, so the bio remains the only route. Unchanged.
Trending audio still matters, which is why masters ship silent and the sound is chosen
at upload.`;
