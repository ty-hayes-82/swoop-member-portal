#!/usr/bin/env node
/**
 * generate-insights-report.mjs
 * Reads test-results/insights-capture.jsonl and produces:
 *   - test-results/insights-report.json  (structured data)
 *   - test-results/insights-report.md    (human-readable summary)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.resolve(__dirname, '../insights-capture.jsonl');
const OUT_JSON = path.resolve(__dirname, '../test-results/insights-report.json');
const OUT_MD = path.resolve(__dirname, '../test-results/insights-report.md');

// ─── Parse JSONL ─────────────────────────────────────────
const raw = fs.readFileSync(INPUT, 'utf8').trim();
if (!raw) { console.error('No data in insights-capture.jsonl'); process.exit(1); }
const records = raw.split('\n').map(line => JSON.parse(line));
console.log(`Parsed ${records.length} combination records`);

// ─── Feature flags to track ─────────────────────────────
const FEATURES = [
  'hasRoundsBooked', 'hasMemberNames', 'hasHealthScores', 'hasArchetypes',
  'hasServiceConsistency', 'hasBoardReportData', 'hasBoardReportEmpty',
  'hasTeeTimes', 'hasNoTeeSheetData', 'hasNoMembers',
  'hasAutomationsPending', 'hasAllCaughtUp', 'hasSpendingTrend',
  'hasForecast', 'hasPriorityAlerts', 'hasWeatherData', 'hasStaffingData',
  'hasEmailDecay', 'hasActionQueue', 'hasMembersRetained', 'hasComplaintData',
];

const PAGE_NAMES = ['Today', 'Members', 'Tee Sheet', 'Service', 'Board Report', 'Automations'];

// ─── Build report ────────────────────────────────────────
const combinations = {};
for (const rec of records) {
  const pageMap = {};
  for (const p of rec.pages) {
    pageMap[p.page] = {};
    for (const f of FEATURES) {
      pageMap[p.page][f] = p[f] || false;
    }
    pageMap[p.page].contentLength = p.contentLength;
    pageMap[p.page].metricsCount = p.metrics?.length || 0;
    pageMap[p.page].metrics = p.metrics || [];
  }
  combinations[rec.combo] = {
    gates: rec.gates,
    gateCount: rec.gateCount,
    pages: pageMap,
  };
}

// ─── Feature matrix: which combos enable which features ──
const featureMatrix = {};
for (const f of FEATURES) {
  featureMatrix[f] = { appearsIn: [], pages: {} };
  for (const pageName of PAGE_NAMES) {
    featureMatrix[f].pages[pageName] = [];
  }
  for (const [comboId, combo] of Object.entries(combinations)) {
    for (const pageName of PAGE_NAMES) {
      if (combo.pages[pageName]?.[f]) {
        featureMatrix[f].appearsIn.push(comboId);
        featureMatrix[f].pages[pageName].push(comboId);
        break; // only count once per combo
      }
    }
  }
}

// ─── Anomaly detection ───────────────────────────────────
const anomalies = [];

// Features that never appear
for (const [f, data] of Object.entries(featureMatrix)) {
  if (data.appearsIn.length === 0 && !f.startsWith('hasNo') && !f.startsWith('hasAll') && !f.includes('Empty')) {
    anomalies.push({ type: 'never_appears', feature: f, message: `"${f}" never appears in any combination — possible dead UI code` });
  }
}

// Features that appear in ALL combos (unconditionally rendered)
for (const [f, data] of Object.entries(featureMatrix)) {
  if (data.appearsIn.length === records.length && !f.startsWith('hasNo') && !f.startsWith('hasAll')) {
    anomalies.push({ type: 'always_appears', feature: f, message: `"${f}" appears in every combination — may be unconditionally rendered` });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  totalCombinations: records.length,
  combinations,
  featureMatrix,
  anomalies,
};

fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2));
console.log(`Wrote ${OUT_JSON}`);

// ─── Markdown report ─────────────────────────────────────
const shortFeatures = [
  'hasRoundsBooked', 'hasMemberNames', 'hasHealthScores', 'hasArchetypes',
  'hasServiceConsistency', 'hasBoardReportData', 'hasTeeTimes',
  'hasAutomationsPending', 'hasSpendingTrend', 'hasForecast',
  'hasMembersRetained', 'hasComplaintData',
];
const shortLabels = {
  hasRoundsBooked: 'Rounds', hasMemberNames: 'Members', hasHealthScores: 'Health',
  hasArchetypes: 'Archetypes', hasServiceConsistency: 'Service', hasBoardReportData: 'Board',
  hasTeeTimes: 'TeeTimes', hasAutomationsPending: 'Actions', hasSpendingTrend: 'Spending',
  hasForecast: 'Forecast', hasMembersRetained: 'Retained', hasComplaintData: 'Complaints',
};

let md = `# Insights Report\n\nGenerated: ${report.generatedAt}\n\n`;
md += `## Feature Matrix (${records.length} combinations)\n\n`;
md += `| Combination | Gates | ${shortFeatures.map(f => shortLabels[f]).join(' | ')} |\n`;
md += `|-------------|-------|${shortFeatures.map(() => '---').join('|')}|\n`;

for (const rec of records) {
  const combo = combinations[rec.combo];
  const cells = shortFeatures.map(f => {
    // Check if feature appears on ANY page for this combo
    return PAGE_NAMES.some(p => combo.pages[p]?.[f]) ? 'Y' : '-';
  });
  md += `| ${rec.combo} | ${rec.gateCount} | ${cells.join(' | ')} |\n`;
}

md += `\n## Anomalies (${anomalies.length})\n\n`;
if (anomalies.length === 0) {
  md += 'No anomalies detected.\n';
} else {
  for (const a of anomalies) {
    md += `- **${a.type}**: ${a.message}\n`;
  }
}

md += `\n## Content Length by Page\n\n`;
md += `| Combination | Today | Members | Tee Sheet | Service | Board Report | Automations |\n`;
md += `|-------------|-------|---------|-----------|---------|--------------|-------------|\n`;
for (const rec of records) {
  const combo = combinations[rec.combo];
  const lengths = PAGE_NAMES.map(p => combo.pages[p]?.contentLength || 0);
  md += `| ${rec.combo} | ${lengths.join(' | ')} |\n`;
}

fs.writeFileSync(OUT_MD, md);
console.log(`Wrote ${OUT_MD}`);
console.log(`\nDone. ${anomalies.length} anomalies found.`);
