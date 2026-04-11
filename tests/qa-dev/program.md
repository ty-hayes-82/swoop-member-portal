# QA-Dev Autonomous Loop

Autonomous code quality improvement: E2E QA agents find bugs → dev agents fix them → re-test → keep/discard.

Inspired by [autoresearch](https://github.com/hwchase17/autoresearch-agents) but applied to code fixes instead of prompt optimization.

## How It Works

```
┌──────────────────────────────────────────────────────────┐
│                    QA-DEV LOOP                            │
│                                                          │
│  1. Run E2E test suite (Playwright + API + seed)         │
│  2. Parse failures into structured bug list              │
│  3. For each bug: analyze root cause                     │
│  4. Generate a code fix                                  │
│  5. git commit the fix                                   │
│  6. Re-run the failing test(s) only                      │
│  7. If test passes → keep commit                         │
│     If still fails → git reset (discard)                 │
│  8. Log result to results.tsv                            │
│  9. Repeat until all tests pass                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Test Layers

The QA-Dev loop runs tests in 3 layers (fast → slow):

### Layer 1: Unit Tests (Vitest) — ~30 seconds
```bash
npx vitest run --reporter=json > test-results/vitest.json 2>&1
```
Tests: services, agent configs, validation engine, assembly function.

### Layer 2: API Endpoint Tests — ~2 minutes
```bash
node tests/qa-dev/api-tests.js > test-results/api.json 2>&1
```
Hit every API endpoint with valid + invalid inputs. Check response codes, shapes, auth.

### Layer 3: E2E Browser Tests (Playwright) — ~10 minutes
```bash
npx playwright test --reporter=json > test-results/e2e.json 2>&1
```
Full browser tests: gate combinations, data integrity, tenant isolation, mobile.

## Failure Parsing

Each test layer outputs JSON. The runner parses failures into:

```json
{
  "test_id": "e2e/combinations/06-members-agents-pipeline.spec.js:42",
  "test_name": "agent actions appear with members + agents gates",
  "layer": "e2e",
  "error_type": "assertion",
  "error_message": "Expected 'health_score' to be in page text but was not found",
  "file_hint": "src/features/agents/AgentActivityPage.jsx",
  "stack_trace": "...",
  "severity": "high"
}
```

The `file_hint` is extracted from the stack trace or inferred from the test file name + assertion.

## Fix Strategy

For each failure, the runner dispatches a dev agent with:
1. The failing test code (so it knows what's expected)
2. The error message + stack trace
3. The likely source file(s)
4. Instructions to make the MINIMAL fix (no refactoring, no improvements beyond the bug)

The dev agent:
- Reads the failing test and source files
- Identifies the root cause
- Makes the smallest possible code change
- Commits with message: "fix: [test_id] — [description]"

## Results Tracking

```
commit	layer	test_id	status	description
a1b2c3d	e2e	06-agents:42	keep	fix: agent actions query missing club_id filter
b2c3d4e	api	/api/briefing	keep	fix: briefing endpoint 500 on empty tee sheet
c3d4e5f	unit	agentService:28	discard	attempted fix for health score calculation (still failing)
```

## Running the Loop

```bash
node tests/qa-dev/run.js
```

Or target a specific layer:
```bash
node tests/qa-dev/run.js --layer=api
node tests/qa-dev/run.js --layer=e2e
node tests/qa-dev/run.js --layer=unit
```

## Rules

- Only fix ONE bug per commit (atomic fixes)
- Re-run ONLY the failing test after a fix (fast feedback)
- If a fix breaks OTHER tests, immediately discard
- Max 3 attempts per bug, then skip and log "stuck"
- Never modify test files — only fix source code
- Never add features — only fix bugs
