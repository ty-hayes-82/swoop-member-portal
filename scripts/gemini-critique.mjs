#!/usr/bin/env node
/**
 * gemini-critique.mjs — Checklist-based visual QA using Gemini 2.5 Flash.
 *
 * Instead of asking Gemini for subjective scores, we give it a specific checklist
 * of UI elements to detect per page+gate combo. Gemini answers "visible: true/false"
 * for each element. Scores are computed deterministically from detection results.
 *
 * Two-pass analysis:
 *   Pass 1: Element detection (structured checklist)
 *   Pass 2: Leakage detection (forbidden elements)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST = path.resolve(__dirname, '../vision-manifest.jsonl');
const SCREENSHOT_DIR = path.resolve(__dirname, '../vision-screenshots');
const OUTPUT_MD = path.resolve(__dirname, '../test-results/gemini-critique-report.md');
const OUTPUT_JSON = path.resolve(__dirname, '../test-results/gemini-critique-results.json');

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBxEOj78vWlAQEr7oPRs4IN6kvFbrgPB0Q';
const MODEL = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// ─── Per-page element checklists ────────────────────────
// Each element has: id, label (human), weight (0-3), requiredGates (which gates must be open)
// weight: 3 = critical (page's core purpose), 2 = important, 1 = nice-to-have, 0 = bonus

function getChecklist(pageName, gates) {
  const has = (g) => gates.includes(g);
  const items = [];

  switch (pageName) {
    case 'Today':
      items.push({ id: 'greeting', label: 'Greeting bar with club name or "Good morning"', weight: 1 });
      items.push({ id: 'stat_cards', label: 'Quick stat cards row (Course Condition, Active Members, etc.)', weight: 2 });
      if (has('tee-sheet')) items.push({ id: 'tee_times_stat', label: '"Tee Times Today" stat card with a number', weight: 2 });
      if (has('members')) items.push({ id: 'member_alerts', label: 'Priority Member Alerts section with member names and risk signals', weight: 3 });
      if (has('members') && has('tee-sheet')) items.push({ id: 'checkin_alerts', label: 'At-risk check-in alerts with tee time details', weight: 2 });
      if (has('fb')) items.push({ id: 'fb_stats', label: 'F&B stat cards (Dining Covers, Avg Check, Post-Round Dining)', weight: 2 });
      if (has('email')) items.push({ id: 'email_stats', label: 'Email engagement stat cards (Open Rate, Click-Through, Decay)', weight: 2 });
      if (has('members') && has('complaints')) items.push({ id: 'open_complaints', label: '"Open Complaints" header text with complaint count, OR "No unresolved complaints" message, OR staffing/complaints section in lower page area', weight: 2 });
      if (has('weather') || has('tee-sheet')) items.push({ id: 'forecast', label: 'Weather forecast, temperature, or "Tomorrow\'s Forecast" section visible anywhere on the page', weight: 1 });
      if (has('members') && has('agents')) items.push({ id: 'action_queue', label: 'Action queue with AI-generated member actions', weight: 2 });
      break;

    case 'Members':
      if (has('members') && (has('tee-sheet') || has('fb') || has('email'))) {
        items.push({ id: 'health_breakdown', label: 'Health score breakdown showing HEALTHY, WATCH, AT RISK, CRITICAL counts or percentages', weight: 3 });
        items.push({ id: 'engagement_trend', label: 'Engagement trend text, member count changes, or "members changing status" indicators', weight: 2 });
        items.push({ id: 'tab_nav', label: 'Tab navigation bar with multiple view options', weight: 2 });
        items.push({ id: 'priority_members', label: 'Individual member names, scores, or risk signal text visible anywhere on the page (may be in expandable sections or below health cards)', weight: 1 });
        items.push({ id: 'evidence_strip', label: 'Evidence strip or data source badges showing connected systems', weight: 1 });
      } else if (has('members')) {
        items.push({ id: 'roster', label: 'Member roster with names listed', weight: 3 });
        items.push({ id: 'roster_mode_msg', label: 'Message about importing more data for health scores', weight: 1 });
      } else {
        items.push({ id: 'empty_state', label: 'Empty state message about importing members', weight: 3 });
      }
      break;

    case 'Tee Sheet':
      if (has('tee-sheet') && has('members')) {
        items.push({ id: 'tee_times', label: 'Tee time information visible (times like 7:00 AM, 8:00 AM, or course names)', weight: 3 });
        items.push({ id: 'member_names', label: 'Member names visible on the page', weight: 2 });
        items.push({ id: 'health_scores', label: 'Health scores (numeric) or color-coded risk indicators per member', weight: 2 });
        items.push({ id: 'at_risk_section', label: 'At-risk members section or cards with actionable recommendations', weight: 3 });
        items.push({ id: 'archetypes', label: 'Archetype badges or labels (Die-Hard, Weekend Warrior, Declining, etc.)', weight: 1 });
        items.push({ id: 'cancel_risk', label: 'Cancel risk percentages', weight: 1 });
        if (has('complaints')) items.push({ id: 'complaint_notes', label: 'Complaint-related notes or references in member alerts', weight: 2 });
      } else if (has('tee-sheet')) {
        items.push({ id: 'tee_times_anon', label: 'Tee times visible but member names anonymized', weight: 3 });
      } else {
        items.push({ id: 'empty_state', label: 'Empty state: "No tee sheet data" message', weight: 3 });
      }
      break;

    case 'Service':
      if (has('members') && has('complaints')) {
        items.push({ id: 'consistency_score', label: 'Service Consistency Score (a percentage or numeric metric)', weight: 3 });
        items.push({ id: 'complaint_driver', label: 'Key complaint driver identified (e.g., "Grill Room" or "Pace of Play")', weight: 3 });
        items.push({ id: 'quality_tab', label: 'Quality tab visible and active', weight: 2 });
        items.push({ id: 'tab_nav', label: 'Tab navigation (Quality, Staffing, Complaints)', weight: 1 });
        if (has('weather')) items.push({ id: 'staffing_tab', label: 'Staffing tab available', weight: 1 });
      } else {
        items.push({ id: 'empty_state', label: 'Empty state: "No service quality data yet" message', weight: 3 });
      }
      break;

    case 'Board Report':
      if (has('members')) {
        items.push({ id: 'kpi_strip', label: 'KPI strip with numeric metrics (Members Retained, Dues at Risk, Retention Rate, or similar)', weight: 3 });
        items.push({ id: 'exec_summary', label: 'Executive Summary paragraph with text about club performance', weight: 3 });
        items.push({ id: 'page_title', label: '"Board Report" title visible', weight: 1 });
        items.push({ id: 'member_saves', label: '"Recent Member Saves" or "Member Interventions" or member cards with health score numbers like "34 → 71" (may be in lower portion of page)', weight: 1 });
        items.push({ id: 'service_ops', label: 'Service & Operations section with consistency score, staffing metrics, or complaint resolution data', weight: 2 });
        if (has('complaints')) items.push({ id: 'resolution_data', label: 'Complaint resolution rate or resolution time mentioned', weight: 2 });
        if (has('pipeline')) items.push({ id: 'confidence_score', label: 'Board Confidence Score or benchmark data', weight: 1 });
      } else {
        items.push({ id: 'empty_state', label: '"Board report needs data" empty state', weight: 3 });
      }
      break;

    case 'Automations':
      if (has('members') && has('agents')) {
        items.push({ id: 'hub_header', label: '"Automations" header text visible', weight: 3 });
        items.push({ id: 'tab_nav', label: 'Tab navigation (Inbox, Playbooks, Agents, Settings)', weight: 2 });
        items.push({ id: 'inbox_content', label: 'Inbox with pending actions showing Approve/Dismiss, OR "All caught up" message', weight: 3 });
        if (has('complaints')) items.push({ id: 'complaint_actions', label: 'Complaint-related recovery actions in inbox', weight: 2 });
      } else {
        items.push({ id: 'empty_or_caught_up', label: '"All caught up" message or empty automations state', weight: 3 });
      }
      break;
  }

  // Leakage checks (forbidden elements)
  const forbidden = [];
  if (!has('members')) forbidden.push({ id: 'leak_member_names', label: 'Specific member names (James Whitfield, Robert Callahan, Kevin Hurst, etc.)' });
  if (!has('complaints')) forbidden.push({ id: 'leak_complaints', label: 'Complaint data, resolution rates, or "Complaints" tab' });
  if (!has('fb')) forbidden.push({ id: 'leak_fb', label: 'F&B spending data, dining revenue, or F&B stat cards' });
  if (!has('tee-sheet')) forbidden.push({ id: 'leak_tee_times', label: 'Tee time details, rounds booked count, or tee sheet data' });

  return { items, forbidden };
}

// ─── Gemini API: Element Detection ──────────────────────
async function detectElements(imagePath, pageName, gates, items, forbidden) {
  const imageData = fs.readFileSync(imagePath);
  const base64 = imageData.toString('base64');

  // Build checklist for Gemini
  const checklistText = items.map((item, i) => `${i + 1}. "${item.label}"`).join('\n');
  const forbiddenText = forbidden.map((f, i) => `F${i + 1}. "${f.label}"`).join('\n');

  const prompt = `You are a UI element detector. Look at this screenshot and answer whether each listed element is VISIBLE.

PAGE: "${pageName}" in a golf club management dashboard.
DATA GATES OPEN: [${gates.join(', ')}]

IGNORE: The "Guided Demo" floating panel/sidebar on the right side — it's a test overlay. Also ignore any "Demo data" banners. Focus on the MAIN CONTENT area only.

CHECKLIST — For each element, answer true if visible, false if not:
${checklistText}

FORBIDDEN — These should NOT be visible. Answer true if you DO see them (which means leakage):
${forbiddenText || '(none)'}`;

  // Build response schema dynamically
  const properties = {};
  items.forEach((item, i) => {
    properties[`check_${i}`] = { type: 'BOOLEAN', description: `Is "${item.label}" visible?` };
  });
  forbidden.forEach((f, i) => {
    properties[`forbidden_${i}`] = { type: 'BOOLEAN', description: `Is "${f.label}" visible? (true = leakage)` };
  });

  const body = {
    contents: [{ parts: [
      { text: prompt },
      { inline_data: { mime_type: 'image/png', data: base64 } },
    ]}],
    generationConfig: {
      temperature: 0.0,
      maxOutputTokens: 512,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties,
        required: Object.keys(properties),
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
      if (attempt === 2) return null;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

// ─── Score Computation ──────────────────────────────────
function computeScore(items, forbidden, detection) {
  if (!detection) return { score: 0, detected: 0, total: 0, leakage: [], details: [] };

  let weightedFound = 0;
  let weightedTotal = 0;
  const details = [];
  const leakage = [];

  items.forEach((item, i) => {
    const key = `check_${i}`;
    const visible = detection[key] === true;
    weightedTotal += item.weight;
    if (visible) weightedFound += item.weight;
    details.push({ id: item.id, label: item.label, weight: item.weight, visible });
  });

  forbidden.forEach((f, i) => {
    const key = `forbidden_${i}`;
    if (detection[key] === true) {
      leakage.push(f.label);
    }
  });

  // Score: 0-10 based on weighted detection
  const rawScore = weightedTotal > 0 ? (weightedFound / weightedTotal) * 10 : 10;
  // Leakage penalty: -3 per leakage finding, floor at 1
  const leakagePenalty = leakage.length * 3;
  const score = Math.max(1, Math.round(rawScore - leakagePenalty));
  const pass = leakage.length === 0 && score >= 7;

  return {
    score,
    pass,
    detected: details.filter(d => d.visible).length,
    total: details.length,
    weightedPct: weightedTotal > 0 ? Math.round((weightedFound / weightedTotal) * 100) : 100,
    leakage,
    details,
  };
}

// ─── Main ────────────────────────────────────────────────
async function main() {
  const raw = fs.readFileSync(MANIFEST, 'utf8').trim();
  if (!raw) { console.error('No data in vision-manifest.jsonl'); process.exit(1); }
  const records = raw.split('\n').map(l => JSON.parse(l));
  const totalScreenshots = records.reduce((s, r) => s + r.screenshots.length, 0);

  console.log(`Analyzing ${records.length} combinations (${totalScreenshots} screenshots) with checklist-based detection...\n`);

  const results = [];
  let totalPass = 0;
  let totalFail = 0;
  let totalLeakageCount = 0;

  for (const rec of records) {
    console.log(`[${rec.combo}] (${rec.gates.join(', ') || 'none'}):`);

    for (const ss of rec.screenshots) {
      const imgPath = path.join(SCREENSHOT_DIR, ss.file);
      if (!fs.existsSync(imgPath)) {
        console.log(`  ${ss.page}: SKIP (no screenshot)`);
        continue;
      }

      const { items, forbidden } = getChecklist(ss.page, rec.gates);
      process.stdout.write(`  ${ss.page}: `);

      const detection = await detectElements(imgPath, ss.page, rec.gates, items, forbidden);
      const result = computeScore(items, forbidden, detection);

      const icon = result.pass ? '\u2705' : '\u274C';
      const found = result.details.filter(d => d.visible).map(d => d.id).join(', ');
      const missed = result.details.filter(d => !d.visible).map(d => d.id).join(', ');
      console.log(`${icon} ${result.score}/10 (${result.detected}/${result.total} elements, ${result.weightedPct}% weighted)${result.leakage.length ? ` LEAK: ${result.leakage.join('; ')}` : ''}${missed ? ` missing: ${missed}` : ''}`);

      if (result.pass) totalPass++;
      else totalFail++;
      totalLeakageCount += result.leakage.length;

      results.push({
        combo: rec.combo,
        gates: rec.gates,
        page: ss.page,
        file: ss.file,
        ...result,
      });

      // 1.5s delay between API calls
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  // ─── Generate report ──────────────────────────────────
  let md = `# Vision QA Report — Checklist-Based Detection\n\n`;
  md += `Generated: ${new Date().toISOString()}\n`;
  md += `Model: ${MODEL} (element detection mode)\n`;
  md += `Analyzed: ${results.length} screenshots across ${records.length} combinations\n\n`;

  const avgScore = results.reduce((s, r) => s + r.score, 0) / results.length;
  md += `## Summary\n\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += `| Pass | ${totalPass} |\n`;
  md += `| Fail | ${totalFail} |\n`;
  md += `| Leakage findings | ${totalLeakageCount} |\n`;
  md += `| Avg score | ${avgScore.toFixed(1)}/10 |\n`;
  md += `| Avg element detection | ${Math.round(results.reduce((s, r) => s + r.weightedPct, 0) / results.length)}% |\n\n`;

  // Failures
  const failures = results.filter(r => !r.pass);
  if (failures.length > 0) {
    md += `## Failures (${failures.length})\n\n`;
    for (const f of failures) {
      md += `### ${f.combo} — ${f.page} (${f.score}/10)\n`;
      md += `Gates: \`${f.gates.join(', ')}\` | Elements: ${f.detected}/${f.total} (${f.weightedPct}%)\n\n`;
      if (f.leakage.length) md += `**Leakage:** ${f.leakage.join('; ')}\n\n`;
      const missed = f.details.filter(d => !d.visible);
      if (missed.length) {
        md += `**Missing elements:**\n`;
        missed.forEach(m => md += `- [ ] ${m.label} (weight: ${m.weight})\n`);
        md += '\n';
      }
      md += `---\n\n`;
    }
  }

  // Leakage details
  const leakageResults = results.filter(r => r.leakage.length > 0);
  if (leakageResults.length > 0) {
    md += `## Data Leakage Details\n\n`;
    for (const r of leakageResults) {
      md += `- **${r.combo}** on ${r.page}: ${r.leakage.join('; ')}\n`;
    }
    md += '\n';
  }

  // All results table
  md += `## All Results\n\n`;
  md += `| Combo | Page | Pass | Score | Elements | Weighted % | Missing |\n`;
  md += `|-------|------|------|-------|----------|-----------|--------|\n`;
  for (const r of results) {
    const missed = r.details.filter(d => !d.visible).map(d => d.id).join(', ');
    md += `| ${r.combo} | ${r.page} | ${r.pass ? 'PASS' : 'FAIL'} | ${r.score}/10 | ${r.detected}/${r.total} | ${r.weightedPct}% | ${missed || '—'} |\n`;
  }

  md += `\n---\n*Checklist-based detection by Gemini 2.5 Flash*\n`;

  fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_MD, md);
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify({ results, summary: { totalPass, totalFail, totalLeakageCount, avgScore } }, null, 2));

  console.log(`\nWrote ${OUTPUT_MD}`);
  console.log(`\n=== Summary ===`);
  console.log(`Pass: ${totalPass}  Fail: ${totalFail}  Leakage: ${totalLeakageCount}`);
  console.log(`Avg score: ${avgScore.toFixed(1)}/10  Avg detection: ${Math.round(results.reduce((s, r) => s + r.weightedPct, 0) / results.length)}%`);
}

main().catch(e => { console.error(e); process.exit(1); });
