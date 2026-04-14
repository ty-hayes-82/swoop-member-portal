# Pricing Desktop — Messaging Score

**Grade: A-**

## What's Working
- "The platform that pays for itself." is the strongest headline on the entire site — it's a promise, a differentiation, and a GM-pain answer in five words.
- "What is member turnover costing your club?" reframes pricing as a LOSS-AVOIDANCE question, not a cost question. That's sophisticated B2B messaging.
- Concrete dollar numbers ($126,100 / $83,500) tied to a visible calculator make the ROI claim falsifiable and credible — GMs can plug their own member count.
- "Start at zero. Upgrade when the math shows up." is a risk-reversal headline that directly attacks the #1 private-club buyer objection (budget approval).
- $0/mo / $499/mo / $1,499/mo tier naming is honest; no "Contact us for Enterprise" gatekeeping friction.
- "Things GMs ask us" FAQ header is better than "FAQ" — it's written in GM voice.
- Stat strip (3,000+ / $2.1B / 67%) is finally contextualized on this page as buyer-proof, not hero wallpaper.

## What's Broken
- The three stat-strip numbers lack captions — "67%" of WHAT? GMs don't trust a naked percentage. Needs a one-line footnote per stat.
- No anchoring of Swoop's price against Jonas/ClubEssential annual costs — miss. GMs approve by committee, and "cheaper than your current module" is the fastest approval argument.
- The free tier ($0) is under-sold — no copy explaining WHY free exists (land-and-expand, founding-pilot, data-for-product). Buyers are suspicious of free B2B SaaS.
- "Ready to see which of your members are at risk?" CTA is good but isolated — no supporting "no credit card, 30 min, your own club data" reassurance adjacent to the form.
- "Upgrade when the math shows up" is clever but ambiguous — what IS the math threshold? Committing to "upgrade when we recover 5x your monthly fee" would be stronger.

## Exact Fix
File: `src/landing/pages/PricingPage.jsx` (and `PricingSection.jsx`, `RoiCalculatorSection.jsx`)

- Caption each hero stat: "3,000+ members analyzed in pilot · $2.1B member-lifetime-value modeled · 67% of at-risk flags converted to saves."
- Under the $0 tier add: "Free forever for clubs under 300 members. We earn the upgrade when Swoop recovers 5x the monthly fee — not before."
- Under the $499/$1,499 tiers add a one-line anchor: "Roughly the cost of one lapsed junior membership. Jonas charges more for reporting alone."
- Replace "Upgrade when the math shows up" sub with: "You upgrade the month Swoop recovers 5x the fee. Until then, $0 — tracked in your dashboard."
- Under the demo CTA add reassurance line: "No credit card · 30 minutes · Your own club data · We confirm your slot in one business day."
