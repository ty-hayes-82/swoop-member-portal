# Platform Mobile — Trust Score

**Grade: C-**

## What's Working
- On mobile the feature grid collapses cleanly so the comparison section's concrete claims stay readable.
- "Book the 30-minute walkthrough" CTA stays consistent through the scroll — consistency itself is a trust signal.

## What's Broken
- The platform hero on mobile is pure claim with zero sourcing: "Every signal. One operating view." — no named clubs, no source footnotes, no logos. Mobile visitors never see a single citation before the fold.
- Integrations section on mobile shows a circular logo arrangement with no partner names visible at mobile resolution — it communicates "logo wall" without the credibility payoff of actually reading any logo.
- Agents/workflow cards on mobile strip out the surrounding context and read as bare feature bullets — no GM quote, no pilot-club label, no "used by X clubs" next to any capability.
- The same "Typical club live in 2 weeks" weasel claim as desktop, with no denominator.
- No visible SOC 2 / data-handling reassurance on a page literally titled "Platform."

## Exact Fix
File: `src/landing/components/IntegrationsSection.jsx`. On mobile (below a breakpoint) replace the circular logo ring with a 2-column list of text names grouped by type: `Tee sheet: Jonas, ClubEssentials, Northstar`, `POS: Lightspeed, Square, Clover`, `CRM: HubSpot, Salesforce`. Add a footer line: `Preferred integration partner: Jonas Club Software (Feb 2026).` Readable text logos beat unreadable icon rings.

File: `src/landing/pages/PlatformPage.jsx` line 19-22. Add a sourced subtitle line:
```
subtitle="One dashboard shows which members are drifting, why, and what to do next — assembled from your existing systems overnight. Live at 7 founding-partner clubs since Jan 2026."
```
And add a small trust row under the subtitle: `SOC 2 Type I in progress (Q3 2026) · Data stays in your region · Founding GM reference calls available`.
