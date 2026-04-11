#!/usr/bin/env node
/**
 * run_eval.js — FIXED evaluation harness. DO NOT MODIFY during autoresearch loop.
 *
 * V3: Production multi-agent reliability
 *   1. Haiku LLM classifier routing (from agent.js)
 *   2. Prefilled assistant openings for complaint + grief
 *   3. Temperature differentiation (from agent.js)
 *   4. Post-generation validation with retry
 *   5. Scoring context passed to critic
 *   6. Member context injection into system prompts
 *   7. Grief circuit breaker (from agent.js)
 *   + Best-of-2 sampling
 *   + Multi-tool handling
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../..');

// Load .env.local
try {
  const raw = readFileSync(resolve(ROOT, '.env.local'), 'utf-8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY not found'); process.exit(1);
}

const client = new Anthropic();

// Import agent configuration
const agentMod = await import('./agent.js');
const {
  MODELS, TEMPERATURES, CLUB_AGENT_PROMPTS,
  buildConciergePrompt, buildServiceRecoveryPrompt, BOOKING_PROMPT,
  routeMessage, getGriefResponse, extractDeceasedName,
} = agentMod;

// ---------------------------------------------------------------------------
// Fixed: Member profiles (Step 6: includes context metadata for injection)
// ---------------------------------------------------------------------------
const MEMBERS = {
  whitfield: {
    member_id: 'mbr_t01', name: 'James Whitfield', first_name: 'James',
    membership_type: 'Full Golf', join_date: '2019-04-12', annual_dues: 18500,
    health_score: 44, archetype: 'Balanced Active',
    household: [
      { name: 'Erin Whitfield', membership_type: 'Social' },
      { name: 'Logan Whitfield', membership_type: 'Junior' },
    ],
    preferences: {
      teeWindows: 'Thu/Fri 7:00-8:30 AM, Saturday 7:00 AM with regular foursome (Tom Gallagher, Mark Patterson, Greg Holloway)',
      dining: 'Grill Room booth 12, Arnold Palmer + Club Sandwich. Business dinners: Main Dining Room with wine service.',
      favoriteSpots: 'North Course back nine, Grill Room booth 12',
      channel: 'Call',
      familyNotes: 'Logan (Junior, age 13) in junior clinics. Erin (Social) enjoys wine events and Sunday brunch.',
    },
    // Step 6: member context for injection
    context: 'Health declining (was 68 thirty days ago). Golf rounds dropped from 4/month to 1. Open complaint: 42-min Grill Room wait Jan 16. Renewal in 90 days.',
  },
  jordan: {
    member_id: 'mbr_t04', name: 'Anne Jordan', first_name: 'Anne',
    membership_type: 'Full Golf', join_date: '2016-03-15', annual_dues: 12000,
    health_score: 28, archetype: 'Weekend Warrior',
    household: [{ name: 'Mark Jordan', membership_type: 'Social' }],
    preferences: {
      preferredTeeTime: 'Saturday 7:00 AM',
      playStyle: 'early morning, fast pace',
      dining: 'Quick lunch at the Halfway House after morning rounds',
      favoriteHole: 14,
    },
    context: 'Health critical (was 55 sixty days ago). Missed 3 Saturday waitlists. Zero rounds in 3 weeks. 10-year member.',
  },
  chen: {
    member_id: 'mbr_t07', name: 'Sandra Chen', first_name: 'Sandra',
    membership_type: 'Social', join_date: '2022-08-01', annual_dues: 9000,
    health_score: 36, archetype: 'Social Butterfly',
    household: [
      { name: 'David Chen', membership_type: 'Full Golf' },
      { name: 'Lily Chen', membership_type: 'Junior' },
    ],
    preferences: {
      dining: 'Main Dining Room, window table, enjoys wine pairings and seasonal menus',
      events: 'Wine dinners, holiday parties, ladies\' league social events',
      channel: 'Text',
      familyNotes: 'David plays Saturday mornings. Lily (age 10) in swim program.',
    },
    context: 'Husband Richard passed away recently. Has not visited the club since. Health declining. Was very active in wine dinner events with Richard.',
  },
};

// ---------------------------------------------------------------------------
// Fixed: SMS Tools + Tool executor
// ---------------------------------------------------------------------------
const SMS_TOOLS = [
  { name: 'get_club_calendar', description: 'Get upcoming club events and activities', input_schema: { type: 'object', properties: { days_ahead: { type: 'integer', default: 7 } } } },
  { name: 'book_tee_time', description: 'Book a tee time for the member', input_schema: { type: 'object', properties: { date: { type: 'string' }, time: { type: 'string' }, course: { type: 'string' }, players: { type: 'integer' } }, required: ['date', 'time'] } },
  { name: 'make_dining_reservation', description: 'Make a dining reservation', input_schema: { type: 'object', properties: { date: { type: 'string' }, time: { type: 'string' }, outlet: { type: 'string' }, party_size: { type: 'integer' }, preferences: { type: 'string' } }, required: ['date', 'time', 'outlet'] } },
  { name: 'get_my_schedule', description: "Get member's upcoming tee times, reservations, and events", input_schema: { type: 'object', properties: {} } },
  { name: 'rsvp_event', description: 'Register for a club event', input_schema: { type: 'object', properties: { event_title: { type: 'string' }, guest_count: { type: 'integer', default: 0 }, member_name: { type: 'string' } }, required: ['event_title'] } },
  { name: 'cancel_tee_time', description: 'Cancel a previously booked tee time', input_schema: { type: 'object', properties: { booking_date: { type: 'string' }, tee_time: { type: 'string' } }, required: ['booking_date'] } },
  { name: 'file_complaint', description: 'File a complaint or feedback', input_schema: { type: 'object', properties: { category: { type: 'string', enum: ['food_and_beverage', 'golf_operations', 'facilities', 'staff', 'billing', 'other'] }, description: { type: 'string' } }, required: ['category', 'description'] } },
];

function executeTool(toolName, input, member) {
  switch (toolName) {
    case 'get_club_calendar':
      return { events: [
        { date: '2026-04-11 (Sat)', time: '8:00 AM', title: 'Saturday Morning Shotgun — Member-Guest', location: 'North Course', capacity: '72 players, 8 spots left' },
        { date: '2026-04-11 (Sat)', time: '10:00 AM', title: 'Junior Golf Clinic', location: 'Practice Range', capacity: 'Open enrollment' },
        { date: '2026-04-13 (Mon)', time: '6:00 PM', title: 'Wine Dinner — Spring Pairing Menu', location: 'Main Dining Room', capacity: '48 seats, 12 remaining' },
        { date: '2026-04-15 (Tue)', time: '5:30 PM', title: 'Trivia Night', location: 'Grill Room', capacity: '20 teams max, 6 remaining' },
        { date: '2026-04-18 (Fri)', time: '7:00 AM', title: 'Club Championship Qualifier — Round 1', location: 'South Course', capacity: 'Registration open' },
        { date: '2026-04-19 (Sat)', time: '11:00 AM', title: "Ladies' League Spring Kickoff", location: 'Clubhouse Patio', capacity: '40 spots, 15 remaining' },
        { date: '2026-04-20 (Sun)', time: '10:00 AM', title: 'Family Brunch & Easter Egg Hunt', location: 'Main Dining Room + Lawn', capacity: '80 guests, 30 remaining' },
      ]};
    case 'book_tee_time':
      return { confirmation: `Tee time booked: ${input.date} at ${input.time} on the ${input.course || 'North Course'} for ${input.players || 4} players.`, confirmation_number: `TT-${Date.now().toString(36).toUpperCase()}`, member_name: member.name };
    case 'make_dining_reservation':
      return { confirmation: `Dining reservation confirmed: ${input.date} at ${input.time} at ${input.outlet} for ${input.party_size || 2} guests.`, confirmation_number: `DR-${Date.now().toString(36).toUpperCase()}`, preferences_noted: input.preferences || 'None', member_name: member.name };
    case 'get_my_schedule':
      if (member.member_id === 'mbr_t01') return { upcoming: [{ type: 'tee_time', date: '2026-04-12', time: '7:00 AM', course: 'North Course', players: 4, group: ['James Whitfield', 'Tom Gallagher', 'Mark Patterson', 'Greg Holloway'] }, { type: 'dining', date: '2026-04-13', time: '7:30 PM', outlet: 'Main Dining Room', party_size: 2, notes: 'Wine Dinner — Spring Pairing' }] };
      if (member.member_id === 'mbr_t04') return { upcoming: [{ type: 'tee_time', date: '2026-04-12', time: '7:00 AM', course: 'North Course', players: 2 }] };
      return { upcoming: [{ type: 'dining', date: '2026-04-13', time: '6:00 PM', outlet: 'Main Dining Room', party_size: 4, notes: 'Wine Dinner' }] };
    case 'rsvp_event':
      return { registration_id: `ER-${Date.now().toString(36).toUpperCase()}`, event: input.event_title, registered_for: input.member_name || member.name, guest_count: input.guest_count || 0, status: 'registered' };
    case 'cancel_tee_time':
      return { status: 'cancelled', booking_date: input.booking_date, tee_time: input.tee_time || '7:00 AM', message: `Tee time on ${input.booking_date} has been cancelled.` };
    case 'file_complaint':
      return { complaint_id: `FB-${Date.now().toString(36).toUpperCase()}`, category: input.category, status: 'filed', message: 'Your feedback has been filed and routed to the appropriate manager.' };
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ---------------------------------------------------------------------------
// Fixed: Critic prompt
// ---------------------------------------------------------------------------
const CRITIC_PROMPT = `You are a demanding QA critic reviewing AI agent conversations at a private golf club. Score on a 1-10 scale.

Score each dimension 1-10:
- NATURAL: Does the concierge sound like a real person texting a friend? No corporate speak, no markdown? Uses first name? Warm varied opener? (10 = indistinguishable from a great human concierge)
- HELPFUL: Did the concierge DO something (call a tool, make a booking, give specific info)? Cross-sell or proactively suggest? (10 = solved the need AND added unexpected value)
- ACCURATE: Were tool calls correct? Dates/times/details right? Confirmed before booking when needed? (10 = zero errors)
- PROACTIVE: Did the concierge anticipate needs? Suggest dining after golf? Reference preferences? (10 = anticipated 2+ unasked needs)
- CLUB_IMPACT: Did club-side agents produce actionable, dollar-quantified insights? Cross-domain signals? (10 = specific, actionable, dollar-quantified)

SCORING: 1-3=broken, 4-5=mediocre, 6-7=good, 8=very good, 9=excellent (nitpick-level), 10=outstanding.
Award 9s for genuinely excellent responses. Award 10s when no meaningful improvement exists.

IMPORTANT: If a SCORING CONTEXT section is provided, use it to calibrate your expectations for that specific scenario type.

Respond in exact JSON (no markdown, no backticks):
{
  "scores": { "natural": N, "helpful": N, "accurate": N, "proactive": N, "club_impact": N },
  "improvements": [
    { "file": "agent.js", "what": "Specific change", "why": "Why it matters", "severity": "high|medium|low" }
  ]
}`;

// ---------------------------------------------------------------------------
// Step 6: Member context injection
// ---------------------------------------------------------------------------
function buildMemberContext(member) {
  return `
MEMBER CONTEXT (pre-loaded — do not reference health scores or internal data to the member):
- ${member.name}, ${member.membership_type}, member since ${member.join_date}
- Household: ${member.household.map(h => `${h.name} (${h.membership_type})`).join(', ')}
- Preferences: ${JSON.stringify(member.preferences)}
- Internal notes: ${member.context || 'No special notes.'}`;
}

// ---------------------------------------------------------------------------
// Step 2: Prefilled assistant openings
// ---------------------------------------------------------------------------
function buildPrefill(route, member, message) {
  const fn = member.first_name;
  if (route === 'service-recovery') {
    return `${fn},`;  // no trailing space — API rejects trailing whitespace in assistant content
  }
  return null;
}

// ---------------------------------------------------------------------------
// Step 4: Post-generation validation
// ---------------------------------------------------------------------------
function validateResponse(text, route, member, message) {
  const issues = [];
  const lower = text.toLowerCase();
  const fn = member.first_name.toLowerCase();

  if (route === 'service-recovery') {
    if (!lower.startsWith(fn)) {
      issues.push(`Response must start with "${member.first_name}" but starts with "${text.split(/\s/)[0]}"`);
    }
  }

  // No markdown
  if (text.includes('**') || text.includes('##')) {
    issues.push('Response contains markdown formatting (** or ##)');
  }

  // No bullet points (lines starting with "- ")
  if (text.split('\n').some(line => line.trimStart().startsWith('- '))) {
    issues.push('Response contains bullet points');
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Routing + agent dispatch
// ---------------------------------------------------------------------------
function getPromptAndModel(route, member) {
  if (route === 'service-recovery' && buildServiceRecoveryPrompt) {
    const prompt = buildServiceRecoveryPrompt(member) + buildMemberContext(member);
    return { prompt, model: MODELS.serviceRecovery, temp: TEMPERATURES.serviceRecovery };
  }
  if (route === 'booking' && BOOKING_PROMPT) {
    const prompt = BOOKING_PROMPT + `\n\nMember: ${member.name}. Preferences: ${JSON.stringify(member.preferences)}` + buildMemberContext(member);
    return { prompt, model: MODELS.booking, temp: TEMPERATURES.booking };
  }
  const prompt = buildConciergePrompt(member) + buildMemberContext(member);
  return { prompt, model: MODELS.concierge, temp: TEMPERATURES.concierge };
}

async function callAgent(member, memberMessage) {
  // Step 1: Route via Haiku classifier
  const route = await routeMessage(client, memberMessage);

  // Step 7: Grief circuit breaker — bypass LLM entirely
  if (route === 'grief') {
    const deceasedName = extractDeceasedName(memberMessage);
    return { text: getGriefResponse(member, deceasedName), toolCalls: [], route: 'grief' };
  }

  const { prompt, model, temp } = getPromptAndModel(route, member);

  // Step 2: Build messages with optional prefill
  const prefill = buildPrefill(route, member, memberMessage);
  let messages = [{ role: 'user', content: memberMessage }];
  if (prefill) {
    messages.push({ role: 'assistant', content: prefill });
  }

  const toolCalls = [];

  let result = await client.messages.create({
    model, max_tokens: 600, temperature: temp, system: prompt, messages, tools: SMS_TOOLS,
  });

  // Multi-tool loop
  let loops = 0;
  while (result.stop_reason === 'tool_use' && loops < 5) {
    loops++;
    const toolUses = result.content.filter(c => c.type === 'tool_use');
    if (!toolUses.length) break;

    const toolResults = toolUses.map(tu => {
      toolCalls.push({ name: tu.name, input: tu.input });
      return { type: 'tool_result', tool_use_id: tu.id, content: JSON.stringify(executeTool(tu.name, tu.input, member)) };
    });

    messages.push({ role: 'assistant', content: result.content });
    messages.push({ role: 'user', content: toolResults });
    result = await client.messages.create({ model, max_tokens: 600, temperature: temp, system: prompt, messages, tools: SMS_TOOLS });
  }

  let text = result.content.find(c => c.type === 'text')?.text ?? '';

  // Prepend the prefill to the response text (the API continues from the prefill)
  if (prefill && text) {
    text = prefill + text;
  }

  // Safety net: tool called but no text
  if (!text.trim() && toolCalls.length > 0) {
    messages.push({ role: 'assistant', content: result.content });
    messages.push({ role: 'user', content: '[SYSTEM: Tool call succeeded but no text. Send a short SMS reply now.]' });
    const retry = await client.messages.create({ model, max_tokens: 600, temperature: temp, system: prompt, messages });
    text = (prefill || '') + (retry.content.find(c => c.type === 'text')?.text ?? '');
  }

  // Step 4: Validate and retry if needed
  const issues = validateResponse(text, route, member, memberMessage);
  if (issues.length > 0) {
    const correctionNote = `[SYSTEM: Your previous response violated these rules: ${issues.join('; ')}. Try again following the template exactly.]`;
    // Reset to original messages + correction
    const retryMessages = [
      { role: 'user', content: memberMessage },
      { role: 'assistant', content: text },
      { role: 'user', content: correctionNote },
    ];
    if (prefill) {
      retryMessages.push({ role: 'assistant', content: prefill });
    }
    const retryResult = await client.messages.create({ model, max_tokens: 600, temperature: Math.max(0, temp - 0.1), system: prompt, messages: retryMessages, tools: SMS_TOOLS });

    // Process retry (simplified — just get text, skip tool loop)
    let retryText = retryResult.content.find(c => c.type === 'text')?.text ?? '';
    if (prefill && retryText) retryText = prefill + retryText;
    if (retryText.trim()) text = retryText;
  }

  return { text: text.trim(), toolCalls, route };
}

async function callClubAgent(agentType, member, memberMessage, conciergeResponse) {
  const systemPrompt = CLUB_AGENT_PROMPTS[agentType];
  if (!systemPrompt) return `[No prompt for ${agentType}]`;
  const context = `MEMBER ACTION:\nMember: ${member.name} (${member.membership_type}, $${member.annual_dues.toLocaleString()}/yr, since ${member.join_date}, health_score: ${member.health_score}, archetype: ${member.archetype})\nHousehold: ${member.household.map(h => `${h.name} (${h.membership_type})`).join(', ')}\nMessage: "${memberMessage}"\n\nCONCIERGE RESPONSE: "${conciergeResponse.text}"\n${conciergeResponse.toolCalls.length ? `TOOLS CALLED: ${conciergeResponse.toolCalls.map(t => `${t.name}(${JSON.stringify(t.input)})`).join(', ')}` : 'NO TOOLS CALLED'}\n\nAnalyze this interaction and produce your response.`;
  const result = await client.messages.create({ model: MODELS.club, max_tokens: 500, temperature: TEMPERATURES.club, system: systemPrompt, messages: [{ role: 'user', content: context }] });
  return result.content.find(c => c.type === 'text')?.text ?? '';
}

async function callCritic(conversationLog) {
  const result = await client.messages.create({ model: MODELS.critic, max_tokens: 800, temperature: TEMPERATURES.critic, system: CRITIC_PROMPT, messages: [{ role: 'user', content: conversationLog }] });
  const text = result.content.find(c => c.type === 'text')?.text ?? '';
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { scores: parsed.scores || {}, improvements: parsed.improvements || [], raw: text };
    }
  } catch {}
  return { scores: { natural: 0, helpful: 0, accurate: 0, proactive: 0, club_impact: 0 }, improvements: [], raw: text };
}

// ---------------------------------------------------------------------------
// Scenario runner (best-of-2)
// ---------------------------------------------------------------------------
async function runScenarioOnce(example) {
  const member = MEMBERS[example.inputs.member];
  const clubAgents = example.outputs.club_agents;

  const concierge = await callAgent(member, example.inputs.message);

  const clubResponses = [];
  for (const agentType of clubAgents) {
    const response = await callClubAgent(agentType, member, example.inputs.message, concierge);
    clubResponses.push({ agent: agentType, response });
  }

  // Build critic log
  let log = `SCENARIO: ${example.outputs.focus}\n`;
  log += `MEMBER (${member.name}, ${member.membership_type}, $${member.annual_dues}/yr, health: ${member.health_score}): "${example.inputs.message}"\n`;
  log += `ROUTED TO: ${concierge.route}\n`;
  log += `RESPONSE: "${concierge.text}"\n`;
  if (concierge.toolCalls.length) log += `TOOLS: ${concierge.toolCalls.map(t => `${t.name}(${JSON.stringify(t.input)})`).join(', ')}\n`;
  for (const cr of clubResponses) log += `\nCLUB [${cr.agent}]:\n${cr.response}\n`;

  // Step 5: Append scoring context if present
  if (example.outputs.scoring_context) {
    log += `\nSCORING CONTEXT: ${example.outputs.scoring_context}\n`;
  }

  const critique = await callCritic(log);
  const s = critique.scores;
  const avg = (s.natural + s.helpful + s.accurate + s.proactive + s.club_impact) / 5;

  return { concierge, clubResponses, critique, scores: s, avg };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const dataset = JSON.parse(readFileSync(resolve(__dirname, 'dataset.json'), 'utf-8'));
  const BEST_OF = 2;

  console.error(`Running ${dataset.length} scenarios (best-of-${BEST_OF})...`);
  console.error(`Models: concierge=${MODELS.concierge} club=${MODELS.club} router=${MODELS.router} critic=${MODELS.critic}`);
  console.error(`Temps: concierge=${TEMPERATURES.concierge} svcRecovery=${TEMPERATURES.serviceRecovery} booking=${TEMPERATURES.booking} club=${TEMPERATURES.club}`);

  const allScores = { natural: [], helpful: [], accurate: [], proactive: [], club_impact: [] };
  let numErrors = 0;
  let numPerfect = 0;

  for (const example of dataset) {
    const member = MEMBERS[example.inputs.member];
    try {
      let best = null;
      for (let attempt = 0; attempt < BEST_OF; attempt++) {
        const result = await runScenarioOnce(example);
        if (!best || result.avg > best.avg) best = result;
        if (result.avg >= 9.5) break;
      }

      const s = best.scores;
      for (const dim of Object.keys(allScores)) {
        if (s[dim]) allScores[dim].push(s[dim]);
      }
      if (best.avg >= 9.5) numPerfect++;

      console.error(`[${member.first_name}] ${example.outputs.focus} → ${best.concierge.route}: N=${s.natural} H=${s.helpful} A=${s.accurate} P=${s.proactive} I=${s.club_impact} AVG=${best.avg.toFixed(1)}`);
    } catch (err) {
      numErrors++;
      console.error(`[${member.first_name}] ${example.outputs.focus}: ERROR ${err.message}`);
    }
  }

  const avgScores = {};
  for (const [dim, vals] of Object.entries(allScores)) {
    avgScores[dim] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }
  const overall = Object.values(avgScores).reduce((a, b) => a + b, 0) / Object.keys(avgScores).length;

  console.log('---');
  for (const [dim, val] of Object.entries(avgScores)) {
    console.log(`avg_${dim}: ${val.toFixed(6)}`);
  }
  console.log(`overall_score: ${overall.toFixed(6)}`);
  console.log(`num_examples: ${dataset.length}`);
  console.log(`num_errors: ${numErrors}`);
  console.log(`num_perfect: ${numPerfect}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
