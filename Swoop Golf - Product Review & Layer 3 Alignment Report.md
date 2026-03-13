# SWOOP GOLF — PRODUCT REVIEW & LAYER 3 ALIGNMENT REPORT

**Comprehensive Product Assessment from the Economic Buyer Perspective**

Date: March 12, 2026 | Product: Swoop Club Intelligence Portal (Demo — Oakmont Hills CC)
Reviewed by: Product & Marketing Strategy Team

---

## EXECUTIVE SUMMARY

This report evaluates the Swoop Golf Club Intelligence product against its stated Layer 3 value proposition: answering cross-domain questions that no single vendor can solve. The three Layer 3 themes are Member Health & Churn, Revenue Optimization, and Experience-Outcome Links. The review is conducted from the perspective of the economic buyer — the General Manager or COO of a private club who must justify technology spend to a board and translate platform insights into retained members and recovered revenue.

**Overall Verdict:** Swoop delivers an exceptionally strong product against Layer 3 Theme 1 (Member Health & Churn) and Theme 2 (Revenue Optimization). These are deeply embedded across nearly every screen, with real dollar quantification and actionable next steps. Theme 3 (Experience-Outcome Links) is partially addressed through the operational cockpit and revenue leakage analysis but lacks a dedicated, provable surface. The "Experience Insights" nav item currently routes to the cockpit rather than a standalone module, which is the single biggest gap in the product.

The product's "See It → Fix It → Prove It" framework is powerful and well-executed. The navigation structure maps cleanly to the buyer's mental model. However, there is informational overlap between the Real-Time Cockpit and the Analytics view that creates mild confusion, and the Experience Insights section needs to exist as its own entity to complete the Layer 3 story.

---

## SECTION 1: LAYER 3 THEME ALIGNMENT — HOW THE PRODUCT SPEAKS TO EACH QUESTION

*[Figure 1: Real-Time Cockpit — The product's primary daily operational surface showing the "See It" framework with alert banner, intervention log, and operational command cards]*

### THEME 1: MEMBER HEALTH & CHURN — Grade: A

**Layer 3 Questions asked:** "Which members are disengaging across multiple dimensions?" / "What's the first domino that predicts churn 6 months out?" / "Which members are one bad experience away from leaving?"

This is Swoop's strongest pillar. The product addresses all three questions with depth and precision across multiple screens:

The Member Risk page serves as the early warning system, with a Health Overview showing 235 healthy, 39 at-risk, and 26 critical members — each with a composite health score derived from CRM, analytics, and tee sheet data. The real power is in the multi-dimensional decay signal: the alert banner declares "5 members will resign this month — all showed decay signals 6-8 weeks before leaving" and goes further to specify the decay sequence (email open rates drop first, then golf frequency, then dining). This directly answers the "first domino" question.

The Archetypes tab segments the membership base into 8 behavioral profiles (Social Butterfly, Die-Hard Golfer, Balanced Active, Weekend Warrior, Declining, New Member, Ghost, Snowbird), each with engagement spider charts, retention outlook, and spend potential. This is powerful because the economic buyer can now see that a "Balanced Active" member going quiet is a fundamentally different risk signal than a "Ghost" member going quiet — and act accordingly.

The Email Decay heatmap is an underrated feature that shows campaign open rates by archetype — with "Ghost" members showing 7% open rates on newsletters. This is a clear early churn predictor the GM can act on before behavioral decay even starts.

The Real-Time Cockpit's "Member Health" card surfaces at-risk members who have tee times today — with health scores, archetypes, and specific behavioral context (e.g., "3 rounds in 3 months, down from 12 in October"). The dollar framing ($180K lifetime value at stake) translates the signal into board-level language.

The Resignations tab provides post-mortem pattern analysis with 5 preventable resignations and their distinct decay patterns, allowing the GM to build institutional memory around churn triggers.

**Where it's strong:** Every surface connects health data to dollar value. Health scores combine multiple system inputs (CRM, tee sheet, POS, email). The recommended actions are specific and time-bounded ("GM to call James personally with apology + complimentary round… within 2 hours"). Confidence scores (90-93%) build trust.

**Where it could be stronger:** The "first domino" answer exists in the banner text but lacks a dedicated visualization. A decay sequence timeline showing "Email → Golf → Dining → Resignation" with average time-between-stages would make this Layer 3 claim unassailable. The Response Plans sub-tab exists in the nav but was not deeply explored — if it maps response playbooks to archetype + risk level, this is a major differentiator that should be more prominent.

### THEME 2: REVENUE OPTIMIZATION — Grade: A-

**Layer 3 Questions asked:** "Where are we losing revenue moments — and what's the dollar value?" / "Which member segments have untapped spend potential?" / "What's the revenue impact of 10% better pace of play?"

The Revenue Leakage page is the standout execution of this theme. It opens with the headline "$9,580 in monthly F&B revenue" lost to operational failures, then decomposes the number into three root causes: Pace of Play ($5,760/month), Staffing ($3,400/month), and Weather ($420/month). This is exactly the cross-domain intelligence the Layer 3 framework promises — connecting tee sheet data (slow rounds) to POS data (dining drop-off) to show a causal revenue link no single system reveals.

*[Figure 2: Revenue Leakage — Decomposing $9,580/month in lost F&B revenue into actionable categories with ranger deployment recommendations]*

The "How Revenue Leaks" comparison is one of the product's best visualizations: fast rounds (under 4.5 hours) generate 41% post-round dining at $34.20 avg check, while slow rounds (over 4.5 hours) produce only 22% dining at $28.50 — a $31.01 revenue loss per slow round. This directly answers the "revenue impact of better pace of play" question with surgical precision.

The Scenario Modeling sliders ("What if we reduce slow rounds by X%?", "What if we resolve complaints within Y hours?", "What if we add Z servers on high-demand days?") allow the GM to model recovery — bridging from diagnosis to business case. This is critical for board-level conversations.

The Bottleneck Holes by Impact ranking (Hole 12 at 9.1 min delay, Hole 4 at 8.2 min) with round counts and impact scores gives the operations team a specific deployment plan for rangers.

The Tee Sheet Demand page adds revenue optimization through demand management: the retention-priority fill value ($312) vs. reactive fill value ($187) is a +67% uplift, proving that smart waitlist routing is a revenue optimization strategy, not just a member service tactic. The Demand Intelligence heatmap shows weekend overload (100% fill at 7-8 AM Sat/Sun) against weekday underuse (48-66%), with the insight that re-routing 8 unmet rounds to retention-priority members yields $3,125 in additional slot value.

**Where it's strong:** Dollar quantification everywhere. The decomposition from total leakage to root cause to specific action (ranger on Hole 12) is extraordinarily actionable. The Staffing Gaps tab proves the link between understaffed days and revenue loss ($3,400 lost across 3 understaffed Fridays with 2.1x complaint rates). The scenario sliders create an interactive business case tool.

**Where it could be stronger:** The "untapped spend potential" question from Layer 3 is only partially surfaced. The Archetypes tab shows engagement percentages (e.g., Balanced Active: 68% golf engaged, 38% dining untapped) but the Revenue Leakage page doesn't pull this through — there's no view that says "your Social Butterfly segment spends 45% below potential in dining; here's how to capture $X." Connecting archetype spend gaps to specific revenue capture campaigns would complete this theme. Additionally, the Growth Pipeline at the bottom of the Analytics cockpit shows $648K in annual potential from 18 hot leads, but this feels disconnected from the retention and revenue optimization narrative. It should either be elevated to its own section or explicitly connected to the revenue story.

### THEME 3: EXPERIENCE-OUTCOME LINKS — Grade: C+

**Layer 3 Questions asked:** "Does service quality on the course correlate with dining revenue?" / "Which touchpoints have highest leverage on satisfaction?" / "Do well-handled complaints create more loyal members?"

This is the weakest of the three themes — not because the product doesn't contain the data, but because it lacks a dedicated surface to showcase these correlations. The "Experience Insights" navigation item currently redirects to the Real-Time Cockpit page, meaning this Layer 3 pillar has no home in the product.

The data and logic exist in fragments throughout the product. The Revenue Leakage page implicitly answers "does service quality on the course correlate with dining revenue" through the slow rounds analysis — but it frames this as an operational/revenue issue rather than an experience-outcome correlation. The James Whitfield case study on the cockpit implicitly proves "do well-handled complaints create more loyal members" through the negative case (unresolved complaint led to resignation), and the Recent Interventions log (Sarah Mitchell's health score rising from 38 to 52 after outreach) shows the positive case. But neither is presented as a provable correlation — they are anecdotal examples, not systematic evidence.

The Board Report's "What We Learned" tab and the Prove It framework begin to close this gap by quantifying interventions (14 members saved, $168K dues protected, 23 service failures caught). The Intelligent Actions page shows the causal chain (signal detected → action recommended → outcome measured), which is implicitly an experience-outcome feedback loop.

**What's missing:** A dedicated Experience Insights page that answers these three questions explicitly. This page should include a correlation matrix showing service quality metrics (complaint resolution time, staffing levels, pace of play) against outcome metrics (dining revenue, renewal rates, NPS/satisfaction). It needs a touchpoint leverage analysis — ranking which operational touchpoints (pro shop greeting, pace of play, Grill Room service speed, complaint resolution time) have the most statistical impact on member health scores. It needs a complaint recovery ROI view — showing that members whose complaints were resolved within X hours have Y% higher retention than those whose complaints went unresolved. The data is clearly in the system (complaints, health scores, dining spend, round data, staffing). The product just needs to surface the correlations as provable relationships rather than leaving the economic buyer to infer them.

This is the difference between "I can see that bad experiences lead to bad outcomes" (which the product currently shows anecdotally) and "I can prove to my board that investing in complaint resolution generates a 4x return in retained dues" (which is the Layer 3 promise).

---

## SECTION 2: WHERE THE PRODUCT EXCELS

### 1. The "See It / Fix It / Prove It" Framework is Exceptional

The navigation architecture maps to how a GM actually processes their day. "See It" surfaces problems (Real-Time Cockpit, Member Risk, Revenue Leakage, Experience Insights, Tee Sheet Demand). "Fix It" provides an action queue (Intelligent Actions). "Prove It" closes the loop for board accountability (Board Report). This three-stage funnel is the product's structural competitive advantage — it mirrors the buyer's mental model of "show me the problem, help me fix it, help me justify the spend." Every competitor in the club tech space stops at stage one.

### 2. Dollar Quantification is Relentless and Effective

Nearly every insight in the product is paired with a dollar figure. The cockpit shows $18K/yr in dues at risk from a single complaint. Revenue Leakage shows $9,580/month in lost F&B. The waitlist queue shows $307K in at-risk dues exposed. The Board Report summarizes $168K in dues protected and $840K in lifetime value protected. For the economic buyer who must justify a technology subscription to a board, this is the most important design decision in the product. The economic buyer does not buy dashboards — they buy revenue protection and recovery.

### 3. Contextual Intelligence Over Raw Data

The product never shows a chart without explaining why it matters. The "Why this surfaced" labels on cockpit cards (e.g., "Complaint aging 6d & spend down 42%") tell the GM why the system flagged this specific member at this specific moment. The confidence scores (87-93%) add calibration. The recommended actions with specific instructions ("GM to call James personally with apology + complimentary round") eliminate the cognitive gap between insight and action. This is intelligence, not analytics.

### 4. Multi-System Data Source Transparency

Every card, table, and insight shows which systems contributed the data — badges like "Complaint," "Tee Sheet," "POS," "GPS," "Email," "Weather" appear throughout. This builds trust by showing the GM that the insight isn't guesswork — it's the synthesis of 6 systems they already pay for but couldn't previously connect. The Connected Systems page reinforces this with 17/30 live connectors, 10.5K data points synced this week, and an Intelligence Score of 57/100 — subtly selling the upside of connecting more systems.

### 5. The Intelligent Actions Queue is a Product Differentiator

The agent-based action queue (7 pending, 3 approved, 2 dismissed) with approve/dismiss workflow creates a human-in-the-loop AI system that respects the GM's authority while reducing their workload. Each action card shows its triggering signals (e.g., "SLA breach 6 days, Jan 16 + $18K dues at risk, Today + Tee time 9:20 AM, Today"), the agent type (Service Recovery, Demand Optimizer, Labor Optimizer, Revenue Analyst), and the quantified impact. The "What happens next?" progressive disclosure is well-designed — it gives the GM control without overwhelming them.

### 6. The Board Report Closes the ROI Loop

The "Prove It" section with 14 members saved, $168K dues protected, 23 service failures caught, and 4.2-hour average response time (vs. industry average 6+ weeks) gives the GM exactly what they need for board presentations. The 94% Board Confidence Score is a clever framing that turns data coverage into a credibility metric. The four sub-tabs (Summary, Member Saves, Operational Saves, What We Learned) structure the board conversation. This feature alone could justify the subscription for many clubs.

### 7. The James Whitfield Narrative is Brilliant Sales Engineering

The opening case study on the cockpit — a member who filed a complaint, wasn't followed up, and resigned 4 days later — serves dual purposes. For the prospect, it's a "that could be us" moment. For the existing user, it's a daily reminder of why the system matters. The counterfactual ("What Swoop would have done: Alert surfaced Day 1 → GM sends recovery message → James responds same day → Health score monitored weekly → Retention confirmed") is sales engineering embedded in the product experience.

---

## SECTION 3: WHAT THE PRODUCT IS NOT ADDRESSING

### 1. Experience-Outcome Correlations (Critical Gap)

As detailed in the Theme 3 analysis, there is no dedicated surface that proves correlations between touchpoint experiences and financial/retention outcomes. The product contains all the data needed — complaints, service speed, staffing, pace of play, dining revenue, health scores, retention — but does not present these as statistically provable relationships. The economic buyer's quote from the Layer 3 framework is: "I know event attendance, but I can't prove events are my best retention tool." The product currently cannot prove that either. A new Experience Insights page needs to be built that shows: which touchpoints have the highest leverage on health scores, how complaint resolution time correlates with renewal probability, whether events/dining/golf frequency are the strongest retention levers, and what the ROI is of each operational improvement (e.g., "every $1 spent on faster complaint resolution returns $4 in retained dues").

### 2. Member Satisfaction / Sentiment Data

The product tracks behavioral engagement (rounds, dining, email opens) but has no sentiment input. There is no NPS score, no survey data, no sentiment analysis from complaints. A member could be playing golf weekly but deeply unhappy with course conditions — the health score wouldn't catch this until behavioral disengagement begins. For Layer 3 to truly work, the product needs a sentiment dimension, even if it's a simple quarterly pulse survey integrated into the health score algorithm.

### 3. Competitive Benchmarking

The economic buyer inevitably asks: "How do we compare to other clubs?" The product currently provides no benchmarking. The Board Report shows internal metrics but doesn't contextualize them. Adding anonymized peer benchmarks (e.g., "Your 4.2-hour response time is in the top 10% of clubs using Swoop" or "Your 22% churn-risk rate is below the industry average of 28%") would make the Board Report significantly more compelling and give the GM ammunition for board conversations.

### 4. Proactive Engagement / Campaign Orchestration

The product excels at detecting problems and recommending reactive interventions. What's missing is proactive engagement orchestration — using the intelligence to drive positive actions, not just prevent negative ones. For example: identifying members whose dining frequency is rising and inviting them to exclusive wine dinners, spotting members who consistently play with the same group and offering a group event, or recognizing that a "New Member" has hit 90 days and triggering a check-in. The Intelligent Actions queue currently focuses on risk mitigation. Expanding it to include growth/engagement actions would broaden the value proposition beyond "insurance policy."

### 5. Staff Performance Visibility

The product connects staffing levels to revenue outcomes but doesn't provide individual or team performance visibility. The economic buyer also manages staff — knowing that Service Complaints are 2.1x higher on understaffed days is valuable, but knowing which specific shifts, teams, or service standards correlate with better outcomes would help the GM manage their team, not just their schedule.

### 6. Historical Trend Analysis

Most product screens show a current snapshot with limited historical context. The Revenue Leakage page shows month-over-month comparisons ("up 12% vs Dec") but there's no 6-month or 12-month trend view for any key metric. The economic buyer needs to demonstrate progress over time — showing the board that churn risk has declined from 28% to 13% over 6 months, or that F&B revenue leakage has been reduced by 40% since implementing Swoop. Adding trend lines to the Board Report and key dashboards would strengthen the "Prove It" narrative significantly.

---

## SECTION 4: WHERE WE CAN IMPROVE

### Priority 1 (Critical): Build the Experience Insights Page

The nav item exists but routes to the cockpit. This is the #1 product gap. Build a standalone page that includes: a touchpoint leverage matrix (which experiences most impact health scores), a complaint recovery ROI calculator (resolution time vs. retention probability), a service quality correlation dashboard (staffing, pace, weather vs. dining revenue, satisfaction, renewal), and an events-to-retention attribution view. This single page would elevate the Layer 3 story from 2-of-3 themes answered to all-3.

### Priority 2 (High): Add a Churn Decay Sequence Visualization

The product states that "email open rates dropped first, then golf frequency, then dining" but never visualizes this sequence with timing data. Build a "Churn Anatomy" visualization that shows the average decay timeline — how many weeks between email drop-off and golf decline, between golf decline and dining decline, between dining decline and resignation. This would make the "first domino" claim defensible and differentiated. Place it on the Member Risk page or the new Experience Insights page.

### Priority 3 (High): Connect Archetype Spend Gaps to Revenue Actions

The Archetypes tab shows untapped engagement (e.g., Balanced Active: 38% dining untapped, 46% events untapped). The product should compute the dollar value of closing these gaps and surface them in Revenue Leakage or a new Revenue Growth section. "Your 64 Balanced Active members have $3,264/year in untapped dining potential — here's the campaign to capture it" is a revenue optimization action that's more strategic than fixing slow rounds.

### Priority 4 (Medium): Strengthen the Analytics Tab

The "Analytics" toggle on the cockpit feels like a secondary view rather than a standalone analytics surface. It includes valuable content (yesterday's revenue/rounds/complaints scorecard, today's watch list, growth pipeline) but the mix of retrospective analysis and forward-looking pipeline feels muddled. Consider separating the "yesterday's performance" retrospective into a dedicated Daily Recap section and giving the Growth Pipeline its own proper home — either as a standalone page or within an expanded Revenue section.

### Priority 5 (Medium): Add Historical Trend Lines

Across every major metric (member health distribution, revenue leakage, complaint resolution time, board metrics), add 6-month or 12-month trend lines. The Board Report especially needs this — showing improvement over time is the strongest possible argument for subscription renewal.

### Priority 6 (Medium): Improve the Intelligent Actions Information Hierarchy

The Intelligent Actions page currently presents all 7 pending items in a flat list. As the system scales, this will need priority scoring, grouping by category (retention, revenue, staffing, demand), and a daily summary view. The "Filter by agent" dropdown is a good start but could be more prominent with visual category indicators.

### Priority 7 (Low): Polish the Data Model and Data Upload Pages

These are currently functional but unpolished setup pages. For the economic buyer doing an initial demo walkthrough, these should communicate simplicity and reliability — "connecting your systems takes 15 minutes, not 6 months." The Data Upload page showing CSV templates is good but could benefit from a progress indicator showing "you're 57% connected — here's what unlocks next."

---

## SECTION 5: REDUNDANCY, NOISE, AND WHAT TO CUT OR CONSOLIDATE

### 1. Experience Insights Nav Item (Redirect Issue)

The "Experience Insights" navigation item currently redirects to the Real-Time Cockpit page. This is confusing — a GM who clicks it expects dedicated experience analytics but gets the same cockpit they just left. Either build the page or remove the nav item until it's ready. Having a dead/redirect link in the navigation undermines the product's credibility during a demo or evaluation.

### 2. Real-Time Cockpit "Today" vs. "Analytics" Overlap

The cockpit has two tabs: "Today" (real-time operational view) and "Analytics" (yesterday's scorecard + watch list + growth pipeline). The "Today" view and the "Analytics" view both contain the James Whitfield case but present it differently — the Today view shows it as an alert card, while Analytics shows it as a full case breakdown. This duplication creates confusion about which view is the "canonical" version. Recommendation: Make "Today" purely about what's happening right now and needs immediate action. Make "Analytics" purely about retrospective performance and trend analysis. Remove duplicate content.

### 3. James Whitfield Appears in Three Places

The James Whitfield complaint story appears on the cockpit alert banner (top of page), the Operational Command card (scrolled view), and the Analytics tab case study. While repetition can reinforce urgency, three separate presentations of the same case creates noise. The alert banner is effective — it sets emotional context. The Operational Command card is actionable — it provides action buttons. The Analytics case study is analytical — it adds resolution timeline. Consolidate to two touchpoints maximum: the banner (emotional hook) and the card (action center).

### 4. Persistent Orange Banner Bar

The sticky orange banner at the top ("53 members showing risk signals — $733K/yr in dues need attention today" / "Swoop connects 6 systems…") is effective on first impression but becomes noise after repeated sessions. Consider making it dismissible or context-aware — showing different messages based on what page the user is on, or only appearing when there's a new/urgent condition.

### 5. Connected Systems "Intelligence Score" Could Backfire

The Intelligence Score of 57/100 is clever as an upsell mechanism ("connect more systems to unlock more intelligence"). However, for an economic buyer in a demo, seeing 57/100 may create the impression that the product is only 57% functional. Reframe this as "57% of possible insights unlocked" with a clear list of what additional connections would enable, or only show this score to activated customers, not demo viewers.

### 6. Redundant At-Risk Member Data Across Pages

The at-risk member list appears in multiple places — the Member Risk page health overview shows 39 at-risk + 26 critical, the cockpit surfaces at-risk members with tee times today, the Tee Sheet Demand page shows at-risk waitlist members, and the Intelligent Actions page recommends actions for the same members. This is a natural consequence of the "See It → Fix It" architecture and is largely well-handled, but the counts don't always align (65 at-risk/critical on Member Risk vs. 53 in the banner). Ensure numerical consistency across all surfaces to maintain trust.

### 7. The "Morning Briefing Sheet" Button

The "Morning Briefing Sheet" print button on the cockpit is a nice touch for GMs who want a physical handout. However, its placement between the "Today" and "Analytics" tabs makes it look like a third tab rather than an action button. Move it to a more traditional action position (top-right of the cockpit header or as a dropdown under a "Export" menu).

---

## SECTION 6: PRODUCT SCORECARD — LAYER 3 ALIGNMENT SUMMARY

### Layer 3 Theme Scorecard

| Theme | Grade | Addressed By | Coverage |
|-------|-------|-------------|----------|
| **Theme 1 — Member Health & Churn** | **A** | Member Risk, Real-Time Cockpit, Intelligent Actions, Board Report | All 3 questions answered with data, dollar values, and actions. The "first domino" claim could use a dedicated visualization, but the substance is there. The archetype segmentation and email decay heatmap are unique differentiators. |
| **Theme 2 — Revenue Optimization** | **A-** | Revenue Leakage, Tee Sheet Demand, Real-Time Cockpit, Intelligent Actions | 2 of 3 questions answered strongly. "Where are we losing revenue moments?" and "What's the revenue impact of better pace?" are nailed. "Which segments have untapped spend potential?" is partially addressed in Archetypes but not connected to a revenue capture workflow. |
| **Theme 3 — Experience-Outcome Links** | **C+** | Fragments across Revenue Leakage and cockpit narratives | Data exists across the system but lacks a dedicated surface. No correlation views, no touchpoint leverage ranking, no complaint recovery ROI proof. This theme is the product's biggest opportunity for improvement. |

### OVERALL PRODUCT SCORE: B+ (Strong product with one critical gap)

### Screen-by-Screen Rating

| Screen | Score | Notes |
|--------|-------|-------|
| Real-Time Cockpit | 9/10 | Exceptional as a daily operational surface. Minor issues with Today/Analytics overlap and repeated content. |
| Member Risk | 9/10 | Deep, multi-dimensional, and actionable. Email Decay and Archetypes are standout sub-tabs. |
| Revenue Leakage | 9.5/10 | The product's best page. Causal analysis, scenario modeling, and specific operational actions. |
| Experience Insights | 2/10 | Redirects to cockpit. Does not exist as a standalone page. Critical gap. |
| Tee Sheet Demand | 8.5/10 | Waitlist priority routing and demand heatmap are strong. Cancellation risk scoring adds value. |
| Intelligent Actions | 8/10 | Solid agent-based action queue. Needs better prioritization and categorization as it scales. |
| Board Report | 8.5/10 | Powerful "Prove It" tool. Needs trend lines and benchmarking to reach its full potential. |
| Connected Systems | 7/10 | Good transparency. Intelligence Score framing needs refinement for demo contexts. |
| Data Upload | 6/10 | Functional but unpolished. Needs onboarding guidance. |
| Data Model | 5/10 | Developer-facing, not buyer-facing. Consider hiding from demo/prospect views. |

---

## SECTION 7: TOP 5 RECOMMENDATIONS — PRIORITIZED ACTION PLAN

### Action 1 — Build Experience Insights Page (Sprint priority — Ship within 2 weeks)

**Impact:** Completes the Layer 3 story. Enables Theme 3 to go from C+ to A-. Gives the economic buyer the "proof" they need that operational improvements generate measurable retention and revenue returns. This is the single highest-impact product change available.

### Action 2 — Add Churn Decay Sequence Visualization (Ship within 3 weeks)

**Impact:** Makes the "first domino" claim visually undeniable. Transforms a text insight into a proprietary framework. This becomes a sales asset — GMs will share this visualization with their boards and peers.

### Action 3 — Fix the Experience Insights Nav Redirect (Immediate)

**Impact:** Quick fix that eliminates demo credibility risk. Either route to the new Experience Insights page (if built) or temporarily remove the nav item and replace it when ready.

### Action 4 — Resolve Cockpit Today/Analytics Content Overlap (Ship within 2 weeks)

**Impact:** Reduces confusion for daily users. Makes the cockpit cleaner and more purposeful. The Today view should be purely forward-looking (what needs action now), and Analytics should be purely backward-looking (how did yesterday/last week/last month perform).

### Action 5 — Add Trend Lines to Board Report (Ship within 4 weeks)

**Impact:** Transforms the Board Report from a point-in-time snapshot to a progress narrative. This is the single most important feature for subscription renewal — if the GM can show the board that metrics improved over 6 months, the renewal conversation is automatic.

---

## CLOSING NOTE FOR THE TEAM

This is a remarkably well-designed product for its stage. The economic buyer persona — a GM who needs to detect problems, take action, and justify spend to a board — is deeply understood and well-served across most surfaces. The "See It / Fix It / Prove It" architecture, relentless dollar quantification, and multi-system data transparency are genuine competitive advantages.

The gap is singular and addressable: Experience-Outcome Links need their own dedicated surface. The data is already in the system. The question is whether the product surfaces those correlations as provable intelligence rather than leaving the buyer to infer them. Fix this, and the Layer 3 story becomes airtight.

**The difference between a B+ and an A product is one page.**
