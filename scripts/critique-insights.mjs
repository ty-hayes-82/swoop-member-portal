#!/usr/bin/env node
/**
 * critique-insights.mjs
 * Reads test-results/insights-report.json and applies rule-based analysis.
 * Outputs test-results/critique-report.md with violations, leakage, and cleanup recommendations.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.resolve(__dirname, '../test-results/insights-report.json');
const OUTPUT = path.resolve(__dirname, '../test-results/critique-report.md');

const report = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
const { combinations } = report;

// ─── Gate Dependency Rules ───────────────────────────────
// Each rule: { feature, page (or 'any'), requires (all needed), requiresAny (at least one) }
const RULES = [
  { feature: 'hasRoundsBooked', page: 'Today', requiresAny: ['tee-sheet'] },
  { feature: 'hasRoundsBooked', page: 'Tee Sheet', requiresAny: ['tee-sheet'] },
  { feature: 'hasTeeTimes', page: 'Tee Sheet', requiresAny: ['tee-sheet'] },
  { feature: 'hasHealthScores', page: 'Members', requires: ['members'], requiresAny: ['tee-sheet', 'fb', 'email'] },
  { feature: 'hasArchetypes', page: 'Members', requires: ['members'], requiresAny: ['tee-sheet', 'fb', 'email'] },
  { feature: 'hasMemberNames', page: 'Today', requires: ['members'] },
  { feature: 'hasMemberNames', page: 'Members', requires: ['members'] },
  { feature: 'hasServiceConsistency', page: 'Service', requires: ['members', 'complaints'] },
  { feature: 'hasComplaintData', page: 'Service', requires: ['members', 'complaints'] },
  { feature: 'hasBoardReportData', page: 'Board Report', requires: ['members', 'pipeline'] },
  { feature: 'hasMembersRetained', page: 'Board Report', requires: ['members', 'pipeline'] },
  { feature: 'hasAutomationsPending', page: 'Automations', requires: ['members', 'agents'] },
  // hasSpendingTrend excluded — only visible in member drawer (requires row click, not page-level capture)
];

const violations = [];
const leakageIssues = [];
const monotonicityFailures = [];

// ─── Rule Checking ───────────────────────────────────────
for (const [comboId, combo] of Object.entries(combinations)) {
  const gates = new Set(combo.gates);

  for (const rule of RULES) {
    const pageData = combo.pages[rule.page];
    if (!pageData) continue;

    const featurePresent = pageData[rule.feature];
    const hasRequired = !rule.requires || rule.requires.every(g => gates.has(g));
    const hasAny = !rule.requiresAny || rule.requiresAny.some(g => gates.has(g));
    const shouldAppear = hasRequired && hasAny;

    // Leakage: feature appears when required gates are absent
    if (featurePresent && !shouldAppear) {
      leakageIssues.push({
        combo: comboId,
        feature: rule.feature,
        page: rule.page,
        gates: combo.gates,
        message: `"${rule.feature}" appears on ${rule.page} for [${comboId}] but requires ${JSON.stringify({ requires: rule.requires, requiresAny: rule.requiresAny })}`,
      });
    }

    // Missing: feature should appear but doesn't
    if (!featurePresent && shouldAppear && combo.gateCount > 0) {
      violations.push({
        combo: comboId,
        feature: rule.feature,
        page: rule.page,
        gates: combo.gates,
        message: `"${rule.feature}" missing on ${rule.page} for [${comboId}] — expected with gates [${combo.gates.join(', ')}]`,
      });
    }
  }
}

// ─── Monotonicity Check ─────────────────────────────────
// If combo A's gates are a subset of combo B's gates, features in A should also be in B
const comboEntries = Object.entries(combinations);
for (let i = 0; i < comboEntries.length; i++) {
  for (let j = 0; j < comboEntries.length; j++) {
    if (i === j) continue;
    const [idA, comboA] = comboEntries[i];
    const [idB, comboB] = comboEntries[j];
    const gatesA = new Set(comboA.gates);
    const gatesB = new Set(comboB.gates);

    // Check if A is subset of B
    if (gatesA.size >= gatesB.size) continue;
    const isSubset = [...gatesA].every(g => gatesB.has(g));
    if (!isSubset) continue;

    // Every feature present in A on a page should also be present in B on that page
    for (const pageName of Object.keys(comboA.pages)) {
      const pageA = comboA.pages[pageName];
      const pageB = comboB.pages[pageName];
      if (!pageB) continue;

      for (const [feature, val] of Object.entries(pageA)) {
        if (typeof val !== 'boolean' || !val) continue;
        if (feature.startsWith('hasNo') || feature.startsWith('hasAll') || feature.includes('Empty')) continue;
        if (!pageB[feature]) {
          monotonicityFailures.push({
            subsetCombo: idA,
            supersetCombo: idB,
            feature,
            page: pageName,
            message: `"${feature}" on ${pageName}: present in [${idA}] but missing in superset [${idB}]`,
          });
        }
      }
    }
  }
}

// ─── Dead Feature Detection ─────────────────────────────
const deadFeatures = [];
const activeFeatures = [];
for (const [feature, data] of Object.entries(report.featureMatrix)) {
  if (feature.startsWith('hasNo') || feature.startsWith('hasAll') || feature.includes('Empty')) continue;
  if (data.appearsIn.length === 0) {
    deadFeatures.push(feature);
  } else {
    activeFeatures.push({ feature, count: data.appearsIn.length });
  }
}

// ─── Content Length Analysis ─────────────────────────────
const contentIssues = [];
for (const [comboId, combo] of Object.entries(combinations)) {
  if (combo.gateCount === 0) continue;
  for (const [pageName, pageData] of Object.entries(combo.pages)) {
    if (pageData.contentLength < 200 && combo.gateCount >= 3) {
      contentIssues.push({
        combo: comboId,
        page: pageName,
        length: pageData.contentLength,
        message: `${pageName} page has only ${pageData.contentLength} chars with ${combo.gateCount} gates open — may be unexpectedly empty`,
      });
    }
  }
}

// ─── Generate Report ─────────────────────────────────────
let md = `# Critique Report\n\nGenerated: ${new Date().toISOString()}\n`;
md += `Analyzed: ${Object.keys(combinations).length} combinations\n\n`;

// Summary
const totalIssues = violations.length + leakageIssues.length + monotonicityFailures.length + deadFeatures.length + contentIssues.length;
md += `## Summary\n\n`;
md += `| Category | Count |\n|----------|-------|\n`;
md += `| Missing features (should appear but don't) | ${violations.length} |\n`;
md += `| Leakage (appears without required gates) | ${leakageIssues.length} |\n`;
md += `| Monotonicity failures (superset missing subset's feature) | ${monotonicityFailures.length} |\n`;
md += `| Dead features (never appear) | ${deadFeatures.length} |\n`;
md += `| Content length warnings | ${contentIssues.length} |\n`;
md += `| **Total issues** | **${totalIssues}** |\n\n`;

// Violations
md += `## Missing Features\n\n`;
if (violations.length === 0) {
  md += 'None found.\n\n';
} else {
  for (const v of violations) {
    md += `- **${v.feature}** on ${v.page} — combo: \`${v.combo}\` (gates: ${v.gates.join(', ')})\n`;
  }
  md += '\n';
}

// Leakage
md += `## Data Leakage\n\n`;
if (leakageIssues.length === 0) {
  md += 'None found.\n\n';
} else {
  for (const l of leakageIssues) {
    md += `- **${l.feature}** on ${l.page} — combo: \`${l.combo}\` (gates: ${l.gates.join(', ')})\n`;
  }
  md += '\n';
}

// Monotonicity
md += `## Monotonicity Failures\n\n`;
md += `*If combo A is a subset of combo B, every feature in A should also appear in B.*\n\n`;
if (monotonicityFailures.length === 0) {
  md += 'None found.\n\n';
} else {
  // Deduplicate similar failures
  const seen = new Set();
  for (const m of monotonicityFailures) {
    const key = `${m.feature}|${m.page}|${m.supersetCombo}`;
    if (seen.has(key)) continue;
    seen.add(key);
    md += `- **${m.feature}** on ${m.page}: present in \`${m.subsetCombo}\` but missing in superset \`${m.supersetCombo}\`\n`;
  }
  md += '\n';
}

// Dead features
md += `## Dead Features\n\n`;
md += `*Features that never appear in any combination — potential dead UI code.*\n\n`;
if (deadFeatures.length === 0) {
  md += 'None found.\n\n';
} else {
  for (const f of deadFeatures) {
    md += `- \`${f}\`\n`;
  }
  md += '\n';
}

// Active features summary
md += `## Active Features Summary\n\n`;
md += `| Feature | Appears In (combos) |\n|---------|--------------------|\n`;
for (const { feature, count } of activeFeatures.sort((a, b) => b.count - a.count)) {
  md += `| ${feature} | ${count}/${Object.keys(combinations).length} |\n`;
}
md += '\n';

// Content warnings
md += `## Content Length Warnings\n\n`;
if (contentIssues.length === 0) {
  md += 'None found.\n\n';
} else {
  for (const c of contentIssues) {
    md += `- **${c.page}** for \`${c.combo}\`: ${c.length} chars\n`;
  }
  md += '\n';
}

// Recommendations
md += `## Recommendations\n\n`;
if (leakageIssues.length > 0) {
  md += `### Fix Data Leakage\n`;
  const leakFeatures = [...new Set(leakageIssues.map(l => l.feature))];
  for (const f of leakFeatures) {
    const cases = leakageIssues.filter(l => l.feature === f);
    md += `- \`${f}\`: leaks in ${cases.length} combo(s). Check gate guards in the rendering component.\n`;
  }
  md += '\n';
}
if (monotonicityFailures.length > 0) {
  md += `### Investigate Monotonicity Issues\n`;
  md += `Features that disappear when MORE gates are open suggest conditional rendering that conflicts with broader gate sets. Review the shouldUseStatic() calls for these features.\n\n`;
}
if (deadFeatures.length > 0) {
  md += `### Remove Dead Code\n`;
  md += `These features are detected by the capture script but never appear: ${deadFeatures.map(f => '`' + f + '`').join(', ')}. Consider removing the associated UI code or fixing the gate conditions.\n\n`;
}
if (violations.length > 0) {
  md += `### Fix Missing Features\n`;
  md += `${violations.length} expected feature(s) are not rendering when their required gates are open. Check service initialization and gate checks.\n\n`;
}

md += `---\n*Report generated by critique-insights.mjs*\n`;

fs.writeFileSync(OUTPUT, md);
console.log(`Wrote ${OUTPUT}`);
console.log(`\n=== Critique Summary ===`);
console.log(`Missing features:      ${violations.length}`);
console.log(`Leakage issues:        ${leakageIssues.length}`);
console.log(`Monotonicity failures: ${monotonicityFailures.length}`);
console.log(`Dead features:         ${deadFeatures.length}`);
console.log(`Content warnings:      ${contentIssues.length}`);
console.log(`Total:                 ${totalIssues}`);
