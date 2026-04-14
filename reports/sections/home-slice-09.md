# Pricing Section — Top (Headline + Three Tiers) — Section Score

**Overall Grade: B-**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | B | "Simple pricing. No long-term contracts." directly addresses B2B purchase anxiety |
| Design/Visual | B | Three-tier card layout is clean; "MOST POPULAR" badge on middle tier is correct CRO practice |
| CRO/Conversion | C+ | Free tier creates low-friction entry but CTA asymmetry between tiers is a problem |
| Trust/Credibility | C | Price points shown with no ROI anchor — $1,499/mo feels expensive without context |
| Mobile UX | C | Three-column pricing cards will stack on mobile but value differentiation will be lost |
| Navigation/UX | B- | "PRICING" eyebrow label and clean tier names make section scannable |
| B2B Buyer Journey | B- | Free tier is smart for GMs who need internal buy-in; middle tier CTA is correctly prominent |
| Copy/Voice | B | "Start free with your existing systems. Upgrade when you see the value." is confident and direct |
| Technical Credibility | C+ | Tier descriptions reference actual product capabilities but lack specificity on limits |

---

## Messaging/Positioning
**Grade: B**
- What's working: "Simple pricing. No long-term contracts." is the right headline for a GM audience that has been burned by long SaaS contracts (Clubessential, Jonas, etc.). The free tier ("Signals — $0/mo") is a genuine differentiator — few B2B retention platforms offer a real free tier. Tier naming (Signals, Signals + Actions, Signals + Actions + Member App) is additive and logical, showing clear upgrade value.
- What's broken: The pricing headline doesn't connect to value — it promises simplicity but doesn't anchor the price to outcomes. A GM seeing "$499/mo" with no ROI context will instinctively feel resistance. The free tier name "Signals" is vague for a GM who doesn't yet understand what a "signal" is in Swoop's terminology.
- Fix: Change "Simple pricing. No long-term contracts." to "Start free. Upgrade when your first at-risk member is retained." Then add a subhead: "The average club on Swoop retains 3–4 members per month that would have otherwise resigned. At $5,000–$8,000 per membership, Swoop pays for itself in the first week." This anchors price to ROI before the buyer even sees the numbers.

---

## Design/Visual
**Grade: B**
- What's working: Three-column layout with "MOST POPULAR" badge on the center tier is standard and correct CRO practice. The visual hierarchy is clear — free tier left, premium middle, enterprise right. The orange CTA button on the middle tier ("Book the 30-minute walkthrough") creates strong visual contrast and draws the eye.
- What's broken: All three tier cards appear to be the same height and visual weight except for the badge and border treatment on the middle card. The $1,499/mo tier card has the same visual treatment as the $0 and $499 cards — there's no premium visual signal for the top tier. The "Start on Signals (free)" CTA on the left tier appears to be a ghost/outline button which is visually much weaker than the orange CTA on the middle tier.
- Fix: Add a subtle dark background or elevated shadow to the $1,499 tier to signal "enterprise/premium" — e.g., `background: #0F0F0F; border: 1px solid rgba(255,165,0,0.3)`. Keep the orange button for the middle tier but also add a distinct "Book the 30-minute walkthrough" orange CTA (not ghost) to the top tier — enterprise buyers still need a conversion path.

---

## CRO/Conversion
**Grade: C+**
- What's working: Free tier reduces purchase friction — a GM who can "Start on Signals (free)" can get organizational buy-in without a budget request. "Book the 30-minute walkthrough" on the middle tier is specific and low-commitment.
- What's broken: CTA asymmetry is a conversion problem: the free tier has a ghost button ("Start on Signals (free)"), the middle tier has a strong orange CTA, and the top tier appears to have a ghost "Book the 30-minute walkthrough" button with no visual differentiation from the free tier's CTA. This trains the eye to treat $0 and $1,499 tiers as equally "passive" choices and focuses all visual weight on $499.
- Fix: Use a clear three-button hierarchy: Free tier → light gray ghost button "Start free — no credit card"; Middle tier → full orange button "Book the 30-minute walkthrough"; Top tier → dark button with orange border "Talk to sales about the Member App." Never use the same visual button treatment for $0 and $1,499 tiers. Add a "Most popular for clubs over 400 members" note beneath the $499 tier label.

---

## Trust/Credibility
**Grade: C**
- What's working: "No long-term contracts" is a trust signal — it removes a key risk in the purchase decision. The free tier signals confidence: "we're willing to let you try it at no cost."
- What's broken: $499/mo and $1,499/mo appear in isolation with no ROI anchor. The subhead "Start free with your existing systems. Upgrade when you see the value" implies the value is self-evident, but for a GM who hasn't tried the product, there's no evidence of what "the value" actually is. No customer names, no outcome data, no logos anchor these prices.
- Fix: Add a single ROI callout above the pricing cards in a light amber banner: "Clubs on Signals + Actions retain an average of 3.2 at-risk members per month. At $5,000/membership, that's $16,000/month recovered. Swoop costs $499." Then add a customer logo strip below the tier cards: "Trusted by [Club Name 1] · [Club Name 2] · [Club Name 3]" in 12px light gray.

---

## Mobile UX
**Grade: C**
- What's working: Three-column pricing cards will naturally stack to single-column on mobile, which is the correct behavior.
- What's broken: When stacked vertically on mobile, a GM must scroll past the entire free tier card before reaching the "MOST POPULAR" middle tier — the premium option is visually buried. The checkmark feature lists within each card will become long vertical scrolls, making tier comparison very difficult. The $1,499 tier will be the last thing a mobile user reaches.
- Fix: On mobile, reorder the cards: Most Popular (middle, $499) first, then Enterprise ($1,499), then Free last. Add a sticky comparison toggle at the top of the section on mobile: "Compare plans" that opens a feature comparison table overlay. Ensure each card's feature list is collapsible ("Show all features ▼") to prevent excessive vertical scroll.

---

## Navigation/UX
**Grade: B-**
- What's working: "PRICING" eyebrow label and "Simple pricing. No long-term contracts." headline make this section instantly recognizable as the pricing section. Three columns with clear tier names allow rapid left-to-right scanning.
- What's broken: There's no "Compare features" link or table for GMs who want to understand the exact differences between tiers beyond what's visible in the card feature lists. The feature lists visible in the screenshot (the $499 tier shows 5+ checkmark items, the $1,499 shows 5+ items) will require scrolling within cards or the cards will be very tall.
- Fix: Add a "Full feature comparison table →" link below the tier cards that expands or links to a detailed comparison table. Add `id="pricing"` to this section so direct links work. Add a FAQ below the pricing cards: "Is there a setup fee?", "Can I switch tiers?", "What happens if I cancel?" — these are the first three questions a GM will have after seeing the prices.

---

## B2B Buyer Journey
**Grade: B-**
- What's working: The free tier is strategically smart for B2B — it allows a GM to run Swoop on their existing data, see real signals, and build internal ROI evidence before requesting budget. This is the correct BOFU strategy for a product where the value takes 2–4 weeks to become visible.
- What's broken: The buyer who has made it this far on the page (seen the product demo, seen the integrations, now at pricing) is at the decision stage — they need social proof right before they see prices, not after. There are no customer names or outcomes on this pricing section. Also, the copy "Upgrade when you see the value" puts the burden of proof back on the buyer rather than providing evidence upfront.
- Fix: Add a customer proof element directly above the pricing cards (not just below the CTA buttons): a single pull-quote in a styled blockquote: "'We started on the free tier on a Monday. By Thursday we had identified two members at risk. We upgraded to Actions the same week.' — GM, 380-member private club." This pre-empts pricing resistance with social evidence at the moment of decision.

---

## Copy/Voice
**Grade: B**
- What's working: "Start free with your existing systems. Upgrade when you see the value." is confident without being pushy — it trusts the product. Tier descriptions visible in the screenshot use concrete, functional language: "Swoop drafts the callback script, the comp offer, and the staffing shift in plain English — so your team acts instead of sorting spreadsheets" is excellent.
- What's broken: The $0 tier description calls it "Read-only alerts" — this undersells the free tier and makes it sound like a passive notification tool rather than an intelligence system. GMs attracted by free will not upgrade if the free tier doesn't deliver immediate, visible value. "Email support" as the only support tier for free users is also a deterrent for club operators who may need onboarding help.
- Fix: Replace "Read-only alerts. Swoop reads your systems and surfaces member-risk, complaint, and demand signals daily." with: "Swoop reads your existing systems and tells you which members are showing early signs of disengagement — every day, automatically. No setup beyond connecting your tee sheet." Remove "Read-only" framing entirely. Replace "Email support" with "Email + knowledge base support."

---

## Technical Credibility
**Grade: C+**
- What's working: "Up to 3 active integrations (28 in library)" on the free tier and "Up to 10 active integrations (28 in library)" on the middle tier provide specific, quantifiable limits that help GMs understand exactly what they're getting.
- What's broken: The $1,499 tier description mentions "GPS + on-property member behavior" and "Save-attribution tracking" — these are technically specific features but they're described in product-manager language, not in terms of what they mean for a GM. "Automated playbooks + agent-driven actions" is similarly abstract.
- Fix: Rewrite the top tier description: "The Swoop member app gives your members a mobile check-in, dining preferences, and event booking — while giving you GPS movement data, satisfaction pulse, and real-time behavioral signals your POS can't capture. Attribution tracking shows you exactly which interventions saved which memberships." Translate every technical feature claim to a GM-language outcome.

---

## Top 3 Priority Fixes for This Section
1. Add ROI anchor before the price cards — "$499/mo" means nothing to a GM without context; add "Clubs retain an average of 3.2 at-risk members per month on Swoop. At $5,000/membership, that's $16,000/month recovered." above the tier grid.
2. Fix CTA asymmetry — the $0 tier and $1,499 tier currently have similar ghost button treatments, inadvertently de-emphasizing the enterprise tier; use a distinct dark/orange-bordered button for the top tier.
3. Add a customer proof quote immediately above the pricing cards — at the point of price evaluation, social evidence is the most powerful conversion lever and this section has none.
