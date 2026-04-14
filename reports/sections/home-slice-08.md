# Integrations Grid + Rollout Timeline — Section Score

**Overall Grade: B-**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | B | "28 integrations across 10 categories" is a strong credibility number; category naming is GM-native |
| Design/Visual | C+ | Dark grid is readable but visually flat; integration logos/names lack visual hierarchy |
| CRO/Conversion | C | Rollout timeline is a strong objection-handler but no CTA follows it |
| Trust/Credibility | B- | Specific system names (ForeUp, Jonas F&B, ADP, QuickBooks) add real credibility |
| Mobile UX | C- | 4-column integration grid will be unreadable on mobile; 7 categories × multiple items is overwhelming |
| Navigation/UX | B- | Category headers and system count per category are well-structured |
| B2B Buyer Journey | B | "10 business days" launch timeline directly addresses the biggest objection to switching |
| Copy/Voice | B- | "No operational downtime" is a strong claim; "Typical launch" framing is honest |
| Technical Credibility | B+ | Named integration partners (not generic "CRM systems") give this section strong specificity |

---

## Messaging/Positioning
**Grade: B**
- What's working: "28 integrations across 10 categories" is the right proof format for GMs evaluating switching costs. Category naming (Tee Sheet & Booking, Member CRM, POS & F&B, Staffing & Payroll, Finance & BI, Web & Lead Capture, Access & Activity, Communications) maps precisely to the operational vocabulary of a private club GM. This is not generic SaaS language.
- What's broken: The section opens cold — there's no headline framing why 28 integrations matters. The buyer needs to understand that "28 integrations" means "we almost certainly already connect to your current stack." The implied message is there; the explicit message is missing.
- Fix: Add a section headline above the integration grid: "We probably already connect to your stack." with subhead: "28 integrations across the systems you run today — no rip-and-replace required."

---

## Design/Visual
**Grade: C+**
- What's working: The dark background with category headers and system lists creates a dense but organized grid. Color-coding by category count ("4 connected systems" in different colors or sizes) would help — though it's unclear from the screenshot whether this differentiation exists.
- What's broken: The integration grid is visually flat — all category boxes appear equal weight. There's no visual emphasis on the categories a GM is most likely to care about (Tee Sheet & Booking and Member CRM are the primary evaluation criteria). The "AI-Powered Predictive Recommendations" and "Closed-Loop Engagement Tracking" feature bullets above the grid appear to share the dark background with the grid, creating visual confusion between features and integrations.
- Fix: Add a visual badge on Tee Sheet & Booking and Member CRM: "Most common in your stack" or a star icon. Use `font-weight: 700` for category headers and `font-weight: 400` for system names to create hierarchy. Add a 1px `border-top: solid rgba(255,255,255,0.1)` separator between the feature bullets and the integration grid.

---

## CRO/Conversion
**Grade: C**
- What's working: The rollout timeline ("Typical launch: 10 business days. No operational downtime.") is a powerful objection-handler — implementation anxiety is one of the top reasons GMs don't buy. Placing this immediately after the integration grid is correct.
- What's broken: After successfully addressing "will this connect to my systems?" and "how hard is this to implement?" — the two biggest purchase objections — there is no CTA. A GM who reads "10 business days, no downtime" and feels relief has no "start the process" button in front of them.
- Fix: Add a CTA block immediately after the rollout timeline: a full-width dark-orange button: "Check if your stack is supported — free systems audit" with secondary text below: "Most clubs are live in under 2 weeks." This converts the implementation reassurance into a prospect action.

---

## Trust/Credibility
**Grade: B-**
- What's working: Named integration partners (ForeUp, Lightspeed Golf, Club Prophet, Foresite, Tee-On for Tee Sheet; Northstar, Jonas Club, ClubMaster for CRM; Toast, Square, Lightspeed, POSitouch, Jonas F&B for POS; ADP, iShifts, Paychex for Staffing; QuickBooks, Sagemirraccl, Club Benchmarking, PivotTable for Finance; HubSpot, MemberSense for Web; Brivo, Net Systems, Gatekeeper for Access; Mailchimp, Constant Contact, Twilio, SendGrid for Communications) are real, named vendors in the golf club vertical. This is a strong credibility signal.
- What's broken: "No operational downtime" is a bold claim with no evidence. How? Why? A GM who has experienced painful system migrations will be skeptical. The Week 1/Week 2 rollout description visible in the upper portion of the screenshot (Week 1: connector setup, data validation, intelligence baselines; Week 2: workflows, AI agent playbooks, GM readiness) is cut off and barely readable.
- Fix: Add a one-line mechanism to "No operational downtime": "Swoop connects via read-only API — your existing systems keep running exactly as they do today." Make the Week 1/Week 2 timeline fully visible (not clipped by screenshot crop). Add one customer quote: "We were live in 9 days. Nothing changed for our staff." — GM name, club name.

---

## Mobile UX
**Grade: C-**
- What's working: The rollout timeline section with its two-column Week 1 / Week 2 format will degrade gracefully to stacked single-column on mobile.
- What's broken: The integration grid — 8 categories × 3–5 system names per category in a ~4-column layout — will be completely unreadable on mobile. This is dense information that requires horizontal space to scan. On a 375px screen, either each category becomes a single tiny card with illegible text, or the layout breaks entirely.
- Fix: On `max-width: 768px`, render the integration grid as an accordion: each category is a collapsed row with the count ("Tee Sheet & Booking — 4 systems") and expands on tap to show the system names. This preserves all information while respecting mobile constraints. Apply `font-size: 14px; padding: 12px 16px` to accordion rows.

---

## Navigation/UX
**Grade: B-**
- What's working: "28 INTEGRATIONS ACROSS 10 CATEGORIES" as a section header provides instant orientation. The category structure (8 categories with named systems and connection counts) allows GMs to quickly find their specific tools.
- What's broken: There's no search or filter on the integration list. A GM running Jonas Club + Toast + ADP wants to instantly confirm all three are supported — they shouldn't have to scan 3 columns of text. The integration grid appears to be a static list with no interactivity.
- Fix: Add a simple filter row above the integration grid with 3–4 common stack combinations: "Jonas Club stack", "ClubMaster stack", "Custom" with pre-selected checkboxes that highlight the relevant integrations. Alternatively, add a simple text search: `<input placeholder="Search your systems...">` that filters visible integration names client-side.

---

## B2B Buyer Journey
**Grade: B**
- What's working: This section addresses two of the biggest late-stage objections in B2B SaaS: "Does it work with my existing stack?" (integration grid) and "How long and disruptive is implementation?" (rollout timeline). Placing both in the same section creates a strong "it fits AND it's fast" double punch.
- What's broken: The transition from the AI capabilities bullets above (AI-Powered Predictive Recommendations, Closed-Loop Engagement Tracking) into the integration grid is abrupt. A GM reading linearly will lose the thread — they were reading about behavioral intelligence and suddenly they're looking at a vendor list.
- Fix: Add a transitional sentence above the integration grid: "All of this runs on the data your existing tools already collect. Here's what Swoop connects to today:" — this bridges the capability claims and the integration evidence without breaking reading flow.

---

## Copy/Voice
**Grade: B-**
- What's working: "Typical launch: 10 business days." is confident, specific, and conversion-relevant. "No operational downtime." is punchy and addresses anxiety directly.
- What's broken: The feature bullets above the grid ("AI-Powered Predictive Recommendations", "Closed-Loop Engagement Tracking") are title-case noun phrases, not active claims. "From signal detection to GM action to member response to outcome measurement. Your existing tools stop at the data layer. Swoop closes the loop." is the best writing on the page but it's buried above the integration grid where few GMs will read it.
- Fix: Pull "Your existing tools stop at the data layer. Swoop closes the loop." up to the section headline. Use it as the integrations section tagline: larger, centered, positioned before the grid appears. Remove "AI-Powered Predictive Recommendations" as a feature label — it's jargon. Replace with: "Acts before problems become resignations."

---

## Technical Credibility
**Grade: B+**
- What's working: The named integrations are the strongest technical credibility signal in the entire homepage. Listing "POSitouch, Jonas F&B, Toast, Square, Lightspeed" is not marketing fluff — these are real vendor names that golf club operators recognize. The 10-category framework covering tee sheet, CRM, POS, staffing, finance, web, access control, and communications demonstrates real operational coverage.
- What's broken: The connection count per category ("4 connected systems", "3 connected systems") is shown but it's unclear whether this means Swoop has been tested with 4 specific tee sheet systems or 4 have been committed to roadmap. This distinction matters to a technical evaluator.
- Fix: Change "4 connected systems" to "4 live integrations" (if all are deployed) or "4 supported integrations" (if some are roadmap). Add a footnote: "All integrations listed are production-deployed and maintained. Last updated: April 2025." Add a "Request integration" link for unlisted systems.

---

## Top 3 Priority Fixes for This Section
1. Add a CTA immediately after the rollout timeline — "10 business days, no downtime" is the page's strongest objection-handler and it ends without a conversion surface; add "Check if your stack is supported — free systems audit" button.
2. Add "No operational downtime" mechanism: "Swoop connects via read-only API — your systems keep running unchanged" — without this explanation, a skeptical GM will dismiss the claim as marketing.
3. Add an accordion or search filter to the integration grid for mobile — the current static 4-column grid is unusable at mobile widths, and integration compatibility is a decision-critical question for GMs.
