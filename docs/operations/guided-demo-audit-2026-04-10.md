# Guided Demo Flow Audit — 2026-04-10

Comprehensive audit of every page/surface for data consistency in guided demo mode.
Excludes the 3 known bugs (weather icon/temp mismatch, profiles showing ungated handicap/dining, member count 300 vs 250) which are marked as fix-in-progress.

---

## Summary

| Category | P0 | P1 | P2 | Total |
|----------|----|----|----|----|
| A. Data from unconnected sources | 2 | 2 | 1 | 5 |
| B. Count mismatches | 2 | 1 | 0 | 3 |
| C. Temporal inconsistencies | 2 | 2 | 1 | 5 |
| D. Dollar figure reconciliation | 1 | 2 | 0 | 3 |
| E. Member identity consistency | 3 | 2 | 1 | 6 |
| F. Status/badge consistency | 1 | 2 | 0 | 3 |
| **Total** | **11** | **11** | **3** | **25** |

---

## Findings

### A. Data from Unconnected Sources

| # | Surface/Component | What's wrong | Files involved | Severity |
|---|---|---|---|---|
| A1 | Pace-of-play (Revenue, Service/StaffingTab, TodayView) | `shouldUseStatic('pace')` is checked by operationsService but **no gateId 'pace' exists** in demoSources.js. Pace distribution, bottleneck holes, and slow-round stats never appear in guided mode even after all files are imported. | `src/services/operationsService.js:141,158,176` `src/config/demoSources.js` | **P0** |
| A2 | Cockpit priority items | Cockpit items require `shouldUseStatic('agents')` gate, but importing all demo files does not open an 'agents' gate (it's in ALL_SOURCE_IDS but no file has gateId 'agents'). Priority items never show in guided mode. | `src/services/cockpitService.js:46` `src/config/demoSources.js:56` | **P0** |
| A3 | Location Intelligence page | `locationMembers` data in location.js is not gated behind any specific import. 47 members with GPS coordinates, health scores, and zone data would appear as soon as any page renders it regardless of which files are imported. | `src/data/location.js` | **P1** |
| A4 | Pipeline/warm leads | `warmLeads` data references members and guest spending but the pipeline gate (`gateId: 'pipeline'`) is tied to Club Profile import — warm leads showing guest golf rounds and dining spend before tee-sheet or POS files are imported. | `src/data/pipeline.js` `src/services/pipelineService.js` | **P1** |
| A5 | CohortTab new member onboarding | CohortTab.jsx contains hardcoded new member data (including James Whitfield, Michael Torres) that is not gated behind any demo source. Shows regardless of import state. | `src/features/member-health/tabs/CohortTab.jsx:4-11` | **P2** |

### B. Count Mismatches

| # | Surface/Component | What's wrong | Files involved | Severity |
|---|---|---|---|---|
| B1 | Briefing roundsToday vs teeSheetSummary | Dynamic briefing build sets `roundsToday: teeSheet.length` which returns **20** (number of tee time groups), but `teeSheetSummary.totalRounds` is **220** (individual rounds). The briefing DEMO_BRIEFING fallback also says 220. When tee-sheet gate is open, Today page shows "20 rounds" instead of "220 rounds". | `src/services/briefingService.js:217` `src/data/teeSheet.js:155` | **P0** |
| B2 | Monthly revenue: three conflicting values | `getMonthlyRevenueSummary()` always returns `{ total: 0 }` in demo mode (no API data, no static computation). DEMO_BRIEFING hardcodes $168,000. Actual sum of dailyRevenue data = **$375,200**. Three different answers depending on code path. | `src/services/operationsService.js:132-135` `src/services/briefingService.js:114,277` `src/data/revenue.js` | **P0** |
| B3 | Cockpit stakes: "$84,000 combined annual dues" | Cockpit item #3 claims $84,000 combined dues for 3 at-risk members (Whitfield $18K + Jordan $12K + Callahan $18K). Actual sum = **$48,000**. | `src/data/cockpit.js:95` `src/data/members.js:54-56` | **P1** |

### C. Temporal Inconsistencies

| # | Surface/Component | What's wrong | Files involved | Severity |
|---|---|---|---|---|
| C1 | Whitfield complaint date: 3 conflicting dates | Activity timeline says **Jan 16**, feedbackRecords says **Jan 18**, cockpit says **"6 days ago"** (= Jan 11 from demo day Jan 17). PlaybooksPage says "Jan 16 unresolved 4 days" (implies today is Jan 20). | `src/data/members.js:157` `src/data/staffing.js:23` `src/data/cockpit.js:11` `src/features/playbooks/PlaybooksPage.jsx:25` | **P0** |
| C2 | Jan 16 yesterday weather: sunny vs overcast | DEMO_BRIEFING hardcodes `yesterdayRecap.weather: 'overcast'` for Jan 16. revenue.js says Jan 16 is `'sunny'`. weather.js says Jan 16 is `condition: 'sunny'`. Dynamic build picks up 'sunny' from revenue.js, creating a split. | `src/services/briefingService.js:155` `src/data/revenue.js:20` `src/data/weather.js:18` | **P0** |
| C3 | Agent action agx_003 dates | Agent action for Whitfield complaint references "Jan 14" for complaint, POS, and understaffed shift. But the complaint is Jan 16 or Jan 18, and understaffed days are Jan 9, 16, 28. Jan 14 is not an understaffed day. | `src/data/agents.js:125-128` `src/data/staffing.js:3-20` | **P1** |
| C4 | CohortTab: Whitfield joinDate 2026-01-15 | CohortTab shows James Whitfield as a new member who joined Jan 15, 2026 (73 days in). memberProfiles says he joined **2019-04-12** (7-year member). He's listed as member since 2019 in PlaybooksPage. | `src/features/member-health/tabs/CohortTab.jsx:5` `src/data/members.js:126` | **P1** |
| C5 | Jan 10 weather: rainy vs windy | weather.js says Jan 10 is `'rainy'` with tempHigh 58. revenue.js says Jan 10 is `'windy'`. | `src/data/weather.js:12` `src/data/revenue.js:14` | **P2** |

### D. Dollar Figure Reconciliation

| # | Surface/Component | What's wrong | Files involved | Severity |
|---|---|---|---|---|
| D1 | Board Report KPIs vs briefing revenue | Board report static KPIs show "Service Quality 87%", "Members Retained 14", "Operational Efficiency 4.2 hrs", "Board Confidence 94%". These have no dollar figures, but briefing keyMetrics.monthlyRevenue is $168K while actual data sums to $375K. The board report never references revenue, creating a disconnect with the Revenue page. | `src/data/boardReport.js:4-9` `src/services/briefingService.js:114` | **P1** |
| D2 | Board Report duesAtRisk: memberSaves sum vs memberSummary | memberSaves duesAtRisk sum = $18,500 + $14,200 + $31,000 + $16,800 + $12,500 + $15,000 = **$108,000**. memberSummary.potentialDuesAtRisk = **$868,000**. These are different metrics but may confuse a GM comparing Board Report to Member Health. | `src/data/boardReport.js:12-72` `src/data/members.js:31` | **P1** |
| D3 | Briefing DEMO_BRIEFING monthlyRevenue $168K | Not reconcilable with any slice of dailyRevenue ($375K full month, ~$168K for first 16 days golf-only). The number appears to be an approximation of golf-only revenue for half the month, not a meaningful total. | `src/services/briefingService.js:114` `src/data/revenue.js` | **P0** |

### E. Member Identity Consistency

| # | Surface/Component | What's wrong | Files involved | Severity |
|---|---|---|---|---|
| E1 | James Whitfield: archetype Balanced Active vs Snowbird | members.js, memberProfiles, resignationScenarios all say **Balanced Active**. briefingService.js dynamic build says **Snowbird** at line 238. | `src/services/briefingService.js:238` `src/data/members.js:54,85,122` | **P0** |
| E2 | location.js mbr_203 = "Raymond Hughes" instead of James Whitfield | location.js assigns memberId `mbr_203` to "Raymond Hughes" (healthScore 78, status healthy). Every other file says mbr_203 is James Whitfield (healthScore 42, at-risk). | `src/data/location.js:31` `src/data/members.js:54,122` | **P0** |
| E3 | location.js mbr_117 = "William Drake" instead of Linda Leonard | members.js says mbr_117 is Linda Leonard (Ghost, score 12). location.js says mbr_117 is William Drake (Watch, healthScore 58). | `src/data/location.js:24` `src/data/members.js:53` | **P0** |
| E4 | location.js mbr_102 = Anne Jordan (healthy, score 91) | members.js says Anne Jordan is mbr_089 (score 28, at-risk). location.js uses mbr_102 with score 91 and status "healthy". Wrong memberId and wildly wrong health score. | `src/data/location.js:9` `src/data/members.js:55` | **P1** |
| E5 | location.js mbr_101 = James Whitfield (correct data, wrong ID) | James Whitfield appears as mbr_101 in location.js but is mbr_203 everywhere else. Score (42) and status (at-risk) match, but the ID collision means profile drawer would fail to link. | `src/data/location.js:6` `src/data/members.js:122` | **P1** |
| E6 | Jennifer Walsh: two member IDs | Watch member Jennifer Walsh is mbr_309 in members.js. location.js has a Jennifer Walsh at mbr_110 with healthScore 90. Different person or ID collision. | `src/data/members.js:44` `src/data/location.js:17` | **P2** |

### F. Status/Badge/Score Consistency

| # | Surface/Component | What's wrong | Files involved | Severity |
|---|---|---|---|---|
| F1 | Health tier thresholds: guidedScoring vs everything else | guidedScoring.js uses **67/45/25** for Healthy/Watch/At Risk cutoffs. data/members.js healthDistribution, memberService.js, AllMembersView.jsx all use **70/50/30**. A member with score 68 is "Healthy" in guided mode but "Watch" on the Members page filter. | `src/services/guidedScoring.js:44-49,166-169` `src/data/members.js:17-20` `src/services/memberService.js:532-535` `src/features/member-health/tabs/AllMembersView.jsx:361-363,415-417` | **P0** |
| F2 | Robert Callahan health score: 22 vs 27 vs 36 | atRiskMembers: **22**. memberProfiles + teeSheet: **27**. briefingService + cockpit: **36**. Three different scores shown on different pages for the same member. | `src/data/members.js:56,243` `src/data/teeSheet.js:80` `src/services/briefingService.js:125,242` `src/data/cockpit.js:93` | **P1** |
| F3 | Anne Jordan health score: 28 vs 38 | atRiskMembers + teeSheet: **28**. briefingService + memberProfiles: **38**. Two different scores. | `src/data/members.js:55,189` `src/services/briefingService.js:124,240` | **P1** |

### Tee Time Mismatches (cross-cutting: B + C + E)

| # | Surface/Component | What's wrong | Files involved | Severity |
|---|---|---|---|---|
| T1 | At-risk tee times: briefing vs teeSheet | Briefing says Whitfield **9:20 AM**, Jordan **10:15 AM**, Callahan **10:42 AM**. teeSheet.js says Whitfield **8:00 AM**, Jordan **7:08 AM**, Callahan **9:00 AM**. All three times are wrong. | `src/services/briefingService.js:122-126,238-243` `src/data/teeSheet.js:50,21,79` | **P0** |

---

## Known Bugs (fix in progress, not counted above)

1. Weather icon/temp mismatch between surfaces
2. Member profiles showing handicap/dining data before integrations connected
3. Member count 300 (memberSummary) vs 250 (JCM_Members_F9 rows) mismatch

---

## Top 5 Most Critical P0 Findings

1. **Tee time mismatch** (T1) — The 3 at-risk members' tee times differ between Today briefing and Tee Sheet page. A GM comparing the two pages sees contradictory schedules. `src/services/briefingService.js:238-243` vs `src/data/teeSheet.js:21,50,79`

2. **Health tier threshold split** (F1) — Guided mode uses 67/45/25 cutoffs while all other surfaces use 70/50/30. Members shift tiers between guided and non-guided views. `src/services/guidedScoring.js:44-49`

3. **Whitfield archetype: Snowbird vs Balanced Active** (E1) — briefingService dynamic build labels him Snowbird; every other file says Balanced Active. `src/services/briefingService.js:238`

4. **location.js member ID collisions** (E2, E3) — mbr_203 and mbr_117 map to completely different people in location.js vs members.js. Location Intelligence shows wrong names, wrong scores, wrong statuses. `src/data/location.js:24,31`

5. **Whitfield complaint date: Jan 11 vs Jan 16 vs Jan 18** (C1) — Three surfaces show three dates. Cockpit says "6 days ago" but the activity log and feedback records disagree on the actual date. `src/data/cockpit.js:11`, `src/data/members.js:157`, `src/data/staffing.js:23`
