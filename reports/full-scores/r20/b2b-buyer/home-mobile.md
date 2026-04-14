# Home Mobile — B2B Buyer Score

**Grade: C**

## What's Working
- Hero CTA is thumb-reachable and the promise ("make them talk to each other") is legible on a phone
- Vertical stack of operational jobs is scannable at stoplight-reading speed — a GM can skim between meetings
- Dark agent-demo block preserves its product-is-real credibility on mobile

## What's Broken
- Risk-reversal language is completely absent on the first two mobile screens — a GM evaluating on phone sees zero reason to believe this is low-risk
- No social proof card ("pilot clubs", headshots, or a single named reference) in the first scroll; mobile buyers bounce before reaching any proof
- The pricing/ROI number a GM needs to forward to the board is buried 6+ scrolls down
- "Book a Demo" mobile CTA doesn't say what the demo delivers — no "get your club's action list in 30 min" hook
- No sticky mobile CTA after scroll, so if the GM reads 60% and wants to act, they have to scroll back up

## Exact Fix
File: `src/landing/components/HeroSection.jsx` — add a mobile-visible risk strip under the primary CTA, rendered as a one-line badge:

```
"Free 30-min diagnostic  •  No credit card  •  You keep the action list"
```

Then in `src/landing/LandingShell.jsx` (or `LandingNav.jsx`), add a sticky-bottom mobile CTA: `"Book the 30-min diagnostic — you keep the findings"` — this converts the GM who reads on their phone during a board meeting and wants a single tap to act, and it reframes the demo from "sales pitch" (objection) to "free audit" (value).