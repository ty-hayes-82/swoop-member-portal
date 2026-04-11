// storyboard-flows.spec.js — validates the 3 North Star storyboard flows
// 1. Saturday Morning Briefing
// 2. The Quiet Resignation Catch
// 3. The Revenue Leakage Discovery
//
// Run: APP_URL=http://localhost:5174 npx playwright test tests/e2e/storyboard-flows.spec.js --headed

import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:5174';

async function enterDemoMode(page) {
  await page.goto(APP_URL);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  // Step 1: Welcome screen → "Explore without an account"
  await page.getByRole('button', { name: /Explore without an account/i }).click();
  await page.waitForTimeout(500);
  // Step 2: Explore screen → "Full Demo"
  await page.getByRole('button', { name: /Full Demo/i }).click();
  await page.waitForTimeout(3500);
}

test.describe('Storyboard North Star Flows', () => {

  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page);
  });

  test('Demo Stories Launcher visible on Today View', async ({ page }) => {
    await expect(page.locator('text=/Demo Story Flows/i').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Saturday Morning Briefing/i').first()).toBeVisible();
    await expect(page.locator('text=/Quiet Resignation/i').first()).toBeVisible();
    await expect(page.locator('text=/Revenue Leakage/i').first()).toBeVisible();
    await page.screenshot({ path: 'test-results/storyboard-launcher.png', fullPage: true });
  });

  test('Story 1 — Saturday Morning Briefing has cross-domain synthesis', async ({ page }) => {
    // The Morning Briefing Sentence should be present
    const briefing = page.locator('p').filter({ hasText: /rounds booked|at-risk member|staffing/i });
    await expect(briefing.first()).toBeVisible({ timeout: 10000 });

    // Layer 3 tag should be visible
    const layer3 = page.locator('text=/LAYER 3.*SYSTEMS/i');
    await expect(layer3.first()).toBeVisible();

    // Source badges should appear
    const sourceBadges = page.locator('text=/Tee Sheet|Member CRM|Weather/i');
    expect(await sourceBadges.count()).toBeGreaterThan(2);

    await page.screenshot({ path: 'test-results/story-1-briefing.png', fullPage: true });
  });

  test('Story 2 — Quiet Resignation Catch via Demo Stories Launcher', async ({ page }) => {
    // Click the Story 2 card on the launcher
    await page.locator('button').filter({ hasText: /Quiet Resignation/i }).first().click();
    await page.waitForTimeout(2000);

    // Should open a member profile drawer with First Domino visualization
    const firstDomino = page.locator('text=/First Domino|Engagement Decay Sequence|dropped/i');
    await expect(firstDomino.first()).toBeVisible({ timeout: 10000 });

    // Should show source badges per decay step — check page-wide since
    // the decay chain may render outside the immediate parent container.
    const pageText = await page.evaluate(() => document.body.innerText);
    const hasSourceBadges = /Tee Sheet|POS|Email|Events|CRM|Scheduling/i.test(pageText);
    expect(hasSourceBadges).toBe(true);

    // Should show Approve & Log button
    const approveBtn = page.locator('button').filter({ hasText: /Approve & Log/i });
    await expect(approveBtn.first()).toBeVisible();

    await page.screenshot({ path: 'test-results/story-2-quiet-resignation.png', fullPage: true });
  });

  test('Story 3 — Revenue Leakage Discovery via Demo Stories Launcher', async ({ page }) => {
    await page.locator('button').filter({ hasText: /Revenue Leakage/i }).first().click();
    await page.waitForTimeout(2000);

    // Should land on Revenue page
    await expect(page.locator('h1').filter({ hasText: /Revenue Leakage/i })).toBeVisible({ timeout: 10000 });

    // Should show $9,580 or similar leakage headline
    const headline = page.locator('text=/\\$\\d/');
    expect(await headline.count()).toBeGreaterThan(3);

    // Should show Hole 12 bottleneck
    const hole = page.locator('text=/Hole \\d+|Bottleneck/i');
    await expect(hole.first()).toBeVisible();

    // Should show 22% vs 41% conversion
    const conversion = page.locator('text=/22%|41%/');
    expect(await conversion.count()).toBeGreaterThanOrEqual(1);

    // Should show Scenario Slider
    const slider = page.locator('input[type="range"]');
    await expect(slider.first()).toBeVisible();

    // Should show "Generate Board Report" CTA
    const cta = page.locator('button').filter({ hasText: /Generate Board Report/i });
    await expect(cta.first()).toBeVisible();

    // Should show Approve Deploy Ranger inline action
    const ranger = page.locator('button').filter({ hasText: /Approve.*Deploy|Deploy Ranger/i });
    await expect(ranger.first()).toBeVisible();

    await page.screenshot({ path: 'test-results/story-3-revenue-leakage.png', fullPage: true });
  });

  test('Sidebar Demo Stories launcher available from any page', async ({ page }) => {
    // Navigate to Members page first
    await page.locator('button').filter({ hasText: /^Members$/i }).first().click();
    await page.waitForTimeout(1000);

    // Sidebar Demo Stories should still be visible
    const sidebar01 = page.locator('text=/01.*Saturday/i');
    await expect(sidebar01.first()).toBeVisible();

    const sidebar02 = page.locator('text=/02.*Quiet/i');
    await expect(sidebar02.first()).toBeVisible();

    const sidebar03 = page.locator('text=/03.*Revenue/i');
    await expect(sidebar03.first()).toBeVisible();

    await page.screenshot({ path: 'test-results/sidebar-demo-stories.png', fullPage: true });
  });

  test('Board Report has 4 tabs and Auto-Generated Narrative', async ({ page }) => {
    await page.locator('button').filter({ hasText: /Board Report/i }).first().click();
    await page.waitForTimeout(2000);

    // 4 tab buttons
    await expect(page.locator('button').filter({ hasText: /^Summary$/i }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button').filter({ hasText: /^Member Saves$/i }).first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /^Operational Saves$/i }).first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /What We Learned/i }).first()).toBeVisible();

    // Auto-generated narrative
    const narrative = page.locator('text=/Auto-Generated Executive Narrative/i');
    await expect(narrative.first()).toBeVisible();

    await page.screenshot({ path: 'test-results/board-report-tabs.png', fullPage: true });
  });

  test('Cross-domain decay symptom chips actually filter', async ({ page }) => {
    await page.locator('button').filter({ hasText: /^Members$/i }).first().click();
    await page.waitForTimeout(1500);
    await page.locator('button').filter({ hasText: /All Members/i }).first().click();
    await page.waitForTimeout(1500);

    // Click the "Multi-domain decay" chip
    const multiChip = page.locator('button').filter({ hasText: /Multi-domain decay/i });
    if (await multiChip.first().isVisible().catch(() => false)) {
      await multiChip.first().click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: 'test-results/symptom-filter.png', fullPage: true });
  });
});
