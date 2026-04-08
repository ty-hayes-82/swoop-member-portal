# Vision-Based QA Pipeline

Automated visual quality assurance using Playwright screenshots + Gemini 2.5 Flash element detection.

## Overview

The pipeline captures full-page screenshots of every page in the app for each gate combination, then sends them to Gemini 2.5 Flash with a **checklist of expected UI elements**. Gemini answers "visible: true/false" for each element. Scores are computed deterministically from weighted detection results.

## Architecture

```
Playwright (8 workers)          Gemini 2.5 Flash
┌─────────────────────┐         ┌──────────────────────┐
│ 1. Enter guided demo │         │ Element detection:   │
│ 2. Import gate combo │───────> │ "Is KPI strip        │
│ 3. Navigate 6 pages  │  PNG   │  visible? true/false" │
│ 4. Screenshot each   │───────> │ "Is member list       │
│ 5. Write manifest    │         │  visible? true/false" │
└─────────────────────┘         └──────┬───────────────┘
                                       │ JSON
                                       v
                                ┌──────────────────────┐
                                │ Score computation:    │
                                │ weighted % of         │
                                │ detected elements     │
                                │ - leakage penalty     │
                                └──────────────────────┘
```

## Files

| File | Purpose |
|------|---------|
| `tests/e2e/combinations/15-vision-capture.spec.js` | Playwright test — captures screenshots |
| `scripts/gemini-critique.mjs` | Sends screenshots to Gemini, computes scores |
| `playwright.insights.config.js` | Playwright config (8 workers, 120s timeout) |
| `tests/e2e/combinations/_helpers.js` | Shared helpers (enterGuidedDemo, importGates, nav) |
| `vision-screenshots/` | Output directory for PNG screenshots |
| `vision-manifest.jsonl` | Manifest mapping combos to screenshot files |
| `test-results/gemini-critique-report.md` | Generated report |
| `test-results/gemini-critique-results.json` | Machine-readable results |

## Gate System

8 data gates control what appears in the guided demo:

| Gate | Data | Key UI Elements |
|------|------|----------------|
| `members` | Member roster, health scores, archetypes | Member names, health breakdown, priority alerts |
| `tee-sheet` | Tee times, rounds, course utilization | Tee times table, at-risk members on course |
| `fb` | F&B/POS revenue, dining analytics | F&B stat cards, spending trends |
| `complaints` | Service requests, resolution tracking | Open Complaints section, Service Consistency Score |
| `email` | Email engagement, open/click rates | Email stat cards, engagement decay |
| `weather` | Forecasts, shift coverage | Weather forecast, staffing grid |
| `pipeline` | Club profile, board report benchmarks | Board Report KPIs, industry benchmarks |
| `agents` | AI agents, automated actions | Automations inbox, Approve/Dismiss buttons |

**Rule**: Members gate must be included in all combinations. No data should be uploaded without members imported first.

## How to Run

### Prerequisites
- Dev server running: `npm run dev` (port 5173)
- Gemini API key in `.env.local`: `GEMINI_API_KEY=...`

### Step 1: Capture Screenshots
```bash
npx playwright test --config=playwright.insights.config.js
```
This runs 8 gate combinations in parallel (8 Playwright workers), capturing 6 pages each = 48 screenshots.

### Step 2: Run Critique
```bash
node scripts/gemini-critique.mjs
```
Sends each screenshot to Gemini with a per-page checklist. Outputs report to `test-results/gemini-critique-report.md`.

### Step 3: Read Results
```bash
cat test-results/gemini-critique-report.md
```

## Scoring System

### Checklist-Based Detection (not subjective scoring)

Each page has a specific checklist of UI elements to detect. Each element has a **weight** (0-3):
- **Weight 3** (critical): Page's core purpose element (e.g., KPI strip on Board Report)
- **Weight 2** (important): Key data display (e.g., health scores on Members)
- **Weight 1** (nice-to-have): Supporting content (e.g., evidence strip)
- **Weight 0** (bonus): Optional elements

**Score formula**: `(weighted_found / weighted_total) * 10 - (leakage_count * 3)`

### Leakage Detection

Forbidden elements are checked per gate. If member names appear without the members gate, or complaint data without the complaints gate, it's flagged as leakage and incurs a -3 penalty per finding.

### Example Checklist (Today page with members+tee-sheet+fb+complaints)

| Element | Weight | Description |
|---------|--------|-------------|
| `greeting` | 1 | Greeting bar with club name |
| `stat_cards` | 2 | Quick stat cards row |
| `tee_times_stat` | 2 | "Tee Times Today" stat card |
| `member_alerts` | 3 | Priority Member Alerts with names and risk signals |
| `checkin_alerts` | 1 | At-risk check-in alerts |
| `fb_stats` | 2 | F&B stat cards (Dining Covers, Avg Check) |
| `open_complaints` | 2 | Open Complaints section |
| `forecast` | 1 | Weather forecast section |

## Gate Combinations by Phase

### Phase 1: Pairs (members + 1 gate)
```
members+tee-sheet, members+fb, members+complaints,
members+email, members+weather, members+pipeline, members+agents
```

### Phase 2: Triples (members + 2 gates)
```
members+tee-sheet+fb, members+tee-sheet+complaints,
members+fb+complaints, members+tee-sheet+email, etc.
```

### Phase 3-5: Quads through All Gates
```
members+tee-sheet+fb+complaints+email (5 gates)
members+tee-sheet+fb+complaints+email+pipeline (6 gates)
all-gates (8 gates)
```

## Modifying Combinations

Edit the `COMBINATIONS` array in `15-vision-capture.spec.js`:

```javascript
const COMBINATIONS = [
  { id: 'members+tee-sheet', gates: ['members', 'tee-sheet'] },
  { id: 'all-gates', gates: ['members', 'tee-sheet', 'fb', 'complaints', 'email', 'weather', 'pipeline', 'agents'] },
];
```

## Adding Checklist Elements

Edit `getChecklist()` in `scripts/gemini-critique.mjs`. Each element needs:

```javascript
items.push({
  id: 'unique_id',           // Used in reports
  label: 'What Gemini looks for',  // Natural language description
  weight: 2                  // 0-3 importance
});
```

Conditional elements use gate checks:
```javascript
if (has('complaints')) items.push({ id: 'complaint_notes', label: '...', weight: 2 });
```

## Known Issues

- **Automations blank page**: The nav click to Automations sometimes fails silently due to a Playwright timing issue. Workaround: hash navigation fallback.
- **Below-fold content**: The app uses a fixed-height layout with internal scrolling. `fullPage: true` doesn't capture content below the viewport fold. The complaints section and member saves preview may be missed by Gemini.
- **Check-in alerts timing**: GM check-in alerts animate in on a staggered timer (3s + 5s intervals). Screenshots taken before the timer fires will miss them.

## Current Scores (latest run)

| Page | Avg Score | Status |
|------|-----------|--------|
| Tee Sheet | 10/10 | Excellent |
| Service | 10/10 | Excellent |
| Members | 8-10/10 | Good |
| Board Report | 8-10/10 | Good |
| Today | 7-9/10 | Improving |
| Automations | 1-10/10 | Intermittent blank page |
