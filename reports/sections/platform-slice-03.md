# Platform Slice 03 (Five Core Capabilities Grid) — Section Score

**Overall Grade: B-**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | B | Five capabilities cover the full club ops surface — but the names are product-speak, not outcomes |
| Design/Visual | C+ | 3+2 unbalanced card grid looks unfinished; bottom two cards are cut off |
| CRO/Conversion | D | No CTA anywhere in this section — five capability cards with no "see this in action" hook |
| Trust/Credibility | B- | Each card has a metric (6.4 wks, 91%, $5.7K) which is good; but no source or methodology |
| Mobile UX | C | 3-column top row and 2-column bottom row will produce inconsistent stacking on mobile |
| Navigation/UX | C+ | Section eyebrow copy ("Swoop combines member behavior...") is good context but font is too small |
| B2B Buyer Journey | B- | Capabilities are in the right place (after the story arc) but framed as features not buyer benefits |
| Copy/Voice | C+ | Bullet descriptions are functional but dry — no voice, no urgency, reads like a feature list |
| Technical Credibility | B | Data source labels (CRM + POS + EMAIL, TEE SHEET + WEATHER + WAITLIST) are strong differentiators |

---

## Messaging/Positioning
**Grade: B**
- What's working: The five capabilities ("Member Intelligence," "Tee Sheet & Demand," "F&B Operations," "Staffing & Labor," "Revenue & Pipeline") map directly to the organizational chart of a private club. A GM will immediately recognize their functional domains.
- What's broken: The capability names are product-centric rather than outcome-centric. "Member Intelligence" doesn't tell the buyer what it does for them — "Know who's drifting before they resign" does. The section headline ("Five core capabilities. One operating view.") repeats the hero headline structure without adding new information.
- Fix: Rename capabilities in the cards to outcome-first format: **"Member Intelligence → Know every member's risk score before your morning standup"** | **"Tee Sheet & Demand → Fill every opening with the right member at the right time"** | **"F&B Operations → Connect dining decisions to retention outcomes"** | **"Staffing & Labor → Staff to demand, not to gut feel"** | **"Revenue & Pipeline → Show the board what saved your dues."**

---

## Design/Visual
**Grade: C+**
- What's working: White cards on cream background provide consistent visual language with the risk cards above. The orange icon in each card header provides color continuity. Metric callouts (6.4 wks, 91%, $5.7K) are sized well.
- What's broken: Three cards in the top row and two in the bottom row creates an asymmetric grid that looks unfinished — as if a sixth card was planned and removed. The bottom two cards are cut off in the screenshot, which means they're below the fold without a scroll affordance. The section header text ("Swoop combines member behavior, demand, service, labor, and revenue so your team can act with confidence instead of assumptions") is too small for the visual weight it carries.
- Fix: Either add a sixth capability card to complete the 2x3 grid, or reformat to a 2x2+1 centered layout. Increase the section intro text to 18px / `text-lg` at minimum. Add a subtle scroll indicator below the visible cards if the bottom row is consistently below the fold.

---

## CRO/Conversion
**Grade: D**
- What's working: The metric callouts (6.4 wks early warning, 91% fill rate, $5.7K monthly F&B upside) quantify the value of each capability, which is good groundwork for a conversion ask.
- What's broken: There is no CTA in this section. After five capability cards with specific metrics, there is no "See all five in action" or "Get a demo" button. This is a complete conversion gap in the middle of what should be the highest-intent section of the page.
- Fix: Add a CTA row beneath the capability grid: **"All five capabilities. One morning briefing. [Book the 30-minute walkthrough →]"** Use the primary orange button. This is the natural conversion point for buyers who've evaluated the full capability set.

---

## Trust/Credibility
**Grade: B-**
- What's working: Each card has a data-point callout with a timestamp ("Updated 14 min ago," "This prediction updated 7 min ago") — this is a smart touch that implies live data, not static demos. The specific metrics ($5.7K monthly F&B upside, 91% fill rate) are credible because they're specific.
- What's broken: The "Updated 14 min ago" timestamp implies real-time data, but on a marketing page this will read as fabricated to most visitors. There's no explanation of how these numbers are calculated or what club they're from.
- Fix: Add a caption below the grid: **"Metrics shown are live outputs from an active Swoop deployment. Numbers reflect a single club's 30-day performance."** This legitimizes the timestamps and prevents the "that's just a demo" dismissal.

---

## Mobile UX
**Grade: C**
- What's working: Cards are self-contained — each tells a complete story with title, bullets, data source labels, and a metric callout, so stacking on mobile preserves meaning.
- What's broken: Five stacked cards is a long mobile scroll (especially after the two-column sections above). There's no visual shortcut for mobile users to identify which capability is most relevant to their role. The 3+2 grid asymmetry will likely produce an orphaned single-column card at mobile breakpoint.
- Fix: On mobile, implement a tabbed capability selector: five tabs (Member · Tee Sheet · F&B · Staffing · Revenue) at the top, with one card body shown at a time. This condenses five scrolling cards into one interactive panel.

---

## Navigation/UX
**Grade: C+**
- What's working: The section flows logically from the narrative sections above (SEE IT → FIX IT → PROVE IT → here's how it works).
- What's broken: There are no anchor links, no capability navigation, and no way for a buyer who's specifically interested in "F&B Operations" to jump directly to that card from the nav or from another page.
- Fix: Add `id` attributes to each capability card (e.g., `id="capability-member-intelligence"`). In the top nav or in a sticky sidebar on desktop, add deep-link capability anchors so buyers and sales reps can send direct links to relevant capabilities.

---

## B2B Buyer Journey
**Grade: B-**
- What's working: Five capabilities after the narrative arc is correct placement — buyers who've seen the problem and the proof are now ready to understand the full product scope.
- What's broken: The capabilities are presented as a feature inventory rather than a solution to the buyer's specific role. A GM vs. a COO vs. an F&B Director will care about different capabilities — but the section treats all buyers equally.
- Fix: Add a role filter above the grid: **"What matters most to you?"** with three pill filters: **[Operations] [Finance] [Member Experience]** — clicking each highlights the relevant 2-3 capability cards. This is a small JavaScript enhancement that dramatically improves relevance for different buyer personas.

---

## Copy/Voice
**Grade: C+**
- What's working: "Know who is drifting before they resign" (Member Intelligence subtitle) is the best line in the section. "Staff to predicted demand, not static templates" (Staffing & Labor) is also strong.
- What's broken: The bullet points under each card are functional but not persuasive. "Ranks every member by retention value + urgency" reads like a product spec. "Connects complaints, spend, rounds, and email engagement" is a data-model description, not a benefit statement.
- Fix: Rewrite each card's primary bullet to be benefit-first: "Ranks every member by retention value + urgency" → **"Wake up knowing exactly which 5 members need a call today — ranked by what they're worth to the club."** "Connects complaints, spend, rounds, and email engagement" → **"Finally, one number that tells you how close a member is to leaving — before they say anything."**

---

## Technical Credibility
**Grade: B**
- What's working: Data source labels at the bottom of each card (CRM + POS + EMAIL, TEE SHEET + WEATHER + WAITLIST, POS + TEE SHEET + WEATHER) are excellent — they show buyers exactly which systems Swoop connects to without requiring them to ask. This is the most technically credible element of the entire platform page.
- What's broken: "Updated 14 min ago" implies live data processing, but no explanation of the processing pipeline (real-time? batch? nightly?) is given. Tech-savvy buyers or IT managers evaluating integration risk will want this detail.
- Fix: Add a line beneath each card's data source label: **"Updated nightly by 6 AM via [API / CSV sync / native connector]"** — the specific mechanism varies by integration but naming it reduces technical buyer anxiety.

---

## Top 3 Priority Fixes for This Section
1. Add a CTA beneath the capability grid — this is the highest-intent section of the page and has zero conversion mechanism. "All five capabilities. One morning briefing. [Book the 30-minute walkthrough →]" is the fix.
2. Fix the 3+2 grid asymmetry — add a sixth card or reformat to 2x2+1 centered layout. The current layout looks like a missing card and undermines the polished product narrative above it.
3. Add a caption legitimizing the "Updated 14 min ago" timestamps: "Metrics shown are live outputs from an active Swoop deployment." Without this, sophisticated buyers assume the numbers are fabricated for the demo.
