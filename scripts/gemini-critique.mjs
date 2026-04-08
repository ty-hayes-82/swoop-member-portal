#!/usr/bin/env node
/**
 * gemini-critique.mjs — Sends screenshots to Gemini 2.5 Flash for visual analysis.
 * Reads test-results/vision-manifest.jsonl and screenshots from test-results/vision-screenshots/.
 * Outputs test-results/gemini-critique-report.md
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST = path.resolve(__dirname, '../vision-manifest.jsonl');
const SCREENSHOT_DIR = path.resolve(__dirname, '../vision-screenshots');
const OUTPUT = path.resolve(__dirname, '../test-results/gemini-critique-report.md');
const LOG = path.resolve(__dirname, '../test-results/phase-log.md');

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBxEOj78vWlAQEr7oPRs4IN6kvFbrgPB0Q';
const MODEL = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// ─── Gate expectations ───────────────────────────────────
const GATE_DESCRIPTIONS = {
  members: 'Member roster: names, health scores (0-100), archetypes (Die-Hard Golfer, Social Butterfly, Weekend Warrior, Declining, Ghost, etc.), dues amounts, join dates, risk signals',
  'tee-sheet': 'Tee sheet: tee times (7:00 AM, 8:00 AM, etc.), rounds booked count, course utilization, cancellation risk %, group details, cart prep notes',
  fb: 'F&B/POS: dining revenue, spending trends, F&B minimum tracking, check averages, dining frequency per member',
  complaints: 'Complaints: open/resolved complaints, resolution rates, complaint categories (Pace of Play, Food Quality, etc.), days open aging, member-linked complaint history',
  email: 'Email engagement: open rates, click rates, campaign effectiveness, email decay tracking, engagement scoring',
  weather: 'Weather + staffing: 5-day forecast, shift coverage by department, understaffed day alerts, weather impact on operations',
  pipeline: 'Club profile: board report KPIs, industry benchmarks, retention targets, operational benchmarks',
  agents: 'AI agents: automated actions (recovery emails, check-in texts, comp offers), approval inbox with Approve/Dismiss buttons, playbooks',
};

function getExpectation(gates, pageName) {
  const gateSet = new Set(gates);
  const has = (g) => gateSet.has(g);
  const gateCount = gates.length;

  const expectations = [];
  const shouldNotShow = [];

  switch (pageName) {
    case 'Today':
      if (gates.length === 0) { expectations.push('empty dashboard with welcome/import prompt'); break; }
      if (has('members')) expectations.push('priority member alerts with names, health scores, archetypes, and recommended actions');
      if (has('tee-sheet')) expectations.push('rounds booked count in stat cards, tee time stats');
      if (has('members') && has('tee-sheet')) expectations.push('at-risk member check-in alerts with tee time details');
      if (has('members') && has('complaints')) expectations.push('"Open Complaints" section near the BOTTOM of the page (scroll down) showing unresolved complaints with member names, days open, and status badges. May also show "No unresolved complaints" if all are resolved.');
      if (has('fb')) expectations.push('F&B stat cards showing Dining Covers, Avg Check Size, Post-Round Dining Rate');
      if (has('email')) expectations.push('Email engagement stat cards showing Open Rate, Click-Through Rate, Engagement Decay');
      if (has('members') && has('agents')) expectations.push('action queue with AI-generated member-specific actions');
      if (has('weather')) expectations.push('weather forecast, staffing recommendations');
      if (has('fb') && has('members')) expectations.push('member alerts should reference F&B spending patterns');
      if (has('email') && has('members')) expectations.push('member alerts should reference email engagement patterns');
      if (!has('members')) shouldNotShow.push('specific member names (James Whitfield, Robert Callahan, etc.)');
      if (!has('tee-sheet')) shouldNotShow.push('rounds booked count, tee time stat card');
      if (!has('complaints')) shouldNotShow.push('complaint data or complaint references in alerts');
      if (!has('fb')) shouldNotShow.push('F&B spending data or dining references in alerts');
      if (gateCount >= 4) expectations.push(`With ${gateCount} gates open, this page should be DATA-RICH — multiple stat cards, alerts, and cross-referenced signals visible`);
      break;

    case 'Members':
      if (has('members')) {
        if (has('tee-sheet') || has('fb') || has('email')) {
          expectations.push('default "At Risk" tab showing aggregate health score breakdown: HEALTHY/WATCH/AT RISK/CRITICAL percentages as a pie/donut chart or cards');
          expectations.push('engagement trend data or engagement change indicators');
          expectations.push('tab navigation available: At Risk, All Members, Email Decay, Archetypes, etc.');
          expectations.push('archetype filter chips (Die-Hard Golfer, Social Butterfly, Weekend Warrior, etc.)');
          if (has('tee-sheet') && has('fb')) expectations.push('health scores should reflect BOTH golf activity AND dining/F&B data');
          if (has('email')) expectations.push('email engagement metrics should be part of health scoring');
          if (gateCount >= 4) expectations.push('with many data sources, the health breakdown should show rich segmentation and multiple engagement dimensions');
        } else {
          expectations.push('roster-only mode — member names listed but no health scores or engagement data');
        }
      } else {
        expectations.push('empty state — "No members imported" or similar');
        shouldNotShow.push('any member names or health scores');
      }
      break;

    case 'Tee Sheet':
      if (has('tee-sheet') && has('members')) {
        expectations.push('tee times table with times (7:00 AM, 8:00 AM), member names, health scores, archetypes');
        expectations.push('at-risk members highlighted with cancel risk %, recommended actions');
        if (has('complaints')) expectations.push('at-risk member notes should reference complaint history');
        if (has('fb')) expectations.push('cart prep may reference dining preferences');
        if (gateCount >= 4) expectations.push('with many gates, the tee sheet should show rich per-member context (health, archetype, risk signals from multiple sources)');
      } else if (has('tee-sheet')) {
        expectations.push('tee times visible but member names anonymized');
      } else {
        expectations.push('empty state — "No tee sheet data" — this is CORRECT behavior when the tee-sheet gate is not open. Score 7/10 for correctly showing empty state.');
      }
      break;

    case 'Service':
      if (has('members') && has('complaints')) {
        expectations.push('service quality data: Service Consistency Score, resolution rate, complaint categories chart');
        expectations.push('complaint patterns with categories like Pace of Play, Food Quality, etc.');
        if (has('weather')) expectations.push('staffing tab should show shift coverage and understaffed alerts');
        if (has('fb')) expectations.push('service insights may reference F&B-related complaints');
      } else {
        expectations.push('empty state — "No service quality data yet" — this is CORRECT when complaints gate is not open. Score 7/10 for correct empty state.');
      }
      if (!has('complaints')) shouldNotShow.push('Complaints tab, complaint data, resolution rates');
      if (!has('members')) shouldNotShow.push('member names in complaints');
      break;

    case 'Board Report':
      if (has('members')) {
        expectations.push('board report page with KPI strip showing numeric metrics (Members Retained count, Dues at Risk amount, Retention Rate %, or Service Quality Score %)');
        expectations.push('executive summary paragraph describing club performance');
        expectations.push('the Board Report page is a FORMAL EXECUTIVE REPORT — it shows aggregated KPIs and narrative summaries, not raw data tables. Score based on whether KPIs are present and the executive summary is populated.');
        if (has('pipeline')) expectations.push('with pipeline gate: may show industry benchmarks');
        if (has('complaints')) expectations.push('executive summary should mention complaint resolution');
        if (gateCount >= 4) expectations.push('member saves section may show specific at-risk members who were retained (below the fold)');
        expectations.push('NOTE: A "Demo data" banner may appear — ignore it, score based on the actual KPIs and content displayed. Demo data is expected in this test environment.');
      } else {
        expectations.push('"Board report needs data" empty state');
      }
      break;

    case 'Automations':
      if (has('members') && has('agents')) {
        expectations.push('Automations hub with tabs (Inbox, Playbooks, Agents, Settings)');
        expectations.push('inbox showing pending actions with Approve/Dismiss buttons, OR "All caught up" if no actions match open gates');
        if (has('complaints')) expectations.push('complaint-related recovery actions should appear in inbox');
        if (has('tee-sheet')) expectations.push('tee-sheet related actions (cancellation prevention, cart prep) may appear');
      } else {
        expectations.push('"All caught up" message or empty automations hub — this is CORRECT when agents gate is not open. Score 7/10 for correct empty state.');
      }
      if (!has('agents')) shouldNotShow.push('Approve buttons or specific action items');
      break;
  }

  return { expectations, shouldNotShow };
}

// ─── Gemini API call ─────────────────────────────────────
async function analyzeScreenshot(imagePath, combo, pageName, gates) {
  const imageData = fs.readFileSync(imagePath);
  const base64 = imageData.toString('base64');

  const { expectations, shouldNotShow } = getExpectation(gates, pageName);

  const prompt = `You are a QA analyst reviewing a screenshot of a web application page.

CONTEXT:
- App: Swoop Golf Member Portal (private club management dashboard)
- Page: "${pageName}"
- Data gates open: [${gates.join(', ')}]${gates.length === 0 ? ' (NONE — zero data imported)' : ''}
- Gate descriptions: ${gates.map(g => `${g}: ${GATE_DESCRIPTIONS[g]}`).join('; ')}

EXPECTED:
${expectations.map(e => `- SHOULD show: ${e}`).join('\n')}

SHOULD NOT SHOW:
${shouldNotShow.map(s => `- ${s}`).join('\n') || '- (no specific exclusions)'}

ANALYZE this screenshot for THREE things:

1. DATA LEAKAGE (pass/fail): If data from a CLOSED gate appears (member names without members gate, complaint data without complaints gate, etc.) — that's a FAIL. Be strict.

2. DATA RICHNESS (insight_quality score): Score how well the page USES the imported data. The more gates that are open, the more data and signals should appear on screen. Consider:
   - Are the imported data sources actually reflected in what's displayed?
   - With members+tee-sheet: you should see member names, health scores based on round frequency, tee time details, at-risk flags
   - With members+tee-sheet+fb: all of the above PLUS dining/spending data woven in — F&B spend trends, dining frequency alongside golf patterns
   - With members+tee-sheet+fb+complaints: all of the above PLUS complaint history, service recovery actions, complaint-correlated risk scores
   - With members+tee-sheet+fb+email: all of the above PLUS email engagement (open rates, decay), email-influenced health scoring
   - The KEY test: does adding more data gates visibly enrich what's on screen? 4 gates open should show noticeably more signals than 2 gates.

3. CROSS-DOMAIN INSIGHTS: Are the data sources cross-referenced into combined intelligence? For example:
   - "Kevin Hurst: rounds down 40%, unresolved complaint from Jan 16, F&B spend at minimum — 82% churn risk" (combines tee-sheet + complaints + fb + members)
   - vs. just showing separate lists of tee times, complaints, and spending

SCORING GUIDANCE:
- insight_quality 9-10: Page is rich with data from ALL open gates, cross-referenced into actionable intelligence. More gates = more signals visible.
- insight_quality 7-8: Most open gate data is reflected, some cross-referencing, but could show more from the available sources.
- insight_quality 5-6: Some data shown but noticeably missing signals from one or more open gates.
- insight_quality 3-4: Mostly empty states or very thin data despite having relevant gates open.
- insight_quality 1-2: Page ignores the imported data entirely.

IMPORTANT CONTEXT FOR SCORING:
- Not every page will have data from every gate. A Tee Sheet page won't show complaint details — that's fine. Score based on whether the page shows what it SHOULD given its purpose and the open gates.
- An empty state on a page that has NO relevant gates open is NOT a failure — score it 6-7 (correct behavior).
- An empty state on a page where relevant gates ARE open IS a problem — score it low.
- The overall "score" should weight: data richness 50%, data correctness 30%, cross-domain insights 20%.

IMPORTANT:
- Ignore the "Guided Demo" floating panel/sidebar on the right side — it's a test harness overlay, not part of the page content. Focus only on the main content area.
- Ignore any "Demo data" or "simulated" banners — this is a demo environment, the data is intentionally simulated but should still be scored as if it were real data. Score based on what data and insights ARE displayed, not whether the banner says it's a demo.
- The data shown may use demo/sample values — that's fine. Score based on the STRUCTURE and RICHNESS of what's displayed (are there KPIs? charts? member details? cross-referenced signals?) not on whether the numbers are "real."

Minor layout/styling issues are not failures.`;

  const body = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: 'image/png', data: base64 } },
      ],
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          pass: { type: 'BOOLEAN', description: 'true if page matches expectations with no leakage, false if leakage or critical mismatch' },
          score: { type: 'INTEGER', description: 'Overall quality score 1-10 (10=perfect)' },
          insight_quality: { type: 'INTEGER', description: 'Insight quality 1-10: how well the page cross-references imported data into actionable intelligence' },
          findings: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Key observations about what is displayed' },
          leakage: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Data showing that should NOT be visible given the open gates' },
          missing: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Expected data/features NOT visible' },
          insight_notes: { type: 'STRING', description: 'How well the insights cross-reference the imported data sources' },
          summary: { type: 'STRING', description: 'One-sentence summary' },
        },
        required: ['pass', 'score', 'insight_quality', 'findings', 'leakage', 'missing', 'insight_notes', 'summary'],
      },
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        if (res.status === 429) {
          console.warn(`  Rate limited, waiting 10s...`);
          await new Promise(r => setTimeout(r, 10000));
          continue;
        }
        throw new Error(`Gemini API ${res.status}: ${err.substring(0, 200)}`);
      }
      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const text = parts.filter(p => p.text).map(p => p.text).join('');
      return JSON.parse(text);
    } catch (e) {
      if (attempt === 2) return { pass: null, score: 0, findings: [`API error: ${e.message}`], leakage: [], missing: [], summary: 'API call failed' };
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

// ─── Main ────────────────────────────────────────────────
async function main() {
  const raw = fs.readFileSync(MANIFEST, 'utf8').trim();
  if (!raw) { console.error('No data in vision-manifest.jsonl'); process.exit(1); }
  const records = raw.split('\n').map(l => JSON.parse(l));

  console.log(`Analyzing ${records.length} combinations (${records.reduce((s, r) => s + r.screenshots.length, 0)} screenshots) with Gemini 2.5 Flash...\n`);

  const results = [];
  let totalPass = 0;
  let totalFail = 0;
  let totalLeakage = 0;

  for (const rec of records) {
    console.log(`[${rec.combo}] (${rec.gates.join(', ') || 'none'}):`);

    for (const ss of rec.screenshots) {
      const imgPath = path.join(SCREENSHOT_DIR, ss.file);
      if (!fs.existsSync(imgPath)) {
        console.log(`  ${ss.page}: SKIP (no screenshot)`);
        continue;
      }

      process.stdout.write(`  ${ss.page}: `);
      const analysis = await analyzeScreenshot(imgPath, rec.combo, ss.page, rec.gates);

      const icon = analysis.pass ? '\u2705' : analysis.pass === false ? '\u274C' : '\u26A0\uFE0F';
      console.log(`${icon} score=${analysis.score}/10 insight=${analysis.insight_quality || '?'}/10 — ${analysis.summary}`);

      if (analysis.pass) totalPass++;
      else if (analysis.pass === false) totalFail++;
      if (analysis.leakage?.length) totalLeakage += analysis.leakage.length;

      results.push({
        combo: rec.combo,
        gates: rec.gates,
        page: ss.page,
        file: ss.file,
        ...analysis,
      });

      // Delay between requests to avoid rate limits
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // ─── Generate report ──────────────────────────────────
  let md = `# Gemini Vision Critique Report\n\n`;
  md += `Generated: ${new Date().toISOString()}\n`;
  md += `Model: ${MODEL}\n`;
  md += `Analyzed: ${results.length} screenshots across ${records.length} combinations\n\n`;

  md += `## Summary\n\n`;
  md += `| Metric | Count |\n|--------|-------|\n`;
  md += `| Pass | ${totalPass} |\n`;
  md += `| Fail | ${totalFail} |\n`;
  md += `| Total leakage findings | ${totalLeakage} |\n`;
  md += `| Avg score | ${(results.reduce((s, r) => s + (r.score || 0), 0) / results.length).toFixed(1)}/10 |\n`;
  md += `| Avg insight quality | ${(results.reduce((s, r) => s + (r.insight_quality || 0), 0) / results.length).toFixed(1)}/10 |\n\n`;

  // Failures first
  const failures = results.filter(r => r.pass === false);
  if (failures.length > 0) {
    md += `## Failures (${failures.length})\n\n`;
    for (const f of failures) {
      md += `### ${f.combo} — ${f.page} (score: ${f.score}/10)\n`;
      md += `Gates: \`${f.gates.join(', ') || 'none'}\`\n\n`;
      if (f.leakage?.length) md += `**Leakage:** ${f.leakage.join('; ')}\n\n`;
      if (f.missing?.length) md += `**Missing:** ${f.missing.join('; ')}\n\n`;
      if (f.findings?.length) md += `**Findings:** ${f.findings.join('; ')}\n\n`;
      if (f.insight_notes) md += `**Insight Quality (${f.insight_quality}/10):** ${f.insight_notes}\n\n`;
      md += `---\n\n`;
    }
  }

  // Insight quality highlights (low-scoring pages worth improving)
  const lowInsight = results.filter(r => r.insight_quality && r.insight_quality <= 5 && r.pass !== false);
  if (lowInsight.length > 0) {
    md += `## Low Insight Quality (${lowInsight.length} pages scoring ≤5/10)\n\n`;
    for (const r of lowInsight) {
      md += `### ${r.combo} — ${r.page} (insight: ${r.insight_quality}/10)\n`;
      md += `Gates: \`${r.gates.join(', ')}\`\n\n`;
      if (r.insight_notes) md += `${r.insight_notes}\n\n`;
      md += `---\n\n`;
    }
  }

  // Leakage summary
  const leakageResults = results.filter(r => r.leakage?.length > 0);
  if (leakageResults.length > 0) {
    md += `## Data Leakage Details\n\n`;
    for (const r of leakageResults) {
      md += `- **${r.combo}** on ${r.page}: ${r.leakage.join('; ')}\n`;
    }
    md += '\n';
  }

  // All results table
  md += `## All Results\n\n`;
  md += `| Combo | Page | Pass | Score | Insight | Summary |\n`;
  md += `|-------|------|------|-------|---------|--------|\n`;
  for (const r of results) {
    const icon = r.pass ? 'PASS' : r.pass === false ? 'FAIL' : '??';
    md += `| ${r.combo} | ${r.page} | ${icon} | ${r.score}/10 | ${r.insight_quality || '-'}/10 | ${r.summary?.substring(0, 80) || ''} |\n`;
  }

  md += `\n---\n*Analyzed by Gemini 2.5 Flash*\n`;

  fs.writeFileSync(OUTPUT, md);
  console.log(`\nWrote ${OUTPUT}`);
  console.log(`\n=== Summary ===`);
  console.log(`Pass: ${totalPass}  Fail: ${totalFail}  Leakage: ${totalLeakage}`);
  console.log(`Avg score: ${(results.reduce((s, r) => s + (r.score || 0), 0) / results.length).toFixed(1)}/10`);

  // Also write JSON for programmatic access
  const jsonOut = path.resolve(__dirname, '../test-results/gemini-critique-results.json');
  fs.writeFileSync(jsonOut, JSON.stringify({ results, summary: { totalPass, totalFail, totalLeakage, avgScore: results.reduce((s, r) => s + (r.score || 0), 0) / results.length } }, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
