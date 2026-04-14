# Home Desktop — B2B Buyer Score

**Grade: C+**

## What's Working
- Hero addresses the "we already have tools" objection head-on ("Your club runs on four systems. Make them talk to each other.")
- Specific operational jobs listed mid-page give a GM something concrete to forward to the board
- Dark agent-demo block shows the product actually doing work, which reduces "is this vaporware" risk
- FAQ-style block near footer hints at objection handling

## What's Broken
- Zero risk-reversal language above the fold: no "free pilot", "no credit card", "90-day out clause", or money-back terms visible
- No named clubs, no logos, no "used by X private clubs" proof — a GM cannot defend this to a board without a peer reference
- No payback period or ROI number on the home page; the only numbers are feature counts
- Switching-cost objection ignored: nothing about data migration from Jonas/ClubEssential/Northstar or "we import your tee sheet in 30 minutes"
- No implementation timeline ("live in 2 weeks, 0 IT lift") — GMs assume 6-month hell
- CTA is generic "Book a Demo"; doesn't promise what the GM walks away with

## Exact Fix
File: `src/landing/components/HeroSection.jsx` — add a risk-reversal subline directly under the hero CTAs:

```
"30-min onboarding. We load your tee sheet and POS data. You keep the action list whether you sign or not. No credit card, no IT lift, 90-day opt-out."
```

Then in `src/landing/components/TrustStrip.jsx`, replace generic trust copy with: `"In closed pilot with [N] founding private clubs (150–500 members). Ask for a peer reference in your region."` — this directly handles the "who else uses it" objection that kills B2B deals at the board stage.