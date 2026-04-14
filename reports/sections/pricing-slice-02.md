# Pricing Slice-02 — Plans Section (Top Half: Headers + $0/$499/$1,499 Cards)

**Overall Grade: B-**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | B | Three-tier model is clear; "MOST POPULAR" badge does useful work |
| Design/Visual | B | Middle card highlight is effective; plan names are weak and undifferentiated |
| CRO/Conversion | C+ | $0 tier risks cannibalising conversions; no urgency or social proof near CTAs |
| Trust/Credibility | C | No logos, no testimonials, no "X clubs on this plan" near any tier |
| Mobile UX | C | Three-column card layout will fail below 768px |
| Navigation/UX | B- | Section exists but still no sticky sub-nav anchor to reach it |
| B2B Buyer Journey | B- | Price anchoring is correct but the $0 plan needs a stronger upgrade narrative |
| Copy/Voice | C+ | Plan names ("Signals", "Signals + Actions") are descriptive but cold; no aspiration |
| Technical Credibility | C | Taglines are cut off; "the comp" truncation on Signals + Actions card is a content bug |

## Messaging/Positioning
**Grade: B**
- What's working: "Simple pricing. No long-term contracts." is a strong header for a B2B SaaS pricing section — it directly addresses two common objections. "Start free with your existing systems. Upgrade when you see the value." is honest and builds trust.
- What's broken: The three plan names ("Signals", "Signals + Actions", "Signals + Actions + Member App") are purely feature-descriptive, not outcome-oriented. They describe what you get, not what you achieve. The naming does not create desire or aspiration.
- Fix: Rename plans to outcome-oriented names while keeping the feature descriptor as a sub-label: **"Watchlist"** (was: Signals), **"Response"** (was: Signals + Actions), **"Full Circle"** (was: Signals + Actions + Member App). Sub-label each: "Signals only", "Signals + AI Actions", "Complete platform".

## Design/Visual
**Grade: B**
- What's working: The centre card (Signals + Actions) has an orange "MOST POPULAR" badge and a slightly elevated visual treatment — this is the right design pattern for guiding buyers toward the recommended tier.
- What's broken: All three cards are nearly identical in size, border radius, and padding. The differentiation between $0 and $1,499 is not visually apparent at a glance. The right-hand card ($1,499) appears to have no highlight or special treatment despite being the premium tier.
- Fix: Apply a subtle gradient top border to the premium card: `border-top: 3px solid linear-gradient(90deg, #F97316, #FCD34D)`. Increase the middle card shadow: `box-shadow: 0 8px 32px rgba(249,115,22,0.15)`. Give the $0 card a muted/greyed border to visually de-emphasise it relative to paid tiers.

## CRO/Conversion
**Grade: C+**
- What's working: Three tiers with a free entry point is a proven SaaS freemium motion. "MOST POPULAR" badge anchors attention to the $499 tier.
- What's broken: The free $0 tier might bleed conversions — a GM who starts free may never upgrade unless the upgrade path is clearly telegraphed at this decision point. No urgency signal near any plan. No social proof (e.g., "47 clubs on this plan"). The free plan CTA label is not visible yet (cut off) but likely lacks urgency.
- Fix: Add beneath the $0 card: **"Free forever for the first integration. Upgrade when you're ready to act on the signals."** Add to $499 card: a small social proof pill: `● 34 clubs active on this plan`. Add to $1,499 card: `● Includes your dedicated success manager`.

## Trust/Credibility
**Grade: C**
- What's working: Showing prices directly ($0, $499, $1,499) rather than "contact sales" is itself a trust signal — it says Swoop is confident in its pricing.
- What's broken: No logos, no testimonial snippets, no club counts near any plan. A GM choosing between three plans wants to know what "clubs like mine" chose. There is no social proof anchoring any tier.
- Fix: Add a three-word club-type descriptor beneath each plan price: beneath $0 — `Best for: Clubs just getting started`. Beneath $499 — `Best for: Clubs actively managing retention`. Beneath $1,499 — `Best for: Clubs running a full member experience program`. Also add a single testimonial pull-quote above the plan cards from a GM on the recommended tier.

## Mobile UX
**Grade: C**
- What's working: The cards are well-structured for a responsive collapse.
- What's broken: Three pricing cards side-by-side will compress to approximately 100–110px each on a 375px phone screen. Plan names, prices, and descriptions will be illegible. No evidence of a responsive single-column or tabbed mobile layout.
- Fix: At `max-width: 768px`, display cards in a single column, stacked vertically, full-width. Add a toggle pill at the top: `[Signals] [Signals + Actions ★] [Full Platform]` to let mobile users tab between plans without scrolling through three tall cards.

## Navigation/UX
**Grade: B-**
- What's working: The section heading "PRICING" in orange and the "Simple pricing." headline create clear wayfinding.
- What's broken: No `id="plans"` anchor. Users navigating from the sticky sub-nav (when added) or from a "See Plans" CTA elsewhere on the page cannot deep-link to this section. Plan comparison across tiers requires scrolling since all three cards are visible simultaneously — no sticky comparison bar for long feature lists.
- Fix: Add `id="plans"` to the section wrapper. When the feature list is long (as it will be after the full card is visible in slice-03), add a sticky comparison header row that shows plan names and prices as users scroll the feature list.

## B2B Buyer Journey
**Grade: B-**
- What's working: The freemium entry point ($0) lowers the barrier to trial significantly — a GM can start without a procurement process. The "No long-term contracts" headline removes a major objection.
- What's broken: Without a clear upgrade narrative at this decision point, the $0 tier is a conversion dead-end. A GM choosing free needs to understand exactly what happens when they see their first signal but can't act on it — that friction should be made explicit and used as the upgrade trigger.
- Fix: Add an upgrade nudge to the $0 card: **"When you see a member at risk and want Swoop to draft the callback — that's when you upgrade. Most clubs do it within 2 weeks."** This creates an experiential upgrade story rather than a feature comparison.

## Copy/Voice
**Grade: C+**
- What's working: "Simple pricing. No long-term contracts." is clear and objection-busting.
- What's broken: The plan taglines are truncated ("the comp" on the $499 card is a visible content bug). "Signals + Actions + Member App" is a mouth-full for a plan name. The pricing section header subhead ("Start free with your existing systems. Upgrade when you see the value.") is good but generic.
- Fix: Fix the truncated tagline bug immediately — the $499 plan description is cut off mid-word ("the comp"). Full replacement: **"Everything in Signals, plus Swoop drafts the callback, comp offer, and staffing shift in plain English — so your team acts instead of sorting spreadsheets."** Shorten plan names as described in Positioning fix above.

## Technical Credibility
**Grade: C**
- What's working: Feature bullets visible on free tier include "Daily member health scores" and "Up to 3 active integrations (28 in library)" — the integration count (28) is a specific, credible number.
- What's broken: "28 in library" is mentioned for the $0 tier but no integration logos are shown. "Active integrations" needs clarification — does each integration require setup time? Is the 28-count accurate? No mention of data security, data residency, or privacy in the pricing context.
- Fix: Add a small integration logo strip (Jonas, ClubEssential, Lightspeed, Northstar, Foretees icons) beneath the plan cards: **"Connects with your existing systems —"** then 5 logos. This is a high-credibility, low-cost addition.

## Top 3 Priority Fixes for This Section
1. Fix the content truncation bug on the $499 card immediately — "the comp" mid-word is a visible production defect that damages credibility. Rewrite the full tagline.
2. Add "X clubs on this plan" social proof beneath each plan's price point — even low numbers (e.g., "8 clubs") signal real adoption and help buyers self-select to the right tier.
3. Add mobile responsive stacking — three pricing cards on a phone screen is unusable. Implement a single-column stacked layout with a tier-switcher tab row at `max-width: 768px`.
