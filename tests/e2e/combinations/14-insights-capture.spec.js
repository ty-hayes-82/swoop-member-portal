// 14-insights-capture — Records what each gate combination produces across all pages.
// Unlike specs 01-13 (which assert correctness), this spec captures snapshots for analysis.
// Run with: npx playwright test --config=playwright.insights.config.js
import { test } from '@playwright/test';
import { enterGuidedDemo, importGates, nav, capturePageInsights } from './_helpers.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, '../../../insights-capture.jsonl');

const COMBINATIONS = [
  { id: 'members+tee-sheet+fb+complaints+email', gates: ['members', 'tee-sheet', 'fb', 'complaints', 'email'] },
  { id: 'members+tee-sheet+fb+complaints+pipeline', gates: ['members', 'tee-sheet', 'fb', 'complaints', 'pipeline'] },
  { id: 'members+tee-sheet+fb+complaints+agents', gates: ['members', 'tee-sheet', 'fb', 'complaints', 'agents'] },
  { id: 'members+tee-sheet+fb+email+pipeline', gates: ['members', 'tee-sheet', 'fb', 'email', 'pipeline'] },
  { id: 'members+fb+complaints+email+pipeline', gates: ['members', 'fb', 'complaints', 'email', 'pipeline'] },
  { id: 'members+tee-sheet+fb+complaints+email+pipeline', gates: ['members', 'tee-sheet', 'fb', 'complaints', 'email', 'pipeline'] },
  { id: 'members+tee-sheet+fb+complaints+email+agents', gates: ['members', 'tee-sheet', 'fb', 'complaints', 'email', 'agents'] },
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

// Clear output file at start
test.beforeAll(() => {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, '');
});

for (const combo of COMBINATIONS) {
  test(`capture: ${combo.id} (${combo.gates.length} gates)`, async ({ page }) => {
    await enterGuidedDemo(page);
    if (combo.gates.length > 0) {
      await importGates(page, combo.gates);
    }

    const pageInsights = [];
    for (const p of PAGES) {
      if (p.nav) {
        await nav(page, p.nav);
      }
      const insights = await capturePageInsights(page, p.name);
      pageInsights.push(insights);
    }

    // Append to JSONL
    const record = {
      combo: combo.id,
      gates: combo.gates,
      gateCount: combo.gates.length,
      timestamp: new Date().toISOString(),
      pages: pageInsights,
    };
    fs.appendFileSync(OUTPUT_PATH, JSON.stringify(record) + '\n');
  });
}
