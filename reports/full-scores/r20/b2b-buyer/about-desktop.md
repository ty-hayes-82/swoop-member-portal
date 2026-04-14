# About Desktop — B2B Buyer Score

**Grade: D**

## What's Working
- The About page exists at all and is linked from nav — gives the GM a place to vet the humans behind the software, which is table-stakes for private-club buyers who buy from people, not brands
- Framing "Built for the people who run private clubs" signals category focus, which matters to GMs sick of generic hospitality-tech pitches

## What's Broken
- The desktop render is essentially blank in the captured screenshot — either a build/SSR bug or the page has almost no content above the fold. Either way, a GM who clicks About and sees an empty page assumes the company isn't real and closes the tab. This is a deal-killer for B2B where About-page vetting is mandatory before a demo
- No founder bio, no headshots, no LinkedIn links, no golf-industry credentials visible — GMs need to see "these people actually ran private clubs / worked at Jonas / came from Troon" before they'll forward to a board
- No investors, advisors, or advisory-board names — a private-club board will ask "who's backing this" and there's nothing
- No customer logos or pilot-club names on the About page — this is where peer proof belongs for GM buyers
- No "why we built this" founder story that gives a champion something to repeat in their own words to the board

## Exact Fix
File: `src/landing/pages/AboutPage.jsx` — first, fix the desktop render bug so content actually displays. Then, add a founder/team block with this exact copy pattern:

```
"Swoop was built by [Founder Name], former [GM at X Country Club / Ops lead at Troon / PM at Jonas], after watching private clubs lose $80K+/year to avoidable member churn that no existing tool flagged. Our advisors include [GM of Y Club, former CEO of Z]. We're backed by [investor]. In closed pilot with founding-partner clubs since [date]."
```

Then in the same file, add a "Who we work with" subsection listing pilot-club count, regions, and (with permission) one named reference club a prospect can call. The About page is where champion enablement lives — a GM cannot defend a vendor with no visible team to a board.