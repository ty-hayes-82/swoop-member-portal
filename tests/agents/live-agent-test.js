#!/usr/bin/env node
/**
 * Live Agent Integration Test Harness
 *
 * Exercises 4 managed agents (Member Risk, Service Recovery, Concierge, Game Plan)
 * against real Claude API using the system prompts and seed data.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node tests/agents/live-agent-test.js
 *
 * Or if .env.local is present in the project root, the script loads it automatically.
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Bootstrap: load .env.local if ANTHROPIC_API_KEY is not already set
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');

function loadEnv() {
  try {
    const raw = readFileSync(resolve(ROOT, '.env.local'), 'utf-8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq);
      let val = trimmed.slice(eq + 1);
      // strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* no .env.local — rely on shell env */ }
}
loadEnv();

// ---------------------------------------------------------------------------
// Anthropic client
// ---------------------------------------------------------------------------
const client = new Anthropic();

// ---------------------------------------------------------------------------
// Seed data (inlined from src/data/members.js to avoid ESM/import-alias issues)
// ---------------------------------------------------------------------------
const WHITFIELD = {
  memberId: 'mbr_t01',
  name: 'James Whitfield',
  score: 42,
  trend: 'declining',
  archetype: 'Balanced Active',
  duesAnnual: 18000,
  topRisk: 'Unresolved complaint Jan 16 — 42-min Grill Room wait, felt ignored. $18K dues at risk',
  roundsTrend: [
    { month: 'Oct', rounds: 4 },
    { month: 'Nov', rounds: 3 },
    { month: 'Dec', rounds: 2 },
    { month: 'Jan', rounds: 1 },
  ],
  complaint: {
    date: '2026-01-16',
    category: 'F&B',
    description: '42-minute wait at Grill Room for a lunch table. Felt ignored by hostess. Server never apologized. Left without eating.',
    status: 'Acknowledged',
    severity: 'high',
  },
};

const JORDAN = {
  memberId: 'mbr_t04',
  name: 'Anne Jordan',
  score: 28,
  trend: 'declining',
  archetype: 'Weekend Warrior',
  duesAnnual: 12000,
  topRisk: 'Missed 3 Saturday waitlists, walked off Jan 7 after slow pace — zero rounds since. 10-year member',
  preferences: {
    preferredTeeTime: 'Saturday 7:00 AM',
    playStyle: 'early morning, fast pace',
    favoriteHole: 14,
  },
  join_date: '2016-03-15',
  membership_type: 'Full Golf',
  household: [{ name: 'Mark Jordan' }],
};

// ---------------------------------------------------------------------------
// System Prompts (copied from src/config/*.js to keep this self-contained)
// ---------------------------------------------------------------------------

const MEMBER_RISK_PROMPT = `You are the Member Risk Lifecycle agent for a private golf and country club.

When a member's health score drops below 50, you own their recovery lifecycle:
1. Diagnose WHY (which signals declined: golf, dining, email, events, complaints?)
2. Propose an archetype-appropriate intervention for GM approval
3. Monitor whether the GM acted and whether the member responded
4. Follow up at Day 7, Day 14, and Day 30
5. Measure the outcome and record it

Rules:
- You never act without GM approval. Every action has status "pending."
- You always cite specific data: dues amount, health score, days since last visit, which signal declined, complaint history.
- You write in the voice of a trusted senior advisor: direct, confident, brief.
- Prioritize by: annual dues x time sensitivity x archetype risk factor.
- Maximum 2 proposed actions per wake cycle. Quality over quantity.`;

const SERVICE_RECOVERY_PROMPT = `You are the Service Recovery agent for a private golf and country club.

When a high-value member files a serious complaint, you own the resolution lifecycle:
1. Immediately route the complaint to the relevant department head with full member context
2. Alert the GM within 2 hours with a call recommendation and talking points
3. Monitor complaint resolution status
4. If unresolved after 48 hours, escalate with increased urgency
5. After resolution, schedule a Day 7 satisfaction check-in
6. Record the outcome

Rules:
- Complaint age is critical. Every hour matters for high-value members.
- You always include the member's annual dues and tenure in your rationale.
- When the complaint is F&B-related, assign to F&B Director.
- You never draft apology messages that admit fault. Focus on acknowledgment, care, and a concrete next step.`;

const GAME_PLAN_PROMPT = `You are the Morning Game Plan agent for a private golf and country club.

Every morning, you produce a single, prioritized briefing for the GM that answers:
"Where is today most likely to break, and what should I do about it?"

Each action item must include:
- A one-sentence headline
- A 2-3 sentence rationale citing specific cross-domain signals
- An impact estimate in dollars or member-risk terms
- An assigned owner (role, not name)

Rules:
- Maximum 5 action items. Prioritize by dollars at risk.
- Connect dots across domains: tee sheet, weather, staffing, F&B, member risk.
- Tone is calm, authoritative, prepared.
- Always end with a one-sentence "Bottom line" summary.`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TIMEOUT_MS = 60_000; // 60s per test (Claude can be slow)

async function callAgent(systemPrompt, userMessage, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const resp = await client.messages.create(
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      },
      { signal: controller.signal },
    );
    clearTimeout(timer);
    const text = resp.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n');
    return { ok: true, text, usage: resp.usage };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, text: '', error: err.message || String(err) };
  }
}

function check(text, pattern, label) {
  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');
  const pass = regex.test(text);
  return { label, pass };
}

function printResult(testName, result, checks) {
  const divider = '='.repeat(70);
  console.log(`\n${divider}`);
  console.log(`TEST: ${testName}`);
  console.log(divider);

  if (!result.ok) {
    console.log(`STATUS: ERROR`);
    console.log(`Error: ${result.error}`);
    return { name: testName, pass: false, checks: [] };
  }

  console.log(`\n--- Agent Response ---\n${result.text}\n`);
  if (result.usage) {
    console.log(`[tokens] input=${result.usage.input_tokens} output=${result.usage.output_tokens}`);
  }

  const results = checks.map((c) => {
    const r = check(result.text, c.pattern, c.label);
    console.log(`  ${r.pass ? 'PASS' : 'FAIL'} — ${r.label}`);
    return r;
  });

  const allPass = results.every((r) => r.pass);
  console.log(`\nVERDICT: ${allPass ? 'PASS' : 'FAIL'}`);
  return { name: testName, pass: allPass, checks: results };
}

// ---------------------------------------------------------------------------
// Test 1 — Member Risk Lifecycle (James Whitfield)
// ---------------------------------------------------------------------------
async function testMemberRisk() {
  const userMessage = `A member's health score just dropped below 50. Here is the member profile:

Member ID: ${WHITFIELD.memberId}
Name: ${WHITFIELD.name}
Health Score: ${WHITFIELD.score} (trend: ${WHITFIELD.trend})
Archetype: ${WHITFIELD.archetype}
Annual Dues: $${WHITFIELD.duesAnnual.toLocaleString()}
Rounds Trend: ${WHITFIELD.roundsTrend.map((r) => `${r.month}: ${r.rounds}`).join(', ')}
Open Complaint: ${WHITFIELD.complaint.date} — ${WHITFIELD.complaint.description} (Status: ${WHITFIELD.complaint.status}, Severity: ${WHITFIELD.complaint.severity})

Run Step 1 — Diagnose and propose an intervention.`;

  const result = await callAgent(MEMBER_RISK_PROMPT, userMessage, 'Member Risk');
  return printResult('Member Risk Lifecycle — James Whitfield', result, [
    { pattern: /42.?min/i, label: 'Mentions 42-minute complaint wait' },
    { pattern: /\$?18[,.]?000|\$18K/i, label: 'Mentions $18K dues' },
    { pattern: /call|phone|reach out|personal/i, label: 'Proposes GM call or personal outreach' },
  ]);
}

// ---------------------------------------------------------------------------
// Test 2 — Service Recovery (Whitfield complaint)
// ---------------------------------------------------------------------------
async function testServiceRecovery() {
  const userMessage = `New high-priority complaint received:

Member: ${WHITFIELD.name} (${WHITFIELD.memberId})
Annual Dues: $${WHITFIELD.duesAnnual.toLocaleString()}
Health Score: ${WHITFIELD.score}
Tenure: 3 years
Archetype: ${WHITFIELD.archetype}

Complaint Filed: ${WHITFIELD.complaint.date}
Category: ${WHITFIELD.complaint.category}
Severity: ${WHITFIELD.complaint.severity}
Description: ${WHITFIELD.complaint.description}
Current Status: ${WHITFIELD.complaint.status}

No prior complaints in the last 90 days.

Execute Step 1 (Route to Department) and Step 2 (GM Alert).`;

  const result = await callAgent(SERVICE_RECOVERY_PROMPT, userMessage, 'Service Recovery');
  return printResult('Service Recovery — Whitfield Complaint', result, [
    { pattern: /F&B Director|F&B/i, label: 'Routes to F&B Director' },
    { pattern: /GM|General Manager/i, label: 'Includes GM alert recommendation' },
    { pattern: /\$?18[,.]?000|\$18K/i, label: 'Cites $18K dues' },
  ]);
}

// ---------------------------------------------------------------------------
// Test 3 — Member Concierge (Anne Jordan tee time)
// ---------------------------------------------------------------------------
async function testConcierge() {
  // Build prompt inline (mirrors buildConciergePrompt)
  const conciergeSystem = `You are ${JORDAN.name}'s personal concierge at Pinetree Country Club.

Your role is to make ${JORDAN.name.split(' ')[0]}'s club experience seamless and enjoyable. You are warm, helpful, and proactive.

## What You Can Do
- Book tee times
- Make dining reservations
- RSVP to club events
- Show their upcoming schedule

## Member Context
- Name: ${JORDAN.name}
- Membership: ${JORDAN.membership_type}
- Member since: ${JORDAN.join_date}
- Household members: ${JORDAN.household.map((h) => h.name).join(', ')}
- Known preferences: ${JSON.stringify(JORDAN.preferences)}

## Behavioural Guidelines
- Be warm and conversational, not robotic. Use the member's first name.
- Be proactive: "Would you like your usual Saturday 7 AM slot?" if you know their pattern.
- When a slot is unavailable, suggest the nearest alternative times.
- Always confirm details before finalizing a booking.

## Strict Privacy Rules
- NEVER reveal health scores, health tiers, risk classifications, or any internal analytics.`;

  const userMessage = `Can I book a tee time for Saturday morning?`;

  const result = await callAgent(conciergeSystem, userMessage, 'Concierge');
  return printResult('Member Concierge — Anne Jordan Tee Time', result, [
    { pattern: /7[: ]?00|7\s?AM|seven/i, label: 'Suggests preferred 7 AM slot' },
    { pattern: /Saturday/i, label: 'Mentions Saturday' },
    { pattern: /Anne/i, label: 'Uses first name' },
  ]);
}

// ---------------------------------------------------------------------------
// Test 4 — Tomorrow's Game Plan
// ---------------------------------------------------------------------------
async function testGamePlan() {
  const userMessage = `Today's data pull for Pinetree Country Club (2026-01-18):

TEE SHEET:
- 220 rounds booked (high volume — Saturday)
- Peak windows: 7-9 AM (92% full), 11 AM-1 PM (88% full)
- Notable: 3 at-risk members on the tee sheet today
  - James Whitfield (score 42, open complaint, $18K dues) — 10:30 AM
  - Robert Callahan (score 22, $18K dues) — 8:00 AM
  - Sandra Chen (score 36, $9K dues) — 11:15 AM

WEATHER:
- Morning: 62F, clear, light wind
- Afternoon: Wind advisory 2-5 PM, gusts to 35 mph
- Demand modifier: Expect 15% walk-off rate after 2 PM

STAFFING:
- Grill Room: 2 servers scheduled for lunch (normal is 3). Understaffed.
- Pro Shop: Full coverage
- Course maintenance: On schedule
- Starter: Covering alone (usual is 2 starters on Saturdays)

F&B:
- 45 lunch reservations (above average for Saturday)
- No private events
- Chef special: Prime rib (historically high demand)

MEMBER RISK:
- 3 at-risk members playing today (see tee sheet above)
- Whitfield has an unresolved F&B complaint from Jan 16 (42-min wait)
- Callahan hit exact F&B minimum last month; 9-day complaint unresolved
- 2 other open complaints in queue (lower priority)

Generate the Morning Game Plan.`;

  const result = await callAgent(GAME_PLAN_PROMPT, userMessage, 'Game Plan');
  return printResult("Tomorrow's Game Plan — Saturday Briefing", result, [
    { pattern: /Grill Room|server|understaffed|staffing/i, label: 'Addresses Grill Room understaffing' },
    { pattern: /wind|afternoon|walk.?off/i, label: 'References wind advisory / PM impact' },
    { pattern: /Whitfield|at.?risk|complaint/i, label: 'Flags at-risk members or complaints' },
    { pattern: /bottom line|summary/i, label: 'Includes bottom-line summary' },
  ]);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Live Agent Integration Test Harness');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Model: claude-sonnet-4-20250514`);
  console.log(`Timeout per test: ${TIMEOUT_MS / 1000}s`);
  console.log(`API key: ${process.env.ANTHROPIC_API_KEY ? '...redacted (set)' : 'MISSING'}`);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('\nERROR: ANTHROPIC_API_KEY not set. Pass via env or ensure .env.local exists.');
    process.exit(1);
  }

  const results = [];

  // Run tests sequentially to keep output readable
  results.push(await testMemberRisk());
  results.push(await testServiceRecovery());
  results.push(await testConcierge());
  results.push(await testGamePlan());

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  for (const r of results) {
    const icon = r.pass ? 'PASS' : 'FAIL';
    console.log(`  ${icon}  ${r.name}`);
    if (r.checks) {
      for (const c of r.checks) {
        console.log(`        ${c.pass ? 'PASS' : 'FAIL'}  ${c.label}`);
      }
    }
  }

  const allPass = results.every((r) => r.pass);
  console.log(`\nOverall: ${allPass ? 'ALL PASS' : 'SOME FAILURES'}`);
  process.exit(allPass ? 0 : 1);
}

main();
