# Platform Mobile — Messaging Score

**Grade: C**

## What's Working
- "Six jobs Swoop does before your GM finishes coffee" still lands on mobile — it's the best headline on the whole property and it survives a narrow column.
- Orange CTA bar repeats with enough frequency that a mobile scroller has a tap target every 2–3 screens.
- Daily-brief screenshot mockup gives visual relief from the text walls.

## What's Broken
- The six "jobs" cards stack into an endless vertical conveyor on mobile — by card 4 the GM has lost the thread of what page they're on. No anchor nav, no progress indicator.
- Each job-card body copy is too long for mobile; on a phone the header reads but the outcome description is three lines of unscanned text.
- "One page replaces four logins" table is unreadable on mobile — tables are the wrong format. Needs to flip to stacked rows.
- No TL;DR block at top of page for mobile users who won't scroll six cards.
- Repeated CTA copy "Book a Demo" — mobile GMs need micro-yes language like "See a sample brief" or "Get my club's ROI."
- The connect-your-tools diagram is visual noise on mobile — adds scroll length with zero messaging value.

## Exact Fix
File: `src/landing/pages/PlatformPage.jsx`

- Add a mobile-only TL;DR card at top: "Swoop reads your 4 club systems overnight and sends one GM brief at 6 AM. Six jobs. One page. Replaces four logins. See a sample →"
- In `CoreCapabilitiesSection.jsx`, truncate each job-card body to 12 words on mobile with a "See how" expand, and lead with the outcome number: "$2,400/flag · Dues drift detector · Catches lapses 14 days early."
- Convert `ComparisonSection.jsx` table to stacked mobile cards (one per competitor) with a single "what Swoop does differently" bullet each.
- Hide the connect-your-tools circular diagram on `sm:` breakpoints; it's not earning its scroll space.
