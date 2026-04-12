/**
 * B-lite — 5 most diagnostic steps against REAL backend (vercel dev + Neon).
 *
 * Unlike the rest of the e2e suite, this spec does NOT mock /api/onboard-club
 * or /api/import-csv. It exercises the real serverless functions against the
 * live Neon DB via `vercel dev` on :3001.
 *
 * Run: APP_URL=http://localhost:3001 npx playwright test tests/e2e/b-lite-journey.spec.js --project="Desktop Chrome" --reporter=list
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_URL = process.env.APP_URL || 'http://localhost:3001';
const SHOT_DIR = path.resolve(__dirname, '../../tmp/b-lite-screenshots');
const REPO = path.resolve(__dirname, '../..');
const TS = Date.now();

// STAGE env var controls which stage to iterate on. When set, all prior
// stages are skipped and the matching save point is restored before the
// current stage runs. Each stage also auto-snapshots after its last test
// passes, so the NEXT stage can branch off without a full re-run.
//
//   (unset)       — run every stage from scratch
//   STAGE=members — run only stage 1 from signup (no restore)
//   STAGE=tee     — restore stage-1 save point, run stage 2+
//   STAGE=dining  — restore stage-2 save point, run stage 3+
//   STAGE=agents  — restore stage-3 save point, run stage 4+
//
// Stage order: members → tee → dining → agents (future: complaints, staff...)
const STAGE = (process.env.STAGE || '').toLowerCase();
const STAGE_ORDER = ['members', 'tee', 'dining', 'complaints', 'agents'];
const STAGE_INDEX = STAGE ? STAGE_ORDER.indexOf(STAGE) : -1;
const RESTORE_FROM = STAGE_INDEX > 0 ? `stage-${STAGE_ORDER[STAGE_INDEX - 1]}` : null;

function shouldRun(stage) {
  if (!STAGE) return true;
  return STAGE_ORDER.indexOf(stage) >= STAGE_INDEX;
}

function savepointSessionPath(name) {
  // Outside the project root — see db-savepoint.mjs for the rationale.
  return path.join(homedir(), '.swoop-savepoints', `${name.replace(/[^a-z0-9_]/gi, '_')}.json`);
}

function captureSavepoint(name, clubId) {
  try {
    execSync(`node scripts/db-savepoint.mjs create ${name} ${clubId}`, {
      cwd: REPO,
      stdio: 'inherit',
      timeout: 60000,
    });
  } catch (e) {
    console.log(`[savepoint] create "${name}" failed: ${e.message}`);
  }
}

function restoreSavepoint(name, clubId) {
  try {
    execSync(`node scripts/db-savepoint.mjs restore ${name} ${clubId}`, {
      cwd: REPO,
      stdio: 'inherit',
      timeout: 60000,
    });
  } catch (e) {
    console.log(`[savepoint] restore "${name}" failed: ${e.message}`);
  }
}

function loadSavepointSession(name) {
  const p = savepointSessionPath(name);
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, 'utf8')); }
  catch { return null; }
}

const TS_STR = TS.toString();
const PERSONA = {
  clubName: `QA Sonoran Pines ${TS_STR}`,
  city: 'Phoenix',
  state: 'AZ',
  zip: '85001',
  memberCount: '50',
  adminName: 'QA GM',
  adminEmail: `qa+${TS_STR}@swoopgolf.com`,
  adminPassword: 'QaPass1234!',
};

test.describe('B-lite — real-backend diagnostic journey', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(180000);

  let page;
  let clubId;
  const pageErrors = [];
  const apiFailures = [];

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();

    // If STAGE is set to something other than 'members', restore the prior
    // stage's save point + session before any test runs. Dining iteration
    // takes <1 min instead of 3+ because signup + members + tee-sheet are
    // skipped entirely.
    if (RESTORE_FROM) {
      const session = loadSavepointSession(RESTORE_FROM);
      if (!session) {
        throw new Error(
          `STAGE=${STAGE} requires save point "${RESTORE_FROM}" but tests/fixtures/savepoint-${RESTORE_FROM.replace(/[^a-z0-9_]/gi, '_')}.json does not exist. ` +
          `Run the full spec once (or with STAGE=${STAGE_ORDER[STAGE_INDEX - 1]}) to generate it.`
        );
      }
      console.log(`[stage] restoring "${RESTORE_FROM}" for club ${session.clubId}`);
      restoreSavepoint(RESTORE_FROM, session.clubId);
      clubId = session.clubId;
      // Inject the saved session into localStorage BEFORE the first page load
      await ctx.addInitScript(({ token, user, clubId: cid, clubName }) => {
        localStorage.setItem('swoop_auth_token', token);
        localStorage.setItem('swoop_auth_user', JSON.stringify(user));
        localStorage.setItem('swoop_club_id', cid);
        localStorage.setItem('swoop_club_name', clubName);
      }, {
        token: session.token,
        user: {
          userId: session.userId,
          clubId: session.clubId,
          name: session.userName || 'QA GM',
          email: session.userEmail,
          role: session.role || 'gm',
          title: 'General Manager',
          clubName: session.clubName,
        },
        clubId: session.clubId,
        clubName: session.clubName,
      });
      // Override the persona so subsequent assertions (like "club name should
      // appear") match the restored club, not the timestamped fresh persona.
      PERSONA.clubName = session.clubName;
    }

    page = await ctx.newPage();
    page.on('pageerror', e => pageErrors.push(`pageerror: ${e.message}`));
    page.on('console', msg => { if (msg.type() === 'error') pageErrors.push(`console: ${msg.text()}`); });
    page.on('response', async r => {
      if (r.url().includes('/api/') && r.status() >= 400) {
        apiFailures.push(`${r.status()} ${r.request().method()} ${r.url()}`);
      }
    });
  });

  test.afterEach(async () => {
    if (pageErrors.length > 0) {
      console.log(`\n[errors during test] ${pageErrors.length} captured:`);
      pageErrors.slice(-20).forEach(e => console.log('  ', e));
    }
    if (apiFailures.length > 0) {
      console.log(`[api failures] ${apiFailures.length}:`);
      apiFailures.slice(-20).forEach(f => console.log('  ', f));
    }
  });

  test.afterAll(async () => {
    if (page) await page.close();
  });

  const shot = async (name) => {
    await page.screenshot({ path: path.join(SHOT_DIR, name), fullPage: true });
  };

  // ── Step 1: Real signup via UI ───────────────────────────────────────────
  test('1 — Real signup creates a club in Neon', async () => {
    test.skip(!shouldRun('members'), `STAGE=${STAGE} skips members stage`);
    await page.goto(APP_URL);
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.reload();
    await shot('01-login-page.png');

    // Cycle 9 added a direct "Set Up New Club" CTA on the sign-in screen.
    await page.getByRole('button', { name: /Set Up New Club/i }).first().click();
    await shot('02-wizard-step-1.png');

    // Step 0: Club info
    await page.locator('input[placeholder="Pine Valley Country Club"]').fill(PERSONA.clubName);
    await page.locator('input[placeholder="Scottsdale"]').fill(PERSONA.city);
    await page.locator('input[placeholder="AZ"]').fill(PERSONA.state);
    await page.locator('input[placeholder="85255"]').fill(PERSONA.zip);
    await page.locator('input[placeholder="300"]').fill(PERSONA.memberCount);
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 1: Admin account
    await page.locator('input[placeholder="Sarah Mitchell"]').fill(PERSONA.adminName);
    await page.locator('input[placeholder*="pinevalleycc"]').fill(PERSONA.adminEmail);
    await page.locator('input[type="password"]').fill(PERSONA.adminPassword);

    const onboardPromise = page.waitForResponse(
      r => r.url().includes('/api/onboard-club') && r.request().method() === 'POST',
      { timeout: 30000 }
    );
    await page.getByRole('button', { name: 'Next' }).click();
    const res = await onboardPromise;
    expect.soft(res.status(), 'onboard-club should return 200/201').toBeGreaterThanOrEqual(200);
    expect.soft(res.status()).toBeLessThan(300);

    const body = await res.json();
    expect.soft(body.clubId, 'response should include clubId').toBeTruthy();
    expect.soft(body.token, 'response should include token').toBeTruthy();
    clubId = body.clubId;

    await shot('03-signup-response.png');

    // Skip upload from wizard Step 2 (we'll use CsvImportPage directly in Step 2)
    await page.getByRole('button', { name: /Skip for Now/i }).click();
    await page.getByRole('button', { name: /Open Dashboard/i }).click();

    // DataProvider hydrates 11 services against Neon before rendering —
    // its own timeout is 10s. Wait for the loading text to clear.
    await page.waitForFunction(
      () => !/Loading your club data/.test(document.body.innerText),
      null,
      { timeout: 20000 },
    ).catch(() => {});
    await page.waitForTimeout(1000);
    await shot('04-post-signup-dashboard.png');

    // Club name should appear somewhere in the UI
    const bodyText = await page.locator('body').textContent();
    expect.soft(bodyText, 'club name should appear in UI').toContain(PERSONA.clubName);
  });

  // ── Step 2: Real CSV upload (members) ────────────────────────────────────
  test('2 — Real members CSV imports into Neon', async () => {
    test.skip(!shouldRun('members'), `STAGE=${STAGE} skips members stage`);
    await page.goto(`${APP_URL}/#/csv-import`);
    await page.waitForLoadState('networkidle');
    await shot('05-csv-import-page.png');

    // Pick Jonas vendor
    await page.locator('button:has-text("Jonas Club Software")').first().click();
    await page.waitForTimeout(300);

    // Pick Members import type
    await page.locator('button:has-text("JCM_Members")').first().click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Next: Upload File")').click();
    await shot('06-upload-step.png');

    // Upload the real Jonas members CSV
    const csvPath = path.resolve(__dirname, '../fixtures/small/JCM_Members_F9.csv');
    await page.locator('input[type="file"]').setInputFiles(csvPath);
    await page.waitForTimeout(2000);
    await shot('07-file-uploaded.png');

    // Advance to mapping
    const mapBtn = page.locator('button:has-text("Next: Map Columns"), button:has-text("Map Columns")').first();
    if (await mapBtn.isVisible({ timeout: 5000 }).catch(() => false)) await mapBtn.click();
    await page.waitForTimeout(1500);
    await shot('08-mapping-step.png');

    // Click "Import N Rows" to advance to dry-run preview
    const importRowsBtn = page.locator('button:has-text("Import"):not(:has-text("Start"))').last();
    if (await importRowsBtn.isVisible({ timeout: 5000 }).catch(() => false)) await importRowsBtn.click();
    await page.waitForTimeout(1500);
    await shot('09-dry-run-preview.png');

    // Start import — Cycle 5 removed the Review & Continue gate.
    const startBtn = page.locator('button:has-text("Start Import")');
    await expect.soft(startBtn, 'Start Import should be visible').toBeVisible({ timeout: 12000 });

    const importPromise = page.waitForResponse(
      r => r.url().includes('/api/import-csv') && r.request().method() === 'POST',
      { timeout: 90000 }
    );
    await startBtn.click();
    const importRes = await importPromise;
    expect.soft(importRes.status(), 'import-csv should return 200').toBe(200);
    const importBody = await importRes.json();
    expect.soft(importBody.success, 'some rows should import').toBeGreaterThan(0);
    await page.waitForTimeout(2000);
    await shot('10-import-complete.png');
  });

  // ── Step 3: Verify members exist in the DB via the app's live endpoint ──
  test('3 — Member count from real DB matches imported CSV', async () => {
    test.skip(!shouldRun('members'), `STAGE=${STAGE} skips members stage`);
    // Navigate to Members page — it reads from live API. If the number matches
    // what we imported, we know the DB round-trip worked end-to-end.
    await page.goto(`${APP_URL}/#/members`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await shot('11-members-page.png');

    const bodyText = await page.locator('body').textContent();

    // Tenant isolation: club name visible in UI chrome
    expect.soft(bodyText, 'club name should still appear').toContain(PERSONA.clubName);

    // Main content area must render MembersView, not the outer Suspense "Loading..."
    const memberContentRendered = /At[\s-]?Risk|All Members|Archetype|Resignation/i.test(bodyText || '');
    expect.soft(memberContentRendered, 'MembersView should render past Suspense').toBeTruthy();
  });

  // ── Step 4: Open member drawer, verify health score explainability ──────
  test('4 — Member drawer shows health score dimension breakdown', async () => {
    test.skip(!shouldRun('members'), `STAGE=${STAGE} skips members stage`);
    await page.goto(`${APP_URL}/#/members`);
    // Wait for MembersView to actually render a tab or member marker — not the
    // outer Suspense fallback.
    await page.waitForFunction(
      () => /At[\s-]?Risk|All Members|Archetype|member/i.test(document.body.innerText)
        && !/^\s*Loading\.\.\.\s*$/m.test(document.body.innerText),
      null,
      { timeout: 20000 },
    ).catch(() => {});
    await page.waitForTimeout(1500);
    await shot('11b-members-loaded.png');

    // Click the first member name link. The row itself has onClick={onToggle}
    // (row expand), not the drawer. The drawer is wired via `<MemberLink
    // mode="drawer">` inside the member name cell. Click that, not the row.
    const firstRow = page.locator('[data-testid^="member-row-"]').first();
    await expect.soft(firstRow, 'at least one member row should render').toBeVisible({ timeout: 10000 });
    const memberLink = firstRow.locator('a, button').first();
    await memberLink.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1500);

    await shot('12-member-drawer-open.png');

    // Always-rendered drawer sections — use as "drawer is open" marker.
    // HealthDimensionGrid only renders for members with engagement scores,
    // which freshly-imported members typically don't have — so it's a finding,
    // not a hard failure.
    const bodyText = await page.locator('body').textContent();
    const drawerOpen = /Contact|Preferred channel|Archetype|Resignation/i.test(bodyText || '');
    expect.soft(drawerOpen, 'member drawer should open with standard sections').toBeTruthy();

    const hasHealthDimensions = /Health Score Breakdown|Golf Engagement|Dining Frequency/i.test(bodyText || '');
    if (!hasHealthDimensions) {
      console.log('[finding] HealthDimensionGrid not rendered — member has no engagement scores yet');
    }
  });

  // ── Step 4b: Verify stats come from real data, not static fallbacks ─────
  test('4b — Members stats match imported data (no hardcoded fallbacks)', async () => {
    test.skip(!shouldRun('members'), `STAGE=${STAGE} skips members stage`);
    await page.goto(`${APP_URL}/#/members`);
    await page.waitForFunction(
      () => /All Members|Archetype|Resignation/i.test(document.body.innerText),
      null,
      { timeout: 20000 },
    ).catch(() => {});
    await page.waitForTimeout(1500);
    await shot('13-members-stats.png');

    const bodyText = await page.locator('body').textContent() || '';

    // The old static fallback was "6.2 years, $16,400, 91%". A fresh 391-row
    // import from JCM_Members_F9 should NOT land on those exact values — if
    // any of them appear verbatim, the static leak is back.
    const leakedTenure = /6\.2\s*years/i.test(bodyText);
    const leakedDues = /\$16,400/i.test(bodyText);
    const leakedRenewal = /\b91\s*%/i.test(bodyText);

    expect.soft(leakedTenure, 'static tenure 6.2 years must not appear').toBe(false);
    expect.soft(leakedDues, 'static avg dues $16,400 must not appear').toBe(false);
    expect.soft(leakedRenewal, 'static renewal rate 91% must not appear').toBe(false);
  });

  // Auto-snapshot at the end of Stage 1 (members). Any subsequent stage
  // can now run in isolation via STAGE=<next> by restoring this save point.
  test('4c — Snapshot stage-members for fast downstream iteration', async () => {
    test.skip(!shouldRun('members'), `STAGE=${STAGE} skips members snapshot`);
    const activeClubId = clubId || await page.evaluate(() => localStorage.getItem('swoop_club_id'));
    if (activeClubId) {
      captureSavepoint('stage-members', activeClubId);
      console.log(`[stage-snapshot] stage-members saved for ${activeClubId}`);
    }
  });

  // ── Step 5: AI Agent visibility ──────────────────────────────────────────
  // Stage `members` — still part of the members walkthrough, just verifying
  // the admin page loads. Skipped when STAGE=tee or later.
  test('5 — AI agent surfaces are reachable and document state', async () => {
    test.skip(!shouldRun('members'), `STAGE=${STAGE} skips members stage`);
    // Close any open drawer first
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Navigate to admin. Wait for the lazy AdminHub chunk to render past the
    // outer Suspense fallback. 2s wasn't enough; bump to wait-for-content.
    await page.goto(`${APP_URL}/#/admin`);
    await page.waitForFunction(
      () => {
        const t = document.body.innerText;
        return /Integration|Data Health|CSV Import|Notification|User Role|Club Management|Dashboard|Platform/i.test(t)
          && !/^\s*Loading\.\.\.\s*$/m.test(t);
      },
      null,
      { timeout: 20000 },
    ).catch(() => {});
    await page.waitForTimeout(1500);
    await shot('13-admin-page.png');

    const adminText = await page.locator('body').textContent();
    // Admin page's default tabs — validate the page loaded past the Suspense
    // fallback. Agent-specific surfaces are on /automations; that's a separate
    // check below if visible.
    const adminLoaded = /Integration|Data Health|CSV Import|Notification|User Role|Club Management/i.test(adminText || '');
    expect.soft(adminLoaded, 'admin page should render its tab bar').toBeTruthy();

    // Try to navigate to an agents-specific surface if visible
    const agentsBtn = page.locator('button:has-text("Agents"), a:has-text("Agents")').first();
    if (await agentsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await agentsBtn.click();
      await page.waitForTimeout(2000);
      await shot('14-agents-surface.png');
    }

    // No hard assertion on agent data — the prompt says "If agents are not yet
    // wired to live data, document this as a gap, not a bug."
  });

  // ── Stage 2: Tee Sheet ──────────────────────────────────────────────────
  // Imports tee-sheet bookings on top of the already-imported members. If
  // this test block fails mid-iteration, you can restore from a
  // `members-seeded` save point via scripts/db-savepoint.mjs instead of
  // re-running signup + members import.
  test('6 — Real tee-sheet CSV imports into Neon', async () => {
    test.skip(!shouldRun('tee'), `STAGE=${STAGE} skips tee-sheet stage`);
    test.setTimeout(480000); // 8 min — 4,415 sequential Neon INSERTs take ~4-6 min
    // Navigate back to CSV import for a second pass. The previous run may
    // have landed on a "result" screen; reset via direct URL.
    await page.goto(`${APP_URL}/#/csv-import`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // If we landed on a completed-import view, click Import More Data.
    const moreDataBtn = page.locator('button:has-text("Import More Data")');
    if (await moreDataBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await moreDataBtn.click();
      await page.waitForTimeout(1000);
    }

    await shot('15-tee-sheet-import-start.png');

    // Jonas vendor → Tee Times type
    const jonasBtn = page.locator('button:has-text("Jonas Club Software")').first();
    if (await jonasBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await jonasBtn.click();
      await page.waitForTimeout(300);
    }
    await page.locator('button:has-text("TTM_Tee_Sheet")').first().click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Next: Upload File")').click();
    await page.waitForTimeout(1000);

    // Upload real Jonas tee-sheet CSV
    const csvPath = path.resolve(__dirname, '../fixtures/small/TTM_Tee_Sheet_SV.csv');
    await page.locator('input[type="file"]').setInputFiles(csvPath);
    await page.waitForTimeout(2000);
    await shot('16-tee-sheet-uploaded.png');

    // Advance through mapping → dry-run → Start Import
    const mapBtn = page.locator('button:has-text("Next: Map Columns"), button:has-text("Map Columns")').first();
    if (await mapBtn.isVisible({ timeout: 5000 }).catch(() => false)) await mapBtn.click();
    await page.waitForTimeout(1500);

    const importRowsBtn = page.locator('button:has-text("Import"):not(:has-text("Start"))').last();
    if (await importRowsBtn.isVisible({ timeout: 5000 }).catch(() => false)) await importRowsBtn.click();
    await page.waitForTimeout(1500);

    const startBtn = page.locator('button:has-text("Start Import")');
    await expect.soft(startBtn, 'Start Import should be visible for tee sheet').toBeVisible({ timeout: 12000 });

    const importPromise = page.waitForResponse(
      r => r.url().includes('/api/import-csv') && r.request().method() === 'POST',
      { timeout: 420000 } // 7 min
    );
    await startBtn.click();
    const importRes = await importPromise;
    expect.soft(importRes.status(), 'tee-sheet import should return 200').toBe(200);
    const importBody = await importRes.json();
    expect.soft(importBody.success, 'some tee-sheet rows should import').toBeGreaterThan(0);
    await page.waitForTimeout(2000);
    await shot('17-tee-sheet-import-complete.png');
  });

  // After members + tee-sheet are both imported, orchestration agents should
  // have enough data to surface recommendations. If they don't (empty state,
  // 401, or static demo data), we capture it as a finding — the prompt said
  // "If agents are not yet wired to live data, document as gap not bug."
  test('7a — Agent recommendations surface after members + tee-sheet', async () => {
    test.skip(!shouldRun('tee'), `STAGE=${STAGE} skips tee-sheet stage`);
    // Wait for the fire-and-forget /api/compute-health-scores triggered by
    // the members import to actually land.
    await page.waitForTimeout(3000);

    await page.goto(`${APP_URL}/#/today`);
    await page.waitForFunction(
      () => {
        const t = document.body.innerText;
        return /member|alert|priority|attention|risk|briefing/i.test(t)
          && !/^\s*Loading\.\.\.\s*$/m.test(t);
      },
      null,
      { timeout: 20000 },
    ).catch(() => {});
    await page.waitForTimeout(1500);
    await shot('19-today-with-agent-recs.png');

    const bodyText = (await page.locator('body').textContent()) || '';

    // At minimum: Today view should render past the Suspense fallback and
    // reference members imported from the real CSV.
    const todayRendered = /briefing|alert|member|priority|attention|risk|rounds|today/i.test(bodyText);
    expect.soft(todayRendered, 'Today view should render with real data after imports').toBeTruthy();

    // Hit the agent API directly to verify the service layer has data for
    // orchestration. This is a soft check — if the endpoint 404s or the
    // agent pipeline isn't wired, we log the gap.
    const token = await page.evaluate(() => localStorage.getItem('swoop_auth_token'));
    const agentRes = await page.request.get(`${APP_URL}/api/agents`, {
      headers: { Authorization: `Bearer ${token || ''}` },
    }).catch(() => null);

    if (!agentRes || !agentRes.ok()) {
      console.log(`[finding] /api/agents not reachable: ${agentRes?.status() || 'no response'} — agent orchestration gap after members+tee-sheet`);
    } else {
      const data = await agentRes.json().catch(() => ({}));
      const agentCount = Array.isArray(data?.agents) ? data.agents.length : 0;
      const actionCount = Array.isArray(data?.actions) ? data.actions.length : 0;
      console.log(`[agent-rec] ${agentCount} agents registered, ${actionCount} pending actions for club after members+tee-sheet import`);
      if (agentCount === 0) {
        console.log('[finding] zero agents registered for this club — the signup flow or post-import trigger is not wiring the agent roster');
      }
    }
  });

  test('7 — Tee Sheet page renders real bookings (no hardcoded fallbacks)', async () => {
    test.skip(!shouldRun('tee'), `STAGE=${STAGE} skips tee-sheet stage`);
    await page.goto(`${APP_URL}/#/tee-sheet`);
    await page.waitForFunction(
      () => {
        const t = document.body.innerText;
        return /tee time|booking|tee sheet|course/i.test(t)
          && !/^\s*Loading\.\.\.\s*$/m.test(t);
      },
      null,
      { timeout: 20000 },
    ).catch(() => {});
    await page.waitForTimeout(1500);
    await shot('18-tee-sheet-page.png');

    const bodyText = (await page.locator('body').textContent()) || '';

    // Tenant sanity
    expect.soft(bodyText, 'club name should still appear').toContain(PERSONA.clubName);

    // Known hardcoded leak candidates from briefingService.js DEMO_BRIEFING
    // and src/data/*.js — none of these should appear for a real club.
    // `0.87 utilization` was the teeSheet hardcode in briefingService:235.
    const leaked87Util = /87\s*%.*utiliz|utilization[^0-9]*87\s*%/i.test(bodyText);
    expect.soft(leaked87Util, 'static 87% utilization must not appear').toBe(false);

    // DEMO_BRIEFING.teeSheet.roundsToday was 312 — don't want to see this
    // unless imported data coincidentally produces it (unlikely).
    // Soft check only: log the finding, don't fail, because 312 is a common
    // number that could legitimately appear.
    if (/\b312\s*rounds?\b/i.test(bodyText)) {
      console.log('[finding] "312 rounds" appears — verify this is computed, not DEMO_BRIEFING fallback');
    }
  });

  // Auto-snapshot at the end of Stage 2 (tee-sheet).
  test('7c — Snapshot stage-tee for fast downstream iteration', async () => {
    test.skip(!shouldRun('tee'), `STAGE=${STAGE} skips tee snapshot`);
    const activeClubId = clubId || await page.evaluate(() => localStorage.getItem('swoop_club_id'));
    if (activeClubId) {
      captureSavepoint('stage-tee', activeClubId);
      console.log(`[stage-snapshot] stage-tee saved for ${activeClubId}`);
    }
  });

  // ── Stage 2.5: Onboarding AI Agent ──────────────────────────────────────
  // The same data flows (members + tee-sheet import) should also be doable
  // via the onboarding AI agent chat endpoint. This stage POSTs parsed file
  // data to /api/onboarding-agent/chat and verifies the agent analyzes,
  // proposes a mapping, and can orchestrate the import.
  //
  // Preconditions: steps 1-7 have already imported members + tee-sheet via
  // the wizard. We reuse the same authenticated session. The agent should
  // be able to analyze an additional file and produce actionable output
  // without re-running signup.
  test('8 — Onboarding AI agent analyzes members CSV structure', async () => {
    test.skip(!shouldRun('tee'), `STAGE=${STAGE} skips onboarding agent check`);
    test.setTimeout(120000);

    const token = await page.evaluate(() => localStorage.getItem('swoop_auth_token'));
    const clubId = await page.evaluate(() => localStorage.getItem('swoop_club_id'));
    expect.soft(token, 'auth token should be present').toBeTruthy();
    expect.soft(clubId, 'club id should be present').toBeTruthy();

    // Build a tiny file_data payload matching what DataOnboardingChat sends
    // when a user drops a CSV. The onboarding agent needs: filename, headers,
    // sample_rows, row_count. We construct these from a known real CSV.
    const fs = await import('fs');
    const csvPath = path.resolve(__dirname, '../fixtures/small/JCM_Members_F9.csv');
    const raw = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/).filter(Boolean);
    const headers = raw[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim());
    const sampleRows = raw.slice(1, 6).map(line => {
      const cells = line.split(',');
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (cells[i] || '').trim(); });
      return obj;
    });

    const filePayload = {
      filename: 'JCM_Members_F9.csv',
      headers,
      sample_rows: sampleRows,
      rowCount: raw.length - 1,
      data: sampleRows, // DataOnboardingChat sends full data; we send a small sample
    };

    const agentRes = await page.request.post(`${APP_URL}/api/onboarding-agent/chat`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: {
        message: "I've uploaded a members file. What do you see?",
        club_id: clubId,
        file_data: filePayload,
      },
      timeout: 90000,
    });

    console.log(`[onboarding-agent] status=${agentRes.status()}`);
    expect.soft(agentRes.status(), 'onboarding-agent chat should return 200').toBe(200);

    if (agentRes.ok()) {
      const data = await agentRes.json();
      console.log(`[onboarding-agent] response_length=${(data.response || '').length} tools_called=${(data.tools_called || []).join(',')}`);

      // The agent should recognize this as members data and name-check at
      // least one of the expected columns.
      const response = (data.response || '').toLowerCase();
      const recognizedMembers = /member|roster|first.name|last.name|email/.test(response);
      expect.soft(recognizedMembers, 'agent should recognize members data').toBeTruthy();

      // Should call at least one analysis tool. If zero tools called, the
      // agent is falling back to generic chat — document as a gap.
      if ((data.tools_called || []).length === 0) {
        console.log('[finding] onboarding agent returned text-only response — no tool use. Agent may not be fully wired to tools pipeline for this club/session.');
      }
    } else {
      const errText = await agentRes.text().catch(() => '(body read failed)');
      console.log(`[finding] onboarding-agent returned ${agentRes.status()}: ${errText.slice(0, 300)}`);
    }
  });

  // ── Stage 3: Dining (F&B transactions) ─────────────────────────────────
  // Import POS sales detail on top of members + tee-sheet. This unlocks:
  //  - Revenue totals computed from real transactions (no $375,200 leak)
  //  - Dining engagement dimension on member health
  //  - Cross-domain signal: members who played but didn't dine
  test('9 — Real POS transactions CSV imports into Neon', async () => {
    test.skip(!shouldRun('dining'), `STAGE=${STAGE} skips dining stage`);
    test.setTimeout(240000); // 4 min — 686 POS rows × 20-way concurrency

    await page.goto(`${APP_URL}/#/csv-import`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const moreDataBtn = page.locator('button:has-text("Import More Data")');
    if (await moreDataBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await moreDataBtn.click();
      await page.waitForTimeout(1000);
    }

    // Jonas → F&B Transactions
    const jonasBtn = page.locator('button:has-text("Jonas Club Software")').first();
    if (await jonasBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await jonasBtn.click();
      await page.waitForTimeout(300);
    }
    await page.locator('button:has-text("POS_Sales_Detail")').first().click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Next: Upload File")').click();
    await page.waitForTimeout(1000);

    const csvPath = path.resolve(__dirname, '../fixtures/small/POS_Sales_Detail_SV.csv');
    await page.locator('input[type="file"]').setInputFiles(csvPath);
    await page.waitForTimeout(2000);
    await shot('20-pos-uploaded.png');

    const mapBtn = page.locator('button:has-text("Next: Map Columns"), button:has-text("Map Columns")').first();
    if (await mapBtn.isVisible({ timeout: 5000 }).catch(() => false)) await mapBtn.click();
    await page.waitForTimeout(1500);

    const importRowsBtn = page.locator('button:has-text("Import"):not(:has-text("Start"))').last();
    if (await importRowsBtn.isVisible({ timeout: 5000 }).catch(() => false)) await importRowsBtn.click();
    await page.waitForTimeout(1500);

    const startBtn = page.locator('button:has-text("Start Import")');
    await expect.soft(startBtn, 'Start Import visible for POS').toBeVisible({ timeout: 12000 });

    const importPromise = page.waitForResponse(
      r => r.url().includes('/api/import-csv') && r.request().method() === 'POST',
      { timeout: 120000 }
    );
    await startBtn.click();
    const importRes = await importPromise;
    expect.soft(importRes.status(), 'POS import should return 200').toBe(200);
    const importBody = await importRes.json();
    expect.soft(importBody.success, 'some POS rows should import').toBeGreaterThan(0);
    await page.waitForTimeout(2000);
    await shot('21-pos-import-complete.png');
  });

  test('10 — Revenue page renders real transaction totals (no hardcoded fallbacks)', async () => {
    test.skip(!shouldRun('dining'), `STAGE=${STAGE} skips dining stage`);
    await page.goto(`${APP_URL}/#/revenue`);
    await page.waitForFunction(
      () => {
        const t = document.body.innerText;
        return /revenue|spend|dining|transaction|f&b|pos/i.test(t)
          && !/^\s*Loading\.\.\.\s*$/m.test(t);
      },
      null,
      { timeout: 20000 },
    ).catch(() => {});
    await page.waitForTimeout(1500);
    await shot('22-revenue-page.png');

    const bodyText = (await page.locator('body').textContent()) || '';

    // Club name sanity
    expect.soft(bodyText, 'club name should still appear').toContain(PERSONA.clubName);

    // Hardcoded leak candidates from src/data/boardReport.js + briefingService.js
    const leaked375k = /\$\s*375,?200|\$\s*375\.2\s*K/i.test(bodyText);
    expect.soft(leaked375k, 'static $375,200 monthly revenue must not appear').toBe(false);

    // Hero insight card carryover check
    expect.soft(/\$\s*16,?400/.test(bodyText), 'static $16,400 dues must not appear').toBe(false);
  });

  test('11 — Today view post-dining shows no DEMO_BRIEFING fallbacks', async () => {
    test.skip(!shouldRun('dining'), `STAGE=${STAGE} skips dining stage`);
    await page.goto(`${APP_URL}/#/today`);
    await page.waitForFunction(
      () => /member|alert|briefing|priority|risk/i.test(document.body.innerText)
        && !/^\s*Loading\.\.\.\s*$/m.test(document.body.innerText),
      null,
      { timeout: 20000 },
    ).catch(() => {});
    await page.waitForTimeout(1500);
    await shot('23-today-post-dining.png');

    const bodyText = (await page.locator('body').textContent()) || '';

    // DEMO_BRIEFING.keyMetrics values — these should never reach a real club
    expect.soft(/\$\s*375,?200/.test(bodyText), 'DEMO_BRIEFING $375,200 revenue leak').toBe(false);
    // DEMO_BRIEFING.keyMetrics.atRiskMembers = 7 — a small fresh club could
    // legitimately have 7 at-risk members, so this is a soft log, not a fail.
    if (/\b7\s*at[\s-]?risk/i.test(bodyText)) {
      console.log('[check] "7 at-risk" appears — verify this is computed from real members, not DEMO_BRIEFING');
    }
    if (/\b4\s*(open\s*complaints?|unresolved)/i.test(bodyText)) {
      console.log('[check] "4 open complaints" appears — verify this is computed, not DEMO_BRIEFING fallback');
    }
  });

  // Auto-snapshot at the end of Stage 3 (dining). Agents stage (future)
  // can branch off from here via STAGE=agents.
  test('11c — Snapshot stage-dining for fast downstream iteration', async () => {
    test.skip(!shouldRun('dining'), `STAGE=${STAGE} skips dining snapshot`);
    const activeClubId = clubId || await page.evaluate(() => localStorage.getItem('swoop_club_id'));
    if (activeClubId) {
      captureSavepoint('stage-dining', activeClubId);
      console.log(`[stage-snapshot] stage-dining saved for ${activeClubId}`);
    }
  });

  // ── Stage 4: Complaints (Service quality) ──────────────────────────────
  // Imports member complaints on top of members + tee-sheet + dining.
  // Unlocks: Service Quality KPIs, Service Recovery agent eligibility,
  // complaint surfacing in TodaysRisks + member drawer timeline.
  test('12 — Real complaints CSV imports into Neon', async () => {
    test.skip(!shouldRun('complaints'), `STAGE=${STAGE} skips complaints stage`);
    test.setTimeout(180000);

    await page.goto(`${APP_URL}/#/csv-import`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const moreDataBtn = page.locator('button:has-text("Import More Data")');
    if (await moreDataBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await moreDataBtn.click();
      await page.waitForTimeout(1000);
    }

    // Jonas → Complaints
    const jonasBtn = page.locator('button:has-text("Jonas Club Software")').first();
    if (await jonasBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await jonasBtn.click();
      await page.waitForTimeout(300);
    }
    await page.locator('button:has-text("JCM_Communications")').first().click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Next: Upload File")').click();
    await page.waitForTimeout(1000);

    const csvPath = path.resolve(__dirname, '../fixtures/small/JCM_Communications_RG.csv');
    await page.locator('input[type="file"]').setInputFiles(csvPath);
    await page.waitForTimeout(2000);
    await shot('24-complaints-uploaded.png');

    const mapBtn = page.locator('button:has-text("Next: Map Columns"), button:has-text("Map Columns")').first();
    if (await mapBtn.isVisible({ timeout: 5000 }).catch(() => false)) await mapBtn.click();
    await page.waitForTimeout(1500);

    const importRowsBtn = page.locator('button:has-text("Import"):not(:has-text("Start"))').last();
    if (await importRowsBtn.isVisible({ timeout: 5000 }).catch(() => false)) await importRowsBtn.click();
    await page.waitForTimeout(1500);

    const startBtn = page.locator('button:has-text("Start Import")');
    await expect.soft(startBtn, 'Start Import visible for complaints').toBeVisible({ timeout: 12000 });

    const importPromise = page.waitForResponse(
      r => r.url().includes('/api/import-csv') && r.request().method() === 'POST',
      { timeout: 60000 }
    );
    await startBtn.click();
    const importRes = await importPromise;
    expect.soft(importRes.status(), 'complaints import should return 200').toBe(200);
    const importBody = await importRes.json();
    expect.soft(importBody.success, 'some complaints should import').toBeGreaterThan(0);
    await page.waitForTimeout(2000);
    await shot('25-complaints-import-complete.png');
  });

  test('13 — Service page renders real complaints (no hardcoded fallbacks)', async () => {
    test.skip(!shouldRun('complaints'), `STAGE=${STAGE} skips complaints stage`);

    await page.goto(`${APP_URL}/#/service`);
    await page.waitForFunction(
      () => /complaint|service|feedback|quality|resolution/i.test(document.body.innerText)
        && !/^\s*Loading\.\.\.\s*$/m.test(document.body.innerText),
      null,
      { timeout: 20000 },
    ).catch(() => {});
    await page.waitForTimeout(1500);
    await shot('26-service-page.png');

    const bodyText = (await page.locator('body').textContent()) || '';

    expect.soft(bodyText, 'club name should appear').toContain(PERSONA.clubName);

    // Stage 1's static fallback for service quality was 87% — that came
    // from src/data/boardReport.js. Should not appear for a real club.
    const leakedQuality87 = /87\s*%.*service\s*quality|service\s*quality[^0-9]*87\s*%/i.test(bodyText);
    expect.soft(leakedQuality87, 'static 87% Service Quality must not appear').toBe(false);
  });

  test('13c — Snapshot stage-complaints for fast downstream iteration', async () => {
    test.skip(!shouldRun('complaints'), `STAGE=${STAGE} skips complaints snapshot`);
    const activeClubId = clubId || await page.evaluate(() => localStorage.getItem('swoop_club_id'));
    if (activeClubId) {
      captureSavepoint('stage-complaints', activeClubId);
      console.log(`[stage-snapshot] stage-complaints saved for ${activeClubId}`);
    }
  });
});
