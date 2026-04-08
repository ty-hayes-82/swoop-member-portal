import { test, expect } from '@playwright/test';
import { enterGuidedDemo, importGates, getText, nav } from './_helpers.js';

test.beforeEach(async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['members', 'complaints']);
});

test('Service page shows complaint data', async ({ page }) => {
  await nav(page, 'Service');
  expect(await getText(page)).toMatch(/Service Consistency|complaint|Complaint/i);
});

test('Tee Sheet still empty', async ({ page }) => {
  await nav(page, 'Tee Sheet');
  expect(await getText(page)).toContain('No tee sheet data');
});

test('Today has NO rounds, NO revenue', async ({ page }) => {
  const t = await getText(page);
  expect(t).not.toContain('rounds booked');
  expect(t).not.toContain('Revenue Snapshot');
});
