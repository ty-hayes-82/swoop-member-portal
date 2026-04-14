# Home Desktop — CRO Score

**Grade: B-**

## What's Working
- Strong above-the-fold hero with a primary CTA pair visible before scroll (Book Demo + secondary action), orange button stands out against the dark green field.
- Sticky top nav with persistent "Book a Demo" button — CTA is always one click away across the entire scroll.
- Multiple mid-page CTAs (InlineCta between SaveStory and Integrations, DemoCtaSection at the bottom) prevent dead-end scroll fatigue.
- Social proof, ROI calculator, and "See It / Fix It / Prove It" break up the value prop into micro-conversions that re-engage scanners.

## What's Broken
- Page is a 17-section monolith; first CTA repeats 6+ times with identical "Book a Demo" copy — CTA fatigue and zero differentiation between primary vs. secondary intent.
- No urgency or scarcity signals anywhere above the fold. "Limited founding partner slots" copy only appears buried in the footer CTA block.
- Email capture form at the bottom is the only low-friction micro-conversion — no "get the ROI report", "see sample board brief", or "watch 90-sec demo video" capture for visitors not ready to book.
- Hero sub-CTA appears to be a passive "Watch how it works" link with no visible arrow/play icon — looks like body copy, not an action.
- Button copy is generic ("Book a Demo") — no specificity about time cost, outcome, or what happens next.

## Exact Fix
File: `src/landing/components/HeroSection.jsx`

Replace primary CTA label `Book a Demo` with `Book 30-min Demo -> See Your Club's Leaks` and add urgency line directly under the button:
```jsx
<p className="text-xs text-white/70 mt-2">
  No credit card. 3 founding-partner slots left for Q2.
</p>
```

Then in `src/landing/components/InlineCta.jsx`, differentiate the mid-page CTA from the hero by swapping to a soft-conversion: `Get the 5-min ROI Report (PDF)` that drops an email gate, so non-ready visitors convert to a lead instead of bouncing.
