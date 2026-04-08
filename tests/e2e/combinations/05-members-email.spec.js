import { test, expect } from '@playwright/test';
import { enterGuidedDemo, importGates, getText, nav } from './_helpers.js';

test.beforeEach(async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['members', 'email']);
});

test('Members page has health scores', async ({ page }) => {
  await nav(page, 'Members');
  expect(await getText(page)).toMatch(/HEALTHY|WATCH|AT RISK|CRITICAL/i);
});

test('Tee Sheet still empty', async ({ page }) => {
  await nav(page, 'Tee Sheet');
  expect(await getText(page)).toContain('No tee sheet data');
});

test('Service page still empty', async ({ page }) => {
  await nav(page, 'Service');
  expect(await getText(page)).not.toContain('Service Consistency Score');
});
