# Pricing Mobile — Technical Score

**Grade: D+**

## What's Working
- Tier prices stack cleanly and remain scannable on mobile.
- ROI calculator block is preserved, showing real-numbers output rather than vague "save money" copy.
- FAQ section is present, giving a container for technical answers.

## What's Broken
- Same missing technical detail as desktop — no seat counts, no refresh cadence, no retention window, no SLA per tier.
- Mobile makes the pricing feel even more marketing-only; there's no sidebar to carry "what's included" checkboxes.
- No DPA, SOC 2, or data-ownership line that a procurement/IT reader can screenshot and forward.
- No onboarding time commitment visible at any scroll position.
- "Book a demo" CTA pushes every technical question into a sales call rather than answering it inline.

## Exact Fix
Edit `src/landing/components/PricingSection.jsx` to render, below each mobile tier card, a `<details>` disclosure labeled "What's included (technical)" with a tight 6-line bullet list:

"Integrations: [scope per tier]"
"Data refresh: [daily / hourly / 15-min]"
"Retention: [30d / 12mo / 36mo]"
"Seats: [1 / 5 / unlimited]"
"Auth: [email / SSO / SSO+SAML]"
"SLA: [best-effort / business-hours / 99.9% with credits]"

Also add one mobile-visible line under the pricing header: "All plans: AES-256 at rest, TLS 1.3, club owns its data, full CSV export on cancellation. SOC 2 Type II in progress." This single line does more for technical trust on mobile than any card redesign.
