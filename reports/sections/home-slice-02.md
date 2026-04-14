# "Five Core Capabilities" Platform Section — Section Score

**Overall Grade: C+**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | C+ | "Five core capabilities" is feature inventory, not value proposition |
| Design/Visual | B- | Card grid is clean but the top stat strip context is lost |
| CRO/Conversion | D+ | No CTA in this section; capability cards dead-end |
| Trust/Credibility | C | Capabilities described but no proof any of them work |
| Mobile UX | C | Three-column card grid will compress badly at mobile widths |
| Navigation/UX | C+ | "PLATFORM" eyebrow label is weak; no anchor or next-step |
| B2B Buyer Journey | C+ | Feature listing before benefit proof is backwards for B2B |
| Copy/Voice | C+ | Card titles are fine; body copy under each is too generic |
| Technical Credibility | B- | Capability names signal genuine depth; metric labels are good |

## Messaging/Positioning
**Grade: C+**
- What's working: "Five core capabilities. One operating view." is compact and implies integration — the "one view" framing reinforces the fragmentation pain from the hero. The capability names (Member Intelligence, Tee Sheet & Demand, F&B Operations) are specific enough to signal domain expertise.
- What's broken: "Five core capabilities" is feature inventory framing. A GM doesn't want five capabilities — they want one outcome: keep members. The section leads with what Swoop does instead of what the GM gets. "One operating view" is vague — view of what?
- Fix: Rewrite the section headline: "Five blind spots. One place to see all of them." Replace the subhead "Swoop combines member behavior, demand, service, labor, and revenue so your team can act with confidence instead of assumptions." with: "Your tee sheet, CRM, F&B, and staffing systems each see one piece. Swoop reads all of them and shows you what matters today."

## Design/Visual
**Grade: B-**
- What's working: The card grid uses consistent orange icons, bold card titles, and brief descriptors. The layout is well-organized and the visual rhythm is predictable.
- What's broken: The top strip (showing "1-day WARNING MISSED," "$22K ANNUAL DUES AT RISK," "$36K DUES + F&B LEAKAGE") is rendered in very small text with no visible context header — it appears to be the bottom of a previous section bleeding in. The cards visible (Member Intelligence, Tee Sheet & Demand, F&B Operations) are only three of five — the other two are cut off, which makes the "Five core capabilities" claim feel incomplete.
- Fix: Ensure the section header and all five cards are visible in a single scroll band. If five cards don't fit in a 2-row grid, use a 3+2 layout rather than a 3-column row that truncates. Add `scroll-snap` or a carousel for mobile.

## CRO/Conversion
**Grade: D+**
- What's working: The capabilities are detailed enough that a GM reading carefully will understand the product breadth.
- What's broken: There is no CTA anywhere in this section. It's a feature catalogue with no offer attached. A GM who reads all five capabilities and thinks "this sounds right for us" has nowhere to go except scroll further. This is the MOFU section — it should convert more than any section except pricing.
- Fix: Add a CTA after the capability cards: headline "Ready to see how Swoop maps to your club?" with two buttons: primary "Book a 30-minute walkthrough" and secondary text link "Download the capabilities overview (PDF)." The PDF secondary CTA serves GMs who need to share with their board before booking.

## Trust/Credibility
**Grade: C**
- What's working: The capability descriptions are specific enough to imply that someone has actually built the product — "Ranks every member by retention value" and "Tie culinary prep to what golf & weather already know" are operationally grounded.
- What's broken: None of the five capabilities has a proof point. No "Club X used Member Intelligence to catch 12 at-risk members in Q1" story. No metric attached to any capability (except the cryptic stat strip at the top). A GM evaluating software needs to see that each capability actually delivers results.
- Fix: Add one proof metric to each capability card, styled as a "result badge": e.g., under Member Intelligence: `"Avg. 6.4-week early warning before resignation."` Under Tee Sheet & Demand: `"91% fill rate with waitlist routing."` Under F&B Operations: `"$5.7K avg. monthly F&B upside."` These numbers are already elsewhere on the page — pull them into the cards.

## Mobile UX
**Grade: C**
- What's working: Cards are modular and will stack vertically on mobile without breaking.
- What's broken: Three columns at mobile width will either: (a) shrink each card to unreadable size, or (b) force three-column scroll which is a well-known mobile UX anti-pattern. The orange icons at small scale lose detail. With five cards stacked, this section will be extremely long on mobile.
- Fix: `@media (max-width: 768px) { .capabilities-grid { grid-template-columns: 1fr; } }` — single column stack on mobile. Add a "Show all 5 capabilities" expand pattern that shows 2 cards initially with a toggle to reveal remaining 3. This cuts perceived scroll depth in half.

## Navigation/UX
**Grade: C+**
- What's working: The "PLATFORM" eyebrow label correctly signals a section transition and matches the nav item.
- What's broken: No anchor ID on this section means the "Platform" nav link may not scroll correctly. "PLATFORM" as a section label tells the reader nothing about what they're about to see. No visual indication of progress through the page (e.g., "2 of 5 sections").
- Fix: Add `id="platform"` to the section element. Change eyebrow from "PLATFORM" to "WHAT SWOOP DOES" — this is more informative for a first-time visitor who isn't sure what "Platform" means in this context.

## B2B Buyer Journey
**Grade: C+**
- What's working: Following the pain section with a capabilities section is the correct TOFU → MOFU flow. The GM has recognized their problem and is now being shown the solution.
- What's broken: The capabilities are presented as features ("Member Intelligence... Ranks every member by retention value") rather than as outcomes ("Stop losing members before you know they're gone"). Feature-first copy forces the buyer to do the translation work. In a B2B sale to a time-pressed GM, this is friction.
- Fix: Reframe each card title as an outcome, not a feature category. "Member Intelligence" → "Know who's slipping away." "Tee Sheet & Demand" → "Fill every slot with the right member." "F&B Operations" → "Stop leaving covers on the table." "Staffing & Labor" → "Staff for what's actually happening." "Revenue & Pipeline" → "Prove ROI to your board."

## Copy/Voice
**Grade: C+**
- What's working: "Know who is drifting before they resign" (Member Intelligence card) is outcome-oriented and uses the right verb. "Fill every slot with the member who needs it most" is similarly strong.
- What's broken: "Tie culinary prep to what golf & weather already know" is awkward — it's a passive construction that puts the burden on the reader to understand the mechanism. "Show the board which actions protected revenue" (Revenue & Pipeline) is vague — which actions? Protected how much?
- Fix: Rewrite F&B card body: "When tee-sheet traffic is light and weather is pushing members inside, Swoop tells the kitchen before the shift starts." Rewrite Revenue card body: "Every month, Swoop generates a board-ready report showing which interventions saved which members — with dues revenue attached."

## Technical Credibility
**Grade: B-**
- What's working: The capability names imply genuine cross-system data integration (tee sheet + CRM + weather + POS + scheduling). The fact that Swoop reads weather data alongside F&B is a non-obvious technical detail that signals real engineering depth.
- What's broken: The mechanism is invisible. How does Swoop access all five data sources simultaneously? What's the data freshness? "Updated 1 hour ago" appears as a label in the stat strip but isn't visible in the cards themselves. A GM's IT contact will ask exactly these questions.
- Fix: Add a single-line data source label to each card: e.g., "CRM + POS + EMAIL" below Member Intelligence, "TEE SHEET + WEATHER + WAITLIST" below Tee Sheet & Demand. This pattern already exists in the slice-03 section — pull it up into these cards for consistency.

## Top 3 Priority Fixes for This Section
1. Add a CTA after the capability cards ("Ready to see how Swoop maps to your club?" + "Book a 30-minute walkthrough" button) — this is the most critical missing element; a feature tour with no conversion path is a dead end.
2. Add one proof metric result badge to each capability card (pulling numbers from elsewhere on the page) — capabilities without proof are a feature list, not a value proposition.
3. Reframe card titles from feature category names to outcome statements ("Know who's slipping away" instead of "Member Intelligence") — this halves the translation work the GM buyer must do to understand the value.
