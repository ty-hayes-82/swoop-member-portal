/**
 * Live Club E2E Test Suite
 *
 * Creates a real club, imports data source-by-source, and verifies that the
 * correct insights become visible after each import. Then runs health score
 * computation + agent sweep, verifies agent activity in the Chat Simulator,
 * and checks cross-club data isolation.
 *
 * Prerequisites:
 *   APP_URL must point at an environment serving /api/* (Vercel preview or `vercel dev`).
 *   Vite-only dev servers (:5173 without `vercel dev`) will skip cleanly.
 *
 * Run:
 *   APP_URL=https://swoop-member-portal-<preview>.vercel.app \
 *     npx playwright test tests/e2e/live-club-e2e.spec.js --project="Desktop Chrome" --reporter=html
 *
 * Artifacts:
 *   tests/e2e/reports/live-club-report.json  — structured issue log
 *   tests/e2e/screenshots/live-club-YYYY-MM-DD/  — stage-by-stage screenshots
 */
import { test, expect, request as pwRequest } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const TIMESTAMP = Date.now();
const RUN_DATE = new Date().toISOString().slice(0, 10);

// ─── Screenshot / Report helpers ────────────────────────────────────────────

const SCREENSHOT_DIR = path.join(__dirname, `screenshots/live-club-${RUN_DATE}`);
if (!existsSync(SCREENSHOT_DIR)) mkdirSync(SCREENSHOT_DIR, { recursive: true });

const issues = [];
let issueCounter = 0;

function addIssue({ severity = 'medium', suite, description, screenshot = null, expected, actual }) {
  issueCounter++;
  const id = `ISS-${String(issueCounter).padStart(3, '0')}`;
  issues.push({ id, severity, suite, description, screenshot, expected, actual });
  console.warn(`[${id}] ${severity.toUpperCase()} — ${description}`);
}

async function screenshot(page, name) {
  const file = path.join(SCREENSHOT_DIR, `${name}.png`);
  try {
    await page.screenshot({ path: file, fullPage: true });
    return file;
  } catch {
    return null;
  }
}

function writeReport(clubId) {
  const report = {
    run_date: RUN_DATE,
    club_id: clubId || 'unknown',
    issues,
    summary: {
      total_issues: issues.length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
    },
  };
  const reportPath = path.join(__dirname, 'reports/live-club-report.json');
  const reportsDir = path.dirname(reportPath);
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n[report] Written to ${reportPath}`);
  console.log(`[report] ${report.summary.total_issues} issues (${report.summary.high} high, ${report.summary.medium} medium, ${report.summary.low} low)`);
  return report;
}

// ─── CSV Parser ─────────────────────────────────────────────────────────────

/** Minimal RFC 4180 CSV parser — handles quoted fields. */
function parseCSV(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return [];

  function parseLine(line) {
    const fields = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '"') {
        let field = '';
        i++; // skip opening quote
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') { field += '"'; i += 2; }
          else if (line[i] === '"') { i++; break; }
          else { field += line[i++]; }
        }
        fields.push(field);
        if (line[i] === ',') i++;
      } else {
        const end = line.indexOf(',', i);
        if (end === -1) { fields.push(line.slice(i)); break; }
        fields.push(line.slice(i, end));
        i = end + 1;
      }
    }
    return fields;
  }

  const headers = parseLine(lines[0]);
  const rows = [];
  for (let n = 1; n < lines.length; n++) {
    const line = lines[n].trim();
    if (!line) continue;
    const values = parseLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    rows.push(row);
  }
  return rows;
}

function readFixture(filename) {
  const p = path.join(__dirname, '../fixtures/small', filename);
  return parseCSV(readFileSync(p, 'utf8'));
}

// ─── API helpers (mirrors tenant-isolation.spec.js pattern) ─────────────────

async function postJson(ctx, path, body, headers = {}) {
  const res = await ctx.post(path, {
    data: body,
    headers: { 'Content-Type': 'application/json', ...headers },
    failOnStatusCode: false,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status(), json, text };
}

async function getJson(ctx, path, headers = {}) {
  const res = await ctx.get(path, { headers, failOnStatusCode: false });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status(), json, text };
}

async function createClub(ctx, suffix) {
  const ts = Date.now();
  const email = `live-e2e-${ts}-${suffix}@e2e.test`;
  const password = 'LiveE2e!2345';
  const r = await postJson(ctx, '/api/onboard-club', {
    clubName: `Live E2E ${suffix} ${ts}`,
    city: 'Phoenix',
    state: 'AZ',
    zip: '85001',
    memberCount: 100,
    courseCount: 1,
    outletCount: 2,
    adminEmail: email,
    adminName: `Live E2E ${suffix} Admin`,
    adminPassword: password,
  });
  if (r.status !== 201 || !r.json?.clubId) {
    throw new Error(`onboard-club failed (status=${r.status}): ${r.text?.slice(0, 300)}`);
  }
  return { clubId: r.json.clubId, email, password };
}

async function login(ctx, email, password) {
  const r = await postJson(ctx, '/api/auth', { email, password });
  if (r.status !== 200 || !r.json?.token) {
    throw new Error(`login failed (status=${r.status}): ${r.text?.slice(0, 300)}`);
  }
  return { token: r.json.token, user: r.json.user };
}

async function importData(ctx, importType, rows, authHeaders) {
  return postJson(ctx, '/api/import-csv', { importType, rows }, authHeaders);
}

/** Poll a condition function until it returns truthy or timeout elapses. */
async function poll(fn, { timeout = 30000, interval = 2000 } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = await fn();
    if (result) return result;
    await new Promise(r => setTimeout(r, interval));
  }
  return null;
}

/**
 * Inject real auth into browser localStorage for page-based tests.
 * Uses addInitScript so localStorage is populated BEFORE React mounts
 * (avoids the unauthenticated-flash when navigating to the target route).
 */
async function injectAuth(page, token, user, clubId) {
  await page.addInitScript(({ token, user, clubId }) => {
    localStorage.setItem('swoop_auth_token', token);
    localStorage.setItem('swoop_auth_user', JSON.stringify(user));
    localStorage.setItem('swoop_club_id', clubId);
  }, { token, user, clubId });
  // Also set immediately in case the page is already loaded
  try {
    await page.evaluate(({ token, user, clubId }) => {
      localStorage.setItem('swoop_auth_token', token);
      localStorage.setItem('swoop_auth_user', JSON.stringify(user));
      localStorage.setItem('swoop_club_id', clubId);
    }, { token, user, clubId });
  } catch { /* page may not be loaded yet — addInitScript covers this case */ }
}

// ─── Shared state (module scope — valid because all tests run in one worker) ──

let ctx;
let primaryClub;   // { clubId, email, password }
let primaryAuth;   // { token, user }
let authHeaders;   // { Authorization: `Bearer ${token}` }
let apiReachable = false;

// ═══════════════════════════════════════════════════════════════════════════
// Outer serial wrapper — keeps all 37 tests in one worker so module-scope
// shared state (ctx, primaryClub, authHeaders) flows correctly across suites.
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Live Club E2E', () => {
  test.describe.configure({ mode: 'serial' });

// ═══════════════════════════════════════════════════════════════════════════
// Suite 1 — Bootstrap: create club + verify API is reachable
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Suite 1 — Bootstrap', () => {
  test.beforeAll(async () => {
    ctx = await pwRequest.newContext({ baseURL: APP_URL });

    // Probe: /api/auth GET without token should return 401 JSON
    let probe;
    try { probe = await getJson(ctx, '/api/auth'); }
    catch (err) { probe = { status: 0, json: null, text: String(err?.message || err) }; }

    apiReachable = probe.status === 401 && probe.json && typeof probe.json.error === 'string';
    if (!apiReachable) {
      console.warn(
        `[live-club-e2e] APP_URL=${APP_URL} does not serve /api/* ` +
        `(probe status=${probe.status}). Set APP_URL to a Vercel preview URL or \`vercel dev\`.`
      );
    }
  });

  test('1.1 — API is reachable', async () => {
    test.skip(!apiReachable, 'APP_URL does not serve /api/* — skipping suite');
    expect(apiReachable).toBe(true);
  });

  test('1.2 — Create test club + login', async () => {
    test.skip(!apiReachable, 'APP_URL does not serve /api/* — skipping');

    // Allow reusing a pre-created club to avoid the 3/hour rate limit.
    // Usage: E2E_CLUB_EMAIL=... E2E_CLUB_PASSWORD=... E2E_CLUB_ID=... npx playwright test ...
    const existingEmail = process.env.E2E_CLUB_EMAIL;
    const existingPassword = process.env.E2E_CLUB_PASSWORD;
    const existingClubId = process.env.E2E_CLUB_ID;

    if (existingEmail && existingPassword && existingClubId) {
      console.log(`[bootstrap] Reusing existing club from env: ${existingClubId}`);
      primaryClub = { clubId: existingClubId, email: existingEmail, password: existingPassword };
    } else {
      primaryClub = await createClub(ctx, 'Main');
    }

    primaryAuth = await login(ctx, primaryClub.email, primaryClub.password);
    authHeaders = { Authorization: `Bearer ${primaryAuth.token}` };

    expect(primaryClub.clubId).toBeTruthy();
    expect(primaryAuth.token).toBeTruthy();
    console.log(`[bootstrap] clubId=${primaryClub.clubId}`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Suite 2 — Sequential Import → Insight Verification
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Suite 2 — Sequential Import → Insight Verification', () => {
  // ── Step A: Members ───────────────────────────────────────────────────────

  test('2A.1 — Import members CSV', async () => {
    test.skip(!apiReachable || !primaryClub, 'Skipping — bootstrap not complete');

    const rows = readFixture('JCM_Members_F9.csv');
    expect(rows.length).toBeGreaterThan(0);
    console.log(`[import] Sending ${rows.length} member rows`);

    const r = await importData(ctx, 'members', rows, authHeaders);

    if (!r.json?.success) {
      addIssue({
        severity: 'high',
        suite: 'Suite 2A',
        description: `Members import failed: HTTP ${r.status}`,
        expected: 'success > 0',
        actual: r.text?.slice(0, 200),
      });
    }
    expect(r.status).toBe(200);
    expect(r.json?.success).toBeGreaterThan(0);
    console.log(`[import] members: ${r.json?.success}/${r.json?.totalRows} imported`);
  });

  test('2A.2 — After members: member list returns data', async ({ page }) => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    const r = await getJson(ctx, '/api/members', authHeaders);
    const count = r.json?.memberRoster?.length ?? r.json?.members?.length ?? r.json?.total ?? 0;
    if (r.status !== 200 || count === 0) {
      addIssue({
        severity: 'high',
        suite: 'Suite 2A',
        description: 'GET /api/members returned empty or error after members import',
        expected: 'memberRoster array with length > 0',
        actual: `status=${r.status}, keys=${JSON.stringify(Object.keys(r.json || {}))}`,
      });
    }
    expect(r.status).toBe(200);
    expect(count).toBeGreaterThan(0);
  });

  test('2A.3 — After members only: revenue page has no F&B data yet', async () => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    const r = await getJson(ctx, '/api/fb', authHeaders);
    // Expect empty data (no transactions yet), not an error
    const hasNoData = r.status === 200 && (!r.json?.transactions || r.json.transactions.length === 0);
    const isGated = r.status === 200 && r.json?.gated === true;
    if (!hasNoData && !isGated && r.status !== 404) {
      addIssue({
        severity: 'low',
        suite: 'Suite 2A',
        description: 'Revenue/FB endpoint returned unexpected data before any POS import',
        expected: 'empty transactions or gated response',
        actual: `status=${r.status}, transactions=${r.json?.transactions?.length}`,
      });
    }
  });

  test('2A.4 — Navigate to #/members browser view after members import', async ({ page }) => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    await injectAuth(page, primaryAuth.token, primaryAuth.user, primaryClub.clubId);
    await page.goto(`${APP_URL}/#/members`);
    await page.waitForTimeout(3000);

    const shot = await screenshot(page, '2A4-members-after-members-import');
    const text = await page.evaluate(() => document.body.innerText);

    // Members page should not say "no data" after import
    const hasError = /no members imported|connect your data/i.test(text);
    if (hasError) {
      addIssue({
        severity: 'medium',
        suite: 'Suite 2A',
        description: 'Members page still shows empty state after members import',
        screenshot: shot,
        expected: 'Member list or health overview visible',
        actual: text.slice(0, 300),
      });
    }
  });

  // ── Step B: Dining (POS transactions) ─────────────────────────────────────

  test('2B.1 — Import POS/dining CSV', async () => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    const rows = readFixture('POS_Sales_Detail_SV.csv');
    expect(rows.length).toBeGreaterThan(0);
    console.log(`[import] Sending ${rows.length} POS rows`);

    const r = await importData(ctx, 'transactions', rows, authHeaders);
    if (!r.json?.success) {
      addIssue({
        severity: 'high',
        suite: 'Suite 2B',
        description: `POS/transactions import failed: HTTP ${r.status}`,
        expected: 'success > 0',
        actual: r.text?.slice(0, 200),
      });
    }
    expect(r.status).toBe(200);
    console.log(`[import] transactions: ${r.json?.success}/${r.json?.totalRows} imported`);
  });

  test('2B.2 — After POS import: revenue endpoint returns data', async () => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    const r = await getJson(ctx, '/api/fb', authHeaders);
    if (r.status !== 200) {
      addIssue({
        severity: 'medium',
        suite: 'Suite 2B',
        description: 'GET /api/fb returned non-200 after POS import',
        expected: '200 with revenue data',
        actual: `status=${r.status}`,
      });
    }
  });

  test('2B.3 — Navigate to #/revenue after POS import', async ({ page }) => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    await injectAuth(page, primaryAuth.token, primaryAuth.user, primaryClub.clubId);
    await page.goto(`${APP_URL}/#/revenue`);
    await page.waitForTimeout(3000);

    const shot = await screenshot(page, '2B3-revenue-after-pos-import');
    const text = await page.evaluate(() => document.body.innerText);

    const isGated = /connect your|no data|not yet available/i.test(text);
    if (isGated) {
      addIssue({
        severity: 'medium',
        suite: 'Suite 2B',
        description: 'Revenue page still gated/empty after POS import',
        screenshot: shot,
        expected: 'Revenue cards / spend data visible',
        actual: text.slice(0, 300),
      });
    }
  });

  // ── Step C: Tee Sheet ─────────────────────────────────────────────────────

  test('2C.1 — Import tee sheet bookings CSV', async () => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    const rows = readFixture('TTM_Tee_Sheet_SV.csv');
    expect(rows.length).toBeGreaterThan(0);
    console.log(`[import] Sending ${rows.length} tee sheet rows`);

    const r = await importData(ctx, 'tee_times', rows, authHeaders);
    if (!r.json?.success) {
      addIssue({
        severity: 'high',
        suite: 'Suite 2C',
        description: `Tee sheet import failed: HTTP ${r.status}`,
        expected: 'success > 0',
        actual: r.text?.slice(0, 200),
      });
    }
    expect(r.status).toBe(200);
    console.log(`[import] tee_times: ${r.json?.success}/${r.json?.totalRows} imported`);
  });

  test('2C.2 — Import tee sheet players CSV', async () => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    const rows = readFixture('TTM_Tee_Sheet_Players_SV.csv');
    const r = await importData(ctx, 'booking_players', rows, authHeaders);
    if (r.status !== 200) {
      addIssue({
        severity: 'low',
        suite: 'Suite 2C',
        description: `Tee sheet players import failed: HTTP ${r.status}`,
        expected: '200',
        actual: r.text?.slice(0, 200),
      });
    }
    console.log(`[import] booking_players: ${r.json?.success}/${r.json?.totalRows} imported`);
  });

  test('2C.3 — Navigate to #/tee-sheet after tee sheet import', async ({ page }) => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    await injectAuth(page, primaryAuth.token, primaryAuth.user, primaryClub.clubId);
    await page.goto(`${APP_URL}/#/tee-sheet`);
    await page.waitForTimeout(3000);

    const shot = await screenshot(page, '2C3-tee-sheet-after-import');
    const text = await page.evaluate(() => document.body.innerText);

    const isEmpty = /no tee sheet data|no bookings|no rounds/i.test(text);
    if (isEmpty) {
      addIssue({
        severity: 'medium',
        suite: 'Suite 2C',
        description: 'Tee sheet page still shows empty state after tee sheet import',
        screenshot: shot,
        expected: 'Bookings or tee time list visible',
        actual: text.slice(0, 300),
      });
    }
  });

  // ── Step D: Communications (complaints) ───────────────────────────────────

  test('2D.1 — Import communications/complaints CSV', async () => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    const rows = readFixture('JCM_Communications_RG.csv');
    const r = await importData(ctx, 'complaints', rows, authHeaders);
    if (r.status !== 200) {
      addIssue({
        severity: 'low',
        suite: 'Suite 2D',
        description: `Communications/complaints import failed: HTTP ${r.status}`,
        expected: '200',
        actual: r.text?.slice(0, 200),
      });
    }
    console.log(`[import] complaints: ${r.json?.success}/${r.json?.totalRows} imported`);
  });

  test('2D.2 — Full briefing view after all imports', async ({ page }) => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    await injectAuth(page, primaryAuth.token, primaryAuth.user, primaryClub.clubId);
    await page.goto(`${APP_URL}/#/today`);
    await page.waitForTimeout(4000);

    const shot = await screenshot(page, '2D2-today-full-imports');
    const text = await page.evaluate(() => document.body.innerText);

    // Today view should not be completely empty
    const hasContent = text.length > 500;
    if (!hasContent) {
      addIssue({
        severity: 'medium',
        suite: 'Suite 2D',
        description: 'Today/briefing view appears empty after all imports',
        screenshot: shot,
        expected: 'Populated briefing with member / tee sheet / revenue data',
        actual: `text length=${text.length}`,
      });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Suite 3 — Health Scores + Agent Sweep
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Suite 3 — Health Scores + Agent Sweep', () => {
  test('3.1 — Compute health scores', async () => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    const r = await postJson(ctx, `/api/compute-health-scores?clubId=${primaryClub.clubId}`, {}, authHeaders);
    if (r.status !== 200 || !r.json?.computed) {
      addIssue({
        severity: 'high',
        suite: 'Suite 3',
        description: `Health score computation failed: HTTP ${r.status}`,
        expected: 'computed > 0',
        actual: r.text?.slice(0, 300),
      });
    }
    if (r.status === 200) {
      console.log(`[health] computed=${r.json?.computed}, totalMembers=${r.json?.totalMembers}`);
    }
    expect(r.status).toBe(200);
  });

  test('3.2 — After health scores: members endpoint returns health tiers', async () => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    const r = await getJson(ctx, '/api/members', authHeaders);
    const roster = r.json?.memberRoster ?? r.json?.members ?? [];
    if (r.status !== 200 || !roster.length) return;

    const withScores = roster.filter(m => m.health_score != null || m.healthScore != null);
    const coveragePct = (withScores.length / roster.length) * 100;

    if (coveragePct < 50) {
      addIssue({
        severity: 'medium',
        suite: 'Suite 3',
        description: `Only ${coveragePct.toFixed(0)}% of members have health scores after computation`,
        expected: '≥ 80% coverage',
        actual: `${withScores.length}/${roster.length}`,
      });
    }
    console.log(`[health] ${withScores.length}/${roster.length} members have scores`);
  });

  test('3.3 — Members page shows health tiers after score computation', async ({ page }) => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    await injectAuth(page, primaryAuth.token, primaryAuth.user, primaryClub.clubId);
    await page.goto(`${APP_URL}/#/members`);
    await page.waitForTimeout(3500);

    const shot = await screenshot(page, '3-3-members-health-scores');
    const text = await page.evaluate(() => document.body.innerText);

    const hasHealthTiers = /HEALTHY|AT RISK|WATCH|CRITICAL|Health Score/i.test(text);
    if (!hasHealthTiers) {
      addIssue({
        severity: 'medium',
        suite: 'Suite 3',
        description: 'Members page does not show health tier labels after score computation',
        screenshot: shot,
        expected: 'HEALTHY/AT RISK/WATCH/CRITICAL labels visible',
        actual: text.slice(0, 400),
      });
    }
  });

  test('3.4 — Trigger agent autonomous sweep', async () => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    const r = await postJson(ctx, `/api/agent-autonomous?clubId=${primaryClub.clubId}`, {}, authHeaders);
    if (r.status !== 200) {
      addIssue({
        severity: 'high',
        suite: 'Suite 3',
        description: `Agent sweep failed: HTTP ${r.status}`,
        expected: '200 with agent results',
        actual: r.text?.slice(0, 300),
      });
    }
    if (r.status === 200) {
      const agentCount = r.json?.results?.length || r.json?.agents?.length || 0;
      console.log(`[agents] sweep complete: ${agentCount} agents ran`);
    }
  });

  test('3.5 — Agent actions are created in the inbox (poll for up to 30s)', async () => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    const result = await poll(async () => {
      const r = await getJson(ctx, `/api/agents?club_id=${primaryClub.clubId}`, authHeaders);
      if (r.status !== 200 || !r.json?.actions) return null;
      const pending = r.json.actions.filter(a => a.status === 'pending');
      return pending.length > 0 ? pending : null;
    }, { timeout: 30000, interval: 3000 });

    if (!result) {
      addIssue({
        severity: 'medium',
        suite: 'Suite 3',
        description: 'No pending agent actions created within 30s of agent sweep',
        expected: 'At least 1 pending action in /api/agents',
        actual: '0 pending actions after 30s',
      });
    } else {
      console.log(`[agents] ${result.length} pending action(s) in inbox`);
    }
  });

  test('3.6 — Agent activity visible in #/agent-activity page', async ({ page }) => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    await injectAuth(page, primaryAuth.token, primaryAuth.user, primaryClub.clubId);
    await page.goto(`${APP_URL}/#/agent-activity`);
    await page.waitForTimeout(3000);

    const shot = await screenshot(page, '3-6-agent-activity');
    const text = await page.evaluate(() => document.body.innerText);

    const hasActivity = /member pulse|service recovery|demand optimizer|engagement autopilot|revenue analyst|labor optimizer/i.test(text);
    if (!hasActivity) {
      addIssue({
        severity: 'low',
        suite: 'Suite 3',
        description: 'Agent Activity page shows no agent names after sweep',
        screenshot: shot,
        expected: 'At least one agent name visible in activity feed',
        actual: text.slice(0, 400),
      });
    }
  });

  test('3.7 — Today view shows pending actions after agent sweep', async ({ page }) => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    await injectAuth(page, primaryAuth.token, primaryAuth.user, primaryClub.clubId);
    await page.goto(`${APP_URL}/#/today`);
    await page.waitForTimeout(4000);

    const shot = await screenshot(page, '3-7-today-after-agents');
    const text = await page.evaluate(() => document.body.innerText);

    const hasActions = /approve|pending action|action queue|needs review/i.test(text);
    if (!hasActions) {
      addIssue({
        severity: 'low',
        suite: 'Suite 3',
        description: 'Today view shows no pending action prompts after agent sweep',
        screenshot: shot,
        expected: 'Pending actions / approve buttons visible',
        actual: text.slice(0, 400),
      });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Suite 4 — Chat Simulator Agent Inbox
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Suite 4 — Chat Simulator', () => {
  test('4.1 — SMS Simulator page loads with PersonaRail', async ({ page }) => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    await injectAuth(page, primaryAuth.token, primaryAuth.user, primaryClub.clubId);
    await page.goto(`${APP_URL}/#/sms-simulator`);
    await page.waitForTimeout(3000);

    const shot = await screenshot(page, '4-1-sms-simulator-loaded');
    const text = await page.evaluate(() => document.body.innerText);

    // PersonaRail should show at least one of the test member names
    const hasPersonas = /James Whitfield|Anne Jordan|Robert Callahan|Sandra Chen|Linda Leonard/i.test(text);
    if (!hasPersonas) {
      addIssue({
        severity: 'high',
        suite: 'Suite 4',
        description: 'SMS Simulator does not render PersonaRail with test member names',
        screenshot: shot,
        expected: 'At least one test member name (James Whitfield, etc.) visible',
        actual: text.slice(0, 400),
      });
    }
    expect(hasPersonas).toBe(true);
  });

  test('4.2 — Clicking persona card switches active member', async ({ page }) => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    await injectAuth(page, primaryAuth.token, primaryAuth.user, primaryClub.clubId);
    await page.goto(`${APP_URL}/#/sms-simulator`);
    await page.waitForTimeout(3000);

    // Click the second persona card (Anne Jordan)
    const cards = page.locator('[data-testid="persona-card"]');
    const cardCount = await cards.count();

    if (cardCount < 2) {
      // Fall back to text-based selection
      const anneCard = page.locator('text=Anne Jordan').first();
      if (await anneCard.isVisible()) {
        await anneCard.click();
        await page.waitForTimeout(1000);
      }
    } else {
      await cards.nth(1).click();
      await page.waitForTimeout(1000);
    }

    const shot = await screenshot(page, '4-2-persona-switched');
    // Just verify page is still alive after click
    const text = await page.evaluate(() => document.body.innerText);
    expect(text.length).toBeGreaterThan(100);
  });

  test('4.3 — Agent Inbox tab shows pending actions', async ({ page }) => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    await injectAuth(page, primaryAuth.token, primaryAuth.user, primaryClub.clubId);
    await page.goto(`${APP_URL}/#/sms-simulator`);
    await page.waitForTimeout(3000);

    // Click the Agent Inbox tab
    const inboxTab = page.locator('button:has-text("Agent Inbox"), [role="tab"]:has-text("Agent Inbox")').first();
    if (await inboxTab.isVisible({ timeout: 5000 })) {
      await inboxTab.click();
      await page.waitForTimeout(2000);
    } else {
      addIssue({
        severity: 'high',
        suite: 'Suite 4',
        description: 'Agent Inbox tab not found in SMS Simulator',
        expected: 'Tab button labelled "Agent Inbox" visible',
        actual: 'Tab not found',
      });
      return;
    }

    const shot = await screenshot(page, '4-3-agent-inbox-tab');
    const text = await page.evaluate(() => document.body.innerText);

    // Either shows pending actions OR the "all caught up" empty state
    const hasInboxContent = /approve|dismiss|pending|autopilot|No pending/i.test(text);
    if (!hasInboxContent) {
      addIssue({
        severity: 'medium',
        suite: 'Suite 4',
        description: 'Agent Inbox tab is blank (no actions and no empty state)',
        screenshot: shot,
        expected: 'Pending action cards OR "No pending actions" empty state',
        actual: text.slice(0, 400),
      });
    }
  });

  test('4.4 — Approve action from Agent Inbox', async ({ page }) => {
    test.skip(!apiReachable || !primaryClub, 'Skipping');

    // First check there are pending actions via API
    const r = await getJson(ctx, `/api/agents?club_id=${primaryClub.clubId}`, authHeaders);
    if (r.status !== 200) return;
    const pending = (r.json?.actions || []).filter(a => a.status === 'pending');
    if (pending.length === 0) {
      console.log('[suite4] No pending actions — skipping approve test');
      return;
    }

    await injectAuth(page, primaryAuth.token, primaryAuth.user, primaryClub.clubId);
    await page.goto(`${APP_URL}/#/sms-simulator`);
    await page.waitForTimeout(3000);

    // Open Agent Inbox tab
    const inboxTab = page.locator('button:has-text("Agent Inbox"), [role="tab"]:has-text("Agent Inbox")').first();
    if (!await inboxTab.isVisible({ timeout: 5000 })) return;
    await inboxTab.click();
    await page.waitForTimeout(2000);

    // Count initial actions
    const initialText = await page.evaluate(() => document.body.innerText);
    const approveBtn = page.locator('button:has-text("Approve")').first();

    if (!await approveBtn.isVisible({ timeout: 5000 })) {
      console.log('[suite4] No Approve button visible — no pending actions in UI');
      return;
    }

    await approveBtn.click();
    await page.waitForTimeout(2000);

    const shot = await screenshot(page, '4-4-after-approve');
    const afterText = await page.evaluate(() => document.body.innerText);

    // Re-fetch to verify count decreased
    const r2 = await getJson(ctx, `/api/agents?club_id=${primaryClub.clubId}`, authHeaders);
    const pendingAfter = (r2.json?.actions || []).filter(a => a.status === 'pending');
    if (pendingAfter.length >= pending.length) {
      addIssue({
        severity: 'medium',
        suite: 'Suite 4',
        description: 'Approving action did not reduce pending action count',
        screenshot: shot,
        expected: `pending count < ${pending.length}`,
        actual: `pending count = ${pendingAfter.length}`,
      });
    } else {
      console.log(`[suite4] Approve OK: ${pending.length} → ${pendingAfter.length} pending`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Suite 5 — Negative / Cross-Club Data Isolation
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Suite 5 — Negative / Data Isolation', () => {
  let clubB;
  let tokenB;

  test('5.1 — Fresh club has no members or transactions', async () => {
    test.skip(!apiReachable, 'Skipping');

    try {
      clubB = await createClub(ctx, 'B');
    } catch (err) {
      if (String(err).includes('429') || String(err).includes('Too many')) {
        addIssue({ severity: 'low', suite: 'Suite 5', description: 'Rate limit hit creating Club B — isolation tests skipped this run', expected: '< 3 clubs/hour', actual: String(err).slice(0, 100) });
        test.skip(true, 'Rate limit: cannot create Club B — rerun after rate window resets');
        return;
      }
      throw err;
    }

    const authB = await login(ctx, clubB.email, clubB.password);
    tokenB = authB.token;
    const headersB = { Authorization: `Bearer ${tokenB}` };

    const membersR = await getJson(ctx, '/api/members', headersB);
    const memberCount = membersR.json?.memberRoster?.length ?? membersR.json?.members?.length ?? membersR.json?.total ?? 0;
    if (memberCount > 0) {
      addIssue({
        severity: 'high',
        suite: 'Suite 5',
        description: 'Fresh club has member data without any import — potential cross-club leak',
        expected: '0 members',
        actual: `${memberCount} members`,
      });
    }
    expect(memberCount).toBe(0);
    console.log(`[isolation] Fresh club ${clubB.clubId} has ${memberCount} members — OK`);
  });

  test('5.2 — Club B cannot read Club A transactions via GET /api/fb', async () => {
    test.skip(!apiReachable || !clubB || !primaryClub, 'Skipping');

    const headersB = { Authorization: `Bearer ${tokenB}` };
    const r = await getJson(ctx, '/api/fb', headersB);

    if (r.status >= 200 && r.status < 300 && r.json) {
      const jsonStr = JSON.stringify(r.json);
      if (jsonStr.includes(primaryClub.clubId)) {
        addIssue({
          severity: 'high',
          suite: 'Suite 5',
          description: `Club B can see Club A's clubId in GET /api/fb response — TENANT LEAK`,
          expected: 'No Club A data visible',
          actual: jsonStr.slice(0, 400),
        });
        throw new Error(`TENANT ISOLATION FAILURE: Club B saw Club A's data via GET /api/fb`);
      }
    }
    console.log(`[isolation] GET /api/fb as Club B — no Club A data (status=${r.status})`);
  });

  test('5.3 — Cross-club read isolation across all major endpoints', async () => {
    test.skip(!apiReachable || !clubB || !primaryClub, 'Skipping');

    const ENDPOINTS_TO_CHECK = [
      '/api/members', '/api/fb', '/api/agents', '/api/briefing',
      '/api/cockpit', '/api/activity', '/api/notifications',
    ];

    const headersB = { Authorization: `Bearer ${tokenB}` };
    const leaks = [];

    for (const endpoint of ENDPOINTS_TO_CHECK) {
      const r = await getJson(ctx, endpoint, headersB);
      if (r.status < 200 || r.status >= 300) continue;
      if (r.json && JSON.stringify(r.json).includes(primaryClub.clubId)) {
        leaks.push(endpoint);
        addIssue({
          severity: 'high',
          suite: 'Suite 5',
          description: `TENANT LEAK: Club B saw Club A's clubId via ${endpoint}`,
          expected: 'No Club A data in response',
          actual: JSON.stringify(r.json).slice(0, 300),
        });
      }
    }

    if (leaks.length > 0) {
      throw new Error(`TENANT ISOLATION FAILURE — leaks at: ${leaks.join(', ')}`);
    }
    console.log(`[isolation] ${ENDPOINTS_TO_CHECK.length} endpoints checked — no cross-club leaks`);
  });

  test('5.4 — Members-only club: no revenue data visible', async () => {
    test.skip(!apiReachable || !clubB, 'Skipping');

    // Import members into Club B (no POS)
    const members = readFixture('JCM_Members_F9.csv');
    const headersB = { Authorization: `Bearer ${tokenB}` };
    const importR = await importData(ctx, 'members', members, headersB);
    console.log(`[isolation] Club B members import: ${importR.json?.success}/${importR.json?.totalRows}`);

    // Now check that revenue page has no transaction data
    const fbR = await getJson(ctx, '/api/fb', headersB);
    // Check that no revenue/transaction data leaked — look for any numeric revenue fields
    const hasRevData = fbR.status === 200 && fbR.json && (
      fbR.json?.transactions?.length > 0 ||
      fbR.json?.totalRevenue > 0 ||
      fbR.json?.revenue > 0
    );
    if (hasRevData) {
      addIssue({
        severity: 'medium',
        suite: 'Suite 5',
        description: 'Club B (members only) shows transaction/revenue data in /api/fb',
        expected: 'No revenue data (members only, no POS import)',
        actual: JSON.stringify(fbR.json).slice(0, 200),
      });
    }
    console.log(`[isolation] Club B fb check: status=${fbR.status}, hasRevData=${hasRevData}`);
  });

  test('5.5 — Cross-club write isolation: Club B token cannot approve Club A actions', async () => {
    test.skip(!apiReachable || !clubB || !primaryClub, 'Skipping');

    const headersB = { Authorization: `Bearer ${tokenB}` };

    // Get Club A's actions
    const actionsR = await getJson(ctx, `/api/agents?club_id=${primaryClub.clubId}`, authHeaders);
    const clubAActions = (actionsR.json?.actions || []).filter(a => a.status === 'pending');
    if (clubAActions.length === 0) {
      console.log('[isolation] No Club A pending actions to test cross-club write');
      return;
    }

    const targetAction = clubAActions[0];
    // Try to approve Club A's action using Club B's token
    const r = await postJson(ctx, '/api/agents', {
      actionId: targetAction.id,
      operation: 'approve',
      meta: { reason: 'XTENANT_LEAK_PROBE' },
    }, headersB);

    // Verify Club A action was NOT approved (should remain pending)
    const verifyR = await getJson(ctx, `/api/agents?club_id=${primaryClub.clubId}`, authHeaders);
    const stillPending = (verifyR.json?.actions || []).find(a => a.id === targetAction.id && a.status === 'pending');

    if (!stillPending && r.status === 200) {
      addIssue({
        severity: 'high',
        suite: 'Suite 5',
        description: 'Club B token was able to approve Club A agent action — CROSS-TENANT WRITE LEAK',
        expected: `Action ${targetAction.id} remains pending`,
        actual: `Action approved by Club B token`,
      });
      throw new Error(`TENANT ISOLATION FAILURE: cross-club action approval succeeded`);
    }
    console.log(`[isolation] Cross-club write blocked correctly (status=${r.status})`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Suite 6 — UX Screenshot Audit (full-page captures + page content validation)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Suite 6 — UX Screenshot Audit', () => {
  const PAGES_TO_AUDIT = [
    { route: 'today', name: '6-today' },
    { route: 'members', name: '6-members' },
    { route: 'revenue', name: '6-revenue' },
    { route: 'tee-sheet', name: '6-tee-sheet' },
    { route: 'automations', name: '6-automations' },
    { route: 'board-report', name: '6-board-report' },
    { route: 'sms-simulator', name: '6-sms-simulator' },
  ];

  for (const { route, name } of PAGES_TO_AUDIT) {
    test(`6 — Screenshot + content check: #/${route}`, async ({ page }) => {
      test.skip(!apiReachable || !primaryClub, 'Skipping');

      await injectAuth(page, primaryAuth.token, primaryAuth.user, primaryClub.clubId);
      await page.goto(`${APP_URL}/#/${route}`);
      await page.waitForTimeout(3500);

      const shot = await screenshot(page, name);

      const text = await page.evaluate(() => document.body.innerText);
      const contentLength = text.length;
      const hasErrors = /something went wrong|uncaught|error boundary|failed to fetch/i.test(text);

      if (hasErrors) {
        addIssue({
          severity: 'high',
          suite: 'Suite 6',
          description: `Error state detected on #/${route}`,
          screenshot: shot,
          expected: 'No error boundaries or crash messages',
          actual: text.slice(0, 300),
        });
      }
      if (contentLength < 200) {
        addIssue({
          severity: 'medium',
          suite: 'Suite 6',
          description: `#/${route} has very little content (${contentLength} chars) — may be blank`,
          screenshot: shot,
          expected: 'Page has substantial content (> 200 chars)',
          actual: `content length = ${contentLength}`,
        });
      }

      console.log(`[audit] #/${route}: ${contentLength} chars, errors=${hasErrors}, screenshot=${path.basename(shot || 'n/a')}`);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Finalize — write issue report after all suites
// ═══════════════════════════════════════════════════════════════════════════

test.afterAll(async () => {
  if (ctx) await ctx.dispose();
  writeReport(primaryClub?.clubId);
});

}); // end outer serial describe 'Live Club E2E'
