// web-button-audit.spec.js
// 2026-04-09 GM agent audit: desktop/web button-functionality smoke test.
// Walks every interactive element on the desktop surfaces
// (Login → Today → Members → Tee Sheet → Service → Revenue → Automations →
//  Board Report → Admin → Integrations → Profile → Sidebar → Header).
//
// Target: Desktop Chrome project only. Dev server: http://localhost:5174.
// Captures console errors, pageerrors, and failed network requests.
// Screenshots -> test-results/web-button-audit/.
//
// Read-only audit: source is NOT modified. Reports JSON to test-results/
// web-button-audit/audit.json, consumed by the MD report.

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.use({
  baseURL: 'http://localhost:5174',
  viewport: { width: 1440, height: 900 },
});

const SCREENSHOT_DIR = 'test-results/web-button-audit';
try { fs.mkdirSync(SCREENSHOT_DIR, { recursive: true }); } catch {}

async function seedDemoAuth(page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('swoop_auth_user', JSON.stringify({
      userId: 'demo', clubId: 'demo', name: 'Demo User', email: 'demo@swoopgolf.com',
      role: 'gm', title: 'General Manager', isDemoSession: true,
      clubName: 'Pinetree Country Club',
    }));
    localStorage.setItem('swoop_auth_token', 'demo');
    localStorage.setItem('swoop_club_id', 'demo');
    localStorage.setItem('swoop_club_name', 'Pinetree Country Club');
  });
}

function attachConsole(page, log) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const t = msg.text();
      if (!/favicon\.ico|Download the React DevTools/i.test(t)) {
        log.consoleErrors.push(t);
      }
    }
  });
  page.on('pageerror', (err) => log.pageErrors.push(err.message));
  page.on('requestfailed', (req) => {
    const failure = req.failure();
    if (failure && !/aborted|cancelled|ERR_ABORTED/i.test(failure.errorText)) {
      log.failedRequests.push(`${req.method()} ${req.url()} :: ${failure.errorText}`);
    }
  });
}

async function shot(page, name) {
  try { await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: false }); } catch {}
}

async function currentRoute(page) {
  return page.evaluate(() => (window.location.hash || '').replace(/^#\//, '').split('?')[0]);
}

test.describe('Web Button Audit (Desktop Chrome)', () => {
  test('desktop surfaces — every button exercised', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chrome', 'Desktop Chrome only');
    test.setTimeout(600_000);

    const log = { consoleErrors: [], pageErrors: [], failedRequests: [], audit: [] };
    attachConsole(page, log);

    const record = (screen, button, expected, actual, status, severity = '') => {
      log.audit.push({ screen, button, expected, actual, status, severity });
      console.log(`[AUDIT] ${screen} | ${button} | ${status}${severity ? ' ['+severity+']':''} | ${actual}`);
    };

    // ====================================================================
    // 1. LOGIN SCREEN
    // ====================================================================
    await page.goto('/');
    // Clear any prior auth
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await page.waitForTimeout(800);
    await shot(page, '01-login');

    // Sign In button exists
    const signInBtn = page.getByRole('button', { name: /^Sign In$/i }).first();
    if (await signInBtn.count()) {
      record('Login', 'Sign In button exists', 'Rendered', 'present', 'PASS');
    } else {
      record('Login', 'Sign In button exists', 'Rendered', 'not found', 'FAIL', 'P1');
    }

    // Invalid credentials attempt
    const emailInput = page.locator('input[type="email"], input[name*="email" i]').first();
    const pwInput = page.locator('input[type="password"]').first();
    if (await emailInput.count() && await pwInput.count()) {
      await emailInput.fill('nope@example.com');
      await pwInput.fill('wrongpass');
      await signInBtn.click().catch(() => {});
      await page.waitForTimeout(1200);
      const stillLogin = await page.locator('input[type="password"]').isVisible().catch(() => false);
      record('Login', 'Sign In (invalid creds)', 'Stay on login + error',
        stillLogin ? 'stayed on login' : 'navigated away',
        stillLogin ? 'PASS' : 'FAIL', stillLogin ? '' : 'P0');
    } else {
      record('Login', 'email/password inputs', 'Rendered', 'not found', 'FAIL', 'P1');
    }

    // Forgot password link
    const forgot = page.getByText(/forgot password/i).first();
    if (await forgot.count()) {
      await forgot.click().catch(() => {});
      await page.waitForTimeout(500);
      const hash = await page.evaluate(() => window.location.hash);
      const onReset = /reset-password|forgot/i.test(hash) ||
        await page.getByText(/reset|sent|email/i).first().isVisible().catch(() => false);
      record('Login', 'Forgot password link', 'Open reset flow',
        onReset ? 'opened reset flow' : `hash=${hash}`,
        onReset ? 'PASS' : 'PARTIAL', onReset ? '' : 'P2');
      // back to login
      await page.goto('/');
      await page.waitForTimeout(400);
    } else {
      record('Login', 'Forgot password link', 'Rendered', 'not found', 'FAIL', 'P2');
    }

    // Google sign-in button
    const googleBtn = page.getByRole('button', { name: /google/i }).first();
    if (await googleBtn.count()) {
      record('Login', 'Sign in with Google', 'Button exists', 'present', 'PASS');
    } else {
      record('Login', 'Sign in with Google', 'Button exists', 'not found', 'PARTIAL', 'P2');
    }

    // Explore without an account -> lands on Screen 2
    const exploreBtn = page.getByRole('button', { name: /explore without/i }).first();
    if (await exploreBtn.count()) {
      await exploreBtn.click();
      await page.waitForTimeout(600);
      const onExplore = await page.getByRole('button', { name: /Full Demo|Pinetree/i }).first().isVisible().catch(() => false);
      record('Login', 'Explore without an account', 'Show demo options',
        onExplore ? 'demo screen visible' : 'not visible',
        onExplore ? 'PASS' : 'FAIL', onExplore ? '' : 'P0');
      await shot(page, '02-login-explore');

      // Guided Demo button
      const guided = page.getByRole('button', { name: /^Guided Demo$/i }).first();
      record('Login/Explore', 'Guided Demo button', 'Exists',
        (await guided.count()) ? 'present' : 'not found',
        (await guided.count()) ? 'PASS' : 'FAIL', (await guided.count()) ? '' : 'P1');

      // Set Up New Club
      const newClub = page.getByRole('button', { name: /Set Up New Club/i }).first();
      record('Login/Explore', 'Set Up New Club button', 'Exists',
        (await newClub.count()) ? 'present' : 'not found',
        (await newClub.count()) ? 'PASS' : 'FAIL', (await newClub.count()) ? '' : 'P2');

      // Conference demo mobile
      const confBtn = page.getByRole('button', { name: /Conference Demo/i }).first();
      record('Login/Explore', 'Conference Demo (mobile)', 'Exists',
        (await confBtn.count()) ? 'present' : 'not found',
        (await confBtn.count()) ? 'PASS' : 'FAIL', (await confBtn.count()) ? '' : 'P2');

      // Full Demo -> log in
      const fullDemo = page.getByRole('button', { name: /Full Demo/i }).first();
      if (await fullDemo.count()) {
        await fullDemo.click();
        await page.waitForTimeout(2000);
        const hash = await page.evaluate(() => window.location.hash);
        const onToday = /today/i.test(hash);
        record('Login/Explore', 'Full Demo (Pinetree CC)', 'Log in + land on Today',
          `hash=${hash}`, onToday ? 'PASS' : 'FAIL', onToday ? '' : 'P0');
        await shot(page, '03-post-login-today');
      } else {
        // Fallback: seed auth manually
        await seedDemoAuth(page);
        await page.goto('/#/today');
        await page.waitForTimeout(1500);
      }
    } else {
      // Fallback
      await seedDemoAuth(page);
      await page.goto('/#/today');
      await page.waitForTimeout(1500);
      record('Login', 'Explore button fallback', 'Seed auth', 'seeded', 'PARTIAL', 'P1');
    }

    // Ensure we're authed + on today
    const authedHash = await page.evaluate(() => window.location.hash);
    if (!/today/i.test(authedHash)) {
      await seedDemoAuth(page);
      await page.goto('/#/today');
      await page.waitForTimeout(1500);
    }

    // ====================================================================
    // 2. TODAY VIEW
    // ====================================================================
    await page.goto('/#/today');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1500);
    await shot(page, '10-today');

    // Demo Stories Launcher buttons (Story 1/2/3)
    for (const storyLabel of [/Story 1/i, /Story 2/i, /Story 3/i]) {
      const btn = page.getByRole('button', { name: storyLabel }).first();
      if (await btn.count()) {
        try {
          await btn.click({ timeout: 2000 });
          await page.waitForTimeout(500);
          record('Today', `Story button ${storyLabel}`, 'Scroll/navigate to story',
            'clicked', 'PASS');
        } catch (e) {
          record('Today', `Story button ${storyLabel}`, 'Clickable',
            `error: ${e.message}`, 'FAIL', 'P2');
        }
      } else {
        record('Today', `Story button ${storyLabel}`, 'Exists', 'not found', 'PARTIAL', 'P2');
      }
    }

    // MorningBriefingSentence CTAs
    await page.goto('/#/today');
    await page.waitForTimeout(1200);
    const viewAtRisk = page.getByRole('button', { name: /view at-risk|at-risk alerts/i }).first();
    if (await viewAtRisk.count()) {
      await viewAtRisk.click().catch(() => {});
      await page.waitForTimeout(500);
      record('Today', 'View at-risk alerts', 'Scroll or navigate', 'clicked', 'PASS');
    } else {
      record('Today', 'View at-risk alerts', 'Exists', 'not found', 'PARTIAL', 'P2');
    }

    await page.goto('/#/today');
    await page.waitForTimeout(1200);
    const seeRevenue = page.getByRole('button', { name: /full revenue breakdown|see full revenue/i }).first();
    if (await seeRevenue.count()) {
      await seeRevenue.click().catch(() => {});
      await page.waitForTimeout(600);
      const hash = await page.evaluate(() => window.location.hash);
      const onRev = /revenue/i.test(hash);
      record('Today', 'See full revenue breakdown', 'Navigate to revenue',
        `hash=${hash}`, onRev ? 'PASS' : 'PARTIAL', onRev ? '' : 'P1');
    } else {
      record('Today', 'See full revenue breakdown', 'Exists', 'not found', 'PARTIAL', 'P2');
    }

    // MemberAlerts: find first "Take action" button
    await page.goto('/#/today');
    await page.waitForTimeout(1200);
    const takeAction = page.getByRole('button', { name: /take action/i }).first();
    if (await takeAction.count()) {
      await takeAction.click().catch(() => {});
      await page.waitForTimeout(600);
      record('Today/MemberAlerts', 'Take action (first)', 'Opens drawer or logs action',
        'clicked', 'PASS');
    } else {
      record('Today/MemberAlerts', 'Take action', 'Exists', 'not found', 'PARTIAL', 'P2');
    }
    // close any drawer
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(300);

    // PendingActionsInline: Approve button
    await page.goto('/#/today');
    await page.waitForTimeout(1200);
    const approveBtn = page.getByRole('button', { name: /^Approve$/i }).first();
    if (await approveBtn.count()) {
      await approveBtn.click().catch(() => {});
      await page.waitForTimeout(600);
      record('Today/PendingActions', 'Approve (first)', 'Fires approval + toast',
        'clicked', 'PASS');
    } else {
      record('Today/PendingActions', 'Approve button', 'Exists', 'not found', 'PARTIAL', 'P2');
    }

    // ====================================================================
    // 3. SIDEBAR NAV (exercise every item)
    // ====================================================================
    const navItems = [
      { label: /^Today$/i, route: 'today' },
      { label: /^Members$/i, route: 'members' },
      { label: /Tee Sheet/i, route: 'tee-sheet' },
      { label: /^Service$/i, route: 'service' },
      { label: /^Revenue$/i, route: 'revenue' },
      { label: /Automations|Actions|Inbox/i, route: 'automations' },
      { label: /Board Report/i, route: 'board-report' },
      { label: /^Admin$/i, route: 'admin' },
    ];
    for (const item of navItems) {
      const nav = page.locator('nav, aside').getByRole('button', { name: item.label }).first();
      const link = (await nav.count()) ? nav : page.getByRole('link', { name: item.label }).first();
      if (await link.count()) {
        try {
          await link.click({ timeout: 2000 });
          await page.waitForTimeout(700);
          const route = await currentRoute(page);
          const ok = route.includes(item.route) || (item.route === 'automations' && /automation|inbox/i.test(route));
          record('Sidebar', `Nav: ${item.label}`, `Route to ${item.route}`,
            `route=${route}`, ok ? 'PASS' : 'FAIL', ok ? '' : 'P1');
        } catch (e) {
          record('Sidebar', `Nav: ${item.label}`, 'Click', `error: ${e.message}`, 'FAIL', 'P1');
        }
      } else {
        record('Sidebar', `Nav: ${item.label}`, 'Exists', 'not found', 'FAIL', 'P1');
      }
    }

    // ====================================================================
    // 4. MEMBERS PAGE
    // ====================================================================
    await page.goto('/#/members');
    await page.waitForTimeout(1500);
    await shot(page, '20-members');

    // Tab buttons
    const memberTabs = [/Health Overview/i, /All Members/i, /Cohorts/i, /Email/i, /Recovery/i];
    for (const tab of memberTabs) {
      const t = page.getByRole('button', { name: tab }).first();
      if (await t.count()) {
        try {
          await t.click({ timeout: 2000 });
          await page.waitForTimeout(400);
          record('Members', `Tab ${tab}`, 'Switch tab', 'clicked', 'PASS');
        } catch (e) {
          record('Members', `Tab ${tab}`, 'Click', `error: ${e.message}`, 'FAIL', 'P2');
        }
      } else {
        record('Members', `Tab ${tab}`, 'Exists', 'not found', 'PARTIAL', 'P2');
      }
    }

    // First member row click -> drawer opens
    await page.goto('/#/members');
    await page.waitForTimeout(1200);
    // Target a member row - try rows, then clickable divs
    const firstRow = page.locator('[role="row"], tr, [data-member-id], .member-row').first();
    if (await firstRow.count()) {
      try {
        await firstRow.click({ timeout: 2000 });
        await page.waitForTimeout(700);
        const drawer = page.locator('[role="dialog"], .drawer, [class*="drawer" i]').first();
        const drawerOpen = await drawer.isVisible().catch(() => false);
        record('Members', 'Member row click', 'Open profile drawer',
          drawerOpen ? 'drawer visible' : 'drawer not visible',
          drawerOpen ? 'PASS' : 'PARTIAL', drawerOpen ? '' : 'P1');
        await page.keyboard.press('Escape').catch(() => {});
      } catch (e) {
        record('Members', 'Member row click', 'Open drawer', `error: ${e.message}`, 'FAIL', 'P1');
      }
    } else {
      record('Members', 'Member row', 'Exists', 'no row found', 'FAIL', 'P0');
    }

    // ====================================================================
    // 5. TEE SHEET
    // ====================================================================
    await page.goto('/#/tee-sheet');
    await page.waitForTimeout(1500);
    await shot(page, '30-tee-sheet');
    const teeRoute = await currentRoute(page);
    record('TeeSheet', 'Page loads', 'Shows tee sheet', `route=${teeRoute}`,
      /tee/i.test(teeRoute) ? 'PASS' : 'FAIL', /tee/i.test(teeRoute) ? '' : 'P1');

    // Filter chips (look for buttons in the top of the page)
    const chips = await page.locator('button').filter({ hasText: /^(All|Today|Tomorrow|Week|Morning|Afternoon|Evening)$/i }).all();
    record('TeeSheet', 'Filter chips', 'Exist', `found ${chips.length}`,
      chips.length > 0 ? 'PASS' : 'PARTIAL', chips.length > 0 ? '' : 'P2');
    if (chips.length) {
      try { await chips[0].click({ timeout: 2000 }); await page.waitForTimeout(300);
        record('TeeSheet', 'First chip click', 'Toggle filter', 'clicked', 'PASS');
      } catch (e) { record('TeeSheet', 'First chip click', 'Click', `error: ${e.message}`, 'FAIL', 'P2'); }
    }

    // ====================================================================
    // 6. SERVICE
    // ====================================================================
    await page.goto('/#/service');
    await page.waitForTimeout(1500);
    await shot(page, '40-service');
    const srvRoute = await currentRoute(page);
    record('Service', 'Page loads', 'Shows service', `route=${srvRoute}`,
      /service/i.test(srvRoute) ? 'PASS' : 'FAIL', /service/i.test(srvRoute) ? '' : 'P1');

    const serviceTabs = [/Quality/i, /Staffing/i, /Outlets/i];
    for (const tab of serviceTabs) {
      const t = page.getByRole('button', { name: tab }).first();
      if (await t.count()) {
        try { await t.click({ timeout: 2000 }); await page.waitForTimeout(300);
          record('Service', `Tab ${tab}`, 'Switch tab', 'clicked', 'PASS');
        } catch (e) { record('Service', `Tab ${tab}`, 'Click', `error: ${e.message}`, 'FAIL', 'P2'); }
      } else {
        record('Service', `Tab ${tab}`, 'Exists', 'not found', 'PARTIAL', 'P2');
      }
    }

    // ====================================================================
    // 7. REVENUE (pilot-critical)
    // ====================================================================
    await page.goto('/#/revenue');
    await page.waitForTimeout(1800);
    await shot(page, '50-revenue');
    const revRoute = await currentRoute(page);
    record('Revenue', 'Page loads', 'Shows revenue', `route=${revRoute}`,
      /revenue/i.test(revRoute) ? 'PASS' : 'FAIL', /revenue/i.test(revRoute) ? '' : 'P0');

    // KPI hero tiles
    const kpiLabels = [/Total Monthly Leakage|Monthly Leakage/i, /Pace of Play/i, /Understaffed/i, /Weather/i];
    for (const label of kpiLabels) {
      const tile = page.getByText(label).first();
      const visible = await tile.isVisible().catch(() => false);
      record('Revenue', `KPI tile ${label}`, 'Rendered', visible ? 'visible' : 'not visible',
        visible ? 'PASS' : 'FAIL', visible ? '' : 'P1');
    }

    // vs last month delta chip (recently shipped)
    const deltaChip = page.getByText(/vs last month|vs\. last month/i).first();
    const deltaVisible = await deltaChip.isVisible().catch(() => false);
    record('Revenue', 'vs last month delta chip', 'Rendered', deltaVisible ? 'visible' : 'not visible',
      deltaVisible ? 'PASS' : 'FAIL', deltaVisible ? '' : 'P2');

    // Approve & Deploy ranger
    const approveRanger = page.getByRole('button', { name: /Approve.*Deploy|Deploy Ranger/i }).first();
    if (await approveRanger.count()) {
      try { await approveRanger.click({ timeout: 2000 }); await page.waitForTimeout(400);
        record('Revenue', 'Approve & Deploy ranger', 'Fires action', 'clicked', 'PASS');
      } catch (e) { record('Revenue', 'Approve & Deploy ranger', 'Click', `error: ${e.message}`, 'FAIL', 'P1'); }
    } else {
      record('Revenue', 'Approve & Deploy ranger', 'Exists', 'not found', 'PARTIAL', 'P2');
    }

    // Board Report button
    const openBoard = page.getByRole('button', { name: /Open Board Report|Board Report/i }).first();
    if (await openBoard.count()) {
      try { await openBoard.click({ timeout: 2000 }); await page.waitForTimeout(600);
        const hash = await currentRoute(page);
        const ok = /board/i.test(hash);
        record('Revenue', 'Open Board Report', 'Navigate to board-report',
          `route=${hash}`, ok ? 'PASS' : 'FAIL', ok ? '' : 'P1');
      } catch (e) { record('Revenue', 'Open Board Report', 'Click', `error: ${e.message}`, 'FAIL', 'P1'); }
    } else {
      record('Revenue', 'Open Board Report button', 'Exists', 'not found', 'PARTIAL', 'P2');
    }

    // ====================================================================
    // 8. AUTOMATIONS / INBOX
    // ====================================================================
    await page.goto('/#/automations');
    await page.waitForTimeout(1500);
    await shot(page, '60-automations');
    const autoRoute = await currentRoute(page);
    record('Automations', 'Page loads', 'Shows automations', `route=${autoRoute}`,
      /automation/i.test(autoRoute) ? 'PASS' : 'FAIL', /automation/i.test(autoRoute) ? '' : 'P0');

    // Filter chips
    const filterChips = [/^All$/i, /^High$/i, /^Medium$/i, /^Low$/i, /Approved/i, /Dismissed/i];
    for (const chip of filterChips) {
      const c = page.getByRole('button', { name: chip }).first();
      if (await c.count()) {
        try { await c.click({ timeout: 2000 }); await page.waitForTimeout(250);
          record('Automations', `Chip ${chip}`, 'Toggle filter', 'clicked', 'PASS');
        } catch (e) { record('Automations', `Chip ${chip}`, 'Click', `error: ${e.message}`, 'FAIL', 'P2'); }
      } else {
        record('Automations', `Chip ${chip}`, 'Exists', 'not found', 'PARTIAL', 'P2');
      }
    }

    // First approve button
    const firstApprove = page.getByRole('button', { name: /^Approve$/i }).first();
    if (await firstApprove.count()) {
      try { await firstApprove.click({ timeout: 2000 }); await page.waitForTimeout(500);
        record('Automations', 'First Approve', 'Approve card', 'clicked', 'PASS');
      } catch (e) { record('Automations', 'First Approve', 'Click', `error: ${e.message}`, 'FAIL', 'P1'); }
    }

    // ====================================================================
    // 9. BOARD REPORT
    // ====================================================================
    await page.goto('/#/board-report');
    await page.waitForTimeout(1500);
    await shot(page, '70-board-report');
    const brRoute = await currentRoute(page);
    record('BoardReport', 'Page loads', 'Shows board report', `route=${brRoute}`,
      /board/i.test(brRoute) ? 'PASS' : 'FAIL', /board/i.test(brRoute) ? '' : 'P1');

    const brTabs = [/Summary/i, /Member Saves/i, /Operational Saves/i, /What We Learned/i];
    for (const tab of brTabs) {
      const t = page.getByRole('button', { name: tab }).first();
      if (await t.count()) {
        try { await t.click({ timeout: 2000 }); await page.waitForTimeout(400);
          record('BoardReport', `Tab ${tab}`, 'Switch tab', 'clicked', 'PASS');
        } catch (e) { record('BoardReport', `Tab ${tab}`, 'Click', `error: ${e.message}`, 'FAIL', 'P2'); }
      } else {
        record('BoardReport', `Tab ${tab}`, 'Exists', 'not found', 'PARTIAL', 'P2');
      }
    }

    // ====================================================================
    // 10. ADMIN HUB
    // ====================================================================
    await page.goto('/#/admin');
    await page.waitForTimeout(1500);
    await shot(page, '80-admin');
    const admRoute = await currentRoute(page);
    record('Admin', 'Page loads', 'Shows admin hub', `route=${admRoute}`,
      /admin/i.test(admRoute) ? 'PASS' : 'FAIL', /admin/i.test(admRoute) ? '' : 'P1');

    // Next Intelligence Unlock card (wave 3)
    const nextUnlock = page.getByText(/Next Intelligence Unlock/i).first();
    const nextUnlockVis = await nextUnlock.isVisible().catch(() => false);
    record('Admin', 'Next Intelligence Unlock card', 'Rendered',
      nextUnlockVis ? 'visible' : 'not visible',
      nextUnlockVis ? 'PASS' : 'FAIL', nextUnlockVis ? '' : 'P1');

    // Live System Health card (wave 3)
    const sysHealth = page.getByText(/Live System Health|System Health/i).first();
    const sysHealthVis = await sysHealth.isVisible().catch(() => false);
    record('Admin', 'Live System Health card', 'Rendered',
      sysHealthVis ? 'visible' : 'not visible',
      sysHealthVis ? 'PASS' : 'FAIL', sysHealthVis ? '' : 'P1');

    // Connect buttons
    const connectBtns = await page.getByRole('button', { name: /^Connect$/i }).all();
    record('Admin', 'Connect buttons count', 'At least one', `found ${connectBtns.length}`,
      connectBtns.length > 0 ? 'PASS' : 'PARTIAL', connectBtns.length > 0 ? '' : 'P2');

    // ====================================================================
    // 11. INTEGRATIONS
    // ====================================================================
    await page.goto('/#/integrations');
    await page.waitForTimeout(1500);
    await shot(page, '90-integrations');
    const intRoute = await currentRoute(page);
    record('Integrations', 'Page loads', 'Shows integrations', `route=${intRoute}`,
      /integration/i.test(intRoute) ? 'PASS' : 'FAIL', /integration/i.test(intRoute) ? '' : 'P1');

    // Unlock cards (wave 3)
    const unlockKeywords = [/tee sheet.*POS|POS.*tee/i, /Member CRM|CRM.*POS/i, /Scheduling.*POS|Staff.*POS/i, /Weather.*Tee/i];
    for (const kw of unlockKeywords) {
      const el = page.getByText(kw).first();
      const vis = await el.isVisible().catch(() => false);
      record('Integrations', `Unlock card ${kw}`, 'Rendered',
        vis ? 'visible' : 'not visible',
        vis ? 'PASS' : 'PARTIAL', vis ? '' : 'P2');
    }

    const intConnect = await page.getByRole('button', { name: /^Connect$/i }).all();
    record('Integrations', 'Connect buttons', 'Exist', `found ${intConnect.length}`,
      intConnect.length > 0 ? 'PASS' : 'PARTIAL', intConnect.length > 0 ? '' : 'P2');

    // ====================================================================
    // 12. PROFILE
    // ====================================================================
    await page.goto('/#/profile');
    await page.waitForTimeout(1500);
    await shot(page, '95-profile');
    const profRoute = await currentRoute(page);
    record('Profile', 'Page loads', 'Shows profile', `route=${profRoute}`,
      /profile/i.test(profRoute) ? 'PASS' : 'FAIL', /profile/i.test(profRoute) ? '' : 'P1');

    // Save button
    const saveBtn = page.getByRole('button', { name: /^Save$|Save Changes/i }).first();
    record('Profile', 'Save button', 'Exists',
      (await saveBtn.count()) ? 'present' : 'not found',
      (await saveBtn.count()) ? 'PASS' : 'FAIL', (await saveBtn.count()) ? '' : 'P1');

    // Role & Club Permissions card (wave 3)
    const roleCard = page.getByText(/Role.*Club Permissions|Your Role/i).first();
    const roleVis = await roleCard.isVisible().catch(() => false);
    record('Profile', 'Role & Club Permissions card', 'Rendered',
      roleVis ? 'visible' : 'not visible',
      roleVis ? 'PASS' : 'FAIL', roleVis ? '' : 'P1');

    // Google connect
    const gConnect = page.getByRole('button', { name: /Google Connect|Connect Google|Disconnect Google/i }).first();
    record('Profile', 'Google connect/disconnect', 'Exists',
      (await gConnect.count()) ? 'present' : 'not found',
      (await gConnect.count()) ? 'PASS' : 'PARTIAL', (await gConnect.count()) ? '' : 'P2');

    // ====================================================================
    // 13. HEADER
    // ====================================================================
    await page.goto('/#/today');
    await page.waitForTimeout(1200);

    // Search / cmd-k
    await page.keyboard.press('Meta+K').catch(() => {});
    await page.waitForTimeout(300);
    const searchOpen = await page.locator('[placeholder*="Search" i], [role="combobox"]').first().isVisible().catch(() => false);
    record('Header', 'Cmd+K search', 'Opens search', searchOpen ? 'opened' : 'not opened',
      searchOpen ? 'PASS' : 'PARTIAL', searchOpen ? '' : 'P2');
    await page.keyboard.press('Escape').catch(() => {});

    // Notifications bell
    const bell = page.locator('header button').filter({ has: page.locator('svg') }).first();
    if (await bell.count()) {
      record('Header', 'Notifications bell', 'Exists', 'present', 'PASS');
    } else {
      record('Header', 'Notifications bell', 'Exists', 'not found', 'PARTIAL', 'P2');
    }

    // LIVE badge
    const liveBadge = page.getByText(/^LIVE$/).first();
    const liveVis = await liveBadge.isVisible().catch(() => false);
    record('Header', 'LIVE badge', 'Rendered', liveVis ? 'visible' : 'not visible',
      liveVis ? 'PASS' : 'PARTIAL', liveVis ? '' : 'P2');

    // ====================================================================
    // FOOTER: Sign out
    // ====================================================================
    const signOut = page.getByRole('button', { name: /^Sign Out$/i }).first();
    if (await signOut.count()) {
      record('Footer', 'Sign Out button', 'Exists', 'present', 'PASS');
    } else {
      record('Footer', 'Sign Out button', 'Exists', 'not found', 'PARTIAL', 'P2');
    }

    // ====================================================================
    // DUMP THE LOG
    // ====================================================================
    const summary = {
      total: log.audit.length,
      pass: log.audit.filter(a => a.status === 'PASS').length,
      fail: log.audit.filter(a => a.status === 'FAIL').length,
      partial: log.audit.filter(a => a.status === 'PARTIAL').length,
      p0: log.audit.filter(a => a.severity === 'P0').length,
      p1: log.audit.filter(a => a.severity === 'P1').length,
      p2: log.audit.filter(a => a.severity === 'P2').length,
      consoleErrors: log.consoleErrors.length,
      pageErrors: log.pageErrors.length,
      failedRequests: log.failedRequests.length,
    };
    console.log('[AUDIT SUMMARY]', JSON.stringify(summary));
    console.log('[AUDIT PAGE ERRORS]', log.pageErrors.slice(0, 10));
    console.log('[AUDIT CONSOLE ERRORS]', log.consoleErrors.slice(0, 10));

    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'audit.json'),
      JSON.stringify({ summary, audit: log.audit,
        consoleErrors: log.consoleErrors, pageErrors: log.pageErrors,
        failedRequests: log.failedRequests }, null, 2)
    );

    // Don't fail the test on non-critical issues — this is an audit, not a gate.
    expect(log.audit.length).toBeGreaterThan(0);
  });
});
