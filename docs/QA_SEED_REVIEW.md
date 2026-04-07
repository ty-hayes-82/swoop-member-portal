# QA Script: 100-Member Seed Data Review

**Login:** `gm@pinetreecc.com` / `pinetree2026`
**URL:** http://localhost:3000 (or deployed Vercel URL)
**Club:** Pinetree Country Club (club_001)
**Simulation Date:** January 17, 2026

---

## Pre-Check: Login & Authentication

- [ ] Navigate to app URL
- [ ] Enter email `gm@pinetreecc.com` and password `pinetree2026`
- [ ] Verify "Pinetree Country Club" appears in header after login
- [ ] Verify you land on the Today dashboard

---

## 1. TODAY (#/today)

### What to verify:
- [ ] Greeting shows GM name and club name
- [ ] Weather widget shows January weather for Kennesaw, GA area
- [ ] Staffing section shows data (45 staff across 6 departments)
- [ ] Pending actions queue shows agent-generated actions
- [ ] Member alerts section populates (at-risk members flagged)

### Seed data to look for:
- [ ] Jan 16 or 28 should show understaffed warning (Grill Room short-handed)
- [ ] At-risk member alerts should include Ghost and Declining archetypes

---

## 2. MEMBERS (#/members)

### 2a. At-Risk View (default tab)

**Health Distribution donut chart:**
- [ ] Healthy: ~59 members (green)
- [ ] Watch: ~22 members (yellow)
- [ ] At Risk: ~8 members (orange)
- [ ] Critical: ~11 members (red)
- [ ] Total active: 95 (100 minus 5 resigned)

**At-Risk member list — verify these members appear:**

| Member | Archetype | Expected Score | Expected Risk |
|--------|-----------|---------------|---------------|
| Marilyn Prescott | Ghost | ~5 | Critical - $18K FG paying for nothing |
| Dennis Olsen | Ghost | ~6 | Critical - zero activity |
| Roger Haines | Ghost | ~7 | Critical - barely 1 dining visit/month |
| Janet Reese | Ghost | ~12 | Critical - NR, zero activity |
| Warren Chang | Ghost | ~15 | Critical - occasional visitor |
| Philip Duarte | Ghost | ~18 | Critical - FG paying $18K for 1 round/month |
| Martha Fleming | Declining | ~22 | Critical - each month worse |
| Harold Simms | Declining | ~24 | Critical - NR, rarely visits |
| Arthur Bowen | Declining | ~26 | Critical - borderline |
| Gerald Norton | Declining | ~33 | At Risk - not resigned yet |

**Risk descriptions — verify they make sense:**
- [ ] Ghost members should show "Zero golf activity" and "Dining spend -100%"
- [ ] Declining members should show engagement drops

**Archetype radar charts — verify 8 archetypes:**
- [ ] Die-Hard Golfer: 18 members, high golf (88%), low email (32%)
- [ ] Balanced Active: 22 members, moderate across all dimensions
- [ ] Social Butterfly: 15 members, high dining (82%), high events (78%), low golf (18%)
- [ ] Weekend Warrior: 15 members, moderate golf (52%), low email (28%)
- [ ] Declining: 10 members, low everything, strong negative trend (-18)
- [ ] New Member: 8 members, high email (68%), positive trend (+14)
- [ ] Ghost: 7 members, near-zero everything
- [ ] Snowbird: 5 members, moderate-high engagement

### 2b. All Members View (click "All Members" tab)

- [ ] 95 active members displayed in table (5 resigned excluded from active roster)
- [ ] Search for "John Harrison" — should show Die-Hard Golfer, FG, score ~88, Healthy
- [ ] Search for "Marilyn Prescott" — should show Ghost, FG, score ~5, Critical
- [ ] Filter by archetype "Social Butterfly" — should show 15 members
- [ ] Filter by archetype "Ghost" — should show 6-7 members (1 resigned)

**Spot-check named members:**

| Search | Expected |
|--------|----------|
| Robert Callaway | Die-Hard Golfer, FG, score ~92, Healthy |
| Sarah Collins | Balanced Active, FG, score ~85, Healthy |
| Victoria Sinclair | Social Butterfly, SOC, score ~82, Healthy |
| Scott Patterson | Weekend Warrior, SPT, score ~68, Watch |
| Jason Rivera | New Member, JR, score ~70, Healthy |
| Ronald Petersen | Snowbird, NR, score ~75, Healthy |

### 2c. Resignation Scenarios

Look for a resignation timeline or resigned members section:

| Member | Date | Pattern | Key Detail |
|--------|------|---------|------------|
| Kevin Hurst (mbr_071) | Jan 8 | Gradual decay | Stopped golf Nov, dining Dec |
| Linda Leonard (mbr_089) | Jan 15 | Ghost departure | Last visit Sep 2025, no warning |
| James Whitfield (mbr_038) | Jan 22 | Service failure | Complaint Jan 18, never resolved |
| Anne Jordan (mbr_059) | Jan 27 | Slow withdrawal | Activity halving month-over-month |
| Steven Park (mbr_072) | Jan 31 | F&B minimum | Dined exactly to $2,500 SPT min, stopped |

### 2d. Email Engagement Heatmap

- [ ] Should show 8 campaigns x 8 archetypes = 64 data points
- [ ] Die-Hard Golfer email open rate should be very low (~5-18%)
- [ ] Social Butterfly email open rate should be high (~60-72%)
- [ ] Ghost open rate should be 0% or near-zero

---

## 3. MEMBER PROFILE (#/members/mbr_038)

Navigate to James Whitfield's profile (click his name or go to `#/members/mbr_038`):

- [ ] Name: James Whitfield
- [ ] Archetype: Balanced Active
- [ ] Membership: FG (Full Golf, $18,000)
- [ ] Status: Resigned (Jan 22, 2026)
- [ ] Health score: ~44 (dropped from ~82)
- [ ] Complaint visible: Service Speed, Jan 18, sentiment -0.8, status "acknowledged" (never resolved)
- [ ] Engagement timeline should show activity collapse after Jan 18

Also check a healthy member like John Harrison (mbr_001):
- [ ] Name: John Harrison
- [ ] Archetype: Die-Hard Golfer
- [ ] Membership: FG ($18,000)
- [ ] Health score: ~88, Healthy
- [ ] Should show high golf activity, moderate dining

---

## 4. SERVICE (#/service)

### 4a. Quality Tab
- [ ] Complaint count visible (~19 feedback records)
- [ ] Service Speed complaints should appear on understaffed dates (Jan 9, 16, 28)
- [ ] James Whitfield's Jan 18 complaint should appear

### 4b. Staffing Tab
- [ ] 45 staff members across departments
- [ ] Understaffed alerts for Jan 9, 16, 28 (Grill Room)
- [ ] ~625 shifts shown

### 4c. Understaffed Impact (key insight)
- [ ] Understaffed days (Jan 9, 16, 28) should show:
  - 2x complaint rate vs normal days
  - ~22% longer ticket times (27.6 min vs 22.7 min)
  - ~8% lower F&B revenue

---

## 5. AUTOMATIONS (#/automations)

### 5a. Inbox Tab
- [ ] 6 pending agent actions should appear:
  - James Whitfield: 60% drop in dining spend (Member Pulse, high priority)
  - Saturday 7-9 AM overbooked with waitlist (Demand Optimizer, high)
  - Anne Jordan: complaint with no follow-up (Service Recovery, high)
  - Weekend PM slots underpriced (Revenue Analyst, medium)
  - Steven Park: skipped 3 events (Member Pulse, medium)
  - Saturday staffing gap for beverage cart (Labor Optimizer, high)

### 5b. Agents Tab
- [ ] 6 agents displayed:
  - Member Pulse (active)
  - Demand Optimizer (active)
  - Service Recovery (learning)
  - Revenue Analyst (active)
  - Engagement Autopilot (idle)
  - Labor Optimizer (active)

---

## 6. BOARD REPORT (#/board-report)

- [ ] KPI cards populate (members saved, dues protected, revenue recovered)
- [ ] Member health distribution chart matches Members page
- [ ] Service quality metrics visible
- [ ] Weather impact section shows data

---

## 7. ADMIN (#/admin)

### 7a. Integrations Tab
- [ ] 6 connected systems should show:
  - ForeTees (tee_sheet) — 2,508 data points
  - Jonas Club Software (POS) — 3,235 data points
  - Mailchimp (email) — 1,094 data points
  - ADP (scheduling) — 625 data points
  - Weather API — 31 data points
  - Club Feedback — 19 data points

### 7b. Data Health Tab
- [ ] Data completeness indicators should populate
- [ ] No error states

---

## 8. KEY INSIGHTS TO VALIDATE

These are the business insights the seed data is designed to produce. Verify each is visible somewhere in the app:

### Insight 1: Post-Round Dining Conversion
- **Where:** Members page or Service page
- **Expected:** ~68.5% of completed rounds convert to dining
- **Verify:** Die-Hards convert ~50%, Weekend Warriors ~25%

### Insight 2: Email Channel Effectiveness
- **Where:** Members > Email Heatmap
- **Expected:** Die-Hard Golfers: 5-18% open rate. Social Butterflies: 60-72%
- **Insight:** "Stop emailing Die-Hards, reach them in person. Double email for Social Butterflies."

### Insight 3: Understaffed Day Impact
- **Where:** Service > Quality or Staffing tab
- **Expected:** Jan 9, 16, 28 show 2x complaints, longer ticket times

### Insight 4: Five Resignation Patterns
- **Where:** Members > Resignation section
- **Expected:** 5 distinct stories (gradual decay, ghost departure, service failure, slow withdrawal, F&B minimum)

### Insight 5: Ghost Dues at Risk
- **Where:** Members > At-Risk list
- **Expected:** 7 Ghost members paying combined ~$63K with near-zero activity

### Insight 6: James Whitfield's Preventable Resignation
- **Where:** Member Profile for mbr_038
- **Expected:** Health 82 → 44 after Jan 18 complaint. Complaint status "acknowledged" (never resolved). Resigned Jan 22 — only 4 days later.

### Insight 7: Rain Day F&B Boost
- **Where:** Board Report or Service page
- **Expected:** Rainy days show 11% higher F&B revenue than sunny days

### Insight 8: Decaying Email Engagement
- **Where:** Members > Decaying Members section
- **Expected:** 8 members flagged with declining email open rates
- **Resignation members:** Kevin Hurst email went to 0%, Anne Jordan progressive decline

---

## 9. DATA VOLUME SANITY CHECK

| Table | Expected | Where Visible |
|-------|----------|---------------|
| Members | 100 (95 active + 5 resigned) | Members page |
| Bookings | ~2,508 | Service or Today |
| F&B Checks | ~3,235 | Service |
| Events | 12 definitions, ~563 registrations | Service or Board Report |
| Email Campaigns | 8 campaigns, ~1,094 events | Members email heatmap |
| Staff | 45 | Service staffing tab |
| Feedback | ~19 | Service quality tab |
| Agents | 6 definitions, 6 actions | Automations |

---

## 10. NEGATIVE TESTS

- [ ] Search for a non-existent member — should show "no results"
- [ ] Filter by "Ghost" archetype — should NOT show Linda Leonard (resigned Jan 15)
- [ ] Resigned members should NOT appear in the active roster (95, not 100)
- [ ] Navigate to `#/members/mbr_999` — should gracefully handle missing member

---

## Bug Report Template

If something doesn't match expectations:

```
Page: [e.g., #/members]
Section: [e.g., At-Risk Members list]
Expected: [what the plan says]
Actual: [what you see]
Screenshot: [attach]
Severity: [Critical / Major / Minor / Cosmetic]
```
