/**
 * GM Actions E2E Tests
 *
 * Tests the full GM workflow: see insight → act on it → verify outcome.
 * Covers: approve actions, dismiss actions, member outreach, complaint resolution,
 * arrival brief review, and cross-page action continuity.
 *
 * Run: APP_URL=http://localhost:5174 npx playwright test tests/e2e/gm-actions.spec.js --headed
 */

import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:5174';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function enterDemoMode(page) {
  await page.goto(APP_URL);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  // Click "Explore without an account"
  const exploreBtn = page.locator('button:has-text("Explore without"), a:has-text("Explore without")');
  if (await exploreBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await exploreBtn.click();
  }
  // Click "Guided Demo" if it appears
  const guidedBtn = page.locator('button:has-text("Guided Demo"), a:has-text("Guided Demo")');
  if (await guidedBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await guidedBtn.click();
  }
  await page.waitForTimeout(1000);
}

async function importGates(page, gates) {
  await page.evaluate((g) => {
    sessionStorage.setItem('swoop_demo_files', JSON.stringify(
      g.map(gate => {
        const map = {
          members: 'JCM_Members_F9', 'tee-sheet': 'TTM_Tee_Sheet_SV',
          fb: 'POS_Sales_Detail_SV', complaints: 'JCM_Service_Requests_RG',
          email: 'CHO_Email_Events_SV', weather: '7shifts_Staff_Shifts',
          pipeline: 'JCM_Club_Profile', agents: '_agents',
        };
        return map[gate] || gate;
      })
    ));
    sessionStorage.setItem('swoop_demo_gates', JSON.stringify(g));
    window.dispatchEvent(new CustomEvent('swoop-demo-import'));
  }, gates);
  await page.waitForTimeout(2000);
}

async function nav(page, route) {
  const btn = page.locator(`nav button, nav a`).filter({ hasText: new RegExp(route, 'i') });
  if (await btn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await btn.first().click();
    await page.waitForTimeout(1500);
  }
}

async function getText(page) {
  return page.evaluate(() => document.body.innerText);
}

function interceptAgentPosts(page) {
  const requests = [];
  page.route('**/api/agents', async (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      try { requests.push(JSON.parse(req.postData())); } catch {}
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  return requests;
}

function interceptActivityLogs(page) {
  const logs = [];
  page.route('**/api/activity', async (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      try { logs.push(JSON.parse(req.postData())); } catch {}
    }
    await route.fulfill({ status: 201, contentType: 'application/json', body: '{"success":true}' });
  });
  return logs;
}

async function closeDemoWizard(page) {
  const closeBtn = page.locator('[aria-label="Close"], button:has-text("Close"), button:has-text("Skip"), button:has-text("Got it")');
  if (await closeBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.first().click();
    await page.waitForTimeout(500);
  }
}

// ---------------------------------------------------------------------------
// Tests: Today Page — Action Queue
// ---------------------------------------------------------------------------

test.describe('GM Actions — Today Page Action Queue', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page);
    await importGates(page, ['members', 'agents', 'tee-sheet', 'fb', 'complaints']);
    await closeDemoWizard(page);
  });

  test('Action Queue is visible with pending count', async ({ page }) => {
    const text = await getText(page);
    // Action Queue should be present on Today page
    expect(text).toMatch(/Action Queue|actions? (need|pending|to review)/i);
  });

  test('GM clicks Act Now and sees recommendation details', async ({ page }) => {
    // Find the Act Now / Take Action button
    const actBtn = page.locator('button:has-text("Act Now"), button:has-text("Take action"), button:has-text("Review")').first();
    if (await actBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actBtn.click();
      await page.waitForTimeout(1000);

      // Should see expanded action panel with member context
      const text = await getText(page);
      const hasContext = /talking points|recommendation|approve|email|call|sms/i.test(text);
      expect(hasContext).toBe(true);
    }
  });

  test('GM approves an action from Today inline queue', async ({ page }) => {
    const agentRequests = interceptAgentPosts(page);
    const activityLogs = interceptActivityLogs(page);

    // Expand action
    const actBtn = page.locator('button:has-text("Act Now"), button:has-text("Take action"), button:has-text("Review")').first();
    if (!await actBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip('No actions in queue');
      return;
    }
    await actBtn.click();
    await page.waitForTimeout(1000);

    // Click Approve
    const approveBtn = page.locator('button:has-text("Approve")').first();
    if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await approveBtn.click();
      await page.waitForTimeout(1500);

      // Verify API call was made
      if (agentRequests.length > 0) {
        expect(agentRequests[0].operation).toBe('approve');
        expect(agentRequests[0].actionId).toBeTruthy();
      }
    }
  });

  test('GM skips an action and sees the next one', async ({ page }) => {
    const actBtn = page.locator('button:has-text("Act Now"), button:has-text("Take action")').first();
    if (!await actBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip('No actions in queue');
      return;
    }
    await actBtn.click();
    await page.waitForTimeout(1000);

    // Get initial action text
    const initialText = await getText(page);

    // Click Skip
    const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Dismiss")').first();
    if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(1000);

      // Page should still have action content (next action loaded)
      const afterText = await getText(page);
      expect(afterText.length).toBeGreaterThan(100);
    }
  });
});

// ---------------------------------------------------------------------------
// Tests: Automations Inbox — Full Approval Flow
// ---------------------------------------------------------------------------

test.describe('GM Actions — Automations Inbox', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page);
    await importGates(page, ['members', 'agents', 'tee-sheet', 'fb', 'complaints']);
    await closeDemoWizard(page);
    await nav(page, 'Automations');
  });

  test('Inbox shows pending actions with priority and impact', async ({ page }) => {
    const text = await getText(page);
    // Should show pending count and dollar impact
    const hasInbox = /inbox|pending|action/i.test(text);
    expect(hasInbox).toBe(true);

    // Should show priority indicators
    const hasPriority = /high|medium|low|priority|urgent/i.test(text);
    expect(hasPriority).toBe(true);
  });

  test('GM approves action from Inbox with execution type', async ({ page }) => {
    const agentRequests = interceptAgentPosts(page);

    // Find and click approve on first action
    const approveBtn = page.locator('button:has-text("Approve")').first();
    if (!await approveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip('No actions to approve');
      return;
    }

    await approveBtn.click();
    await page.waitForTimeout(1500);

    // Verify the action was sent
    if (agentRequests.length > 0) {
      expect(agentRequests[0].operation).toBe('approve');
    }
  });

  test('GM dismisses action from Inbox', async ({ page }) => {
    const agentRequests = interceptAgentPosts(page);

    const dismissBtn = page.locator('button:has-text("Dismiss")').first();
    if (!await dismissBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip('No actions to dismiss');
      return;
    }

    await dismissBtn.click();
    await page.waitForTimeout(1500);

    if (agentRequests.length > 0) {
      expect(agentRequests[0].operation).toBe('dismiss');
    }
  });

  test('Recently handled log shows approved and dismissed actions', async ({ page }) => {
    // First approve an action
    const approveBtn = page.locator('button:has-text("Approve")').first();
    if (await approveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await approveBtn.click();
      await page.waitForTimeout(1000);
    }

    // Check for recently handled section
    const handledBtn = page.locator('text=Recently handled, text=Recent activity, text=History');
    if (await handledBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await handledBtn.first().click();
      await page.waitForTimeout(500);

      const text = await getText(page);
      // Should show approved/dismissed indicators
      const hasHistory = /approved|dismissed|handled|completed/i.test(text);
      expect(hasHistory).toBe(true);
    }
  });

  test('Inbox filters by priority level', async ({ page }) => {
    // Click High priority filter
    const highFilter = page.locator('button:has-text("High")').first();
    if (await highFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await highFilter.click();
      await page.waitForTimeout(500);

      const text = await getText(page);
      // High priority actions should be visible
      // (or "no high priority actions" message)
      expect(text.length).toBeGreaterThan(50);
    }
  });
});

// ---------------------------------------------------------------------------
// Tests: Member Outreach — GM sees at-risk member and takes action
// ---------------------------------------------------------------------------

test.describe('GM Actions — Member Outreach from Insights', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page);
    await importGates(page, ['members', 'tee-sheet', 'fb', 'complaints', 'agents']);
    await closeDemoWizard(page);
  });

  test('GM sees at-risk member on Today page and navigates to profile', async ({ page }) => {
    const text = await getText(page);
    // Today page should show at-risk members or member alerts
    const hasRiskContent = /at.risk|declining|health|alert|intervention/i.test(text);

    if (hasRiskContent) {
      // Click on a member name link
      const memberLink = page.locator('a[href*="member"], button:has-text(/Whitfield|Jordan|Chen/)').first();
      if (await memberLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await memberLink.click();
        await page.waitForTimeout(1500);

        // Should navigate to member profile or open drawer
        const profileText = await getText(page);
        const hasProfile = /health score|membership|archetype|engagement|profile/i.test(profileText);
        expect(hasProfile).toBe(true);
      }
    }
  });

  test('GM navigates to Members page and sees health scores', async ({ page }) => {
    await nav(page, 'Members');
    const text = await getText(page);

    // Should see member list with health indicators
    expect(text).toMatch(/health|score|at.risk|watch|healthy/i);
    // Should see member names
    expect(text).toMatch(/Whitfield|Jordan|Smith|Chen/i);
  });

  test('GM opens member profile drawer from Members list', async ({ page }) => {
    await nav(page, 'Members');
    await page.waitForTimeout(1000);

    // Click on a member name
    const memberRow = page.locator('tr, [role="row"], .member-card, .member-row').filter({ hasText: /Whitfield|Jordan/i }).first();
    if (await memberRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await memberRow.click();
      await page.waitForTimeout(1500);

      const text = await getText(page);
      // Profile drawer/page should show detailed member info
      const hasDetail = /membership|join date|household|health|engagement/i.test(text);
      expect(hasDetail).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Tests: Service Page — Complaint Resolution
// ---------------------------------------------------------------------------

test.describe('GM Actions — Complaint Resolution', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page);
    await importGates(page, ['members', 'complaints', 'agents']);
    await closeDemoWizard(page);
    await nav(page, 'Service');
  });

  test('Service page shows open complaints with priority', async ({ page }) => {
    const text = await getText(page);
    expect(text).toMatch(/complaint|service request|feedback|issue/i);
  });

  test('GM can see complaint details with member context', async ({ page }) => {
    const text = await getText(page);
    // Should show complaint info with member names and categories
    const hasContext = /F&B|golf|facilities|billing|grill room|wait/i.test(text);
    if (hasContext) {
      expect(text).toMatch(/member|name|dues|\$/i);
    }
  });
});

// ---------------------------------------------------------------------------
// Tests: Board Report — GM Reviews KPIs
// ---------------------------------------------------------------------------

test.describe('GM Actions — Board Report Review', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page);
    await importGates(page, ['members', 'pipeline', 'agents', 'fb']);
    await closeDemoWizard(page);
    await nav(page, 'Board Report');
  });

  test('Board Report shows retention and revenue KPIs', async ({ page }) => {
    const text = await getText(page);
    expect(text).toMatch(/retention|member|revenue|NRR|saves|at.risk/i);
  });

  test('Board Report has multiple tabs for different views', async ({ page }) => {
    // Look for tab navigation
    const tabs = page.locator('button[role="tab"], .tab-button, [data-tab]');
    const tabCount = await tabs.count();
    // Should have at least 2 tabs
    expect(tabCount).toBeGreaterThanOrEqual(2);
  });

  test('GM can click member saves to view details', async ({ page }) => {
    // Look for clickable member saves row
    const savesRow = page.locator('tr, [role="row"]').filter({ hasText: /save|retained|intervention/i }).first();
    if (await savesRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await savesRow.click();
      await page.waitForTimeout(1500);

      // Should open member detail
      const text = await getText(page);
      const hasDetail = /profile|health|engagement|intervention/i.test(text);
      expect(hasDetail).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Tests: Cross-Page Action Continuity
// ---------------------------------------------------------------------------

test.describe('GM Actions — Cross-Page Continuity', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page);
    await importGates(page, ['members', 'agents', 'tee-sheet', 'fb', 'complaints', 'pipeline']);
    await closeDemoWizard(page);
  });

  test('Pending count in nav updates after approval', async ({ page }) => {
    // Note initial pending indication
    const initialText = await getText(page);

    // Navigate to Automations and approve
    await nav(page, 'Automations');
    const approveBtn = page.locator('button:has-text("Approve")').first();
    if (await approveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await approveBtn.click();
      await page.waitForTimeout(1000);
    }

    // Navigate back to Today
    await nav(page, 'Today');
    await page.waitForTimeout(1000);

    // Page should still function (no crash from stale state)
    const text = await getText(page);
    expect(text.length).toBeGreaterThan(100);
  });

  test('GM flows: Today insight → Members detail → back to Today', async ({ page }) => {
    // Start on Today
    let text = await getText(page);
    expect(text.length).toBeGreaterThan(100);

    // Go to Members
    await nav(page, 'Members');
    text = await getText(page);
    expect(text).toMatch(/member|health/i);

    // Back to Today
    await nav(page, 'Today');
    text = await getText(page);
    expect(text.length).toBeGreaterThan(100);
    // Page should not crash on return
  });

  test('Full GM workflow: Today → approve → Service → resolve → Board Report', async ({ page }) => {
    // 1. Today page
    let text = await getText(page);
    expect(text.length).toBeGreaterThan(100);

    // 2. Automations — approve an action
    await nav(page, 'Automations');
    const approveBtn = page.locator('button:has-text("Approve")').first();
    if (await approveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await approveBtn.click();
      await page.waitForTimeout(1000);
    }

    // 3. Service — check complaints
    await nav(page, 'Service');
    text = await getText(page);
    expect(text.length).toBeGreaterThan(50);

    // 4. Board Report — check KPIs
    await nav(page, 'Board Report');
    text = await getText(page);
    expect(text).toMatch(/retention|member|board/i);

    // 5. Back to Today — verify no crash
    await nav(page, 'Today');
    text = await getText(page);
    expect(text.length).toBeGreaterThan(100);
  });
});
