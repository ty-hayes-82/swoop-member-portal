// Guided Demo Progressive Import Test
// Tests each file group imported alongside members to verify:
// 1. Only relevant data appears for the imported sources
// 2. No fake/fabricated data leaks from other sources
// 3. Member drawer shows only data backed by imported files
//
// Run: APP_URL=http://localhost:5173 npx playwright test tests/e2e/guided-demo-progressive.spec.js --project="Desktop Chrome"

import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:5173';

// Demo member names from static data
const DEMO_MEMBERS = [
  'James Whitfield', 'Robert Callahan', 'Jennifer Walsh', 'Nathan Burke',
  'Mark Patterson', 'Greg Holloway', 'Paul Serrano', 'Anne Jordan',
  'Sandra Chen', 'Jason Rivera', 'Ronald Petersen', 'John Harrison',
  'Kevin Hurst', 'Robert Callaway', 'Victoria Sinclair', 'Scott Patterson',
];

async function enterGuidedDemo(page) {
  await page.goto(APP_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Enter Demo Mode/i }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Guided Demo/i }).click();
  await page.waitForTimeout(2000);
}

async function importGates(page, gateIds) {
  await page.evaluate((gates) => {
    // Map gate IDs to file IDs
    const gateToFiles = {
      members: ['JCM_Members_F9'],
      'tee-sheet': ['TTM_Tee_Sheet_SV'],
      fb: ['POS_Sales_Detail_SV'],
      complaints: ['JCM_Service_Requests_RG'],
      email: ['CHO_Email_Events_SV'],
      weather: ['7shifts_Staff_Shifts'],
      pipeline: ['JCM_Club_Profile'],
      agents: [],
    };
    const files = gates.flatMap(g => gateToFiles[g] || []);
    sessionStorage.setItem('swoop_demo_files', JSON.stringify(files));
    sessionStorage.setItem('swoop_demo_gates', JSON.stringify(gates));
    window.dispatchEvent(new CustomEvent('swoop:demo-sources-changed', { detail: { action: 'load' } }));
  }, gateIds);
  await page.reload();
  await page.waitForTimeout(2500);
}

async function getVisibleText(page) {
  return page.evaluate(() => document.body.innerText);
}

async function assertNoDemoMembers(page, context) {
  const text = await getVisibleText(page);
  for (const name of DEMO_MEMBERS) {
    if (text.includes(name)) {
      throw new Error(`Data leak on ${context}: found demo member "${name}"`);
    }
  }
}

// ─────────────────────────────────────────────────────
// TEST 1: Members only — no other data
// ─────────────────────────────────────────────────────
test.describe('1. Members Only', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members']);
  });

  test('Members page shows member data', async ({ page }) => {
    await page.locator('nav >> text=/Members/i').first().click();
    await page.waitForTimeout(2000);
    const text = await getVisibleText(page);
    // Should have member content (uppercase labels in the health cards)
    expect(text).toMatch(/HEALTHY|WATCH|AT RISK|CRITICAL|members/i);
  });

  test('Members page — no fabricated spending or dining data', async ({ page }) => {
    await page.locator('nav >> text=/Members/i').first().click();
    await page.waitForTimeout(2000);
    // Click first member to open drawer
    const memberRow = page.locator('[class*="cursor-pointer"]').filter({ hasText: /›/ }).first();
    if (await memberRow.isVisible()) {
      await memberRow.click();
      await page.waitForTimeout(1000);
      const drawerText = await getVisibleText(page);
      // Should NOT show spending trend (no POS data imported)
      expect(drawerText).not.toContain('Spending Trend');
      // Should NOT show health score breakdown with Golf/Dining dimensions (no engagement data)
      expect(drawerText).not.toContain('Health Score Breakdown');
    }
  });

  test('Today page — no tee sheet, no staffing, no actions', async ({ page }) => {
    const text = await getVisibleText(page);
    expect(text).not.toContain('rounds booked');
    expect(text).not.toContain('Staffing vs Demand');
    expect(text).not.toContain('Revenue Snapshot');
  });

  test('Tee Sheet page — empty', async ({ page }) => {
    await page.locator('nav >> text=/Tee Sheet/i').first().click();
    await page.waitForTimeout(2000);
    await assertNoDemoMembers(page, 'Tee Sheet (members only)');
    const text = await getVisibleText(page);
    expect(text).not.toContain('7:00 AM');
  });

  test('Service page — empty', async ({ page }) => {
    await page.locator('nav >> text=/Service/i').first().click();
    await page.waitForTimeout(2000);
    const text = await getVisibleText(page);
    expect(text).not.toContain('Grill Room');
    expect(text).not.toContain('Service Consistency Score');
  });

  test('Board Report — shows member KPIs only (no F&B, no operational)', async ({ page }) => {
    await page.locator('nav >> text=/Board Report/i').first().click();
    await page.waitForTimeout(2000);
    const text = await getVisibleText(page);
    // With members imported, board report should show member-based KPIs
    const hasMemberData = text.includes('Members Retained') || text.includes('Retention') || text.includes('At Risk');
    expect(hasMemberData).toBeTruthy();
    // But should NOT show F&B data (not imported)
    expect(text).toContain('Awaiting data');
  });

  test('Automations — no actions', async ({ page }) => {
    await page.locator('nav >> text=/Automations/i').first().click();
    await page.waitForTimeout(2000);
    await assertNoDemoMembers(page, 'Automations (members only)');
  });
});

// ─────────────────────────────────────────────────────
// TEST 2: Members + Tee Sheet
// ─────────────────────────────────────────────────────
test.describe('2. Members + Tee Sheet', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members', 'tee-sheet']);
  });

  test('Tee Sheet page shows data', async ({ page }) => {
    await page.locator('nav >> text=/Tee Sheet/i').first().click();
    await page.waitForTimeout(2000);
    const text = await getVisibleText(page);
    expect(text).toContain('rounds booked');
  });

  test('Today shows rounds in header', async ({ page }) => {
    const text = await getVisibleText(page);
    expect(text).toContain('rounds booked');
  });

  test('Service page — still empty (no complaints data)', async ({ page }) => {
    await page.locator('nav >> text=/Service/i').first().click();
    await page.waitForTimeout(2000);
    const text = await getVisibleText(page);
    expect(text).not.toContain('Service Consistency Score');
    expect(text).not.toContain('Grill Room');
  });

  test('Member drawer — no spending trend (no POS)', async ({ page }) => {
    await page.locator('nav >> text=/Members/i').first().click();
    await page.waitForTimeout(2000);
    const memberRow = page.locator('[class*="cursor-pointer"]').filter({ hasText: /›/ }).first();
    if (await memberRow.isVisible()) {
      await memberRow.click();
      await page.waitForTimeout(1000);
      const text = await getVisibleText(page);
      expect(text).not.toContain('Spending Trend');
    }
  });
});

// ─────────────────────────────────────────────────────
// TEST 3: Members + F&B / POS
// ─────────────────────────────────────────────────────
test.describe('3. Members + F&B', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members', 'fb']);
  });

  test('Tee Sheet — still empty (no tee sheet data)', async ({ page }) => {
    await page.locator('nav >> text=/Tee Sheet/i').first().click();
    await page.waitForTimeout(2000);
    const text = await getVisibleText(page);
    expect(text).not.toContain('7:00 AM');
    expect(text).toContain('No tee sheet data');
  });

  test('Today — no rounds in header', async ({ page }) => {
    const text = await getVisibleText(page);
    expect(text).not.toContain('rounds booked');
  });

  test('Member drawer — spending trend IS visible', async ({ page }) => {
    await page.locator('nav >> text=/Members/i').first().click();
    await page.waitForTimeout(2000);
    const memberRow = page.locator('[class*="cursor-pointer"]').filter({ hasText: /›/ }).first();
    if (await memberRow.isVisible()) {
      await memberRow.click();
      await page.waitForTimeout(1000);
      const text = await getVisibleText(page);
      expect(text).toContain('Spending Trend');
    }
  });
});

// ─────────────────────────────────────────────────────
// TEST 4: Members + Complaints
// ─────────────────────────────────────────────────────
test.describe('4. Members + Complaints', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members', 'complaints']);
  });

  test('Service page shows complaint data', async ({ page }) => {
    await page.locator('nav >> text=/Service/i').first().click();
    await page.waitForTimeout(2000);
    const text = await getVisibleText(page);
    // With complaints imported, quality tab should populate
    const hasData = text.includes('Service Consistency') || text.includes('Complaints') || text.includes('complaint');
    expect(hasData).toBeTruthy();
  });

  test('Tee Sheet — still empty', async ({ page }) => {
    await page.locator('nav >> text=/Tee Sheet/i').first().click();
    await page.waitForTimeout(2000);
    const text = await getVisibleText(page);
    expect(text).toContain('No tee sheet data');
  });

  test('Today — no rounds, no revenue', async ({ page }) => {
    const text = await getVisibleText(page);
    expect(text).not.toContain('rounds booked');
    expect(text).not.toContain('Revenue Snapshot');
  });
});

// ─────────────────────────────────────────────────────
// TEST 5: Members + Agents (both gates)
// ─────────────────────────────────────────────────────
test.describe('5. Members + Agents', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members', 'agents']);
  });

  test('Automations inbox shows actions', async ({ page }) => {
    await page.locator('nav >> text=/Automations/i').first().click();
    await page.waitForTimeout(2000);
    const text = await getVisibleText(page);
    // With both members + agents, inbox should have actions
    const hasPending = text.includes('pending') || text.includes('Approve');
    expect(hasPending).toBeTruthy();
  });

  test('Today shows action queue', async ({ page }) => {
    const text = await getVisibleText(page);
    const hasActions = text.includes('Action Queue');
    expect(hasActions).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────
// TEST 6: Members + Pipeline (Board Report)
// ─────────────────────────────────────────────────────
test.describe('6. Members + Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members', 'pipeline']);
  });

  test('Board Report shows data (not empty state)', async ({ page }) => {
    await page.locator('nav >> text=/Board Report/i').first().click();
    await page.waitForTimeout(2000);
    const text = await getVisibleText(page);
    // Should NOT show "needs data" anymore
    expect(text).not.toContain('Board report needs data');
  });

  test('Tee Sheet — still empty', async ({ page }) => {
    await page.locator('nav >> text=/Tee Sheet/i').first().click();
    await page.waitForTimeout(2000);
    const text = await getVisibleText(page);
    expect(text).toContain('No tee sheet data');
  });
});
