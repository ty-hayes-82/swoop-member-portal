import { test, expect } from '@playwright/test';
import { enterGuidedDemo, importGates, getText, nav } from './_helpers.js';

test.describe('Members + Tee Sheet + F&B', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members', 'tee-sheet', 'fb']);
  });

  test('Today shows rounds', async ({ page }) => {
    expect(await getText(page)).toContain('rounds booked');
  });

  test('Tee Sheet shows data', async ({ page }) => {
    await nav(page, 'Tee Sheet');
    expect(await getText(page)).toMatch(/7:00 AM|8:00 AM/);
  });

  test('Member drawer has Spending Trend AND Health Breakdown', async ({ page }) => {
    await nav(page, 'Members');
    const row = page.locator('[class*="cursor-pointer"]').filter({ hasText: /›/ }).first();
    if (await row.isVisible()) {
      await row.click();
      await page.waitForTimeout(1000);
      const t = await getText(page);
      expect(t).toContain('Spending Trend');
      expect(t).toContain('Health Score Breakdown');
    }
  });

  test('Service page still empty', async ({ page }) => {
    await nav(page, 'Service');
    expect(await getText(page)).not.toContain('Service Consistency Score');
  });
});

test.describe('Members + Tee Sheet + Complaints', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members', 'tee-sheet', 'complaints']);
  });

  test('Service page shows data', async ({ page }) => {
    await nav(page, 'Service');
    expect(await getText(page)).toMatch(/Service Consistency|complaint/i);
  });

  test('Today shows rounds', async ({ page }) => {
    expect(await getText(page)).toContain('rounds booked');
  });
});

test.describe('Members + Agents + Tee Sheet', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members', 'agents', 'tee-sheet']);
  });

  test('Today shows both rounds and actions', async ({ page }) => {
    const t = await getText(page);
    expect(t).toContain('rounds booked');
    expect(t).toContain('Action Queue');
  });
});

test.describe('Members + Complaints + Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members', 'complaints', 'pipeline']);
  });

  test('Board Report shows data', async ({ page }) => {
    await nav(page, 'Board Report');
    expect(await getText(page)).not.toContain('Board report needs data');
  });

  test('Service page shows data', async ({ page }) => {
    await nav(page, 'Service');
    expect(await getText(page)).toMatch(/Service Consistency|complaint/i);
  });

  test('Tee Sheet still empty', async ({ page }) => {
    await nav(page, 'Tee Sheet');
    expect(await getText(page)).toContain('No tee sheet data');
  });
});
