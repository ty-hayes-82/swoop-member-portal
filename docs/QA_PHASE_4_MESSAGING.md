# QA Testing Plan — Phase 4
## Messaging & Framing Realignment

**Phase:** 4 of 5
**Sprints Covered:** 4.1 (Page Headlines), 4.2 (Landing Page)
**Estimated QA Time:** 1.5-2 hours
**Prerequisite:** Phases 1-3 must be complete and passing
**Environment:** Deployed Vercel preview or local (`npm run dev`)

---

## WHAT CHANGED IN THIS PHASE

This phase is purely about **words, headlines, and framing**. No structural changes. Every page headline and description was updated to lead with **operational intelligence** language instead of **retention/churn** language.

Key changes:
1. **Today** — headline focuses on operational risk, not health scores
2. **Service** — headline asks about service consistency (already done in Phase 1)
3. **Members** — headline says "members need attention" not "dues at risk" (already done in Phase 2)
4. **Board Report** — subtitle says "service quality, member health, and impact"
5. **Landing page** — hero title changed to "See where today is breaking — before your members feel it." Proof points rewritten. "What to look at first" points to Today, Service, Members.
6. **Global audit** — all remaining instances of "churn prevention," "revenue leakage," "retention dashboard" replaced with operations-first language

---

## PRE-TEST SETUP

1. Open the app in a browser
2. Log in (demo mode)
3. Confirm Phases 1-3 changes are in place

---

## TEST SUITE 1: PAGE HEADLINE AUDIT

This test suite walks through every page and checks that the headline/subtitle uses the correct messaging.

### Test 1.1 — Today Page

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to Today | Page loads | |
| 2 | Read the main headline/priority text | Should focus on operational risk or a specific member action — NOT "Club Health Score: 72" | |
| 3 | Scan the entire page for these words: "churn," "retention dashboard," "revenue leakage" | NONE of these words should appear on the Today page | |
| 4 | Look for the word "cockpit" | Should NOT be visible to users (internal term). Language should be action-oriented: "risks," "attention," "actions" | |

### Test 1.2 — Service Page

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to Service | Page loads | |
| 2 | Read the headline | Should ask about service consistency across shifts, outlets, and days | |
| 3 | Read the context text | Should mention "staffing levels, complaint patterns, and pace of play" or similar | |
| 4 | Check the Staffing tab headline | Should be framed as "service quality" or "consistent service" — NOT "revenue loss" or "Understaffing = Lost Revenue" | |

### Test 1.3 — Members Page

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to Members (At-Risk mode) | Page loads | |
| 2 | Read the headline | Should say "X members need attention" — NOT "$XXK at risk" or "dues need attention" | |
| 3 | Read the context text | Should mention "disengagement patterns" — NOT "churn prevention" | |
| 4 | Switch to All Members mode | Headline should be descriptive and neutral, not financial | |

### Test 1.4 — Board Report

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to Board Report | Page loads | |
| 2 | Read the subtitle | Should mention "service quality, member health, and impact" | |
| 3 | Should NOT say | "retention, revenue, and operational saves" (old subtitle) | |

### Test 1.5 — Admin

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to Admin | Page loads | |
| 2 | Read the subtitle | Should say "Integrations and data health monitoring" or similar | |
| 3 | Should NOT say | "CSV imports, notifications, and user roles" (old subtitle) | |

---

## TEST SUITE 2: LANDING PAGE

### Test 2.1 — Hero Section

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to the landing page (if accessible via `#/landing` or the app root before login) | Landing page renders | |
| 2 | Read the hero title | Should say "See where today is breaking — before your members feel it" or similar operations-first headline | |
| 3 | Should NOT say | "Welcome to Swoop Member Intelligence" (old title) | |
| 4 | Read the subtitle | Should mention connecting tee sheet, POS, CRM, and scheduling into one intelligence layer | |

### Test 2.2 — Proof Points

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Look at the proof point cards (usually 3 cards below the hero) | Should lead with service/operational metrics | |
| 2 | Check first proof point | Should mention service consistency or staffing improvement — NOT just retention lift | |
| 3 | Check that retention is mentioned | Retention can be ONE of the proof points, but should NOT be the first or only one | |

### Test 2.3 — "What to Look at First"

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Look for a "What to look at first" or quick-start section | Should list 3 entry points | |
| 2 | Entry point 1 | Should point to Today / cockpit — "see where operations are at risk" | |
| 3 | Entry point 2 | Should point to Service & Staffing — "is tomorrow staffed correctly?" | |
| 4 | Entry point 3 | Should point to Members — "who should you call this week?" | |
| 5 | Should NOT list | "Explore the Revenue breakdown" (old entry point) | |

### Test 2.4 — No Retention-First Language

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Read the entire landing page top to bottom | The page should feel like a "connected intelligence platform" | |
| 2 | Should NOT feel like | A "retention dashboard" or "churn prevention tool" | |
| 3 | Search (Ctrl+F) for "churn" on the page | Zero results | |
| 4 | Search for "retention dashboard" | Zero results | |
| 5 | Search for "revenue leakage" | Zero results | |

---

## TEST SUITE 3: GLOBAL LANGUAGE AUDIT

### Test 3.1 — Forbidden Phrases Sweep

Navigate through every page and use Ctrl+F (browser find) to search for these phrases. **None** should appear in user-facing text:

| Phrase to Search | Where to Check | Expected Matches | Pass/Fail |
|-----------------|----------------|------------------|-----------|
| "churn prevention" | All 5 pages + landing | **0** | |
| "retention dashboard" | All 5 pages + landing | **0** | |
| "revenue leakage" | All 5 pages + landing | **0** | |
| "dues at risk" | All 5 pages + landing | **0** (in headlines — OK in member profile detail data) | |
| "$216K" | All 5 pages + landing | **0** | |
| "$264K" | All 5 pages + landing | **0** | |
| "16:1 ROI" | All 5 pages + landing | **0** | |
| "Lens" or "lenses" | All 5 pages + landing | **0** (per §9 rule — internal language only) | |

### Test 3.2 — Correct Phrases Present

These phrases SHOULD appear somewhere in the product:

| Phrase | Where Expected | Found? | Pass/Fail |
|--------|---------------|--------|-----------|
| "service consistency" or "consistent service" | Service page headline or Today page | | |
| "staffing" or "staffing intelligence" | Service page, Today risks | | |
| "members need attention" or "members needing attention" | Members page headline or Today page | | |
| "service quality" | Board Report subtitle or Service page | | |
| "connected" or "cross-domain" or "intelligence" | Landing page or Service page | | |

---

## TEST SUITE 4: ACTIONS DRAWER MESSAGING

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open the Actions drawer | Drawer opens | |
| 2 | Read the drawer header | Should say "Pending Actions (X)" or similar — NOT "AI inbox, playbooks, and outreach" | |
| 3 | Check action descriptions | Individual actions can mention specific outcomes but should not use "churn prevention" framing | |

---

## TEST SUITE 5: REGRESSION — PHASES 1-3 STILL WORK

### Quick Regression

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | 5 sidebar items | Today, Service, Members, Board Report, Admin | |
| 2 | Service page — 3 tabs | Quality, Staffing, Complaints | |
| 3 | Members — simplified At-Risk view | No collapsible sections for Archetypes/Email/Recovery/Cohorts | |
| 4 | Board Report — 2 tabs | Summary, Details | |
| 5 | Admin — 2 tabs | Integrations, Data Health | |
| 6 | 3 playbooks only | Service Save, 90-Day Integration, Staffing Adjustment | |
| 7 | No projected ROI numbers | No "$XXK/yr" anywhere | |
| 8 | Complaint resolution tracking | Complaints show status, resolved_date, resolved_by | |
| 9 | `#/revenue` → `#/service` | Redirect works | |
| 10 | Actions drawer opens from sidebar | Works from all pages | |

---

## TEST SUITE 6: CONSOLE & BUILD

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | F12 Console — navigate all pages | Zero red errors | |
| 2 | If local: `npm run build` | Build succeeds | |

---

## BUGS FOUND

| # | Test ID | Description | Severity (Critical/High/Medium/Low) | Screenshot? |
|---|---------|-------------|--------------------------------------|-------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## SIGN-OFF

| Role | Name | Date | Result |
|------|------|------|--------|
| QA Tester | | | Pass / Fail |
| QA Lead | | | Approved / Needs Fixes |
| Developer | | | Fixes Deployed |
