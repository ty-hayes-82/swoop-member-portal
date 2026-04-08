import { test, expect } from '@playwright/test';
import { enterGuidedDemo, importGates, getText, nav } from './_helpers.js';

test.beforeEach(async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['members', 'tee-sheet']);
});

test('Today header shows rounds booked', async ({ page }) => {
  expect(await getText(page)).toContain('rounds booked');
});

test('Tee Sheet page shows tee times', async ({ page }) => {
  await nav(page, 'Tee Sheet');
  expect(await getText(page)).toMatch(/7:00 AM|8:00 AM|9:00 AM/);
});

test('Members page shows health scores', async ({ page }) => {
  await nav(page, 'Members');
  expect(await getText(page)).toMatch(/HEALTHY|WATCH|AT RISK|CRITICAL/i);
});

test('Service page still empty', async ({ page }) => {
  await nav(page, 'Service');
  const t = await getText(page);
  expect(t).not.toContain('Service Consistency Score');
  expect(t).not.toContain('Grill Room');
});

test('Member drawer has NO spending trend', async ({ page }) => {
  await nav(page, 'Members');
  const row = page.locator('[class*="cursor-pointer"]').filter({ hasText: /›/ }).first();
  if (await row.isVisible()) {
    await row.click();
    await page.waitForTimeout(1000);
    expect(await getText(page)).not.toContain('Spending Trend');
  }
});
