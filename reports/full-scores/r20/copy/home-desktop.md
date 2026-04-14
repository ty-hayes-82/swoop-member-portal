# Home Desktop — Copy Score

**Grade: B-**

## What's Working
- "Your club runs on four systems. Run all four with one briefing." — specific count, concrete promise, no clichés.
- "The daily brief, written overnight." — short, active, implies a time benefit without adjectives.
- "One page replaces four logins." — parallel to the hero, numeric, concrete.
- "Six AI agents working your club — live." — numeric, present-tense, no hedge words.

## What's Broken
- "Intelligent automation" subhead reads as jargon filler — "intelligent" adds nothing a buyer can price.
- "From the trenches" is a cliche military metaphor that a private-club GM audience will find tone-deaf.
- Hero subhead likely runs long under the H1; the second sentence repeats "four" and dilutes the hook.
- Footer-adjacent CTA button copy appears generic ("Book a Demo") rather than describing what the GM gets.

## Exact Fix
`src/landing/components/HeroSection.jsx`
- Before: "Intelligent automation"
- After: "Agents that act, not alert"

`src/landing/components/SocialProofSection.jsx` (or wherever "From the trenches" lives)
- Before: "From the trenches"
- After: "What GMs told us this week"

`src/landing/components/DemoCtaSection.jsx`
- Before: "Book a Demo"
- After: "See my club's leak — 30 min"
