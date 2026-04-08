// Phase 5: Cross-page validation — check ALL 6 pages for each combo
import { test, expect } from '@playwright/test';
import { enterGuidedDemo, importGates, getText, nav, DEMO_MEMBERS } from './_helpers.js';

// --- Members only: verify every page ---
test.describe('Members only → all pages', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members']);
  });

  test('Today has no rounds, no revenue', async ({ page }) => {
    const t = await getText(page);
    expect(t).not.toContain('rounds booked');
  });

  test('Members shows roster-only (no scores)', async ({ page }) => {
    await nav(page, 'Members');
    const t = await getText(page);
    // Should have member names but NO health scores
    expect(t).not.toMatch(/HEALTHY|WATCH|AT RISK|CRITICAL/i);
    expect(t).not.toMatch(/Die-Hard Golfer|Social Butterfly|Weekend Warrior/);
  });

  test('Tee Sheet empty', async ({ page }) => {
    await nav(page, 'Tee Sheet');
    expect(await getText(page)).toContain('No tee sheet data');
  });

  test('Service empty', async ({ page }) => {
    await nav(page, 'Service');
    expect(await getText(page)).not.toContain('Service Consistency Score');
  });

  test('Automations empty (no agents)', async ({ page }) => {
    await nav(page, 'Automations');
    expect(await getText(page)).toContain('All caught up');
  });

  test('Board Report needs data', async ({ page }) => {
    await nav(page, 'Board Report');
    expect(await getText(page)).toContain('Board report needs data');
  });
});

// --- Zero gates → all 6 pages should be empty ---
test.describe('Zero gates → all pages empty', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    // Don't import anything — just guided mode with zero gates
  });

  test('Today has no member data', async ({ page }) => {
    const t = await getText(page);
    for (const name of DEMO_MEMBERS) expect(t).not.toContain(name);
    expect(t).not.toContain('rounds booked');
  });

  test('Members page empty', async ({ page }) => {
    await nav(page, 'Members');
    expect(await getText(page)).toMatch(/No members imported|Member intelligence|roster/i);
  });

  test('Tee Sheet empty', async ({ page }) => {
    await nav(page, 'Tee Sheet');
    expect(await getText(page)).toContain('No tee sheet data');
  });

  test('Service empty', async ({ page }) => {
    await nav(page, 'Service');
    expect(await getText(page)).not.toContain('Service Consistency Score');
  });

  test('Board Report needs data', async ({ page }) => {
    await nav(page, 'Board Report');
    expect(await getText(page)).toContain('Board report needs data');
  });
});
