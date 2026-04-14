# Contact Mobile — Copy Score

**Grade: B+**

## What's Working
- "See what your club misses today and can recover tomorrow." still wraps cleanly at mobile width and keeps the time contrast intact.
- The three-checkmark deliverables list ("A ranked list… / Benchmarks… / A draft 90-day action plan…") reads well as a vertical mobile stack — each bullet is a complete, scoped promise.
- "No credit card. 30 minutes. Your club's own data." — fragments stack nicely on mobile as reassurance chips.
- Form labels NAME / CLUB / EMAIL / PHONE (OPTIONAL) are single words — appropriate for mobile input focus.

## What's Broken
- On mobile the 30-minute explainer paragraph wraps to 5–6 lines of dense type before the reader reaches the checkmarks — the lead sentence needs to be shorter or hoisted.
- The reassurance line "No credit card. 30 minutes. Your club's own data. We'll confirm your slot in 1 business day." is rendered as one long run-on at mobile width; on a phone it should break to chips.
- "Book Your Demo" button: same generic-button problem as desktop, more painful on mobile because it's the single full-width tap target on the screen.
- "Or email us at demo@swoopgolf.com · (480) 123-9703" — the middot separator reads awkwardly on mobile; the phone number format lacks the parentheses / dash convention GMs expect.

## Exact Fix
`src/landing/pages/ContactPage.jsx` (mobile lede)
- Before: "In 30 minutes, we load your tee-sheet data into Swoop and show you exactly where revenue is leaking and which members are quietly disengaging. You leave with a prioritized action list — not a pitch deck."
- After: "30 minutes. Your tee-sheet data loaded into Swoop. You leave with a ranked leak report — not a pitch deck."

`src/landing/pages/ContactPage.jsx` (CTA)
- Before: "Book Your Demo"
- After: "See my club's leaks (30 min)"

`src/landing/pages/ContactPage.jsx` (contact line)
- Before: "Or email us at demo@swoopgolf.com · (480) 123-9703"
- After: "Email demo@swoopgolf.com — or call (480) 123-9703"
