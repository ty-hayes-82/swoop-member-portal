// Guided Demo Data Isolation E2E Test
// Verifies ZERO data leakage when in guided demo mode with no files imported.
// Run: APP_URL=http://localhost:5173 npx playwright test tests/e2e/guided-demo-isolation.spec.js --project="Desktop Chrome"

import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:5173';

// Known demo member names that should NOT appear before member data is imported
const DEMO_MEMBERS = [
  'James Whitfield', 'Robert Callahan', 'Jennifer Walsh', 'Nathan Burke',
  'Mark Patterson', 'Greg Holloway', 'Paul Serrano', 'Anne Jordan',
  'Sandra Chen', 'Jason Rivera', 'Ronald Petersen', 'John Harrison',
  'Kevin Hurst', 'Robert Callaway',
];

async function enterGuidedDemo(page) {
  await page.goto(APP_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Click "Enter Demo Mode" to get to the demo setup screen
  await page.getByRole('button', { name: /Enter Demo Mode/i }).click();
  await page.waitForTimeout(500);

  // Click "Guided Demo" button
  const guidedBtn = page.getByRole('button', { name: /Guided Demo/i });
  await guidedBtn.click();
  await page.waitForTimeout(2000);
}

async function getVisibleText(page) {
  return page.evaluate(() => document.body.innerText);
}

// Helper: check that none of the demo member names appear on the page
async function assertNoDemoMembers(page, context) {
  const text = await getVisibleText(page);
  for (const name of DEMO_MEMBERS) {
    if (text.includes(name)) {
      throw new Error(`Data leak on ${context}: found demo member "${name}"`);
    }
  }
}

// ─────────────────────────────────────────────────────
// PART A: Zero data before any imports
// ─────────────────────────────────────────────────────
test.describe('Part A: Guided Demo — Zero Data Before Import', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
  });

  test('A1: Today page — no rounds count in header', async ({ page }) => {
    const header = page.locator('.rounded-xl.border-brand-100, [class*="bg-brand-25"]').first();
    await expect(header).toBeVisible({ timeout: 10000 });
    const headerText = await header.innerText();
    expect(headerText).not.toContain('rounds booked');
    expect(headerText).not.toContain('220');
  });

  test('A2: Today page — no action queue data', async ({ page }) => {
    // Action Queue section should either be absent or show 0
    const actionQueue = page.locator('text=/Action Queue/');
    const visible = await actionQueue.isVisible().catch(() => false);
    if (visible) {
      const text = await actionQueue.innerText();
      // Should show (0) or be absent entirely
      expect(text).not.toMatch(/Action Queue \(\d{1,}\)/); // no count > 0
    }

    // No "Take action" or "Approve" buttons in the main content area
    const mainContent = page.locator('main, [class*="flex-col"][class*="gap-6"]').first();
    const mainText = await mainContent.innerText();
    expect(mainText).not.toContain('Take action');
  });

  test('A3: Today page — no member alerts', async ({ page }) => {
    const memberAlerts = page.locator('text=/Priority Member Alerts/');
    const visible = await memberAlerts.isVisible().catch(() => false);
    if (visible) {
      // Should show empty state
      const section = page.locator('text=/No at-risk members detected/');
      await expect(section).toBeVisible({ timeout: 5000 });
    }
    // No demo member names on the page
    await assertNoDemoMembers(page, 'Today page');
  });

  test('A4: Today page — no forecast section', async ({ page }) => {
    const forecast = page.locator("text=/Tomorrow's Forecast/");
    const visible = await forecast.isVisible().catch(() => false);
    if (visible) {
      // If visible, it should NOT show hardcoded 220 rounds or 72°F
      const forecastSection = page.locator("text=/Tomorrow's Forecast/").locator('..');
      const text = await forecastSection.innerText();
      expect(text).not.toContain('220');
    }
  });

  test('A5: Today page — no staffing data', async ({ page }) => {
    // Staffing section should be absent
    const staffing = page.locator('text=/Staffing vs Demand/');
    await expect(staffing).not.toBeVisible({ timeout: 3000 });
  });

  test('A6: Today page — no revenue card', async ({ page }) => {
    const revenue = page.locator('text=/Revenue Snapshot/');
    await expect(revenue).not.toBeVisible({ timeout: 3000 });
  });

  test('A7: Members page — empty state', async ({ page }) => {
    // Navigate to Members
    await page.locator('nav >> text=/Members/i').first().click();
    await page.waitForTimeout(2000);

    // Should show empty state or zero members
    const bodyText = await getVisibleText(page);
    const hasEmptyState = bodyText.includes('Import') || bodyText.includes('No members') ||
      bodyText.includes('empty') || bodyText.includes('Get started');
    const hasNoMemberData = !DEMO_MEMBERS.some(name => bodyText.includes(name));
    expect(hasEmptyState || hasNoMemberData).toBeTruthy();
  });

  test('A8: Tee Sheet page — empty state', async ({ page }) => {
    await page.locator('nav >> text=/Tee Sheet/i').first().click();
    await page.waitForTimeout(2000);
    const text = await getVisibleText(page);
    // Should show empty state, not tee time data
    expect(text).not.toContain('South Course');
    expect(text).not.toContain('North Course');
    expect(text).not.toContain('7:00 AM');
    expect(text).not.toContain('at-risk members playing');
    await assertNoDemoMembers(page, 'Tee Sheet page');
  });

  test('A9: Service page — no outlet data, no scores', async ({ page }) => {
    await page.locator('nav >> text=/Service/i').first().click();
    await page.waitForTimeout(2000);
    const text = await getVisibleText(page);
    // Should NOT show hardcoded outlet names
    expect(text).not.toContain('Grill Room');
    expect(text).not.toContain('The Terrace');
    expect(text).not.toContain('Turn Stand');
    expect(text).not.toContain('Banquet/Events');
    // Should NOT show a service consistency score
    expect(text).not.toContain('Service Consistency Score');
    // Should show empty state
    const hasEmpty = text.includes('No service quality data') || text.includes('No staffing data') || text.includes('No complaint data');
    expect(hasEmpty).toBeTruthy();
    await assertNoDemoMembers(page, 'Service page');
  });

  test('A10: Automations page — empty inbox', async ({ page }) => {
    await page.locator('nav >> text=/Automations/i').first().click();
    await page.waitForTimeout(2000);

    const text = await getVisibleText(page);
    // Should not have any pending actions with member names
    await assertNoDemoMembers(page, 'Automations page');

    // Inbox count should be 0 or section should be empty
    const pendingBadge = page.locator('text=/pending action/');
    const badgeVisible = await pendingBadge.isVisible().catch(() => false);
    if (badgeVisible) {
      const badgeText = await pendingBadge.innerText();
      expect(badgeText).toContain('0');
    }
  });

  test('A11: Board Report page — empty state', async ({ page }) => {
    await page.locator('nav >> text=/Board Report/i').first().click();
    await page.waitForTimeout(2000);
    const text = await getVisibleText(page);
    // Should show empty state — "Board report needs data"
    const hasEmpty = text.includes('Board report needs data') || text.includes('needs data') || text.includes('Import');
    expect(hasEmpty).toBeTruthy();
    // Should NOT show executive summary content
    expect(text).not.toContain('complaint resolution rate');
    await assertNoDemoMembers(page, 'Board Report');
  });
});

// ─────────────────────────────────────────────────────
// PART B: Progressive import
// ─────────────────────────────────────────────────────
test.describe('Part B: Progressive Import', () => {
  test('B1: Import members → Member Health populates', async ({ page }) => {
    await enterGuidedDemo(page);

    // Click the Members file to import
    const membersFile = page.locator('text=/JCM_Members_F9/i').or(page.locator('button:has-text("Members")').filter({ hasText: /Jonas Club Management.*250/ }));
    // Use the wizard — click the import button for members
    await page.evaluate(() => {
      // Directly load the members gate
      const event = new CustomEvent('swoop:demo-sources-changed', { detail: { action: 'load' } });
      const files = JSON.parse(localStorage.getItem('swoop_demo_files') || '[]');
      const gates = JSON.parse(localStorage.getItem('swoop_demo_gates') || '[]');
      files.push('JCM_Members_F9');
      gates.push('members');
      sessionStorage.setItem('swoop_demo_files', JSON.stringify(files));
      sessionStorage.setItem('swoop_demo_gates', JSON.stringify(gates));
      window.dispatchEvent(event);
    });
    await page.waitForTimeout(1000);

    // Navigate to Members page
    await page.locator('nav >> text=/Members/i').first().click();
    await page.waitForTimeout(3000);

    // Should now show member data
    const text = await getVisibleText(page);
    const hasMemberContent = text.includes('Healthy') || text.includes('At Risk') ||
      text.includes('Watch') || text.includes('health') || text.includes('archetype');
    expect(hasMemberContent).toBeTruthy();
  });

  test('B2: After members import, Today shows member alerts but NOT tee sheet data', async ({ page }) => {
    await enterGuidedDemo(page);

    // Import only members
    await page.evaluate(() => {
      const files = ['JCM_Members_F9'];
      const gates = ['members'];
      sessionStorage.setItem('swoop_demo_files', JSON.stringify(files));
      sessionStorage.setItem('swoop_demo_gates', JSON.stringify(gates));
      window.dispatchEvent(new CustomEvent('swoop:demo-sources-changed', { detail: { action: 'load' } }));
    });
    await page.reload();
    await page.waitForTimeout(3000);

    // Today should show member alerts now
    const alertSection = page.locator('text=/Priority Member Alerts/');
    await expect(alertSection).toBeVisible({ timeout: 10000 });

    // But should NOT show rounds booked (tee-sheet not imported)
    const header = page.locator('.rounded-xl.border-brand-100, [class*="bg-brand-25"]').first();
    const headerText = await header.innerText();
    expect(headerText).not.toContain('rounds booked');
  });

  test('B3: Import tee sheet → rounds appear in header', async ({ page }) => {
    await enterGuidedDemo(page);

    // Import members + tee sheet
    await page.evaluate(() => {
      const files = ['JCM_Members_F9', 'TTM_Tee_Sheet_SV'];
      const gates = ['members', 'tee-sheet'];
      sessionStorage.setItem('swoop_demo_files', JSON.stringify(files));
      sessionStorage.setItem('swoop_demo_gates', JSON.stringify(gates));
      window.dispatchEvent(new CustomEvent('swoop:demo-sources-changed', { detail: { action: 'load' } }));
    });
    await page.reload();
    await page.waitForTimeout(3000);

    const header = page.locator('.rounded-xl.border-brand-100, [class*="bg-brand-25"]').first();
    const headerText = await header.innerText();
    expect(headerText).toContain('rounds booked');
  });
});

// ─────────────────────────────────────────────────────
// PART C: Full Demo Mode (positive test)
// ─────────────────────────────────────────────────────
test.describe('Part C: Full Demo Mode', () => {
  test('C1: Full demo shows all data', async ({ page }) => {
    await page.goto(APP_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Enter Demo Mode/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Start Full Demo/i }).click();
    await page.waitForTimeout(3000);

    // Greeting should appear with rounds
    const greeting = page.locator('text=/Good morning|Afternoon check-in/');
    await expect(greeting.first()).toBeVisible({ timeout: 10000 });

    const text = await getVisibleText(page);
    expect(text).toContain('rounds booked');

    // Priority items and member alerts should be populated
    const hasActions = text.includes('Action Queue');
    const hasAlerts = text.includes('Priority Member Alerts');
    expect(hasActions || hasAlerts).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────
// PART E: Mode Switching
// ─────────────────────────────────────────────────────
test.describe('Part E: Mode Switching', () => {
  test('E1: Full Demo → Guided Demo starts clean', async ({ page }) => {
    // First run full demo to populate localStorage
    await page.goto(APP_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: /Enter Demo Mode/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Start Full Demo/i }).click();
    await page.waitForTimeout(3000);

    // Verify full demo has data
    let text = await getVisibleText(page);
    expect(text).toContain('rounds booked');

    // Now sign out and enter guided demo
    const signOut = page.locator('text=/Sign Out/i').first();
    await signOut.click();
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: /Enter Demo Mode/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Guided Demo/i }).click();
    await page.waitForTimeout(3000);

    // Should have NO demo member data
    await assertNoDemoMembers(page, 'Guided demo after full demo');

    // Should NOT show "rounds booked"
    text = await getVisibleText(page);
    expect(text).not.toContain('220 rounds');
  });
});
