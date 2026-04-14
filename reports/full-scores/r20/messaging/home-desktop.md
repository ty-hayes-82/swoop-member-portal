# Home Desktop — Messaging Score

**Grade: B-**

## What's Working
- Hero headline "Your club runs on four systems. Swoop collects them every morning." anchors a concrete operational pain — four-system fragmentation — instead of a vague "all-in-one" claim. That's outcome-over-feature language GMs feel.
- "The daily brief, written overnight" is a specific, repeatable deliverable — not a feature ("AI dashboard") but a recognizable artifact a GM can picture landing in their inbox.
- "One page replaces four logins" puts the switching-cost pain in plain numbers and directly attacks the status quo.
- Sub-sections signal the See It / Fix It / Prove It pillars in plain language ("Your tools manage operations. Swoop connects them.") which differentiates from Jonas/ClubEssential feature lists.

## What's Broken
- The hero promise and the mid-page "Six AI agents working your club — live" are fighting for the same visual real estate; the value prop gets diluted because neither claim owns the fold. A GM scanning for 3 seconds can't tell if Swoop is a briefing tool, an agent platform, or a BI layer.
- Zero differentiation vs. Jonas, Northstar, ClubEssential, Lightspeed by name anywhere visible. "Connects your systems" is table-stakes language competitors also use.
- Claims lack specificity: no dollar amount, no retention %, no hours-saved number in the hero. The 3,000+/$2.1B/67% stat strip is buried below the fold and uncaptioned by outcome.
- "Every signal. One operating view." subhead is abstract marketing-speak — "signal" is undefined and "operating view" doesn't describe what the GM DOES with it.
- No mention of GM pain vocabulary: "board report," "F&B cover variance," "dues collection," "at-risk members" — the exact terms a GM searches for.

## Exact Fix
File: `src/landing/components/HeroSection.jsx`

Replace hero headline/subhead with:
- H1: "Your club runs on Jonas, Lightspeed, ForeTees, and a spreadsheet. Swoop turns them into one 6 AM brief."
- Sub: "See the at-risk members, the F&B cover gap, and the dues collection drift before your team clocks in — with a one-click board report Friday afternoon."
- Replace "Every signal. One operating view." eyebrow in `SeeItFixItProveItSection.jsx` with "See it. Fix it. Prove it — before the board asks."
- Pull one hard number into the hero stat row: "$83,500 average recovered revenue in 90-day pilot" (sourced from pricing page calculator).
