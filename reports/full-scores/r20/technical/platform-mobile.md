# Platform Mobile — Technical Score

**Grade: C+**

## What's Working
- Enumerated agent list carries over to mobile, so the "six jobs" structure is preserved.
- "One page replaces four logins" framing survives as a short stack, which is the most IT-friendly line on the site.
- Terminal/briefing screenshot conveys structured output even at small size.

## What's Broken
- Integration names still missing — on mobile there's no logo wall to scan, so the "connects to your stack" claim has zero proof.
- No security facts visible in the mobile scroll at all.
- Agent descriptions read as marketing verbs, not capabilities. A mobile reader can't tell what each agent ingests or emits.
- No expandable "technical details" disclosure — perfect pattern for mobile where space is scarce.
- Comparison table likely collapses awkwardly; no mobile-optimized "what you keep vs what Swoop adds" card.

## Exact Fix
Edit `src/landing/components/IntegrationsSection.jsx` to add a mobile-only accordion `<details>` block labeled "For IT and Ops teams" containing four short sections:

"Systems we connect to" — comma list: Jonas, Club Essential, Northstar, ClubReady, Lightspeed, foreUP, Club Prophet, Stripe, Toast, Square.
"How data moves" — "Read via API or nightly SFTP. Write-back only for tee-sheet notes, CRM tasks, and GM-approved member messages."
"Security" — "SOC 2 Type II in progress. AES-256 at rest. TLS 1.3. SSO (Google/Microsoft). Role-based access. 90-day audit log."
"AI transparency" — "Claude API, zero-retention. Member PII never trains models. Every action logged and reversible."

Render each section header at 14px with a chevron; collapsed by default so marketing flow isn't broken, but a technical buyer can expand and get every answer in one tap.
