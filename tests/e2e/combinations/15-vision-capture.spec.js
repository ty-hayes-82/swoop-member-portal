// 15-vision-capture — Takes full-page screenshots for each gate combination + page.
// Screenshots are analyzed by Gemini 2.5 Flash in a post-processing step.
// Run with: npx playwright test --config=playwright.insights.config.js
import { test } from '@playwright/test';
import { enterGuidedDemo, importGates, nav } from './_helpers.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.resolve(__dirname, '../../../vision-screenshots');
const MANIFEST_PATH = path.resolve(__dirname, '../../../vision-manifest.jsonl');

const COMBINATIONS = [
  { id: 'members+tee-sheet+fb+complaints+email', gates: ['members', 'tee-sheet', 'fb', 'complaints', 'email'] },
  { id: 'members+tee-sheet+fb+complaints+pipeline', gates: ['members', 'tee-sheet', 'fb', 'complaints', 'pipeline'] },
  { id: 'members+tee-sheet+fb+complaints+agents', gates: ['members', 'tee-sheet', 'fb', 'complaints', 'agents'] },
  { id: 'members+tee-sheet+fb+email+pipeline', gates: ['members', 'tee-sheet', 'fb', 'email', 'pipeline'] },
  { id: 'members+fb+complaints+email+pipeline', gates: ['members', 'fb', 'complaints', 'email', 'pipeline'] },
  { id: 'members+tee-sheet+complaints+email+agents', gates: ['members', 'tee-sheet', 'complaints', 'email', 'agents'] },
  { id: 'members+tee-sheet+fb+complaints+email+pipeline', gates: ['members', 'tee-sheet', 'fb', 'complaints', 'email', 'pipeline'] },
  { id: 'all-gates', gates: ['members', 'tee-sheet', 'fb', 'complaints', 'email', 'weather', 'pipeline', 'agents'] },
];

const PAGES = [
  { name: 'Today', nav: null },
  { name: 'Members', nav: 'Members' },
  { name: 'Tee Sheet', nav: 'Tee Sheet' },
  { name: 'Service', nav: 'Service' },
  { name: 'Board Report', nav: 'Board Report' },
  { name: 'Automations', nav: 'Automations' },
];

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, '');
});

for (const combo of COMBINATIONS) {
  test(`vision: ${combo.id} (${combo.gates.length} gates)`, async ({ page }) => {
    await enterGuidedDemo(page);
    if (combo.gates.length > 0) {
      await importGates(page, combo.gates);
    }

    // The Guided Demo wizard panel may appear as a floating overlay on the right.
    // Gemini is instructed to ignore it in its analysis prompt.

    const screenshots = [];
    for (const p of PAGES) {
      if (p.nav) {
        await nav(page, p.nav);
      }
      // Wait for content to settle
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2500);
      // Automations: wait for the hub header or inbox to appear
      if (p.name === 'Automations') {
        try {
          await page.locator('text=/Automations/i').first().waitFor({ timeout: 5000 });
          await page.waitForTimeout(2000); // extra time for inbox lazy-load
        } catch { await page.waitForTimeout(3000); }
      }
      const filename = `${combo.id}__${p.name.replace(/\s+/g, '-')}.png`;
      const filepath = path.join(SCREENSHOT_DIR, filename);

      await page.screenshot({ path: filepath, fullPage: true });
      screenshots.push({ page: p.name, file: filename });
    }

    // Write manifest entry
    const record = {
      combo: combo.id,
      gates: combo.gates,
      gateCount: combo.gates.length,
      timestamp: new Date().toISOString(),
      screenshots,
    };
    fs.appendFileSync(MANIFEST_PATH, JSON.stringify(record) + '\n');
  });
}
