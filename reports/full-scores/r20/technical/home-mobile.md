# Home Mobile — Technical Score

**Grade: C-**

## What's Working
- Mobile preserves the "tee sheet, POS, CRM" integration phrasing in the hero.
- Vertical stacking keeps the agent reveal section legible, so the multi-agent concept survives on small screens.
- Footer links (Privacy, Terms) remain visible, minimally signaling legal hygiene.

## What's Broken
- All technical credibility gaps from desktop are worse on mobile because there's no sidebar/whitespace to carry logos or badges.
- No integration logo wall renders — on mobile the skeptical IT reader never sees a vendor name.
- "AI" claims remain unqualified; no line about explainability, approval gates, or data retention fits in the mobile scroll.
- No compressed "security facts" row (SOC 2 status, encryption, data ownership) that would survive at 375px.
- No time-to-value or uptime number anywhere in the mobile scroll.

## Exact Fix
Edit `src/landing/components/TrustStrip.jsx` to add a mobile-first stacked block (rendered above the fold on screens <768px) with four short lines a CTO can read in 5 seconds:

"Integrates with Jonas, Club Essential, Northstar, ClubReady, foreUP, Lightspeed, Club Prophet."
"SOC 2 Type II in progress. AES-256 + TLS 1.3. Your data, exportable any time."
"6 named agents. Every action logged, GM-approved, reversible."
"Live in 30 minutes. First briefing in 24 hours. 99.9% uptime."

Use `text-xs leading-snug` with a subtle divider between lines so it renders as a dense facts strip on mobile, not marketing copy.
