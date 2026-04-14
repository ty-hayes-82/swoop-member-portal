# Platform Desktop — Technical Score

**Grade: B-**

## What's Working
- "Six jobs Swoop does before your GM finishes coffee" enumerates agent responsibilities — closest thing to explainability on the site.
- Dark terminal-style "daily brief, written overnight" screenshot suggests structured output rather than chat hallucinations.
- "Six AI agents working your club - live" with what looks like tool-call/log chrome hints at auditability.
- "One page replaces four logins" comparison table is a concrete integration claim that IT buyers understand.
- "Your tools manage operations. Swoop connects them." frames this as an orchestration layer, not a rip-and-replace — a key technical positioning.

## What's Broken
- The four logins being replaced are never named. A platform page MUST show vendor logos (Jonas / Club Essential / Northstar / ClubReady / foreUP).
- No data-flow diagram: what does Swoop read vs write? Which systems are source-of-truth? No mention of webhook vs polling vs SFTP.
- No mention of AI model(s), whether member data is used for training (it shouldn't be — say so), or where inference runs.
- No security section on the platform page — SOC 2, pen-test cadence, encryption, SSO/SAML, role-based access, audit log retention.
- No API docs link, no Zapier/Make, no webhook out, no CSV/Parquet export path called out.
- No staging/sandbox mention for IT evaluation.

## Exact Fix
Edit `src/landing/components/IntegrationsSection.jsx` to render a real "How Swoop connects" panel with three columns:

Column 1 - Sources we read: "Jonas Club Software (REST + nightly SFTP), Club Essential (API), Northstar (API), ClubReady (API), Lightspeed Golf (API), foreUP (API), Club Prophet (SFTP), Stripe, Toast, Square."
Column 2 - What we write back: "Tee sheet notes, member tags, CRM tasks, email/SMS via your existing sender domain. Nothing member-facing fires without GM approval."
Column 3 - Security and data handling: "SOC 2 Type II (in progress, Q3 2026). AES-256 at rest, TLS 1.3 in transit. SSO via Google/Microsoft. Role-based access. 90-day audit log. Member PII never used to train models - Anthropic Claude API with zero-retention enterprise agreement. Full CSV export on demand; club owns all data."

Also add a line to `src/landing/components/AgentsSection.jsx`: "Every agent action is logged with source rows, model version, confidence score, and the GM who approved it. Reversible in one click."
