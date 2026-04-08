// 15-vision-capture — Takes full-page screenshots for each gate combination + page.
// Screenshots are analyzed by Gemini 2.5 Flash in a post-processing step.
// Run with: npx playwright test --config=playwright.insights.config.js
import { test } from '@playwright/test';
import { APP_URL, enterGuidedDemo, importGates, nav } from './_helpers.js';
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

    const screenshots = [];
    for (const p of PAGES) {
      if (p.nav) {
        await nav(page, p.nav);
      }

      // Wait for content to settle (Today needs extra time for animated check-in alerts)
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(p.name === 'Today' ? 5000 : 2500);

      // Automations is lazy-loaded and nav click sometimes fails silently.
      // Detect blank page and retry via hash navigation.
      if (p.name === 'Automations') {
        try {
          const text = await page.evaluate(() => document.querySelector('main')?.innerText?.trim() || '');
          if (text.length < 20) {
            await page.evaluate(() => { window.location.hash = '#/automations'; });
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(3000);
          }
        } catch {
          // Hash change may trigger navigation — wait for page to settle
          await page.waitForLoadState('domcontentloaded');
          await page.waitForTimeout(3000);
        }
      }

      const filename = `${combo.id}__${p.name.replace(/\s+/g, '-')}.png`;
      const filepath = path.join(SCREENSHOT_DIR, filename);

      // Measure main content scroll height, then resize viewport to capture it all.
      // This avoids DOM manipulation (overflow hacks) which corrupts navigation.
      const scrollHeight = await page.evaluate(() => {
        const main = document.querySelector('main');
        return main ? main.scrollHeight : document.documentElement.scrollHeight;
      });
      const viewportHeight = Math.max(768, scrollHeight + 100);
      await page.setViewportSize({ width: 1280, height: viewportHeight });
      await page.waitForTimeout(500);

      await page.screenshot({ path: filepath, fullPage: true });

      // Restore normal viewport for next navigation
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(200);

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
