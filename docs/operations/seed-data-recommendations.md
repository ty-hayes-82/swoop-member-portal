# Seed Data Story Impact Audit

> 5 GM auditor agents analyzing Pine Tree demo data for maximum story impact.
> Each agent focuses on specific members, specific stats, and specific seed data changes.
> Updated: 2026-04-10

---

## Final 5-Cycle Audit — ALL 20 PATHS AT 5/5 (2026-04-10)

20 import-path combinations tested across 5 cycles. All scored 5/5 after seed data fixes.

| Cycle | Paths tested | Fixes applied |
|---|---|---|
| 1 | Members, M+Tee, M+FB, Core 3 | CSV type normalization, dining conversion data file |
| 2 | M+Email, M+Complaints, M+Tee+Email, M+FB+Complaints | Email CSV backdated to Oct, Hurst timeline fixed, Leonard ID aligned |
| 3 | M+T+F+Complaints, M+T+F+Email, All-Agents, All 8 | Whitfield added to decayingMembers, cockpit suggestedActions |
| 4 | M+Staffing, M+ClubProfile, M+T+Comp+Email, All 8 | Mills ID normalized, staffing rates realistic, club profile lat/lng |
| 5 | Tee-only, FB-only, M+Agents, All 8+ProShop | Clean pass — no fixes needed |

### What shipped during the cycles:
- 8 backdated email campaigns (Oct-Nov) proving 6-8 week early warning
- Pro shop outlet + 10 checks showing purchase personality per member
- Enriched dining items (Arnold Palmer + Club Sandwich = Whitfield's usual)
- Realistic staffing rates ($13-58/hr)
- Club profile with lat/lng/timezone
- AI recommendation playbook (8 archetypes × 3-4 actions)
- /api/generate-recommendation + /api/generate-batch-recommendations (Claude API)
- 7 pre-generated AI-format seed actions with talking points + dollar stakes
- diningConversion.js (20 daily rows deriving 41%/22% rates)
- Mills/Leonard ID alignment, Hurst/Whitfield timeline fixes

---

## Round 2 Audit — Guided Demo Insight Quality (2026-04-10)

5 GM auditor personas tested the guided demo experience. Systemic finding: **named + dollarized = compelling; anonymous + aggregate = forgettable.**

### Cycle Scores

| Cycle | Persona | Score | Top recommendation |
|---|---|---|---|
| 1 | Saturday morning GM | 3.2/5 | Replace "Active Members" stat with "At-Risk on Sheet: 3"; add "TEES OFF IN 45 MIN" badges |
| 2 | Member profile deep-dive | 4.3/5 | Add 1 activity entry to Jordan/Callahan/Chen/Mills; create Hurst + Leonard profiles |
| 3 | CFO stress-test | 2.7/5 | $5,760 pace loss has $583 math gap; $420 weather is placeholder; add derivation fields |
| 4 | Board report | 3.4/5 | Add ROI KPI card: "4.2x — $133K protected vs $32K subscription" |
| 5 | Progressive import | 3.0/5 | Steps 4+5 banners are generic — name a member + dollarize in every banner |

### Priority Seed Data Changes (from this round)

**P0 — Credibility (CFO would catch):**
1. Compute `revenueLostPerMonth` from conversion rates instead of hardcoding 5760 (bottom-up = $5,177, gap = $583)
2. Replace $420 weather constant with computation from rainy-day revenue delta
3. Add `derivation` field to each understaffed day explaining the dollar amount
4. Add `benchmark` field to each board report KPI (e.g., "vs industry avg 82%")
5. Add ROI KPI: `{ label: 'Swoop ROI', value: 4.2, suffix: 'x', description: '$133K protected / $32K subscription' }`
6. Fix "48% improvement" hardcode in board narrative — compute from monthlyTrends (real = 53%)

**P1 — Story completeness (profile deep-dive):**
7. Add Hurst (mbr_t03) full memberProfile (tier, family, 5 activity entries, risk signals, drafts, staff note)
8. Add Leonard (mbr_t07) full memberProfile (backstory, activity showing ghost pattern, bridge partner ref)
9. Add 1 activity entry each to Jordan (historical positive), Callahan (complaint content), Chen (email abandoned), Mills (dining before/after)

**P2 — Progressive import banners (name + dollarize every step):**
10. Complaints banner: "James Whitfield's complaint is 6 days old — $18K dues at risk" (not "2 linked to at-risk members")
11. Email banner: "Diane Prescott's email opens dropped 22% — $15K dues. 8 members match Kevin Hurst's pre-resignation pattern"
12. F&B stat row: add named card "Robert Callahan: $3,020 spent (exact minimum)"
13. MorningBriefingSentence: render members-only segment when no tee-sheet yet ("75 members need attention — $868K at risk")

**P2 — Saturday morning UX:**
14. Replace "Active Members: 390" stat card with "At-Risk on Sheet: 3" (member count is static census)
15. Add "ON COURSE NOW" / "TEES OFF IN 45 MIN" badge to MemberAlerts cards with tee times
16. Add yesterday delta to greeting bar ("3 things changed since yesterday")
17. Story 2 teaser: name Kevin Hurst ("Kevin Hurst: email dropped → golf dropped → dining dropped")

**P3 — Board report polish:**
18. Add `daysToIntervention` to each member save (speed = Swoop's value prop)
19. Add `patternInsight` to each feedbackSummary category ("72% of pace complaints on Saturday AM with no ranger")
20. Compute responseTimeImprovement dynamically from monthlyTrends (53%, not hardcoded 48%)

---

## Previous Round — Final Verification (2026-04-10)

All 4 GM auditor paths scored **5/5 across every insight**:

| Auditor | Score | Key verification |
|---|---|---|
| Static demo mode | 6/6 | All topRisk strings match between members.js and briefingService |
| Guided CSV→API pipeline | PASS | 441 FK alignments verified, zero orphans |
| Progressive load (5 steps) | 25/25 | DataImportBanner fires with real data at every step |
| Full 20-item scoring | 20/20 | Revenue $9,580/mo defensible, all stories specific + actionable |

---

## Implementation Status

### SHIPPED (committed to guided-data-driven + dev)

| Change | Files | Commit |
|---|---|---|
| Member IDs aligned (mbr_203→mbr_t01, etc.) | 20 src/ files | 3994036 |
| Revenue: $20.7K→$5.76K ($9/round) | pace.js, cockpit.js, DataImportBanner, DemoStoriesLauncher, revenueService | 3994036 |
| 4 new members in CSV (Chen, Leonard, Mills) | JCM_Members_F9.csv | 3994036 |
| 52 tee sheet bookings with decline arcs | TTM_Tee_Sheet_SV.csv, TTM_Tee_Sheet_Players_SV.csv | 3994036 |
| topRisk text: Whitfield Jan16+42min, Jordan waitlists, Callahan $3,020, Mills complaints | members.js | f57a75c |
| Briefing API: uses members.health_score instead of member_engagement_weekly | api/briefing.js | f57a75c |
| Health scores NULL on members import (directory only) | api/guided-copy.js | 5782655 |
| No auto-compute on import | api/guided-copy.js | 5782655 |
| Board Report: Staff Utilization 87%, Avg Resolution Time 4.2 hrs | boardReport.js | db1e322 |
| Cockpit item 3 urgency: urgent→high | cockpit.js | db1e322 |
| Sandra Chen topRisk: specific dollars | members.js | 5782655 |
| Archetype actions on all 8 types | members.js | 5782655 |
| memberSummary: avgTenure, avgDues, renewalRate | members.js | 5782655 |
| roundsTrend sparkline on MemberAlerts | MemberAlerts.jsx | 28dc28f |
| DataImportBanner celebrations | DataImportBanner.jsx, App.jsx | 2c5c3e9 |
| HealthDimensionGrid honest dimensions | MemberProfileDrawer.jsx | 2c5c3e9 |
| Core-3 celebration banner | TodayView.jsx | 2c5c3e9 |
| Context-aware empty states | RevenuePage.jsx, HealthOverview.jsx | 2c5c3e9 |
| OnboardingChecklist inspirational teasers | OnboardingChecklist.jsx | db1e322 |
| Members stat cards (tenure, dues, renewal) | MembersView.jsx | db1e322 |

### IN PROGRESS (agent running)

| Change | Status |
|---|---|
| POS checks for Callahan $3,020 pattern, Chen dining cliff, Whitfield 42-min ticket | Agent running |
| Complaint CSV rows with specific content | Agent running |
| Email decay events for Hurst + Leonard | Agent running |

### NOT YET STARTED (from auditor recommendations)

| Change | Priority | Source |
|---|---|---|
| Add 3 new resignation scenarios (Snowbird, 90-day failure, legacy aging out) | P1 | Auditor 3 |
| Add Linda Leonard member profile (currently none) | P1 | Auditor 1+3 |
| Add household dollar impact to resignation scenarios | P1 | Auditor 3 |
| 6 new agent actions (course routing, Chef's Table, anniversary, buddy, staffing savings, waitlist) | P1 | Auditor 4 |
| Rapid response action promoted to #1 cockpit/first-visible | P1 | Auditor 4 |
| Fix agent attribution (agx_003, agx_006 mislabeled) | P2 | Auditor 4 |
| sinceLastLogin items: story-driven not generic | P2 | Auditor 4 |
| Board report: add roiSummary, YoY member trend, NPS, benchmarks | P2 | Auditor 5 |
| Monthly trends: fix Feb contradiction (3 saves vs 6 in data) | P0 | Auditor 5 |
| Clean up 5 dead "Board Confidence Score" JSX references | P3 | Verification auditor |
| _generateRoster score leak (Cycle 3 finding) | P1 | Cycle 3 auditor |

---

## Audit Results

---

### 1. James Whitfield — Balanced Active (service recovery failure)
**Current state:** Health 42, unresolved complaint from Jan 16 (slow Grill Room lunch, 42-min ticket time vs 18-min target). Family: spouse Erin (wine dinners), son Logan (junior golf). $18K dues, $26K total annual value, 7-year member. Tee time 8:00 AM today. Multiple agent actions queued (personal call, apology draft, rapid response, 48h follow-up).
**Story strength:** 5 — why? This is the flagship demo story. Specific trigger event (42-min wait, "felt ignored"), dollar amount ($18K/$90K lifetime), clear action (GM call before 8:00 AM tee time), tight timeline (complaint aging 1 day, SLA breached), family context (Erin + Logan amplify lifetime risk), and a real GM would instantly recognize the "loyal member who had one bad experience" archetype.
**What makes this member's story compelling or weak:**
- Excellent: complaint has exact timestamps, exact ticket time, exact spend decline ($47 to $28 avg check)
- Excellent: drafts reference his actual booth (12), his actual tee window, his actual preferred channel (Call)
- Excellent: resignation scenario shows the 4-day complaint-to-resign timeline
- Minor gap: the complaint date is inconsistent — activity says Jan 16 but riskSignals say Jan 18. Cockpit says "yesterday" which implies Jan 16 is correct. The atRiskMembers.topRisk says "Jan 18" — this should be Jan 16.
**Recommended changes (exact file:field:value):**
- `src/data/members.js` : `atRiskMembers[2].topRisk` : change `'Unresolved complaint Jan 18 — service speed'` to `'Unresolved complaint Jan 16 — 42-min Grill Room wait, felt ignored'` (align date + add visceral detail)
- `src/data/members.js` : `resignationScenarios[2].timeline[2].date` : confirm reads `'Jan 16'` not `'Jan 18'` (it currently says `'Jan 18'` — mismatch with activity log showing Jan 16)
**After changes, the demo moment would be:**
> "James Whitfield filed a complaint yesterday about a 42-minute lunch wait — he felt ignored. He has an 8:00 AM tee time this morning. No one has called him. His family spends $26K/year here."

---

### 2. Anne Jordan — Weekend Warrior (slow withdrawal)
**Current state:** Health 28, declining rounds (Oct 4, Nov 2, Dec 1, Jan 0). Family: spouse Marcus. $12K dues, $17.8K annual value, 10-year member. Tee time 7:08 AM today. Missed 3 Saturday waitlists. Walked off after 7 holes due to pace. 60-day follow-up shows win-back campaign got zero opens, health declining to 22.
**Story strength:** 4 — why? Strong decline arc with specific numbers. The "walked off after 7 holes due to pace" detail is visceral and GM-recognizable. Waitlist frustration is a real club problem. But the story lacks a single sharp trigger event — it reads as a slow fade rather than a "we failed her on Tuesday" moment.
**What makes this member's story compelling or weak:**
- Strong: round frequency decline is textbook and easy to read at a glance
- Strong: "walked off after 7 due to pace" is the kind of detail a GM immediately understands
- Strong: 10-year tenure makes this feel like a real loss
- Weak: $12K dues is the lowest in the at-risk group — reduces urgency
- Weak: no unresolved complaint or specific service failure to anchor the story
- Weak: the waitlist signal ("Missed 3 Saturday waitlists in a row") is strong but not surfaced in atRiskMembers.topRisk
**Recommended changes (exact file:field:value):**
- `src/data/members.js` : `atRiskMembers[3].topRisk` : change `'Oct 4 rounds → Nov 2 → Dec 1 — steady withdrawal'` to `'Missed 3 Saturday waitlists, walked off Jan 7 after slow pace — zero rounds since'` (lead with the actionable failure, not the trend)
- `src/data/members.js` : `atRiskMembers[3].duesAnnual` : change `12000` to `14000` (marginally more impactful without being unrealistic for Weekend Warrior tier; or keep at 12K if authenticity is paramount)
**After changes, the demo moment would be:**
> "Anne Jordan has been a member for 10 years. She missed 3 Saturday waitlists in a row, then walked off the course on January 7th because of slow play. She hasn't been back since. She's on the tee sheet at 7:08 AM — this is your window."

---

### 3. Robert Callahan — Declining (obligation-only spender)
**Current state:** Health 22, Corporate tier. Hitting exact F&B minimum ($3,020), no golf since November. Complaint aging 9 days with zero follow-up. Family: spouse Elizabeth (wine dinners only). $18K dues, $21K annual value, 11-year member. Tee time 9:00 AM today.
**Story strength:** 5 — why? The "hitting exact F&B minimum" pattern is instantly recognizable to any GM — it is the classic resignation precursor. The 9-day unresolved complaint is damning. The Corporate tier adds a second dimension (he entertains clients here). A GM seeing this would say "we're about to lose this guy and it's our fault."
**What makes this member's story compelling or weak:**
- Excellent: "Spent exactly $3,020 F&B minimum then ceased" is the most GM-recognizable signal in the entire dataset
- Excellent: 9-day complaint with zero follow-up is an obvious failure
- Excellent: Corporate tier means potential referral/client entertainment loss beyond just dues
- Strong: Elizabeth attending only wine dinners shows the household is already disengaging
- Minor gap: the complaint content is never specified — what was the complaint about? Adding that detail would sharpen the story
**Recommended changes (exact file:field:value):**
- `src/data/members.js` : `memberProfiles.mbr_271.riskSignals[0].label` : change `'Complaint aging 9 days'` to `'Complaint aging 9 days — "my usual table was given away, no one apologized"'` (make the complaint specific and relatable)
- `src/data/members.js` : `atRiskMembers[4].topRisk` : change `'Hitting exact F&B minimum; no golf since November'` to `'Hitting exact $3,020 F&B minimum then stopping; 9-day complaint unresolved; no golf since Nov'` (combine both signals, add dollar specificity)
**After changes, the demo moment would be:**
> "Robert Callahan is a Corporate member who entertains clients here. He's been methodically hitting his F&B minimum to the dollar and stopping. He filed a complaint 9 days ago — his usual table was given away — and nobody has followed up. He plays at 9:00 AM today."

---

### 4. Kevin Hurst — Declining (already resigned)
**Current state:** Health 18, zero activity since December. Email decay since November. Resigned Jan 8. $18K dues, $72K lifetime value. Resignation scenario shows gradual multi-domain decay over 3 months. No member profile (no detail page).
**Story strength:** 3 — why? Kevin serves as the "cautionary tale" in the resignation scenarios — the member you already lost. That is valuable for the demo narrative ("here's what happens when you miss the signals"). But he has no profile, no family context, no specific personality. He reads as a data point, not a person.
**What makes this member's story compelling or weak:**
- Strong: the 3-month decay timeline is clean and educational
- Strong: "$72K lifetime value" is a gut-punch number
- Weak: no member profile means no personal details, no family, no favorite booth
- Weak: no specific trigger event — just "declining everything gradually"
- Weak: already resigned — no action the GM can take, which reduces demo urgency
**Recommended changes (exact file:field:value):**
- `src/data/members.js` : `resignationScenarios[0].pattern` : change `'Gradual multi-domain decay over 3 months'` to `'Gradual multi-domain decay over 3 months — no outreach attempted despite 8-week signal window'` (emphasize the missed opportunity)
- `src/data/members.js` : `atRiskMembers[0].topRisk` : change `'Zero activity since December; email decay since November'` to `'Resigned Jan 8 after zero activity since December — $72K lifetime value lost. 8-week intervention window was missed.'` (if he is used as cautionary tale, make the loss explicit in the topRisk field)
**After changes, the demo moment would be:**
> "Kevin Hurst resigned on January 8th. He was a $72,000 lifetime-value member. The signals started in October — we had 8 weeks to intervene. Nobody called."

---

### 5. Linda Leonard — Ghost (already resigned)
**Current state:** Health 12, no visits since October, dues-only member 3+ months. Resigned Jan 15. $18K dues, $36K lifetime value. No member profile.
**Story strength:** 2 — why? Linda is the weakest story in the dataset. She has no personality, no family, no specific complaint, no service failure. "Ghost who stopped coming" is too generic. A GM hears this and thinks "she probably moved" rather than "we failed her."
**What makes this member's story compelling or weak:**
- Weak: no trigger event — just absence
- Weak: no personality details, no family, no preferred channel
- Weak: "dues-only member for 3+ months" is common enough that it does not feel urgent
- Weak: no member profile means no demo drill-down
- Acceptable: she does illustrate the "zero-visit = personal call" playbook gap
**Recommended changes (exact file:field:value):**
- `src/data/members.js` : `resignationScenarios[1].missedIntervention` : change `'3+ weeks of zero visits should have triggered GM personal call — intervention window: mid-November'` to `'3+ weeks of zero visits should have triggered GM personal call. Her husband Richard (mbr_118) also stopped visiting in November — household disengagement missed entirely.'` (invent a household link to amplify stakes)
- `src/data/members.js` : `atRiskMembers[1].topRisk` : change `'Last visit October; dues-only member'` to `'Last visit October; dues-only member for 90+ days. Husband Richard also disengaged — household at risk.'`
**After changes, the demo moment would be:**
> "Linda Leonard hasn't set foot in the club since October. Neither has her husband. They're paying $36K combined in dues for a membership they never use. Nobody picked up the phone."

---

### 6. Sandra Chen — Social Butterfly (dining/event withdrawal)
**Current state:** Health 36, House tier. Dining spend down 87% ($18 last visit vs $142 avg). Declined 3 consecutive event invites. $9K dues, $14.5K annual value. Daughter Avery in summer volleyball camps. Late renewals last 2 years. Pescatarian, loves wine dinners, booth 6.
**Story strength:** 4 — why? Sandra is the best non-golf story in the dataset. The dining spend cliff ($142 to $18) is visceral. The "Social Butterfly who stopped being social" archetype is instantly recognizable. Daughter Avery adds family stakes. But $9K dues is the lowest amount, and "declined 3 event invites" lacks the urgency of a complaint or service failure.
**What makes this member's story compelling or weak:**
- Excellent: "$18 last visit vs $142 average" is a devastating data point
- Strong: the personal details (booth 6, pescatarian, wine dinners) make her feel real
- Strong: "last 2 renewals were late" signals she has been considering leaving for a while
- Weak: $9K dues is the smallest dollar figure — harder to make the GM care in a demo
- Weak: no specific service failure or complaint to anchor the urgency
**Recommended changes (exact file:field:value):**
- `src/data/members.js` : `atRiskMembers[5].duesAnnual` : change `9000` to `14500` (match her memberValueAnnual, or at minimum raise to $12K — $9K on a Social Butterfly House member feels low for a private club demo)
- `src/data/members.js` : `atRiskMembers[5].topRisk` : change current value to `'Dining spend cratered from $142 avg to $18. Declined 3 event invites. 2 late renewals. Daughter Avery stops summer camps if Sandra leaves.'` (add the family domino effect)
**After changes, the demo moment would be:**
> "Sandra Chen used to spend $142 every visit at her favorite booth. Last time she came in, she grabbed an $18 salad and left. She's declined three event invitations in a row. If she leaves, her daughter Avery's summer camps go too."

---

### 7. Robert Mills — Balanced Active (practicing but disengaging from clubhouse)
**Current state:** Health 33, Full Golf tier. Practicing at driving range but skipping clubhouse spend. Slow-play complaints mentioned twice without follow-up. $18K dues, $23K annual value. Family: spouse Maya (spa/pool), son Ethan (college freshman, summer golf). 12-year member. "Huge advocate when he feels seen."
**Story strength:** 3 — why? Robert has the raw materials for a great story (12-year member, family, $23K value, advocate personality) but the current trigger is too soft. "Practicing but skipping post-round dining" is not urgent enough for a demo. The slow-play complaint is more interesting but buried. The note about him being a "huge advocate when he feels seen" is gold — it implies that he becomes a detractor when he does not feel seen.
**What makes this member's story compelling or weak:**
- Strong: 12-year member + advocate personality = high-stakes loss
- Strong: family details (Maya, Ethan) are specific and relatable
- Strong: "Dials golf staff directly" and the slow-play complaint suggest he is the kind of member who will tell you what is wrong before leaving — if you listen
- Weak: "skipping post-round dining" is not a demo-worthy headline
- Weak: the slow-play complaint lacks specifics — when, what happened, who did not follow up
**Recommended changes (exact file:field:value):**
- `src/data/members.js` : `atRiskMembers[6].topRisk` : change `'Practicing but skipping clubhouse spend; slow-play complaints unresolved'` to `'Reported slow-play issue twice (Jan 5, Jan 11) — no marshal response either time. Now practicing alone, skipping clubhouse entirely. 12-year member going silent.'` (lead with the specific failure)
- `src/data/members.js` : `memberProfiles.mbr_312.riskSignals[1].label` : change `'Mentioned slow-driver issue twice without follow-up'` to `'Reported slow marshals on holes 9-10 twice (Jan 5 + Jan 11) — zero follow-up from golf ops'` (add dates and specificity)
**After changes, the demo moment would be:**
> "Robert Mills has been a member for 12 years. He reported slow play twice this month — nobody responded either time. Now he comes to the range alone, skips the clubhouse, and leaves. His son Ethan plays summer golf here. You're about to lose a family, not just a member."

---

## Watch Member Assessment

**Are any watch members more compelling than the current at-risk list?**

| Watch Member | Score | Signal | More compelling than current at-risk? |
|---|---|---|---|
| Jennifer Walsh (mbr_309) | 60 | No events in first 60 days as new member | **Yes** — new member failing to onboard is a powerful demo story. $28K dues is the highest in either list. Should replace Linda Leonard or Kevin Hurst as an active at-risk member. |
| Greg Holloway (mbr_304) | 55 | Post-round dining stopped 3 weeks ago | No — too similar to Robert Mills without the family/tenure context. |
| Nathan Burke (mbr_306) | 53 | Cancelled last 2 Saturday tee times | No — similar to Anne Jordan but less developed. |
| Lisa Yamamoto (mbr_311) | 63 | In-season activity 40% below expected | Possibly — Snowbird underperformance is a recognizable pattern, and $24K dues is substantial. Worth developing if the demo needs a seasonal retention story. |
| Paul Serrano (mbr_308) | 56 | Email + golf both declining 2 weeks | No — too generic, low dues ($11K). |
| Mark Patterson (mbr_313) | 54 | Golf + email both declining | No — similar to Nathan Burke, underdeveloped. |
| Claire Donovan (mbr_307) | 65 | Dining down 30% in January | No — score too high to feel urgent. |
| David Chen (mbr_310) | 57 | Pro shop spend dropped to zero | No — pro shop spend alone is not a compelling lead signal. |
| Diane Prescott (mbr_301) | 62 | Email opens declined 22% | No — email-only signal is too abstract for a GM demo. |
| Tom Gallagher (mbr_302) | 58 | Round frequency down 3 to 2/month | No — marginal decline, not urgent. |
| Evelyn Park (mbr_303) | 64 | Skipped last 2 events | No — score too high. |
| Rita Vasquez (mbr_305) | 61 | Newsletter opens dropped 65% to 38% | No — email-only signal. |

**Recommendation:** Jennifer Walsh (mbr_309, $28K, New Member) should be promoted to a featured at-risk story. A new member who has not attended a single event in 60 days — at $28K dues — is exactly the kind of story that makes a GM sit up. The demo narrative would be: "You invested in acquiring Jennifer Walsh. She's paying $28K/year. She hasn't attended a single event or met another member in 60 days. The onboarding window is closing."

---

## Top 5 Highest-Impact Seed Data Changes

These are the changes that will most improve the demo experience, ranked by impact:

### 1. Fix James Whitfield complaint date inconsistency
- **File:** `src/data/members.js`
- **Change:** Align `atRiskMembers[2].topRisk` date from "Jan 18" to "Jan 16" to match activity log and cockpit data
- **Why:** Date inconsistencies break trust during a live demo. If a prospect notices "Jan 18" in one place and "Jan 16" in another, the entire data story loses credibility.

### 2. Sharpen Robert Callahan's topRisk with dollar specificity
- **File:** `src/data/members.js`
- **Change:** `atRiskMembers[4].topRisk` from `'Hitting exact F&B minimum; no golf since November'` to `'Hitting exact $3,020 F&B minimum then stopping; 9-day complaint unresolved; no golf since Nov'`
- **Why:** The $3,020 number is the single most GM-recognizable signal in the dataset. Burying it behind a generic description wastes the best data point.

### 3. Add specific complaint content to Robert Callahan's risk signal
- **File:** `src/data/members.js`
- **Change:** `memberProfiles.mbr_271.riskSignals[0].label` from `'Complaint aging 9 days'` to `'Complaint aging 9 days — "my usual table was given away, no one apologized"'`
- **Why:** A quoted member complaint turns abstract data into a human moment. GMs hear this and think of their own members.

### 4. Rewrite Robert Mills topRisk to lead with the specific failure
- **File:** `src/data/members.js`
- **Change:** `atRiskMembers[6].topRisk` from `'Practicing but skipping clubhouse spend; slow-play complaints unresolved'` to `'Reported slow-play issue twice (Jan 5, Jan 11) — no marshal response either time. Now practicing alone, skipping clubhouse entirely.'`
- **Why:** "Practicing but skipping dining" sounds like a lifestyle choice. "Reported a problem twice and nobody responded" sounds like a failure the GM can fix today.

### 5. Add family domino effect to Sandra Chen's topRisk
- **File:** `src/data/members.js`
- **Change:** `atRiskMembers[5].topRisk` to include `'Daughter Avery stops summer camps if Sandra leaves'`
- **Why:** Every at-risk member with family context should surface the household revenue at stake. A GM does not lose one member — they lose a family. This is the emotional multiplier that closes deals in a demo.

---

### Agent 5: Board Report & Cross-Domain Story Impact Audit

---

## Board Report Section-by-Section Audit

### KPIs (boardReport.js -- kpis)

**Current content:** Service Quality Score 87%, Members Retained 14, Staff Utilization 87%, Avg Resolution Time 4.2 hrs, Monthly Revenue $375,200

**Board impact:** 3/5 -- The KPIs are solid operationally but miss the ROI story entirely. A board member sees "14 Members Retained" and asks "so what?" There is no denominator, no dollar connection, no trend arrow.

**Recommended changes:**
- Change "Members Retained" to "Members Saved This Quarter" and add description `$168K in dues protected` (14 saves x $12K avg dues)
- Add a KPI: `Dues at Risk` with value `$868K` and color `red` -- this is the urgency anchor
- Add a KPI: `Save Rate` with value `78%` and description `14 of 18 flagged members retained` -- shows the system works
- Change "Avg Resolution Time" description to include the trend: `Down from 8.1 hrs in Sep` -- proves improvement
- Monthly Revenue ($375,200) should include `+4.2% vs plan` in the description field

**After changes, the board slide would say:**
> "$868K in dues at risk. 14 members saved. $168K in dues protected. Resolution time cut in half since launch."

---

### Member Saves (boardReport.js -- memberSaves)

**Current content:** 6 individual save stories with health score before/after, trigger, action, outcome, and duesAtRisk. Total dues protected = $108,000.

**Board impact:** 4/5 -- These are excellent. Each one is a mini-case study. The health score swing (28 to 62, 34 to 71) is visceral. The weakness: there is no aggregate summary line.

**Recommended changes:**
- Add a `memberSavesSummary` export: `{ totalSaves: 6, totalDuesProtected: 108000, avgHealthSwing: '+33 pts', avgTimeToResolve: '3.2 days' }`
- Reorder saves so the highest duesAtRisk ($31K, Robert & Linda Chen) is first -- lead with the biggest number
- Add a `saveCost` field to each save estimating staff time: e.g., `saveCost: 150` (2 hours of GM/director time at $75/hr). This enables the cost-per-save metric boards love.
- The Chen family save ($31K) should note "family membership -- retention of family units has 2.8x lifetime value impact"

**After changes, the board slide would say:**
> "6 members saved this month. $108K in annual dues protected. Average cost per save: $150 in staff time vs. $16,400 in lost dues. 109:1 ROI."

---

### Operational Saves (boardReport.js -- operationalSaves)

**Current content:** 3 ops saves -- Wind Advisory ($12,400), Starter No-Show ($0), Valentine Dinner Overbook ($12,600). Total revenue protected: $25,000.

**Board impact:** 3/5 -- The Valentine Dinner story is great (NPS 4.8/5 for an overbooked night). The Starter No-Show is compelling operationally but has $0 revenue, which undercuts the financial narrative.

**Recommended changes:**
- Starter No-Show: change `revenueProtected` from `0` to an estimated value like `4800` with description `13 first-group tee times protected from cascading delay`. A delayed first group on a Saturday costs revenue through compressed rounds and member frustration.
- Add a 4th operational save: a weather-driven F&B pivot or a proactive maintenance alert -- something that shows Swoop thinking ahead, not just reacting
- Add `totalRevenueProtected` summary: currently $25,000, should be ~$30K+ with the no-show revision

**After changes, the board slide would say:**
> "$42K in revenue protected through 4 proactive operational interventions. Zero complaints on Valentine's night despite 110% capacity."

---

### Monthly Trends (boardReport.js -- monthlyTrends)

**Current content:** Sep-Feb data showing membersSaved (1,2,2,3,3,3), duesProtected ($12K to $42K peak then $17K), serviceFailures (4,5,4,5,3,2), responseTime (8.1 to 3.8 hrs).

**Board impact:** 2/5 -- This is the weakest section. The story SHOULD be a recovery arc but the February duesProtected drops to $17K which looks like regression. The membersSaved flatlines at 3/month for three months which looks like a ceiling.

**Recommended changes:**
- February duesProtected ($17K) is misleading -- Feb is a short month and the 6 saves on the current page ($108K) have not been counted here. Adjust Feb to at least `48000` to reflect the actual saves documented in `memberSaves`. The current $17K contradicts the $108K shown elsewhere.
- membersSaved for Feb should be `6` (matching the 6 member saves documented) not `3`
- Add a `cumulativeDuesProtected` field to each month so the chart can show the running total line: $12K, $40K, $71K, $109K, $151K, $199K -- that is a compelling upward curve
- serviceFailures trending 4,5,4,5,3,2 is good but needs a label: "Service failures cut 60% since October"
- responseTime trending 8.1 to 3.8 is the best stat in the entire dataset. It should be called out explicitly: "Response time improved 53% -- from 8.1 hrs to 3.8 hrs in 6 months"

**After changes, the board slide would say:**
> "$199K in cumulative dues protected. Service failures down 60%. Response time cut from 8 hours to under 4. System is getting smarter every month."

---

### Dues at Risk Note (boardReport.js -- duesAtRiskNote)

**Current content:** "Represents 6 specific saves identified this month. Total portfolio at risk: $868K (see Member Health)."

**Board impact:** 3/5 -- The note is factually correct but buries the most important number. $868K should be a headline, not a parenthetical.

**Recommended changes:**
- Restructure as: `"$868K in annual dues at risk across 75 members. This month: 6 saves completed, $108K protected. Remaining opportunity: $760K addressable through Swoop-guided interventions."`
- This creates the three-part narrative boards need: problem ($868K), progress ($108K), and opportunity ($760K)

**After changes, the board slide would say:**
> "$868K at risk. $108K saved. $760K still recoverable."

---

## Cross-Domain Insights Audit

### 1. Touchpoint Correlations -- "Post-round diners renew at 2.3x"

This IS the number-one cross-domain proof point, and it deserves top billing. Currently it sits as the second item in `touchpointCorrelations` (retentionImpact: 0.78, behind Round Frequency at 0.89). But for a board presentation, the cross-domain nature of dining-after-golf is more interesting than "people who golf more, stay."

**How to make it more prominent:**
- In the board report, add a `crossDomainHeadline` export: `"Members who dine after rounds renew at 92% vs. 61% for non-diners -- a 2.3x multiplier"`
- The `correlationInsights[0]` (dining-after-rounds) has a beautiful stat: "Of 182 members who regularly dine post-round, 168 renewed (92%). Of 118 who never dine after golf, only 72 renewed (61%)." This should appear verbatim on the board report as a callout box.
- Actionable implication for GM: "Every post-round dining comp you offer costs $35. Each lost member costs $16,400/year. The math: invest $6,370/year in post-round comps (182 members x $35) to protect $2.98M in dues."

### 2. Archetype Spend Gaps -- Social Butterflies

The `getArchetypeSpendPatterns()` function calculates spend potential. Running the math on Social Butterflies:
- Golf engagement: 18/100, Dining: 82/100, Events: 78/100
- avgAnnualSpend = (18x120 + 82x80 + 78x45) / 100 = (2160 + 6560 + 3510) / 100 = **$122/member**
- spendPotential = ((100-82)x80 + (100-78)x45) / 100 = (1440 + 990) / 100 = **$24/member** in untapped dining+events
- But the real gap is golf: 82% unused golf capacity. 58 Social Butterflies x even 1 intro round/month = meaningful utilization

**Is this actionable for a GM?** Yes, but the framing needs to change:
- Current framing: "Social Butterflies underspend on golf" -- this is an observation, not a prescription
- Better framing: "58 Social Butterflies each bring $0 golf revenue. Converting even 20% to 1 round/month adds revenue and boosts their retention from 84% to 91%"
- Add to archetype action: "Invite to '9 and Dine' social golf event -- golf + dinner combo designed for non-golfers. 9 holes, scramble format, dinner afterward."

### 3. Event ROI -- Best Retention Correlation

From `eventROI` data, ranked by retention impact:

| Event Type | Retention Rate | ROI | Attendance |
|---|---|---|---|
| Chef's Table | **98%** | **5.1x** | 12 |
| Member-Guest Tournament | 96% | 4.2x | 48 |
| Wine Dinner | 94% | 3.8x | 32 |
| Holiday Gala | 93% | 3.5x | 120 |
| Family Pool Day | 92% | 3.1x | 28 |
| Golf Clinic | 90% | 2.7x | 22 |

**Key finding:** Chef's Table has the highest retention (98%) AND the highest ROI (5.1x) but the lowest attendance (12). This is the board-ready insight:
- "Chef's Table attendees renew at 98%. We serve 12/month. If we double capacity to 24/month, we protect an additional $197K in dues annually (12 more members x $16,400 avg dues)."
- Member-Guest Tournament is the volume play: 48 attendees, 96% retention, 4.2x ROI. This is the anchor event.
- Wine Dinners are the sweet spot: monthly frequency, high retention (94%), and they directly activate the Social Butterfly archetype.

---

## CFO Approval Test: Would a CFO approve $1,500/mo for Swoop?

**Current data supports:** $108K in member saves + $25K in operational saves = **$133K in documented value** over the demo period. At $18K/year ($1,500/mo), that is a **7.4x ROI**.

**But the presentation is scattered.** The CFO needs one slide:

| Metric | Value |
|---|---|
| Annual Swoop cost | $18,000 |
| Dues protected (6 months) | $168,000 |
| Operational revenue saved | $25,000 |
| Total documented value | $193,000 |
| **ROI** | **10.7x** |
| Cost per member save | ~$150 staff time |
| Cost per lost member | $16,400/yr |
| **Payback period** | **< 1 month** |

**Recommended addition to boardReport.js:**
```js
export const roiSummary = {
  swoopAnnualCost: 18000,
  duesProtected: 168000,
  operationalSaves: 25000,
  totalValue: 193000,
  roi: 10.7,
  costPerSave: 150,
  costPerLostMember: 16400,
  paybackPeriod: '< 1 month',
};
```

---

## The ONE Headline Number

Current best candidate: `$868K in dues at risk`

**Recommended headline structure (three-beat):**

> **"$868K in dues at risk. $108K saved. $760K still recoverable."**

This works because:
1. **$868K** creates urgency (the problem is real)
2. **$108K** proves capability (the system works)
3. **$760K** justifies investment (there is more to capture)

Alternative headline if you want a single number: **"$108K saved in 6 months -- 6x Swoop's annual cost"**

---

## What is MISSING from the Board Report

### 1. Year-over-Year Member Count Trend
**Status: MISSING -- Critical gap**
A board expects to see: "390 members, up/down from X last year." The `memberSummary.total` is 390 but there is no historical comparison.

**Recommended addition to members.js:**
```js
export const memberTrend = {
  current: 390,
  lastYear: 402,
  delta: -12,
  deltaPct: -3.0,
  resignations: 5,
  newMembers: 3,
  note: 'Net -12 members YoY. Swoop identified 5 resignations; 3 were preventable with earlier intervention.',
};
```

### 2. Net Promoter Score or Satisfaction Metric
**Status: PARTIALLY PRESENT** -- Service Quality Score (87%) exists but NPS is the standard board metric.

**Recommended addition to boardReport.js:**
```js
export const satisfactionMetrics = {
  nps: 42,
  npsPrior: 36,
  npsDelta: '+6',
  serviceQuality: 87,
  diningRating: 4.2,
  courseCondition: 4.4,
  note: 'NPS improved from 36 to 42 since Swoop implementation. Industry avg: 32.',
};
```

### 3. Competitor/Industry Benchmark
**Status: MISSING -- High-value gap**
The data has `renewalRate: 0.91` in memberSummary. This needs context.

**Recommended addition:**
```js
export const benchmarks = {
  renewalRate: { club: 0.91, industry: 0.85, topQuartile: 0.94 },
  avgDues: { club: 16400, industry: 14200, topQuartile: 18500 },
  memberSatisfaction: { club: 87, industry: 78, topQuartile: 90 },
  complaintResolution: { club: '4.2 hrs', industry: '48 hrs', topQuartile: '8 hrs' },
};
```

Board-ready line: **"Your 91% renewal rate outperforms the 85% industry average. Swoop's goal: close the gap to the top-quartile 94%."**

### 4. Cost-Per-Save Metric
**Status: MISSING -- The CFO killer stat**

Each of the 6 member saves involved roughly 1-2 hours of GM/director time. At $75/hr, that is ~$150 per save. Each saved member pays $16,400/yr in dues.

**Board-ready line:** **"Each Swoop-assisted save costs $150 in staff time to protect $16,400 in annual dues. That is a 109:1 return on the staff investment alone."**

### 5. Monthly Trend Consistency
**Status: BROKEN** -- `monthlyTrends` shows Feb with 3 saves/$17K, but `memberSaves` documents 6 saves/$108K. These numbers must reconcile or the board will catch the inconsistency.

### 6. Forward-Looking Projections
**Status: MISSING**
Boards want to know what happens next quarter. Add:
```js
export const projections = {
  nextQuarterSaves: { low: 8, mid: 12, high: 16 },
  nextQuarterDuesProtected: { low: 96000, mid: 144000, high: 192000 },
  note: 'Based on current trajectory of 3-6 saves/month and improving response times.',
};
```

---

## Summary of Recommended Seed Data Changes (Priority Order)

| Priority | File | Change | Impact |
|---|---|---|---|
| P0 | boardReport.js | Fix Feb monthlyTrends to match memberSaves (6 saves, ~$48K+) | Eliminates data contradiction |
| P0 | boardReport.js | Add `roiSummary` export with 10.7x ROI calculation | Enables the CFO slide |
| P0 | boardReport.js | Add `memberSavesSummary` with totals + cost-per-save | Aggregates the story |
| P1 | boardReport.js | Restructure `duesAtRiskNote` into 3-beat narrative | Frames the headline |
| P1 | members.js | Add `memberTrend` with YoY member count | Fills critical board gap |
| P1 | boardReport.js | Add `benchmarks` with industry comparisons | Provides competitive context |
| P1 | boardReport.js | Add `satisfactionMetrics` with NPS | Standard board metric |
| P2 | boardReport.js | Add cumulative totals to monthlyTrends | Enables the "hockey stick" chart |
| P2 | boardReport.js | Reorder memberSaves by duesAtRisk descending | Lead with biggest number |
| P2 | boardReport.js | Add saveCost field to each memberSave | Enables cost-per-save visual |
| P2 | experienceInsightsService.js | Add `crossDomainHeadline` export for board callout | Surfaces the 2.3x stat |
| P3 | boardReport.js | Add `projections` for next quarter | Forward-looking narrative |
| P3 | boardReport.js | Revise Starter No-Show revenueProtected from $0 to $4,800 | Removes dead-weight $0 |

---

## CSV-Level Change Plan

> Generated 2026-04-09 by tracing every auditor recommendation to the actual CSV seed files in `public/demo-data/`.

### Critical Architecture Finding: Member ID Mismatch

The static `src/data/members.js` references member IDs that belong to **different people** in the CSV. The CSV has 5 dedicated demo members (`mbr_t01`-`mbr_t05`) but the static data uses IDs from the general population. Three key story members (Sandra Chen, Linda Leonard, Robert Mills) have **no CSV records at all**.

| Story Member | Static data ID | CSV owner of that ID | CSV demo ID | CSV data exists? |
|---|---|---|---|---|
| James Whitfield | mbr_203 | Darryl Harrington (SOC, $6K) | mbr_t01 | Members only -- no POS/tee/email |
| Kevin Hurst | mbr_042 | Ahmed Jennings (FG, $18K) | mbr_t03 | Members only -- no POS/tee/email |
| Anne Jordan | mbr_089 | Joshua Laurent (FG, $18K) | mbr_t04 | Members only -- no POS/tee/email |
| Robert Callahan | mbr_271 | Debra Glass (SOC, $6K) | mbr_t05 | Members only -- no POS/tee/email |
| Sandra Chen | mbr_146 | Rosa Fox (SPT, $12K) | NONE | No member record, no CSV data |
| Linda Leonard | mbr_117 | Wesley Sullivan (FG, $18K) | NONE | No member record, no CSV data |
| Robert Mills | mbr_312 | N/A (no mbr_312 in CSV) | NONE | No member record, no CSV data |

**Decision required:** Either (A) re-ID the static data to use `mbr_t0X` IDs matching the CSV, or (B) rename/repurpose the existing CSV IDs. Option A is recommended -- it keeps the general population data intact and focuses changes on the `mbr_t*` rows.

---

### Change 1: Anne Jordan -- Join Date Fix + Round Decline Arc

**Source:** Auditor 2
**Impact:** GM sees a 10-year member with a clear Oct/Nov/Dec decline who walked off Jan 7 and has a 7:08 AM tee time today.

**CSV changes:**

| File | Row identifier | Column | Current value | New value | Why |
|------|---------------|--------|---------------|-----------|-----|
| JCM_Members_F9.csv | mbr_t04 (Anne Jordan) | Date Joined | 2020-01-10 | 2016-03-15 | Story says "10-year member" -- needs join date ~2016 |
| JCM_Members_F9.csv | mbr_t04 | Membership Type | Social | FG | Weekend Warrior archetype implies golf access |
| JCM_Members_F9.csv | mbr_t04 | Annual Fee | 12000 | 14000 | Per auditor rec: slightly higher for demo impact |
| JCM_Members_F9.csv | mbr_t04 | Household ID | (empty) | hh_t04 | Enable household linkage for Marcus (spouse) |
| TTM_Tee_Sheet_SV.csv | NEW rows | -- | -- | 4 Oct rounds, 2 Nov rounds, 1 Dec round, 0 Jan completed rounds | Build the 4-2-1-0 decline arc |
| TTM_Tee_Sheet_SV.csv | NEW row | -- | -- | Jan 7 booking, 9 holes, status=walkoff or completed with Duration=~90 min (7 holes) | The walkoff story anchor |
| TTM_Tee_Sheet_SV.csv | NEW rows | -- | -- | 3 Saturday bookings with status=waitlisted or cancelled | "Missed 3 Saturday waitlists" |
| TTM_Tee_Sheet_SV.csv | NEW row | Date=today, Tee Time=07:08 | -- | Confirmed booking at 7:08 AM | The "your window" moment |
| TTM_Tee_Sheet_Players_SV.csv | NEW rows | -- | -- | Player entries linking mbr_t04 to each new booking | Required to associate member with bookings |

**Specific tee sheet rows to add (TTM_Tee_Sheet_SV.csv):**

```
# Oct rounds (4)
bkg_t04_001,course_main,2025-10-04,08:00,2,0,cart,0,18,completed,2025-10-04 07:45:00,2025-10-04 08:00:00,2025-10-04 12:15:00,255
bkg_t04_002,course_main,2025-10-12,09:00,4,1,cart,0,18,completed,2025-10-12 08:45:00,2025-10-12 09:00:00,2025-10-12 13:20:00,260
bkg_t04_003,course_main,2025-10-19,07:30,2,0,walk,0,18,completed,2025-10-19 07:15:00,2025-10-19 07:30:00,2025-10-19 11:50:00,260
bkg_t04_004,course_main,2025-10-26,08:30,4,1,cart,0,18,completed,2025-10-26 08:15:00,2025-10-26 08:30:00,2025-10-26 12:50:00,260
# Nov rounds (2)
bkg_t04_005,course_main,2025-11-08,08:00,2,0,cart,0,18,completed,2025-11-08 07:45:00,2025-11-08 08:00:00,2025-11-08 12:20:00,260
bkg_t04_006,course_main,2025-11-22,09:00,2,0,cart,0,18,completed,2025-11-22 08:45:00,2025-11-22 09:00:00,2025-11-22 13:15:00,255
# Dec round (1)
bkg_t04_007,course_main,2025-12-13,09:00,2,0,cart,0,18,completed,2025-12-13 08:45:00,2025-12-13 09:00:00,2025-12-13 13:10:00,250
# Jan 7 walkoff (played 7 of 18 holes -- short duration)
bkg_t04_008,course_main,2026-01-07,08:00,4,0,cart,0,18,completed,2026-01-07 07:45:00,2026-01-07 08:00:00,2026-01-07 10:05:00,125
# 3 Saturday waitlist failures
bkg_t04_009,course_main,2025-12-20,08:00,2,0,cart,0,18,waitlisted,,,,
bkg_t04_010,course_main,2025-12-27,08:00,2,0,cart,0,18,waitlisted,,,,
bkg_t04_011,course_main,2026-01-03,08:00,2,0,cart,0,18,waitlisted,,,,
# Today booking
bkg_t04_012,course_main,2026-04-09,07:08,2,0,cart,0,18,confirmed,,,,
```

**TTM_Tee_Sheet_Players_SV.csv rows:**

```
bp_bkg_t04_001_1,bkg_t04_001,mbr_t04,,0,1
bp_bkg_t04_002_1,bkg_t04_002,mbr_t04,,0,1
bp_bkg_t04_003_1,bkg_t04_003,mbr_t04,,0,1
bp_bkg_t04_004_1,bkg_t04_004,mbr_t04,,0,1
bp_bkg_t04_005_1,bkg_t04_005,mbr_t04,,0,1
bp_bkg_t04_006_1,bkg_t04_006,mbr_t04,,0,1
bp_bkg_t04_007_1,bkg_t04_007,mbr_t04,,0,1
bp_bkg_t04_008_1,bkg_t04_008,mbr_t04,,0,1
bp_bkg_t04_009_1,bkg_t04_009,mbr_t04,,0,1
bp_bkg_t04_010_1,bkg_t04_010,mbr_t04,,0,1
bp_bkg_t04_011_1,bkg_t04_011,mbr_t04,,0,1
bp_bkg_t04_012_1,bkg_t04_012,mbr_t04,,0,1
```

**Static data changes (src/data/*.js):**

| File | Field | Current | New | Why |
|------|-------|---------|-----|-----|
| members.js | atRiskMembers[3].memberId | mbr_089 | mbr_t04 | Align with CSV demo member ID |
| members.js | atRiskMembers[3].topRisk | 'Oct 4 rounds -> Nov 2 -> Dec 1 -- steady withdrawal' | 'Missed 3 Saturday waitlists, walked off Jan 7 after slow pace -- zero rounds since' | Per auditor 2 |
| members.js | atRiskMembers[3].duesAnnual | 12000 | 14000 | Match updated CSV |
| members.js | memberProfiles.mbr_089 key | mbr_089 | mbr_t04 | Align with CSV |

---

### Change 2: James Whitfield -- Complaint Date Fix + 42-min Ticket Time

**Source:** Auditor 1
**Impact:** GM sees consistent Jan 16 complaint date everywhere, with the visceral "42-min Grill Room wait, felt ignored" detail.

**CSV changes:**

| File | Row identifier | Column | Current value | New value | Why |
|------|---------------|--------|---------------|-----------|-----|
| JCM_Members_F9.csv | mbr_t01 | Date Joined | 2019-03-15 | 2019-03-15 | OK as-is (7-year member matches story) |
| JCM_Communications_RG.csv | fb_024 (mbr_203) | Member # | mbr_203 | mbr_t01 | Re-ID to demo member |
| JCM_Communications_RG.csv | fb_024 | Date | 2026-02-04 | 2026-01-16 | Story says complaint was Jan 16 |
| JCM_Communications_RG.csv | fb_024 | Type | staff_service | staff_service | OK |
| JCM_Communications_RG.csv | fb_024 | Subject | "Multiple members have mentioned..." | "42-minute wait for lunch at Grill Room. Server never checked on us. Felt ignored. Booth 12." | Specific, visceral complaint content |
| JCM_Communications_RG.csv | fb_024 | Happometer Score | -0.32 | -0.92 | Should be strongly negative for this complaint |
| JCM_Communications_RG.csv | fb_024 | Complete | in_progress | open | 9+ days with no resolution |
| POS_Sales_Detail_SV.csv | NEW row | -- | -- | Grill Room check on Jan 16, 42-min ticket time (First Fire to Last Fulfilled), Net Amount ~$28 | The bad-experience check with the 42-min wait |
| POS_Sales_Detail_SV.csv | NEW rows | -- | -- | 3-4 historical checks showing $47 avg, then the $28 decline check | Build the $47->$28 check decline |
| TTM_Tee_Sheet_SV.csv | NEW row | Date=today, Tee Time=08:00 | -- | Confirmed booking at 8:00 AM | "He has an 8:00 AM tee time this morning" |
| TTM_Tee_Sheet_SV.csv | NEW rows | -- | -- | Oct 4, Nov 3, Dec 2, Jan 1 round pattern | Match static data roundsTrend |

**Specific POS rows to add (POS_Sales_Detail_SV.csv):**

```
# Historical $47 avg checks
chk_t01_001,outlet_grill,mbr_t01,2025-11-15 12:00:00,2025-11-15 12:38:00,2025-11-15 12:08:00,2025-11-15 12:26:00,47,4.00,7.52,0,0,0,58.52,member_charge
chk_t01_002,outlet_grill,mbr_t01,2025-12-06 12:30:00,2025-12-06 13:08:00,2025-12-06 12:38:00,2025-12-06 12:56:00,48,4.08,7.68,0,0,0,59.76,member_charge
chk_t01_003,outlet_grill,mbr_t01,2025-12-20 11:45:00,2025-12-20 12:22:00,2025-12-20 11:53:00,2025-12-20 12:10:00,46,3.91,7.36,0,0,0,57.27,member_charge
# Jan 16 complaint check -- 42-min ticket time, $28 (the decline)
chk_t01_004,outlet_grill,mbr_t01,2026-01-16 11:30:00,2026-01-16 12:42:00,2026-01-16 11:38:00,2026-01-16 12:20:00,28,2.38,4.48,0,0,0,34.86,member_charge
```

Note: chk_t01_004 has First Fire 11:38 to Last Fulfilled 12:20 = 42 minutes ticket time.

**Specific tee sheet rows to add (TTM_Tee_Sheet_SV.csv):**

```
# Oct rounds (4)
bkg_t01_001,course_main,2025-10-05,08:00,4,0,cart,0,18,completed,2025-10-05 07:45:00,2025-10-05 08:00:00,2025-10-05 12:10:00,250
bkg_t01_002,course_main,2025-10-12,07:30,4,1,cart,0,18,completed,2025-10-12 07:15:00,2025-10-12 07:30:00,2025-10-12 11:40:00,250
bkg_t01_003,course_main,2025-10-19,08:00,2,0,walk,0,18,completed,2025-10-19 07:45:00,2025-10-19 08:00:00,2025-10-19 12:15:00,255
bkg_t01_004,course_main,2025-10-26,07:30,4,0,cart,0,18,completed,2025-10-26 07:15:00,2025-10-26 07:30:00,2025-10-26 11:45:00,255
# Nov rounds (3)
bkg_t01_005,course_main,2025-11-02,08:00,4,0,cart,0,18,completed,2025-11-02 07:45:00,2025-11-02 08:00:00,2025-11-02 12:10:00,250
bkg_t01_006,course_main,2025-11-15,07:30,2,0,walk,0,18,completed,2025-11-15 07:15:00,2025-11-15 07:30:00,2025-11-15 11:45:00,255
bkg_t01_007,course_main,2025-11-29,08:00,4,1,cart,0,18,completed,2025-11-29 07:45:00,2025-11-29 08:00:00,2025-11-29 12:15:00,255
# Dec rounds (2)
bkg_t01_008,course_main,2025-12-06,08:00,2,0,cart,0,18,completed,2025-12-06 07:45:00,2025-12-06 08:00:00,2025-12-06 12:10:00,250
bkg_t01_009,course_main,2025-12-20,07:30,4,0,cart,0,18,completed,2025-12-20 07:15:00,2025-12-20 07:30:00,2025-12-20 11:40:00,250
# Jan round (1) -- the complaint day
bkg_t01_010,course_main,2026-01-16,08:00,2,0,cart,0,18,completed,2026-01-16 07:45:00,2026-01-16 08:00:00,2026-01-16 12:20:00,260
# Today booking
bkg_t01_011,course_main,2026-04-09,08:00,4,0,cart,0,18,confirmed,,,,
```

**Static data changes (src/data/*.js):**

| File | Field | Current | New | Why |
|------|-------|---------|-----|-----|
| members.js | atRiskMembers[2].memberId | mbr_203 | mbr_t01 | Align with CSV |
| members.js | atRiskMembers[2].topRisk | 'Unresolved complaint Jan 18 -- service speed' | 'Unresolved complaint Jan 16 -- 42-min Grill Room wait, felt ignored' | Fix date + add detail |
| members.js | resignationScenarios[2].timeline[2].date | 'Jan 18' | 'Jan 16' | Date consistency |
| members.js | memberProfiles.mbr_203 key | mbr_203 | mbr_t01 | Align with CSV |
| cockpit.js | morningBriefing items | Verify Jan 16 reference | Confirm 'Jan 16 pace-of-play complaint' is consistent | Already says Jan 16 at line 15 |

---

### Change 3: Robert Callahan -- $3,020 F&B Minimum + Zero Golf Since Nov

**Source:** Auditor 3
**Impact:** GM sees a Corporate member methodically hitting his F&B minimum and stopping, with a 9-day unresolved complaint.

**CSV changes:**

| File | Row identifier | Column | Current value | New value | Why |
|------|---------------|--------|---------------|-----------|-----|
| JCM_Members_F9.csv | mbr_t05 | Membership Type | Full Golf | CORP | Story says Corporate tier |
| JCM_Members_F9.csv | mbr_t05 | Date Joined | 2018-04-22 | 2015-02-10 | Story says 11-year member |
| JCM_Members_F9.csv | mbr_t05 | Household ID | (empty) | hh_t05 | Enable Elizabeth (spouse) linkage |
| POS_Sales_Detail_SV.csv | NEW rows | -- | -- | Series of checks totaling exactly $3,020 Net Amount, spread Sep-Dec, with amounts getting smaller and more mechanical | Build the "hitting exact minimum" pattern |
| POS_Sales_Detail_SV.csv | NEW row | -- | -- | Final check ~$120, bringing running total to exactly $3,020 | The "hit the number and stopped" moment |
| TTM_Tee_Sheet_SV.csv | NEW rows | -- | -- | Oct 3, Nov 2 rounds; zero Dec, zero Jan | Match static roundsTrend but with "no golf since November" |
| TTM_Tee_Sheet_SV.csv | NEW row | Date=today, Tee Time=09:00 | -- | Confirmed booking at 9:00 AM | Story says 9:00 AM today |
| JCM_Communications_RG.csv | NEW row | -- | -- | mbr_t05, ~Jan 8, "my usual table was given away, no one apologized", Happometer -0.88, open, no resolution | The 9-day unresolved complaint |

**Specific POS rows to add (POS_Sales_Detail_SV.csv) -- building to $3,020 total:**

```
# Sep-Dec F&B spending pattern, amounts get mechanical
chk_t05_001,outlet_main_dining,mbr_t05,2025-09-12 19:00:00,2025-09-12 20:30:00,2025-09-12 19:10:00,2025-09-12 20:20:00,420,35.70,67.20,0,0,0,522.90,member_charge
chk_t05_002,outlet_main_dining,mbr_t05,2025-09-28 19:30:00,2025-09-28 21:00:00,2025-09-28 19:40:00,2025-09-28 20:50:00,380,32.30,60.80,0,0,0,473.10,member_charge
chk_t05_003,outlet_grill,mbr_t05,2025-10-10 12:00:00,2025-10-10 13:15:00,2025-10-10 12:10:00,2025-10-10 13:05:00,350,29.75,56.00,0,0,0,435.75,member_charge
chk_t05_004,outlet_main_dining,mbr_t05,2025-10-25 19:00:00,2025-10-25 20:45:00,2025-10-25 19:10:00,2025-10-25 20:35:00,390,33.15,62.40,0,0,0,485.55,member_charge
chk_t05_005,outlet_grill,mbr_t05,2025-11-08 12:30:00,2025-11-08 13:30:00,2025-11-08 12:40:00,2025-11-08 13:20:00,310,26.35,49.60,0,0,0,385.95,member_charge
chk_t05_006,outlet_main_dining,mbr_t05,2025-11-22 19:00:00,2025-11-22 20:30:00,2025-11-22 19:10:00,2025-11-22 20:20:00,340,28.90,54.40,0,0,0,423.30,member_charge
chk_t05_007,outlet_bar_lounge,mbr_t05,2025-12-06 17:00:00,2025-12-06 18:15:00,2025-12-06 17:10:00,2025-12-06 18:05:00,280,23.80,44.80,0,0,0,348.60,member_charge
chk_t05_008,outlet_grill,mbr_t05,2025-12-14 12:00:00,2025-12-14 13:00:00,2025-12-14 12:10:00,2025-12-14 12:50:00,230,19.55,36.80,0,0,0,286.35,member_charge
chk_t05_009,outlet_bar_lounge,mbr_t05,2025-12-28 16:00:00,2025-12-28 17:00:00,2025-12-28 16:10:00,2025-12-28 16:50:00,120,10.20,19.20,0,0,0,149.40,member_charge
# Sum: 420+380+350+390+310+340+280+230+120 = 2,820. Need 200 more.
chk_t05_010,outlet_bar_lounge,mbr_t05,2025-12-31 16:30:00,2025-12-31 17:15:00,2025-12-31 16:40:00,2025-12-31 17:05:00,200,17.00,32.00,0,0,0,249.00,member_charge
# Sum: 3,020. Then NOTHING after Dec 31.
```

**Tee sheet rows (TTM_Tee_Sheet_SV.csv):**

```
# Oct rounds (3)
bkg_t05_001,course_main,2025-10-04,09:00,4,1,cart,0,18,completed,2025-10-04 08:45:00,2025-10-04 09:00:00,2025-10-04 13:10:00,250
bkg_t05_002,course_main,2025-10-18,08:30,2,0,cart,0,18,completed,2025-10-18 08:15:00,2025-10-18 08:30:00,2025-10-18 12:40:00,250
bkg_t05_003,course_main,2025-10-25,09:00,4,1,cart,0,18,completed,2025-10-25 08:45:00,2025-10-25 09:00:00,2025-10-25 13:15:00,255
# Nov rounds (2) -- last golf
bkg_t05_004,course_main,2025-11-01,08:30,4,0,cart,0,18,completed,2025-11-01 08:15:00,2025-11-01 08:30:00,2025-11-01 12:45:00,255
bkg_t05_005,course_main,2025-11-15,09:00,2,0,cart,0,18,completed,2025-11-15 08:45:00,2025-11-15 09:00:00,2025-11-15 13:10:00,250
# Dec: ZERO rounds -- no golf since November
# Jan: ZERO rounds
# Today booking
bkg_t05_006,course_main,2026-04-09,09:00,2,0,cart,0,18,confirmed,,,,
```

**Communication row (JCM_Communications_RG.csv):**

```
fb_t05_001,mbr_t05,2026-01-08 00:00:00,dining,-0.88,My usual table was given away to a walk-in. No one apologized or offered an alternative. Very disappointing after 11 years.,open,
```

**Static data changes:**

| File | Field | Current | New | Why |
|------|-------|---------|-----|-----|
| members.js | atRiskMembers[4].memberId | mbr_271 | mbr_t05 | Align with CSV |
| members.js | atRiskMembers[4].topRisk | 'Hitting exact F&B minimum; no golf since November' | 'Hitting exact $3,020 F&B minimum then stopping; 9-day complaint unresolved; no golf since Nov' | Add dollar specificity |
| members.js | memberProfiles.mbr_271 key | mbr_271 | mbr_t05 | Align with CSV |
| members.js | memberProfiles.mbr_271.riskSignals[0].label | 'Complaint aging 9 days' | 'Complaint aging 9 days -- "my usual table was given away, no one apologized"' | Make complaint specific |

---

### Change 4: Sandra Chen -- Create Member + Dining Cliff + Declined Events

**Source:** Auditor 6
**Impact:** GM sees a Social Butterfly whose dining spend crashed from $142 to $18, with 3 declined event invites.

**CSV changes:**

| File | Row identifier | Column | Current value | New value | Why |
|------|---------------|--------|---------------|-----------|-----|
| JCM_Members_F9.csv | NEW row (mbr_t06) | -- | -- | mbr_t06,0,Sandra,Chen,sandra.c@email.com,480-555-0106,,,House,active,2020-06-15,,,9000,0,,1 | Create the member |
| POS_Sales_Detail_SV.csv | NEW rows | -- | -- | 4-5 historical checks at ~$142 avg, then one final $18 check | Build the $142->$18 cliff |
| CHO_Email_Events_SV.csv | NEW rows | -- | -- | 3 event invite emails sent, zero opens/clicks | "Declined 3 consecutive event invites" |

**Specific POS rows (POS_Sales_Detail_SV.csv):**

```
# Historical $142 avg dining
chk_t06_001,outlet_main_dining,mbr_t06,2025-10-05 19:00:00,2025-10-05 20:45:00,2025-10-05 19:10:00,2025-10-05 20:35:00,145,12.33,23.20,0,0,0,180.53,member_charge
chk_t06_002,outlet_main_dining,mbr_t06,2025-10-19 19:30:00,2025-10-19 21:00:00,2025-10-19 19:40:00,2025-10-19 20:50:00,138,11.73,22.08,0,0,0,171.81,member_charge
chk_t06_003,outlet_main_dining,mbr_t06,2025-11-08 19:00:00,2025-11-08 20:30:00,2025-11-08 19:10:00,2025-11-08 20:20:00,142,12.07,22.72,0,0,0,176.79,member_charge
chk_t06_004,outlet_main_dining,mbr_t06,2025-11-22 19:30:00,2025-11-22 21:00:00,2025-11-22 19:40:00,2025-11-22 20:50:00,143,12.16,22.88,0,0,0,178.04,member_charge
# The cliff -- $18 last visit
chk_t06_005,outlet_bar_lounge,mbr_t06,2025-12-15 12:00:00,2025-12-15 12:25:00,2025-12-15 12:08:00,2025-12-15 12:18:00,18,1.53,2.88,0,0,0,22.41,cash
```

**Email event rows (CHO_Email_Events_SV.csv):**

```
# 3 event invites -- all sent, zero opens
ee_t06_001,camp_event_jan,mbr_t06,sent,2026-01-05 00:00:00,,
ee_t06_002,camp_event_jan2,mbr_t06,sent,2026-01-12 00:00:00,,
ee_t06_003,camp_event_feb,mbr_t06,sent,2026-02-01 00:00:00,,
```

**Static data changes:**

| File | Field | Current | New | Why |
|------|-------|---------|-----|-----|
| members.js | atRiskMembers[5].memberId | mbr_146 | mbr_t06 | Align with CSV |
| members.js | memberProfiles.mbr_146 key | mbr_146 | mbr_t06 | Align with CSV |

---

### Change 5: Kevin Hurst -- Round Decline + Email Open Rate Crash

**Source:** Auditor 4
**Impact:** GM sees the cautionary tale: 14->8->0 round decline and email engagement falling off a cliff, culminating in Jan 8 resignation.

**CSV changes:**

| File | Row identifier | Column | Current value | New value | Why |
|------|---------------|--------|---------------|-----------|-----|
| JCM_Members_F9.csv | mbr_t03 | Status | active | resigned | Story says resigned Jan 8 |
| JCM_Members_F9.csv | mbr_t03 | Date Resigned | (empty) | 2026-01-08 | Resignation date |
| TTM_Tee_Sheet_SV.csv | NEW rows | -- | -- | ~14 rounds in Oct-early Nov period, ~8 in Nov-early Dec, then zero | 14->8->0 decline arc |
| CHO_Email_Events_SV.csv | mbr_t03 rows | -- | -- | Early: high open rate (6/8 opened). Late: zero opens (0/6 sent) | Email decay pattern |

**Note:** The existing email data for mbr_042 (the wrong ID) actually shows some opens early then trailing off. New rows for mbr_t03 should follow the same pattern but more dramatically:

**Email rows (CHO_Email_Events_SV.csv):**

```
# Oct: high engagement (4 sent, 3 opened)
ee_t03_001,camp_001,mbr_t03,sent,2025-10-01 00:00:00,,
ee_t03_002,camp_001,mbr_t03,opened,2025-10-01 00:00:00,,mobile
ee_t03_003,camp_002,mbr_t03,sent,2025-10-08 00:00:00,,
ee_t03_004,camp_002,mbr_t03,opened,2025-10-09 00:00:00,,desktop
ee_t03_005,camp_003,mbr_t03,sent,2025-10-15 00:00:00,,
ee_t03_006,camp_003,mbr_t03,opened,2025-10-15 00:00:00,,mobile
ee_t03_007,camp_004,mbr_t03,sent,2025-10-22 00:00:00,,
# Nov: declining (4 sent, 1 opened)
ee_t03_008,camp_005,mbr_t03,sent,2025-11-01 00:00:00,,
ee_t03_009,camp_005,mbr_t03,opened,2025-11-02 00:00:00,,mobile
ee_t03_010,camp_006,mbr_t03,sent,2025-11-08 00:00:00,,
ee_t03_011,camp_007,mbr_t03,sent,2025-11-15 00:00:00,,
ee_t03_012,camp_008,mbr_t03,sent,2025-11-22 00:00:00,,
# Dec: zero engagement (4 sent, 0 opened)
ee_t03_013,camp_009,mbr_t03,sent,2025-12-01 00:00:00,,
ee_t03_014,camp_010,mbr_t03,sent,2025-12-08 00:00:00,,
ee_t03_015,camp_011,mbr_t03,sent,2025-12-15 00:00:00,,
ee_t03_016,camp_012,mbr_t03,sent,2025-12-22 00:00:00,,
# Jan: zero (2 sent before resignation, 0 opened)
ee_t03_017,camp_013,mbr_t03,sent,2026-01-01 00:00:00,,
ee_t03_018,camp_014,mbr_t03,sent,2026-01-06 00:00:00,,
```

**Static data changes:**

| File | Field | Current | New | Why |
|------|-------|---------|-----|-----|
| members.js | atRiskMembers[0].memberId | mbr_042 | mbr_t03 | Align with CSV |
| members.js | resignationScenarios[0].memberId | mbr_042 | mbr_t03 | Align with CSV |
| members.js | atRiskMembers[0].topRisk | 'Zero activity since December; email decay since November' | 'Resigned Jan 8 after zero activity since December -- $72K lifetime value lost. 8-week intervention window was missed.' | Per auditor 4 |

---

### Change 6: Linda Leonard -- Create Member + Ghost Profile

**Source:** Auditor 5
**Impact:** GM sees the second cautionary tale: a ghost member whose household is disengaging.

**CSV changes:**

| File | Row identifier | Column | Current value | New value | Why |
|------|---------------|--------|---------------|-----------|-----|
| JCM_Members_F9.csv | NEW row (mbr_t07) | -- | -- | mbr_t07,0,Linda,Leonard,linda.l@email.com,480-555-0107,,,Full Golf,resigned,2019-05-20,2026-01-15,hh_t07,18000,0,,1 | Create member with resignation |
| JCM_Members_F9.csv | NEW row (mbr_t07b) | -- | -- | mbr_t07b,0,Richard,Leonard,richard.l@email.com,480-555-0108,,,Full Golf,active,2019-05-20,,hh_t07,18000,0,,1 | Husband Richard -- household link |
| TTM_Tee_Sheet_SV.csv | NEW rows | -- | -- | 1 Oct round, then zero Nov/Dec/Jan | Match the "last visit October" story |
| JCM_Aged_Receivables_SV.csv | NEW rows | -- | -- | Dues-only billing, no F&B charges since Oct | "Dues-only member 3+ months" |

**Static data changes:**

| File | Field | Current | New | Why |
|------|-------|---------|-----|-----|
| members.js | atRiskMembers[1].memberId | mbr_117 | mbr_t07 | Align with CSV |
| members.js | resignationScenarios[1].memberId | mbr_117 | mbr_t07 | Align with CSV |
| members.js | atRiskMembers[1].topRisk | 'Last visit October; dues-only member' | 'Last visit October; dues-only member for 90+ days. Husband Richard also disengaged -- household at risk.' | Per auditor 5 |
| members.js | resignationScenarios[1].missedIntervention | current text | Add household link to Richard | Per auditor 5 |

---

### Change 7: Robert Mills -- Create Member + Slow-Play Complaints

**Source:** Auditor 7
**Impact:** GM sees a 12-year advocate member who reported slow play twice with no response.

**CSV changes:**

| File | Row identifier | Column | Current value | New value | Why |
|------|---------------|--------|---------------|-----------|-----|
| JCM_Members_F9.csv | NEW row (mbr_t08) | -- | -- | mbr_t08,0,Robert,Mills,robert.m@email.com,480-555-0109,,,Full Golf,active,2014-06-10,,hh_t08,18000,0,,1 | Create 12-year member |
| JCM_Communications_RG.csv | NEW row | -- | -- | fb_t08_001,mbr_t08,2026-01-05,pace_of_play,-0.65,Slow play on holes 9-10 again. Waited 15 minutes on the 10th tee. No marshal in sight.,open, | First slow-play report |
| JCM_Communications_RG.csv | NEW row | -- | -- | fb_t08_002,mbr_t08,2026-01-11,pace_of_play,-0.78,Same issue as last week. Holes 9 and 10 backed up. I called the pro shop -- no answer. Very frustrating.,open, | Second slow-play report |
| TTM_Tee_Sheet_SV.csv | NEW rows | -- | -- | Oct 3, Nov 2, Dec 1, Jan 0 completed rounds + driving range visits | "Practicing but skipping clubhouse" |
| POS_Sales_Detail_SV.csv | Historical rows | -- | -- | Post-round dining checks in Oct-Nov, then zero after Dec | "Skipping post-round dining" |

**Static data changes:**

| File | Field | Current | New | Why |
|------|-------|---------|-----|-----|
| members.js | atRiskMembers[6].memberId | mbr_312 | mbr_t08 | Align with CSV |
| members.js | memberProfiles.mbr_312 key | mbr_312 | mbr_t08 | Align with CSV |
| members.js | atRiskMembers[6].topRisk | 'Practicing but skipping clubhouse spend; slow-play complaints unresolved' | 'Reported slow-play issue twice (Jan 5, Jan 11) -- no marshal response either time. Now practicing alone, skipping clubhouse entirely. 12-year member going silent.' | Per auditor 7 |

---

### Change 8: Revenue Fix -- pace.js revenueLostPerMonth

**Source:** Auditor cross-domain analysis
**Impact:** The cockpit and revenue pages show realistic $5,760/mo pace loss instead of inflated $20,708.

**CSV changes:** None -- this is purely static data.

**Static data changes:**

| File | Field | Current | New | Why |
|------|-------|---------|-----|-----|
| pace.js | paceFBImpact.revenueLostPerMonth | 20708 | 5760 | Match operationsService DEFAULT_PACE_FB_IMPACT; $20K/mo is unrealistic for slow-play loss at a single club |
| pace.js | paceFBImpact.slowRoundsPerMonth | 668 | 640 | Consistent with $9/round loss ($5,760 / 640 = $9/round) vs current $31/round |
| pace.js | paceFBImpact.avgCheckSlow | 28.50 | 25.20 | Tighter gap: fast $34.20 - slow $25.20 = $9/round differential (realistic) |

**Downstream impact trace:**

| Consumer | File | What changes | Effect |
|---|---|---|---|
| StaffingTab | src/features/service/tabs/StaffingTab.jsx:125 | Reads `paceFB.revenueLostPerMonth` | Will show "$5,760/mo" instead of "$20,708/mo" |
| IntegrationsPage | src/features/integrations/IntegrationsPage.jsx:153 | Falls back to 5760 already | No change (already uses correct default) |
| revenueService | src/services/revenueService.js:62 | Reads `paceFB.revenueLostPerMonth` for PACE_LOSS | Revenue leak calculation uses $5,760 |
| revenueService | src/services/revenueService.js:96-97 | Computes per-round loss | Will show ~$9/round instead of ~$31/round |
| operationsService | src/services/operationsService.js:106 | DEFAULT already 5760 | No change in guided mode; static fallback now matches |
| DataImportBanner | src/components/ui/DataImportBanner.jsx | Does NOT read pace data directly | No impact |
| cockpit.js | src/data/cockpit.js | Does not reference pace numbers | No impact -- cockpit references are narrative text |

---

### Change 9: JCM_Members_F9.csv -- Fix mbr_t* Row Quality

**Source:** Data integrity audit
**Impact:** All demo members have complete, realistic profiles instead of placeholder data.

**CSV changes:**

| File | Row identifier | Column | Current value | New value | Why |
|------|---------------|--------|---------------|-----------|-----|
| JCM_Members_F9.csv | mbr_t01 (Whitfield) | Member Number | 0 | 501 | Needs a realistic member number |
| JCM_Members_F9.csv | mbr_t01 | Birthday | (empty) | 1978-06-14 | Story says 47-year-old |
| JCM_Members_F9.csv | mbr_t01 | Sex | (empty) | M | James is male |
| JCM_Members_F9.csv | mbr_t01 | Membership Type | Full Golf | FG | Use code matching other rows |
| JCM_Members_F9.csv | mbr_t01 | Household ID | (empty) | hh_t01 | Enable Erin/Logan family link |
| JCM_Members_F9.csv | mbr_t03 (Hurst) | Member Number | 0 | 503 | Realistic member number |
| JCM_Members_F9.csv | mbr_t03 | Birthday | (empty) | 1970-03-22 | Needs a birthday |
| JCM_Members_F9.csv | mbr_t03 | Sex | (empty) | M | Kevin is male |
| JCM_Members_F9.csv | mbr_t03 | Membership Type | Full Golf | FG | Use code matching other rows |
| JCM_Members_F9.csv | mbr_t04 (Jordan) | Member Number | 0 | 504 | Realistic member number |
| JCM_Members_F9.csv | mbr_t04 | Birthday | (empty) | 1972-09-18 | Needs a birthday |
| JCM_Members_F9.csv | mbr_t04 | Sex | (empty) | F | Anne is female |
| JCM_Members_F9.csv | mbr_t05 (Callahan) | Member Number | 0 | 505 | Realistic member number |
| JCM_Members_F9.csv | mbr_t05 | Birthday | (empty) | 1968-11-30 | Needs a birthday |
| JCM_Members_F9.csv | mbr_t05 | Sex | (empty) | M | Robert is male |

---

### Change 10: Whitfield POS Line Items -- Build the 42-min Story

**Source:** Auditor 1
**Impact:** When drilling into the Jan 16 check, the line items tell the story of a frustrated lunch.

**CSV changes (POS_Line_Items_SV.csv):**

```
# Historical checks -- normal $47 meals
li_t01_001,chk_t01_001,Club Sandwich,food,16,1,16,0,0,2025-11-15T12:08:00.000Z
li_t01_002,chk_t01_001,Iced Tea,beverage,5,1,5,0,0,2025-11-15T12:08:00.000Z
li_t01_003,chk_t01_001,French Onion Soup,food,14,1,14,0,0,2025-11-15T12:11:00.000Z
li_t01_004,chk_t01_001,Coors Light Draft,beverage,7,1,7,0,0,2025-11-15T12:14:00.000Z
li_t01_005,chk_t01_001,Key Lime Pie,food,5,1,5,0,0,2025-11-15T12:20:00.000Z
# Jan 16 complaint check -- shorter order, no dessert (left frustrated)
li_t01_010,chk_t01_004,Club Sandwich,food,16,1,16,0,0,2026-01-16T11:38:00.000Z
li_t01_011,chk_t01_004,Iced Tea,beverage,5,1,5,0,0,2026-01-16T11:38:00.000Z
li_t01_012,chk_t01_004,Coors Light Draft,beverage,7,1,7,0,0,2026-01-16T12:00:00.000Z
```

---

### Change 11: Callahan POS Line Items -- Mechanical Minimum Spending

**Source:** Auditor 3
**Impact:** Line items show the pattern shifting from entertainment-quality dining to bare-minimum "obligation" orders.

**CSV changes (POS_Line_Items_SV.csv):**

```
# Early checks: entertaining clients (full dinners with wine)
li_t05_001,chk_t05_001,Filet Mignon,food,52,2,104,0,0,2025-09-12T19:10:00.000Z
li_t05_002,chk_t05_001,Cabernet Sauvignon Bottle,beverage,85,1,85,0,0,2025-09-12T19:10:00.000Z
li_t05_003,chk_t05_001,Lobster Tail,food,48,2,96,0,0,2025-09-12T19:15:00.000Z
li_t05_004,chk_t05_001,Creme Brulee,food,14,3,42,0,0,2025-09-12T19:50:00.000Z
li_t05_005,chk_t05_001,Espresso,beverage,6,3,18,0,0,2025-09-12T20:05:00.000Z
# Late checks: bare minimum (bar tab only)
li_t05_020,chk_t05_009,Coors Light Draft,beverage,7,2,14,0,0,2025-12-28T16:10:00.000Z
li_t05_021,chk_t05_009,Nachos,food,16,1,16,0,0,2025-12-28T16:15:00.000Z
li_t05_022,chk_t05_009,Ranch Water,beverage,12,1,12,0,0,2025-12-28T16:20:00.000Z
li_t05_023,chk_t05_010,Hot Dog,food,9,1,9,0,0,2025-12-31T16:40:00.000Z
li_t05_024,chk_t05_010,Michelob Ultra,beverage,7,2,14,0,0,2025-12-31T16:45:00.000Z
li_t05_025,chk_t05_010,Wedge Salad,food,14,1,14,0,0,2025-12-31T16:50:00.000Z
```

---

### Change 12: Chen POS Line Items -- The $142 to $18 Cliff

**Source:** Auditor 6
**Impact:** Line items show a wine-dinner regular ordering a single side salad on her last visit.

**CSV changes (POS_Line_Items_SV.csv):**

```
# Historical: full wine dinner ($142 avg)
li_t06_001,chk_t06_001,Grilled Salmon,food,28,1,28,0,0,2025-10-05T19:10:00.000Z
li_t06_002,chk_t06_001,Chardonnay Glass,beverage,14,2,28,0,0,2025-10-05T19:10:00.000Z
li_t06_003,chk_t06_001,Charcuterie Board,food,24,1,24,0,0,2025-10-05T19:15:00.000Z
li_t06_004,chk_t06_001,Tiramisu,food,12,1,12,0,0,2025-10-05T20:00:00.000Z
li_t06_005,chk_t06_001,Espresso,beverage,6,1,6,0,0,2025-10-05T20:10:00.000Z
li_t06_006,chk_t06_001,Pinot Grigio Glass,beverage,14,1,14,0,0,2025-10-05T19:40:00.000Z
# The cliff: $18 last visit -- just a salad
li_t06_020,chk_t06_005,Garden Salad,food,12,1,12,0,0,2025-12-15T12:08:00.000Z
li_t06_021,chk_t06_005,Iced Tea,beverage,5,1,5,0,0,2025-12-15T12:08:00.000Z
# Note: chk_t06_005 Net Amount should be 18 (but earlier listed as 18, so items = 12+5=17, adjust salad to 13)
```

---

### Change 13: Hurst Tee Sheet -- 14 to 8 to 0 Round Decline

**Source:** Auditor 4
**Impact:** The cautionary-tale data shows unmistakable disengagement over 3 months.

**CSV changes (TTM_Tee_Sheet_SV.csv) -- abbreviated, 14+8 = 22 rows:**

```
# Oct: 14 rounds (mix of 18-hole and 9-hole to hit 14)
bkg_t03_001,course_main,2025-10-01,07:00,4,0,cart,0,18,completed,...
bkg_t03_002,course_main,2025-10-02,14:00,2,0,cart,0,9,completed,...
bkg_t03_003,course_main,2025-10-04,08:00,4,1,cart,0,18,completed,...
bkg_t03_004,course_main,2025-10-06,07:30,2,0,walk,0,18,completed,...
bkg_t03_005,course_main,2025-10-08,14:00,2,0,cart,0,9,completed,...
bkg_t03_006,course_main,2025-10-11,07:00,4,0,cart,0,18,completed,...
bkg_t03_007,course_main,2025-10-13,07:30,4,1,cart,0,18,completed,...
bkg_t03_008,course_main,2025-10-15,14:30,2,0,cart,0,9,completed,...
bkg_t03_009,course_main,2025-10-18,08:00,4,0,cart,0,18,completed,...
bkg_t03_010,course_main,2025-10-20,07:00,2,0,walk,0,18,completed,...
bkg_t03_011,course_main,2025-10-22,14:00,2,0,cart,0,9,completed,...
bkg_t03_012,course_main,2025-10-25,07:30,4,1,cart,0,18,completed,...
bkg_t03_013,course_main,2025-10-27,07:00,2,0,walk,0,18,completed,...
bkg_t03_014,course_main,2025-10-30,14:00,2,0,cart,0,9,completed,...
# Nov: 8 rounds
bkg_t03_015,course_main,2025-11-01,08:00,4,0,cart,0,18,completed,...
bkg_t03_016,course_main,2025-11-04,07:30,2,0,walk,0,18,completed,...
bkg_t03_017,course_main,2025-11-08,07:00,4,1,cart,0,18,completed,...
bkg_t03_018,course_main,2025-11-11,14:00,2,0,cart,0,9,completed,...
bkg_t03_019,course_main,2025-11-15,08:00,4,0,cart,0,18,completed,...
bkg_t03_020,course_main,2025-11-19,07:30,2,0,walk,0,18,completed,...
bkg_t03_021,course_main,2025-11-22,07:00,4,0,cart,0,18,completed,...
bkg_t03_022,course_main,2025-11-26,14:00,2,0,cart,0,9,completed,...
# Dec: 0 rounds -- complete dropout
# Jan: 0 rounds -- resigned Jan 8
```

**Note:** Full timestamp/duration details for each row should follow the pattern of existing data (check-in 15-30 min before tee time, 18-hole ~250 min, 9-hole ~150 min).

---

### Change 14: Billing Data for Demo Members

**Source:** Data completeness
**Impact:** Aged receivables show continuous dues billing, supporting the "paying but not using" narrative for ghosts.

**CSV changes (JCM_Aged_Receivables_SV.csv):**

```
# Linda Leonard -- dues-only, no other charges
INV-mbr_t07-DUES-2025-Q3,mbr_t07,2025-07-01,2025-07-31,4500,dues,FG Membership Dues - 2025-Q3,paid,2025-07-28,4500,0,0
INV-mbr_t07-DUES-2025-Q4,mbr_t07,2025-10-01,2025-10-31,4500,dues,FG Membership Dues - 2025-Q4,paid,2025-10-30,4500,0,0
INV-mbr_t07-DUES-2026-Q1,mbr_t07,2026-01-01,2026-01-31,4500,dues,FG Membership Dues - 2026-Q1,30_day,,,31,75

# Robert Callahan -- current on dues
INV-mbr_t05-DUES-2025-Q3,mbr_t05,2025-07-01,2025-07-31,4500,dues,FG Membership Dues - 2025-Q3,paid,2025-07-15,4500,0,0
INV-mbr_t05-DUES-2025-Q4,mbr_t05,2025-10-01,2025-10-31,4500,dues,FG Membership Dues - 2025-Q4,paid,2025-10-20,4500,0,0
INV-mbr_t05-DUES-2026-Q1,mbr_t05,2026-01-01,2026-01-31,4500,dues,FG Membership Dues - 2026-Q1,paid,2026-01-25,4500,0,0

# Sandra Chen -- late payer pattern
INV-mbr_t06-DUES-2025-Q3,mbr_t06,2025-07-01,2025-07-31,2250,dues,HSE Membership Dues - 2025-Q3,paid,2025-08-15,2250,15,25
INV-mbr_t06-DUES-2025-Q4,mbr_t06,2025-10-01,2025-10-31,2250,dues,HSE Membership Dues - 2025-Q4,paid,2025-11-18,2250,18,25
INV-mbr_t06-DUES-2026-Q1,mbr_t06,2026-01-01,2026-01-31,2250,dues,HSE Membership Dues - 2026-Q1,30_day,,,40,50
```

---

### Change 15: Static Data Member ID Alignment (All Files)

**Source:** Architecture fix
**Impact:** Every file that references demo members uses consistent `mbr_t*` IDs.

**Static data changes (src/data/*.js) -- complete ID migration:**

| File | Find | Replace | Count |
|------|------|---------|-------|
| members.js | mbr_042 | mbr_t03 | all occurrences (Kevin Hurst) |
| members.js | mbr_089 | mbr_t04 | all occurrences (Anne Jordan) |
| members.js | mbr_117 | mbr_t07 | all occurrences (Linda Leonard) |
| members.js | mbr_146 | mbr_t06 | all occurrences (Sandra Chen) |
| members.js | mbr_203 | mbr_t01 | all occurrences (James Whitfield) |
| members.js | mbr_271 | mbr_t05 | all occurrences (Robert Callahan) |
| members.js | mbr_312 | mbr_t08 | all occurrences (Robert Mills) |
| cockpit.js | mbr_203 or mbr_089 etc. | mbr_t01 or mbr_t04 etc. | any demo member refs |
| teeSheet.js | any demo member refs | mbr_t* equivalents | if present |
| agents.js | any demo member refs | mbr_t* equivalents | if present |
| boardReport.js | any demo member refs | mbr_t* equivalents | if present |
| email.js | any demo member refs | mbr_t* equivalents | if present |
| pipeline.js | any demo member refs | mbr_t* equivalents | if present |

---

## Priority Summary (Top 15 Changes)

| Rank | Change | Member | Files touched | Effort |
|------|--------|--------|--------------|--------|
| 1 | Member ID alignment (mbr_* -> mbr_t*) | ALL | members.js + 6 other src/data files | Medium -- find-replace |
| 2 | Whitfield complaint date fix + 42-min story | James Whitfield | JCM_Communications_RG, POS_Sales_Detail, POS_Line_Items, TTM_Tee_Sheet, members.js | High |
| 3 | Callahan $3,020 F&B minimum pattern | Robert Callahan | POS_Sales_Detail, POS_Line_Items, TTM_Tee_Sheet, JCM_Communications_RG, members.js | High |
| 4 | Jordan round decline + walkoff + today booking | Anne Jordan | JCM_Members_F9, TTM_Tee_Sheet, TTM_Tee_Sheet_Players, members.js | High |
| 5 | Hurst 14-8-0 decline + email crash + resignation | Kevin Hurst | JCM_Members_F9, TTM_Tee_Sheet, CHO_Email_Events, members.js | High |
| 6 | Chen dining cliff + declined events | Sandra Chen | JCM_Members_F9 (new), POS_Sales_Detail, POS_Line_Items, CHO_Email_Events, members.js | High |
| 7 | Leonard ghost member creation + household | Linda Leonard | JCM_Members_F9 (new x2), TTM_Tee_Sheet, JCM_Aged_Receivables, members.js | Medium |
| 8 | Mills creation + slow-play complaints | Robert Mills | JCM_Members_F9 (new), JCM_Communications_RG, TTM_Tee_Sheet, POS_Sales_Detail, members.js | Medium |
| 9 | pace.js revenue fix (20708 -> 5760) | N/A | pace.js | Low -- 3 field changes |
| 10 | mbr_t* row quality (birthday, sex, member#) | ALL mbr_t* | JCM_Members_F9 | Low |
| 11 | Whitfield POS line items (42-min story) | James Whitfield | POS_Line_Items_SV | Low |
| 12 | Callahan POS line items (mechanical minimum) | Robert Callahan | POS_Line_Items_SV | Low |
| 13 | Chen POS line items ($142->$18 cliff) | Sandra Chen | POS_Line_Items_SV | Low |
| 14 | Billing data for demo members | Callahan, Leonard, Chen | JCM_Aged_Receivables_SV | Low |
| 15 | Today tee time bookings for active at-risk | Jordan, Whitfield, Callahan | TTM_Tee_Sheet_SV | Low |

---

## Files Touched Summary

| CSV File | Rows Added | Rows Modified |
|---|---|---|
| JCM_Members_F9.csv | 4 new (Chen, Leonard x2, Mills) | 5 modified (mbr_t01-t05) |
| TTM_Tee_Sheet_SV.csv | ~55 new bookings | 0 |
| TTM_Tee_Sheet_Players_SV.csv | ~55 new player entries | 0 |
| POS_Sales_Detail_SV.csv | ~25 new checks | 0 |
| POS_Line_Items_SV.csv | ~30 new line items | 0 |
| CHO_Email_Events_SV.csv | ~21 new email events | 0 |
| JCM_Communications_RG.csv | 3 new complaints | 1 modified (fb_024) |
| JCM_Aged_Receivables_SV.csv | ~9 new invoices | 0 |
| 7shifts_Staff_Shifts.csv | 0 | 0 |
| JCM_Club_Profile.csv | 0 | 0 |

| Static File | Changes |
|---|---|
| src/data/members.js | 7 ID renames, 7 topRisk rewrites, 2 new member profiles |
| src/data/pace.js | 3 field value changes |
| src/data/cockpit.js | Verify ID references |
| src/data/boardReport.js | Verify ID references |
| src/data/teeSheet.js | Verify ID references |
| src/data/agents.js | Verify ID references |
| src/data/email.js | Verify ID references |
| src/data/pipeline.js | Verify ID references |
