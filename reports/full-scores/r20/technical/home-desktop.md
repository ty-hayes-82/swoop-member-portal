# Home Desktop — Technical Score

**Grade: C**

## What's Working
- Hero line explicitly names integration categories ("tee sheet, POS, CRM") signaling this is middleware, not yet another silo.
- "Six AI agents working your club — live" copy hints at multi-agent architecture rather than a single vague "AI."
- Dark agent/terminal visual implies structured briefings, not a chat black box.
- Footer and trust strip reference data from real pilot clubs, reinforcing that numbers come from live systems.

## What's Broken
- No named POS/tee-sheet/CRM vendors anywhere on the home page (Jonas, Club Essential, Northstar, Lightspeed, foreUP, Club Prophet, ClubReady, etc.).
- Zero security/compliance badges — no SOC 2, no GDPR, no encryption-at-rest language, no data-ownership clause visible above the fold or in footer.
- AI explainability is marketing-grade ("briefing", "decisions") with no mention of models, audit trail, human-in-the-loop, or why a recommendation was made.
- No onboarding/time-to-value number ("live in X days"), no uptime/SLA claim, no API or export mention.
- "Six AI agents" is not enumerated on home — a skeptical CTO can't tell what each agent reads, writes, or triggers.

## Exact Fix
Edit `src/landing/components/TrustStrip.jsx` to render a 4-row technical credibility strip directly under the hero:

Row 1 — Integrations: "Connects to Jonas Club Software, Club Essential, Northstar, ClubReady, Lightspeed Golf, foreUP, and Club Prophet via read/write API + nightly SFTP."
Row 2 — Security: "SOC 2 Type II in progress - Q3 2026. AES-256 at rest, TLS 1.3 in transit. Your club owns its data; full CSV export on demand."
Row 3 — AI transparency: "Six named agents (Retention, F&B, Tee Sheet, Revenue, Service, Board). Every recommendation shows source rows, confidence, and GM approval gate before any member-facing action."
Row 4 — Time to value: "30-minute data load. First board-ready briefing in under 24 hours. 99.9% uptime target, status page at status.swoopgolf.com."
