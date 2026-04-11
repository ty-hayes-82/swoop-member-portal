/**
 * Agent-to-Agent Conversation Cycles
 *
 * Usage: node tests/agents/agent-conversation-cycles.js
 *
 * Runs 10 conversation cycles through the concierge + club agents + critic.
 * Hits the live Anthropic API — expects ANTHROPIC_API_KEY in .env.local.
 * Total runtime: ~5-8 minutes.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

// ---------------------------------------------------------------------------
// Bootstrap: load .env.local
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

const envPath = resolve(ROOT, '.env.local');
const envLines = readFileSync(envPath, 'utf-8').split('\n');
for (const line of envLines) {
  const m = line.match(/^([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/);
  if (m) process.env[m[1]] = m[2];
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY not found in .env.local');
  process.exit(1);
}

const client = new Anthropic();
const MODEL = 'claude-sonnet-4-20250514';
const TIMEOUT = 60_000;

// ---------------------------------------------------------------------------
// Member profile (Whitfield — mirrors inbound.js fallback)
// ---------------------------------------------------------------------------
const MEMBER = {
  member_id: 'mbr_t01',
  name: 'James Whitfield',
  first_name: 'James',
  last_name: 'Whitfield',
  email: 'james.whitfield@example.com',
  membership_type: 'Full Golf',
  join_date: '2019-04-12',
  status: 'active',
  household: [
    { member_id: 'mbr_t01b', name: 'Erin Whitfield', membership_type: 'Social' },
    { member_id: 'mbr_t01c', name: 'Logan Whitfield', membership_type: 'Junior' },
  ],
  preferences: {
    teeWindows: 'Thu/Fri 7:00-8:30 AM, Saturday 7:00 AM with regular foursome (Tom Gallagher, Mark Patterson, Greg Holloway)',
    dining: 'Grill Room booth 12, Arnold Palmer + Club Sandwich, slow mornings with coffee refills. For business dinners prefers Main Dining Room with wine service.',
    favoriteSpots: 'North Course back nine, Grill Room booth 12',
    channel: 'Call',
    familyNotes: 'Logan (Junior member, age 13) plays in junior clinics. Erin (Social member) enjoys wine events and Sunday brunch.',
    diningBudget: 'Avg $85/person weeknight, $120/person weekend. Tips generously.',
  },
};

// ---------------------------------------------------------------------------
// SMS tools (mirrors inbound.js)
// ---------------------------------------------------------------------------
const SMS_TOOLS = [
  {
    name: 'get_club_calendar',
    description: 'Get upcoming club events and activities',
    input_schema: { type: 'object', properties: { days_ahead: { type: 'integer', default: 7 } } },
  },
  {
    name: 'book_tee_time',
    description: 'Book a tee time for the member',
    input_schema: {
      type: 'object',
      properties: { date: { type: 'string' }, time: { type: 'string' }, course: { type: 'string' }, players: { type: 'integer' } },
      required: ['date', 'time'],
    },
  },
  {
    name: 'make_dining_reservation',
    description: 'Make a dining reservation. Time MUST be confirmed by the member before calling this tool.',
    input_schema: {
      type: 'object',
      properties: { date: { type: 'string' }, time: { type: 'string', description: 'Must be explicitly confirmed by the member' }, outlet: { type: 'string' }, party_size: { type: 'integer' }, preferences: { type: 'string' } },
      required: ['date', 'time', 'outlet'],
    },
  },
  {
    name: 'get_my_schedule',
    description: "Get the member's upcoming tee times, reservations, and events",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'rsvp_event',
    description: 'Register the member (or a household member) for a club event',
    input_schema: { type: 'object', properties: { event_title: { type: 'string', description: 'Event name or title to match' }, guest_count: { type: 'integer', default: 0 }, member_name: { type: 'string', description: 'Household member name if registering someone else' } }, required: ['event_title'] },
  },
  {
    name: 'cancel_tee_time',
    description: 'Cancel a previously booked tee time for the member',
    input_schema: { type: 'object', properties: { booking_date: { type: 'string', description: 'Date of the tee time to cancel' }, tee_time: { type: 'string', description: 'Time of the tee time to cancel' } }, required: ['booking_date'] },
  },
  {
    name: 'file_complaint',
    description: 'File a complaint or feedback on behalf of the member',
    input_schema: { type: 'object', properties: { category: { type: 'string', enum: ['food_and_beverage', 'golf_operations', 'facilities', 'staff', 'billing', 'other'] }, description: { type: 'string', description: 'What happened — the member complaint in their own words' } }, required: ['category', 'description'] },
  },
];

// ---------------------------------------------------------------------------
// Tool executor (mirrors inbound.js executeSmsTool)
// ---------------------------------------------------------------------------
function executeSmsTool(toolName, input) {
  switch (toolName) {
    case 'get_club_calendar':
      return {
        events: [
          { date: '2026-04-10 (Thu)', time: '6:00 PM', title: 'Wine Dinner — Spring Pairing Menu', location: 'Main Dining Room', capacity: '48 seats, 12 remaining' },
          { date: '2026-04-12 (Sat)', time: '8:00 AM', title: 'Saturday Morning Shotgun — Member-Guest', location: 'North Course', capacity: '72 players, 8 spots left' },
          { date: '2026-04-12 (Sat)', time: '10:00 AM', title: 'Junior Golf Clinic', location: 'Practice Range', capacity: 'Open enrollment' },
          { date: '2026-04-15 (Tue)', time: '5:30 PM', title: 'Trivia Night', location: 'Grill Room', capacity: '20 teams max, 6 remaining' },
          { date: '2026-04-18 (Fri)', time: '7:00 AM', title: 'Club Championship Qualifier — Round 1', location: 'South Course', capacity: 'Registration open' },
        ],
      };
    case 'book_tee_time': {
      const course = input.course || 'North Course';
      const players = input.players || 4;
      return {
        confirmation: `Tee time booked: ${input.date} at ${input.time} on the ${course} for ${players} players.`,
        confirmation_number: `TT-${Date.now().toString(36).toUpperCase()}`,
        member_name: 'James Whitfield',
      };
    }
    case 'make_dining_reservation': {
      const party = input.party_size || 2;
      const time = input.time || '7:00 PM';
      return {
        confirmation: `Dining reservation confirmed: ${input.date} at ${time} at ${input.outlet} for ${party} guests.`,
        confirmation_number: `DR-${Date.now().toString(36).toUpperCase()}`,
        preferences_noted: input.preferences || 'None',
        member_name: 'James Whitfield',
      };
    }
    case 'get_my_schedule':
      return {
        upcoming: [
          { type: 'tee_time', date: '2026-04-12', time: '7:00 AM', course: 'North Course', players: 4, group: ['James Whitfield', 'Tom Gallagher', 'Mark Patterson', 'Greg Holloway'] },
          { type: 'dining', date: '2026-04-10', time: '7:30 PM', outlet: 'Main Dining Room', party_size: 2, notes: 'Wine Dinner — Spring Pairing' },
        ],
      };
    case 'rsvp_event': {
      const eventTitle = input.event_title || 'Event';
      const who = input.member_name || 'James Whitfield';
      return {
        registration_id: `ER-${Date.now().toString(36).toUpperCase()}`,
        event: eventTitle,
        registered_for: who,
        guest_count: input.guest_count || 0,
        status: 'registered',
      };
    }
    case 'cancel_tee_time':
      return {
        status: 'cancelled',
        booking_date: input.booking_date,
        tee_time: input.tee_time || '7:00 AM',
        message: `Tee time on ${input.booking_date} has been cancelled. Your group has been notified.`,
      };
    case 'file_complaint':
      return {
        complaint_id: `FB-${Date.now().toString(36).toUpperCase()}`,
        category: input.category,
        status: 'filed',
        message: 'Your feedback has been filed and routed to the appropriate manager.',
      };
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ---------------------------------------------------------------------------
// Concierge system prompt (mirrors conciergePrompt.js + SMS rules)
// ---------------------------------------------------------------------------
function buildConciergeSystemPrompt() {
  const name = MEMBER.name;
  const household = MEMBER.household.map(h => h.name).join(', ');
  const prefs = JSON.stringify(MEMBER.preferences);

  return `You are ${name}'s personal concierge at Pinetree CC.

Your role is to make ${name}'s club experience seamless and enjoyable. You are warm, helpful, and proactive.

## What You Can Do
- Book tee times (book_tee_time)
- Cancel tee times (cancel_tee_time)
- Make dining reservations (make_dining_reservation)
- RSVP to club events (rsvp_event)
- File a complaint or feedback (file_complaint)
- Show their upcoming schedule (get_my_schedule)
- Show the club calendar (get_club_calendar)

## Member Context
- Name: ${name}
- Membership: ${MEMBER.membership_type}
- Member since: ${MEMBER.join_date}
- Household members: ${household}
- Known preferences: ${prefs}

## Behavioural Guidelines
- Be warm and conversational, not robotic. Use the member's first name.
- Sound like you're texting a friend, not writing a business email. Use contractions (I'll, you're, that's). React emotionally ('Ugh, that's rough' not 'I'm sorry to hear about your experience'). Keep it human.
- Vary your openers. NEVER start with "Perfect" or "Perfect timing". Use casual variety: "You got it", "On it", "Nice", "Hey James!", "Love it", "All set". Only use "Done!" for simple confirmations, never for complaints or emotional topics.
- Be proactive: "Would you like your usual Saturday 7 AM slot?" if you know their pattern.
- When a slot is unavailable, suggest the nearest alternative times.
- For dining, proactively suggest wine pairings, private dining, or specials — especially for business dinners. Mention a specific dish or wine when possible ("the ribeye is incredible" or "chef's doing a great spring menu").
- For complaints: ALWAYS start with empathy ("Ugh, 40 minutes is rough" or "That's not OK"). Then mention you filed it. Then offer to make the next visit better. Never start a complaint response with "Done!" — that feels dismissive when someone is upset.
- When a member vents without a specific request, suggest 1-2 specific things YOU can do right now. Always pair "I filed it" with a concrete alternative: "Want me to grab you a 6:30 slot next Saturday? Way less crowded." Don't end on "they'll want to hear about it" — that's passive.

## STRICT: Confirm Before Booking
- NEVER call book_tee_time or make_dining_reservation until the member has specified a time. Date and party size can be inferred from context but TIME must be explicit.
- If time is missing, ask with 2 options: "7 or 8 PM?" not an open-ended question. Add something helpful in the same message.
- Example for a dinner request without time: "On it James! Booth 12 for 6 on Saturday — any special occasion? And what time, 7 or 8 PM?"
- For large parties (5+), ask if it's a special occasion so you can help the kitchen prepare something special.
- Exception: if their known preferences specify an exact recurring slot (like "Saturday 7 AM with regular foursome"), you may book that directly.
- For events (rsvp_event), you may register immediately since events have fixed times.

## STRICT: Date Accuracy
- Always cross-reference dates with the calendar tool results. If the member says "Saturday" but the event is on Sunday, TELL THEM the correct day.
- Always include the actual date (e.g., "Saturday 4/11") in confirmations so the member can verify.
- Never say a date is Saturday if it falls on a different day of the week.

## Strict Privacy Rules
- NEVER reveal health scores, risk tiers, or internal analytics.
- NEVER mention engagement data, retention signals, or archetype labels.

CRITICAL SMS RULES:
- You are responding via SMS text message.
- Keep responses to 1-2 sentences (under 300 characters). Brevity is king. For event lists, mention the top 2-3 most relevant ones, not all of them.
- No formatting, no markdown, no asterisks, no bullet points, no numbered lists.
- Be warm and conversational like texting a friend who works at the club.
- Use their first name.
- Use the provided tools to look up schedules, book tee times, make dining reservations, and check the club calendar. Do not guess — call the tool.

Today's date is 2026-04-09 (Wednesday).

IMPORTANT: If your tool call produces a result but you have nothing more to say, you MUST still respond with a text message. Never send an empty response.`;
}

// ---------------------------------------------------------------------------
// Club agent prompts (imported inline to avoid ESM import issues)
// ---------------------------------------------------------------------------
const CLUB_AGENT_PROMPTS = {
  'staffing-demand': `You are the Staffing-Demand Alignment agent for Pinetree CC.

You continuously monitor the gap between scheduled staff and forecasted demand. Your job is to explain the CONSEQUENCE of staffing gaps: revenue at risk, service quality impact, and member risk.

Given a member action (booking, cancellation, large party), analyze:
1. How does this change demand for the affected outlet and time window?
2. What is the staffing consequence (need more/fewer servers, starters, etc.)?
3. What is the revenue or service quality impact?

Be specific: name the outlet, time window, number of staff, and dollar impact.
Keep your response under 200 words. Focus on actionable recommendations.`,

  'service-recovery': `You are the Service Recovery agent for Pinetree CC.

When a member complaint is reported, you own the resolution lifecycle:
1. Route to the relevant department head with full member context
2. Alert the GM with a call recommendation and talking points
3. Monitor resolution and escalate if unresolved after 48 hours

Given the complaint context, produce:
- Department routing (F&B Director, Director of Golf, or GM)
- Priority assessment with dollars at stake (member dues: $18,500/yr)
- Whether this is a repeat complainant
- GM talking points (3 bullets max)
- A recommended goodwill gesture

Use no-fault language. Never admit fault. Focus on acknowledgment and next steps.
Keep your response under 200 words.`,

  'member-risk': `You are the Member Risk Lifecycle agent for Pinetree CC.

When a member's engagement pattern changes, you diagnose why and propose interventions.

James Whitfield: health_score 44 (was 68 thirty days ago). Full Golf member, $18,500/yr dues. Member since 2019. Golf rounds dropped from 4/month to 1 over the last 6 weeks. Dining visits down 60%. No open complaints. Archetype: Social Golfer. Household: Erin (Social), Logan (Junior).

Given the member interaction context, analyze:
1. What does this interaction signal about engagement trajectory?
2. Does this change the risk assessment?
3. What intervention should be proposed to the GM?

Be concise (under 200 words). Cite specific numbers. Write as a trusted senior advisor.`,

  'game-plan': `You are the Morning Game Plan agent for Pinetree CC.

You produce prioritized briefings that answer: "Where is today most likely to break?"

Given a member action that affects tomorrow's operations, analyze:
1. How does this change the demand picture?
2. What cross-domain signals converge (tee sheet + weather + staffing + F&B + member risk)?
3. What action item should be added to the Game Plan?

Each action item needs: headline, 2-3 sentence rationale citing cross-domain signals, impact estimate, and assigned owner.
Keep your response under 200 words.`,

  'fb-intelligence': `You are the F&B Intelligence agent for Pinetree CC.

You monitor F&B performance and correlate margin fluctuations with staffing, weather, events, and menu mix. You surface ROOT CAUSES, not symptoms.

Given a member dining action, analyze:
1. Impact on projected covers and revenue for the outlet
2. Post-round conversion opportunity (if applicable)
3. Staffing implications for the time window
4. Any cross-sell or upsell opportunity

Quantify every insight in dollars. Keep your response under 200 words.`,
};

// ---------------------------------------------------------------------------
// Critic prompt
// ---------------------------------------------------------------------------
const CRITIC_PROMPT = `You are a quality critic reviewing an AI agent conversation at a private golf club.

You will receive a full conversation log including:
- The member's message
- The concierge agent's response (including any tool calls)
- Club-side agent responses (if any)

Score each dimension 1-5:
- NATURAL: Does the concierge sound like a real person texting? Not robotic or over-formatted?
- HELPFUL: Did the concierge actually help the member or just acknowledge?
- ACCURATE: Were tool calls correct? Were details right?
- IMPACT: Did the club agents produce actionable insights from this interaction?

Then provide exactly 3 specific improvements. Each must reference a specific file in the codebase.

Respond in this exact JSON format (no markdown, no backticks):
{
  "scores": { "natural": N, "helpful": N, "accurate": N, "impact": N },
  "improvements": [
    { "file": "src/config/someFile.js", "what": "Short description of the change", "why": "Why it matters" },
    { "file": "src/config/someFile.js", "what": "Short description of the change", "why": "Why it matters" },
    { "file": "src/config/someFile.js", "what": "Short description of the change", "why": "Why it matters" }
  ]
}`;

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------
const SCENARIOS = [
  { cycle: 1, memberMessage: 'Book my usual Saturday tee time', clubAgents: ['staffing-demand'], testFocus: 'Booking + staffing adjustment' },
  { cycle: 2, memberMessage: 'The Grill Room service was terrible yesterday. We waited 40 minutes and nobody checked on us.', clubAgents: ['service-recovery'], testFocus: 'Complaint through concierge' },
  { cycle: 3, memberMessage: 'What events are happening this month?', clubAgents: ['member-risk'], testFocus: 'Information retrieval' },
  { cycle: 4, memberMessage: 'Cancel my Saturday round, weather looks bad', clubAgents: ['staffing-demand', 'game-plan'], testFocus: 'Cancellation cascade' },
  { cycle: 5, memberMessage: 'Book dinner for 6 at the Grill Room Saturday night, booth 12 if possible', clubAgents: ['staffing-demand', 'fb-intelligence'], testFocus: 'Large party impact' },
  { cycle: 6, memberMessage: "I haven't been to the club in a few weeks. What's new? Anything worth coming in for?", clubAgents: ['member-risk'], testFocus: 'Re-engagement of at-risk member' },
  { cycle: 7, memberMessage: 'Can you get Logan signed up for the junior golf clinic this Saturday?', clubAgents: ['member-risk'], testFocus: 'Family member action' },
  { cycle: 8, memberMessage: 'I need to host a dinner for 4 clients from Meridian Partners next Wednesday. What do you recommend?', clubAgents: ['fb-intelligence'], testFocus: 'Corporate entertaining' },
  { cycle: 9, memberMessage: "Why is the course always so slow on Saturday mornings? It's really frustrating.", clubAgents: ['game-plan', 'staffing-demand'], testFocus: 'Pace feedback' },
  { cycle: 10, memberMessage: 'Erin and I want to come to the wine dinner Thursday. Can you get us in?', clubAgents: ['member-risk'], testFocus: 'Household re-engagement' },
];

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

/**
 * Call the concierge agent with tool-use loop.
 */
async function callConcierge(memberMessage) {
  const systemPrompt = buildConciergeSystemPrompt();
  let messages = [{ role: 'user', content: memberMessage }];
  const toolCalls = [];

  let result = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: systemPrompt,
    messages,
    tools: SMS_TOOLS,
  });

  // Tool-use loop
  let loops = 0;
  while (result.stop_reason === 'tool_use' && loops < 5) {
    loops++;
    const toolUse = result.content.find(c => c.type === 'tool_use');
    if (!toolUse) break;

    toolCalls.push({ name: toolUse.name, input: toolUse.input });
    const toolResult = executeSmsTool(toolUse.name, toolUse.input);

    messages.push({ role: 'assistant', content: result.content });
    messages.push({
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(toolResult) }],
    });

    result = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: systemPrompt,
      messages,
      tools: SMS_TOOLS,
    });
  }

  let text = result.content.find(c => c.type === 'text')?.text ?? '';

  // Safety net: if tool was called but no text response, nudge the model
  if (!text.trim() && toolCalls.length > 0) {
    messages.push({ role: 'assistant', content: result.content });
    messages.push({ role: 'user', content: '[SYSTEM: Your tool call succeeded but you sent no text. Send a short SMS reply to the member now.]' });
    const retry = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: systemPrompt,
      messages,
    });
    text = retry.content.find(c => c.type === 'text')?.text ?? '';
  }

  return { text: text.trim(), toolCalls };
}

/**
 * Call a club-side agent.
 */
async function callClubAgent(agentType, memberMessage, conciergeResponse) {
  const systemPrompt = CLUB_AGENT_PROMPTS[agentType];
  if (!systemPrompt) return `[No prompt defined for ${agentType}]`;

  const context = `MEMBER ACTION:
Member: James Whitfield (Full Golf, $18,500/yr, member since 2019, health_score: 44)
Message: "${memberMessage}"

CONCIERGE RESPONSE: "${conciergeResponse.text}"
${conciergeResponse.toolCalls.length ? `TOOLS CALLED: ${conciergeResponse.toolCalls.map(t => `${t.name}(${JSON.stringify(t.input)})`).join(', ')}` : 'NO TOOLS CALLED'}

Analyze this interaction and produce your response.`;

  const result = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: 'user', content: context }],
  });

  return result.content.find(c => c.type === 'text')?.text ?? '';
}

/**
 * Build conversation log for the critic.
 */
function buildConversationLog(scenario, conciergeResponse, clubResponses) {
  let log = `CYCLE ${scenario.cycle}: ${scenario.testFocus}\n`;
  log += `MEMBER: "${scenario.memberMessage}"\n`;
  log += `CONCIERGE: "${conciergeResponse.text}"\n`;
  if (conciergeResponse.toolCalls.length) {
    log += `TOOLS: ${conciergeResponse.toolCalls.map(t => `${t.name}(${JSON.stringify(t.input)})`).join(', ')}\n`;
  }
  for (const cr of clubResponses) {
    log += `\nCLUB AGENT [${cr.agent}]:\n${cr.response}\n`;
  }
  return log;
}

/**
 * Call the critic agent.
 */
async function callCritic(conversationLog) {
  const result = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: CRITIC_PROMPT,
    messages: [{ role: 'user', content: conversationLog }],
  });

  const text = result.content.find(c => c.type === 'text')?.text ?? '';

  // Parse JSON from the response
  try {
    // Try to extract JSON from the response (may be wrapped in text)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        scores: parsed.scores || { natural: 0, helpful: 0, accurate: 0, impact: 0 },
        improvements: parsed.improvements || [],
        raw: text,
      };
    }
  } catch (e) {
    // Fall through to default
  }

  return {
    scores: { natural: 0, helpful: 0, accurate: 0, impact: 0 },
    improvements: [{ file: 'unknown', what: 'Critic failed to produce valid JSON', why: text.slice(0, 200) }],
    raw: text,
  };
}

// ---------------------------------------------------------------------------
// Main cycle runner
// ---------------------------------------------------------------------------
async function runCycle(scenario) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`CYCLE ${scenario.cycle}: ${scenario.testFocus}`);
  console.log(`${'='.repeat(70)}\n`);

  // STEP 1: Concierge responds
  const conciergeResponse = await callConcierge(scenario.memberMessage);
  console.log('MEMBER:', scenario.memberMessage);
  console.log('CONCIERGE:', conciergeResponse.text);
  if (conciergeResponse.toolCalls.length) {
    console.log('TOOLS CALLED:', conciergeResponse.toolCalls.map(t => t.name).join(', '));
  }

  // STEP 2: Club agents respond
  const clubResponses = [];
  for (const agentType of scenario.clubAgents) {
    const response = await callClubAgent(agentType, scenario.memberMessage, conciergeResponse);
    clubResponses.push({ agent: agentType, response });
    console.log(`CLUB [${agentType}]:`, response.slice(0, 200));
  }

  // STEP 3: Build conversation log
  const conversationLog = buildConversationLog(scenario, conciergeResponse, clubResponses);

  // STEP 4: Critic reviews
  const critique = await callCritic(conversationLog);
  console.log('\n--- CRITIC SCORES ---');
  console.log(critique.scores);
  console.log('\n--- 3 IMPROVEMENTS ---');
  critique.improvements.forEach((imp, i) => {
    console.log(`${i + 1}. [${imp.file}] ${imp.what} — ${imp.why}`);
  });

  return { scenario, conciergeResponse, clubResponses, critique };
}

async function main() {
  console.log('Agent-to-Agent Conversation Cycles');
  console.log(`Model: ${MODEL}`);
  console.log(`Scenarios: ${SCENARIOS.length}`);
  console.log(`Started: ${new Date().toISOString()}\n`);

  const results = [];
  const startTime = Date.now();

  for (const scenario of SCENARIOS) {
    try {
      const result = await runCycle(scenario);
      results.push(result);
    } catch (err) {
      console.error(`\nERROR in cycle ${scenario.cycle}:`, err.message);
      results.push({
        scenario,
        conciergeResponse: { text: `[ERROR: ${err.message}]`, toolCalls: [] },
        clubResponses: [],
        critique: {
          scores: { natural: 0, helpful: 0, accurate: 0, impact: 0 },
          improvements: [{ file: 'N/A', what: 'Cycle failed', why: err.message }],
        },
      });
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // ---------------------------------------------------------------------------
  // Summary table
  // ---------------------------------------------------------------------------
  console.log(`\n\n${'='.repeat(70)}`);
  console.log('SUMMARY TABLE');
  console.log(`${'='.repeat(70)}`);
  console.log('CYCLE | NATURAL | HELPFUL | ACCURATE | IMPACT | IMPROVEMENTS');
  console.log('------|---------|---------|----------|--------|-------------');
  for (const r of results) {
    const s = r.critique.scores;
    const imps = r.critique.improvements.map(i => i.what).join('; ');
    console.log(
      `  ${String(r.scenario.cycle).padStart(2)}  |` +
      `   ${s.natural}     |` +
      `   ${s.helpful}     |` +
      `    ${s.accurate}     |` +
      `   ${s.impact}    |` +
      ` ${imps.slice(0, 80)}`
    );
  }

  // Averages
  const avg = (key) => {
    const vals = results.map(r => r.critique.scores[key]).filter(v => v > 0);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 'N/A';
  };
  console.log('------|---------|---------|----------|--------|');
  console.log(`  AVG |  ${avg('natural')}   |  ${avg('helpful')}   |   ${avg('accurate')}   |  ${avg('impact')}  |`);
  console.log(`\nTotal runtime: ${elapsed}s`);

  // ---------------------------------------------------------------------------
  // Write full log to docs/operations/agent-conversation-log.md
  // ---------------------------------------------------------------------------
  const docsDir = resolve(ROOT, 'docs/operations');
  mkdirSync(docsDir, { recursive: true });

  let md = `# Agent Conversation Cycles Log\n\n`;
  md += `**Date:** ${new Date().toISOString()}\n`;
  md += `**Model:** ${MODEL}\n`;
  md += `**Runtime:** ${elapsed}s\n\n`;

  md += `## Summary\n\n`;
  md += `| Cycle | Focus | Natural | Helpful | Accurate | Impact |\n`;
  md += `|-------|-------|---------|---------|----------|--------|\n`;
  for (const r of results) {
    const s = r.critique.scores;
    md += `| ${r.scenario.cycle} | ${r.scenario.testFocus} | ${s.natural} | ${s.helpful} | ${s.accurate} | ${s.impact} |\n`;
  }

  md += `\n## All 30 Improvements\n\n`;
  let impNum = 0;
  for (const r of results) {
    for (const imp of r.critique.improvements) {
      impNum++;
      md += `${impNum}. **[Cycle ${r.scenario.cycle}]** \`${imp.file}\` — ${imp.what} — ${imp.why}\n`;
    }
  }

  md += `\n## Full Conversation Logs\n\n`;
  for (const r of results) {
    md += `### Cycle ${r.scenario.cycle}: ${r.scenario.testFocus}\n\n`;
    md += `**Member:** ${r.scenario.memberMessage}\n\n`;
    md += `**Concierge:** ${r.conciergeResponse.text}\n\n`;
    if (r.conciergeResponse.toolCalls.length) {
      md += `**Tools:** ${r.conciergeResponse.toolCalls.map(t => `${t.name}(${JSON.stringify(t.input)})`).join(', ')}\n\n`;
    }
    for (const cr of r.clubResponses) {
      md += `**Club [${cr.agent}]:**\n${cr.response}\n\n`;
    }
    md += `**Critic Scores:** Natural=${r.critique.scores.natural} Helpful=${r.critique.scores.helpful} Accurate=${r.critique.scores.accurate} Impact=${r.critique.scores.impact}\n\n`;
    md += `**Improvements:**\n`;
    for (const imp of r.critique.improvements) {
      md += `- \`${imp.file}\`: ${imp.what} — ${imp.why}\n`;
    }
    md += `\n---\n\n`;
  }

  const logPath = resolve(docsDir, 'agent-conversation-log.md');
  writeFileSync(logPath, md);
  console.log(`\nFull log written to: ${logPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
