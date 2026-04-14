# Pricing Desktop — Copy Score

**Grade: A-**

## What's Working
- "The platform that pays for itself." — declarative, confident, no adjectives.
- "What is member turnover costing your club?" — question headline that puts the prospect's own number front and center.
- "Start at zero. Upgrade when the math shows up." — parallel, short, concrete; "when the math shows up" is a distinctive phrase that avoids "when you're ready."
- Pricing tiers use real numbers ($0/mo, $499/mo, $1,499/mo) rather than "Contact us."
- "Things GMs ask us." — plain-English FAQ label that beats "Frequently Asked Questions."

## What's Broken
- The stat row "3,000+ | $2.1B | 67%" is undercut because it's unclear what each number measures without reading the small caption — the labels need to lead, the numbers need units.
- "67%" as a turnover stat is likely a cliche industry number — sourcing it inline would make it 2x as credible.
- FAQ questions appear generic ("Do I need a contract?") — miss the chance to preempt the real GM objections (board approval, Jonas contract, data migration).

## Exact Fix
`src/landing/pages/PricingPage.jsx` (stat row)
- Before: "3,000+ / $2.1B / 67%"
- After: "3,000+ private clubs in the US / $2.1B in annual dues leakage / 67% of member churn is preventable (NCA 2024)"

`src/landing/pages/PricingPage.jsx` (FAQ)
- Before: generic FAQ items
- After: "My club is on a 3-year Jonas contract — can I still use Swoop?" / "Does this need board approval?" / "Who owns the data if we leave?"
