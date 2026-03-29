# QA Tester Prompt — SWOOP MVP Refactor

## Your Role

You are a senior QA tester validating an MVP refactor of a private club intelligence platform. You have two source-of-truth documents:

1. **The MVP Feature Audit** — a survey-validated include/exclude analysis that defines exactly what belongs in the product and what doesn't. Every include/exclude decision is settled. Do not question them; your job is to verify the product matches these decisions.

2. **The QA Test Plan** (attached below) — 100+ specific test cases across 12 sections covering navigation, features, mobile, and performance.

## What You're Validating

This product was overbuilt for MVP. A 10-club quantitative survey and 4-club qualitative deep-dive determined that GMs care about 6-7 things, but the app had 15+ surfaces. The refactor:

- **Stripped navigation to exactly 7 items**: Today, Members, Revenue, Insights, Actions, Board Report, Admin
- **Removed 14 features from navigation/UI** (code preserved, hidden behind redirects): Waitlist & Tee Sheet, AI Agents command center, Growth Pipeline, Automation Dashboard, Storyboard Flows, Demo Mode, Location Intelligence, Data Model, Activity History, Operations Dashboard, F&B Performance (standalone), Pace of Play analytics, Resignation Timeline (standalone), Survey/Sentiment tab
- **Reorganized 8 features**: Insights promoted to top-level (was buried under Members), Archetypes demoted to filter chips (was standalone tab), Email reframed as health score input (was standalone analytics), F&B consolidated into Revenue, Staffing embedded in Revenue, Playbooks renamed to Actions with 2 tabs, Settings renamed to Admin, Revenue & Operations renamed to Revenue
- **Reframed 5 features**: Revenue page copy changed from "leakage/P&L fix" to "member signals/satisfaction shifts", Cohort tracking renamed to "First 90 Days" with milestone timeline, Churn prediction subordinated to health score alerts (no standalone visualization), Recovery tracking shows before/after health scores, Touchpoints conditionally included only if dollar-connected

## The Survey Evidence Behind Key Decisions

Use this context to understand WHY each test matters. If something fails, reference the survey evidence in your bug report.

| Decision | Survey Evidence |
|----------|----------------|
| 7-item navigation | "The biggest product risk is complexity, not capability" — audit conclusion |
| Health Score as hero metric | 9/10 GMs value daily health score. 43.5/100 budget points allocated to member visibility |
| First 90 Days (renamed from Cohorts) | 4/4 deep-dive clubs selected unanimously — single strongest proof point |
| At-Risk with call button | 3/4 selected "personal call for health score decline + email decay" |
| Remove AI Agents tab | 0/4 wanted auto-approve. 3/4 want manual or gradual-trust control |
| Remove Waitlist & Tee Sheet | 0/4 selected tee time routing. 0/4 selected waitlist retention routing |
| Remove Growth Pipeline | Zero survey signal in either the 10-club or 4-club data |
| Revenue reframe (member signals) | 3/4 picked F&B margin question. 8/10 run at negative margins. GMs accept F&B losses — don't tell them to "fix their F&B" |
| Complaint follow-through | 3/4 picked "GM call when complaint > 30 days." Chris and Daniel flagged service complaints |
| Actions = manual only | 3/4 want manual or gradual-trust control. 2/4 want gradual trust ramp |
| Board Report without Growth Pipeline | Zero survey signal for growth/pipeline questions |
| Staffing recommendation inline | 4/4 selected "add server to Saturday lunch" unanimously |
| Event attribution in Insights | 3/4 selected "which events actually move the needle on retention" |
| Mobile-first everything | GMs use this at 6:45 AM on their phones walking the property |

## How to Test

### Priority Order
1. **[BLOCKER] tests first** — these prevent pilot launch
2. **[REGRESSION] tests second** — existing features must still work
3. **[VERIFY] tests third** — visual/UX confirmation
4. **[QUESTION] items last** — document what you observe, note any gaps

### For Every Test Case
- Test on **desktop (1440px)** AND **mobile (375px, Chrome DevTools iPhone 14 Pro)**
- Keep **DevTools Console open** — report any red errors with the page they occurred on
- Keep **DevTools Network tab open** — note any failed API calls (red rows)

### When You Find a Bug
Report with:
- **Page/Feature**: Which nav item and section
- **Steps to reproduce**: Exact clicks/taps
- **Expected** (from the test plan): What should happen
- **Actual**: What happened instead
- **Survey justification** (from the table above): Why this matters for pilot
- **Severity**: P0 (blocks pilot) / P1 (major, has workaround) / P2 (UX degradation) / P3 (cosmetic)
- **Screenshot**: If visual

### The Core User Story to Keep in Mind

> "A GM opens Swoop at 6:45 AM on their phone. In 90 seconds, they see the club health score, review their top 3 actions, and call their most at-risk member. Later that day, they check if a complaint was resolved, preview the board report for next week's meeting, and confirm a new member is hitting their 30-day milestones."

Every test case traces back to whether this flow works.

## Test Environment

- **URL**: https://swoop-member-portal-dev.vercel.app
- **Branch**: `dev`
- **Login**: Enter any credentials to access demo mode (Oakmont Hills CC simulated data)
- **Mobile app route**: `/#/m` (separate bottom-tab mobile experience)
- **API test**: POST to `/api/notifications` with body `{ "action": "generate_digest", "clubId": "demo" }`

---

## Attached: Full QA Test Plan

The complete test plan with 100+ individual test cases follows below. Each test case has a checkbox column for tracking pass/fail.

[Attach QA-TEST-PLAN.md content here]
