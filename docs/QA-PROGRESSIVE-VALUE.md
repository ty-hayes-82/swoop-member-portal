# QA Test: Progressive Value — See More With Every Import

**App URL:** https://swoop-member-portal-dev.vercel.app
**Purpose:** Prove that each data import unlocks visible, tangible value. After every step, the GM sees more intelligence — the platform gets smarter as more data flows in.
**Test data:** `docs/jonas-exports/` — real Jonas Club Management exports (390 members, 4,415 tee times, 1,916 transactions, 33 complaints, 15 events, 1,649 registrations, 20 campaigns, 10,105 email events, 45 staff, 641 shifts).

---

## Before You Start

1. Run the automated API test to confirm the pipeline is healthy:
   ```bash
   node scripts/qa-full-test.mjs https://swoop-member-portal-dev.vercel.app
   # Expected: 29 PASS, 0 FAIL
   ```

2. Create a fresh club via the UI (Set Up New Club wizard) or use an existing test club.

3. Keep DevTools Network tab open throughout. After each import, **refresh the page** to pick up new data.

---

## Step 0: Empty Club — The Starting Point

**What you see:** A clean slate. The app shows where data will go and what it will unlock.

| # | Check | Expected | Pass? |
|---|-------|----------|-------|
| 0.1 | Today page | "Welcome to your dashboard" — empty but not broken | |
| 0.2 | Members page | "No members imported yet" — tells you what to do | |
| 0.3 | Service page (all 3 tabs) | Empty states on Quality, Staffing, Complaints | |
| 0.4 | Board Report | "Board report needs data" with Export/Print buttons | |
| 0.5 | Admin → Data Health | 5 domains all "Not Connected", Value Score 0% | |
| 0.6 | Actions drawer | Empty inbox — no demo data | |

**Value at Step 0:** Zero. But the app doesn't crash, shows clear guidance, and the GM knows exactly what to import first.

---

## Step 1: Import Members — "Now I Know My Club"

**File:** `docs/jonas-exports/JCM_Members_F9.csv` (390 members)
**Import type:** Members
**What this unlocks:** The foundation. Every other feature builds on knowing who your members are.

### Import

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1.1 | Admin → Open Upload Tool → select "Members" → upload `JCM_Members_F9.csv` | Import succeeds: ~390 members, 0 errors | |

### Value Check — What Changed?

| # | Page | What the GM now sees | Pass? |
|---|------|---------------------|-------|
| 1.2 | **Members → All Members** | Full roster: 390 members with names, email, phone, membership type (FG/SOC/SPT/JR), annual dues, join date. Pagination works. | |
| 1.3 | **Members → At-Risk** | Health distribution cards appear (all may show "Watch" or "Insufficient Data" — no engagement data yet). Count matches ~390. | |
| 1.4 | **Members → First 90 Days** | Members with recent join dates shown. Milestones all pending (no rounds/dining/events yet). | |
| 1.5 | **Search bar** | Type "Preston" → finds Michael Preston instantly. Click → opens profile with name, email, phone, membership tier, annual dues $18,000, join date. | |
| 1.6 | **Today page** | No longer empty. Shows member count. Basic structure visible. | |
| 1.7 | **Board Report** | KPIs now show: Members Retained count, Dues at Risk $, Retention Rate %. | |
| 1.8 | **Admin → Data Health** | CRM domain shows "Connected" with row count ~390. Value Score > 0%. | |

**Value statement:** *"I can see every member, search anyone instantly, and know their membership tier and dues. I know who joined recently and who's been here for years."*

---

## Step 2: Import Golf Rounds — "Now I See Who's Playing"

**File:** `docs/jonas-exports/TTM_Tee_Sheet_SV.csv` (4,415 tee times)
**Import type:** Tee Times / Bookings
**What this unlocks:** Golf engagement (30% of health score). The app can now tell active golfers from ghosts.

### Import

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 2.1 | Upload `TTM_Tee_Sheet_SV.csv` as "Tee Times / Bookings" | Import succeeds: ~4,415 records | |
| 2.2 | Compute health scores: `curl -X POST "[url]/api/compute-health-scores?clubId=[ID]" -H "Authorization: Bearer [token]"` | Returns `computed: N` where N > 0 | |

### Value Check — What Changed?

| # | Page | What the GM now sees | Pass? |
|---|------|---------------------|-------|
| 2.3 | **Members → All Members** (refresh) | Health scores now show numbers (not "—"). Members with many rounds score higher. Archetype column shows: "Die-Hard Golfer", "Weekend Warrior", "New Member", "Ghost". | |
| 2.4 | **Members → At-Risk** | Distribution is now meaningful: Healthy / Watch / At-Risk / Critical based on golf frequency. Members with zero rounds flagged as At-Risk or Critical. | |
| 2.5 | **Member profile** (click a Die-Hard Golfer) | Golf engagement dimension visible. High score. | |
| 2.6 | **Member profile** (click a Ghost) | Low golf score. Risk signal: "Zero golf activity" or similar. | |
| 2.7 | **Board Report** (refresh) | KPIs updated with more accurate retention data based on golf engagement. | |
| 2.8 | **Admin → Data Health** | Tee Sheet domain now "Connected". Value Score increased. | |

**Value statement:** *"Now I can see who's actually using the club. Michael Preston plays 8 rounds/month — he's a Die-Hard Golfer. But Sandra Williams hasn't played in 60 days — she's a Ghost. I need to reach out before she resigns."*

---

## Step 3: Import F&B Transactions — "Now I See Who's Spending"

**File:** `docs/jonas-exports/POS_Sales_Detail_SV.csv` (1,916 transactions)
**Import type:** Transactions
**What this unlocks:** Dining engagement (25% of health score). Revenue analytics. Social Butterfly archetype.

### Import

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 3.1 | Upload `POS_Sales_Detail_SV.csv` as "Transactions" | Import succeeds: ~1,916 records | |
| 3.2 | Recompute health scores (same curl command) | Scores update — dining dimension now factored in | |

### Value Check — What Changed?

| # | Page | What the GM now sees | Pass? |
|---|------|---------------------|-------|
| 3.3 | **Members → All Members** (refresh) | Scores shifted. Members with high dining but low golf score higher than before. New archetype: "Social Butterfly" (high dining + events, low golf). | |
| 3.4 | **Member profile** (click a Social Butterfly) | Dining engagement dimension visible. High dining score. | |
| 3.5 | **Member profile** (click a Die-Hard Golfer) | Moderate-to-low dining score — golfs a lot but doesn't dine much. Opportunity! | |
| 3.6 | **Service → Quality** | Service metrics begin computing from real data. Revenue figures visible. | |
| 3.7 | **Board Report** (refresh) | F&B revenue KPIs populate. Dues at Risk refined. | |
| 3.8 | **Admin → Data Health** | POS domain "Connected". Value Score increased again. | |

**Value statement:** *"I just discovered that Charles Worthington golfs every week but never eats at the club — that's $3,000/year in missed F&B revenue. And Patricia Vance dines 3x/week but never plays golf — she's a Social Butterfly we need to engage differently."*

---

## Step 4: Import Complaints — "Now I See Service Quality"

**File:** `docs/jonas-exports/JCM_Communications_RG.csv` (33 complaints)
**Import type:** Complaints
**What this unlocks:** Service quality tracking. Complaint resolution metrics. Staffing correlation.

### Import

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 4.1 | Upload `JCM_Communications_RG.csv` as "Complaints" | Import succeeds: ~33 records | |

### Value Check — What Changed?

| # | Page | What the GM now sees | Pass? |
|---|------|---------------------|-------|
| 4.2 | **Service → Complaints** | Complaint list populates with real data. Filters work: All / In Progress / Resolved. Category breakdown visible. | |
| 4.3 | **Service → Quality** | Resolution Rate appears. Open complaint count accurate. Service Consistency Score begins computing. | |
| 4.4 | **Today page** | Open complaints section shows unresolved items with days-open aging. No demo names — real member names from your imports. | |
| 4.5 | **Members → At-Risk** | Members with unresolved complaints get priority boost (+20 points). They move up the at-risk list. | |
| 4.6 | **Board Report** | Quality KPIs update. Confidence Score factors in complaint resolution. | |

**Value statement:** *"I can see 5 unresolved complaints, the oldest is 12 days. Two are from high-value members — I need to call them today. The Service Quality score is 71% — complaint resolution is our weak spot."*

---

## Step 5: Import Events + Registrations — "Now I See Engagement Depth"

**Files:** `docs/jonas-exports/JAM_Event_List_SV.csv` (15 events) + `docs/jonas-exports/JAM_Registrations_SV.csv` (1,649 registrations)
**Import types:** Events, then Event Registrations
**What this unlocks:** Event engagement (20% of health score). First 90 Days milestones. Balanced Active archetype.

### Import

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 5.1 | Upload `JAM_Event_List_SV.csv` as "Events" | Import succeeds: ~15 events | |
| 5.2 | Upload `JAM_Registrations_SV.csv` as "Event Registrations" | Import succeeds: ~1,649 registrations | |
| 5.3 | Recompute health scores | 3 of 4 dimensions now active | |

### Value Check — What Changed?

| # | Page | What the GM now sees | Pass? |
|---|------|---------------------|-------|
| 5.4 | **Members → All Members** (refresh) | Scores shift again. "Balanced Active" archetype appears (moderate-to-high across golf + dining + events). Archetypes are more accurate now. | |
| 5.5 | **Members → First 90 Days** | New members show event participation as milestone: "First Event ✓". Progress bars update. | |
| 5.6 | **Member profile** (click a Balanced Active) | Three engagement dimensions visible: golf, dining, events. Well-rounded member. | |
| 5.7 | **Admin → Data Health** | Email & Events domain shows "Connected". Value Score climbing. | |

**Value statement:** *"Three of four engagement dimensions are active. Archetypes are getting accurate — I can see who's a Balanced Active (golfs, dines, attends events) vs. a Die-Hard Golfer (only plays golf). I know how to engage each one differently."*

---

## Step 6: Import Email Engagement — "Now I Have Early Warning"

**Files:** `docs/jonas-exports/CHO_Campaigns_SV.csv` (20 campaigns) + `docs/jonas-exports/CHO_Email_Events_SV.csv` (10,105 events)
**Import types:** Email Campaigns, then Email Events
**What this unlocks:** Email engagement (25% of health score). Full 4-dimension health scores. Early churn detection — email decay precedes resignation by 4-6 weeks.

### Import

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 6.1 | Upload `CHO_Campaigns_SV.csv` as "Email Campaigns" | Import succeeds: ~20 campaigns | |
| 6.2 | Upload `CHO_Email_Events_SV.csv` as "Email Events" | Import succeeds: ~10,105 events | |
| 6.3 | Recompute health scores | All 4 dimensions now active: Golf 30%, Dining 25%, Email 25%, Events 20% | |

### Value Check — What Changed?

| # | Page | What the GM now sees | Pass? |
|---|------|---------------------|-------|
| 6.4 | **Members → All Members** (refresh) | Final accurate scores. Every member has a complete engagement picture. Archetype assignments are definitive. | |
| 6.5 | **Members → At-Risk** | At-risk list is now highly accurate. Members flagged are genuinely disengaged across multiple dimensions. | |
| 6.6 | **Member profile** (check a Ghost) | All 4 dimension bars visible: Golf (low), Dining (low), Email (low), Events (low). Definitively a Ghost. | |
| 6.7 | **Member profile** (check a Balanced Active) | All 4 dimensions moderate-to-high. Confirmed Balanced Active. | |
| 6.8 | **Admin → Data Health** | All domains connected. Value Score at maximum. | |

**Value statement:** *"Full health intelligence is live. Every member has a 4-dimension engagement score. I can see email open rates dropping for 8 members this month — that's my 4-6 week early warning before they disengage. Time to act."*

---

## Step 7: Import Staffing — "Now I See the Operational Picture"

**Files:** `docs/jonas-exports/ADP_Staff_Roster.csv` (45 staff) + `docs/jonas-exports/7shifts_Staff_Shifts.csv` (641 shifts)
**Import types:** Staff, then Staff Shifts
**What this unlocks:** Staffing vs. demand analysis. Understaffed day detection. The link between staffing gaps and complaint spikes.

### Import

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 7.1 | Upload `ADP_Staff_Roster.csv` as "Staff" | Import succeeds: ~45 staff | |
| 7.2 | Upload `7shifts_Staff_Shifts.csv` as "Staff Shifts" | Import succeeds: ~641 shifts | |

### Value Check — What Changed?

| # | Page | What the GM now sees | Pass? |
|---|------|---------------------|-------|
| 7.3 | **Service → Staffing** | Staffing vs. demand data populates. Understaffed days identified with revenue loss estimates. | |
| 7.4 | **Today page** | Staffing cards show current vs. required per outlet. Gap warnings for understaffed shifts. | |
| 7.5 | **Service → Quality** | Complaint-staffing correlation visible: "X% of complaints occurred on understaffed days." | |
| 7.6 | **Board Report** | Operational efficiency KPIs update. Full confidence score. | |
| 7.7 | **Admin → Data Health** | All 5 domains "Connected". Value Score at 100%. | |

**Value statement:** *"I can see that 3 of our 5 worst complaint days were understaffed. Saturdays in the Grill Room consistently need 1 more server. Fixing this one staffing gap could prevent 40% of our F&B complaints."*

---

## Final Validation: The Complete Picture

After all 7 imports, the GM has a complete club intelligence platform:

| # | Page | What to verify | Pass? |
|---|------|---------------|-------|
| F.1 | **Today** | All sections populated: member alerts, complaints, staffing cards, weather. No demo data anywhere. | |
| F.2 | **Members** — all 3 tabs | At-Risk (accurate flags), All Members (full roster + scores), First 90 Days (milestone tracking). | |
| F.3 | **Service** — all 3 tabs | Quality (consistency score from real data), Staffing (gap analysis), Complaints (real list with filters). | |
| F.4 | **Board Report** | All KPI cards populated from real data. Summary + Details tabs render. PDF export generates real content. | |
| F.5 | **Admin → Data Health** | All 5 domains "Connected" with row counts. Value Score at or near 100%. | |
| F.6 | **Search** | Any member name returns instant results with archetype and health score. | |
| F.7 | **No demo data** | No "Oakmont Hills", no "Anne Jordan", no fake names anywhere. All data is from YOUR imports. | |

---

## Progressive Value Summary

| Step | What You Imported | What the GM Can Now Do | Platform Value |
|------|------------------|----------------------|----------------|
| **0** | Nothing | See the app structure and know what to import | 0% |
| **1** | 390 Members | Search any member, see roster, know dues/tiers | 15% |
| **2** | + 4,415 Tee Times | See who's playing, identify ghosts, golf-based archetypes | 35% |
| **3** | + 1,916 Transactions | See who's spending, find revenue gaps, dining archetypes | 55% |
| **4** | + 33 Complaints | Track service quality, resolution rates, complaint aging | 65% |
| **5** | + 15 Events + 1,649 Registrations | Full event engagement, accurate archetypes, 90-day milestones | 80% |
| **6** | + 20 Campaigns + 10,105 Email Events | Complete 4-dimension health scores, early churn warning | 95% |
| **7** | + 45 Staff + 641 Shifts | Staffing intelligence, complaint correlation, operational view | 100% |

---

## Pass Criteria

| Criterion | Requirement |
|-----------|-------------|
| Each import succeeds | 0 errors per import (or only expected validation warnings) |
| Each step adds visible value | New data appears on at least 2 pages after each import |
| Health scores improve | Scores become more accurate and dimensions fill in progressively |
| Data Health tracks imports | Domain status updates from "Not Connected" → "Connected" with row counts |
| No demo data leakage | Real club never shows Oakmont Hills, Anne Jordan, or other demo names |
| No crashes | No JS console errors, no 500s, no blank pages at any step |
| Search works throughout | Members searchable from Step 1 onward |
| Board Report populates | KPIs show real data from Step 1 onward, increasing accuracy with each import |
