# Platform Desktop — Trust Score

**Grade: C-**

## What's Working
- Comparison table ("One page replaces four logins") is the kind of concrete, falsifiable claim trust-oriented buyers reward.
- "Typical club live in 2 weeks" is specific enough to be verifiable.
- Agents/workflow section shows actual tool names (implying product depth rather than vaporware).

## What's Broken
- Page hero ("Every signal. One operating view.") has zero sourcing, zero named clubs, zero proof. For a platform page, that is the section where SOC 2 / data-handling should live.
- "Your tools manage operations. Swoop connects them." is aspirational claim copy with no integration partner logos adjacent — Jonas, Lightspeed, Club Essentials, etc., need to be named by logo, not hidden behind "28 integrations."
- Comparison table rates "Swoop" vs unnamed "Point solutions" — without naming actual competitors (ClubEssentials, Jonas, Northstar) the comparison reads as a straw man a GM cannot verify.
- Save-story section (the "daily brief" tile) has no attribution: whose brief is this? A mock? A real club's?
- Mid-page CTA "Typical club live in 2 weeks" — "typical" is weasel language when n=7 pilot clubs; should be "6 of 7 pilot clubs live within 14 days."

## Exact Fix
File: `src/landing/components/SaveStorySection.jsx`. Add a caption under the daily-brief mock: `Composite brief from 3 founding-partner clubs, Mar 2026. Names redacted at GMs' request — reference calls available.` This converts an ambiguous mock into an acknowledged composite.

File: `src/landing/components/ComparisonSection.jsx`. Replace the "Point solutions" column header with the three most common actual competitors named explicitly (e.g. `Jonas + ClubEssentials + spreadsheets — the typical 2026 stack`) and add a footnote: `Comparison based on published feature matrices as of Apr 2026. See docs/competitor-matrix.md.` Then commit that matrix file so the claim is auditable.

File: `src/landing/pages/PlatformPage.jsx` line 42. Replace `TYPICAL CLUB LIVE IN 2 WEEKS` with `6 OF 7 FOUNDING PILOTS LIVE WITHIN 14 DAYS` and add a source line below: `Founding cohort onboarding log, Jan–Apr 2026.`
