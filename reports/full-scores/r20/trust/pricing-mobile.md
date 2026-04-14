# Pricing Mobile — Trust Score

**Grade: B-**

## What's Working
- The sourced stats row (3,000+ / $2.1B / 67% with NGCOA and Club Benchmarking citations) survives the mobile reflow with sources still legible.
- Pricing cards remain legible and the month-to-month/no-credit-card language stays prominent.
- FAQ accordion is present at a viewport where buyers actually use it.

## What's Broken
- The "Most Popular" badge on $499/mo is even more prominent on mobile because the featured card is the visual anchor of the scroll. Unsubstantiated at this pilot stage.
- "What is member turnover costing your club?" ROI panel shows a big $128,000 number with no visible method footnote at this zoom — looks like a marketing assertion rather than a user-controlled calc.
- Source citations for the stats row are styled at 11px italic `rgba(255,255,255,0.35)` — illegible on most phones. The one thing the site does right on trust becomes invisible where it matters most.
- Same "Nine Seats Left" vs "3 of 10" contradiction.
- The FAQ question "Is my members' data secure?" is collapsed by default on mobile — the trust answer is hidden behind a tap.

## Exact Fix
File: `src/landing/pages/PricingPage.jsx` line 46-48. Raise source citation legibility:
```
<p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
  Source: {s.source}
</p>
```
(Dropping italic, raising opacity from 0.35 to 0.55, and labeling as "Source:" rather than bare parentheses.)

File: `src/landing/components/RoiCalculatorSection.jsx`. Add a persistent footnote directly under the dollar output: `Calculated from your inputs using avg dues × churned members × 12. Not a projection — math you can verify.` This reframes the big number as a calculator, not a claim.

File: `src/landing/pages/PricingPage.jsx` line 85. Set the security FAQ (`Is my members' data secure?`) as `defaultOpen={true}` on the pricing page so the trust answer is visible on first paint, not buried.
