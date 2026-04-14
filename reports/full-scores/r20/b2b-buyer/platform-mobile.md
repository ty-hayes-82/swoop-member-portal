# Platform Mobile — B2B Buyer Score

**Grade: C+**

## What's Working
- Job-cards stack vertically and each one is a standalone objection handler — a mobile GM can skim 6 capability blocks in 20 seconds
- The "one page replaces four logins" table concept is visible even at mobile width and is the single strongest board-forward asset on the page
- Dark agent block still reads as "real product" on phone

## What's Broken
- Mobile readers see capability after capability without a single dollar figure or hours-saved metric in the first three screens
- Integrations story is text-only on mobile — no recognizable logos means GMs assume "doesn't talk to Jonas" and bounce
- No "implementation in 2 weeks / we do the import" reassurance visible at any scroll depth
- Switching-cost objection is implicit, never stated: mobile GMs need a one-liner like "Keep your current systems. We read from them."
- FAQ / objection block lives far below where a mobile buyer will scroll

## Exact Fix
File: `src/landing/components/CoreCapabilitiesSection.jsx` — above the job-cards grid, insert a mobile-visible single-line summary:

```
"Six operational jobs your club already pays for — automated. Avg 18 hrs/week back to your GM in pilot clubs."
```

Then in `src/landing/components/IntegrationsSection.jsx`, render a horizontally-scrolling integration logo strip with the line: `"We read from Jonas, Clubessential, Northstar, Lightspeed & Square. No rip-and-replace. Your member data never leaves your system of record."` This single sentence kills three objections at once (switching cost, data security, IT lift) for a mobile GM who only reads two screens.