# About Mobile — CRO Score

**Grade: C**

## What's Working
- Page actually renders on mobile (unlike desktop) — hero "Built for the people who run private clubs" is present with a strong, humanizing headline.
- "The humans in your clubhouse for six months" subheadline is emotionally differentiated from typical SaaS copy — builds trust.
- Sticky hamburger nav retains Book Demo access.
- Copy mentions "closed pilot with founding-partner clubs" — implicit scarcity signal.

## What's Broken
- No primary CTA button in the hero — the headline lands with zero action surface. A GM who's sold on the story has nowhere to click.
- "ABOUT SWOOP" and "WHO YOU'LL WORK WITH" eyebrows are pure content markers — no micro-conversion (e.g., "Meet the team -> Book 15-min coffee chat").
- Founding-partner scarcity is mentioned in body copy but not monetized as a CTA ("Join the 3 remaining pilot slots").
- No team photos visible in the cropped viewport — the "humans in your clubhouse" claim needs faces to convert.
- Page is almost certainly a dead end after team section — no mid-page InlineCta or bottom DemoCtaSection visible in this screenshot.

## Exact Fix
File: `src/landing/pages/AboutPage.jsx`

Add a CTA directly in the About hero:
```jsx
<HeroSection
  eyebrow="About Swoop"
  title="Built for the people who run private clubs"
  primaryCta={{ label: 'Book a 15-min Coffee Chat', href: '#book' }}
  secondaryCta={{ label: 'Meet the team ->', href: '#team' }}
/>
```

Then ensure `DemoCtaSection` with copy `Join the 3 remaining founding-partner slots` is imported and rendered at the bottom of the page so there is no dead end after the team bio.
