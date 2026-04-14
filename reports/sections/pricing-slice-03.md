# Pricing Slice-03 — Plans Section (Bottom Half: Feature Lists + CTAs + FAQ Header)

**Overall Grade: C+**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | C+ | Feature bullets are functional but written as capabilities, not outcomes |
| Design/Visual | C+ | Checkmark list design is clean but all three columns look identical — no visual differentiation by tier |
| CRO/Conversion | C | Two different CTA labels across tiers ("Start on Signals (free)" vs "Book the 30-minute walkthrough") create inconsistency |
| Trust/Credibility | D+ | No social proof, no testimonials, no logos visible anywhere near CTAs |
| Mobile UX | C- | Three-column feature list layout is unreadable at phone widths |
| Navigation/UX | B- | Logical flow into FAQ; CTAs at bottom of cards are correct placement |
| B2B Buyer Journey | C | Feature bullets don't map to buyer pain points; "Swoop drafts the callback + comp + shift" is the strongest line but buried |
| Copy/Voice | C+ | Most bullets are feature-first; "your team acts instead of sorting spreadsheets" is the lone outcome-oriented line |
| Technical Credibility | C | Feature list is longer for paid tiers but "AI agent-driven actions" is undefined and vague |

## Messaging/Positioning
**Grade: C+**
- What's working: The tiered feature differentiation is logical — each higher tier adds meaningful capabilities rather than arbitrary quantity increases. "Dedicated success manager" on the top tier is a meaningful differentiator for clubs that need hand-holding.
- What's broken: Every feature bullet is written as a system capability rather than a member outcome. "Retention-prioritised waitlist routing" means nothing to a GM who has never heard that term. "Save-attribution tracking" is jargon.
- Fix: Rewrite the three most opaque bullets: "Retention-prioritised waitlist routing" → **"Fills waitlist spots with members most at risk of churning first"**. "Save-attribution tracking" → **"Know exactly which Swoop action stopped a member from leaving"**. "GPS + on-property member behavior" → **"See which members showed up but didn't engage — before they resign"**.

## Design/Visual
**Grade: C+**
- What's working: Green checkmarks on white background are standard pricing table UX that buyers recognise. The orange CTA button on the middle card stands out correctly.
- What's broken: All three feature columns use identical typography, spacing, and checkmark styling. There is no visual encoding of tier value — a premium $1,499 card should feel premium. The left-column CTA ("Start on Signals (free)") is an outlined/ghost button while the middle card uses a filled orange button — but the right card ($1,499) also uses an outline button, making the most expensive tier look less prominent than the "MOST POPULAR" tier.
- Fix: Apply `background: #0a0a0a; color: #ffffff;` to the $1,499 card to visually elevate it as the enterprise/premium option. Change its CTA to a filled dark button with orange text: `background: #1a1a1a; color: #F97316; border: 1px solid #F97316`. This creates a three-tier visual progression: outline → orange filled → dark filled.

## CRO/Conversion
**Grade: C**
- What's working: Each card has a CTA. The middle card CTA ("Book the 30-minute walkthrough") is action-specific and time-bound — this is best practice.
- What's broken: The $0 card CTA "Start on Signals (free)" is weak — it names the product, not the action. The $1,499 card CTA "Book the 30-minute walkthrough" is identical wording to the $499 CTA, which makes both cards feel like they lead to the same thing. No urgency, no scarcity signal, no time-limited offer near any CTA.
- Fix: Differentiate CTAs by tier: $0 — **"Get my free member signals →"**. $499 — **"Book a 30-min walkthrough →"**. $1,499 — **"Talk to a club specialist →"**. Each CTA maps to a different buyer intent (try → evaluate → commit). Also add a one-line urgency note beneath paid CTAs: `"Founding-partner pricing ends when we hit 50 clubs."` (if true).

## Trust/Credibility
**Grade: D+**
- What's working: Feature specificity ("28 in library", "AI agent recommendations") implies depth of product.
- What's broken: No club logos, no testimonials, no named references anywhere near the CTAs. This is the moment of highest buying intent on the page — the section where a GM decides which plan to pick — and there is zero social proof. A single sentence like "Club at Country X switched from Jonas-only to Signals + Actions — 12 members retained in month one" would dramatically increase conversions.
- Fix: Add one testimonial pull-quote per paid tier, directly beneath the feature list and above the CTA: For $499 — **"'We would have lost 8 members in Q1. Swoop flagged all 8 and we kept 7.' — GM, Member-owned club, Midwest"**. For $1,499 — **"'The member app alone justified the upgrade. Members book tee times 40% more when they see their own engagement score.' — GM, Private club, Southeast"**.

## Mobile UX
**Grade: C-**
- What's working: The feature bullet structure is inherently mobile-friendly as a concept.
- What's broken: Three columns of feature bullets side-by-side on mobile is unworkable. At 375px, each column would be ~115px wide — the checkmark alone takes 20px, leaving ~95px for text. "Retention-prioritised waitlist routing" at 95px width wraps across 4+ lines per bullet.
- Fix: On mobile, collapse to a tabbed single-column view. Active tab = highlighted plan. Add a horizontal scrollable card strip at the top with plan names and prices, tap to expand full feature list below. Alternatively use an accordion: `[Signals ▼] [Signals + Actions ▼] [Full Platform ▼]` each expanding to full feature list + CTA.

## Navigation/UX
**Grade: B-**
- What's working: The FAQ section header ("Common questions") appearing below the plan cards is correct placement — it anticipates and answers objections right after the offer.
- What's broken: There is no "Compare all features" link or expandable detail view. The feature bullets visible in the cards are short summaries — a thorough buyer will want a full feature matrix. There is no link to one.
- Fix: Add a text link below the three cards: **"Compare all features in detail →"** linking to an expanded feature comparison table or a `/pricing/compare` page. Also add a "What's included in each plan?" anchor in the FAQ section.

## B2B Buyer Journey
**Grade: C**
- What's working: The sequential feature structure (each tier adding to the previous) makes it easy for a GM to understand the upgrade path.
- What's broken: The feature bullets don't map to the three stages of the GM's job: (1) identify at-risk members, (2) act on signals, (3) prove ROI to the board. A buyer in stage 1 needs to see which plan gets them to stage 2. Currently, the tiers map to product features, not to the GM's workflow progression.
- Fix: Add a one-line "Perfect for clubs that..." description beneath each plan name: Signals — **"...want visibility before committing to action."** Signals + Actions — **"...are ready to stop churn, not just watch it."** Full Platform — **"...want the complete member retention stack."**

## Copy/Voice
**Grade: C+**
- What's working: "Swoop drafts the callback + comp + shift" and "your team acts instead of sorting spreadsheets" are the two strongest lines on the pricing page. Direct, outcome-specific, memorable.
- What's broken: The majority of bullets are system descriptions. "AI agent recommendations", "Automated playbooks + agent-driven actions", "Push notification channel" — these are feature specs, not copy. They belong in a product docs page, not a conversion-stage pricing card.
- Fix: Audit every feature bullet and apply this test: "Can a GM picture this saving a specific member?" If not, rewrite or remove. Replace "Automated playbooks + agent-driven actions" with **"Swoop automatically runs the right play — callback, comp, or pause notice — based on what each member needs."** Replace "Push notification channel" with **"Reach members on their phone the moment they're on property."**

## Technical Credibility
**Grade: C**
- What's working: "Up to 10 active integrations (28 in library)" for the $499 tier is a specific, verifiable claim. "Dedicated success manager" for $1,499 implies real human support.
- What's broken: "AI agent-driven actions" is undefined — what does the AI actually do? "Agent-driven" is marketing language that means nothing without specifics. "Save-attribution tracking" is undefined jargon.
- Fix: Replace "AI agent-driven actions" with: **"AI reviews each signal and drafts the response — callback script, comp offer, or service note — for your team to approve and send."** This defines what the agent does in one sentence and makes it credible without being scary.

## Top 3 Priority Fixes for This Section
1. Add one testimonial pull-quote per paid plan directly above the CTA button — this is the highest-intent moment on the page and it has zero social proof. Even one attributed quote would materially increase conversion.
2. Differentiate the three CTA button labels by buyer intent: "Get my free signals" / "Book a walkthrough" / "Talk to a specialist" — identical CTAs on different-tier cards signal identical outcomes and undermine the tier hierarchy.
3. Rewrite the three most jargon-heavy feature bullets ("AI agent-driven actions", "Save-attribution tracking", "Retention-prioritised waitlist routing") into plain-English outcome statements. A GM should be able to read every bullet and immediately picture a specific member situation.
