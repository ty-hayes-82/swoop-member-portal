# Pricing Mobile — B2B Buyer Score

**Grade: B**

## What's Working
- The three hero stats stack cleanly on mobile and each one is a standalone board-slide data point
- ROI calculator with $128K/$89K/$82K triad is visible within the first two scrolls — mobile GMs see the money quickly
- $0/mo diagnostic tier is positioned first, matching the buyer's natural risk-aversion ("show me the cheapest door in")
- "Things GMs ask us" exists at all — most competitor mobile pricing pages don't handle objections

## What's Broken
- No payback-period copy visible on any tier — mobile buyers need "pays for itself in X weeks" as a single line
- No source citation under hero stats; mobile buyers can't drill down into footnotes easily so the numbers feel made up
- FAQ is collapsed on mobile and the questions aren't weighted to the highest-friction objections (cancel terms, data ownership, contract length)
- No "no credit card" / "no contract" badge near the CTA — the one piece of language that most improves mobile B2B conversion
- Mobile CTA is generic "Book a Demo", not "Start free 30-min diagnostic"

## Exact Fix
File: `src/landing/components/PricingSection.jsx` — add a mobile-only badge row immediately under each paid tier CTA:

```
"No contract  •  Cancel in 90 days, full refund  •  Your data stays yours"
```

And change the $0/mo CTA label to: `"Start free 30-min diagnostic — keep the report"`. In `src/landing/components/FaqSection.jsx`, ensure the first three FAQ items (on mobile) are: (1) "Can we cancel and keep our data?" (2) "How long until we're live?" (3) "Does this work with [Jonas/Clubessential]?" — these are the three questions that decide mobile B2B deals in the private-club segment.