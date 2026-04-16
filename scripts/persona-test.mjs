/**
 * scripts/persona-test.mjs
 *
 * Persistent persona testing for Swoop identity agents.
 *
 * Runs test paths for each persona defined in critiques/test-personas.json.
 * Session IDs are STABLE — the same session_id is used on every run, so
 * the DB accumulates history and the concierge's memory grows over time.
 *
 * Usage:
 *   node scripts/persona-test.mjs                       # all personas
 *   node scripts/persona-test.mjs --persona mbr_t01     # one member
 *   node scripts/persona-test.mjs --group members       # all members
 *   node scripts/persona-test.mjs --group staff         # all staff
 *   node scripts/persona-test.mjs --path booking        # specific test path
 *   node scripts/persona-test.mjs --show-memory mbr_t01 # show accumulated session
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Config ───────────────────────────────────────────────────────────────────
const APP_URL = process.env.APP_URL || 'https://swoop-member-portal-dev.vercel.app';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PERSONAS_FILE = join(ROOT, '..', 'critiques', 'test-personas.json');
const CREDS_FILE = join(ROOT, '..', 'critiques', 'pinetree-creds.json');

if (!ANTHROPIC_API_KEY) {
  console.error('✗ ANTHROPIC_API_KEY not set. Export it or pass inline.');
  process.exit(1);
}

// ── Args ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const personaFilter = args.includes('--persona') ? args[args.indexOf('--persona') + 1] : null;
const groupFilter = args.includes('--group') ? args[args.indexOf('--group') + 1] : null;
const pathFilter = args.includes('--path') ? args[args.indexOf('--path') + 1] : null;
const showMemory = args.includes('--show-memory') ? args[args.indexOf('--show-memory') + 1] : null;

// ── Load config ──────────────────────────────────────────────────────────────
const personas = JSON.parse(readFileSync(PERSONAS_FILE, 'utf8'));
const creds = JSON.parse(readFileSync(CREDS_FILE, 'utf8'));

// ── Auth ─────────────────────────────────────────────────────────────────────
async function login() {
  const res = await fetch(`${APP_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: creds.email, password: creds.password }),
  });
  const d = await res.json();
  return d.token;
}

// ── API call ─────────────────────────────────────────────────────────────────
async function sendMessage(token, memberId, message) {
  const res = await fetch(`${APP_URL}/api/concierge/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-club-id': creds.clubId,
    },
    body: JSON.stringify({ member_id: memberId, message, debug: true }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// ── Memory query (calls session event log API) ───────────────────────────────
async function getSessionMemory(token, memberId) {
  const res = await fetch(`${APP_URL}/api/concierge/session?member_id=${memberId}&last=50`, {
    headers: { 'Authorization': `Bearer ${token}`, 'x-club-id': creds.clubId },
  });
  if (!res.ok) return null;
  return res.json();
}

// ── Output ───────────────────────────────────────────────────────────────────
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = join(ROOT, '..', 'critiques', `persona-test-${timestamp}`);
mkdirSync(outDir, { recursive: true });

function writeResult(personaId, pathId, data) {
  const file = join(outDir, `${personaId}_${pathId}.json`);
  writeFileSync(file, JSON.stringify(data, null, 2));
}

// ── Evaluate response ────────────────────────────────────────────────────────
function evaluatePath(persona, path, response) {
  const text = response.response || '';
  const toolCalls = response.tool_calls || [];
  const firstName = persona.name.split(' ')[0];
  const checks = [];
  let pass = 0;
  let total = 0;

  // Ghost: must open with welcome-back
  if (persona.archetype === 'Ghost') {
    total++;
    const hasWelcome = text.includes("We've missed you") || text.includes("missed you")
      || text.includes("so great to hear") || text.includes("welcome back");
    checks.push({ rule: 'ghost_welcome_back', pass: hasWelcome, found: text.slice(0, 80) });
    if (hasWelcome) pass++;
  }

  // At-risk: must open with validation
  if (persona.archetype?.includes('At-Risk')) {
    total++;
    const hasValidation = text.startsWith(`It's so great`) || text.startsWith(`${firstName}, always love`)
      || text.startsWith(`${firstName}! You made my day`) || text.includes(`so great to hear from you`);
    checks.push({ rule: 'at_risk_opener', pass: hasValidation, found: text.slice(0, 80) });
    if (hasValidation) pass++;
  }

  // Complaint member: must acknowledge prior issue
  if (persona.archetype?.includes('Complaint')) {
    total++;
    const hasAck = text.includes("last experience") || text.includes("last time wasn't")
      || text.includes("I know your") || text.includes("want to make sure this one");
    checks.push({ rule: 'complaint_acknowledgment', pass: hasAck, found: text.slice(0, 80) });
    if (hasAck) pass++;
  }

  // Check first name present
  total++;
  const hasName = text.includes(firstName);
  checks.push({ rule: 'name_in_response', pass: hasName });
  if (hasName) pass++;

  // Check banned openers
  total++;
  const bannedOpeners = ['Perfect', 'Great news', 'Certainly', 'Absolutely', "Of course", "I've escalated", "Your complaint has been escalated"];
  const hasBanned = bannedOpeners.some(b => text.startsWith(b));
  checks.push({ rule: 'no_banned_opener', pass: !hasBanned, found: hasBanned ? text.slice(0, 40) : null });
  if (!hasBanned) pass++;

  // Check em-dash
  total++;
  const hasEmDash = text.includes('—');
  checks.push({ rule: 'no_em_dash', pass: !hasEmDash });
  if (!hasEmDash) pass++;

  // Check expected tool
  if (path.expected_tool) {
    total++;
    const toolFired = toolCalls.some(t => t.tool_name === path.expected_tool);
    checks.push({ rule: `tool_${path.expected_tool}`, pass: toolFired, tool_calls: toolCalls.map(t => t.tool_name) });
    if (toolFired) pass++;
  }
  if (path.expected_tools) {
    for (const expectedTool of path.expected_tools) {
      total++;
      const toolFired = toolCalls.some(t => t.tool_name === expectedTool);
      checks.push({ rule: `tool_${expectedTool}`, pass: toolFired });
      if (toolFired) pass++;
    }
  }

  return { checks, score: total > 0 ? Math.round((pass / total) * 100) : 0, pass, total };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  Swoop Persistent Persona Test');
  console.log(`  ${APP_URL}`);
  console.log('═══════════════════════════════════════════════');
  console.log('  ℹ  Session IDs are stable — memory accumulates');
  console.log('     across every test run in the DB.');
  console.log('');

  const token = await login();
  console.log('  ✓ Authenticated\n');

  // Show-memory mode
  if (showMemory) {
    const memory = await getSessionMemory(token, showMemory);
    if (memory?.events?.length) {
      console.log(`Session memory for ${showMemory} (${memory.events.length} events):\n`);
      memory.events.slice().reverse().forEach(ev => {
        const ts = ev.emitted_at?.slice(0, 16) || '';
        const p = ev.payload || {};
        switch (ev.event_type) {
          case 'user_message': console.log(`  [${ts}] Member: ${p.text?.slice(0, 80)}`); break;
          case 'agent_response': console.log(`  [${ts}] Agent: ${p.text?.slice(0, 80)}`); break;
          case 'preference_observed': console.log(`  [${ts}] 🧠 Preference: ${p.field} = ${p.value}`); break;
          case 'request_submitted': console.log(`  [${ts}] 📤 Pending: ${p.request_type} → ${p.routed_to}`); break;
          case 'staff_confirmed': console.log(`  [${ts}] ✅ Confirmed: ${p.text?.slice(0, 60)}`); break;
          default: console.log(`  [${ts}] ${ev.event_type}`);
        }
      });
    } else {
      console.log(`No session memory found for ${showMemory} (table may not exist yet).`);
    }
    return;
  }

  // Select personas to test
  let allPersonas = [
    ...(groupFilter !== 'staff' ? personas.members : []),
    ...(groupFilter !== 'members' ? personas.staff : []),
  ];
  if (personaFilter) allPersonas = allPersonas.filter(p => p.persona_id === personaFilter);

  const summary = [];

  for (const persona of allPersonas) {
    const paths = pathFilter
      ? persona.test_paths.filter(p => p.path === pathFilter)
      : persona.test_paths;
    if (!paths.length) continue;

    const emoji = persona.archetype === 'Ghost' ? '👻' :
      persona.archetype?.includes('At-Risk') ? '⚠️' :
      persona.type === 'identity_agent' && !persona.member_id ? '🧑‍💼' : '👤';

    console.log(`${emoji}  ${persona.name} (${persona.persona_id})`);
    console.log(`   Role: ${persona.archetype || persona.role} | Session: ${persona.session_id}`);

    let personaPass = 0;
    let personaTotal = 0;

    for (const path of paths) {
      const message = path.message || path.task;
      process.stdout.write(`   [${path.path}] "${message.slice(0, 50)}"...`);

      try {
        const data = await sendMessage(token, persona.persona_id, message);
        const evaluation = evaluatePath(persona, path, data);

        const icon = evaluation.score >= 80 ? '✓' : evaluation.score >= 60 ? '~' : '✗';
        const toolStr = data.tool_calls?.length ? ` (${data.tool_calls.map(t => t.tool_name).join(', ')})` : ' (no tools)';
        console.log(` ${icon} ${evaluation.score}%${toolStr}`);

        const failedChecks = evaluation.checks.filter(c => !c.pass);
        if (failedChecks.length) {
          failedChecks.forEach(c => {
            console.log(`      ✗ ${c.rule}${c.found ? `: "${c.found}"` : ''}`);
          });
        }

        personaPass += evaluation.pass;
        personaTotal += evaluation.total;

        writeResult(persona.persona_id, path.path, {
          persona_id: persona.persona_id,
          session_id: persona.session_id,
          path: path.path,
          message,
          response: data.response,
          tool_calls: data.tool_calls || [],
          simulated: data.simulated || false,
          evaluation,
          timestamp: new Date().toISOString(),
        });

        // Small delay between calls
        await new Promise(r => setTimeout(r, 800));
      } catch (err) {
        console.log(` ✗ Error: ${err.message.slice(0, 60)}`);
      }
    }

    const personaScore = personaTotal > 0 ? Math.round((personaPass / personaTotal) * 100) : 0;
    console.log(`   Score: ${personaScore}% (${personaPass}/${personaTotal} checks)\n`);
    summary.push({ persona: persona.persona_id, name: persona.name, score: personaScore });
  }

  // Summary table
  console.log('───────────────────────────────────────────────');
  console.log('  Persona Summary');
  console.log('───────────────────────────────────────────────');
  summary.forEach(s => {
    const bar = '█'.repeat(Math.floor(s.score / 10)) + '░'.repeat(10 - Math.floor(s.score / 10));
    console.log(`  ${bar}  ${s.score}%  ${s.name}`);
  });
  console.log('');
  console.log(`  Results: ${outDir}`);
  console.log('  ℹ  Run with --show-memory <persona_id> to see accumulated session');
  console.log('');

  // Save summary
  writeFileSync(join(outDir, 'SUMMARY.json'), JSON.stringify({ timestamp, summary, app_url: APP_URL }, null, 2));
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
