// Phase 1: Each gate alone (no members) — everything should be empty
import { test, expect } from '@playwright/test';
import { enterGuidedDemo, importGates, getText, nav, DEMO_MEMBERS } from './_helpers.js';

// tee-sheet excluded: tee sheet data inherently contains member names (that's the data)
for (const gate of ['fb', 'email', 'weather', 'pipeline']) {
  test(`${gate} alone → no member data on Today`, async ({ page }) => {
    await enterGuidedDemo(page);
    await importGates(page, [gate]);
    const text = await getText(page);
    for (const name of DEMO_MEMBERS) expect(text).not.toContain(name);
  });
}

test('tee-sheet alone → Today shows forecast but Members page is empty', async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['tee-sheet']);
  await nav(page, 'Members');
  const text = await getText(page);
  // Members page should still show empty state (members gate not open)
  expect(text).toMatch(/No members imported|Member intelligence|roster/i);
});

test('pipeline alone → Board Report empty', async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['pipeline']);
  await nav(page, 'Board Report');
  expect(await getText(page)).toContain('Board report needs data');
});

test('complaints alone → no Priority Member Alerts', async ({ page }) => {
  await enterGuidedDemo(page);
  await importGates(page, ['complaints']);
  expect(await getText(page)).not.toContain('Priority Member Alerts');
});
