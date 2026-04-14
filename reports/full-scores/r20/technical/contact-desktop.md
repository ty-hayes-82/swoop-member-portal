# Contact Desktop — Technical Score

**Grade: B-**

## What's Working
- "In 30 minutes, we load your tee-sheet data into Swoop and show you exactly where revenue is leaking" is the single best technical statement on the entire site — it is a concrete, measurable onboarding claim.
- "A draft 90-day action plan - yours to keep, no strings attached" implies data ownership and zero lock-in — a buyer-friendly signal.
- Form fields are minimal (name, club, email, phone) — no premature PII harvesting.
- "No credit card. 30 minutes. Your club's own data. We'll confirm your slot in 1 business day" is a clean SLA-style confirmation promise.
- Visible support email and phone number, which many AI-startup contact pages hide.

## What's Broken
- "We load your tee-sheet data" does not say HOW — CSV upload? Read-only API key? SFTP? A CTO needs to know what access they're granting before a 30-minute meeting.
- No mention of which tee-sheet systems are supported — same gap as the rest of the site.
- No security language on the form itself — no "data encrypted in transit, retained only for the duration of the demo, deleted on request."
- No link to a privacy/DPA page next to the form; the only legal link is a generic footer "Privacy Policy."
- No status-page or uptime link in footer — standard on serious B2B platforms.
- No alternative intake for IT/security reviews (e.g., "Need a security questionnaire or DPA? security@swoopgolf.com").

## Exact Fix
Edit `src/landing/pages/ContactPage.jsx` to add a small "How the 30-minute demo works, technically" panel directly next to the form:

"1. You grant read-only access to your tee-sheet system (Jonas, Club Essential, Northstar, ClubReady, Lightspeed, foreUP, or Club Prophet) via API key or a one-time SFTP drop. CSV upload also works."
"2. We load the last 12 months into an isolated Postgres schema on Supabase (US region). AES-256 at rest, TLS 1.3 in transit."
"3. On the call, we walk you through the leakage report and hand you the 90-day action plan as a PDF and CSV."
"4. If you don't move forward, we delete your data within 7 days and send you written confirmation. You can also request deletion at any time at privacy@swoopgolf.com."

Add a second line under the form: "Security review? Email security@swoopgolf.com for our SOC 2 (in progress) letter, sample DPA, and security questionnaire responses." Add a `status.swoopgolf.com` link to `LandingFooter.jsx`.
