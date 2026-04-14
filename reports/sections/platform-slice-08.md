# Integration Grid + Rollout Timeline — Section Score

**Overall Grade: B-**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | B | Grid is comprehensive but flattens Swoop's intelligence advantage into a vendor list |
| Design/Visual | B+ | Grid layout is clean and scannable; timeline panel is strong |
| CRO/Conversion | C | Rollout timeline is a hidden gem buried below the fold with no CTA attached |
| Trust/Credibility | B+ | "28 integrations across 10 categories" with named systems is the strongest proof block on the page |
| Mobile UX | C | 4-column grid will collapse badly on mobile; category headers will lose hierarchy |
| Navigation/UX | B- | Two distinct content blocks (grid + timeline) fight for attention without a visual separator |
| B2B Buyer Journey | B | Timeline directly answers "how long until I see value?" — key late-stage objection |
| Copy/Voice | B- | Feature list bullets are written in engineer voice, not GM voice |
| Technical Credibility | A- | Named systems per category is best technical proof block on the page |

## Messaging/Positioning
**Grade: B**
- What's working: Organizing integrations into 10 categories (Tee Sheet & Booking, Member CRM, POS & F&B, etc.) maps directly to how a GM thinks about their operational stack. This is buyer-native taxonomy.
- What's broken: The integration grid positions Swoop as "compatible with your tools" rather than "smarter than your tools combined." It reads like a compatibility checklist, which is a necessary proof point but not a differentiator. Competitors can build the same grid.
- Fix: Add a single bold statement above the grid: `"Your tools see individual transactions. Together through Swoop, they predict what happens next."` This reframes the grid from compatibility proof to intelligence proof.

## Design/Visual
**Grade: B+**
- What's working: Dark card grid with amber/orange accent on category counts is visually consistent. The rollout timeline panel uses a contrasting warm-dark background to signal a new content type — good visual segmentation.
- What's broken: The "10 business days" rollout headline uses amber bold styling that creates a visual tie to the accent color — but "10 business days" is a claim, not a metric, and it demands more visual separation to land as a proof point rather than a label.
- Fix: Put the rollout timeline in a bordered card with a subtle left-border accent (`border-left: 3px solid #F5A623; padding-left: 24px`) to visually anchor it as a standalone credibility statement.

## CRO/Conversion
**Grade: C**
- What's working: The rollout timeline ("10 business days, no operational downtime") is the single most conversion-relevant piece of copy on this page. It removes the #1 implementation objection.
- What's broken: This critical claim is buried at the bottom of a long scroll section with no CTA attached. A GM who reads "10 business days" and is convinced has nowhere to go. There is no "Start your rollout" or "Get a timeline estimate" button.
- Fix: Immediately below the rollout timeline block, add: `<a href="/demo" class="btn-primary">Get your rollout timeline →</a>`. This converts the implementation proof into a conversion moment.

## Trust/Credibility
**Grade: B+**
- What's working: Naming specific systems within each category (Lightspeed Golf, Jonas Club, Club Prophet, Northstar, Toast, Square, ADP, QuickBooks, HubSpot) is high-credibility specificity. A GM will scan for their own stack and find it.
- What's broken: The "connected systems" count per category (4 connected systems, 3 connected systems) implies these are live connections, but there's no social proof that any real club uses all of them simultaneously. A skeptic will wonder if "connected" means fully tested or just API-listed.
- Fix: Add a tooltip or footnote: `"*Connected = live, tested integration with data flowing in production clubs."` Alternatively, add one customer quote referencing a specific integration: `"We went live with Swoop on top of Jonas and Lightspeed in 8 days." — GM, [Club Name]`

## Mobile UX
**Grade: C**
- What's working: The integration names are short enough to fit in constrained column widths.
- What's broken: A 4-column grid (`Communications | Staffing & Payroll | Finance & BI | Web & Lead Capture`) will collapse to 1–2 columns on mobile, stacking all 10 category cards into a long scroll that kills momentum. The rollout timeline below will then appear far below the fold.
- Fix: On mobile (`max-width: 640px`), switch to a 2-column grid with reduced card padding (`padding: 12px`). Add `overflow-x: scroll` as a fallback if 2-column is still too tight. Move the rollout timeline above the full integration grid on mobile — it's higher conversion value.

## Navigation/UX
**Grade: B-**
- What's working: The rollout timeline section uses visual contrast (slightly different background) to signal a content shift.
- What's broken: There is no visual anchor connecting the integration grid to the rollout timeline. A reader finishing the grid doesn't know why the next section exists. The transition is abrupt.
- Fix: Add a single bridging line between the grid and the timeline: `"Worried about implementation? Here's what rollout actually looks like."` in 16px italic, centered, with 32px margin above and below.

## B2B Buyer Journey
**Grade: B**
- What's working: "10 business days. No operational downtime." directly answers the two biggest late-stage implementation objections a GM has. This is Decision-stage copy in exactly the right place.
- What's broken: "Week 1: Connector setup, data validation, and intelligence baselines. Week 2: workflows, AI agent playbooks, and GM readiness." is written at the feature level. A GM wants to know what they don't have to do, not what Swoop does.
- Fix: Rewrite the week breakdown in GM-benefit language: `"Week 1: We handle the connectors, data cleanup, and baseline setup — zero IT involvement required. Week 2: Your GM dashboard goes live. We walk your team through the workflows."` 

## Copy/Voice
**Grade: B-**
- What's working: Feature bullets in the upper section (AI-Powered Predictive Recommendations, Closed-Loop Engagement Tracking) are clear category names.
- What's broken: "From signal detection to GM action to member response to outcome measurement" is a vendor-internal process description, not a buyer benefit. "Your existing tools stop at the data layer. Swoop closes the loop." is good — but it's buried after a dense process sentence.
- Fix: Lead with the punchy line, cut the process sentence: Replace `"From signal detection to GM action to member response to outcome measurement. Your existing tools stop at the data layer. Swoop closes the loop."` with just: `"Your tools collect data. Swoop closes the loop — from signal to action to outcome."`

## Technical Credibility
**Grade: A-**
- What's working: This is the strongest technical proof block on the page. Named vendors per operational category, connected system counts, and two-week implementation timeline with specific week-by-week breakdown all signal a mature, deployed product — not a prototype.
- What's broken: "AI-Powered Predictive Recommendations" and "Cross-System Behavioral Correlation" are feature names without mechanism. What model? What data? How does the prediction work at a high level?
- Fix: Add one parenthetical to each: `"AI-Powered Predictive Recommendations (trained on behavioral patterns across your club's historical data)"` and `"Cross-System Behavioral Correlation (tee sheet + F&B + CRM signals unified in a single member timeline)"`.

## Top 3 Priority Fixes for This Section
1. Attach a CTA to the rollout timeline — "Get your rollout timeline →" converts the most persuasive claim on the page into an action.
2. Add a bridging sentence between the integration grid and the rollout panel so the transition doesn't feel like two disconnected sections.
3. Rewrite the week-by-week rollout copy in GM-benefit language — remove "connector setup / intelligence baselines" jargon, replace with what the GM doesn't have to do.
