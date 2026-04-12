# Swoop Golf — Exploratory Chaos QA Script
## "Break It 50 Ways"

**Total bugs found:** 50
**Critical:** 5 | **Major:** 18 | **Minor:** 17 | **Cosmetic:** 10

### Top 5 Demo-Killers
1. BUG #2 — Members page empty despite imported data
2. BUG #5/6/7 — URL crashes (member profile, CSV import)
3. BUG #3 — Board Report empty
4. BUG #4/31 — Data Health shows disconnections despite imports
5. BUG #1/39/40/41 — Persistent API errors on every page load

### 3 Root-Cause Fixes
1. Wire demo import to Members/Board Report/Data Health/Automations (~12 bugs)
2. Error handling for dynamic imports + invalid routes (~8 bugs)
3. Fix broken APIs in demo mode (~6 bugs)
