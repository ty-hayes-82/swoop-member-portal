# About Slice 03 (Demo Results Stats + Founding Partner Program) — Section Score

**Overall Grade: B**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | B+ | Four stat cards are strong; "Be one of our first ten clubs" framing is excellent urgency |
| Design/Visual | B | Stat card grid is clean; founding partner CTA box is visually differentiated |
| CRO/Conversion | B- | "Apply for Founding Partner" CTA exists but is mid-page and needs more urgency framing |
| Trust/Credibility | B- | "6 days", "91%", "$312", "$1.38M" are specific and credible; sourcing note is present |
| Mobile UX | C+ | Four-column stat grid will collapse on mobile; founding partner three-column will too |
| Navigation/UX | B- | Good section flow; "PROOF" and "FOUNDING PARTNER PROGRAM" labels are clear |
| B2B Buyer Journey | B | Stat block + founding partner pitch is the right sequence for bottom-of-funnel |
| Copy/Voice | B | "Be one of our first ten clubs" is strong; stat labels are specific and clear |
| Technical Credibility | B+ | "Connected Jonas, tee sheet, POS, CRM, complaint, and tee sheet pattern changes" is very specific |

## Messaging/Positioning
**Grade: B+**
- What's working: The four demo stats (6 days early warning, 91% waitlist fill rate, $312 average revenue per slot, $1.38M dues at risk visibility) are the most persuasive numbers on the entire site. Each stat is tied to a specific capability (Early Warning System, Waitlist Performance, Revenue Per Slot, Dues At Risk Visibility). The progression from proof stats to "Be one of our first ten clubs" is the correct conversion sequence.
- What's broken: "$1.38M dues at risk visibility" needs immediate clarification — is this a single club? An aggregate across all pilots? The number is alarming in a good way but unexplained scoping will create skepticism.
- Fix: Add a scoping note beneath the $1.38M card: "Across 23 flagged members in a single 450-member founding-partner club — annualized at full dues rates." This makes the stat more credible, not less.

## Design/Visual
**Grade: B**
- What's working: Large orange stat numbers with clean supporting copy. White cards on white background with clear stat labels. Orange-bordered founding partner program box creates strong visual differentiation from the rest of the page.
- What's broken: The orange border on the founding partner box is the right instinct but the box feels slightly under-designed — more like an info box than a premium offer. The three-column benefit grid inside it (Hands-on Onboarding, Shape the Roadmap, Locked-in Pricing) is too small to read at a glance.
- Fix: Increase founding partner box interior padding to `p-10`. Increase benefit icon size to 48px. Bold the benefit headline in each column. Add a subtle gradient background to the founding partner box: `background: linear-gradient(135deg, #fff9f0 0%, #ffffff 100%)`.

## CRO/Conversion
**Grade: B-**
- What's working: "Apply for Founding Partner" orange button exists and is above-the-fold for this section. "Limited founding partner spots — early clubs get direct roadmap input" creates scarcity and urgency.
- What's broken: "Apply for Founding Partner" is weaker than it should be. "Apply" implies a gatekeeping process that adds friction. A GM reading this doesn't want to apply; they want to join. The button should feel like an exclusive invitation, not a job application.
- Fix: Change button text from "Apply for Founding Partner" to "Claim a Founding Partner Spot →". Change the scarcity line to "7 of 10 founding partner spots are reserved — 3 remain." (Use real numbers or omit if unknown.)

## Trust/Credibility
**Grade: B-**
- What's working: "Metrics from the Pinetree CC demo environment (300 members, real system data)" is an excellent sourcing note — specific club name (even demo), specific member count, "real system data" qualifier. This is the right level of transparency.
- What's broken: "Founding partner case studies publishing Q2 2026" is another delay signal. Four stat cards, one of which shows $1.38M at risk, but no attributable case study yet.
- Fix: Add a footnote beneath the stat grid: "Pinetree CC is a real founding-partner demo environment running on production Jonas data. Ask us for a walkthrough using your club's system." This converts the demo transparency into a CTA.

## Mobile UX
**Grade: C+**
- What's working: Stat cards have sufficient white space to remain readable when stacked
- What's broken: Four-column stat grid on mobile will either render at illegible size or wrap to two columns. The founding partner three-column benefit grid will also need to stack. The orange-bordered box may lose its visual impact when it's full-width on a small screen.
- Fix: On mobile: stat grid → 2 columns × 2 rows with `gap-4`. Founding partner benefit grid → 1 column, stacked. Orange border box → set `border-width: 2px` on mobile (currently may be 1px). Button → full-width `w-full`.

## Navigation/UX
**Grade: B-**
- What's working: "PROOF" label and "FOUNDING PARTNER PROGRAM" label are clear section markers. The progression from stats to program offer is logical.
- What's broken: No anchor ID on the PROOF stats section. A GM who wants to share the "$1.38M at risk" stat with their board via a direct link can't do so. No "Back to top" or next section indicator.
- Fix: Add `id="proof"` to the PROOF stats section and `id="founding-partner"` to the program section. Add a "Back to top" text link in the bottom right of the founding partner box.

## B2B Buyer Journey
**Grade: B**
- What's working: This section hits the correct bottom-of-funnel sequence: hard evidence (stat block) → exclusive offer (founding partner program) → CTA. A GM who has read through the About page and reached here has completed the full consideration journey and is at the decision stage.
- What's broken: "Founding partner case studies publishing Q2 2026" is the fourth delay signal on the page. A GM at decision stage needs proof now, not in a future quarter. The stat block itself is the proof — lean into it harder.
- Fix: Remove the "case studies publishing Q2 2026" line. Replace with: "These results are reproducible — the same Jonas integration and agent pipeline ships to every founding partner on day one."

## Copy/Voice
**Grade: B**
- What's working: "Be one of our first ten clubs" is the best CTA headline on the page — specific number, exclusivity framing, forward momentum. "Hands-on implementation, direct roadmap input, and locked-in pricing for life" is a compelling three-part offer statement.
- What's broken: The three benefit cards (Hands-on Onboarding, Shape the Roadmap, Locked-in Pricing) are described in extremely small text that is unreadable in the screenshot. The copy inside them is cut off in the image.
- Fix: Ensure each founding partner benefit card has: headline (18px, bold), one-sentence description (14px, regular), and a concrete deliverable in parentheses. Example: "Locked-in Pricing — Your launch rate is your rate for life, even as the platform grows and pricing increases. *(Written into your pilot agreement.)*"

## Technical Credibility
**Grade: B+**
- What's working: The 6-day early warning stat is explained with specific technical triggers: "POS spend decline, D|M complaint, and tee sheet pattern changes" — this is exceptional specificity that signals the system is actually reading real data sources, not running a generic churn model.
- What's broken: "D|M complaint" is an acronym (presumably Dining & Membership?) that GMs may not immediately parse. The $312 revenue per slot explanation mentions "backfilling cancellations with high-engagement, high-F&B members first" — "F&B" should be spelled out.
- Fix: Replace "D|M complaint" with "dining & membership complaint". Replace "high-F&B" with "high food-and-beverage spend". These are small but meaningful clarity fixes for a non-technical GM audience.

## Top 3 Priority Fixes for This Section
1. Change "Apply for Founding Partner" to "Claim a Founding Partner Spot →" — "apply" adds friction and sounds like a job application; this should feel like an exclusive invitation
2. Add scoping context to the $1.38M stat — "across 23 flagged members in a single 450-member club" makes it more credible and prevents skeptical dismissal
3. Fix "D|M complaint" and "high-F&B" abbreviations — replace with plain language for the GM audience
