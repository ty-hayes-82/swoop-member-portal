# Home Mobile — Messaging Score

**Grade: C+**

## What's Working
- Hero headline survives the narrow column — "Your club runs on four systems. Swoop collects them every morning." still reads as a single clear thought on a phone, which is rare.
- Orange CTA buttons repeat consistently through the scroll, so a GM on a fairway walk can tap at any point.
- Short stacked copy blocks keep each message self-contained; no dense paragraphs that lose a mobile scroller.

## What's Broken
- The page is brutally long on mobile — easily 8+ screens — and the messaging REPEATS (four-system pitch, then agents pitch, then connect-your-tools pitch, then one-page-four-logins pitch). On mobile this reads as four half-baked value props instead of one sharp one.
- Headline hierarchy collapses: on desktop the eyebrow/H1/sub relationship is legible; on mobile every section header looks the same weight, so nothing is THE headline.
- No above-the-fold number or proof point — the GM thumb scrolls past the hero before any credibility lands.
- "Six AI agents" section is the wrong lead for mobile — GMs distrust "AI" without an outcome attached. On a 5-second mobile glance it reads like a buzzword, not a benefit.
- CTA copy is generic ("Book a Demo") — no micro-commit language like "See your club's brief" that would lower the ask.

## Exact Fix
File: `src/landing/components/HeroSection.jsx`

On mobile breakpoint, tighten hero to a single screen:
- H1: "One 6 AM brief. Every system. Every member."
- Sub: "Swoop reads Jonas, Lightspeed, and ForeTees overnight and tells you the three things to fix before the board calls."
- CTA label: "See a sample brief" (primary) + "Book 30-min demo" (secondary).
- Collapse `AgentsSection.jsx` into a single "How it works" accordion below the fold on mobile — stop making "six agents" the second headline.
- Delete duplicate CTA blocks in `DemoCtaSection.jsx` between repeated sections; one mid-page CTA is enough.
