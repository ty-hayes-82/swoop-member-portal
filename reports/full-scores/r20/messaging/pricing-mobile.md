# Pricing Mobile — Messaging Score

**Grade: B+**

## What's Working
- "The platform that pays for itself." compresses beautifully on mobile — it's a full value prop in one line, no wrap.
- ROI calculator result ($126,100 / $83,500) is visible on mobile without horizontal scroll — that's the single most persuasive element on the whole site and it survives the narrow viewport.
- Three tiers stack cleanly; $0 / $499 / $1,499 reads in order of commitment.
- "Things GMs ask us" FAQ in GM voice still lands.

## What's Broken
- The three stat-strip numbers (3,000+ / $2.18 / 67%) are tiny and uncaptioned on mobile — one of them appears to render as "$2.18" instead of "$2.1B" which is a credibility-killing typo-or-truncation on the page whose entire job is proving math. CRITICAL.
- Tier cards are too tall on mobile — the $499 "Most Popular" card is buried below a full scroll, so the anchor comparison fails.
- "Start at zero. Upgrade when the math shows up." loses its punch because the $0 card appears before the headline on mobile stack order.
- FAQ accordion items are closed by default and the questions alone don't sell — GM skims five questions and bounces.
- Final CTA "Ready to see which of your members are at risk?" is the strongest line on the page and it's buried at the bottom on mobile.

## Exact Fix
File: `src/landing/pages/PricingPage.jsx` (and `PricingSection.jsx`)

- AUDIT THE STAT: confirm it renders "$2.1B" not "$2.18" on mobile — likely a font-size/letter-spacing clipping issue in `IndustryStatsSection.jsx`. Fix before anything else.
- Add captions inline under each stat on mobile: "members analyzed" / "lifetime value modeled" / "at-risk saves converted."
- On mobile reorder tier stack: $499 (Most Popular) first, $0 second, $1,499 third. Match desktop's visual anchor behavior.
- Add a mobile-only sticky bottom bar with "See my club's ROI →" that jumps to the calculator.
- Pre-open FAQ question 1 on mobile so a GM sees at least one real answer without a tap.
- Move "Ready to see which of your members are at risk?" to directly below the calculator result, not the page footer.
