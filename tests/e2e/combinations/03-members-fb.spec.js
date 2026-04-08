import { test, expect } from '@playwright/test';
import { enterGuidedDemo, importGates, getText, nav } from './_helpers.js';

test.beforeEach(async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['members', 'fb']);
});

test('Today has NO rounds', async ({ page }) => {
  expect(await getText(page)).not.toContain('rounds booked');
});

test('Tee Sheet still empty', async ({ page }) => {
  await nav(page, 'Tee Sheet');
  expect(await getText(page)).toContain('No tee sheet data');
});

test('Member drawer shows Spending Trend', async ({ page }) => {
  await nav(page, 'Members');
  const row = page.locator('[class*="cursor-pointer"]').filter({ hasText: /›/ }).first();
  if (await row.isVisible()) {
    await row.click();
    await page.waitForTimeout(1000);
    expect(await getText(page)).toContain('Spending Trend');
  }
});

test('Service page still empty', async ({ page }) => {
  await nav(page, 'Service');
  expect(await getText(page)).not.toContain('Service Consistency Score');
});
