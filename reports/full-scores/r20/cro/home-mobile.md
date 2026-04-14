# Home Mobile — CRO Score

**Grade: C+**

## What's Working
- Primary CTA button sits within the first viewport and spans full-width — thumb-friendly tap target.
- Sticky header retains "Book a Demo" in the hamburger zone so the CTA never leaves the screen.
- Vertical stack is scannable; each section has its own CTA re-prompt so scroll depth doesn't strand users.

## What's Broken
- Hero sub-headline and the "watch how it works" secondary CTA collapse into the same text color — mobile users can't distinguish the secondary action.
- 17 stacked sections create a ~20+ screen-height scroll on mobile — extreme CTA repetition without variation creates banner blindness.
- No click-to-call or SMS CTA — on mobile, "Book a Demo" that opens a form is 3x higher friction than `tel:` / `sms:` for a GM on the course.
- ROI calculator and interactive widgets compress badly on narrow viewport — becomes a passive read instead of a micro-conversion.
- No sticky bottom-bar CTA (common mobile pattern) — when the user scrolls past hero, they have to scroll back up or tap hamburger.

## Exact Fix
File: `src/landing/components/HeroSection.jsx`

Add a mobile-only sticky bottom CTA bar:
```jsx
<div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-ink border-t border-white/10 p-3 flex gap-2">
  <a href="tel:+14805551234" className="flex-1 text-center py-3 rounded-lg border border-orange text-orange font-semibold">Call</a>
  <a href="#book" className="flex-1 text-center py-3 rounded-lg bg-orange text-ink font-bold">Book 30-min Demo</a>
</div>
```

Also in `src/landing/pages/HomePage.jsx`, gate sections 6-12 behind a "Show full tour" expander on mobile to shrink scroll depth from 20 viewports to 8.
