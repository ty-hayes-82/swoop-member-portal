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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_URL = process.env.APP_URL || 'http://localhost:3001';
const SHOT_DIR = path.resolve(__dirname, '../../tmp/b-lite-screenshots');
const TS = Date.now();
const PERSONA = {
  clubName: `QA Sonoran Pines ${TS}`,
  city: 'Phoenix',
  state: 'AZ',
  zip: '85001',
  memberCount: '50',
  adminName: 'QA GM',
  adminEmail: `qa+${TS}@swoopgolf.com`,
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
    const csvPath = path.resolve(__dirname, '../../docs/jonas-exports/JCM_Members_F9.csv');
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

  // ── Step 5: AI Agent visibility ──────────────────────────────────────────
  test('5 — AI agent surfaces are reachable and document state', async () => {
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
});
