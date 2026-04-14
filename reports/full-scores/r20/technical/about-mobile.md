# About Mobile — Technical Score

**Grade: C**

## What's Working
- Page actually renders on mobile (unlike the desktop version), with a clear eyebrow, headline, and explanatory subhead.
- Hero copy explicitly names "tee sheet, POS, member CRM, and scheduling" — the strongest integration-category statement on the site.
- "Swoop is in closed pilot with founding-partner clubs... we're in your systems, on your calls, and in your board deck" is a differentiated honesty signal that technical buyers respect.
- "Built for the people who run private clubs" scopes the product precisely, which helps an evaluator rule it in or out fast.

## What's Broken
- Still no named vendors (Jonas, Club Essential, Northstar, etc.) despite naming the integration categories.
- No infrastructure disclosure — where does the data live? Which cloud? Which region?
- No security section at all. About pages are the natural home for SOC 2, pen-test, and DPA language and this one has none.
- No AI philosophy statement — given how AI-forward the brand is, the absence of "we don't train on your data" is conspicuous.
- No founder bios or engineering-team credibility beyond a generic "humans in your clubhouse" line.
- Desktop version of this same page is broken/blank — reliability signal in the wrong direction.

## Exact Fix
Edit `src/landing/pages/AboutPage.jsx` to add a mobile-visible "How we're built" stack directly under the "Who you'll work with" section. Four compact cards:

Card 1 - "Where your data lives": "US-based Postgres on Supabase. Daily encrypted backups, 30-day point-in-time recovery. Your member data never leaves the US."
Card 2 - "How we use AI": "Anthropic Claude API under a zero-retention enterprise agreement. Your members' PII never trains any model. Every action is logged and reversible."
Card 3 - "Security": "AES-256 at rest. TLS 1.3. SSO (Google/Microsoft). Role-based access. 90-day audit log. SOC 2 Type II audit in progress — report Q3 2026."
Card 4 - "Your data, your rules": "Full CSV export on demand and on cancellation. DPAs signed on request. You own every row."

Also fix the desktop render bug in the same file so the About page is not blank at >=768px.
