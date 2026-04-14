# Pricing Desktop — B2B Buyer Score

**Grade: B+**

## What's Working
- "The platform that pays for itself" headline is pure B2B positioning — reframes cost as investment before the buyer can object
- Three hero stats (3,000+ / $2.1B / 67%) are exactly the kind of numbers a GM can lift into a board slide
- "What is member turnover costing your club?" ROI calculator with $128K / $89K / $82K range is category-leading — this alone justifies a demo for a CFO-adjacent GM
- Free $0/mo diagnostic tier is a textbook risk-reversal pilot offer
- "Things GMs ask us" FAQ block handles objections explicitly — this is the buyer-stage section most vendors skip
- Three-tier structure ($0 / $499 / $1,499) maps cleanly to the decision-stage buyer who needs a clear next step

## What's Broken
- None of the three hero stats carry a source attribution visible inline — a board member will ask "where's that $2.1B number from" and the GM will have nothing
- The $128K "loss" number needs a "based on your inputs / based on industry avg for 300-member club" qualifier, or skeptics dismiss it as marketing fiction
- No payback-period sentence ("$499/mo pays back in 6 weeks at 1 saved member") — the most persuasive B2B ROI framing is missing
- "Things GMs ask us" answers are collapsed; a buyer scanning for "how long does onboarding take" or "what if we cancel" can't see the answers
- No money-back guarantee or opt-out clause visible on the paid tiers — raises switching-cost fear

## Exact Fix
File: `src/landing/components/PricingSection.jsx` — directly under the $499/mo tier card, add:

```
"Payback in 6 weeks. One retained member ($8,200 avg annual dues) covers 16 months of Swoop. Cancel any time in the first 90 days, full refund, you keep your action list."
```

Then in `src/landing/components/RoiCalculatorSection.jsx`, add a visible footnote under the $128K figure: `"Based on NGF 2024 private-club turnover data (18.6% annual) and your inputs. Swap in your actual member count and dues rate above."` — this converts a contested marketing number into a defensible board-slide citation.