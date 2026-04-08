// Phase 6: Negative leakage tests — specifically verify data does NOT appear where it shouldn't
import { test, expect } from '@playwright/test';
import { enterGuidedDemo, importGates, getText, nav, DEMO_MEMBERS } from './_helpers.js';

// --- F&B only: no member names anywhere ---
test('fb only → no member names on any page', async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['fb']);
  // Check Today
  let t = await getText(page);
  for (const name of DEMO_MEMBERS) expect(t).not.toContain(name);
  // Check Members
  await nav(page, 'Members');
  t = await getText(page);
  expect(t).toMatch(/No members imported|Member intelligence|roster/i);
  // Check Tee Sheet
  await nav(page, 'Tee Sheet');
  expect(await getText(page)).toContain('No tee sheet data');
});

// --- Email only: no member data ---
test('email only → no health scores, no member data', async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['email']);
  const t = await getText(page);
  expect(t).not.toMatch(/HEALTHY|WATCH|AT RISK|CRITICAL/i);
  for (const name of DEMO_MEMBERS) expect(t).not.toContain(name);
});

// --- Weather only: no tee sheet data ---
test('weather only → tee sheet still empty', async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['weather']);
  await nav(page, 'Tee Sheet');
  expect(await getText(page)).toContain('No tee sheet data');
});

// --- Agents only: no actions without members ---
test('agents only → automations has no pending actions', async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['agents']);
  await nav(page, 'Automations');
  expect(await getText(page)).toContain('All caught up');
});

// --- Pipeline only: board report empty without members ---
test('pipeline only → board report needs data', async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['pipeline']);
  await nav(page, 'Board Report');
  expect(await getText(page)).toContain('Board report needs data');
});

// --- Members + tee-sheet: no F&B spending in member drawer ---
test('members+tee-sheet → member drawer has no spending data', async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['members', 'tee-sheet']);
  await nav(page, 'Members');
  const row = page.locator('[class*="cursor-pointer"]').filter({ hasText: /›/ }).first();
  if (await row.isVisible()) {
    await row.click();
    await page.waitForTimeout(1000);
    expect(await getText(page)).not.toContain('Spending Trend');
  }
});

// --- Members + complaints: no tee sheet, no rounds ---
test('members+complaints → Today has no rounds, tee sheet empty', async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['members', 'complaints']);
  expect(await getText(page)).not.toContain('rounds booked');
  await nav(page, 'Tee Sheet');
  expect(await getText(page)).toContain('No tee sheet data');
});

// --- Tee sheet + agents (no members): no actions ---
test('tee-sheet+agents (no members) → no actions in automations', async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['tee-sheet', 'agents']);
  await nav(page, 'Automations');
  expect(await getText(page)).toContain('All caught up');
});

// --- Email + pipeline (no members): board report empty ---
test('email+pipeline (no members) → board report needs data', async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['email', 'pipeline']);
  await nav(page, 'Board Report');
  expect(await getText(page)).toContain('Board report needs data');
});

// --- Complaints + pipeline (no members): board report needs data ---
test('complaints+pipeline (no members) → board report needs data', async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['complaints', 'pipeline']);
  await nav(page, 'Board Report');
  expect(await getText(page)).toContain('Board report needs data');
});

// --- Members + fb: no service data without complaints ---
test('members+fb → service page has no complaint data', async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['members', 'fb']);
  await nav(page, 'Service');
  expect(await getText(page)).not.toContain('Service Consistency Score');
});

// --- Full except agents: automations should be empty ---
test('all gates except agents → automations empty', async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['members', 'tee-sheet', 'fb', 'complaints', 'email', 'weather', 'pipeline']);
  await nav(page, 'Automations');
  expect(await getText(page)).toContain('All caught up');
});

// --- Full except complaints: service page empty ---
test('all gates except complaints → service page has no complaint data', async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['members', 'tee-sheet', 'fb', 'email', 'weather', 'pipeline', 'agents']);
  await nav(page, 'Service');
  expect(await getText(page)).not.toContain('Service Consistency Score');
});

// --- Full except tee-sheet: no rounds, tee sheet empty ---
test('all gates except tee-sheet → no rounds, tee sheet empty', async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['members', 'fb', 'complaints', 'email', 'weather', 'pipeline', 'agents']);
  expect(await getText(page)).not.toContain('rounds booked');
  await nav(page, 'Tee Sheet');
  expect(await getText(page)).toContain('No tee sheet data');
});

// --- Full except pipeline: board report needs data ---
test('all gates except pipeline → board report needs data', async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['members', 'tee-sheet', 'fb', 'complaints', 'email', 'weather', 'agents']);
  await nav(page, 'Board Report');
  expect(await getText(page)).toContain('Board report needs data');
});
