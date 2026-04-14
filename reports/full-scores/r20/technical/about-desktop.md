# About Desktop — Technical Score

**Grade: F**

## What's Working
- Nothing renders. The screenshot is a blank near-white canvas with no content, navigation, or footer visible — there is no technical content to evaluate.

## What's Broken
- Page appears to have failed to render or is an empty shell. A skeptical CTO landing here would immediately question platform reliability.
- No company info, no team, no security posture, no integration list, no AI philosophy, no data handling principles — none of the trust-building material a technical buyer looks for on an About page.
- Blank page on a production marketing site is itself a reliability signal: if the About page can't render, why would I trust your data pipeline?
- No evidence of SOC 2 status, no mention of where the team is based (data-residency implication), no infrastructure provider (AWS/GCP/Azure) disclosed.

## Exact Fix
First, fix the render bug in `src/landing/pages/AboutPage.jsx` — the desktop view is blank while the mobile version of the same route has content, implying a responsive layout bug or a missing import guard. Check for `window`-gated logic or a media-query that hides all sections at >=768px.

Then add a new "How Swoop is built" section to `src/landing/pages/AboutPage.jsx` with four short paragraphs:

"Infrastructure: Swoop runs on Vercel and Supabase (Postgres) in us-east. Member data never leaves the United States. Daily encrypted backups with 30-day point-in-time recovery."
"AI: We use Anthropic's Claude API under a zero-retention enterprise agreement. Your members' PII is never used to train models. Every AI recommendation is logged with source rows, model version, and confidence score."
"Security: AES-256 at rest, TLS 1.3 in transit. SSO via Google and Microsoft. Role-based access with 90-day audit logs. SOC 2 Type II audit in progress, report expected Q3 2026. Annual third-party pen test."
"Data ownership: Your club owns every row. Full CSV export is available on demand and on cancellation, no questions asked. We sign DPAs on request."
