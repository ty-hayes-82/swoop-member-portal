import { test, expect } from '@playwright/test';
import { enterGuidedDemo, importGates, getText, nav } from './_helpers.js';

test.describe('Members + Agents', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members', 'agents']);
  });

  test('Automations inbox shows pending actions', async ({ page }) => {
    await nav(page, 'Automations');
    expect(await getText(page)).toMatch(/pending|Approve/);
  });

  test('Today shows Action Queue', async ({ page }) => {
    expect(await getText(page)).toContain('Action Queue');
  });
});

test.describe('Members + Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members', 'pipeline']);
  });

  test('Board Report shows member KPIs', async ({ page }) => {
    await nav(page, 'Board Report');
    const t = await getText(page);
    expect(t).not.toContain('Board report needs data');
    expect(t).toMatch(/Members Retained|Retention|At Risk/);
  });
});
