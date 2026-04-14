# Home Mobile — Copy Score

**Grade: C+**

## What's Working
- Hero H1 "Your club runs on four systems" still lands at mobile width because the number anchors the line.
- Short subheads like "The daily brief, written overnight." survive the narrow column intact.
- Section eyebrows (e.g. "HOW IT WORKS") provide scannable signposts in a long scroll.

## What's Broken
- On mobile the hero paragraph wraps to 6+ lines — the second sentence "Run all four with one briefing" should be the headline, not buried.
- Multiple CTA buttons stack with identical "Book a Demo" labels — repetitive and uninformative.
- Body paragraphs across sections average 3–4 lines of connective tissue ("so that", "which means") that mobile readers will skip.
- Headline-body mismatch: sections with sharp H2s are followed by abstract descriptions ("connecting tee sheet, POS, CRM, scheduling…") that don't deliver on the headline's promise.

## Exact Fix
`src/landing/components/HeroSection.jsx`
- Before: "Your club runs on four systems. Run all four with one briefing."
- After: "Four systems. One morning briefing."

`src/landing/components/DemoCtaSection.jsx` (all secondary CTAs)
- Before: "Book a Demo" (repeated 4x)
- After rotate: "See the leak report" / "Watch a 2-min demo" / "Talk to a GM using Swoop"

`src/landing/components/CoreCapabilitiesSection.jsx`
- Before: long hedged body copy
- After: cut every sentence that starts with "We" or "Our platform" — keep only sentences that start with a verb the GM does.
