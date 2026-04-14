# Pricing Mobile — Copy Score

**Grade: B+**

## What's Working
- "The platform that pays for itself." holds at narrow width.
- Tier stacks vertically with dollar amounts leading — exactly what mobile pricing should do.
- "Start at zero. Upgrade when the math shows up." still lands on one mobile line.

## What's Broken
- The three stat cards stack vertically and lose their comparison power — on mobile the eye sees three disconnected numbers rather than one story.
- Tier feature lists likely run 6–8 bullets each — on mobile that's 18–24 vertical lines of feature parity arguments no GM will read.
- "What is member turnover costing your club?" headline is followed by a static illustration; the question needs an interactive answer on mobile or the headline feels rhetorical.
- Tier CTA buttons likely all say "Get Started" — should differ by tier intent.

## Exact Fix
`src/landing/pages/PricingPage.jsx` (mobile stat presentation)
- Before: three separate stat cards
- After: one headline sentence — "Across 3,000+ US private clubs, 67% of $2.1B in annual churn is preventable."

`src/landing/pages/PricingPage.jsx` (tier CTAs)
- Before: "Get Started" x3
- After: "Start free" / "Start the 14-day pilot" / "Talk to founders"

`src/landing/components/PricingSection.jsx` (tier bullets)
- Before: 6–8 bullets per tier
- After: cap at 4 bullets; move the rest to a collapsible "See everything included" toggle.
