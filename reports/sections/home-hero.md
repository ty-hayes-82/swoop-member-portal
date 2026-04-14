# Hero Section — Section Score

**Overall Grade: B-**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | B | Pain framing is strong but the payoff ("$74K") lacks attribution |
| Design/Visual | B+ | Clean layout; golf ball photo adds zero conversion value |
| CRO/Conversion | C+ | Two CTAs competing with near-equal visual weight |
| Trust/Credibility | C | "$74K" is unattributed — reads as made-up |
| Mobile UX | C | Can't assess mobile; desktop layout will stack awkwardly |
| Navigation/UX | B | Nav is minimal and clean; "Agents" label is cryptic |
| B2B Buyer Journey | B- | Speaks to pain but stops before proof — no TOFU social proof |
| Copy/Voice | B | Headline is punchy; subhead is weak and generic |
| Technical Credibility | C+ | "28 integrations" is buried; no integration logos visible |

## Messaging/Positioning
**Grade: B**
- What's working: "Your club runs on four systems. None of them talk to each other." is a genuine insight headline — it names the problem without buzzwords. "PRIVATE CLUB INTELLIGENCE · BUILT FOR GMS" eyebrow correctly identifies buyer.
- What's broken: The payoff sentence "protect $74K in dues a year" is unsourced. GMs will immediately ask "whose $74K?" The jump from pain diagnosis to dollar claim with no bridge collapses credibility.
- Fix: Add attribution inline: "surface at-risk members and protect an average of $74K in annual dues. Based on 300-member club data."

## Design/Visual
**Grade: B+**
- What's working: Off-white background, clean serif-adjacent bold headline, and orange accent create a premium-but-approachable feel appropriate for private club buyers. Generous whitespace.
- What's broken: The hero image (golf ball near cup) is decorative filler. It communicates nothing about the software, adds no proof, and wastes the most valuable visual real estate on the page. A GM sees it and learns nothing.
- Fix: Replace with a cropped, real product screenshot — specifically the member risk dashboard or the alert feed — with a subtle drop shadow. Add a caption: "Live member health feed — updated nightly." Size it at the current image dimensions.

## CRO/Conversion
**Grade: C+**
- What's working: Two CTAs are present. "Book the 30-minute walkthrough" is specific and low-friction — the time-box reduces anxiety.
- What's broken: "See it in action →" has nearly identical visual weight to the primary CTA. Secondary CTAs should be ghost/text-only so the eye hierarchy is unambiguous. The trust badges below ("Live in under 2 weeks · No rip-and-replace · 28 integrations") are tiny and low-contrast — most visitors won't read them.
- Fix: Make "See it in action →" a text link with no border: `<a class="text-link" href="#demo-video">See it in action →</a>`. Increase trust badge font size to 13px and raise contrast to at least 4.5:1.

## Trust/Credibility
**Grade: C**
- What's working: Trust badge row exists (live in 2 weeks, no rip-and-replace, 28 integrations). These are objection-killers if read.
- What's broken: "$74K" has no source. "28 integrations" is a number floating in air with no logos. "Live in under 2 weeks" is a bold claim with no proof. None of the three badges link anywhere. A skeptical GM assumes all three are marketing fiction.
- Fix: (1) Source the $74K: "avg. $74K protected · based on 300-member club data." (2) Replace "28 integrations" badge with 4–5 inline integration logos (Jonas, Foretees, ClubWise, etc.) at 20px height. (3) Add "No credit card required" beneath the primary CTA.

## Mobile UX
**Grade: C**
- What's working: The two-column layout with text left / image right will collapse to single column naturally.
- What's broken: At 375px, the headline "Your club runs on four systems. None of them talk to each other." is 5 lines at ~28px — the fold is consumed by headline alone. The decorative image will either push CTAs below the fold or be removed, losing even its minimal value. Trust badge row will wrap into a 2×2 or 3-line stack that reads as clutter.
- Fix: Add `@media (max-width: 768px) { .hero-headline { font-size: 2rem; } .hero-image { display: none; } .trust-badges { flex-direction: column; gap: 4px; } }`. On mobile, swap hero image for a single social proof quote in its place.

## Navigation/UX
**Grade: B**
- What's working: Three-item nav (Platform, Agents, Pricing) is appropriately minimal for B2B. "Book a Demo" in the nav reinforces the primary CTA.
- What's broken: "Agents" as a nav label is jargon — a GM visiting for the first time doesn't know what "Agents" means in this context. It could mean staff agents or AI agents. No active state visible. No mobile hamburger shown.
- Fix: Rename "Agents" to "AI Agents" or better yet "How It Works" to reduce friction. If the page covers AI automation features, "How It Works" sets clearer expectations for a first-time B2B visitor.

## B2B Buyer Journey
**Grade: B-**
- What's working: The eyebrow "BUILT FOR GMS" signals the exact buyer. The pain-first headline respects that GMs are busy and pattern-match on their own problems quickly.
- What's broken: After the CTA, there's no TOFU social proof — no club names, no testimonial fragment, no "trusted by X clubs." A GM landing cold has zero external validation before being asked to book a call. This is a trust gap at the most critical moment.
- Fix: Add a social proof bar directly below the trust badges: "Trusted by private clubs across [regions] — including [Club A], [Club B], and [Club C]." Even 2–3 anonymized club descriptions ("A 450-member East Coast club reduced lapse rate by 18% in 90 days") outperform zero proof.

## Copy/Voice
**Grade: B**
- What's working: "Your club runs on four systems. None of them talk to each other." — conversational, specific, does not open with a feature. Correct voice for a GM who is skeptical of software.
- What's broken: "Swoop connects your tee sheet, CRM, and POS to surface at-risk members and protect $74K in dues a year. Live in two weeks. No rip-and-replace." is three disconnected ideas crammed into two sentences. "Surface at-risk members" is jargon. "No rip-and-replace" is defensive phrasing — it assumes the reader already has an objection.
- Fix: Replace subhead with: "Swoop reads your tee sheet, CRM, and POS every night — then tells your team exactly which members are slipping away and what to do about it. Average club protects $74K in annual dues. Live in two weeks, no IT project."

## Technical Credibility
**Grade: C+**
- What's working: "Live in under 2 weeks" is a concrete, testable claim. "28 integrations" signals breadth.
- What's broken: No integration names, no logos, no mention of how data is accessed (read-only API? file export? bidirectional?). "28 integrations" is meaningless if Jonas Golf or Foretees isn't in the list. A GM's first technical question is "does it work with our systems?" — this hero does not answer it.
- Fix: Below "28 integrations," add a micro-line: "Including Jonas, Foretees, ClubWise, Northstar, and 24 more." Link to a full integrations page. This alone will reduce "does it work with our system?" sales objections by a measurable margin.

## Top 3 Priority Fixes for This Section
1. Replace the decorative golf-ball photo with a real product screenshot (member risk dashboard) — this is the single highest-leverage change on the page. Every B2B hero that shows the actual product converts better than one that shows lifestyle imagery.
2. Source and rewrite the $74K claim with attribution ("avg. based on 300-member club data") and replace the subhead with the rewritten version above — unattributed dollar claims actively hurt credibility with analytical GM buyers.
3. Drop the "See it in action" button to text-link weight and add a social proof bar (club names or anonymized proof snippets) below the CTA block — dual CTAs of equal weight split attention and social proof absence is the biggest trust gap at the fold.
