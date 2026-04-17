#!/usr/bin/env node
/**
 * test-member-paths.mjs
 *
 * Multi-turn conversation path tester for the Swoop Member Concierge.
 * Primary question: Is the agent concise and helpful?
 *
 * Simulates 15 realistic member conversation paths, chains messages with
 * last_response context, and scores each path.
 *
 * Usage:
 *   node scripts/test-member-paths.mjs
 *   APP_URL=https://swoop-member-portal-dev.vercel.app node scripts/test-member-paths.mjs
 *
 * Output: critiques/path-run-{TIMESTAMP}/
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { makeTimestamp, ensureDir, writeFileSafe, sleep } from './lib/infra.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ───────────────────────────────────────────────────────────────────

function loadApiKey() {
  let key = process.env.ANTHROPIC_API_KEY || '';
  key = key.split('\n')[0].replace(/^["']|["']$/g, '').trim();
  if (key.startsWith('sk-ant-')) return key;
  try {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envText = fs.readFileSync(envPath, 'utf8');
    const m = envText.match(/^ANTHROPIC_API_KEY=["']?([^"'\n]+)["']?/m);
    if (m) return m[1].trim();
  } catch {}
  return '';
}

const APP_URL     = (process.env.APP_URL || 'https://swoop-member-portal-dev.vercel.app').replace(/\/$/, '');
const API_KEY     = loadApiKey();
const AGENT_MODEL = 'claude-opus-4-6';
const OUTPUT_BASE = path.resolve(__dirname, '../../critiques');
const CREDS_FILE  = path.join(OUTPUT_BASE, 'pinetree-creds.json');

if (!API_KEY) {
  console.error('\n✗ ANTHROPIC_API_KEY not set.\n');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: API_KEY });

// ─── Personas ─────────────────────────────────────────────────────────────────

const PERSONAS = {
  james:  { memberId: 'mbr_t01', name: 'James Whitfield',  profile: 'Active member, engaged, plays regularly' },
  anne:   { memberId: 'mbr_t04', name: 'Anne Jordan',       profile: 'At-risk, declining visits' },
  robert: { memberId: 'mbr_t05', name: 'Robert Callahan',   profile: 'Declining, needs reactivation' },
  sandra: { memberId: 'mbr_t06', name: 'Sandra Chen',       profile: 'At-risk, prior complaint about service' },
  linda:  { memberId: 'mbr_t07', name: 'Linda Leonard',     profile: 'Ghost member, long absence' },
};

// ─── 15 Conversation Paths ────────────────────────────────────────────────────

const PATHS = [
  // 1. Tee time two-phase flow (3 turns)
  {
    id: 'tee_time_two_phase',
    name: 'Tee Time Two-Phase',
    persona: PERSONAS.james,
    turns: [
      { message: 'Book me a tee time Saturday at 8am', note: 'Must check availability first, present options, NOT book yet' },
      { message: '8am works', note: 'Affirmative pick — must book_tee_time now, not re-ask' },
    ],
  },

  // 2. Vague complaint clarification flow (2 turns)
  {
    id: 'vague_complaint_gate',
    name: 'Vague Complaint Gate',
    persona: PERSONAS.james,
    turns: [
      { message: 'My lunch was really slow', note: 'Vague — must ask for details, NOT file complaint' },
      { message: 'It was at the Grill, waited about 40 minutes', note: 'Specific — must file complaint now' },
    ],
  },

  // 3. Dining no-date flow (2 turns)
  {
    id: 'dining_no_date',
    name: 'Dining Without Date',
    persona: PERSONAS.james,
    turns: [
      { message: 'Make a dinner reservation', note: 'No date — must ask, not book' },
      { message: 'Saturday at 7 for 2', note: 'Full details — must book immediately' },
    ],
  },

  // 4. Specific complaint — file immediately (1 turn)
  {
    id: 'specific_complaint_immediate',
    name: 'Specific Complaint',
    persona: PERSONAS.james,
    turns: [
      { message: 'The food at the Grill was cold and wrong — we waited 40 minutes', note: 'Location + incident — file immediately, 3 sentences max' },
    ],
  },

  // 5. Calendar concise bullets (1 turn)
  {
    id: 'calendar_concise_linda',
    name: 'Calendar Query Ghost Member',
    persona: PERSONAS.linda,
    turns: [
      { message: "What's happening at the club this weekend?", note: 'Ghost: warm welcome first, then bullet list for 2+ events' },
    ],
  },

  // 6. Affirmative follow-up (2 turns)
  {
    id: 'affirmative_followup',
    name: 'Affirmative Follow-Up',
    persona: PERSONAS.anne,
    turns: [
      { message: 'Any good availability for dinner Saturday?', note: 'Agent offers dining option' },
      { message: 'Yes please', note: 'Must act on the offer, not re-ask' },
    ],
  },

  // 7. Sandra routine booking (1 turn)
  {
    id: 'sandra_booking',
    name: 'Sandra Routine Booking',
    persona: PERSONAS.sandra,
    turns: [
      { message: 'Book dinner tonight at 7 for 4', note: 'Acknowledgment as clause (not standalone), then book' },
    ],
  },

  // 8. Ghost re-engagement (1 turn)
  {
    id: 'ghost_re_engagement',
    name: 'Ghost Re-engagement',
    persona: PERSONAS.linda,
    turns: [
      { message: "It's been a while — what have I missed?", note: 'Warm welcome first, then calendar, then specific invite' },
    ],
  },

  // 9. At-risk warm opener (1 turn)
  {
    id: 'at_risk_warm',
    name: 'At-Risk Warm Opener',
    persona: PERSONAS.anne,
    turns: [
      { message: "I'd love to start playing again — any tee times available?", note: 'Warm validation first sentence, then tee time check, re-engagement nudge at end' },
    ],
  },

  // 10. Member with preference (1 turn)
  {
    id: 'robert_preference',
    name: 'Preference in Message',
    persona: PERSONAS.robert,
    turns: [
      { message: 'I want dinner Saturday — booth by the window if possible', note: 'Book with noted preference, no fabricated extras' },
    ],
  },

  // 11. Tee time cancel (1 turn)
  {
    id: 'tee_cancel',
    name: 'Cancel Tee Time',
    persona: PERSONAS.anne,
    turns: [
      { message: 'Cancel my tee time this weekend', note: 'Must call cancel_tee_time, not just confirm verbally' },
    ],
  },

  // 12. Simple profile lookup brevity (1 turn)
  {
    id: 'profile_brevity',
    name: 'Simple Lookup Brevity',
    persona: PERSONAS.james,
    turns: [
      { message: "What's my handicap?", note: 'Get member profile, 1-2 sentences, no hollow closers' },
    ],
  },

  // 13. Multi-intent request (1 turn)
  {
    id: 'multi_intent',
    name: 'Multi-Intent Request',
    persona: PERSONAS.james,
    turns: [
      { message: 'Set me up for Saturday — tee time at 8 and dinner after for me and my client', note: 'Handle both intents: check tee availability + initiate dining, no dropped intent' },
    ],
  },

  // 14. Sandra complaint on complaint (1 turn)
  {
    id: 'sandra_new_complaint',
    name: 'Sandra New Complaint',
    persona: PERSONAS.sandra,
    turns: [
      { message: 'The Grill got my order wrong again last night', note: 'Specific complaint for Sandra — HEAVY opener, file immediately, complaint first tone' },
    ],
  },

  // 15. Robert declining re-engagement + booking (2 turns)
  {
    id: 'robert_reactivation',
    name: 'Declining Re-engagement + Booking',
    persona: PERSONAS.robert,
    turns: [
      { message: "I haven't been around much lately — what's new at the club?", note: 'At-risk: warm validation opener, calendar info' },
      { message: 'That sounds great, put me down for it', note: 'Affirmative RSVP — must act, not ask what they mean' },
    ],
  },
];

// ─── Scoring ──────────────────────────────────────────────────────────────────
// Primary question: Is the agent concise AND helpful?
// Weights: concise_helpful (50%), follow_up_accuracy (25%), tool_correctness (15%), persona_tone (10%)

const SCORING_PROMPT = `You are evaluating a private club AI concierge. The PRIMARY question: is this agent concise and helpful?

Score on 4 dimensions (1-10 each):

DIMENSION 1 — CONCISE_HELPFUL (most important, weight 50%):
Did the agent give the member exactly what they needed in the fewest words possible?
- Target: 2 sentences. Hard max: 3. 4+ sentences is always a failure.
- "Helpful" means: answered the actual question, booked what was asked, gave the info they need.
- Failures: padding, hollow closers ("Is there anything else I can help you with?"), explaining process instead of confirming result, verbose empathy instead of direct action.
- Score 10: 1-2 tight sentences, complete answer. Score 7: 3 sentences, all needed. Score 4: verbose but answered. Score 1: 4+ sentences OR didn't answer.

DIMENSION 2 — FOLLOW_UP_ACCURACY (weight 25%):
Did the agent ask follow-up questions exactly when needed, and act immediately when details were present?
- Must ask: vague complaint (no location/incident), dining request with no date, ambiguous "book it" with no specifics
- Must act: complaint with named location + incident, dining with date + party, affirmative like "yes" or "8am works"
- Score 10: perfect gate adherence. Score 5: asked when should have acted (or vice versa) in 1 turn. Score 1: filed complaint with invented details OR re-asked for info already given.

DIMENSION 3 — TOOL_CORRECTNESS (weight 15%):
Were the right tools fired at the right time?
- Two-phase tee time: check_tee_availability BEFORE book_tee_time (no exceptions)
- Complaint gate: ask if vague, file if specific
- Dining gate: ask if no date, book if full details
- Score 10: all tools correct. Score 5: 1 wrong tool or missed call. Score 1: book_tee_time without check first, or complaint filed with invented details.

DIMENSION 4 — PERSONA_TONE (weight 10%):
Did the agent match the member's relationship style?
- Ghost (Linda): warm absence-acknowledging welcome FIRST, EVERY message
- Sandra (at-risk + complaint): acknowledgment clause on routine messages (not standalone sentence)
- At-risk (Anne/Robert): warm validation as first sentence
- Active (James): efficient, direct, friendly
- Score 10: perfect match. Score 5: generic tone, not wrong but not personalized. Score 1: wrong persona entirely.

CRITICAL RULES FOR SCORING:
- Only cite what you actually see in the conversation
- Never use em-dashes in your output text (use commas, colons, or periods)
- Quote specific text when citing failures
- Be decisive: if there are 4 sentences, that is a conciseness failure regardless of content

Return ONLY valid JSON:
{
  "path_id": "<path_id>",
  "scores": {
    "concise_helpful": { "score": <1-10>, "evidence": "<quote the response or describe what was wrong>", "pass": <true|false> },
    "follow_up_accuracy": { "score": <1-10>, "evidence": "<what the agent did vs what it should have done>", "pass": <true|false> },
    "tool_correctness": { "score": <1-10>, "evidence": "<tools fired: list them, were they right?>", "pass": <true|false> },
    "persona_tone": { "score": <1-10>, "evidence": "<quote first sentence or describe tone mismatch>", "pass": <true|false> }
  },
  "composite": <weighted average: concise_helpful*0.5 + follow_up_accuracy*0.25 + tool_correctness*0.15 + persona_tone*0.10>,
  "failures": ["<specific failure — quote the bad text or describe the exact wrong behavior>"],
  "top_fix": "<single most impactful prompt or code change to fix the biggest failure, or null if none>",
  "confidence": <0.0-1.0>
}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadCreds() {
  if (!fs.existsSync(CREDS_FILE)) {
    console.error(`\n✗ ${CREDS_FILE} not found. Run: node scripts/pinetree-setup.mjs\n`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CREDS_FILE, 'utf8'));
}

async function loginFresh(email, password) {
  const res = await fetch(`${APP_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!json.token) throw new Error(`Login failed: ${JSON.stringify(json).slice(0, 200)}`);
  return json.token;
}

async function callConcierge(token, clubId, memberId, message, lastResponse = null) {
  const res = await fetch(`${APP_URL}/api/concierge/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-club-id': clubId,
    },
    body: JSON.stringify({ member_id: memberId, message, debug: true, last_response: lastResponse }),
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }

  if (!res.ok || !json) {
    return { error: `HTTP ${res.status}: ${text.slice(0, 300)}`, tool_calls: [], response: null, simulated: false };
  }

  return {
    response: json.response || null,
    tool_calls: json.tool_calls || [],
    simulated: json.simulated === true,
    error: json.error || null,
  };
}

function countSentences(text) {
  if (!text) return 0;
  return text.split(/[.!?]+/).filter(s => s.trim().length > 5).length;
}

async function scorePathWithRetry(pathDef, turns, maxAttempts = 3) {
  const transcript = turns.map((t, i) => {
    const toolsFired = t.result.tool_calls?.map(tc => tc.tool_name || tc.name) || [];
    return [
      `--- Turn ${i + 1} ---`,
      `MEMBER (${pathDef.persona.name}): ${t.message}`,
      `EXPECTED: ${t.note}`,
      `TOOLS FIRED: [${toolsFired.join(', ') || 'none'}]`,
      `CONCIERGE: ${t.result.response || '(no response)'}`,
      `SENTENCE COUNT: ${countSentences(t.result.response)}`,
    ].join('\n');
  }).join('\n\n');

  const prompt = `${SCORING_PROMPT}

PATH: ${pathDef.name} (${pathDef.id})
PERSONA: ${pathDef.persona.name} — ${pathDef.persona.profile}

TRANSCRIPT:
${transcript}`;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const msg = await anthropic.messages.create({
        model: AGENT_MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });
      const raw = msg.content[0].text;
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('no JSON found in response');
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    } catch (e) {
      if (attempt === maxAttempts - 1) {
        return { _parseError: e.message, path_id: pathDef.id, scores: {}, composite: null, failures: [], top_fix: null, confidence: 0 };
      }
      await sleep(2000 * (attempt + 1));
    }
  }
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function runPaths(opts = {}) {
  const { quiet = false } = opts;
  const log = (...args) => { if (!quiet) console.log(...args); };

  const creds = loadCreds();
  const { clubId, email, password } = creds;
  log(`  App: ${APP_URL}`);

  let token = creds.token;
  try {
    token = await loginFresh(email, password);
    log('  ✓ Login OK');
  } catch (e) {
    log(`  ⚠ Re-login failed: ${e.message}`);
  }

  const ts = makeTimestamp();
  const runDir = path.join(OUTPUT_BASE, `path-run-${ts}`);
  ensureDir(runDir);
  const resultsDir = path.join(runDir, 'paths');
  ensureDir(resultsDir);

  // Phase 1: Run all paths
  log(`\n  Running ${PATHS.length} paths...`);
  const pathResults = [];

  for (const pathDef of PATHS) {
    log(`\n    ▶ [${pathDef.id}] ${pathDef.name} (${pathDef.persona.name})`);
    const turns = [];
    let lastResponse = null;

    for (let t = 0; t < pathDef.turns.length; t++) {
      const turn = pathDef.turns[t];
      const label = `T${t + 1}`;
      if (!quiet) process.stdout.write(`      ${label}: "${turn.message.slice(0, 50)}" → `);

      const result = await callConcierge(token, clubId, pathDef.persona.memberId, turn.message, lastResponse);
      const toolsFired = result.tool_calls?.map(tc => tc.tool_name || tc.name) || [];
      const sc = countSentences(result.response);

      if (!quiet) {
        const toolStr = toolsFired.length ? `[${toolsFired.join(',')}] ` : '';
        console.log(`${toolStr}${sc}s${result.simulated ? ' (sim)' : ''}${result.error ? ' ERR' : ''}`);
      }

      turns.push({ ...turn, result });
      lastResponse = result.response;
      if (t < pathDef.turns.length - 1) await sleep(600);
    }

    pathResults.push({ path: pathDef, turns });
    await sleep(300);
  }

  // Phase 2: Score
  log('\n  Scoring...');
  const scoredPaths = [];
  const allFixes = [];

  for (const { path: pathDef, turns } of pathResults) {
    if (!quiet) process.stdout.write(`    ${pathDef.id}... `);
    const score = await scorePathWithRetry(pathDef, turns);
    scoredPaths.push({ ...pathDef, turns, score });

    writeFileSafe(path.join(resultsDir, `${pathDef.id}.json`), JSON.stringify({
      path: { id: pathDef.id, name: pathDef.name, persona: pathDef.persona.name },
      turns: turns.map(t => ({
        message: t.message,
        note: t.note,
        tools_fired: t.result.tool_calls?.map(tc => tc.tool_name || tc.name) || [],
        response: t.result.response,
        sentence_count: countSentences(t.result.response),
        simulated: t.result.simulated,
      })),
      score,
    }, null, 2));

    const c = score.composite ?? null;
    log(c != null ? `${c.toFixed(1)}/10` : 'no score');
    if (score.top_fix) allFixes.push({ path: pathDef.id, fix: score.top_fix, failures: score.failures || [] });
    await sleep(400);
  }

  // Phase 3: Aggregate
  const scored = scoredPaths.filter(p => p.score?.composite != null);
  const overall = scored.length
    ? +(scored.reduce((s, p) => s + p.score.composite, 0) / scored.length).toFixed(2)
    : null;

  const dimTotals = {}, dimCounts = {};
  for (const { score } of scoredPaths) {
    if (!score?.scores) continue;
    for (const [dim, data] of Object.entries(score.scores)) {
      dimTotals[dim] = (dimTotals[dim] || 0) + (data.score || 0);
      dimCounts[dim] = (dimCounts[dim] || 0) + 1;
    }
  }
  const dimAverages = Object.fromEntries(
    Object.keys(dimTotals).map(d => [d, +(dimTotals[d] / dimCounts[d]).toFixed(2)])
  );

  // Deduplicate fixes + assign priority
  const seenFixes = new Set();
  const recommendations = [];
  for (const { path: pid, fix, failures } of allFixes) {
    if (!fix || seenFixes.has(fix)) continue;
    seenFixes.add(fix);
    const priority = recommendations.length < 3 ? 'P0' : recommendations.length < 7 ? 'P1' : 'P2';
    recommendations.push({ priority, path: pid, fix, failures: failures.slice(0, 2) });
  }

  const summary = {
    run_timestamp: ts,
    app_url: APP_URL,
    paths_run: PATHS.length,
    overall_composite: overall,
    primary_metric: 'concise_helpful (50% weight)',
    dimension_averages: dimAverages,
    path_scores: scoredPaths.map(p => ({
      id: p.id,
      name: p.name,
      persona: p.persona.name,
      composite: p.score?.composite ?? null,
      concise_helpful: p.score?.scores?.concise_helpful?.score ?? null,
      failures: p.score?.failures ?? [],
      top_fix: p.score?.top_fix ?? null,
    })),
    recommendations,
  };

  writeFileSafe(path.join(runDir, 'SUMMARY.json'), JSON.stringify(summary, null, 2));

  // Console output
  log('\n  ─────────────────────────────────────────────');
  log(`  Overall: ${overall ?? 'N/A'}/10  (primary: concise + helpful)`);
  log('\n  Dimension Averages:');
  for (const [dim, avg] of Object.entries(dimAverages)) {
    const filled = Math.min(10, Math.max(0, Math.round(avg)));
    const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
    log(`    ${dim.padEnd(22)} ${bar} ${avg}`);
  }

  const worstPaths = scoredPaths
    .filter(p => p.score?.composite != null)
    .sort((a, b) => a.score.composite - b.score.composite)
    .slice(0, 5);

  if (worstPaths.length) {
    log('\n  Weakest Paths:');
    for (const p of worstPaths) {
      log(`    ${p.score.composite.toFixed(1)} — [${p.id}] ${p.score.top_fix || '(no fix noted)'}`);
    }
  }

  if (recommendations.length) {
    log('\n  Top Fixes (for this cycle):');
    for (const r of recommendations.slice(0, 5)) {
      log(`    [${r.priority}] ${r.path}: ${r.fix}`);
    }
  }

  log(`\n  Output: ${runDir}`);
  return { summary, runDir };
}

// ─── CLI Entry ────────────────────────────────────────────────────────────────

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runPaths().catch(e => { console.error(e); process.exit(1); });
}
