#!/usr/bin/env node
/**
 * ab-test-concierge.mjs
 *
 * Side-by-side A/B naturalness comparison for two concierge variants.
 * Runs the 6 clarify-vs-act gate probe messages against two app endpoints,
 * scores both sets with the conversational_naturalness agent, and prints
 * a side-by-side comparison with a final winner summary.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=<key> \
 *   APP_URL_A=http://localhost:3000 \
 *   APP_URL_B=http://localhost:3001 \
 *   LABEL_A="Baseline" \
 *   LABEL_B="New Prompt" \
 *   node scripts/ab-test-concierge.mjs
 */

import Anthropic from '@anthropic-ai/sdk';
import { anthropicWithRetry } from './lib/infra.mjs';

// ─── Config ───────────────────────────────────────────────────────────────────

const APP_URL_A  = (process.env.APP_URL_A || 'http://localhost:3000').replace(/\/$/, '');
const APP_URL_B  = (process.env.APP_URL_B || 'http://localhost:3001').replace(/\/$/, '');
const LABEL_A    = process.env.LABEL_A || 'Variant A';
const LABEL_B    = process.env.LABEL_B || 'Variant B';
const API_KEY    = process.env.ANTHROPIC_API_KEY;
const MODEL      = 'claude-opus-4-6';
const CLUB_HEADER = 'seed_pinetree';

if (!API_KEY) {
  console.error('\n✗ ANTHROPIC_API_KEY not set.\n');
  process.exit(1);
}

// ─── ANSI colors ──────────────────────────────────────────────────────────────

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  yellow: '\x1b[33m',
  white:  '\x1b[37m',
};

// ─── Member map ───────────────────────────────────────────────────────────────

const MEMBERS = {
  0: { id: 'mbr_t01', name: 'James' },
  1: { id: 'mbr_t04', name: 'Anne' },
  2: { id: 'mbr_t05', name: 'Robert' },
  3: { id: 'mbr_t06', name: 'Sandra' },
  4: { id: 'mbr_t07', name: 'Linda' },
};

// ─── Gate probe test cases ────────────────────────────────────────────────────

const GATE_PROBES = [
  { personaIdx: 0, message: 'My lunch was really slow',                                          expectedTool: null,                     note: 'complaint gate: vague — must ask for details (location + how long), NOT file_complaint' },
  { personaIdx: 0, message: 'Make a dinner reservation',                                         expectedTool: null,                     note: 'dining gate: no date — must ask for date + party size, NOT make_dining_reservation' },
  { personaIdx: 0, message: 'The food at the Grill was cold and wrong — we waited 40 minutes',   expectedTool: 'file_complaint',         note: 'complaint gate: specific — location+incident present, must file immediately' },
  { personaIdx: 2, message: 'Book dinner for my anniversary on Saturday, 7pm for two',            expectedTool: 'make_dining_reservation', note: 'dining gate: full details — must book immediately, not ask' },
  { personaIdx: 3, message: 'Are there any social events for singles?',                           expectedTool: 'get_club_calendar',      note: 'calendar query: must check calendar and return results concisely, not verbose explanation' },
  { personaIdx: 1, message: 'Yes',                                                                expectedTool: 'make_dining_reservation', note: 'affirmative follow-up: must act on last offer (assumes prior dining offer was made), not re-ask' },
];

// ─── Scoring agent prompt ─────────────────────────────────────────────────────

const SCORING_PROMPT = `You are a conversation quality reviewer evaluating an AI concierge for a private country club. Your job is to assess whether each response feels like a natural, well-calibrated text from a smart friend who works at the club — not a chatbot running a script.

The PRIMARY question for every response: does this feel right? Does the length, tone, and content match what a member actually needed in that moment?

KEY RULES being enforced (penalize violations):
1. RESPONSE FIT: The response should address exactly what was asked. No more, no less. A calendar query gets events. A vague complaint gets a clarifying question. A booking with missing date gets a date question. Not: a complaint filed with invented details the member never gave.

2. FOLLOW-UP INTELLIGENCE (two-phase gates):
   - Vague complaint (no named location + no specific incident): acknowledge + ask ONE question. DO NOT file.
   - Dining reservation with no date: ask for date + party size. DO NOT book.
   - Tee time request: check availability first, present options, THEN book. DO NOT book directly.
   - Affirmative response ("Yes", "Sure", "The first one"): act on what was last offered. DO NOT re-ask.
   - Short slot pick ("7", "7am", "the second one"): book it. DO NOT re-ask.

3. BREVITY: 2 sentences is the target. 3 is the max. Penalize verbose patterns:
   - "I checked our calendar and I'm not seeing any specific events..."
   - "Let me check with the events team to see if they have anything planned and have them get back to you"
   - "In the meantime, would you like me to check..."
   - Responses that explain the process instead of stating the result

4. TONE: Natural, direct, warm. Penalize:
   - Banned openers: "Perfect", "Great", "Certainly", "Absolutely", "Of course"
   - Banned phrases: "I hear you", "you deserved so much better", "Since I know from your history", "Once you pick I'll send", reasoning preambles, hollow closers
   - Em-dashes (—) anywhere

5. FABRICATION: NEVER invent details. "My lunch was slow" — you know: lunch was slow. Filing a complaint with invented wait times or outlet names is a hard failure.

SCORING (1-10 per dimension):
- response_fit: Does the response content match what was actually asked? (10=perfectly calibrated, 1=completely misses the ask)
- followup_intelligence: Correct decision between ask vs act? (10=always right, 5=sometimes right, 1=always files/books without asking or always asks when it should act)
- brevity_fit: Is the response the right length? (10=always 2 sentences, tight and direct; 1=verbose walls of text with padding)
- tone_naturalness: Does it sound like a smart friend texting, not a bot? (10=completely natural, 1=robotic/scripted/banned phrases throughout)
- clarify_vs_act: Correct gate decisions across the full test set? (10=always correct, 1=always invents details or always blocks on clarification when unnecessary)

You are scoring TWO variants, labeled A and B. Score each independently.

Return ONLY valid JSON:
{
  "variant_a": {
    "scores": {
      "response_fit":          { "score": <1-10>, "evidence": "<quote>", "rationale": "<1 sentence>" },
      "followup_intelligence": { "score": <1-10>, "evidence": "<quote>", "rationale": "<1 sentence>" },
      "brevity_fit":           { "score": <1-10>, "evidence": "<quote>", "rationale": "<1 sentence>" },
      "tone_naturalness":      { "score": <1-10>, "evidence": "<quote>", "rationale": "<1 sentence>" },
      "clarify_vs_act":        { "score": <1-10>, "evidence": "<quote>", "rationale": "<1 sentence>" }
    },
    "top_issues": ["<issue with evidence>", "<issue>"],
    "top_strengths": ["<strength>", "<strength>"]
  },
  "variant_b": {
    "scores": {
      "response_fit":          { "score": <1-10>, "evidence": "<quote>", "rationale": "<1 sentence>" },
      "followup_intelligence": { "score": <1-10>, "evidence": "<quote>", "rationale": "<1 sentence>" },
      "brevity_fit":           { "score": <1-10>, "evidence": "<quote>", "rationale": "<1 sentence>" },
      "tone_naturalness":      { "score": <1-10>, "evidence": "<quote>", "rationale": "<1 sentence>" },
      "clarify_vs_act":        { "score": <1-10>, "evidence": "<quote>", "rationale": "<1 sentence>" }
    },
    "top_issues": ["<issue with evidence>", "<issue>"],
    "top_strengths": ["<strength>", "<strength>"]
  }
}`;

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function callConcierge(appUrl, memberId, message) {
  try {
    const res = await fetch(`${appUrl}/api/concierge/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Demo-Club': CLUB_HEADER },
      body: JSON.stringify({ member_id: memberId, message, debug: true }),
    });

    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = null; }

    if (!res.ok || !json) {
      return { response: null, tool_calls: [], error: `HTTP ${res.status}: ${text.slice(0, 120)}` };
    }

    return {
      response: json.response || null,
      tool_calls: json.tool_calls || [],
      error: json.error || null,
    };
  } catch (err) {
    return { response: null, tool_calls: [], error: err.message };
  }
}

// ─── JSON extraction ──────────────────────────────────────────────────────────

function parseJSON(raw) {
  try { return JSON.parse(raw.trim()); } catch {}
  const fence = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fence) { try { return JSON.parse(fence[1].trim()); } catch {} }
  const i = raw.indexOf('{'), j = raw.lastIndexOf('}');
  if (i !== -1 && j > i) { try { return JSON.parse(raw.slice(i, j + 1)); } catch {} }
  return null;
}

function avgScores(scores) {
  if (!scores || typeof scores !== 'object') return null;
  const vals = Object.values(scores)
    .map(d => (d && typeof d.score === 'number' ? d.score : null))
    .filter(v => v !== null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${C.bold}═══════════════════════════════════${C.reset}`);
  console.log(`${C.bold}  A/B Naturalness Comparison${C.reset}`);
  console.log(`${C.bold}═══════════════════════════════════${C.reset}\n`);
  console.log(`  ${C.cyan}${LABEL_A}${C.reset}  →  ${APP_URL_A}`);
  console.log(`  ${C.cyan}${LABEL_B}${C.reset}  →  ${APP_URL_B}\n`);

  // ── Phase 1: Run gate probes against both variants ─────────────────────────

  console.log(`${C.dim}Running ${GATE_PROBES.length} gate probe messages against both variants…${C.reset}\n`);

  const resultsA = [];
  const resultsB = [];

  for (let i = 0; i < GATE_PROBES.length; i++) {
    const probe = GATE_PROBES[i];
    const member = MEMBERS[probe.personaIdx];
    const label = `${i + 1}`.padStart(2, '0');
    const shortMsg = probe.message.slice(0, 55);

    process.stdout.write(`  [${label}/${GATE_PROBES.length}] ${member.name}: "${shortMsg}"…\n`);

    const [rA, rB] = await Promise.all([
      callConcierge(APP_URL_A, member.id, probe.message),
      callConcierge(APP_URL_B, member.id, probe.message),
    ]);

    resultsA.push({ ...probe, member, ...rA });
    resultsB.push({ ...probe, member, ...rB });

    const firedA = rA.tool_calls?.map(t => t.tool_name || t.name).join(', ') || 'none';
    const firedB = rB.tool_calls?.map(t => t.tool_name || t.name).join(', ') || 'none';
    console.log(`    ${C.dim}A tools: [${firedA}]  B tools: [${firedB}]${C.reset}`);
  }

  // ── Phase 2: Side-by-side response display ─────────────────────────────────

  console.log(`\n${C.bold}═══════════════════════════════════${C.reset}`);
  console.log(`${C.bold}  Response Comparison${C.reset}`);
  console.log(`${C.bold}═══════════════════════════════════${C.reset}\n`);

  for (let i = 0; i < GATE_PROBES.length; i++) {
    const probe = GATE_PROBES[i];
    const rA = resultsA[i];
    const rB = resultsB[i];
    const member = MEMBERS[probe.personaIdx];
    const expected = probe.expectedTool ?? 'clarify (no tool)';

    console.log(`${C.bold}[${i + 1}] ${member.name}: "${probe.message}"${C.reset}`);
    console.log(`  ${C.dim}Expected: ${expected}${C.reset}`);
    console.log(`  ${C.dim}Note: ${probe.note}${C.reset}`);
    console.log('');

    console.log(`  ${C.cyan}${LABEL_A}${C.reset}`);
    if (rA.error) {
      console.log(`    ${C.red}Error: ${rA.error}${C.reset}`);
    } else {
      const toolsA = rA.tool_calls?.map(t => t.tool_name || t.name).join(', ') || 'none';
      console.log(`    ${C.dim}tools: [${toolsA}]${C.reset}`);
      console.log(`    ${rA.response || '(no response)'}`);
    }
    console.log('');

    console.log(`  ${C.cyan}${LABEL_B}${C.reset}`);
    if (rB.error) {
      console.log(`    ${C.red}Error: ${rB.error}${C.reset}`);
    } else {
      const toolsB = rB.tool_calls?.map(t => t.tool_name || t.name).join(', ') || 'none';
      console.log(`    ${C.dim}tools: [${toolsB}]${C.reset}`);
      console.log(`    ${rB.response || '(no response)'}`);
    }
    console.log('');
    console.log(`  ${C.dim}${'─'.repeat(60)}${C.reset}\n`);
  }

  // ── Phase 3: Score both variants with the naturalness agent ───────────────

  console.log(`${C.dim}Scoring both variants with conversational_naturalness agent…${C.reset}\n`);

  const anthropic = new Anthropic({ apiKey: API_KEY });

  const buildConversationBlock = (results, label) => {
    return results.map((r, i) => {
      const toolInfo = r.tool_calls?.length
        ? r.tool_calls.map(t => `  Tool: ${t.tool_name || t.name}  Args: ${JSON.stringify(t.arguments || t.input || {})}`).join('\n')
        : '  (no tool calls)';
      return `--- ${label} / Probe ${i + 1} ---
Member: ${r.member.name} | Message: "${r.message}"
Expected behavior: ${r.expectedTool ?? 'clarify — no tool should fire'} | Note: ${r.note}
${toolInfo}
Response: "${(r.response || '').slice(0, 350)}"${r.error ? `\nError: ${r.error}` : ''}`;
    }).join('\n\n');
  };

  const userText = [
    `Here are 6 gate-probe conversations collected from TWO concierge variants (${LABEL_A} and ${LABEL_B}).`,
    '',
    'Score each variant independently on the 5 dimensions described in the system prompt.',
    '',
    `=== ${LABEL_A.toUpperCase()} RESPONSES ===`,
    '',
    buildConversationBlock(resultsA, LABEL_A),
    '',
    `=== ${LABEL_B.toUpperCase()} RESPONSES ===`,
    '',
    buildConversationBlock(resultsB, LABEL_B),
    '',
    'Return ONLY valid JSON — no markdown, no explanation outside the JSON.',
  ].join('\n');

  let parsed = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await anthropicWithRetry(() =>
        anthropic.messages.create({
          model: MODEL,
          max_tokens: 4096,
          temperature: 0,
          system: SCORING_PROMPT,
          messages: [{ role: 'user', content: userText }],
        })
      );

      const rawText = response.content.find(b => b.type === 'text')?.text || '';
      parsed = parseJSON(rawText);
      if (parsed?.variant_a?.scores && parsed?.variant_b?.scores) break;

      if (attempt === 0) {
        console.warn(`  ${C.yellow}Warning: unexpected JSON shape, retrying…${C.reset}`);
      }
    } catch (err) {
      console.error(`  ${C.red}Scoring error: ${err.message}${C.reset}`);
    }
  }

  if (!parsed?.variant_a?.scores || !parsed?.variant_b?.scores) {
    console.error(`\n${C.red}✗ Could not parse scoring output. Exiting.${C.reset}\n`);
    process.exit(1);
  }

  // ── Phase 4: Per-dimension score table ────────────────────────────────────

  const DIMENSIONS = ['response_fit', 'followup_intelligence', 'brevity_fit', 'tone_naturalness', 'clarify_vs_act'];

  console.log(`\n${C.bold}═══════════════════════════════════${C.reset}`);
  console.log(`${C.bold}  Dimension Scores${C.reset}`);
  console.log(`${C.bold}═══════════════════════════════════${C.reset}\n`);
  console.log(`  ${'Dimension'.padEnd(24)} ${LABEL_A.slice(0, 14).padEnd(14)} ${LABEL_B.slice(0, 14)}`);
  console.log(`  ${'─'.repeat(55)}`);

  for (const dim of DIMENSIONS) {
    const sA = parsed.variant_a.scores[dim]?.score ?? null;
    const sB = parsed.variant_b.scores[dim]?.score ?? null;

    const fmtScore = (s) => {
      if (s === null) return '  n/a';
      const color = s >= 8 ? C.green : s >= 5 ? C.yellow : C.red;
      return `${color}${String(s).padStart(4)}${C.reset}`;
    };

    const winner = sA !== null && sB !== null
      ? (sA > sB ? ` ${C.dim}← A${C.reset}` : sB > sA ? ` ${C.dim}← B${C.reset}` : '')
      : '';

    console.log(`  ${dim.padEnd(24)} ${fmtScore(sA).padEnd(14)} ${fmtScore(sB)}${winner}`);
  }

  // ── Phase 5: Issues and strengths ─────────────────────────────────────────

  const printList = (label, items, color) => {
    if (!items?.length) return;
    console.log(`\n  ${color}${label}${C.reset}`);
    for (const item of items) console.log(`    ${C.dim}• ${item}${C.reset}`);
  };

  console.log(`\n  ${C.cyan}${LABEL_A} — Top Issues${C.reset}`);
  (parsed.variant_a.top_issues || []).forEach(i => console.log(`    ${C.dim}• ${i}${C.reset}`));
  printList(`${LABEL_A} — Top Strengths`, parsed.variant_a.top_strengths, C.green);

  console.log(`\n  ${C.cyan}${LABEL_B} — Top Issues${C.reset}`);
  (parsed.variant_b.top_issues || []).forEach(i => console.log(`    ${C.dim}• ${i}${C.reset}`));
  printList(`${LABEL_B} — Top Strengths`, parsed.variant_b.top_strengths, C.green);

  // ── Phase 6: Final summary ─────────────────────────────────────────────────

  const compositeA = avgScores(parsed.variant_a.scores);
  const compositeB = avgScores(parsed.variant_b.scores);

  const fmtComposite = (v) => v !== null ? v.toFixed(1) : 'n/a';

  let winnerLine;
  if (compositeA !== null && compositeB !== null) {
    const diff = Math.abs(compositeA - compositeB).toFixed(1);
    if (compositeA > compositeB) {
      winnerLine = `${C.green}Winner: ${LABEL_A} (+${diff})${C.reset}`;
    } else if (compositeB > compositeA) {
      winnerLine = `${C.green}Winner: ${LABEL_B} (+${diff})${C.reset}`;
    } else {
      winnerLine = `${C.yellow}Tie${C.reset}`;
    }
  } else {
    winnerLine = `${C.dim}Could not determine winner (scoring incomplete)${C.reset}`;
  }

  console.log(`\n${C.bold}═══════════════════════════════════${C.reset}`);
  console.log(`${C.bold}  A/B Naturalness Comparison${C.reset}`);
  console.log(`${C.bold}═══════════════════════════════════${C.reset}`);
  console.log(`  ${C.cyan}${LABEL_A}${C.reset}: ${fmtComposite(compositeA)} / 10`);
  console.log(`  ${C.cyan}${LABEL_B}${C.reset}: ${fmtComposite(compositeB)} / 10`);
  console.log(`  ${winnerLine}`);
  console.log('');
}

main().catch(err => {
  console.error(`\n${C.red}✗ Fatal error: ${err.message}${C.reset}\n`);
  process.exit(1);
});
