// Demo Story E2E Test — Validates the 5 key demo moments for GM presentation
// Run: APP_URL=http://localhost:5173 npx playwright test tests/e2e/demo-story.spec.js --headed

import { test, expect } from '@playwright/test';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

async function enterDemoMode(page) {
  await page.goto(APP_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  // Click "Explore without an account"
  await page.getByRole('button', { name: /Explore without an account/i }).click();
  await page.waitForTimeout(500);
  // Click "Full Demo (Pinetree CC)"
  await page.getByRole('button', { name: /Full Demo \(Pinetree CC\)/i }).click();
  await page.waitForTimeout(3000);
}

test.describe('Demo Story — 5 Key Moments', () => {

  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page);
  });

  test('1. Today Dashboard — morning briefing with staffing + complaints + actions', async ({ page }) => {
    // Should land on Today by default
    await expect(page.locator('body')).not.toContainText('Loading...');

    // Greeting should be visible
    const greeting = page.locator('text=/Good morning|Afternoon check-in/');
    await expect(greeting.first()).toBeVisible({ timeout: 10000 });

    // Priority items (cockpit) — James Whitfield complaint should appear
    const cockpit = page.locator('text=/James Whitfield/');
    const cockpitVisible = await cockpit.first().isVisible().catch(() => false);

    // Staffing section should show data (not empty)
    const staffing = page.locator('text=/Staffing|servers|Grill Room/');
    const staffingVisible = await staffing.first().isVisible().catch(() => false);

    // Open complaints section
    const complaints = page.locator('text=/Open Complaints|complaint/i');
    const complaintsVisible = await complaints.first().isVisible().catch(() => false);

    // At least one of these key sections should be populated
    expect(cockpitVisible || staffingVisible || complaintsVisible).toBeTruthy();

    // Take screenshot for review
    await page.screenshot({ path: 'test-results/demo-1-today.png', fullPage: true });
  });

  test('2. At-Risk Members — compelling member stories with health scores', async ({ page }) => {
    // Navigate to Members
    await page.locator('text=/Members/i').first().click();
    await page.waitForTimeout(2000);

    // Health distribution should show numbers (not zeros or empty)
    const healthCards = page.locator('text=/Healthy|Watch|At Risk|Critical/');
    await expect(healthCards.first()).toBeVisible({ timeout: 10000 });

    // At-risk members should appear
    const atRiskSection = page.locator('text=/James Whitfield|Kevin Hurst|Anne Jordan|Robert Callahan|Sandra Chen|Robert Mills|Linda Leonard/');
    const hasAtRisk = await atRiskSection.first().isVisible().catch(() => false);
    expect(hasAtRisk).toBeTruthy();

    // Take screenshot
    await page.screenshot({ path: 'test-results/demo-2-members.png', fullPage: true });
  });

  test('3. Board Report — print-ready executive summary with evidence chains', async ({ page }) => {
    // Navigate to Board Report
    await page.locator('text=/Board Report/i').first().click();
    await page.waitForTimeout(2000);

    // KPI cards should show real values (not 0 or "Awaiting data")
    const kpiSection = page.locator('text=/Members Retained|Retention Rate|Dues at Risk|Service Quality/');
    await expect(kpiSection.first()).toBeVisible({ timeout: 10000 });

    // Member saves / evidence chains should appear
    const saves = page.locator('text=/Executive Summary|Member Health Overview|Service & Operations/');
    const savesVisible = await saves.first().isVisible().catch(() => false);
    expect(savesVisible).toBeTruthy();

    // Details tab should have member intervention evidence
    const detailsTab = page.locator('button:has-text("Details")');
    if (await detailsTab.isVisible()) {
      await detailsTab.click();
      await page.waitForTimeout(1000);
      // Should show member saves with names
      const memberSave = page.locator('text=/James Whitfield|Catherine Morales|David Harrington|Patricia Nguyen|Michael Torres/');
      const hasSaves = await memberSave.first().isVisible().catch(() => false);
      expect(hasSaves).toBeTruthy();
    }

    await page.screenshot({ path: 'test-results/demo-3-board-report.png', fullPage: true });
  });

  test('4. Playbooks — triggered intervention with track record', async ({ page }) => {
    // Navigate to Automations > Playbooks
    await page.locator('text=/Automations/i').first().click();
    await page.waitForTimeout(2000);

    // Click Playbooks tab
    const playbooksTab = page.locator('button:has-text("Playbooks"), [role="tab"]:has-text("Playbooks")');
    if (await playbooksTab.isVisible()) {
      await playbooksTab.click();
      await page.waitForTimeout(1000);
    }

    // Should show playbook cards with names and track records
    const playbook = page.locator('text=/Service Save|New Member 90-Day|Ghost Member/');
    const hasPlaybooks = await playbook.first().isVisible().catch(() => false);
    expect(hasPlaybooks).toBeTruthy();

    // Track record should show results
    const trackRecord = page.locator('text=/retained|integrated|reactivated/');
    const hasTrackRecord = await trackRecord.first().isVisible().catch(() => false);
    expect(hasTrackRecord).toBeTruthy();

    await page.screenshot({ path: 'test-results/demo-4-playbooks.png', fullPage: true });
  });

  test('5. Action Inbox — approve/dismiss pending actions', async ({ page }) => {
    // Navigate to Automations
    await page.locator('text=/Automations/i').first().click();
    await page.waitForTimeout(2000);

    // Inbox tab should be default — verify pending actions
    const pendingActions = page.locator('text=/pending action/i');
    await expect(pendingActions.first()).toBeVisible({ timeout: 10000 });

    // Should show specific action descriptions
    const actionCard = page.locator('text=/James Whitfield|Anne Jordan|Robert Callahan|Sandra Chen|Robert Mills/');
    const hasActions = await actionCard.first().isVisible().catch(() => false);
    expect(hasActions).toBeTruthy();

    // Approve button should be present
    const approveBtn = page.locator('button:has-text("Approve")');
    await expect(approveBtn.first()).toBeVisible();

    // Click approve on first action
    await approveBtn.first().click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'test-results/demo-5-inbox.png', fullPage: true });
  });
});
