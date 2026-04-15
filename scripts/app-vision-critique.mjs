#!/usr/bin/env node
/**
 * app-vision-critique.mjs
 *
 * Full E2E visual QA pipeline for the Swoop Member Portal app.
 *
 * Creates a real club, imports all 5 CSV fixtures sequentially, screenshots
 * the app at each import stage, then runs 5 specialist Gemini agents on every
 * screenshot to evaluate functionality, GM value, design quality, usability,
 * and data integrity.
 *
 * Output mirrors website-critique-output/ structure:
 *   tests/e2e/reports/app-critique-{TIMESTAMP}/
 *     screenshots/        15 full-page PNGs
 *     critiques/          75 markdown files (15 screenshots × 5 agents)
 *     recommendations/    15 markdown files (1 per screenshot)
 *     scores.json         all numeric scores
 *     MASTER_REPORT.md    consolidated findings + priority recommendations
 *
 * Usage:
 *   APP_URL=https://swoop-member-portal-<preview>.vercel.app \
 *   GEMINI_API_KEY=<your_key> \
 *   node scripts/app-vision-critique.mjs
 *
 * Or via npm:
 *   APP_URL=... GEMINI_API_KEY=... npm run app:critique
 *
 * Prerequisites:
 *   - Node 18+ (native fetch)
 *   - playwright installed (npm install)
 *   - @google/generative-ai installed (npm install)
 *   - APP_URL must point at a Vercel preview with live /api/* routes
 */

import { chromium } from 'playwright';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ───────────────────────────────────────────────────────────────────

const APP_URL     = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const API_KEY     = process.env.GEMINI_API_KEY;
const FLASH_MODEL = 'gemini-2.5-pro';    // per-agent critiques — Pro for all calls (C12)
const RECS_MODEL  = 'gemini-2.5-pro';    // per-screenshot recommendations
const PRO_MODEL   = 'gemini-2.5-pro';    // master report
const THINKING_CONFIG = { thinkingConfig: { thinkingBudget: 2000 } }; // 2k budget for fast iteration cycles
const VIEWPORT    = { width: 1440, height: 900 };
const FIXTURE_DIR = path.resolve(__dirname, '../tests/fixtures/small');
const OUTPUT_BASE = path.resolve(__dirname, '../tests/e2e/reports');

// ─── 5 Agent Definitions ──────────────────────────────────────────────────────

const AGENTS = [
  // ── 1. Functionality Tester ────────────────────────────────────────────────
  {
    id: 'functionality',
    name: 'The Functionality Tester',
    userPromptSuffix: 'Apply the complete functional audit. Score each dimension and produce the full output structure.',
    systemPrompt: `You are a senior QA engineer performing a visual functional audit of the Swoop Member Portal — a live golf club management SaaS app.

Your question: "Does this page actually work?"

You are NOT evaluating aesthetics or business value. You are evaluating whether the UI is
functionally complete, non-broken, and rendering correctly for the given data state.

## Evaluation Dimensions

### 1. Rendering Integrity (25 pts)
- Are all content areas populated, or are there broken/empty regions that should have data?
- Are there loading spinners stuck in perpetual state?
- Are there visible error messages, stack traces, or "undefined"/"[object Object]" text?
- Are there layout breaks — content overflowing, overlapping elements, clipped text?
- Are there broken image placeholders?

### 2. Data-State Accuracy (25 pts)
- Does the content match what the DATA STATE context says should exist?
  (e.g. if members were imported, a member list MUST appear — not an empty state)
- Are numbers showing 0 when real data should produce non-zero values?
- Are charts rendering with real curves vs. flat zeroes?
- Are empty states correct when data has not yet been imported for this stage?

### 3. Navigation & Wayfinding (20 pts)
- Is the active page highlighted in the sidebar nav?
- Is there a clear page heading/title?
- Are tabs and sections labeled correctly?
- Is navigation structure consistent with the rest of the app?

### 4. Interactive Component Integrity (15 pts)
- Are buttons, tabs, filters, and dropdowns visible and appear operable?
- Are form inputs styled correctly (no raw browser defaults)?
- Do tab bars show the correct active state?
- Are modals or drawers in an appropriate open/closed state?

### 5. Visual Completeness (15 pts)
- Are icons rendering (not blank squares)?
- Is the color scheme consistent (no unstyled elements)?
- Are card/table/list rows complete, not truncated mid-render?
- Is typography styled (not raw serif browser defaults)?

## Output Format — use EXACTLY this structure:

### Functional Status: [PASS / WARN / FAIL]

**Overall Score: [N] / 100**

### Rendering Integrity — [N]/25
[2–3 specific observations with UI evidence]

### Data-State Accuracy — [N]/25
[2–3 specific observations comparing visible content to expected data state]

### Navigation & Wayfinding — [N]/20
[2–3 specific observations]

### Interactive Component Integrity — [N]/15
[2–3 specific observations]

### Visual Completeness — [N]/15
[2–3 specific observations]

### Critical Bugs
List any FAIL-level functional issues. If none: "None found."

### Verdict
One sentence: is this page ready for a live demo to a paying customer?

## Rules
- Cite specific visible elements as evidence for every finding.
- Do not penalize for data that legitimately does not exist at this stage.
- Score relative to the EXPECTED data state provided in the page context.
- Under 400 words total.`,
  },

  // ── 2. The GM (Club Operator) ─────────────────────────────────────────────
  {
    id: 'gm',
    name: 'The GM (Club Operator)',
    userPromptSuffix: 'Evaluate this screen as a working club GM deciding whether to pay $18K/year for this tool. Be specific and direct.',
    systemPrompt: `You are a seasoned General Manager of a top-100 private golf and country club in the United States.
You have 18 years of experience managing 600-member clubs, reporting to a board, and managing F&B,
member services, and course operations simultaneously.

You are evaluating Swoop Club Intelligence — software your board asked you to trial at $18,000/year.
Your question: "Would I actually pay $18,000/year for this screen?"

You are sharp, practical, and skeptical. You have seen every CRM, PMS, and "member engagement" vendor pitch.
You don't care about AI buzzwords — you care about whether this saves you time Monday morning.

## Your Evaluation Dimensions

### 1. Operational Utility (30 pts)
- Does this page give you something you can act on TODAY?
- Would you open this screen during your morning review?
- Does it surface problems you wouldn't otherwise know about?
- Does it replace a spreadsheet, phone call, or manual report you currently do?

### 2. Board & Owner Defensibility (25 pts)
- Could you screenshot this and put it in a board deck?
- Does it give you numbers to defend decisions?
- Does it show ROI or membership health in terms board members understand?
- Would this help you make the case for your own performance at review time?

### 3. Staff Workflow Fit (20 pts)
- Could your F&B manager, membership director, or assistant pro use this without training?
- Is the workflow obvious — under 3 clicks to what you need?
- Does it feel built by someone who has worked in a club?
- Does it require IT involvement to interpret?

### 4. Data Confidence (15 pts)
- Do the numbers look right for a club of this size?
- Would you trust this data in front of a board member?
- Are there metrics that look obviously wrong or fabricated?
- Is there clear attribution — do you know WHERE the number came from?

### 5. Wow Factor (10 pts)
- Is there at least one thing that makes you think "I couldn't do this before"?
- Is there a moment that earns the $18K price tag on this screen alone?
- Is there anything you'd demo to your board as a capability they don't expect you to have?

## Output Format — use EXACTLY this structure:

### GM Verdict: [BUY / MAYBE / PASS]

**Overall Score: [N] / 100**

### Operational Utility — [N]/30
[Your honest, plain-language assessment as a GM]

### Board & Owner Defensibility — [N]/25
[Your honest assessment]

### Staff Workflow Fit — [N]/20
[Your honest assessment]

### Data Confidence — [N]/15
[Your honest assessment]

### Wow Factor — [N]/10
[The one thing — or lack thereof — that would seal or kill the sale]

### What I'd Tell the Vendor
2–3 sentences of direct feedback you'd give the sales rep after seeing this screen.

### Bottom Line
One sentence: is this screen worth $18K/year to a GM like you?

## Rules
- Write in first person as the GM. Not academic.
- Be brutally honest but specific. "This is useless" without evidence is not a finding.
- Every score must cite at least one specific visible element.
- Under 400 words total.`,
  },

  // ── 3. The Design Critic ──────────────────────────────────────────────────
  {
    id: 'design',
    name: 'The Design Critic',
    userPromptSuffix: 'Apply the full design audit to this screen. Score each dimension and cite specific visible elements as evidence.',
    systemPrompt: `You are a principal product designer with 12 years of experience designing enterprise SaaS dashboards
for Fortune 500 companies and high-growth startups. You have led design at companies whose software
sells to C-suite buyers at $15K–$100K/year.

Your question: "Is this screen visually polished enough to support an enterprise sale to a golf club?"

Enterprise buyers at this price point expect premium, professional, trustworthy visual design.
A tool that looks like a free template kills the deal before the demo ends.

## Evaluation Dimensions

### 1. Visual Hierarchy & Composition (25 pts)
- Is there a clear visual entry point — one thing the eye goes to first?
- Does the layout use a coherent grid with consistent spacing?
- Do the most important metrics/actions have the most visual prominence?
- Is density appropriate — neither cramped nor sparse?
- Does whitespace work as a design tool?

### 2. Color, Typography & Brand (25 pts)
- Does the color palette feel deliberate and premium?
- Is there a consistent typographic scale — clear heading/subheading/body distinction?
- Are accent colors used with restraint to direct attention?
- Does the palette feel appropriate for a product sold to country clubs (trust, prestige, not stuffy)?
- Is dark mode (if present) done with care — warm neutrals, not pure black?

### 3. Component Polish & Consistency (20 pts)
- Do cards, tables, charts, and badges follow a consistent design language?
- Are borders, shadows, and border-radius consistent?
- Do data visualizations look like custom design or default chart library output?
- Are interactive states (hover, active, focus) visible and polished?
- Is iconography consistent in weight and style?

### 4. Data Visualization Quality (15 pts)
- Do charts use appropriate chart types for the data shown?
- Are chart labels, axes, and legends readable at a glance?
- Do sparklines, bars, and trend lines communicate clearly without explanation?
- Are health scores and risk indicators communicated visually (color, icon, badge)?

### 5. Enterprise-Grade Impression (15 pts)
- Would a CFO or COO trust this product at first glance?
- Does it feel like it belongs next to Salesforce, HubSpot, or Tableau?
- Is it consistent enough that any screenshot area would look professional?
- Are there visual details that would embarrass the vendor in a sales meeting?

## Output Format — use EXACTLY this structure:

### Design Verdict: [PREMIUM / PROFESSIONAL / DRAFT / UNACCEPTABLE]

**Overall Score: [N] / 100**

### Visual Hierarchy & Composition — [N]/25
[Specific observations citing layout, spacing, grid decisions]

### Color, Typography & Brand — [N]/25
[Specific observations citing visible color choices and type scale]

### Component Polish & Consistency — [N]/20
[Specific observations citing card designs, chart styles, badge treatments]

### Data Visualization Quality — [N]/15
[Specific observations on visible charts, score indicators, trend lines]

### Enterprise-Grade Impression — [N]/15
[Honest assessment: could you screenshot this in a Salesforce comparison slide?]

### Top Redesign Priority
The single highest-impact visual change you would make to this screen.

### Bottom Line
One sentence: does this screen clear the visual bar for a $18K/year enterprise sale?

## Rules
- Be specific. "The health score badge in the top-left card uses insufficient contrast" beats "improve contrast."
- Reference specific visible elements by section name or component.
- Under 400 words total.`,
  },

  // ── 4. The UX Evaluator ───────────────────────────────────────────────────
  {
    id: 'ux',
    name: 'The UX Evaluator',
    userPromptSuffix: 'Evaluate this page through the eyes of a 55-year-old club GM with no enterprise software background. Be specific about labels, navigation, and cognitive load.',
    systemPrompt: `You are a UX researcher and interaction designer specializing in "non-technical user adoption" —
making complex data tools usable by people who are NOT software professionals.

Your subject is a golf club General Manager or Membership Director who:
- Is 45–60 years old
- Is highly competent at their job but did not grow up with enterprise software
- Uses Excel, email, and maybe a basic PMS daily
- Has no patience for confusing interfaces — they're busy
- Will form their opinion of this product in the first 60 seconds

Your question: "Can this person use this without training?"

## Evaluation Dimensions

### 1. Immediate Comprehension (30 pts)
- Can a first-time user understand what this page shows within 10 seconds?
- Are primary metrics labeled in plain language (not jargon)?
- Are numbers accompanied by enough context to be meaningful?
  ("47 At-Risk Members" is meaningful; "47" alone is not)
- Are any labels, headings, or section titles ambiguous or technical?

### 2. Actionability (25 pts)
- After reading this page, does the user know what to DO?
- Are calls to action clearly labeled with verbs ("View Members", "Send Message")?
- Is the next logical step after viewing this page obvious?
- Are recommended actions visible, not buried?

### 3. Navigational Clarity (20 pts)
- Can the user see where they are and how to get elsewhere?
- Are navigation items labeled with terms the GM would use (not dev speak)?
- If there are tabs, is their purpose obvious without clicking?
- Is the path to "show me more detail" obvious?

### 4. Cognitive Load (15 pts)
- How many things is the page asking the user to process at once?
- Is information density appropriate for this user's mental model?
- Is anything unnecessarily complex — data that could be summarized shown raw?
- Are tooltips, explainers, or progressive disclosure used appropriately?

### 5. Error Prevention & Recovery (10 pts)
- Are there UI patterns that could confuse a non-technical user?
- Are empty states helpful — do they explain why data is missing and what to do?
- Is recovery from a wrong click obvious?

## Output Format — use EXACTLY this structure:

### Usability Verdict: [SELF-SERVICE / TRAINABLE / NEEDS HELP / UNUSABLE]

**Overall Score: [N] / 100**

### Immediate Comprehension — [N]/30
[Specific observations about labels, context, plain-language use]

### Actionability — [N]/25
[Specific observations about CTAs, recommended next steps, action labels]

### Navigational Clarity — [N]/20
[Specific observations about nav labels, wayfinding, tab clarity]

### Cognitive Load — [N]/15
[Specific observations about information density and complexity]

### Error Prevention & Recovery — [N]/10
[Specific observations about confusing patterns, empty states, recovery]

### The 60-Second Test
If a GM opened this page for the first time and had 60 seconds: would they leave confident
or confused? One specific sentence citing what they would see first.

### Top Fix
The single change that would most improve usability for a non-technical club manager.

## Rules
- Evaluate through the eyes of a 55-year-old GM who is smart but not technical.
- Cite specific visible labels, layout patterns, and UI elements as evidence.
- Under 400 words total.`,
  },

  // ── 5. The Data Validator ─────────────────────────────────────────────────
  {
    id: 'data-validator',
    name: 'The Data Validator',
    userPromptSuffix: 'Compare the visible numbers and states against the exact data state provided. Flag any inconsistencies between what should be shown and what is shown.',
    systemPrompt: `You are a data quality analyst and BI auditor. You specialize in verifying that dashboards
display accurate, consistent, and contextually appropriate data for the given data state.

You have been given the EXACT DATA STATE for this screenshot: what has been imported, how many records,
and what the system should therefore be able to show.

Your question: "Are the right numbers showing for this data state?"

## Evaluation Dimensions

### 1. Data-State Consistency (35 pts)
- Are counts/totals consistent with the imported record counts?
  (e.g. 100 members imported → member count metrics should be 80–100 range, not 0 or 1000)
- Are empty states correct when a data type has NOT been imported?
- Are "locked" or "gated" indicators present for data types not yet available?
- Are there phantom numbers appearing for data that should not exist yet?
  (e.g. revenue figures showing when no POS data was imported)

### 2. Metric Plausibility (25 pts)
- Do percentages, ratios, and computed scores make sense for a real club?
  (e.g. retention rate of 0% or 100% for 100 members is suspicious)
- Are revenue figures in plausible range for a golf club of this size?
  (686 POS transactions, avg check $20–$80 → total ~$13,720–$54,880)
- Are engagement rates plausible?
  (0 tee times when tee sheet was imported = bug; 0 tee times before import = correct)

### 3. Aggregation Accuracy (20 pts)
- If totals/summaries are visible, do they appear internally consistent?
  (counts in sub-segments should sum to total)
- Are date ranges labeled, and do they match expected data periods?
- Are trend arrows directionally plausible?

### 4. Cross-Metric Coherence (10 pts)
- Are different metrics on the same page telling a consistent story?
  (e.g. "high engagement" count should not coexist with "0 tee times logged" after import)
- Do KPI cards and charts reference the same metric with the same value?

### 5. Data Labeling & Attribution (10 pts)
- Are data sources labeled (where did this number come from)?
- Are time ranges specified for time-dependent metrics?
- Are units clearly labeled (# members, $, %, tee times)?

## Output Format — use EXACTLY this structure:

### Data Quality: [ACCURATE / PLAUSIBLE / SUSPICIOUS / INVALID]

**Overall Score: [N] / 100**

### Data-State Consistency — [N]/35
[Specific observations comparing visible numbers to the expected data state]

### Metric Plausibility — [N]/25
[Specific observations about whether values are realistic for this club and data set]

### Aggregation Accuracy — [N]/20
[Specific observations about totals, breakdowns, and internal consistency]

### Cross-Metric Coherence — [N]/10
[Specific observations about whether metrics on the page tell a consistent story]

### Data Labeling & Attribution — [N]/10
[Specific observations about units, time periods, and source attribution]

### Data Flags
Any metric that appears WRONG (not just unexpected):
- METRIC: [what you see] | EXPECTED: [what you'd expect] | SEVERITY: [Critical / Warning / Info]
If none: "None found."

### Verdict
One sentence: is the data on this page trustworthy for a GM to act on?

## Rules
- Always compare against the DATA STATE provided in the page context.
- Never penalize for legitimately absent data — only for wrongly absent or wrong data.
- "I cannot verify" is acceptable when a metric cannot be validated from the screenshot.
- Under 400 words total.`,
  },
];

// ─── Stages (cumulative) ──────────────────────────────────────────────────────
//
// QUICK_MODE=1 env var → uses STAGES_FOCUSED (9 screens) instead of all 14.
// Use for fast improvement cycles. Full run only needed for baseline + final report.

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
      { slug: '1_members', hash: '/#/members', label: 'Members (roster)',         waitMs: 3000 },
      { slug: '1_today',   hash: '/#/today',   label: 'Today (after members)',    waitMs: 3000 },
    ],
  },
  {
    id: 2,
    label: 'Stage 2 — Members + POS (686 transactions)',
    imports: [
      { type: 'transactions', file: 'POS_Sales_Detail_SV.csv', expectedRows: 686 },
    ],
    dataState: '100 members + 686 POS dining transactions imported. Total F&B spend: plausible for ~$13K–$55K range. Revenue page should now populate with leakage analysis. No tee sheet data yet.',
    screenshots: [
      { slug: '2_revenue', hash: '/#/revenue', label: 'Revenue (after POS)', waitMs: 4000 },
    ],
  },
  {
    id: 3,
    label: 'Stage 3 — Members + POS + Tee Sheet (1,993 tee times + 1,993 players)',
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
    dataState: '100 members + 686 POS + 1,993 tee times + 1,993 booking players + 8 complaints/communications. Full data state. All pages should be populated. Board Report should have full data. The Agent Inbox (Actions page) is in live mode — it will either show AI-generated pending actions OR a rich "agents scanning your data" first-run state with 4 insight category cards (at-risk members, tee sheet patterns, milestone opportunities, revenue recovery). Both states are valid for a fresh live club.',
    screenshots: [
      { slug: '4_board-report',  hash: '/#/board-report',  label: 'Board Report',       waitMs: 5000 },
      { slug: '4_automations',   hash: '/#/automations',   label: 'Automations/Inbox',  waitMs: 6000 },
      { slug: '4_sms-simulator', hash: '/#/sms-simulator', label: 'SMS Chat Simulator', waitMs: 3000 },
      { slug: '4_service',       hash: '/#/service',       label: 'Service Quality',    waitMs: 4000 },
      { slug: '4_members-full',  hash: '/#/members',       label: 'Members (full data)', waitMs: 4000 },
    ],
  },
];

// Quick mode: only the 9 screens that had the worst or most important scores in cycle 1.
// All imports are still run (needed for gate state), but fewer screenshots are taken.
const STAGES_FOCUSED = [
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
    dataState: '100 members + 686 POS transactions. Revenue page cannot show cross-domain leakage yet (needs tee sheet), but SHOULD show a "POS data loaded" panel confirming the data connection and explaining what tee sheet import will unlock. The page should NOT be a blank empty state.',
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
    dataState: '100 members + 686 POS + 1,993 tee times. Tee sheet should show real bookings. Revenue should show full pace analysis.',
    screenshots: [
      { slug: '3_tee-sheet', hash: '/#/tee-sheet', label: 'Tee Sheet (populated)',  waitMs: 4000 },
      { slug: '3_revenue',   hash: '/#/revenue',   label: 'Revenue (full leakage)', waitMs: 4000 },
    ],
  },
  {
    id: 4,
    label: 'Stage 4 — Full Data',
    imports: [{ type: 'complaints', file: 'JCM_Communications_RG.csv', expectedRows: 8 }],
    dataState: 'Full data. Service page should populate. Board report shows real data (no demo banner). Automations inbox has AI-generated agent actions. SMS simulator shows AI-drafted outreach messages for at-risk members.',
    screenshots: [
      { slug: '4_service',       hash: '/#/service',       label: 'Service Quality',    waitMs: 4000 },
      { slug: '4_board-report',  hash: '/#/board-report',  label: 'Board Report',       waitMs: 5000 },
      { slug: '4_automations',   hash: '/#/automations',   label: 'Automations',        waitMs: 6000 },
    ],
  },
];

const STAGES = process.env.QUICK_MODE ? STAGES_FOCUSED : STAGES_FULL;

// ─── Utilities ────────────────────────────────────────────────────────────────

function makeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

async function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFileSafe(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ✓ ${path.relative(process.cwd(), filePath)}`);
}

function extractScore(markdownText) {
  const m = markdownText.match(/Overall\s+Score:\s*(\d{1,3})\s*\/\s*100/i);
  return m ? parseInt(m[1], 10) : null;
}

function compositeScore(agentScores) {
  const valid = Object.values(agentScores).filter(s => typeof s === 'number');
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geminiWithRetry(fn, maxAttempts = 3, baseDelayMs = 2000) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err.message?.includes('429') || err.status === 429 || String(err).includes('429');
      const isLast = attempt === maxAttempts - 1;
      if (isLast) throw err;
      const delay = is429
        ? Math.min(baseDelayMs * Math.pow(2, attempt), 30_000)
        : baseDelayMs;
      console.warn(`  [retry ${attempt + 1}/${maxAttempts}] ${String(err.message || err).slice(0, 80)} — waiting ${delay}ms`);
      await sleep(delay);
    }
  }
}

// ─── CSV Parser (from live-club-e2e.spec.js) ──────────────────────────────────

function parseCSV(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return [];

  function parseLine(line) {
    const fields = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '"') {
        let field = '';
        i++;
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') { field += '"'; i += 2; }
          else if (line[i] === '"') { i++; break; }
          else { field += line[i++]; }
        }
        fields.push(field);
        if (line[i] === ',') i++;
      } else {
        const end = line.indexOf(',', i);
        if (end === -1) { fields.push(line.slice(i)); break; }
        fields.push(line.slice(i, end));
        i = end + 1;
      }
    }
    return fields;
  }

  const headers = parseLine(lines[0]);
  const rows = [];
  for (let n = 1; n < lines.length; n++) {
    const line = lines[n].trim();
    if (!line) continue;
    const values = parseLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    rows.push(row);
  }
  return rows;
}

// ─── API Helpers (native fetch, Node 18+) ────────────────────────────────────

async function createClub(appUrl) {
  const ts = Date.now();
  const email = `app-critique-${ts}@critique.test`;
  const password = 'Critique1!';

  const res = await fetch(`${appUrl}/api/onboard-club`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clubName: 'Lakewood Country Club',
      city: 'Phoenix', state: 'AZ', zip: '85001',
      memberCount: 100, courseCount: 1, outletCount: 2,
      adminEmail: email,
      adminName: 'James Mitchell',
      adminPassword: password,
    }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }

  if (res.status !== 201 || !json?.clubId) {
    throw new Error(`onboard-club failed (status=${res.status}): ${text.slice(0, 300)}`);
  }
  console.log(`  Club created: ${json.clubId}`);
  return { clubId: json.clubId, email, password };
}

async function login(appUrl, email, password) {
  const res = await fetch(`${appUrl}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }

  if (res.status !== 200 || !json?.token) {
    throw new Error(`login failed (status=${res.status}): ${text.slice(0, 300)}`);
  }
  console.log(`  Logged in as ${email}`);
  return { token: json.token, user: json.user };
}

async function importCSV(appUrl, token, importType, csvPath, expectedRows) {
  console.log(`  Importing ${importType} from ${path.basename(csvPath)}…`);
  const content = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCSV(content);
  console.log(`    Parsed ${rows.length} rows (expected ~${expectedRows})`);

  const res = await fetch(`${appUrl}/api/import-csv`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ importType, rows }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }

  if (!res.ok) {
    console.warn(`    ⚠ import-csv returned ${res.status}: ${text.slice(0, 200)}`);
    return { accepted: 0, total: rows.length };
  }

  const accepted = json?.accepted ?? json?.inserted ?? json?.rows ?? rows.length;
  console.log(`    ✓ ${accepted}/${rows.length} rows accepted`);
  return { accepted, total: rows.length };
}

// ─── Browser Helpers ──────────────────────────────────────────────────────────

async function injectAuthAndNavigate(context, appUrl, hash, token, user, clubId) {
  const page = await context.newPage();

  // addInitScript fires BEFORE React mounts — localStorage is populated on first render
  await page.addInitScript(({ token, user, clubId }) => {
    localStorage.setItem('swoop_auth_token', token);
    localStorage.setItem('swoop_auth_user', JSON.stringify(user));
    localStorage.setItem('swoop_club_id', clubId);
  }, { token, user, clubId });

  await page.goto(`${appUrl}${hash}`, { waitUntil: 'networkidle', timeout: 30_000 });
  return page;
}

async function captureScreenshot(page, outputPath, waitMs = 3000) {
  // Scroll to bottom to trigger lazy-loaded content, then back to top
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 100);
    });
  });

  // Wait for animations + data to settle
  await page.waitForTimeout(waitMs);
  await page.screenshot({ path: outputPath, fullPage: true });
  console.log(`  📸 ${path.basename(outputPath)}`);
  return outputPath;
}

// ─── Gemini Critique Helpers ──────────────────────────────────────────────────

async function critiqueWithAgent(genAI, screenshotPath, agent, pageContext) {
  const imageBuffer = fs.readFileSync(screenshotPath);
  const base64Image = imageBuffer.toString('base64');

  const model = genAI.getGenerativeModel({
    model: FLASH_MODEL,
    systemInstruction: agent.systemPrompt,
    generationConfig: THINKING_CONFIG,
  });

  const userPrompt = `You are reviewing the **${pageContext.routeLabel}** screen of the Swoop Member Portal app.

**DATA STATE:** ${pageContext.dataState}
**STAGE:** ${pageContext.stageLabel}
**APP URL:** ${APP_URL}

Swoop Club Intelligence is an AI-powered member intelligence platform for private golf and country clubs.
It turns member, tee-sheet, POS, and communication data into actionable retention and revenue insights.

${agent.userPromptSuffix}

Be specific — cite exact visible elements, numbers, labels, and layout patterns.
Do not speculate about elements not visible in the screenshot.`;

  const text = await geminiWithRetry(async () => {
    const result = await model.generateContent([
      { inlineData: { mimeType: 'image/png', data: base64Image } },
      userPrompt,
    ]);
    return result.response.text();
  });

  const score = extractScore(text);

  return {
    agentId: agent.id,
    agentName: agent.name,
    slug: pageContext.slug,
    routeLabel: pageContext.routeLabel,
    content: text,
    score,
  };
}

async function runAgentCritiques(genAI, screenshotPath, pageContext, critiquesDir) {
  console.log(`\n  🤖 Running 5 agents on ${pageContext.slug}…`);

  // Fan out all 5 agents in parallel for this screenshot
  const tasks = AGENTS.map(agent =>
    critiqueWithAgent(genAI, screenshotPath, agent, pageContext)
      .catch(err => {
        console.error(`    ✗ ${agent.name} failed: ${err.message}`);
        return {
          agentId: agent.id, agentName: agent.name,
          slug: pageContext.slug, routeLabel: pageContext.routeLabel,
          content: `# ${agent.name} — ERROR\n\nFailed after retries: ${err.message}`,
          score: null,
        };
      })
  );

  const results = await Promise.all(tasks);

  // Write one markdown file per agent
  for (const r of results) {
    const filename = `${r.slug}__${r.agentId}.md`;
    const content = `# ${r.agentName} — ${r.routeLabel}

**Screenshot:** ${path.basename(screenshotPath)}
**Stage:** ${pageContext.stageLabel}
**Agent:** ${r.agentName}
**Critique Model:** ${FLASH_MODEL}
**Generated:** ${new Date().toISOString()}

---

${r.content}
`;
    writeFileSafe(path.join(critiquesDir, filename), content);
    const scoreStr = r.score !== null ? `${r.score}/100` : 'N/A';
    console.log(`    ${r.agentName}: ${scoreStr}`);
  }

  await sleep(1000); // brief pacing after each screenshot's fan-out
  return results;
}

async function generateRecommendations(genAI, screenshotPath, critiques, pageContext, recsDir) {
  console.log(`  🎯 Generating recommendations for ${pageContext.slug}…`);

  const imageBuffer = fs.readFileSync(screenshotPath);
  const base64Image = imageBuffer.toString('base64');

  const critiquesBlock = critiques
    .map(c => `### ${c.agentName}\n\n${c.content}`)
    .join('\n\n---\n\n');

  const model = genAI.getGenerativeModel({ model: RECS_MODEL, generationConfig: THINKING_CONFIG });

  const prompt = `You are a senior product manager and UX strategist working on the Swoop Member Portal
— an AI-powered member intelligence platform for private golf clubs, sold at $18,000/year.

Tech stack: Vite + React 18, Tailwind CSS, Vercel, Postgres via Neon.

## Page Under Review: ${pageContext.routeLabel}
Stage: ${pageContext.stageLabel}
Data State: ${pageContext.dataState}

## Critiques from 5 Specialist Agents

${critiquesBlock}

---

## Your Task

Produce a prioritized set of improvements for this specific screenshot/stage that would raise
all 5 agent scores. Structure output as:

# ${pageContext.routeLabel} (${pageContext.stageLabel}) — Recommendations

## Score Summary
| Agent | Current Score | Key Finding |
|-------|--------------|-------------|
| Functionality Tester | X/100 | ... |
| GM (Club Operator) | X/100 | ... |
| Design Critic | X/100 | ... |
| UX Evaluator | X/100 | ... |
| Data Validator | X/100 | ... |
| **Composite** | **X/100** | |

## P1 — Critical (fix before any sales demo)
[Each item: what to change, what agent(s) it fixes, effort estimate]

## P2 — High (fix within sprint)
[Same format]

## P3 — Medium (roadmap candidates)
[Same format]

## Projected Score After P1 Fixes
One sentence estimate of composite improvement if P1 items are fixed.

Rules:
- Every recommendation must cite a specific finding from one of the 5 critiques.
- Be specific: reference visible elements, not generic UX principles.
- Under 500 words total.`;

  const text = await geminiWithRetry(async () => {
    const result = await model.generateContent([
      { inlineData: { mimeType: 'image/png', data: base64Image } },
      prompt,
    ]);
    return result.response.text();
  });

  const filename = `${pageContext.slug}__recommendations.md`;
  const content = `# Recommendations — ${pageContext.routeLabel}

**Stage:** ${pageContext.stageLabel}
**Model:** ${RECS_MODEL}
**Generated:** ${new Date().toISOString()}

---

${text}
`;
  writeFileSafe(path.join(recsDir, filename), content);
  return text;
}

async function generateMasterReport(genAI, allResults, scores, outputDir) {
  console.log('\n📊 Generating master report…');

  // Build score matrix text for the prompt
  const rows = Object.entries(scores.scores).map(([slug, s]) => {
    const agents = ['functionality', 'gm', 'design', 'ux', 'data-validator'];
    const cols = agents.map(a => s[a] ?? 'N/A').join(' | ');
    return `| ${slug} | ${s.stage} | ${s.page} | ${cols} | **${s.composite ?? 'N/A'}** |`;
  });

  const matrixText = [
    '| Screenshot | Stage | Page | Functionality | GM | Design | UX | Data Validator | Composite |',
    '|------------|-------|------|--------------|-----|--------|----|---------------|-----------|',
    ...rows,
  ].join('\n');

  // Aggregate per-agent averages
  const agentIds = ['functionality', 'gm', 'design', 'ux', 'data-validator'];
  const agentAverages = {};
  for (const id of agentIds) {
    const vals = Object.values(scores.scores).map(s => s[id]).filter(v => typeof v === 'number');
    agentAverages[id] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  }

  // Summarize all critiques for input context (truncated to keep token count manageable)
  const critiqueSummary = allResults.map(r =>
    `[${r.routeLabel} | ${r.agentName}] Score: ${r.score ?? 'N/A'}\n${r.content.slice(0, 400)}…`
  ).join('\n\n---\n\n');

  const model = genAI.getGenerativeModel({ model: PRO_MODEL, generationConfig: THINKING_CONFIG });

  const prompt = `You are a senior product consultant and UX strategist who has just reviewed all 75 Gemini critiques of
the Swoop Member Portal app — 15 screenshots × 5 specialist agents.

App: Swoop Club Intelligence | Private golf club management SaaS | $18,000/year
Run date: ${scores.run} | Club ID: ${scores.club_id}

## Score Matrix
${matrixText}

## Agent Averages
- Functionality Tester: ${agentAverages.functionality ?? 'N/A'}/100
- GM (Club Operator): ${agentAverages.gm ?? 'N/A'}/100
- Design Critic: ${agentAverages.design ?? 'N/A'}/100
- UX Evaluator: ${agentAverages.ux ?? 'N/A'}/100
- Data Validator: ${agentAverages['data-validator'] ?? 'N/A'}/100

## Critique Summaries (truncated)
${critiqueSummary.slice(0, 25000)}

---

## Your Task

Produce the MASTER_REPORT.md using EXACTLY this structure:

# Swoop App Vision Critique — Master Report
**Run:** ${scores.run}  **Club:** ${scores.club_id}  **App:** ${scores.app_url}

## Executive Summary
3–5 sentences: overall product quality, the single most critical issue, and the biggest win.

## Score Matrix
[reproduce the matrix above]

## Per-Stage Summary

### Stage 0 — Empty State
[2–3 sentences on what worked and what was broken in empty states across all 3 screenshots]

### Stage 1 — Members Imported
[2–3 sentences]

### Stage 2 — Members + POS
[2–3 sentences]

### Stage 3 — Members + POS + Tee Sheet
[2–3 sentences]

### Stage 4 — Full Data
[2–3 sentences]

## Priority Recommendations

### P1 — Critical (fix before any sales demo)
[List 3–5 specific issues with: affected screenshot, which agents flagged it, recommended fix]

### P2 — High (fix within sprint)
[List 3–5 items same format]

### P3 — Medium (roadmap candidates)
[List 3–5 items same format]

## Agent Perspective Summary

### Functionality Tester (avg: ${agentAverages.functionality ?? 'N/A'}/100)
[1 paragraph: most consistent functional issues found across all stages]

### GM Club Operator (avg: ${agentAverages.gm ?? 'N/A'}/100)
[1 paragraph: GM's overall verdict and the strongest/weakest screens]

### Design Critic (avg: ${agentAverages.design ?? 'N/A'}/100)
[1 paragraph: design quality trajectory across stages]

### UX Evaluator (avg: ${agentAverages.ux ?? 'N/A'}/100)
[1 paragraph: usability patterns and the most confusing screens]

### Data Validator (avg: ${agentAverages['data-validator'] ?? 'N/A'}/100)
[1 paragraph: data accuracy, suspicious metrics, and empty state correctness]

---
*Generated by Swoop App Vision Critique | Model: ${PRO_MODEL} | ${new Date().toISOString()}*

Rules:
- Be specific. Reference screenshot slugs and agent names as evidence.
- P1 items must be actionable with a clear fix.
- Under 1200 words total.`;

  const text = await geminiWithRetry(async () => {
    const result = await model.generateContent(prompt);
    return result.response.text();
  });

  const outPath = path.join(outputDir, 'MASTER_REPORT.md');
  writeFileSafe(outPath, text);
  return text;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🏌️  Swoop App Vision Critique');
  console.log(`    App URL:  ${APP_URL}`);

  // Validate env
  if (!API_KEY) {
    console.error('❌  GEMINI_API_KEY is required. Set it as an environment variable.');
    process.exit(1);
  }
  if (APP_URL === 'http://localhost:3000') {
    console.warn('⚠   Using localhost — ensure `vercel dev` is running with a live DB.');
  }

  // Create timestamped output directory
  const ts = makeTimestamp();
  const outputDir = path.join(OUTPUT_BASE, `app-critique-${ts}`);
  const screenshotsDir = path.join(outputDir, 'screenshots');
  const critiquesDir   = path.join(outputDir, 'critiques');
  const recsDir        = path.join(outputDir, 'recommendations');

  await ensureDir(outputDir);
  await ensureDir(screenshotsDir);
  await ensureDir(critiquesDir);
  await ensureDir(recsDir);

  console.log(`\n📁 Output: ${outputDir}`);

  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(API_KEY);

  // ── Create club + login ────────────────────────────────────────────────────
  console.log('\n🏗  Creating club…');
  const { clubId, email, password } = await createClub(APP_URL);
  const { token, user } = await login(APP_URL, email, password);
  const authHeaders = { Authorization: `Bearer ${token}` };

  // ── Open Playwright browser ───────────────────────────────────────────────
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });

  // Scores accumulator
  const scores = {
    run: ts,
    club_id: clubId,
    app_url: APP_URL,
    scores: {},
  };

  const allResults = []; // all critique objects across all stages

  try {
    // ── Main loop: stage → import → screenshots → critiques ─────────────────
    for (const stage of STAGES) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`📦 ${stage.label}`);

      // Import CSVs for this stage (sequential — FK ordering matters)
      for (const imp of stage.imports) {
        const csvPath = path.join(FIXTURE_DIR, imp.file);
        if (!fs.existsSync(csvPath)) {
          console.warn(`  ⚠ Fixture not found: ${csvPath} — skipping`);
          continue;
        }
        await importCSV(APP_URL, token, imp.type, csvPath, imp.expectedRows);
        await sleep(2000); // let the DB settle between imports
      }

      // Screenshot + critique each page for this stage
      for (const shot of stage.screenshots) {
        console.log(`\n  📄 ${shot.label}`);

        // Navigate + screenshot
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
        } catch (err) {
          console.error(`  ✗ Screenshot failed for ${shot.slug}: ${err.message}`);
          await page.close().catch(() => {});
          continue;
        }
        await page.close().catch(() => {});

        const pageContext = {
          slug: shot.slug,
          routeLabel: shot.label,
          stageLabel: stage.label,
          dataState: stage.dataState,
        };

        // Run 5 agent critiques (parallel fan-out)
        const critiques = await runAgentCritiques(genAI, screenshotPath, pageContext, critiquesDir);
        allResults.push(...critiques);

        // Generate recommendations
        await generateRecommendations(genAI, screenshotPath, critiques, pageContext, recsDir)
          .catch(err => console.warn(`  ⚠ Recommendations failed for ${shot.slug}: ${err.message}`));

        // Record scores
        const agentScores = {};
        for (const c of critiques) {
          agentScores[c.agentId] = c.score;
        }
        scores.scores[shot.slug] = {
          stage: stage.id,
          page: shot.label,
          ...agentScores,
          composite: compositeScore(agentScores),
        };

        // Write scores.json after each screenshot (so partial results survive crashes)
        writeFileSafe(path.join(outputDir, 'scores.json'), JSON.stringify(scores, null, 2));

        await sleep(2000); // pacing between screenshots
      }
    }

    // ── Generate master report ───────────────────────────────────────────────
    await generateMasterReport(genAI, allResults, scores, outputDir)
      .catch(err => console.error(`  ✗ Master report failed: ${err.message}`));

  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }

  // ── Print summary table ───────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('📊 FINAL SCORES');
  console.log('═'.repeat(60));
  console.log(
    'Screenshot'.padEnd(22) +
    'Func'.padStart(5) + ' GM'.padStart(5) + ' Des'.padStart(5) +
    ' UX'.padStart(5) + ' Data'.padStart(6) + ' AVG'.padStart(6)
  );
  console.log('─'.repeat(60));
  for (const [slug, s] of Object.entries(scores.scores)) {
    const fmt = v => (v !== null && v !== undefined ? String(v).padStart(5) : '  N/A');
    console.log(
      slug.padEnd(22) +
      fmt(s.functionality) + fmt(s.gm) + fmt(s.design) +
      fmt(s.ux) + fmt(s['data-validator']).padStart(6) + fmt(s.composite).padStart(6)
    );
  }
  console.log('═'.repeat(60));
  console.log(`\n✅ Output: ${outputDir}`);
  console.log(`   Screenshots: ${Object.keys(scores.scores).length} captured`);
  console.log(`   Critiques:   ${allResults.length} written`);
  console.log(`   MASTER_REPORT.md generated`);
  console.log('\nRun complete.\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message || err);
  process.exit(1);
});
