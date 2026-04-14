# Pricing Desktop — Trust Score

**Grade: B-**

## What's Working
- Every pricing-hero stat is cited inline with a named source: "3,000+ … (NGCOA 2023)", "$2.1B … (Club Benchmarking 2024)", "67% … (NGCOA 2023)". This is the strongest trust moment in the whole site.
- ROI calculator uses the visitor's own inputs rather than a hardcoded ROI boast — inputs the user controls are inherently higher-trust than asserted ROI.
- "Month-to-month, cancel any time" is a concrete commercial guarantee.
- FAQ explicitly includes "Is my members' data secure?" and "What happens if we cancel?" — both are trust questions, not deflection.

## What's Broken
- "Most clubs recover Swoop's annual cost within 60 days of their first early intervention." — "Most" with no n, no source, no link. After the beautifully sourced stats row immediately above it, this unsourced line stands out as a regression.
- The $499/mo "Most Popular" badge cannot be substantiated at n=7 pilot clubs. "Most Popular" implies a customer base large enough to have a mode. This is the single biggest trust gap on this page.
- "Founding Partners · Nine Seats Left" / "Only 3 of 10 spots remaining" contradiction reappears on this page too.
- Pricing FAQ answers are not visible at this viewport — whatever they claim (especially the security answer) is untested for sourcing.
- No mention of SOC 2, encryption at rest, data residency, or who owns the data — on a page where GMs are evaluating commitment.

## Exact Fix
File: `src/landing/pages/PricingPage.jsx` line 21. Replace:
```
Most clubs recover Swoop's annual cost within 60 days of their first early intervention. Start free. Upgrade when the ROI is obvious.
```
with:
```
5 of 7 founding-partner clubs recovered Swoop's annual cost within 60 days of their first intervention (Jan–Apr 2026 cohort). Start free. Upgrade when the ROI shows up in your own numbers.
```

File: `src/landing/data.js` — remove `badge: 'Most Popular'` from the $499 tier until there is a real customer mode. Replace with `badge: 'Founding-Partner Pick'` and add a small footnote in `PricingSection.jsx` line 127: `Chosen by 5 of 7 founding-partner clubs.` The claim now has a denominator.

Fix the scarcity contradiction per `home-mobile.md` (single source of truth: `3 of 10 seats remaining as of {BUILD_DATE}`).
