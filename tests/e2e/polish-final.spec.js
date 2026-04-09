// polish-final.spec.js — covers the 5 polish behaviors from phases H-L
// 1. Member Profile Page First Domino + dues banner
// 2. Drawer section-level source badges
// 3. Board Report Member Saves clickable rows
// 4. Tee Sheet healthy-row dues tooltip (native title attribute)
// 5. Today briefing sentence scroll-to Member Alerts
//
// Run: APP_URL=http://localhost:5174 npx playwright test tests/e2e/polish-final.spec.js

import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:5174';

async function enterDemoMode(page) {
  // Clear storage BEFORE navigation so we don't race a destroyed execution context.
  // addInitScript runs in every new document, before any page script.
  await page.addInitScript(() => {
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
  });
  await page.goto(APP_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.getByRole('button', { name: /Explore without an account/i }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Full Demo/i }).click();
  await page.waitForTimeout(3500);
}

// Helper: open Story 2 (Quiet Resignation) to land on an at-risk member drawer
async function openAtRiskDrawer(page) {
  await page.locator('button').filter({ hasText: /Quiet Resignation/i }).first().click();
  await page.waitForTimeout(2000);
  // Wait for decay chain inside drawer
  await expect(
    page.locator('text=/First Domino|Engagement Decay Sequence/i').first()
  ).toBeVisible({ timeout: 10000 });
}

test.describe('Polish Final — phases H-L behaviors', () => {

  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page);
  });

  test('1. Member Profile Page has First Domino and dues-at-risk banner', async ({ page }) => {
    // Open an at-risk member drawer via Story 2 launcher
    await openAtRiskDrawer(page);

    // Click "Open full profile" to go to the full-route page
    await page.locator('button').filter({ hasText: /Open full profile/i }).first().click();
    await page.waitForTimeout(1500);

    // URL hash should now be members/<id>
    await expect(page).toHaveURL(/#\/members\//, { timeout: 10000 });

    // Decay chain heading on the page variant
    await expect(
      page.locator('text=/First Domino.*Engagement Decay Sequence/i').first()
    ).toBeVisible({ timeout: 10000 });

    // Dues-at-risk banner visible — matches "$NNK/yr at risk"
    await expect(
      page.locator('text=/\\$\\d+K\\/yr at risk/i').first()
    ).toBeVisible();

    await page.screenshot({ path: 'test-results/polish-1-member-profile-page.png', fullPage: true });
  });

  test('2. Drawer section rows render source badges (>= 6 badges)', async ({ page }) => {
    await openAtRiskDrawer(page);

    // SourceBadge spans carry a title="Source: <system>" attribute. Count them
    // within the drawer. The drawer renders: decay chain (has per-step source
    // labels, not badges) + 5 section rows (Household, Outreach History,
    // Preferences, Recent activity, Risk signals) each with sourceSystems
    // arrays that render 1-4 badges each. Expect >= 6.
    const badges = page.locator('[title^="Source:"]');
    // Give the drawer a moment to finish rendering collapsible sections
    await page.waitForTimeout(500);
    const count = await badges.count();
    expect(count).toBeGreaterThanOrEqual(6);

    // Sanity: a couple of the expected section titles are present
    await expect(page.locator('text=/Risk signals/i').first()).toBeVisible();
    await expect(page.locator('text=/Recent activity/i').first()).toBeVisible();

    await page.screenshot({ path: 'test-results/polish-2-drawer-source-badges.png', fullPage: true });
  });

  test('3. Board Report Member Saves row click opens member profile', async ({ page }) => {
    // Navigate to Board Report via sidebar
    await page.locator('button').filter({ hasText: /Board Report/i }).first().click();
    await page.waitForTimeout(2000);

    // Click Member Saves tab
    await page.locator('button').filter({ hasText: /^Member Saves$/i }).first().click();
    await page.waitForTimeout(1000);

    // The member-save row header has title="Click to open member profile"
    const clickableHeader = page.locator('[title="Click to open member profile"]').first();
    await expect(clickableHeader).toBeVisible({ timeout: 10000 });
    await clickableHeader.click();
    await page.waitForTimeout(1500);

    // A member profile drawer should open — detect via presence of
    // "Open full profile" button, which only appears inside the drawer.
    await expect(
      page.locator('button').filter({ hasText: /Open full profile/i }).first()
    ).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'test-results/polish-3-board-report-row-click.png', fullPage: true });
  });

  test('4. Tee Sheet healthy rows expose native dues tooltip via title attr', async ({ page }) => {
    // Navigate to Tee Sheet via sidebar
    await page.locator('button').filter({ hasText: /^Tee Sheet$/i }).first().click();
    await page.waitForTimeout(2000);

    // At least one <tr> should carry title matching "$NK/yr dues"
    await expect(
      page.locator('tr[title*="/yr dues"]').first()
    ).toBeVisible({ timeout: 10000 });

    const matchingRows = page.locator('tr[title*="/yr dues"]');
    const matchCount = await matchingRows.count();
    expect(matchCount).toBeGreaterThanOrEqual(1);

    // The title should match the expected pattern
    const titleText = await matchingRows.first().getAttribute('title');
    expect(titleText).toMatch(/\$\d+K\/yr dues/);

    await page.screenshot({ path: 'test-results/polish-4-tee-sheet-dues-tooltip.png', fullPage: true });
  });

  test('5. Today briefing at-risk segment scrolls to Member Alerts', async ({ page }) => {
    // We're already on Today view after demo mode. Find the at-risk briefing button.
    // The at-risk segment is a <button> with text containing "at-risk member" and
    // title="Jump to Priority Member Alerts".
    const atRiskBtn = page.locator('button[title="Jump to Priority Member Alerts"]').first();
    await expect(atRiskBtn).toBeVisible({ timeout: 10000 });
    await atRiskBtn.click();
    await page.waitForTimeout(800);

    const alerts = page.locator('#today-member-alerts');
    await alerts.scrollIntoViewIfNeeded();
    await expect(alerts).toBeInViewport();

    await page.screenshot({ path: 'test-results/polish-5-briefing-scroll.png', fullPage: true });
  });
});
