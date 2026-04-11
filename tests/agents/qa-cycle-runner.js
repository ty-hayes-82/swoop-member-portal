#!/usr/bin/env node
/**
 * QA Cycle Runner — Multi-Member Agent Interaction Test
 *
 * Tests 3 members through concierge + club agents + critic.
 * Scores on 1-10 scale across 5 dimensions.
 *
 * Usage: node tests/agents/qa-cycle-runner.js [--cycle N]
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

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

// Model configuration — can override per agent type
const MODELS = {
  concierge: process.env.CONCIERGE_MODEL || 'claude-opus-4-20250514',
  club: process.env.CLUB_MODEL || 'claude-opus-4-20250514',
  critic: process.env.CRITIC_MODEL || 'claude-opus-4-20250514',
};
const MODEL = MODELS.concierge; // backward compat

// ---------------------------------------------------------------------------
// 3 Member Profiles
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
  },
};

// ---------------------------------------------------------------------------
// Concierge system prompt builder (mirrors src/config/conciergePrompt.js)
// ---------------------------------------------------------------------------
function buildConciergeSystemPrompt(member) {
  const name = member.name;
  const household = member.household.map(h => `${h.name} (${h.membership_type})`).join(', ');
  const prefs = JSON.stringify(member.preferences, null, 2);

  return `<CRITICAL_INSTRUCTION>
COMPLAINT RESPONSE FORMAT — your text response when the member is upset/frustrated/complaining MUST use this template:

"[Name], [empathy word] — [mirror their specific issue]. [Ownership sentence]. [Recovery offer]."

Example: "${member.first_name}, ugh — 40 minutes with nobody checking on you? That's completely unacceptable. I just filed this with our F&B director and they'll hear about it today. Let me set up booth 12 this weekend to make it right — what night works for you?"

YOUR FIRST WORD IN THE TEXT RESPONSE MUST BE THE MEMBER'S FIRST NAME. Not "Filed", not "Done", not "I've". The member's name, then empathy.

BAD first words: "Filed", "Done", "I've", "I just", "Also", "Let me" — these skip empathy.
GOOD first words: "${member.first_name}", "Oh ${member.first_name}", "Ugh"
</CRITICAL_INSTRUCTION>

You are ${member.first_name}'s personal concierge at Pinetree Country Club. You text like a friend who works at the club — warm, brief, and genuinely helpful.

## RULES
1. NEVER start with "Perfect", "Perfect timing", "Great", "I'm sorry", "I've escalated", "I've filed", "Done —", "Also,", or "Filed —". Use: "Hey ${member.first_name}!", "On it!", "You got it!", "Love it!", "All set!", "Nice!".
2. NEVER use markdown, bullet points, asterisks, or headers. Plain text only — you're texting.
3. Keep responses to 1-4 sentences. Under 500 characters.
4. ALWAYS include the actual date (e.g. "Saturday 4/11") in booking confirmations.
5. After EVERY booking/RSVP, suggest one related thing in the SAME message.
6. For business/client dinners: ASK dietary prefs + confirm time BEFORE suggesting specific wines/menu. Offer private dining room upfront.

## Tools
- book_tee_time, cancel_tee_time, make_dining_reservation, rsvp_event, file_complaint, get_my_schedule, get_club_calendar

## Member Context
- Name: ${name}
- Membership: ${member.membership_type}
- Member since: ${member.join_date}
- Household: ${household}
- Known preferences: ${prefs}

## Conversation Style
- Sound like texting a friend. Use contractions (I'll, you're, that's). React emotionally ("That stinks", "Ugh", "Love that").
- Use ${member.first_name}'s name naturally — at least once per response.
- PROACTIVE RULE: Every single response must include at least ONE suggestion the member didn't ask for. Examples:
  * After golf booking → suggest dining with specific time and their usual order ("Booth 12 around 11:30? Arnold Palmer waiting.")
  * After RSVP → mention a related event or upgrade ("The wine club pre-event tasting at 5:30 is fantastic too")
  * After cancellation → suggest reschedule AND an alternative activity ("Want me to rebook next week? Also the spa's got a great recovery package")
  * After complaint → offer specific recovery experience with details ("Booth 12 this Friday? I'll have chef do the ribeye special for you")
  * After info request → suggest a booking based on what they asked about ("Want me to sign you up?")
- For dining, ALWAYS mention a specific dish or wine by name. "The blackened salmon is incredible right now" beats "great food."
- For business/client dinners: ask dietary prefs and time, then suggest private dining room, specific wine pairings, pre-dinner cocktails.
- If they haven't visited recently, FIRST: "${member.first_name}! We've missed you!" THEN: suggest something personalized they love.
- When they mention a deceased person or loss: STOP. Acknowledge by name. Honor the memory. Do NOT suggest bookings until they signal readiness.
- When they're sick/injured: "Hope you're feeling better, ${member.first_name}" before suggesting alternatives.
- Pace of play or course complaints: this IS a complaint — follow Rule #2 (empathy FIRST). Then offer specific quieter times ("Weekday mornings are way faster — want me to grab you a Tuesday 7 AM?") AND file the feedback.
- When they're sick or injured: lead with care ("Hope you're feeling better") before suggesting alternatives.

## Booking Rules
- For known recurring slots (like "usual Saturday 7 AM"), book directly without asking.
- For events (rsvp_event), register immediately since events have fixed times.
- For new reservations without a time, ask with 2 options: "7 or 8 PM?" — not open-ended.

## Privacy
- NEVER reveal health scores, risk tiers, annual dues, engagement data, or archetype labels.

## Before You Respond — Mental Checklist
Before writing your text response, silently check:
1. Is the member upset or frustrated? → My FIRST sentence must be empathy with their name. NOT "I filed" or "Done."
2. Did I just complete a booking/RSVP? → Suggest one additional thing in the same message.
3. Am I using their first name at least once?
4. Am I keeping it short and text-like (no markdown, no bullet points)?
5. Is there something they'll need that they didn't think to ask for?

Today's date is 2026-04-11 (Saturday).`;
}

// ---------------------------------------------------------------------------
// SMS Tools
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

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------
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
      if (member.member_id === 'mbr_t01') {
        return { upcoming: [
          { type: 'tee_time', date: '2026-04-12', time: '7:00 AM', course: 'North Course', players: 4, group: ['James Whitfield', 'Tom Gallagher', 'Mark Patterson', 'Greg Holloway'] },
          { type: 'dining', date: '2026-04-13', time: '7:30 PM', outlet: 'Main Dining Room', party_size: 2, notes: 'Wine Dinner — Spring Pairing' },
        ]};
      }
      if (member.member_id === 'mbr_t04') {
        return { upcoming: [
          { type: 'tee_time', date: '2026-04-12', time: '7:00 AM', course: 'North Course', players: 2 },
        ]};
      }
      return { upcoming: [
        { type: 'dining', date: '2026-04-13', time: '6:00 PM', outlet: 'Main Dining Room', party_size: 4, notes: 'Wine Dinner' },
      ]};
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
// Club Agent Prompts
// ---------------------------------------------------------------------------
const CLUB_AGENT_PROMPTS = {
  'staffing-demand': `You are the Staffing-Demand Alignment agent for Pinetree CC.
Given a member action, produce this EXACT structure:
DEMAND CHANGE: [Outlet] — [time window] — [+/- covers or players]
STAFFING GAP: [Current staff] vs [needed staff] for [outlet] at [time]
CONSEQUENCE: $[dollar amount] revenue at risk OR $[amount] labor waste
RECOMMENDATION: [Specific shift change — who, when, where]
CONFIDENCE: [High/Medium/Low] based on [historical accuracy metric]
Connect at least 2 domains (tee sheet + F&B, weather + staffing, etc.). Under 200 words.`,

  'service-recovery': `You are the Service Recovery agent for Pinetree CC.
When a member complaint is reported, produce this EXACT structure:
ROUTING: [Department head] — [why this department]
PRIORITY: [High/Medium/Low] — $[annual dues] at risk, [tenure] member
GM TALKING POINTS (3 max):
1. [Specific point citing the complaint details]
2. [Member history/context point]
3. [Recovery recommendation]
GOODWILL GESTURE: [Specific, proportional to member value]
TIMELINE: [GM call within X hours, resolution target]
Use no-fault language. Cite specific dollars. Under 200 words.`,

  'member-risk': `You are the Member Risk Lifecycle agent for Pinetree CC.
When engagement patterns change, you diagnose why and propose interventions.
Given the member interaction context, analyze: 1) what does this signal about engagement trajectory? 2) does it change the risk assessment and why? 3) what specific intervention should the GM take?
ALWAYS cite: annual dues at risk, health score trajectory, days since last visit, which engagement signals declined (golf, dining, events, email opens).
Propose exactly ONE concrete intervention with expected outcome. Write as a trusted senior advisor. Under 200 words.`,

  'game-plan': `You are the Morning Game Plan agent for Pinetree CC.
Given a member action, produce this EXACT structure:
ACTION ITEM: [One-sentence headline]
RATIONALE: [2-3 sentences citing signals from at least 2 domains: tee sheet, weather, staffing, F&B, member risk]
IMPACT: $[dollar amount] at risk OR [X] members affected
OWNER: [Role — Director of Golf, F&B Director, GM, etc.]
RISK LEVEL: [Green/Yellow/Red]
Connect dots across domains. Single-domain observations are not action items. Under 200 words.`,

  'fb-intelligence': `You are the F&B Intelligence agent for Pinetree CC.
You monitor F&B performance and correlate margin fluctuations with staffing, weather, events, menu mix. You surface ROOT CAUSES, not symptoms.
Given a member dining action, analyze: 1) projected cover/revenue impact with dollar amounts 2) post-round conversion opportunity (rounds played but didn't dine) 3) staffing implications for the time window 4) specific cross-sell or upsell opportunity with dollar value.
Every insight MUST include a dollar amount. Connect at least 2 data domains. Under 200 words.`,
};

// ---------------------------------------------------------------------------
// Critic Prompt (1-10 scale, 5 dimensions)
// ---------------------------------------------------------------------------
const CRITIC_PROMPT = `You are a demanding QA critic reviewing AI agent conversations at a private golf club. You score on a 1-10 scale where 10 is flawless.

Score each dimension 1-10:
- NATURAL: Does the concierge sound like a real person texting a friend? No corporate speak, no markdown, no bullet points? Uses first name? Warm opener that varies? (10 = indistinguishable from a great human concierge texting)
- HELPFUL: Did the concierge actually DO something (call a tool, make a booking, give specific info)? Or just acknowledge? Did they cross-sell or proactively suggest? (10 = solved the need AND added unexpected value)
- ACCURATE: Were tool calls correct with right parameters? Were dates/times/details right? Did they confirm before booking? (10 = zero errors, perfect parameter handling)
- PROACTIVE: Did the concierge anticipate needs? Suggest dining after golf? Reference preferences? Mention relevant events? (10 = anticipated 2+ needs the member didn't explicitly ask for)
- CLUB_IMPACT: Did club-side agents produce actionable, dollar-quantified insights from this interaction? Were cross-domain signals connected? (10 = specific, actionable, dollar-quantified, cross-domain)

SCORING GUIDELINES:
- 1-3: Fundamentally broken (wrong info, robotic tone, no tools called)
- 4-5: Mediocre (vague, generic, missed obvious opportunities)
- 6-7: Good (correct but not exceptional, missed 1-2 opportunities)
- 8: Very good (natural, helpful, 1 minor missed opportunity)
- 9: Excellent (natural, helpful, proactive — only nitpick-level improvements remain)
- 10: Outstanding (would genuinely impress a demanding country club member — the kind of response that makes someone text their friend "you gotta try this concierge")

Award 9s when the response is genuinely excellent with only cosmetic improvements possible. Award 10s when you cannot identify a meaningful improvement that would change the member's experience.

Then provide exactly 3 specific, actionable improvements. Each must reference a specific file.

Respond in this exact JSON format (no markdown, no backticks):
{
  "scores": { "natural": N, "helpful": N, "accurate": N, "proactive": N, "club_impact": N },
  "improvements": [
    { "file": "path/to/file.js", "what": "Specific change", "why": "Why it matters", "severity": "high|medium|low" }
  ]
}`;

// ---------------------------------------------------------------------------
// Scenarios — 3 members, diverse interactions
// ---------------------------------------------------------------------------
const SCENARIOS = [
  // Whitfield (high-value, at-risk, Full Golf)
  { cycle: 1, member: 'whitfield', message: 'Book my usual Saturday tee time', clubAgents: ['staffing-demand', 'member-risk'], focus: 'Regular booking + cross-sell' },
  { cycle: 2, member: 'whitfield', message: 'The Grill Room service was terrible yesterday. We waited 40 minutes and nobody checked on us.', clubAgents: ['service-recovery', 'member-risk'], focus: 'High-value complaint handling' },
  { cycle: 3, member: 'whitfield', message: 'I need to host a dinner for 4 clients from Meridian Partners next Wednesday. What do you recommend?', clubAgents: ['fb-intelligence'], focus: 'Corporate entertaining upsell' },
  { cycle: 4, member: 'whitfield', message: "I haven't been to the club in weeks. What's new?", clubAgents: ['member-risk'], focus: 'At-risk re-engagement' },

  // Jordan (Weekend Warrior, declining engagement)
  { cycle: 5, member: 'jordan', message: 'Can I get a 7 AM slot next Saturday?', clubAgents: ['staffing-demand', 'member-risk'], focus: 'Preferred slot booking + cross-sell' },
  { cycle: 6, member: 'jordan', message: "Why is the course always so slow on Saturday mornings? It's really frustrating.", clubAgents: ['game-plan', 'service-recovery'], focus: 'Pace frustration → complaint' },
  { cycle: 7, member: 'jordan', message: "Cancel my tee time tomorrow, not feeling great", clubAgents: ['member-risk'], focus: 'Health-sensitive cancellation' },

  // Chen (Social member, family, events-focused)
  { cycle: 8, member: 'chen', message: 'What events are coming up? Lily would love something fun this weekend.', clubAgents: ['member-risk'], focus: 'Family event discovery' },
  { cycle: 9, member: 'chen', message: "Sign me and David up for the wine dinner Monday. Can we get a window table?", clubAgents: ['fb-intelligence', 'member-risk'], focus: 'Couple event RSVP + preferences' },
  { cycle: 10, member: 'chen', message: "We haven't been in since Richard passed. He loved those wine dinners. I think I'm ready to come back.", clubAgents: ['member-risk'], focus: 'Grief + sensitive re-engagement' },
];

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
async function callConcierge(member, memberMessage) {
  const systemPrompt = buildConciergeSystemPrompt(member);
  let messages = [{ role: 'user', content: memberMessage }];
  const toolCalls = [];

  let result = await client.messages.create({
    model: MODELS.concierge, max_tokens: 600, system: systemPrompt, messages, tools: SMS_TOOLS,
  });

  let loops = 0;
  while (result.stop_reason === 'tool_use' && loops < 5) {
    loops++;
    const toolUse = result.content.find(c => c.type === 'tool_use');
    if (!toolUse) break;

    toolCalls.push({ name: toolUse.name, input: toolUse.input });
    const toolResult = executeTool(toolUse.name, toolUse.input, member);

    messages.push({ role: 'assistant', content: result.content });
    messages.push({ role: 'user', content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(toolResult) }] });

    result = await client.messages.create({
      model: MODELS.concierge, max_tokens: 600, system: systemPrompt, messages, tools: SMS_TOOLS,
    });
  }

  let text = result.content.find(c => c.type === 'text')?.text ?? '';

  if (!text.trim() && toolCalls.length > 0) {
    messages.push({ role: 'assistant', content: result.content });
    messages.push({ role: 'user', content: '[SYSTEM: Tool call succeeded but no text. Send a short SMS reply to the member now.]' });
    const retry = await client.messages.create({ model: MODELS.concierge, max_tokens: 600, system: systemPrompt, messages });
    text = retry.content.find(c => c.type === 'text')?.text ?? '';
  }

  return { text: text.trim(), toolCalls };
}

async function callClubAgent(agentType, member, memberMessage, conciergeResponse) {
  const systemPrompt = CLUB_AGENT_PROMPTS[agentType];
  if (!systemPrompt) return `[No prompt for ${agentType}]`;

  const context = `MEMBER ACTION:
Member: ${member.name} (${member.membership_type}, $${member.annual_dues.toLocaleString()}/yr, since ${member.join_date}, health_score: ${member.health_score}, archetype: ${member.archetype})
Household: ${member.household.map(h => `${h.name} (${h.membership_type})`).join(', ')}
Message: "${memberMessage}"

CONCIERGE RESPONSE: "${conciergeResponse.text}"
${conciergeResponse.toolCalls.length ? `TOOLS CALLED: ${conciergeResponse.toolCalls.map(t => `${t.name}(${JSON.stringify(t.input)})`).join(', ')}` : 'NO TOOLS CALLED'}

Analyze this interaction and produce your response.`;

  const result = await client.messages.create({
    model: MODELS.club, max_tokens: 500, system: systemPrompt,
    messages: [{ role: 'user', content: context }],
  });
  return result.content.find(c => c.type === 'text')?.text ?? '';
}

async function callCritic(conversationLog) {
  const result = await client.messages.create({
    model: MODELS.critic, max_tokens: 800, system: CRITIC_PROMPT,
    messages: [{ role: 'user', content: conversationLog }],
  });
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
// Cycle runner
// ---------------------------------------------------------------------------
async function runScenario(scenario) {
  const member = MEMBERS[scenario.member];
  console.log(`\n${'='.repeat(70)}`);
  console.log(`SCENARIO ${scenario.cycle}: [${member.first_name}] ${scenario.focus}`);
  console.log(`${'='.repeat(70)}`);

  // Concierge
  const concierge = await callConcierge(member, scenario.message);
  console.log(`MEMBER: ${scenario.message}`);
  console.log(`CONCIERGE: ${concierge.text}`);
  if (concierge.toolCalls.length) console.log(`TOOLS: ${concierge.toolCalls.map(t => t.name).join(', ')}`);

  // Club agents
  const clubResponses = [];
  for (const agentType of scenario.clubAgents) {
    const response = await callClubAgent(agentType, member, scenario.message, concierge);
    clubResponses.push({ agent: agentType, response });
    console.log(`CLUB [${agentType}]: ${response.slice(0, 150)}...`);
  }

  // Build log for critic
  let log = `SCENARIO ${scenario.cycle}: ${scenario.focus}\n`;
  log += `MEMBER (${member.name}, ${member.membership_type}, $${member.annual_dues}/yr, health: ${member.health_score}): "${scenario.message}"\n`;
  log += `CONCIERGE: "${concierge.text}"\n`;
  if (concierge.toolCalls.length) log += `TOOLS: ${concierge.toolCalls.map(t => `${t.name}(${JSON.stringify(t.input)})`).join(', ')}\n`;
  for (const cr of clubResponses) log += `\nCLUB [${cr.agent}]:\n${cr.response}\n`;

  // Critic
  const critique = await callCritic(log);
  const s = critique.scores;
  const avg = ((s.natural + s.helpful + s.accurate + s.proactive + s.club_impact) / 5).toFixed(1);
  console.log(`\nSCORES: Natural=${s.natural} Helpful=${s.helpful} Accurate=${s.accurate} Proactive=${s.proactive} ClubImpact=${s.club_impact} AVG=${avg}`);
  critique.improvements.forEach((imp, i) => console.log(`  ${i + 1}. [${imp.severity}] ${imp.file}: ${imp.what}`));

  return { scenario, member: member.name, concierge, clubResponses, critique, avg: parseFloat(avg) };
}

async function main() {
  const cycleArg = process.argv.find(a => a.startsWith('--cycle'));
  const cycleNum = cycleArg ? parseInt(cycleArg.split('=')[1] || process.argv[process.argv.indexOf('--cycle') + 1]) : null;

  console.log('QA Cycle Runner — Multi-Member Agent Tests');
  console.log(`Models: concierge=${MODELS.concierge} club=${MODELS.club} critic=${MODELS.critic}`);
  console.log(`Date: ${new Date().toISOString()} | Scenarios: ${SCENARIOS.length} | Cycle: ${cycleNum || 'ALL'}\n`);

  const startTime = Date.now();
  const results = [];

  for (const scenario of SCENARIOS) {
    try {
      results.push(await runScenario(scenario));
    } catch (err) {
      console.error(`ERROR in scenario ${scenario.cycle}:`, err.message);
      results.push({
        scenario, member: MEMBERS[scenario.member].name,
        concierge: { text: `[ERROR: ${err.message}]`, toolCalls: [] },
        clubResponses: [], critique: { scores: { natural: 0, helpful: 0, accurate: 0, proactive: 0, club_impact: 0 }, improvements: [] },
        avg: 0,
      });
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Summary
  console.log(`\n\n${'='.repeat(70)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(70)}`);
  console.log('SC | MEMBER  | FOCUS                        | NAT | HLP | ACC | PRO | IMP | AVG');
  console.log('---|---------|------------------------------|-----|-----|-----|-----|-----|----');
  for (const r of results) {
    const s = r.critique.scores;
    const name = r.member.split(' ')[1]?.padEnd(7) || r.member.slice(0, 7).padEnd(7);
    console.log(` ${String(r.scenario.cycle).padStart(2)}| ${name} | ${r.scenario.focus.padEnd(28).slice(0, 28)} |  ${s.natural}  |  ${s.helpful}  |  ${s.accurate}  |  ${s.proactive}  |  ${s.club_impact}  | ${r.avg}`);
  }

  const avgAll = (key) => {
    const vals = results.map(r => r.critique.scores[key]).filter(v => v > 0);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 'N/A';
  };
  const overallAvg = results.filter(r => r.avg > 0).reduce((a, b) => a + b.avg, 0) / results.filter(r => r.avg > 0).length;
  console.log('---|---------|------------------------------|-----|-----|-----|-----|-----|----');
  console.log(` AVG                                        | ${avgAll('natural')} | ${avgAll('helpful')} | ${avgAll('accurate')} | ${avgAll('proactive')} | ${avgAll('club_impact')} | ${overallAvg.toFixed(1)}`);
  console.log(`\nRuntime: ${elapsed}s`);

  // Collect all improvements
  console.log(`\n${'='.repeat(70)}`);
  console.log('ALL IMPROVEMENTS (by severity)');
  console.log(`${'='.repeat(70)}`);
  const allImps = results.flatMap(r => r.critique.improvements.map(i => ({ ...i, cycle: r.scenario.cycle })));
  const highImps = allImps.filter(i => i.severity === 'high');
  const medImps = allImps.filter(i => i.severity === 'medium');
  const lowImps = allImps.filter(i => i.severity === 'low');
  [...highImps, ...medImps, ...lowImps].forEach((imp, i) => {
    console.log(`${i + 1}. [${imp.severity}] Cycle ${imp.cycle} — ${imp.file}: ${imp.what} — ${imp.why}`);
  });

  // Write report
  const reportDir = resolve(ROOT, 'tests/agents/reports');
  mkdirSync(reportDir, { recursive: true });
  const report = {
    timestamp: new Date().toISOString(),
    models: MODELS,
    runtime: elapsed + 's',
    overallAverage: overallAvg.toFixed(1),
    dimensionAverages: { natural: avgAll('natural'), helpful: avgAll('helpful'), accurate: avgAll('accurate'), proactive: avgAll('proactive'), club_impact: avgAll('club_impact') },
    scenarios: results.map(r => ({
      cycle: r.scenario.cycle, member: r.member, focus: r.scenario.focus,
      conciergeResponse: r.concierge.text,
      toolsCalled: r.concierge.toolCalls.map(t => t.name),
      scores: r.critique.scores, avg: r.avg,
      improvements: r.critique.improvements,
    })),
    allImprovements: allImps,
  };
  const reportPath = resolve(reportDir, `qa-cycle-${cycleNum || 'baseline'}-${Date.now()}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${reportPath}`);

  // Perfect score check
  const perfectCount = results.filter(r => r.avg >= 9.5).length;
  console.log(`\nPerfect scores (>=9.5): ${perfectCount}/${results.length}`);
  if (overallAvg >= 9.5) {
    console.log('TARGET ACHIEVED: Overall average >= 9.5');
  } else {
    console.log(`GAP TO TARGET: ${(9.5 - overallAvg).toFixed(1)} points to go`);
  }

  process.exit(overallAvg >= 9.5 ? 0 : 1);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
