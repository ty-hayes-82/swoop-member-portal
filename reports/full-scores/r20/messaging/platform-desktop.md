# Platform Desktop — Messaging Score

**Grade: B**

## What's Working
- "Every signal. One operating view." is a crisper value-prop frame than the home page — it commits to a category (operating view) rather than hedging.
- "Six jobs Swoop does before your GM finishes coffee" is excellent headline writing: specific number, recognizable GM daily ritual, outcome-framed, and differentiates from "features" pages competitors ship.
- "The daily brief, written overnight" repeats the home-page hook and reinforces category naming — good consistency.
- "One page replaces four logins" comparison table speaks directly to login-fatigue pain, which is a top-5 GM complaint.
- "Your tools manage operations. Swoop connects them." positions Swoop as a LAYER, not a replacement — smart defensive messaging against rip-and-replace objections.

## What's Broken
- The six "jobs" cards all read like features once you get into them — no outcome metric on each card (e.g., "recovers $X," "flags Y members/week"). GMs skim card headers; without a number each card, differentiation evaporates.
- "The 90-minute fix / Before the operator pours coffee" section is cute but the copy doesn't commit to what a GM GETS in 90 minutes — onboarding? ROI? First brief? Ambiguous.
- "Take a side-by-side to forward to finance" is buried — that's actually a killer CTA for board-reporting GMs but it's styled as body copy, not a button.
- No named competitor comparison. A platform page is THE place to say "unlike Jonas dashboards or ClubEssential reports, Swoop..." — missing.
- "Your tools manage operations. Swoop connects them." is followed by a circular diagram with no labels visible at scroll speed; the visual doesn't reinforce the claim.

## Exact Fix
File: `src/landing/pages/PlatformPage.jsx` (and `CoreCapabilitiesSection.jsx` if that's where the six cards live)

- Add an outcome metric to each of the six job cards. Example: "Dues drift detector → flags members 14 days before lapse, average $2,400 recovered per flag."
- Replace "The 90-minute fix" header with: "In 90 minutes we import your CSV and send your first brief. You see the at-risk list before lunch."
- Promote "Take a side-by-side to forward to finance" into an orange button styled like the primary CTA, labeled: "Download the Swoop vs. Jonas one-pager."
- Add a named-competitor row above the "One page replaces four logins" table: columns for Swoop / Jonas / ClubEssential / Lightspeed / Northstar with checkmarks on "Daily GM brief," "Board report in one click," "At-risk member scoring," "Cross-system joins."
