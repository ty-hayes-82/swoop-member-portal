import { test, expect } from '@playwright/test';
import { enterGuidedDemo, importGates, getText, nav } from './_helpers.js';

test.beforeEach(async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['members', 'tee-sheet', 'fb', 'complaints', 'email', 'weather', 'pipeline', 'agents']);
});

test('Today — rounds + actions + member alerts', async ({ page }) => {
  const t = await getText(page);
  expect(t).toContain('rounds booked');
  expect(t).toContain('Action Queue');
});

test('Members — health scores and archetypes', async ({ page }) => {
  await nav(page, 'Members');
  const t = await getText(page);
  expect(t).toMatch(/HEALTHY|WATCH|AT RISK|CRITICAL/i);
  expect(t).toMatch(/Die-Hard Golfer|Social Butterfly|Weekend Warrior/);
});

test('Tee Sheet — full tee times', async ({ page }) => {
  await nav(page, 'Tee Sheet');
  const t = await getText(page);
  expect(t).toContain('rounds booked');
  expect(t).toMatch(/7:00 AM|8:00 AM/);
});

test('Service — consistency score', async ({ page }) => {
  await nav(page, 'Service');
  expect(await getText(page)).toMatch(/Service Consistency|complaint/i);
});

test('Board Report — full KPIs', async ({ page }) => {
  await nav(page, 'Board Report');
  expect(await getText(page)).not.toContain('Board report needs data');
});

test('Automations — actions with member names', async ({ page }) => {
  await nav(page, 'Automations');
  expect(await getText(page)).toMatch(/pending|Approve/);
});
