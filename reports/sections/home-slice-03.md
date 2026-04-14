# Platform Capability Cards Detail Section — Section Score

**Overall Grade: B-**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | B | Good specificity in cards; "223x ROI on alert" metric needs context |
| Design/Visual | B | Cards are well-structured; the layout fragment view suggests scroll awkwardness |
| CRO/Conversion | D | No CTA anywhere in section — worst gap on the page |
| Trust/Credibility | B- | Specific metrics ($251K, 223x, $5.7K) are compelling but unattributed |
| Mobile UX | C | Two-column card grid will compress; metric label readability degrades |
| Navigation/UX | C+ | No section anchor; no next-step prompt |
| B2B Buyer Journey | B- | Strong proof data present; no narrative connecting it to buyer decisions |
| Copy/Voice | B | Data source labels ("CRM + POS + EMAIL") are excellent; body copy uneven |
| Technical Credibility | B+ | Data source attribution on each card is best technical credibility on the page |

## Messaging/Positioning
**Grade: B**
- What's working: This section shows the bottom halves of the five capability cards (continuing from slice-02), each with specific outcome metrics. "$251K ANNUALIZED IMPACT" and "$5.7K MONTHLY F&B UPSIDE" and "223x ROI ON ALERT" are powerful numbers when visible. The "WHY THIS SURFACED" label pattern on the stat strip at the top is good framing.
- What's broken: "223x ROI on alert" — 223 times return on what? On the cost of one alert? On the monthly subscription? On the implementation cost? Without a denominator, this number is uninterpretable and will be ignored or distrusted by an analytical GM. It sounds inflated.
- Fix: Replace "223x ROI ON ALERT" with a clearer metric: "Alert prevented $14K dues lapse — $63/mo per alert cost." Show the math. Or: "One alert. 14 minutes. $14,200 in dues protected." This is more believable and more compelling than "223x."

## Design/Visual
**Grade: B**
- What's working: The capability cards use a consistent structure: capability title (bold) → description paragraph → data source labels → metric result. This hierarchy is clean and scannable.
- What's broken: The view captured in this screenshot shows cards mid-page with the top strip partially rendered — it creates a fragmentary first impression. The two-column layout (Staffing & Labor / Revenue & Pipeline) leaves a visual imbalance if the third column (F&B Operations, top row) doesn't align cleanly. The "$251K ANNUALIZED IMPACT" metric label is very small relative to the card content above it.
- Fix: Increase the metric result display size: `font-size: 1.5rem; font-weight: 700; color: #1a1a1a;` so the dollar figure is the visual anchor of each card. The metric should be the first thing the eye lands on, not the last.

## CRO/Conversion
**Grade: D**
- What's working: Nothing — there is no conversion element in this section.
- What's broken: This section contains the strongest proof metrics on the entire page ($251K impact, $5.7K monthly F&B upside, 6.4-week early warning) and there is no CTA attached to any of them. A GM reading "$251K annualized impact" at the bottom of a capability card is at peak persuasion — and there is nothing to click.
- Fix: Add an inline contextual CTA below the Staffing & Labor and Revenue & Pipeline cards: "These numbers come from real clubs. Want to see what Swoop would find in yours?" with a button: "Get My Club's Estimate →" (links to demo booking with UTM parameter `?src=capability-cards`). This is the most high-value CTA placement on the page.

## Trust/Credibility
**Grade: B-**
- What's working: "$251K ANNUALIZED IMPACT" and "$5.7K MONTHLY F&B UPSIDE" are specific, large, and attached to named data sources (REVENUE + CRM + POS / POS + TEE SHEET + WEATHER). The data source labels ("SCHEDULING + TEE SHEET") are excellent — they show Swoop's cross-system intelligence is real.
- What's broken: All metrics lack source attribution. Are these from one club? An average? The best-case club? "Swoop metric report generated nightly" appears under the $251K figure — this explains data freshness but not the dollar figure origin. A GM presenting this to their board would be asked "where does $251K come from?" and have no answer.
- Fix: Add a single source line below each metric: e.g., "$251K annualized impact — 300-member club, trailing 90 days." Or add a footnote section at the bottom: "* Metrics reflect actual results from Swoop-managed clubs. Individual results vary based on club size and data quality." This is standard SaaS proof copy and adds more credibility than omitting it.

## Mobile UX
**Grade: C**
- What's working: Card structure is modular and will stack on mobile.
- What's broken: The metric labels ("SCHEDULING + TEE SHEET · Coverage model re-calculated hourly") are in all-caps, small, low-contrast text — at mobile width these will be illegible. The "$251K" figure needs to remain prominent on mobile but will likely shrink in a stacked layout. Two-column grid will either go 1-column (long scroll) or stay 2-column (tiny cards).
- Fix: On mobile, go single column. Make metric figures `font-size: 2rem` on mobile so they anchor each card visually. Abbreviate data source labels: "REVENUE + CRM + POS" stays; cut "Swoop metric report generated nightly" to "Updated nightly."

## Navigation/UX
**Grade: C+**
- What's working: The section flows logically from the capability overview above it.
- What's broken: No anchor ID, no eyebrow label to orient the reader, no progress indicator. A reader who jumped directly here from the nav would have no section header to re-orient them. The section blends into the one above without a clear visual break.
- Fix: Add a visual divider or section label between the top capability descriptions and this metric-detail section, or combine them into one unified section with the metrics visible on each card from the start (no separate slice needed).

## B2B Buyer Journey
**Grade: B-**
- What's working: The proof metrics ($251K, $5.7K, 223x, 6.4 weeks) are exactly what a GM needs to justify Swoop to their board. These numbers are in the right part of the funnel — MOFU proof content.
- What's broken: The metrics are presented as isolated data points with no narrative connecting them to the buyer's decision. A GM reading "$251K annualized impact" thinks: "Impact from what? For which club? How long did it take? What did we have to do?" The numbers need a one-sentence story each.
- Fix: Add a short narrative frame before the cards: "Here's what clubs discovered in their first 90 days with Swoop:" This single sentence frames the metrics as outcomes-already-achieved rather than marketing projections, which is the credibility framing a B2B buyer needs.

## Copy/Voice
**Grade: B**
- What's working: "Staff to predicted demand, not static templates" (Staffing & Labor) is tight and accurate. "Coverage gap alerts 48 hours before service windows" is a concrete, testable claim. "Show the board which actions protected revenue" is board-language framing — exactly right for a GM who reports up.
- What's broken: "Pipeline insights tie guest play to future memberships" is vague — what pipeline? Guest play → membership conversion is an interesting feature but "pipeline insights" is jargon that undersells it.
- Fix: Rewrite the Revenue & Pipeline body copy's second bullet: "When a guest plays three rounds, Swoop flags them as a membership prospect and drafts the outreach for your membership team."

## Technical Credibility
**Grade: B+**
- What's working: This is the strongest technical credibility section on the page. Data source labels on each card ("CRM + POS + EMAIL," "TEE SHEET + WEATHER + WAITLIST," "POS + TEE SHEET + WEATHER," "SCHEDULING + TEE SHEET," "REVENUE + CRM + POS") make the cross-system integration concrete and specific. "Coverage model re-calculated hourly" signals real-time data processing.
- What's broken: "Swoop metric report generated nightly" and "updated 1 hour ago" signals are good but inconsistent — some cards say nightly, one says hourly. This inconsistency will make a technical reader question which is accurate.
- Fix: Standardize the freshness labels: use "Updated nightly" for all member/behavioral data and "Updated hourly" for operational data (tee sheet, scheduling). Add a single footnote: "Member health data refreshes nightly. Operational scheduling data refreshes hourly."

## Top 3 Priority Fixes for This Section
1. Add a contextual CTA below the bottom capability cards ("Want to see what Swoop would find in your club?" + "Get My Club's Estimate →") — $251K proof metrics with no CTA is the single most wasteful conversion gap on the page.
2. Replace "223x ROI ON ALERT" with a show-the-math version ("One alert. 14 minutes. $14,200 in dues protected.") — the current ratio is uninterpretable and will be dismissed by analytical GMs.
3. Add attribution to each metric ("300-member club, trailing 90 days") — unattributed large numbers signal marketing inflation and undermine the otherwise strong technical credibility of this section.
