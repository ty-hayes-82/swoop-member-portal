#!/usr/bin/env node
/**
 * scoring-loop.mjs
 *
 * 8-agent automated scoring pipeline for the Swoop Member Portal.
 *
 * Implements the Swoop_Scoring_Agent_Plan.docx scoring system:
 *   - 8 specialist agents + 1 orchestrator
 *   - Weighted composite (GM 18%, Operator 15%, Layer3 15%, Storyboard 12%,
 *     Survey 15%, UX 10%, Brand 8%, Data 7%)
 *   - Full 5-stage progressive import (15 screenshots)
 *   - Structured JSON output contract per agent
 *   - Merged, ranked recommendations in RECOMMENDATIONS.json
 *
 * Usage:
 *   GEMINI_API_KEY=<key> APP_URL=https://swoop-member-portal-dev.vercel.app \
 *   node scripts/scoring-loop.mjs
 *
 * Quick mode (9 critical screenshots):
 *   QUICK_MODE=1 GEMINI_API_KEY=<key> APP_URL=... node scripts/scoring-loop.mjs
 *
 * Output: critiques/scoring-run-{TIMESTAMP}/
 */

import { chromium } from 'playwright';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  makeTimestamp, ensureDir, writeFileSafe, sleep, geminiWithRetry,
  createClub, login, importCSV,
  injectAuthAndNavigate, captureScreenshot,
} from './lib/infra.mjs';

import { AGENTS, getAgentsForSlug } from './agents/agent-defs.mjs';
import { parseAgentJSON, validateContract, computeWeightedComposite, mergeRecommendations } from './agents/scoring.mjs';
import { runOrchestrator } from './agents/orchestrator.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ───────────────────────────────────────────────────────────────────

const APP_URL       = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const API_KEY       = process.env.GEMINI_API_KEY;
const AGENT_MODEL   = 'gemini-3.1-pro-preview';
const THINKING_CFG  = { thinkingConfig: { thinkingBudget: 3000 } };
const VIEWPORT      = { width: 1440, height: 900 };
const FIXTURE_DIR   = path.resolve(__dirname, '../tests/fixtures/small');
const OUTPUT_BASE   = path.resolve(__dirname, '../../critiques');
const HISTORY_FILE  = path.join(OUTPUT_BASE, 'scoring-history.json');

// ─── Stage Definitions ────────────────────────────────────────────────────────

const STAGES_FULL = [
  {
    id: 0,
    label: 'Stage 0 — Empty (no data)',
    imports: [],
    dataState: 'No data imported. All pages should show empty states or onboarding prompts. Member count = 0. Revenue = 0. No tee times. No complaints.',
    screenshots: [
      { slug: '0_today',   hash: '/#/today',   label: 'Today (empty)',   waitMs: 2000 },
      { slug: '0_members', hash: '/#/members', label: 'Members (empty)', waitMs: 2000 },
      { slug: '0_revenue', hash: '/#/revenue', label: 'Revenue (empty)', waitMs: 2000 },
    ],
  },
  {
    id: 1,
    label: 'Stage 1 — Members imported (100 members, no activity data)',
    imports: [
      { type: 'members', file: 'JCM_Members_F9.csv', expectedRows: 100 },
    ],
    dataState: '100 members imported. No tee times, no POS transactions, no complaints. The members page should show a roster. Revenue should still be empty/gated. Today should show a member count.',
    screenshots: [
      { slug: '1_members', hash: '/#/members', label: 'Members (roster)',       waitMs: 3000 },
      { slug: '1_today',   hash: '/#/today',   label: 'Today (after members)',  waitMs: 3000 },
    ],
  },
  {
    id: 2,
    label: 'Stage 2 — Members + POS (686 transactions)',
    imports: [
      { type: 'transactions', file: 'POS_Sales_Detail_SV.csv', expectedRows: 686 },
    ],
    dataState: '100 members + 686 POS dining transactions imported. Total F&B spend: plausible for ~$13K-$55K range. Revenue page should now populate with leakage analysis. No tee sheet data yet.',
    screenshots: [
      { slug: '2_revenue', hash: '/#/revenue', label: 'Revenue (after POS)', waitMs: 4000 },
    ],
  },
  {
    id: 3,
    label: 'Stage 3 — Members + POS + Tee Sheet (1,993 tee times + players)',
    imports: [
      { type: 'tee_times',       file: 'TTM_Tee_Sheet_SV.csv',         expectedRows: 1993 },
      { type: 'booking_players', file: 'TTM_Tee_Sheet_Players_SV.csv', expectedRows: 1993 },
    ],
    dataState: '100 members + 686 POS + 1,993 tee times + 1,993 booking players. Tee sheet should be populated. Revenue leakage analysis should now have pace-of-play data. Today briefing should show bookings.',
    screenshots: [
      { slug: '3_tee-sheet', hash: '/#/tee-sheet', label: 'Tee Sheet (populated)',   waitMs: 4000 },
      { slug: '3_today',     hash: '/#/today',     label: 'Today (full activity)',   waitMs: 4000 },
      { slug: '3_revenue',   hash: '/#/revenue',   label: 'Revenue (full leakage)', waitMs: 4000 },
    ],
  },
  {
    id: 4,
    label: 'Stage 4 — Full Data (all imports complete)',
    imports: [
      { type: 'complaints', file: 'JCM_Communications_RG.csv', expectedRows: 8 },
    ],
    dataState: '100 members + 686 POS + 1,993 tee times + 1,993 booking players + 8 complaints/communications. Full data state. All pages should be populated. Board Report should have full data.',
    screenshots: [
      { slug: '4_board-report',  hash: '/#/board-report',  label: 'Board Report',        waitMs: 5000 },
      { slug: '4_automations',   hash: '/#/automations',   label: 'Automations/Inbox',   waitMs: 6000 },
      { slug: '4_sms-simulator', hash: '/#/sms-simulator', label: 'SMS Chat Simulator',  waitMs: 3000 },
      { slug: '4_service',       hash: '/#/service',       label: 'Service Quality',     waitMs: 4000 },
      { slug: '4_members-full',  hash: '/#/members',       label: 'Members (full data)', waitMs: 4000 },
    ],
  },
];

const STAGES_QUICK = [
  {
    id: 0,
    label: 'Stage 0 — Empty',
    imports: [],
    dataState: 'No data imported. Empty states expected everywhere.',
    screenshots: [
      { slug: '0_revenue', hash: '/#/revenue', label: 'Revenue (empty)', waitMs: 2000 },
      { slug: '0_today',   hash: '/#/today',   label: 'Today (empty)',   waitMs: 2000 },
    ],
  },
  {
    id: 1,
    label: 'Stage 1 — Members',
    imports: [{ type: 'members', file: 'JCM_Members_F9.csv', expectedRows: 100 }],
    dataState: '100 members. No POS, no tee times, no complaints.',
    screenshots: [
      { slug: '1_today', hash: '/#/today', label: 'Today (members only)', waitMs: 3000 },
    ],
  },
  {
    id: 2,
    label: 'Stage 2 — + POS',
    imports: [{ type: 'transactions', file: 'POS_Sales_Detail_SV.csv', expectedRows: 686 }],
    dataState: '100 members + 686 POS transactions. Revenue should show what is possible without tee sheet yet.',
    screenshots: [
      { slug: '2_revenue', hash: '/#/revenue', label: 'Revenue (POS only)', waitMs: 4000 },
    ],
  },
  {
    id: 3,
    label: 'Stage 3 — + Tee Sheet',
    imports: [
      { type: 'tee_times',       file: 'TTM_Tee_Sheet_SV.csv',         expectedRows: 1993 },
      { type: 'booking_players', file: 'TTM_Tee_Sheet_Players_SV.csv', expectedRows: 1993 },
    ],
    dataState: '100 members + 686 POS + 1,993 tee times. Tee sheet + full revenue leakage.',
    screenshots: [
      { slug: '3_tee-sheet', hash: '/#/tee-sheet', label: 'Tee Sheet (populated)',  waitMs: 4000 },
      { slug: '3_revenue',   hash: '/#/revenue',   label: 'Revenue (full leakage)', waitMs: 4000 },
    ],
  },
  {
    id: 4,
    label: 'Stage 4 — Full Data',
    imports: [{ type: 'complaints', file: 'JCM_Communications_RG.csv', expectedRows: 8 }],
    dataState: 'Full data. Service page, board report, automations, SMS all populated.',
    screenshots: [
      { slug: '4_service',       hash: '/#/service',       label: 'Service Quality', waitMs: 4000 },
      { slug: '4_board-report',  hash: '/#/board-report',  label: 'Board Report',    waitMs: 5000 },
      { slug: '4_automations',   hash: '/#/automations',   label: 'Automations',     waitMs: 6000 },
    ],
  },
];

const STAGES = process.env.QUICK_MODE ? STAGES_QUICK : STAGES_FULL;

// ─── Agent Critique ───────────────────────────────────────────────────────────

async function runAgentOnScreenshots(genAI, agent, screenshots, stageLabel, dataState) {
  if (screenshots.length === 0) return null;

  const model = genAI.getGenerativeModel({
    model: AGENT_MODEL,
    systemInstruction: agent.systemPrompt,
    generationConfig: THINKING_CFG,
  });

  // Build multi-image user prompt
  const screenshotList = screenshots.map((s, i) =>
    `Screenshot ${i + 1}: ${s.label} (slug: ${s.slug}, route: ${s.hash})`
  ).join('\n');

  const userPrompt = `
You are reviewing ${screenshots.length} screenshot(s) of the Swoop Member Portal.

DATA STAGE: ${stageLabel}
DATA STATE: ${dataState}

Screenshots provided (in order):
${screenshotList}

Score all applicable dimensions using evidence from these screenshots.
For dimensions where the current data stage makes evaluation impossible,
score conservatively and note "data stage limitation" in the rationale.

Return ONLY valid JSON matching the output contract in your system prompt.
No markdown fences, no explanation outside the JSON.
`.trim();

  // Build parts array: images first, then text
  const imageParts = screenshots.map(s => ({
    inlineData: {
      mimeType: 'image/png',
      data: fs.readFileSync(s.screenshotPath).toString('base64'),
    },
  }));

  const rawText = await geminiWithRetry(async () => {
    const result = await model.generateContent([...imageParts, userPrompt]);
    return result.response.text();
  });

  const parsed = parseAgentJSON(rawText);
  const validation = validateContract(parsed, agent);

  if (!validation.valid) {
    console.warn(`    ⚠ ${agent.name} contract invalid: ${validation.errors.join('; ')}`);
    // Retry once with explicit reminder
    const retryText = await geminiWithRetry(async () => {
      const reminder = `${userPrompt}\n\nCRITICAL: Your previous response was not valid JSON or was missing required fields. Return ONLY a JSON object. No markdown, no text before or after the JSON.`;
      const result = await model.generateContent([...imageParts, reminder]);
      return result.response.text();
    }).catch(() => null);

    if (retryText) {
      const retryParsed = parseAgentJSON(retryText);
      const retryValidation = validateContract(retryParsed, agent);
      if (retryValidation.valid) {
        console.log(`    ✓ ${agent.name} retry succeeded`);
        return retryParsed;
      }
    }
    // Return whatever we have, marked as errored
    parsed._agentError = validation.errors;
  }

  return parsed;
}

// ─── Per-Stage Agent Run ──────────────────────────────────────────────────────

async function runAgentsForStage(genAI, stageShotInfos, stageLabel, dataState) {
  // stageShotInfos: array of { slug, label, hash, screenshotPath }
  // Group screenshots by agent
  const agentTasks = AGENTS.map(agent => {
    const relevant = stageShotInfos.filter(s => getAgentsForSlug(s.slug).some(a => a.id === agent.id));
    return { agent, screenshots: relevant };
  }).filter(t => t.screenshots.length > 0);

  console.log(`\n  🤖 Running ${agentTasks.length} agents across ${stageShotInfos.length} screenshot(s)…`);

  // Fan out all agents in parallel
  const results = await Promise.all(
    agentTasks.map(({ agent, screenshots }) =>
      runAgentOnScreenshots(genAI, agent, screenshots, stageLabel, dataState)
        .then(output => ({ agentId: agent.id, agentName: agent.name, output }))
        .catch(err => {
          console.error(`    ✗ ${agent.name} failed: ${err.message}`);
          return { agentId: agent.id, agentName: agent.name, output: null, error: err.message };
        })
    )
  );

  return results;
}

// ─── History Helper ───────────────────────────────────────────────────────────

function appendHistory(runMeta, composite) {
  let history = [];
  if (fs.existsSync(HISTORY_FILE)) {
    try { history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); } catch {}
  }
  history.push({
    run: runMeta.run,
    timestamp: new Date().toISOString(),
    app_url: runMeta.app_url,
    composite: composite ?? null,
  });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
  console.log(`  ✓ scoring-history.json updated (${history.length} runs)`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🏌️  Swoop Scoring Loop — 8-Agent System');
  console.log(`    App URL:  ${APP_URL}`);
  console.log(`    Mode:     ${process.env.QUICK_MODE ? 'QUICK (9 screenshots)' : 'FULL (15 screenshots)'}`);

  if (!API_KEY) {
    console.error('❌  GEMINI_API_KEY is required.');
    process.exit(1);
  }

  const ts = makeTimestamp();
  const outputDir      = path.join(OUTPUT_BASE, `scoring-run-${ts}`);
  const screenshotsDir = path.join(outputDir, 'screenshots');
  const agentOutputDir = path.join(outputDir, 'agent-outputs');
  const orchDir        = path.join(outputDir, 'orchestrator');

  await ensureDir(outputDir);
  await ensureDir(screenshotsDir);
  await ensureDir(agentOutputDir);
  await ensureDir(orchDir);

  console.log(`\n📁 Output: ${outputDir}`);

  const genAI = new GoogleGenerativeAI(API_KEY);

  // ── Create club + login ────────────────────────────────────────────────────
  console.log('\n🏗  Creating club…');
  const { clubId, email, password } = await createClub(APP_URL);
  const { token, user } = await login(APP_URL, email, password);

  const runMeta = { run: ts, club_id: clubId, app_url: APP_URL };

  // ── Browser setup ──────────────────────────────────────────────────────────
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });

  // Accumulated agent outputs across all stages
  // agentId -> latest output (agents re-scored per stage; last write wins for now)
  const allAgentOutputs = {};

  try {
    for (const stage of STAGES) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`📦 ${stage.label}`);

      // Import CSVs for this stage
      for (const imp of stage.imports) {
        const csvPath = path.join(FIXTURE_DIR, imp.file);
        if (!fs.existsSync(csvPath)) {
          console.warn(`  ⚠ Fixture not found: ${csvPath} — skipping`);
          continue;
        }
        await importCSV(APP_URL, token, imp.type, csvPath, imp.expectedRows);
        await sleep(2000);
      }

      // Take all screenshots for this stage
      const stageShotInfos = [];
      for (const shot of stage.screenshots) {
        console.log(`\n  📄 ${shot.label}`);
        let page;
        try {
          page = await injectAuthAndNavigate(context, APP_URL, shot.hash, token, user, clubId);
        } catch (err) {
          console.error(`  ✗ Navigation failed for ${shot.slug}: ${err.message}`);
          continue;
        }

        const screenshotPath = path.join(screenshotsDir, `${shot.slug}.png`);
        try {
          await captureScreenshot(page, screenshotPath, shot.waitMs);
          stageShotInfos.push({ ...shot, screenshotPath });
        } catch (err) {
          console.error(`  ✗ Screenshot failed for ${shot.slug}: ${err.message}`);
        }
        await page.close().catch(() => {});
      }

      if (stageShotInfos.length === 0) {
        console.warn(`  ⚠ No screenshots captured for ${stage.label} — skipping agents`);
        continue;
      }

      // Run agents on this stage's screenshots
      const stageResults = await runAgentsForStage(
        genAI, stageShotInfos, stage.label, stage.dataState
      );

      // Save agent outputs (per-stage files + accumulate for orchestrator)
      for (const { agentId, agentName, output, error } of stageResults) {
        const filename = `stage${stage.id}_${agentId}.json`;
        const content = output
          ? JSON.stringify(output, null, 2)
          : JSON.stringify({ error: error || 'no output' });
        writeFileSafe(path.join(agentOutputDir, filename), content);

        // Merge into cumulative agent outputs (later stages enrich the picture)
        if (output && !output._parseError) {
          if (!allAgentOutputs[agentId]) {
            allAgentOutputs[agentId] = output;
          } else {
            // Merge recommendations and issues from later stages
            const existing = allAgentOutputs[agentId];
            existing.recommendations = [
              ...(existing.recommendations || []),
              ...(output.recommendations || []),
            ];
            existing.top_issues = [
              ...(existing.top_issues || []),
              ...(output.top_issues || []),
            ];
            // Update scores: keep the one with more valid dimensions
            const existingDims = Object.keys(existing.scores || {}).length;
            const newDims = Object.keys(output.scores || {}).length;
            if (newDims > existingDims) {
              existing.scores = { ...(existing.scores || {}), ...(output.scores || {}) };
            }
          }
        }

        const avg = output ? computeWeightedComposite({ [agentId]: output }).agentAverages[agentId] : null;
        console.log(`    ${agentName}: ${avg !== null ? avg.toFixed(1) + '/10' : 'ERROR'}`);
      }

      await sleep(2000); // pacing between stages
    }

    // ── Save consolidated agent outputs ────────────────────────────────────
    for (const [agentId, output] of Object.entries(allAgentOutputs)) {
      writeFileSafe(
        path.join(agentOutputDir, `${agentId}_consolidated.json`),
        JSON.stringify(output, null, 2)
      );
    }

    // ── Compute weighted composite ─────────────────────────────────────────
    const { composite, contributions, agentAverages } = computeWeightedComposite(allAgentOutputs);
    console.log(`\n📊 Weighted Composite: ${composite ?? 'N/A'} / 10`);
    for (const [id, contrib] of Object.entries(contributions)) {
      const agent = AGENTS.find(a => a.id === id);
      console.log(`    ${(agent?.name || id).padEnd(30)} ${contrib.average.toFixed(1)}/10  (weight ${Math.round(agent.weight * 100)}%)`);
    }

    // ── Merged recommendations ─────────────────────────────────────────────
    const merged = mergeRecommendations(allAgentOutputs);
    const recsPath = path.join(orchDir, 'RECOMMENDATIONS.json');
    writeFileSafe(recsPath, JSON.stringify(merged, null, 2));
    console.log(`\n📋 ${merged.length} recommendations merged (${merged.filter(r => r.priority === 'P0').length} P0, ${merged.filter(r => r.priority === 'P1').length} P1, ${merged.filter(r => r.priority === 'P2').length} P2)`);

    // ── Run orchestrator ───────────────────────────────────────────────────
    console.log('\n🎯 Running orchestrator…');
    let orchResult;
    try {
      orchResult = await runOrchestrator(genAI, allAgentOutputs, runMeta);
    } catch (err) {
      console.error(`  ✗ Orchestrator failed: ${err.message}`);
      orchResult = { parsed: { _error: err.message }, composite, merged };
    }

    // Write orchestrator outputs
    const scorecardPath = path.join(orchDir, 'SCORECARD.json');
    writeFileSafe(scorecardPath, JSON.stringify({
      run: ts,
      app_url: APP_URL,
      club_id: clubId,
      composite: orchResult.composite ?? composite,
      ...orchResult.parsed,
    }, null, 2));

    // Generate REPORT.md from orchestrator JSON
    const reportPath = path.join(orchDir, 'REPORT.md');
    const report = buildReport(orchResult.parsed, ts, APP_URL, composite);
    writeFileSafe(reportPath, report);

    // ── Append to scoring history ──────────────────────────────────────────
    appendHistory(runMeta, orchResult.composite ?? composite);

    // ── Print summary ──────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(60));
    console.log('📊 FINAL COMPOSITE SCORE');
    console.log('═'.repeat(60));
    for (const agent of AGENTS) {
      const avg = agentAverages[agent.id];
      const bar = avg !== null ? '█'.repeat(Math.round(avg)) + '░'.repeat(10 - Math.round(avg)) : '─'.repeat(10);
      console.log(`  ${agent.name.padEnd(30)} ${bar} ${avg !== null ? avg.toFixed(1) : 'N/A'}/10  (${Math.round(agent.weight * 100)}%)`);
    }
    console.log('═'.repeat(60));
    console.log(`  COMPOSITE: ${composite ?? 'N/A'} / 10`);
    console.log('═'.repeat(60));
    console.log(`\n✅ Output: ${outputDir}`);
    console.log(`   Recommendations: ${merged.length} (top 10 P0/P1 ready for implementation)`);
    console.log('\nRun complete.\n');

    return { outputDir, composite, merged };

  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

// ─── Report Builder ───────────────────────────────────────────────────────────

function buildReport(orchParsed, ts, appUrl, composite) {
  const safe = (v, fallback = 'N/A') => v ?? fallback;
  const lines = [
    `# Swoop Scoring Run — ${ts}`,
    `**App:** ${appUrl}  **Composite:** ${safe(composite)} / 10`,
    '',
    '## Headline Verdict',
    safe(orchParsed.headline_verdict, '_Orchestrator output unavailable._'),
    '',
    '## Scorecard',
    '| Dimension | Score | Weight | Weighted | Top Issue |',
    '|-----------|-------|--------|----------|-----------|',
  ];

  if (Array.isArray(orchParsed.scorecard)) {
    for (const row of orchParsed.scorecard) {
      lines.push(`| ${row.dimension} | ${row.score}/10 | ${Math.round((row.weight || 0) * 100)}% | ${row.weighted ?? '—'} | ${row.top_issue ?? '—'} |`);
    }
  }

  lines.push('', '## Top Strengths');
  if (Array.isArray(orchParsed.top_strengths)) {
    for (const s of orchParsed.top_strengths) {
      const str = typeof s === 'string' ? s : s.strength;
      const ref = typeof s === 'object' && s.screenshot_ref ? ` *(${s.screenshot_ref})*` : '';
      lines.push(`- ${str}${ref}`);
    }
  }

  lines.push('', '## Top Issues');
  if (Array.isArray(orchParsed.top_issues)) {
    for (const issue of orchParsed.top_issues) {
      const str = typeof issue === 'string' ? issue : issue.issue;
      const ref = typeof issue === 'object' && issue.screenshot_ref ? ` *(${issue.screenshot_ref})*` : '';
      lines.push(`- ${str}${ref}`);
    }
  }

  lines.push('', '## Roadmap');
  if (orchParsed.roadmap) {
    for (const priority of ['P0', 'P1', 'P2']) {
      const items = orchParsed.roadmap[priority];
      if (!Array.isArray(items) || items.length === 0) continue;
      lines.push(`\n### ${priority}`);
      for (const item of items) {
        lines.push(`- **${item.surface}**: ${item.change}  *(lift: ${item.expected_lift})*`);
      }
    }
  }

  if (orchParsed.counter_positioning) {
    lines.push('', '## Counter-Positioning vs MetricsFirst', orchParsed.counter_positioning);
  }

  lines.push('', `---`, `*Generated by scoring-loop.mjs | ${new Date().toISOString()}*`);

  return lines.join('\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message || err);
  process.exit(1);
});
