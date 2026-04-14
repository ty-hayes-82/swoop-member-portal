# Contact Hero — Section Score

**Overall Grade: B-**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | B+ | Headline is strong but subhead undersells the walkthrough's value |
| Design/Visual | B | Four metric tiles work but the dark band below is abrupt and unexplained |
| CRO/Conversion | C+ | No CTA above the fold; the only action is the nav "Book a Demo" button |
| Trust/Credibility | B- | Attribution label is tiny and the metric descriptions are too brief to convey proof |
| Mobile UX | C | Four tiles in a row will collapse poorly on phones; no visibility into stacking behavior |
| Navigation/UX | B | Nav is clean but "About" is a dead end for a buyer who wants social proof |
| B2B Buyer Journey | C+ | Drops straight into proof metrics with no context for a first-time visitor |
| Copy/Voice | B | Headline phrasing is sharp; body copy is too list-heavy and loses the narrative thread |
| Technical Credibility | C | No mention of data source, integration method, or what "tee-sheet fill rate" means operationally |

---

## Messaging/Positioning
**Grade: B+**
- What's working: "See what your club misses today, and what you recover tomorrow" is a tight contrast frame — problem/solution in one breath.
- What's broken: The subhead ("A 30-minute walkthrough on your club's real data — tee sheet leakage, at-risk members, F&B staffing pressure, revenue blind spots. Founding partners only. Nine seats left.") is a run-on that mixes a product description with scarcity in a way that feels cobbled. The scarcity line ("Nine seats left") is buried at the end of a dense sentence.
- Fix: Split into two sentences: "A 30-minute live walkthrough on your club's own data — tee-sheet leakage, at-risk members, F&B staffing pressure, revenue blind spots." Then a separate scarcity line in bold below: **Founding partner pricing · 9 seats remaining.**

---

## Design/Visual
**Grade: B**
- What's working: Off-white background, clean sans-serif type, and the amber/orange accent on the label ("PILOT RESULTS — FOX RIDGE COUNTRY CLUB") create a professional and readable hierarchy.
- What's broken: The dark charcoal band at the bottom of the viewport is visually abrupt with no copy, image, or label to orient the user. It reads as a broken layout or a render artifact rather than an intentional section break.
- Fix: Either add a 1–2 word dark-band label ("BOOK A DEMO" centered, reversed-out in white, 12px caps) or extend the off-white background and push the dark section below the fold. Add 8px bottom-padding to the metric tile row so tiles don't kiss the band.

---

## CRO/Conversion
**Grade: C+**
- What's working: The "Book a Demo" button in the nav is consistently present and orange — it won't be missed by anyone who reaches the nav.
- What's broken: There is no CTA button within the hero body itself. A B2B buyer reading the headline and metrics has no in-context action to take — they must navigate back up to the nav bar. This adds friction and breaks the momentum of the proof metrics.
- Fix: Add a primary CTA button directly below the metric tile row: `<button class="bg-orange-500 text-white px-8 py-3 rounded font-semibold text-base mt-6">Book Your Free Walkthrough →</button>`. Secondary micro-copy beneath: "No credit card · 30 minutes · Your club's actual data."

---

## Trust/Credibility
**Grade: B-**
- What's working: Naming "Fox Ridge Country Club (300 Members)" as the source of the pilot data is the right instinct — it grounds the numbers in a real context.
- What's broken: The attribution is rendered in 9–10px orange uppercase, which is readable but undersized for the weight it carries. The metric labels are too terse: "$1.38M in at-risk dues identified" — identified by whom? Over what period? "3 silent-churn members flagged" — out of how many total? "91% tee-sheet fill rate" — is that good or bad for a 300-member club?
- Fix: Expand metric sublabels to one complete thought each. Example: "$1.38M — dues at risk from members with declining engagement, identified in first 7 days." Add a tooltip or footnote asterisk linking to methodology. Increase attribution label to 11px and add a thin separator line above it.

---

## Mobile UX
**Grade: C**
- What's working: The headline at this font size will wrap gracefully on most tablets.
- What's broken: The four metric tiles are rendered in a single horizontal row. On a 375px-wide phone this either collapses to illegible 60px-wide tiles or overflows horizontally. No evidence of a 2×2 grid fallback in the screenshot. The subhead sentence length is also problematic on mobile — three lines of 14px body copy in a narrow column is dense.
- Fix: Add `grid-cols-2` at `sm` breakpoint for the metric tile row. Set `max-w-[90%]` on the subhead paragraph for mobile. Verify tile labels don't truncate at 375px by testing with `min-w-0` on tile text.

---

## Navigation/UX
**Grade: B**
- What's working: Nav is minimal — Home, Platform, Pricing, About — which is appropriate for a focused demo-conversion page. "Book a Demo" is visually dominant.
- What's broken: "About" is the last nav item, which in B2B is often where buyers go to check team credibility before committing to a demo. If the About page is thin or missing a team/backer section, traffic sent there will not convert back.
- Fix: Rename "About" to "Our Story" or "Team" to set expectation. Alternatively, add a fifth nav item: "Results" that anchors to a case study section, giving buyers a credibility stop before the CTA.

---

## B2B Buyer Journey
**Grade: C+**
- What's working: Proof metrics are the right content for a buyer who has already been warmed — they validate that the product works before asking for a meeting.
- What's broken: For a first-time visitor this page opens cold — no context for what Swoop is, who it's for, or how it works. A GM landing here from a LinkedIn ad or referral gets four amber numbers with no narrative frame. There is no "here's how we got these numbers" link or accordion.
- Fix: Add a one-line explainer above the pilot attribution label: "Swoop surfaces the revenue and retention gaps your PMS can't see — in 30 minutes, on your club's own data." This bridges the headline to the proof metrics for a cold-entry buyer.

---

## Copy/Voice
**Grade: B**
- What's working: The headline verb choice ("misses" / "recover") is active and financially grounded — exactly right for a GM audience.
- What's broken: The body copy lists four categories separated by em-dashes, which reads like a feature list rather than a promise. "Founding partners only. Nine seats left." is correct scarcity signaling but the period-separated sentence fragments feel abrupt rather than urgent.
- Fix: Replace the body copy with: "In 30 minutes, we run Swoop on your club's actual data — flagging revenue you're leaving on the table and members you're about to lose. Founding partner cohort: 9 seats remaining."

---

## Technical Credibility
**Grade: C**
- What's working: Naming "tee-sheet fill rate" and "silent-churn members" signals familiarity with club operations vocabulary.
- What's broken: There is no indication of how Swoop accesses the club's data — no mention of PMS integration, CSV upload, or API. A technically-minded COO will hesitate to book a demo if they don't know whether the "30-minute walkthrough on your club's real data" requires an IT project or a spreadsheet export.
- Fix: Add a one-line integration note under the subhead or under the CTA: "Works with Jonas, Cobalt, Club Prophet, and Northstar — no IT project required. Bring a tee-sheet export, we handle the rest."

---

## Top 3 Priority Fixes for This Section
1. Add a CTA button inside the hero body (below the metric tiles) — the nav button alone is insufficient conversion architecture for a page whose only job is to book demos.
2. Expand metric sublabels to one complete sentence each — bare numbers with 3-word labels do not constitute proof for a skeptical GM.
3. Add an integration/data-access line — "no IT project required" removes the single largest friction point between a curious GM and a booked demo.
