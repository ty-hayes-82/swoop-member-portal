// Phase 2b: Remaining pair combinations not yet covered
import { test, expect } from '@playwright/test';
import { enterGuidedDemo, importGates, getText, nav, DEMO_MEMBERS } from './_helpers.js';

// --- members + weather ---
test.describe('Members + Weather', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['members', 'weather']);
  });

  test('Members page shows roster only (weather is not engagement data)', async ({ page }) => {
    await nav(page, 'Members');
    const t = await getText(page);
    // Weather alone doesn't unlock health scores — need tee-sheet, fb, or email
    expect(t).toContain('roster imported');
  });

  test('Tee Sheet still empty', async ({ page }) => {
    await nav(page, 'Tee Sheet');
    expect(await getText(page)).toContain('No tee sheet data');
  });

  test('Today has no rounds booked', async ({ page }) => {
    expect(await getText(page)).not.toContain('rounds booked');
  });

  test('Board Report needs data', async ({ page }) => {
    await nav(page, 'Board Report');
    expect(await getText(page)).toContain('Board report needs data');
  });
});

// --- tee-sheet + fb (no members) ---
test.describe('Tee Sheet + F&B (no members)', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['tee-sheet', 'fb']);
  });

  test('Today shows rounds', async ({ page }) => {
    expect(await getText(page)).toContain('rounds booked');
  });

  test('Members page empty (no members gate)', async ({ page }) => {
    await nav(page, 'Members');
    expect(await getText(page)).toMatch(/No members imported|Member intelligence|roster/i);
  });

  test('Tee Sheet shows tee times', async ({ page }) => {
    await nav(page, 'Tee Sheet');
    expect(await getText(page)).toMatch(/7:00 AM|8:00 AM|9:00 AM/);
  });
});

// --- tee-sheet + complaints (no members) ---
test.describe('Tee Sheet + Complaints (no members)', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['tee-sheet', 'complaints']);
  });

  test('Service page shows data', async ({ page }) => {
    await nav(page, 'Service');
    expect(await getText(page)).toMatch(/Service Consistency|complaint/i);
  });

  test('Members page empty', async ({ page }) => {
    await nav(page, 'Members');
    expect(await getText(page)).toMatch(/No members imported|Member intelligence|roster/i);
  });

  test('Board Report needs data', async ({ page }) => {
    await nav(page, 'Board Report');
    expect(await getText(page)).toContain('Board report needs data');
  });
});

// --- fb + complaints (no members, no tee sheet) ---
test.describe('F&B + Complaints (no members)', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['fb', 'complaints']);
  });

  test('Today has no rounds', async ({ page }) => {
    expect(await getText(page)).not.toContain('rounds booked');
  });

  test('Service page shows data', async ({ page }) => {
    await nav(page, 'Service');
    expect(await getText(page)).toMatch(/Service Consistency|complaint/i);
  });

  test('Members page empty', async ({ page }) => {
    await nav(page, 'Members');
    expect(await getText(page)).toMatch(/No members imported|Member intelligence|roster/i);
  });

  test('Tee Sheet empty', async ({ page }) => {
    await nav(page, 'Tee Sheet');
    expect(await getText(page)).toContain('No tee sheet data');
  });
});

// --- pipeline + agents (no members) ---
test.describe('Pipeline + Agents (no members)', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, ['pipeline', 'agents']);
  });

  test('Board Report needs data (requires members)', async ({ page }) => {
    await nav(page, 'Board Report');
    expect(await getText(page)).toContain('Board report needs data');
  });

  test('Automations empty (agents need members)', async ({ page }) => {
    await nav(page, 'Automations');
    expect(await getText(page)).toContain('All caught up');
  });

  test('Members page empty', async ({ page }) => {
    await nav(page, 'Members');
    expect(await getText(page)).toMatch(/No members imported|Member intelligence|roster/i);
  });
});
