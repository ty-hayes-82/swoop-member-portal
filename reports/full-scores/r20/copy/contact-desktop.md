# Contact Desktop — Copy Score

**Grade: A-**

## What's Working
- "See what your club misses today and can recover tomorrow." — time contrast (today/tomorrow) earns its length; specific promise (miss → recover) beats "Get in touch."
- "In 30 minutes, we load your tee-sheet data into Swoop and show you exactly where revenue is leaking and which members are quietly disengaging." — concrete duration, concrete verbs (load / show), names the two specific outputs.
- "You leave with a prioritized action list — not a pitch deck." — defines the deliverable AND the anti-deliverable in one sentence. Rare and good.
- "A ranked list of your top 5 revenue and retention gaps / Benchmarks against comparable clubs / A draft 90-day action plan — yours to keep, no strings attached" — parallel, numeric, scoped.
- "No credit card. 30 minutes. Your club's own data. We'll confirm your slot in 1 business day." — four-fragment reassurance bar is concise and scannable.
- Form labels are single nouns (NAME, CLUB, EMAIL, PHONE (OPTIONAL)) — clean and parallel.

## What's Broken
- Primary CTA button "Book Your Demo" — weakest line on the page. Every other line on this page describes an outcome; this one reverts to category-default language.
- "Limited founding-partner slots available — early clubs get hands-on onboarding and direct input on the roadmap." — "hands-on onboarding" and "direct input on the roadmap" are both vendor cliches; the rest of the page earns better.
- "BOOK A DEMO" eyebrow is redundant with the form and button.

## Exact Fix
`src/landing/pages/ContactPage.jsx`
- Before: "Book Your Demo"
- After: "Show me my club's leaks"

`src/landing/pages/ContactPage.jsx`
- Before: "Limited founding-partner slots available — early clubs get hands-on onboarding and direct input on the roadmap."
- After: "6 founding-club slots. You get a named engineer for 90 days and a vote on next quarter's build list."

`src/landing/pages/ContactPage.jsx`
- Before: eyebrow "BOOK A DEMO"
- After: delete — the H1 "See what your club misses today…" does the work.
