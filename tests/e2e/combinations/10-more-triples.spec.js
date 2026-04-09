// Phase 3b: Additional triple combinations
import { test, expect } from '@playwright/test';
import { enterGuidedDemo, importGates, getText, nav } from './_helpers.js';

// --- Members + F&B + Complaints ---
test.describe('Members + F&B + Complaints', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members', 'fb', 'complaints']);
  });

  test('Service page shows data', async ({ page }) => {
    await nav(page, 'Service');
    expect(await getText(page)).toMatch(/Service Consistency|complaint/i);
  });

  test('Members page has health scores (fb is engagement)', async ({ page }) => {
    await nav(page, 'Members');
    expect(await getText(page)).toMatch(/HEALTHY|WATCH|AT RISK|CRITICAL/i);
  });

  test('Tee Sheet still empty', async ({ page }) => {
    await nav(page, 'Tee Sheet');
    expect(await getText(page)).toContain('No tee sheet data');
  });

  test('Today has NO rounds', async ({ page }) => {
    expect(await getText(page)).not.toContain('rounds booked');
  });

  test('Board Report needs data (no pipeline)', async ({ page }) => {
    await nav(page, 'Board Report');
    // Use accessibility tree locator (document.body.innerText elides text below the fold)
    await expect(page.locator('text=/Board report needs data|Awaiting data/i').first()).toBeVisible({ timeout: 5000 });
  });
});

// --- Members + Email + Weather ---
test.describe('Members + Email + Weather', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members', 'email', 'weather']);
  });

  test('Members page has health scores', async ({ page }) => {
    await nav(page, 'Members');
    expect(await getText(page)).toMatch(/HEALTHY|WATCH|AT RISK|CRITICAL/i);
  });

  test('Tee Sheet still empty', async ({ page }) => {
    await nav(page, 'Tee Sheet');
    expect(await getText(page)).toContain('No tee sheet data');
  });

  test('Automations empty (no agents gate)', async ({ page }) => {
    await nav(page, 'Automations');
    expect(await getText(page)).toContain('All caught up');
  });
});

// --- Members + Tee Sheet + Email ---
test.describe('Members + Tee Sheet + Email', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members', 'tee-sheet', 'email']);
  });

  test('Today shows rounds', async ({ page }) => {
    expect(await getText(page)).toContain('rounds booked');
  });

  test('Members page has health scores', async ({ page }) => {
    await nav(page, 'Members');
    expect(await getText(page)).toMatch(/HEALTHY|WATCH|AT RISK|CRITICAL/i);
  });

  test('Service page still empty (no complaints)', async ({ page }) => {
    await nav(page, 'Service');
    expect(await getText(page)).not.toContain('Service Consistency Score');
  });

  test('Tee Sheet shows data', async ({ page }) => {
    await nav(page, 'Tee Sheet');
    expect(await getText(page)).toMatch(/7:00 AM|8:00 AM/);
  });
});

// --- Members + Tee Sheet + Pipeline ---
test.describe('Members + Tee Sheet + Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members', 'tee-sheet', 'pipeline']);
  });

  test('Board Report shows KPIs', async ({ page }) => {
    await nav(page, 'Board Report');
    expect(await getText(page)).not.toContain('Board report needs data');
  });

  test('Today shows rounds', async ({ page }) => {
    expect(await getText(page)).toContain('rounds booked');
  });

  test('Service page still empty', async ({ page }) => {
    await nav(page, 'Service');
    expect(await getText(page)).not.toContain('Service Consistency Score');
  });
});

// --- Members + Agents + Complaints ---
test.describe('Members + Agents + Complaints', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members', 'agents', 'complaints']);
  });

  test('Automations shows actions', async ({ page }) => {
    await nav(page, 'Automations');
    expect(await getText(page)).toMatch(/pending|Approve/);
  });

  test('Service page shows data', async ({ page }) => {
    await nav(page, 'Service');
    expect(await getText(page)).toMatch(/Service Consistency|complaint/i);
  });

  test('Tee Sheet still empty', async ({ page }) => {
    await nav(page, 'Tee Sheet');
    expect(await getText(page)).toContain('No tee sheet data');
  });

  test('Today has no rounds', async ({ page }) => {
    expect(await getText(page)).not.toContain('rounds booked');
  });
});
