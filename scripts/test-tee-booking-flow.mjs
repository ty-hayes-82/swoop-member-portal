#!/usr/bin/env node
/**
 * test-tee-booking-flow.mjs
 *
 * Verifies the two-phase tee time booking flow:
 *   Phase 1 — initial request → agent must call check_tee_availability,
 *              must NOT call book_tee_time, response must present options
 *   Phase 2 — follow-up pick → agent must call book_tee_time, response confirms
 *
 * Usage:
 *   APP_URL=https://swoop-member-portal-dev.vercel.app node scripts/test-tee-booking-flow.mjs
 *   APP_URL=http://localhost:3000 node scripts/test-tee-booking-flow.mjs
 */

const APP_URL  = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const CLUB_ID  = 'seed_pinetree';
const MEMBER   = 'mbr_t01'; // James Whitfield

// ─── ANSI colours ─────────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
};
const pass  = `${C.green}${C.bold}PASS${C.reset}`;
const fail  = `${C.red}${C.bold}FAIL${C.reset}`;
const warn  = `${C.yellow}${C.bold}WARN${C.reset}`;

// ─── Phase 1 variations ───────────────────────────────────────────────────────
// Every message here is a fresh tee time booking intent.
// Assertion: check_tee_availability fired, book_tee_time NOT fired.

const PHASE_1_CASES = [
  { msg: 'Book my usual Saturday 7 AM',                   label: 'usual Saturday phrasing' },
  { msg: 'Saturday 7am please',                           label: 'day + time shorthand' },
  { msg: 'Get me on the course Saturday morning',         label: 'no explicit time' },
  { msg: 'My usual Thursday morning slot',                label: 'day + time of day only' },
  { msg: 'Can you book me for this Saturday at 7?',       label: '"this" + day + time' },
  { msg: 'I need a tee time Saturday around 7',           label: '"around" time expression' },
  { msg: 'Put me down for Saturday 7am with my foursome', label: 'party size + time' },
  { msg: 'Book golf for Friday, the usual time',          label: 'Friday, inferred time' },
  { msg: 'Book me and my son in for Saturday morning',    label: 'multi-person + no exact time' },
  { msg: "I'd like a tee time tomorrow at 7",             label: 'tomorrow + time' },
];

// ─── Phase 2 follow-up case ───────────────────────────────────────────────────
// After the agent presents options, sending a pick should trigger book_tee_time.

const PHASE_2_FOLLOW_UPS = [
  '7am',
  'The first one',
  '7:00 works',
  'Go with 7:00',
  'The 7am slot',
];

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function chat(memberId, message) {
  const res = await fetch(`${APP_URL}/api/concierge/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Demo-Club': CLUB_ID,
    },
    body: JSON.stringify({ member_id: memberId, message, debug: true }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

function toolNames(data) {
  return (data.tool_calls || []).map(t => t.tool_name);
}

// ─── Assertions ───────────────────────────────────────────────────────────────

function assertToolCalled(tools, name) {
  return tools.includes(name);
}

function assertToolNotCalled(tools, name) {
  return !tools.includes(name);
}

// Response presents time options: contains 2+ HH:MM patterns or "works?" / "which"
function assertPresentsOptions(response) {
  const times = (response.match(/\b\d{1,2}:\d{2}\b/g) || []);
  const hasQuestion = /which|works\?|prefer|pick|want/i.test(response);
  return times.length >= 2 || (times.length >= 1 && hasQuestion);
}

// Response does not look like a completed booking confirmation
function assertNotBookingConfirmation(response) {
  return !/sent.*(tee|pro shop|north|south|confirm)|request.*submit|pro shop.*confirm/i.test(response);
}

// Response looks like a booking was confirmed
function assertBookingConfirmed(response) {
  return /sent|pro shop|confirm|request|submit/i.test(response);
}

// ─── Runner ───────────────────────────────────────────────────────────────────

let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;
const failures = [];

function record(label, passed, detail = '') {
  totalTests++;
  if (passed) {
    totalPassed++;
    console.log(`  ${pass} ${label}`);
  } else {
    totalFailed++;
    const msg = `  ${fail} ${label}${detail ? `\n       ${C.gray}${detail}${C.reset}` : ''}`;
    console.log(msg);
    failures.push({ label, detail });
  }
}

async function runPhase1(variant, index) {
  const label = `[${String(index + 1).padStart(2, '0')}] ${variant.label}`;
  console.log(`\n${C.cyan}${C.bold}${label}${C.reset}`);
  console.log(`  ${C.dim}→ "${variant.msg}"${C.reset}`);

  let data;
  try {
    data = await chat(MEMBER, variant.msg);
  } catch (err) {
    record(`${label} — API call`, false, err.message);
    return null;
  }

  const tools = toolNames(data);
  const response = data.response || '';

  console.log(`  ${C.dim}tools: [${tools.join(', ') || 'none'}]${C.reset}`);
  console.log(`  ${C.dim}response: "${response.slice(0, 100)}${response.length > 100 ? '…' : ''}"${C.reset}`);

  // Core gate: must check availability first
  record(
    'check_tee_availability called',
    assertToolCalled(tools, 'check_tee_availability'),
    tools.length === 0 ? 'no tools fired — simulated or error?' : `tools fired: [${tools.join(', ')}]`,
  );

  // Core gate: must NOT book yet
  record(
    'book_tee_time NOT called on initial request',
    assertToolNotCalled(tools, 'book_tee_time'),
    `book_tee_time appeared in [${tools.join(', ')}]`,
  );

  // Quality: response should present options
  record(
    'response presents time options',
    assertPresentsOptions(response),
    `response: "${response.slice(0, 120)}"`,
  );

  // Quality: response should not sound like a completed booking
  record(
    'response does not confirm a booking yet',
    assertNotBookingConfirmation(response),
    `response: "${response.slice(0, 120)}"`,
  );

  return data;
}

async function runPhase2(followUp, priorResponse) {
  console.log(`\n${C.cyan}${C.bold}PHASE 2 — Follow-up pick${C.reset}`);
  console.log(`  ${C.dim}prior options: "${(priorResponse || '').slice(0, 80)}…"${C.reset}`);
  console.log(`  ${C.dim}→ member picks: "${followUp}"${C.reset}`);

  let data;
  try {
    data = await chat(MEMBER, followUp);
  } catch (err) {
    record('Phase 2 API call', false, err.message);
    return;
  }

  const tools = toolNames(data);
  const response = data.response || '';

  console.log(`  ${C.dim}tools: [${tools.join(', ') || 'none'}]${C.reset}`);
  console.log(`  ${C.dim}response: "${response.slice(0, 100)}${response.length > 100 ? '…' : ''}"${C.reset}`);

  record(
    'book_tee_time called after member picks',
    assertToolCalled(tools, 'book_tee_time'),
    `tools fired: [${tools.join(', ')}]`,
  );

  record(
    'check_tee_availability NOT re-called on follow-up',
    assertToolNotCalled(tools, 'check_tee_availability'),
    `tools fired: [${tools.join(', ')}]`,
  );

  record(
    'response confirms booking sent to pro shop',
    assertBookingConfirmed(response),
    `response: "${response.slice(0, 120)}"`,
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log(`\n${C.bold}Tee Time Booking Flow Tests${C.reset}`);
console.log(`${C.dim}Target: ${APP_URL}${C.reset}`);
console.log(`${C.dim}Member: ${MEMBER} (James Whitfield)${C.reset}`);
console.log(`${C.dim}${'─'.repeat(56)}${C.reset}`);

console.log(`\n${C.bold}── PHASE 1: Initial Booking Requests ──${C.reset}`);
console.log(`${C.dim}Assert: check_tee_availability fired, book_tee_time NOT fired${C.reset}`);

let firstPhase1Response = null;

for (let i = 0; i < PHASE_1_CASES.length; i++) {
  const result = await runPhase1(PHASE_1_CASES[i], i);
  if (result && !firstPhase1Response) {
    firstPhase1Response = result.response;
  }
  // Small delay between calls to avoid rate limits
  if (i < PHASE_1_CASES.length - 1) await new Promise(r => setTimeout(r, 800));
}

console.log(`\n${C.bold}── PHASE 2: Follow-up Picks ──${C.reset}`);
console.log(`${C.dim}Assert: book_tee_time fired, confirmation returned${C.reset}`);

// Run all follow-up variations
for (let i = 0; i < PHASE_2_FOLLOW_UPS.length; i++) {
  await new Promise(r => setTimeout(r, 800));
  await runPhase2(PHASE_2_FOLLOW_UPS[i], firstPhase1Response);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

const divider = '─'.repeat(56);
console.log(`\n${C.bold}${divider}${C.reset}`);
console.log(`${C.bold}Results: ${totalPassed}/${totalTests} passed${C.reset}`);

if (totalFailed === 0) {
  console.log(`${C.green}${C.bold}All tests passed.${C.reset}\n`);
  process.exit(0);
} else {
  console.log(`${C.red}${C.bold}${totalFailed} test(s) failed:${C.reset}`);
  failures.forEach(f => {
    console.log(`  ${C.red}✗${C.reset} ${f.label}`);
    if (f.detail) console.log(`    ${C.gray}${f.detail}${C.reset}`);
  });
  console.log();
  process.exit(1);
}
