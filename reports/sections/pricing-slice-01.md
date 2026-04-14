# Pricing Slice-01 — ROI Calculator Section

**Overall Grade: B-**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | B | Strong concept; "what is turnover costing your club?" is exactly right for this buyer |
| Design/Visual | B+ | Clean two-panel layout; orange line chart on light panel is effective |
| CRO/Conversion | C+ | Calculator outputs a number but has no CTA connected to that number |
| Trust/Credibility | C | "85% early-intervention retention rate" appears with no source |
| Mobile UX | C | Two-column layout will stack awkwardly; slider interaction is poor on touch |
| Navigation/UX | B- | Works as a section but no anchor ID visible; hard to deep-link |
| B2B Buyer Journey | B+ | Right section at the right moment — personalises the cost of inaction |
| Copy/Voice | B | "ROI CALCULATOR" label and headline are clear; subhead is weak |
| Technical Credibility | C+ | "85% early-intervention retention rate" needs a source and definition |

## Messaging/Positioning
**Grade: B**
- What's working: The question format ("What is member turnover costing your club?") is prospect-centric and immediately relevant to the GM's P&L responsibility. The dual-panel design (exposure vs. with Swoop) creates a clear before/after.
- What's broken: The positioning assumes the GM trusts the 85% retention rate input. If they don't trust that number, the entire calculator output is suspect. Also, "DUES PROTECTED" on the chart Y-axis is unlabelled — the scale is invisible.
- Fix: Add a sub-label beneath the chart title: **"DUES PROTECTED (cumulative, over 12 months)"** and show dollar amounts on the Y-axis at two tick points.

## Design/Visual
**Grade: B+**
- What's working: Light left panel / dark right panel split creates strong visual contrast. The orange gradient line chart is the best visual element on the pricing page. Orange "$80,000" on dark background is punchy and readable.
- What's broken: The chart Y-axis has no scale labels — the curve looks impressive but means nothing without numbers. The "DUES PROTECTED" label is small and low-contrast. The slider handles are standard browser defaults — no custom styling that matches the brand.
- Fix: Add Y-axis labels at 25%, 50%, 75% of max value. Style slider thumbs: `accent-color: #F97316; height: 4px;`. Increase "DUES PROTECTED" to `font-size: 0.75rem; font-weight: 600; color: #1a1a1a; text-transform: uppercase; letter-spacing: 0.08em`.

## CRO/Conversion
**Grade: C+**
- What's working: A live calculator that outputs a personalised dollar figure is a strong conversion device — the GM now has a specific number.
- What's broken: After the calculator shows $80,000 recovered, there is no CTA. The visitor's logical next question is "how do I get this?" but there is no button, no prompt, no offer. The conversion moment is built and then abandoned.
- Fix: Add a CTA directly beneath the dark results panel: **"Swoop Pro costs $5,988/year. You just calculated $80,000 recovered. [Book a 30-min walkthrough →]"** Use orange button. This should be dynamic, updating as the user moves sliders.

## Trust/Credibility
**Grade: C**
- What's working: Showing the Swoop Pro annual cost ($5,988) in the calculation is honest and direct — it doesn't hide the price.
- What's broken: "85% early-intervention retention rate" is the engine of the entire calculation. It appears without definition, source, or confidence interval. Is this from Swoop's pilot clubs? Is it industry data? A GM who pushes back on this number invalidates the whole calculator.
- Fix: Add a footnote beneath the dark panel: **"* 85% early-intervention retention rate based on Swoop founding-partner pilots, Q3–Q4 2024. Industry baseline: 72% (Club Benchmarking 2023)."** Also add an info icon next to the stat with a tooltip explaining the methodology.

## Mobile UX
**Grade: C**
- What's working: The section is conceptually valuable on any device.
- What's broken: Two-panel horizontal layout will collapse on mobile. Sliders are notoriously difficult to use on touch screens — the hit target of a standard `<input type="range">` thumb is ~16px, well below the 44px minimum touch target recommended by Apple and Google. No evidence of touch-optimised slider styling.
- Fix: On mobile, stack panels vertically (inputs on top, results below). Apply `min-height: 44px; touch-action: none;` to slider thumbs. Add `+` and `-` stepper buttons beside each slider value as an alternative input method for mobile users.

## Navigation/UX
**Grade: B-**
- What's working: The section flows logically after the hero — market context → personal cost calculation → plans → FAQ.
- What's broken: No visible anchor ID. Users who want to share "check out the ROI calculator" have no `#roi-calculator` hash to link to. The section label "ROI CALCULATOR" in orange is visually correct but not linked.
- Fix: Add `id="roi-calculator"` to the section wrapper. Add to the sticky sub-nav (when implemented): `<a href="#roi-calculator">ROI Calculator</a>`.

## B2B Buyer Journey
**Grade: B+**
- What's working: This is exactly the right content for a GM in evaluation/decision stage. It personalises the cost of inaction, demonstrates Swoop's model, and produces a concrete ROI number. This is the strongest section on the pricing page.
- What's broken: The calculator is orphaned — great input, no output action. The journey from "I calculated $80K recovered" to "I'm booking a demo" has a gap.
- Fix: Connect the calculator output directly to a CTA as described in CRO section. Optionally add: **"Want us to run this calculation on your actual member data? [Send me a custom report →]"** — email capture as a conversion path.

## Copy/Voice
**Grade: B**
- What's working: "What is member turnover costing your club?" is direct, GM-centric, and immediately motivating. "Adjust the sliders to see your club's exposure — and what Swoop recovers" is clear instruction.
- What's broken: "EXPOSURE" as a label on the dark panel is vague — exposure to what? "WITH SWOOP" label is fine but the section title could be stronger. "Revenue recovered (10 members saved)" is a good label but the parenthetical is too small to read.
- Fix: Change "EXPOSURE" label to **"YOUR RISK"**. Change "Revenue recovered (10 members saved)" to **"Revenue recovered — 10 members retained"** at full legibility. Change "WITH SWOOP" to **"WHAT SWOOP RECOVERS"**.

## Technical Credibility
**Grade: C+**
- What's working: Showing Swoop Pro annual cost inline ($5,988) is unusually honest for a SaaS marketing page — it builds trust.
- What's broken: The 85% retention rate is technical credibility's biggest weakness. There is also no explanation of how Swoop identifies at-risk members — what signals, what data sources, what lead time.
- Fix: Add a one-line explainer beneath the results: **"Swoop identifies at-risk members 45–90 days before typical resignation by combining tee-sheet frequency, POS spend decline, and complaint pattern data from your existing systems."**

## Top 3 Priority Fixes for This Section
1. Add a dynamic CTA beneath the calculator output that references the computed ROI number: "You calculated $80,000 recovered. Swoop Pro costs $5,988. [Book a Walkthrough →]" — this turns the calculator's best moment into a conversion event.
2. Cite the 85% retention rate with specific attribution (founding-partner pilots, date range, sample size). Without it, every calculation output is untrustworthy.
3. Add Y-axis labels and a dollar scale to the "DUES PROTECTED" chart — a curve with no numbers is decorative, not analytical. A GM presenting this to their board needs real figures.
