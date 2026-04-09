// Phase 4: Quadruple combinations
import { test, expect } from '@playwright/test';
import { enterGuidedDemo, importGates, getText, nav } from './_helpers.js';

// --- Members + Tee Sheet + F&B + Complaints ---
test.describe('Members + Tee Sheet + F&B + Complaints', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members', 'tee-sheet', 'fb', 'complaints']);
  });

  test('Today shows rounds', async ({ page }) => {
    expect(await getText(page)).toContain('rounds booked');
  });

  test('Service page shows data', async ({ page }) => {
    await nav(page, 'Service');
    expect(await getText(page)).toMatch(/Service Consistency|complaint/i);
  });

  test('Members page has archetypes', async ({ page }) => {
    await nav(page, 'Members');
    expect(await getText(page)).toMatch(/Die-Hard Golfer|Social Butterfly|Weekend Warrior/);
  });

  test('Board Report needs data (no pipeline)', async ({ page }) => {
    await nav(page, 'Board Report');
    // Use accessibility tree locator (document.body.innerText elides text below the fold)
    await expect(page.locator('text=/Board report needs data|Awaiting data/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Automations empty (no agents)', async ({ page }) => {
    await nav(page, 'Automations');
    expect(await getText(page)).toContain('All caught up');
  });
});

// --- Members + Tee Sheet + Agents + Pipeline ---
test.describe('Members + Tee Sheet + Agents + Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members', 'tee-sheet', 'agents', 'pipeline']);
  });

  test('Today shows rounds and actions', async ({ page }) => {
    const t = await getText(page);
    expect(t).toContain('rounds booked');
    expect(t).toContain('Action Queue');
  });

  test('Board Report has KPIs', async ({ page }) => {
    await nav(page, 'Board Report');
    expect(await getText(page)).not.toContain('Board report needs data');
  });

  test('Automations shows actions', async ({ page }) => {
    await nav(page, 'Automations');
    expect(await getText(page)).toMatch(/pending|Approve/);
  });

  test('Service page still empty (no complaints)', async ({ page }) => {
    await nav(page, 'Service');
    expect(await getText(page)).not.toContain('Service Consistency Score');
  });
});

// --- Members + F&B + Complaints + Pipeline ---
test.describe('Members + F&B + Complaints + Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members', 'fb', 'complaints', 'pipeline']);
  });

  test('Board Report shows KPIs', async ({ page }) => {
    await nav(page, 'Board Report');
    expect(await getText(page)).not.toContain('Board report needs data');
  });

  test('Board Report has operational saves (pipeline+complaints)', async ({ page }) => {
    await nav(page, 'Board Report');
    const t = await getText(page);
    expect(t).toMatch(/Members Retained|Retention|saves/i);
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

// --- Members + Tee Sheet + Email + Complaints ---
test.describe('Members + Tee Sheet + Email + Complaints', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members', 'tee-sheet', 'email', 'complaints']);
  });

  test('Today shows rounds', async ({ page }) => {
    expect(await getText(page)).toContain('rounds booked');
  });

  test('Service page shows data', async ({ page }) => {
    await nav(page, 'Service');
    expect(await getText(page)).toMatch(/Service Consistency|complaint/i);
  });

  test('Members has health scores', async ({ page }) => {
    await nav(page, 'Members');
    expect(await getText(page)).toMatch(/HEALTHY|WATCH|AT RISK|CRITICAL/i);
  });

  test('Board Report needs data (no pipeline)', async ({ page }) => {
    await nav(page, 'Board Report');
    // Use accessibility tree locator (document.body.innerText elides text below the fold)
    await expect(page.locator('text=/Board report needs data|Awaiting data/i').first()).toBeVisible({ timeout: 5000 });
  });
});
