# Contact Mobile — Technical Score

**Grade: B-**

## What's Working
- The "30 minutes, load your tee-sheet data, leave with a prioritized action list" pitch is preserved on mobile and still concrete.
- "Your club's own data" line survives, carrying the data-ownership signal into the small screen.
- Form is short enough to complete on mobile without pain — good conversion hygiene, also a subtle reliability signal.
- "No credit card" and "1 business day confirmation" read as a soft SLA, which is uncommon on mobile landing forms.

## What's Broken
- Same gap as desktop: no HOW for the data load. Mobile readers still can't tell if this is a CSV upload, an API key, or an SFTP drop.
- No tee-sheet vendors named anywhere on the mobile contact flow.
- No security microcopy under the form fields. A single line would materially increase trust at 375px width.
- No alternative channel for IT/security — only the main demo form, which forces technical buyers through a sales funnel.
- No link to a status page, privacy page, or DPA request from this page.

## Exact Fix
Edit `src/landing/pages/ContactPage.jsx` to add, on mobile only, a collapsed `<details>` block immediately below the "Book Your Demo" button labeled "How the 30-minute demo works, technically":

"Read-only access via API (Jonas, Club Essential, Northstar, ClubReady, Lightspeed, foreUP, Club Prophet) or one-time SFTP / CSV upload."
"Data loads into an isolated Postgres schema (US region). AES-256 at rest, TLS 1.3 in transit."
"You leave with a PDF + CSV action plan. If you pass, we delete your data within 7 days and email you confirmation."
"Security review? security@swoopgolf.com — SOC 2 Type II (in progress, Q3 2026), sample DPA, and questionnaire responses available."

Also add a single always-visible line directly under the form on mobile: "Your data stays in the US, encrypted at rest. Deleted within 7 days if you don't move forward." One sentence, four facts, fits on one mobile line.
