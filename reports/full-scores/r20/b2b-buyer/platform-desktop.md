# Platform Desktop — B2B Buyer Score

**Grade: B-**

## What's Working
- "Six jobs Swoop does before your GM finishes coffee" reframes the tool as an FTE replacement — directly handles the "we can't afford another system" objection by implying labor offset
- "One page replaces four logins" comparison table is exactly the artifact a GM forwards to a board: shows switching-cost math in one image
- "Your tools manage operations. Swoop connects them." handles the "we already have Jonas/ClubEssential" objection gracefully (integration, not replacement)
- Dark agent-work block acts as proof-of-function — rare in category

## What's Broken
- Zero named integrations with logos — GMs want to see "Yes, works with Jonas, Clubessential, Northstar, Lightspeed, Square" before they'll even book a demo
- No implementation complexity disclosure anywhere: nothing about IT lift, who does the import, how long, what breaks
- No customer outcome per job ("saves 4 hrs/week", "recovers $X in tee-time leakage") — all capability, no ROI
- No pilot/trial risk reversal on this page; buyer has to go to pricing to find any risk language
- Comparison table doesn't name the competitors it's replacing — GMs read "four logins" and mentally insert their actual stack, which is fine, but naming the top 3 by brand creates instant resonance

## Exact Fix
File: `src/landing/components/IntegrationsSection.jsx` — add a logo wall with exact copy: `"Works with your existing stack: Jonas Club Software, Clubessential, Northstar, Lightspeed Golf, Square, Toast, Mailchimp. We connect, we don't replace — your data stays in your systems of record."`

Then in `src/landing/components/CoreCapabilitiesSection.jsx`, append per-job ROI micro-stats like `"Tee-sheet reconciliation → saves ~6 hrs/week of assistant GM time"` and `"At-risk member flagging → $82K recovered in founding-pilot clubs (avg)"`. This converts each capability from a feature into a defensible board-line-item.