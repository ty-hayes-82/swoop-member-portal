#!/usr/bin/env node
/**
 * sms-concierge-score.mjs
 *
 * SMS Concierge functionality test + AI scoring pipeline.
 *
 * Sends 48 targeted messages across 5 member personas (30 functional + 6 architecture
 * validation probes for Managed Agents Sprint A-D + 6 GBTC demo day scenarios +
 * 6 clarify-vs-act gate probes), captures tool_calls[], takes Playwright screenshots
 * of the UI, then scores with 9 specialist agents:
 * 5 focused on concierge FUNCTIONALITY, 2 on ARCHITECTURE REALIZATION.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=<key> APP_URL=http://localhost:3000 node scripts/sms-concierge-score.mjs
 *
 * With --loop flag: re-runs automatically after displaying recommendations.
 * Reads ./critiques/pinetree-creds.json for club credentials.
 *
 * Output: critiques/concierge-run-{TIMESTAMP}/
 */

import { chromium } from 'playwright';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  makeTimestamp, ensureDir, writeFileSafe, sleep, anthropicWithRetry,
  login, injectAuthAndNavigate, captureScreenshot,
} from './lib/infra.mjs';

import { parseAgentJSON, validateContract, mergeRecommendations } from './agents/scoring.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ───────────────────────────────────────────────────────────────────

const APP_URL      = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const API_KEY      = process.env.ANTHROPIC_API_KEY;
const AGENT_MODEL  = 'claude-opus-4-6';
const OUTPUT_BASE  = path.resolve(__dirname, '../../critiques');
const CREDS_FILE   = path.join(OUTPUT_BASE, 'pinetree-creds.json');
const LOOP_MODE    = process.argv.includes('--loop');
const ARCH_ONLY    = process.argv.includes('--arch-only'); // limit to arch messages 31-36 + arch scoring agents only

if (!API_KEY) {
  console.error('\n✗ ANTHROPIC_API_KEY not set. Export it or pass inline.\n');
  process.exit(1);
}

// ─── Test Personas ────────────────────────────────────────────────────────────

const PERSONAS = [
  { memberId: 'mbr_t01', name: 'James Whitfield',  profile: 'Active member, plays regularly, high engagement' },
  { memberId: 'mbr_t04', name: 'Anne Jordan',       profile: 'At-risk member, declining visits, needs re-engagement' },
  { memberId: 'mbr_t05', name: 'Robert Callahan',   profile: 'Declining member, needs reactivation outreach' },
  { memberId: 'mbr_t06', name: 'Sandra Chen',       profile: 'At-risk member, recent complaint about service' },
  { memberId: 'mbr_t07', name: 'Linda Leonard',     profile: 'Ghost member, no recent activity, long absence' },
];

// ─── 30 Test Messages ─────────────────────────────────────────────────────────
// 6 messages per persona — cycling through all 9 tool intents + edge cases

const TEST_MATRIX = [
  // ── James Whitfield (mbr_t01) — Active, high engagement ──
  { personaIdx: 0, message: 'Book my usual Saturday tee time, 7am',              expectedTool: 'check_tee_availability',  note: 'two-phase gate: MUST call check_tee_availability first, NOT book_tee_time' },
  { personaIdx: 0, message: "What events are coming up this month?",             expectedTool: 'get_club_calendar',       note: 'date-ranged calendar query' },
  { personaIdx: 0, message: 'Show me my recent rounds',                          expectedTool: 'get_my_schedule',         note: 'member-scoped schedule' },
  { personaIdx: 0, message: 'Reserve a table for dinner tonight, 6:30 for 4',   expectedTool: 'make_dining_reservation', note: 'specific time + party size' },
  { personaIdx: 0, message: 'Sign me up for the wine dinner next weekend',       expectedTool: 'rsvp_event',              note: 'fuzzy event name match' },
  { personaIdx: 0, message: 'The service at the bar yesterday was really slow',  expectedTool: 'file_complaint',          note: 'sentiment → complaint routing' },

  // ── Anne Jordan (mbr_t04) — At-risk, declining ──
  { personaIdx: 1, message: 'Cancel my tee time this weekend',                   expectedTool: 'cancel_tee_time',         note: 'scoped cancellation' },
  { personaIdx: 1, message: 'Can you tell the pro shop I need rental clubs on Friday?', expectedTool: 'send_request_to_club', note: 'staff routing' },
  { personaIdx: 1, message: "What's my current account balance?",                expectedTool: 'get_member_profile',      note: 'profile/billing lookup' },
  { personaIdx: 1, message: 'Is there a member-guest tournament coming up?',     expectedTool: 'get_club_calendar',       note: 'event type filter' },
  { personaIdx: 1, message: 'Book 4 tee times for our group next Saturday morning', expectedTool: 'check_tee_availability', note: 'two-phase gate: group booking must check availability first' },
  { personaIdx: 1, message: 'The course was in terrible shape last Sunday',      expectedTool: 'file_complaint',          note: 'course maintenance complaint' },

  // ── Robert Callahan (mbr_t05) — Declining, reactivation ──
  { personaIdx: 2, message: 'Reserve the private dining room for Saturday evening', expectedTool: 'make_dining_reservation', note: 'room preference param' },
  { personaIdx: 2, message: "I'm having trouble with my locker combination",     expectedTool: 'send_request_to_club',    note: 'facilities request' },
  { personaIdx: 2, message: "What's my handicap?",                               expectedTool: 'get_member_profile',      note: 'specific profile field' },
  { personaIdx: 2, message: 'Put me and my wife down for the charity gala',      expectedTool: 'rsvp_event',              note: 'multi-person RSVP' },
  { personaIdx: 2, message: "Get me a tee time Saturday at dawn",                expectedTool: 'check_tee_availability',  note: 'two-phase gate: vague time expression, must check availability first' },
  { personaIdx: 2, message: "I never received my invoice last month",            expectedTool: 'file_complaint',          note: 'billing complaint' },

  // ── Sandra Chen (mbr_t06) — At-risk, recent complaint ──
  { personaIdx: 3, message: 'I need to speak to the membership director',        expectedTool: 'send_request_to_club',    note: 'staff escalation request' },
  { personaIdx: 3, message: "What's happening at the club this weekend?",        expectedTool: 'get_club_calendar',       note: 'weekend-scoped event query' },
  { personaIdx: 3, message: 'Book dinner for my anniversary, make it special',   expectedTool: 'make_dining_reservation', note: 'occasion hint in message' },
  { personaIdx: 3, message: 'Cancel all my upcoming reservations',              expectedTool: 'cancel_tee_time',         note: 'broad scope — what does it do?' },
  { personaIdx: 3, message: 'Show me everything I have done at the club this year', expectedTool: 'get_my_schedule',      note: 'year-scoped history' },
  { personaIdx: 3, message: 'I want to book a lesson with the pro',              expectedTool: 'send_request_to_club',    note: 'service booking via staff' },

  // ── Linda Leonard (mbr_t07) — Ghost member, long absence ──
  { personaIdx: 4, message: 'Are my guests allowed to use the pool?',            expectedTool: 'get_member_profile',      note: 'membership tier question' },
  { personaIdx: 4, message: 'RSVP for the junior golf clinic for my son',        expectedTool: 'rsvp_event',              note: 'third-party RSVP' },
  { personaIdx: 4, message: 'Check if I have any outstanding charges',           expectedTool: 'get_member_profile',      note: 'account info lookup' },
  { personaIdx: 4, message: "It's been a while, what have I missed?",            expectedTool: 'get_club_calendar',       note: 're-engagement calendar query' },
  { personaIdx: 4, message: "I forgot, when is my tee time exactly?",            expectedTool: 'get_my_schedule',         note: 'recall pattern — no tee time exists' },
  { personaIdx: 4, message: 'I want to cancel everything I have booked this week', expectedTool: 'cancel_tee_time',       note: 'ghost member — nothing to cancel' },

  // ── Architecture validation (Sprints A-D) — managed agents benefit probes ──
  { personaIdx: 0, message: 'Has my tee time request been confirmed by the pro shop yet?', expectedTool: 'get_my_schedule', note: 'Sprint A: confirmation loop recall — was booking confirmed?' },
  { personaIdx: 1, message: 'What preferences have you noted about me?',                   expectedTool: 'get_member_profile', note: 'Sprint B: session preference event retrieval' },
  { personaIdx: 2, message: 'Has my invoice complaint been followed up on?',               expectedTool: 'get_my_schedule', note: 'Sprint B: complaint event retrieval from session log' },
  { personaIdx: 3, message: 'I need to book golf and dinner for Saturday — can you handle both?', expectedTool: 'check_tee_availability', note: 'Sprint D: multi-intent — tee time leg must check availability first before booking' },
  { personaIdx: 4, message: "I haven't been around in ages — what do I need to know and what should I do first?", expectedTool: 'get_club_calendar', note: 'Sprint D: personal concierge intent + ghost re-engagement' },
  { personaIdx: 0, message: 'Set me up for next Saturday — tee time at 8 and dinner after for me and my client', expectedTool: 'check_tee_availability', note: 'Sprint D: multi-request — tee time leg must check availability first, then book after member confirms' },

  // ── GBTC Demo Day scenarios — tests live demo arc from conference showcase ──
  { personaIdx: 0, message: 'The service at the Grill today was unacceptable. We waited 47 minutes and nobody checked on us once.', expectedTool: 'file_complaint', note: 'Demo Move 2: GBTC hero complaint — specific Grill grievance, high severity, needs escalation tone' },
  { personaIdx: 0, message: 'Has anyone from the club followed up on my complaint about the Grill?',                              expectedTool: 'get_my_schedule', note: 'Demo Move 2 follow-up: complaint status recall from session, should reference filed complaint' },
  { personaIdx: 1, message: "I'd love to start playing again — what tee times are available this week?",                         expectedTool: 'get_club_calendar', note: 'Demo Move 3: re-engagement opener for at-risk Anne Jordan — warm tone, specific options' },
  { personaIdx: 3, message: 'Can you show me a summary of my preferences and what the club knows about me?',                    expectedTool: 'get_member_profile', note: 'Demo Move 3: memory compound — preferences retrieval for Sandra, proves session memory' },
  { personaIdx: 2, message: 'I want to make a reservation but make it really nice — booth by the window if possible',           expectedTool: 'make_dining_reservation', note: 'Demo Move 3: preference recall — Robert has booth preference, concierge should surface it' },
  { personaIdx: 4, message: 'My son wants to start golfing — what programs does the club have for kids?',                       expectedTool: 'get_club_calendar', note: 'Demo Move 5: ghost re-engagement via family angle — Linda ghost member, personal hook needed' },

  // ── Clarify-vs-act gate probes ─────────────────────────────────────────────
  // These specifically test whether the agent asks for details vs acts immediately
  { personaIdx: 0, message: 'My lunch was really slow',                                          expectedTool: null,              note: 'complaint gate: vague — must ask for details (location + how long), NOT file_complaint' },
  { personaIdx: 0, message: 'Make a dinner reservation',                                         expectedTool: null,              note: 'dining gate: no date — must ask for date + party size, NOT make_dining_reservation' },
  { personaIdx: 0, message: 'The food at the Grill was cold and wrong — we waited 40 minutes',   expectedTool: 'file_complaint',  note: 'complaint gate: specific — location+incident present, must file immediately' },
  { personaIdx: 2, message: 'Book dinner for my anniversary on Saturday, 7pm for two',            expectedTool: 'make_dining_reservation', note: 'dining gate: full details — must book immediately, not ask' },
  { personaIdx: 3, message: 'Are there any social events for singles?',                           expectedTool: 'get_club_calendar', note: 'calendar query: must check calendar and return results concisely, not verbose explanation' },
  { personaIdx: 1, message: 'Yes',                                                                expectedTool: 'make_dining_reservation', note: 'affirmative follow-up: must act on last offer (assumes prior dining offer was made), not re-ask' },
];

// ─── Scoring Agent Definitions ────────────────────────────────────────────────

const SCORING_AGENTS = [
  {
    id: 'tool_accuracy',
    name: 'Tool Selection Accuracy',
    weight: 0.20,
    dimensions: ['correct_tool_fired', 'tool_not_called_when_needed', 'wrong_tool_called', 'two_phase_booking_gate', 'edge_case_recovery'],
    prompt: `You are a senior QA engineer evaluating an AI concierge for a private country club. Be precise and evidence-based. Do NOT hallucinate evidence. Only cite things actually present in the conversations. Never use em-dashes (—) in your output text: use commas, colons, or periods instead.

IMPORTANT CONTEXT:
- Bookings (tee times, dining, RSVPs, cancellations) correctly return { status: "request_submitted", pending: true, routed_to: "..." } — this is the CORRECT behavior (human-in-the-loop). Do NOT penalize for this.
- When simulated=true, tool_calls[] will be empty — this is an environment issue, not a code bug. Note it per conversation but do not let it tank scores if simulated mode produces coherent responses.
- Score based only on what you can directly observe in the conversations provided.
- For conversations where expectedTool is null, the CORRECT behavior is no tool call — a clarifying question should be the response. Score correct_tool_fired as 10 for these if no tool was fired.

TWO-PHASE TEE TIME BOOKING RULE (critical):
Tee time booking MUST follow a two-step sequence:
  Step 1: call check_tee_availability with date + preferred time
  Step 2: present options to the member ("I've got 7:00, 7:12, or 7:24 — which works?")
  Step 3: only call book_tee_time AFTER the member picks a slot
Calling book_tee_time as the first action on a new tee time request is a HARD FAILURE regardless of how much info was in the message. The expectedTool for tee time booking messages is check_tee_availability — score accordingly.

SCORE EACH DIMENSION 1-10 based only on observed evidence:
- correct_tool_fired: Count conversations where tool_calls[] contains the expected tool. Score = (correct / total_non_simulated) * 10. If all simulated, score 5 and note environment issue.
- tool_not_called_when_needed: How often was tool_calls[] EMPTY on non-simulated responses when an action was clearly needed? (10=never empty when needed, 1=always empty)
- wrong_tool_called: How often was the WRONG tool selected (e.g. get_my_schedule instead of get_club_calendar, or book_tee_time called directly without check_tee_availability first)? (10=never wrong, 1=frequently wrong)
- two_phase_booking_gate: For ALL tee time booking requests, did check_tee_availability fire BEFORE book_tee_time? Direct booking without availability check is a hard failure. (10=always checks availability first, 1=always books directly without checking)
- edge_case_recovery: When the member has no data (ghost member, no bookings), did the concierge handle gracefully? (10=always graceful, 1=throws errors or gives nonsense)

Return ONLY valid JSON matching this contract exactly:
{
  "agent": "Tool Selection Accuracy",
  "scores": {
    "correct_tool_fired": { "score": <1-10>, "evidence": "<cite specific conversation # and tool names>", "rationale": "<1 sentence stating the count/ratio>" },
    "tool_not_called_when_needed": { "score": <1-10>, "evidence": "<cite specific conversation # where tool was missing>", "rationale": "<1 sentence>" },
    "wrong_tool_called": { "score": <1-10>, "evidence": "<cite specific conversation # where wrong tool was called, or 'none observed'>", "rationale": "<1 sentence>" },
    "two_phase_booking_gate": { "score": <1-10>, "evidence": "<for each tee time booking conversation, state whether check_tee_availability fired before book_tee_time or not>", "rationale": "<1 sentence>" },
    "edge_case_recovery": { "score": <1-10>, "evidence": "<cite specific edge case and outcome>", "rationale": "<1 sentence>" }
  },
  "top_strengths": ["<specific observed strength>", "<specific observed strength>"],
  "top_issues": ["<specific observed issue with conversation #>", "<specific observed issue>"],
  "recommendations": [
    { "priority": "P0|P1|P2", "surface": "<api/concierge/chat.js or src/config/conciergePrompt.js>", "change": "<specific actionable change>", "expected_lift": "<dimension_id>" }
  ],
  "confidence": <0.0-1.0>
}`,
  },

  {
    id: 'argument_quality',
    name: 'Argument Quality',
    weight: 0.20,
    dimensions: ['required_args_present', 'date_time_resolution', 'member_id_context', 'fuzzy_input_resolved', 'party_size_inferred'],
    prompt: `You are a senior QA engineer evaluating tool argument quality for a private club AI concierge. Be precise and evidence-based. Only cite arguments you can actually see in the tool_calls[] data. Never use em-dashes (—) in your output text: use commas, colons, or periods instead.

IMPORTANT CONTEXT:
- When simulated=true, tool_calls[] is empty — skip those conversations for argument scoring and note "simulated" in evidence.
- Dates like "2026-04-19" (YYYY-MM-DD) are correct. Dates like "this Saturday" passed as a raw string are wrong.
- Times like "06:00" or "07:00" are correct. "dawn" or "morning" left as-is in arguments are wrong.
- party_size and players must be integers. "me and my wife" should produce 2. Solo requests should produce 1.
- The tool parameters don't include member_id directly (it's inferred server-side from auth) — don't penalize for its absence.

SCORE EACH DIMENSION 1-10 based only on non-simulated conversations with tool calls:
- required_args_present: In non-simulated tool calls, are all required fields (date, time/tee_time for tee times, category+description for complaints, etc.) present and non-null? (10=always, 1=frequently missing required fields)
- date_time_resolution: Are dates YYYY-MM-DD format and times HH:MM format in tool call arguments? (10=always resolved correctly, 1=raw vague strings like "tonight" or "dawn")
- member_id_context: Is there any evidence of cross-member data contamination or wrong member context? (10=no contamination, 1=mixing up members)
- fuzzy_input_resolved: For vague event/outlet names ("wine dinner", "charity gala"), are correct event titles passed? (10=always picks best match, 1=always passes raw vague string)
- party_size_inferred: When party size is implied in the message, is it correctly inferred as an integer? (10=always correct integer, 1=missing or wrong)

Return ONLY valid JSON matching this contract exactly:
{
  "agent": "Argument Quality",
  "scores": {
    "required_args_present": { "score": <1-10>, "evidence": "<cite specific tool call args from a conversation>", "rationale": "<1 sentence>" },
    "date_time_resolution": { "score": <1-10>, "evidence": "<cite specific date/time arg values observed>", "rationale": "<1 sentence>" },
    "member_id_context": { "score": <1-10>, "evidence": "<cite any contamination evidence or 'none observed'>", "rationale": "<1 sentence>" },
    "fuzzy_input_resolved": { "score": <1-10>, "evidence": "<cite specific fuzzy input and what was passed>", "rationale": "<1 sentence>" },
    "party_size_inferred": { "score": <1-10>, "evidence": "<cite specific message and party_size arg value>", "rationale": "<1 sentence>" }
  },
  "top_strengths": ["<specific observed strength>", "<specific observed strength>"],
  "top_issues": ["<specific observed issue with conversation # and arg name>", "<specific observed issue>"],
  "recommendations": [
    { "priority": "P0|P1|P2", "surface": "<api/concierge/chat.js or src/config/conciergePrompt.js>", "change": "<specific actionable change>", "expected_lift": "<dimension_id>" }
  ],
  "confidence": <0.0-1.0>
}`,
  },

  {
    id: 'conversational_naturalness',
    name: 'Conversational Naturalness',
    weight: 0.30,
    dimensions: ['response_fit', 'followup_intelligence', 'brevity_fit', 'tone_naturalness', 'clarify_vs_act'],
    prompt: `You are a conversation quality reviewer evaluating an AI concierge for a private country club. Your job is to assess whether each response feels like a natural, well-calibrated text from a smart friend who works at the club — not a chatbot running a script.

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

Return ONLY valid JSON:
{
  "agent": "Conversational Naturalness",
  "scores": {
    "response_fit": { "score": <1-10>, "evidence": "<quote a response showing fit or misfit>", "rationale": "<1 sentence>" },
    "followup_intelligence": { "score": <1-10>, "evidence": "<cite a case where it asked correctly or failed to ask/acted incorrectly>", "rationale": "<1 sentence>" },
    "brevity_fit": { "score": <1-10>, "evidence": "<quote a verbose response or correctly concise one>", "rationale": "<1 sentence>" },
    "tone_naturalness": { "score": <1-10>, "evidence": "<quote a response showing tone quality, flag any banned phrases>", "rationale": "<1 sentence>" },
    "clarify_vs_act": { "score": <1-10>, "evidence": "<cite the vague complaint case and the dining-no-date case specifically>", "rationale": "<1 sentence>" }
  },
  "top_strengths": ["<specific observed strength>", "<second strength>"],
  "top_issues": ["<specific issue with quoted evidence>", "<second issue>"],
  "recommendations": [
    { "priority": "P0|P1|P2", "surface": "<src/config/conciergePrompt.js or api/concierge/chat.js>", "change": "<specific actionable change>", "expected_lift": "<dimension_id>" }
  ],
  "confidence": <0.0-1.0>
}`,
  },

  {
    id: 'error_recovery',
    name: 'Error Recovery',
    weight: 0.13,
    dimensions: ['fallback_message_quality', 'no_silent_failures', 'simulated_mode_handling', 'retry_suggestion', 'out_of_scope_handling'],
    prompt: `You are a QA engineer specializing in failure modes for AI assistants. Be precise. Only cite observable failures in the actual conversation data. Do not hallucinate failures that aren't present. Never use em-dashes (—) in your output text: use commas, colons, or periods instead.

IMPORTANT CONTEXT:
- "request_submitted" with pending:true is CORRECT behavior for bookings — the concierge routes to staff rather than auto-confirming. This is NOT a failure.
- When simulated=true, all responses come from a simulation layer without real tool calls. Simulated responses that are coherent and logical are acceptable. Note the environment issue but don't score it as a concierge failure.
- The concierge should NEVER fabricate: account balances, specific policy details, availability, or confirmation numbers when it doesn't have real data.
- Look specifically for: ghost member with no bookings asking to "cancel everything", member asking about "account balance" when profile has no billing data, member asking about pool/guest policy.

SCORE EACH DIMENSION 1-10 based only on observable evidence:
- fallback_message_quality: When tools return empty results or member has no data, is the response helpful and specific about what it can/can't do? (10=always helpful with next steps, 1=blank or "I can't help with that")
- no_silent_failures: Does the concierge NEVER claim to have done something when the tool returned empty/error, and never fabricate data (balances, policies, availability)? (10=never fabricates, 1=frequently invents data)
- simulated_mode_handling: For simulated=true conversations, are responses coherent, warm, and logical (even without real tool data)? (10=coherent, 1=broken/nonsensical)
- retry_suggestion: When an action can't be completed, does the concierge offer an alternative — route to staff, suggest calling, offer a different action? (10=always offers path forward, 1=dead ends)
- out_of_scope_handling: For "Are guests allowed to use the pool?" type questions where the concierge has no data, does it route to staff rather than inventing policy? (10=always routes to staff, 1=makes up policies)

Return ONLY valid JSON matching this contract exactly:
{
  "agent": "Error Recovery",
  "scores": {
    "fallback_message_quality": { "score": <1-10>, "evidence": "<cite specific conversation # and response when empty result occurred>", "rationale": "<1 sentence>" },
    "no_silent_failures": { "score": <1-10>, "evidence": "<cite any fabrication instances or 'none observed'>", "rationale": "<1 sentence>" },
    "simulated_mode_handling": { "score": <1-10>, "evidence": "<cite simulated response quality>", "rationale": "<1 sentence>" },
    "retry_suggestion": { "score": <1-10>, "evidence": "<cite specific response showing redirect or dead-end>", "rationale": "<1 sentence>" },
    "out_of_scope_handling": { "score": <1-10>, "evidence": "<cite response to pool/policy/out-of-scope question>", "rationale": "<1 sentence>" }
  },
  "top_strengths": ["<specific observed strength>", "<specific observed strength>"],
  "top_issues": ["<specific issue with evidence>", "<specific issue>"],
  "recommendations": [
    { "priority": "P0|P1|P2", "surface": "<api/concierge/chat.js or src/config/conciergePrompt.js>", "change": "<specific actionable change>", "expected_lift": "<dimension_id>" }
  ],
  "confidence": <0.0-1.0>
}`,
  },

  {
    id: 'member_context',
    name: 'Member Context Awareness',
    weight: 0.08,
    dimensions: ['persona_appropriate_response', 'at_risk_tone_adjustment', 'ghost_member_warmth', 'history_referenced', 'privacy_maintained'],
    prompt: `You are a member experience director evaluating whether a club concierge treats different members appropriately. Be precise. Quote actual response text as evidence. Do not invent context. Never use em-dashes (—) in your output text: use commas, colons, or periods instead.

IMPORTANT CONTEXT — 5 PERSONAS AND EXPECTED TREATMENT:
- James Whitfield (mbr_t01): Active, high engagement — efficient and proactive service
- Anne Jordan (mbr_t04): At-risk, declining visits — MUST open with "It's so great to hear from you, Anne!" or similar validation; include one re-engagement suggestion after request
- Robert Callahan (mbr_t05): Declining member — warm, encouraging tone; "We'd love to see you out here soon"
- Sandra Chen (mbr_t06): At-risk + recent complaint — MUST acknowledge prior service issue empathetically early in interaction; "I know your last experience wasn't what it should have been"
- Linda Leonard (mbr_t07): Ghost member (absent 6+ months) — MUST open with "Linda! We've missed you so much" or equivalent warm welcome-back BEFORE completing any request

SCORE EACH DIMENSION 1-10 based only on actual response text:
- persona_appropriate_response: Does the tone and content visibly differ between active (James) vs at-risk (Anne/Robert) vs ghost (Linda)? (10=clearly differentiated, 1=identical tone for all)
- at_risk_tone_adjustment: For Anne, Robert, Sandra — do their responses open with explicit validation ("so great to hear from you") and include a re-engagement line? (10=always includes both, 1=identical to active member responses)
- ghost_member_warmth: For Linda — does the FIRST SENTENCE of every response acknowledge her absence warmly? (10=every response opens with welcome-back, 1=jumps straight to task)
- history_referenced: Does the concierge reference known preferences (James's booth 12, Sandra's prior complaint, Anne's Saturday golf)? (10=frequently references known context, 1=treats every member as unknown)
- privacy_maintained: Does the concierge NEVER mention health scores, risk tiers, engagement percentages, or archetype labels? (10=never leaks, 1=mentions internal data)

Return ONLY valid JSON matching this contract exactly:
{
  "agent": "Member Context Awareness",
  "scores": {
    "persona_appropriate_response": { "score": <1-10>, "evidence": "<quote responses from at least 2 different personas showing tone difference or lack>", "rationale": "<1 sentence>" },
    "at_risk_tone_adjustment": { "score": <1-10>, "evidence": "<quote Anne/Robert/Sandra response openings>", "rationale": "<1 sentence>" },
    "ghost_member_warmth": { "score": <1-10>, "evidence": "<quote Linda's first response sentence(s)>", "rationale": "<1 sentence>" },
    "history_referenced": { "score": <1-10>, "evidence": "<quote specific preference reference or note 'not observed'>", "rationale": "<1 sentence>" },
    "privacy_maintained": { "score": <1-10>, "evidence": "<quote any privacy leak or 'none observed'>", "rationale": "<1 sentence>" }
  },
  "top_strengths": ["<specific observed strength with quoted evidence>", "<specific observed strength>"],
  "top_issues": ["<specific issue with quoted evidence from conversation>", "<specific issue>"],
  "recommendations": [
    { "priority": "P0|P1|P2", "surface": "<src/config/conciergePrompt.js>", "change": "<specific actionable change>", "expected_lift": "<dimension_id>" }
  ],
  "confidence": <0.0-1.0>
}`,
  },

  {
    id: 'member_concierge_arch',
    name: 'Member Concierge Architecture Realization',
    weight: 0.12,
    dimensions: ['confirmation_loop_closed', 'session_memory_active', 'preference_capture', 'multi_intent_handling', 'per_member_relationship_depth', 'white_glove_readiness'],
    prompt: `You are an AI systems architect evaluating how well the "one session per member, for life" managed-agents pattern is being realized in practice. You are looking for evidence of six specific architectural benefits in the 36 test conversations. Be precise and evidence-based. Quote actual response text or tool results. Never use em-dashes in output.

THE SIX BENEFITS TO EVALUATE:

1. CONFIRMATION LOOP CLOSED (Sprint A): After booking requests (tee times, dining, RSVPs, cancellations), does the concierge tell the member their request was routed to the right department and what to expect? And when a member asks "has my request been confirmed?", does the concierge give a specific answer rather than a generic fallback?

2. SESSION MEMORY ACTIVE (Sprint B): Across the 36 conversations, is there any evidence of the concierge referencing events from earlier in the session? Do the architecture-validation messages (msgs 31-36) show any session continuity? Look for: acknowledgment of prior requests, preference recall, complaint follow-up.

3. PREFERENCE CAPTURE: When a member asks "what preferences do you have for me?" or similar, does the concierge surface member-specific preferences (tee times, dining habits, family members) OR clearly explain what it knows from the member profile?

4. MULTI-INTENT HANDLING (Sprint D): For messages 34-36 that contain multiple intents (book golf AND dinner, handle everything for Saturday), does the concierge address all intents rather than dropping one? Does it sequence tool calls logically?

5. PER-MEMBER RELATIONSHIP DEPTH: Does the concierge treat each member as a known individual — different tone for James (active) vs Linda (ghost) vs Sandra (complaint history)? Does it volunteer member-specific context without being asked?

6. WHITE-GLOVE READINESS: When members ask broad re-engagement questions ("what have I missed?", "where do I start?"), does the concierge proactively surface relevant club activities and make specific personalized suggestions — or does it just list upcoming events generically?

SCORING CONTEXT:
- These are EARLY STAGE scores. Sprint B (session log) was just deployed and events won't have had time to accumulate across separate test runs. Score based on foundation presence AND observed behavior.
- A score of 5 means "foundation is in place but not yet visible in responses." A score of 8 means "actively working in the conversations." A score of 10 means "demonstrably better than stateless alternatives."
- The 6 architecture-validation messages are conversations 31-36 in the dataset.

SCORE EACH DIMENSION 1-10:
- confirmation_loop_closed: After booking tool calls with request_submitted, does the response name the department and expected timeline? For "has it been confirmed?" questions, is the answer specific? (10=always closes the loop with specifics, 1=generic "your request is in")
- session_memory_active: Across the 36 conversations, is there any evidence of cross-turn memory? Preferences recalled, prior requests acknowledged, session continuity? (10=clearly active, 5=infrastructure present but not yet visible, 1=no evidence)
- preference_capture: For "what preferences do you have?" questions, does the concierge surface real member-specific data rather than deflecting? (10=surfaces specific preferences, 5=shows profile data, 1=deflects or invents)
- multi_intent_handling: For messages with 2+ intents, does the concierge address all of them — firing multiple tools or sequencing them? (10=all intents handled, 1=only first intent handled, other dropped)
- per_member_relationship_depth: Across all 5 personas, is the depth of personalization visibly different? James vs Linda vs Sandra? (10=clearly differentiated knowledge depth, 1=same treatment for all)
- white_glove_readiness: For re-engagement and "where do I start" messages, does the concierge give specific personalized suggestions or generic lists? (10=specific and personalized, 1=generic event list)

Return ONLY valid JSON matching this contract exactly:
{
  "agent": "Member Concierge Architecture Realization",
  "scores": {
    "confirmation_loop_closed": { "score": <1-10>, "evidence": "<quote a booking response or msg 31 response showing confirmation or its absence>", "rationale": "<1 sentence on what was observed>" },
    "session_memory_active": { "score": <1-10>, "evidence": "<cite specific cross-turn reference or note 'infrastructure present, not yet visible in responses'>", "rationale": "<1 sentence>" },
    "preference_capture": { "score": <1-10>, "evidence": "<quote the response to msg 32 'what preferences have you noted'>", "rationale": "<1 sentence>" },
    "multi_intent_handling": { "score": <1-10>, "evidence": "<cite msg 34-36 tool calls showing single or multiple intents handled>", "rationale": "<1 sentence>" },
    "per_member_relationship_depth": { "score": <1-10>, "evidence": "<compare a James response to a Linda response showing differentiation or lack>", "rationale": "<1 sentence>" },
    "white_glove_readiness": { "score": <1-10>, "evidence": "<quote the response to Linda msg 35 or James msg 36>", "rationale": "<1 sentence>" }
  },
  "top_strengths": ["<specific architectural strength observed>", "<specific strength>"],
  "top_issues": ["<specific architectural gap with evidence>", "<gap>"],
  "recommendations": [
    { "priority": "P0|P1|P2", "surface": "<api/concierge/chat.js or api/agents/concierge-session.js or src/config/conciergePrompt.js>", "change": "<specific actionable change to realize the benefit>", "expected_lift": "<dimension_id>" }
  ],
  "confidence": <0.0-1.0>
}`,
  },

  {
    id: 'gm_concierge_readiness',
    name: 'GM Concierge Readiness',
    weight: 0.05,
    dimensions: ['routing_architecture', 'decision_auditability', 'multi_agent_coordination', 'behavior_learning_foundation', 'succession_readiness'],
    prompt: `You are an AI systems architect evaluating readiness for a GM-level concierge that routes work to 7 specialist agents and accumulates institutional memory. This feature is NOT YET BUILT — you are scoring the foundation and gaps visible in the current system's 36 test conversations and architecture.

THE GM CONCIERGE VISION:
- One GM session per GM, permanent. Every approval, override, dismissal becomes a gm_session event.
- The GM concierge is a routing brain: it calls other agents (member risk, service recovery, revenue analyst, etc.) as tools rather than doing work itself.
- Preferences emerge from observed behavior (thresholds, tone rules, briefing order) not settings panels.
- Morning briefings are composed from the event log ("agents did X autonomously, here's what I held for review").
- Board questions like "why did we comp $4K?" become queries against the decision log.
- Succession: when a GM leaves, the new GM inherits the session as institutional memory.

WHAT TO EVALUATE (from the 36 conversations and inferred architecture):
1. ROUTING ARCHITECTURE: Looking at the tool calls in the conversations — is the concierge already routing to the right departments/staff (Pro Shop, Front Desk, Events Team)? Does the agent-events.js handler pattern support plugging in real agent-to-agent routing?
2. DECISION AUDITABILITY: Are tool calls, results, and routing decisions being logged in a way that supports future queries? (activity_log writes, event_bus routing — infer from booking results showing request_id, routed_to, etc.)
3. MULTI-AGENT COORDINATION: For complex requests (complaint + follow-up, booking + dining), does the system show any sign of coordinating across multiple tool calls in sequence? Does it pass context between them?
4. BEHAVIOR LEARNING FOUNDATION: Is there any infrastructure for learning from the GM's decisions — event log schema, session events, preference capture patterns? (infer from what's visible in the member concierge conversations and architecture)
5. SUCCESSION READINESS: Is the session log being built in a way that survives GM turnover? Is it queryable, portable, and structured enough for a new GM to inherit?

SCORING NOTE: Most of these dimensions will score 3-6 because the GM concierge is not yet built. That is EXPECTED and correct. A score of 3 means "no foundation," 5 means "building blocks present in the member concierge architecture," 7 means "foundation ready, needs GM-specific wiring," 9+ means "actively working."

SCORE EACH DIMENSION 1-10:
- routing_architecture: Does the member concierge show the routing pattern (department-specific routing, correct staff routing) that the GM concierge will need? Is the agent-events.js pattern extensible? (scoring based on inferred architecture from booking results)
- decision_auditability: Do booking results include request_id, routed_to, and status fields that form a decision trail? Are events being emitted to a queryable log? (10=full audit trail visible, 1=no traceability)
- multi_agent_coordination: For requests that require multiple steps, does the system coordinate them? Does it pass results from one tool to the next coherently? (10=full coordination, 1=each tool call isolated)
- behavior_learning_foundation: Is the session log schema (event_type, payload JSONB) flexible enough to capture GM decision patterns? Are preference_observed events being used in member sessions? (10=foundation ready, 1=no infrastructure)
- succession_readiness: Is the event log append-only and structured so a new GM could reconstruct decisions? Are payloads descriptive enough to be read by someone with no prior context? (10=fully portable, 1=opaque internal state)

Return ONLY valid JSON matching this contract exactly:
{
  "agent": "GM Concierge Readiness",
  "scores": {
    "routing_architecture": { "score": <1-10>, "evidence": "<cite specific routed_to values in booking results showing correct department routing>", "rationale": "<1 sentence on routing foundation quality>" },
    "decision_auditability": { "score": <1-10>, "evidence": "<cite request_id, routed_to, status fields from booking results or event log references>", "rationale": "<1 sentence>" },
    "multi_agent_coordination": { "score": <1-10>, "evidence": "<cite any multi-tool sequence showing or lacking coordination (msgs 34-36 are the best test)>", "rationale": "<1 sentence>" },
    "behavior_learning_foundation": { "score": <1-10>, "evidence": "<infer from session event schema and preference_observed patterns visible in conversations>", "rationale": "<1 sentence>" },
    "succession_readiness": { "score": <1-10>, "evidence": "<evaluate whether event payloads are self-describing enough to be inherited by a new GM>", "rationale": "<1 sentence>" }
  },
  "top_strengths": ["<specific foundation strength that GM concierge can build on>", "<strength>"],
  "top_issues": ["<specific gap that must be closed before GM concierge ships>", "<gap>"],
  "recommendations": [
    { "priority": "P0|P1|P2", "surface": "<api/agents/agent-events.js or api/concierge/chat.js or new file>", "change": "<specific actionable change to advance GM concierge readiness>", "expected_lift": "<dimension_id>" }
  ],
  "confidence": <0.0-1.0>
}`,
  },
  {
    id: 'swoop_arch_compliance',
    name: 'Swoop Architecture Compliance',
    weight: 0.15,
    dimensions: [
      'identity_analyst_separation',
      'handoff_loop_completeness',
      'human_gating_compliance',
      'routing_brain_pattern',
      'session_as_memory',
      'no_direct_actions',
      'audit_trail_quality',
      'analyst_signal_propagation',
    ],
    prompt: `You are a senior AI systems architect evaluating the Swoop platform against its published architecture spec. Your job is to assess whether the CURRENT SYSTEM — as evidenced by the test conversations and tool results — correctly implements the two-type agent model and confirmation-loop backbone described in this spec.

THE SWOOP ARCHITECTURE (what you are scoring AGAINST):

CORE PRINCIPLE: Swoop never books a tee time, rings up a sale, or sends an email without human confirmation. Swoop is a Layer 3 integration, communication, and insights platform. Every real-world action is executed by a human in the source system.

TYPE 1 — IDENTITY-BOUND AGENTS (Session = Person):
- One durable session per human. session_id tied to user_id (staff) or member_id (members).
- The harness is a ROUTING BRAIN — its only job is to interact with its human and call other agents as tools.
- Learns continuously from session events: preferences, communication tone, approval patterns.
- Session lives for the life of membership/employment.

TYPE 2 — DOMAIN-ANALYST AGENTS (Session = Domain):
- One durable session per domain (e.g., revenue_analyst_pinetree), not per person.
- Stateless brains + durable signal history.
- NEVER acts directly. Always emits a recommendation event to the relevant identity-bound agent session.
- Examples: Revenue Analyst, Service Recovery, Member Pulse, Labor Optimizer, Draft Communicator.

THE HANDOFF LOOP (7 steps — the operational backbone):
1. SIGNAL EMERGES: An analyst agent detects something (underfilled tee sheet, engagement decay, unresolved complaint).
2. ANALYST EMITS RECOMMENDATION: Written to analyst's session log AND to relevant identity-bound sessions.
3. IDENTITY AGENT PICKS IT UP: Head Pro agent, GM agent, or F&B Director agent receives it.
4. IDENTITY AGENT DELIVERS TO HUMAN: Via morning briefing, notification, or chat — in that person's voice.
5. HUMAN ACTS IN SOURCE SYSTEM: Pro shop books in ForeTees, F&B director comps in Jonas POS. Swoop does NOT.
6. HUMAN CONFIRMS BACK TO AGENT: "Done — booked James for Saturday 8:40." Agent writes confirmation_received event.
7. ANALYST CLOSES THE LOOP: Outcome tracking feeds back into future recommendations.

WHAT MUST NEVER HAPPEN:
- An agent directly books a tee time or executes any real-world action.
- An agent sends an external communication without human approval.
- Cross-session data access without an audit event.
- Silent mutation of shared state.

DIMENSIONS TO SCORE (each 1-10):

1. IDENTITY/ANALYST SEPARATION (identity_analyst_separation):
Is there a clear operational distinction between agents that belong to a person (member concierge, staff agents) and agents that belong to a domain (revenue analyst, service recovery)? Do analyst signals flow INTO identity sessions rather than the other way around?
Evidence to look for: session_id naming conventions, separate session types, analyst-to-identity recommendation events in the conversation logs.
10=clean separation with both types operating; 5=identity agents exist but no analyst agents visible; 1=monolithic, no separation.

2. HANDOFF LOOP COMPLETENESS (handoff_loop_completeness):
How many of the 7 handoff loop steps are implemented and visible in the test conversations?
- Step 1-2: Are analyst recommendations appearing? (infer from session events or routing logic)
- Step 3-4: Do identity agents receive and deliver recommendations to humans?
- Step 5: Is there evidence the system explicitly leaves execution to humans (no auto-booking)?
- Step 6-7: When a booking is submitted, is there a confirmation mechanism? Can the human report back?
10=all 7 steps visible; 7=steps 3-6 solid, analyst steps partial; 5=confirmation loop present but analyst layer missing; 1=no loop structure.

3. HUMAN GATING COMPLIANCE (human_gating_compliance):
Does the system strictly enforce that no real-world action happens without human confirmation? When tools like book_tee_time or make_dining_reservation are called, do they return request_submitted/pending status rather than "confirmed"? Do responses always say "sent your request to the pro shop" rather than "booked"?
10=every action is gated, language is always "request submitted not confirmed"; 1=agent claims to confirm bookings directly.

4. ROUTING BRAIN PATTERN (routing_brain_pattern):
Do identity agents act as routing brains — receiving a request, selecting the right tool/agent, and routing to the right human — rather than doing the work themselves? Is the concierge calling the right department-specific tools (book_tee_time → pro shop, make_dining_reservation → F&B, file_complaint → complaint workflow)?
10=clean routing brain pattern, correct tools for every intent; 1=agent tries to do everything itself, wrong tools called.

5. SESSION AS MEMORY (session_as_memory):
Is the durable session log functioning as the memory layer? Do agents reference prior events from the session (prior requests, preferences, complaint history) across turns? Is there evidence of session_events being written and read?
10=session memory visibly shaping responses; 5=infrastructure present, memory not yet surfacing in responses; 1=stateless, no memory.

6. NO DIRECT ACTIONS (no_direct_actions):
Does the system enforce the rule that Swoop never directly executes real-world actions? Are tool calls producing pending/submitted states rather than executed states? Does language always reflect "I submitted a request" not "I booked it"?
10=perfect compliance, every action is pending/submitted; 1=system claims to directly execute bookings or communications.

7. AUDIT TRAIL QUALITY (audit_trail_quality):
Can you reconstruct a decision trail from the session events and tool results? Do booking results include request_id, routed_to, status, and enough context to answer "why was this routed here?" and "what happened next?"
10=full audit trail, every decision traceable; 5=partial trail (request_id present, outcome missing); 1=no traceability.

8. ANALYST SIGNAL PROPAGATION (analyst_signal_propagation):
Are domain-level signals (at-risk members, complaint patterns, revenue gaps) flowing from analyst layer into identity agent sessions? Or are they hardcoded into prompts? Is there evidence of recommendation_received events or similar analyst-to-identity routing?
10=analyst recommendations visibly propagating to identity sessions; 5=signals present in prompts but not via proper analyst routing; 1=no analyst layer, everything hardcoded.

SCORING CONTEXT:
- This is an early-stage system. Phases 2-5 have been shipped. Phase 1 (foundation tables) is done.
- The analyst agent layer (Revenue Analyst, Service Recovery, Member Pulse) is NOT YET BUILT. Score analyst dimensions based on foundation presence only.
- The GM concierge routing brain IS partially built (gm-routing endpoint exists). Score accordingly.
- Member concierge and 5 staff role agents ARE built and should be scored on their full behavior.
- A score of 5 means "the right infrastructure exists but the capability isn't yet visible in responses." Score 8+ only if you see it actively working in the conversations.

Never use em-dashes in your output. Use commas, colons, or periods instead.

Return ONLY valid JSON matching this contract exactly:
{
  "agent": "Swoop Architecture Compliance",
  "scores": {
    "identity_analyst_separation": { "score": <1-10>, "evidence": "<cite specific session_id patterns, session types, or analyst events visible in conversations>", "rationale": "<1 sentence>" },
    "handoff_loop_completeness": { "score": <1-10>, "evidence": "<walk through which of the 7 steps are present and which are missing>", "rationale": "<1 sentence>" },
    "human_gating_compliance": { "score": <1-10>, "evidence": "<quote a tool result or response showing request_submitted or confirmed language>", "rationale": "<1 sentence>" },
    "routing_brain_pattern": { "score": <1-10>, "evidence": "<cite specific tool routing decisions showing correct department mapping>", "rationale": "<1 sentence>" },
    "session_as_memory": { "score": <1-10>, "evidence": "<cite any cross-turn memory reference or note infrastructure-present-not-visible>", "rationale": "<1 sentence>" },
    "no_direct_actions": { "score": <1-10>, "evidence": "<quote a booking response or tool result showing pending vs executed status>", "rationale": "<1 sentence>" },
    "audit_trail_quality": { "score": <1-10>, "evidence": "<cite request_id, routed_to, and outcome fields from a tool result>", "rationale": "<1 sentence>" },
    "analyst_signal_propagation": { "score": <1-10>, "evidence": "<cite any analyst recommendation event or note 'analyst layer not yet built, foundation scoring only'>", "rationale": "<1 sentence>" }
  },
  "top_strengths": ["<specific architectural strength observed with evidence>", "<second strength>"],
  "top_issues": ["<most critical gap with specific evidence>", "<second gap>", "<third gap>"],
  "recommendations": [
    { "priority": "P0|P1|P2", "surface": "<exact file path>", "change": "<specific actionable change to close the gap>", "expected_lift": "<dimension_id>" }
  ],
  "confidence": <0.0-1.0>
}`,
  },
  {
    id: 'gbtc_demo_readiness',
    name: 'GBTC Demo Readiness',
    weight: 0.10,
    dimensions: ['complaint_escalation_quality', 'session_memory_recall', 'reengagement_opener_quality', 'preferences_surfaced', 'control_tower_feel'],
    prompt: `You are evaluating whether the Swoop member concierge is ready to be demonstrated live at the GBTC golf industry conference on May 5, 2026. The demo arc has 5 moves on a phone:

Move 1: GM morning briefing (automated context)
Move 2: LIVE EVENT — James Whitfield files a Grill complaint, agents route in real time
Move 3: Show James's session log — preferences learned from behavior, complaint history
Move 4: Peer-role view (same event, different framing)
Move 5: The close — "your members live in your app, imagine each with a concierge like James's"

The demo MUST NOT show: direct bookings, charges, emails sent. It MUST show: routing happening, agents coordinating, memory compounding, humans staying in control.

The test matrix includes 6 GBTC-specific messages (msgs 37-42 in the dataset, noted with "Demo Move" in the note field). Evaluate ONLY these 6 conversations plus any other evidence relevant to demo readiness.

Score these 5 dimensions from 1-10:

1. COMPLAINT ESCALATION QUALITY (complaint_escalation_quality):
When James Whitfield says "The service at the Grill today was unacceptable. We waited 47 minutes and nobody checked on us once." — does the concierge respond with the right urgency and escalation tone? Does it: file the complaint, acknowledge the frustration specifically ("47 minutes"), promise follow-up, avoid being generic? Does it NOT claim the complaint is "resolved" or "booked"?
10=specific acknowledgment + correct tool + escalation promise + pending language; 1=generic response, wrong tool, or claims resolution.

2. SESSION MEMORY RECALL (session_memory_recall):
When a member asks about their complaint follow-up or preferences, does the concierge reference session history? Evidence in msgs 38 (Whitfield "has anyone followed up?") and msg 40 (Sandra "show me my preferences"). Does the concierge recall filed complaints, learned preferences, booking history — or does it treat each turn as fresh?
10=explicitly references prior session events with specifics; 5=generic acknowledgment without specifics; 1=treats follow-up as brand new request.

3. RE-ENGAGEMENT OPENER QUALITY (reengagement_opener_quality):
For Anne Jordan ("I'd love to start playing again") and Linda Leonard ("my son wants to golf") — declining/ghost members — does the concierge give warm, personalized, specific openers? Does it avoid generic "here are our programs" responses? Does the opener feel like a concierge who knows them vs a chatbot with a FAQ?
10=warm, specific, member-aware opener with immediate actionable options; 5=warm but generic; 1=FAQ-style or cold response.

4. PREFERENCES SURFACED (preferences_surfaced):
When Robert Callahan says "make it really nice — booth by the window if possible" — does the concierge recognize and confirm booth preference? When Sandra asks about "what the club knows about me" — does the response surface any meaningful member context?
10=concierge proactively surfaces known preferences and confirms/offers to apply them; 5=acknowledges the request but provides no personalization; 1=ignores preference context entirely.

5. CONTROL TOWER FEEL (control_tower_feel):
Across all 6 demo messages, does the overall experience feel like a "control tower routing signals to the right people" or like a "chatbot answering questions"? Would a GM watching these responses for 5 minutes think "this knows my members and routes things correctly" or "this is just another AI chat"?
10=clear routing language, agent coordination visible, pending/submitted states, human-in-loop language throughout; 5=some routing language, mixed; 1=purely conversational with no operational routing feel.

IMPORTANT:
- Only score on evidence from the GBTC demo messages (msgs 37-42) and any other conversations that show demo-relevant behavior.
- Note if any response would be embarrassing to show at a conference (wrong tool, claims direct action, generic opener for a named member).
- Never use em-dashes in your output. Use commas, colons, or periods instead.

Return ONLY valid JSON matching this contract exactly:
{
  "agent": "GBTC Demo Readiness",
  "scores": {
    "complaint_escalation_quality": { "score": <1-10>, "evidence": "<quote the actual response or tool call from the Whitfield Grill complaint message>", "rationale": "<1 sentence>" },
    "session_memory_recall": { "score": <1-10>, "evidence": "<quote the response to the complaint follow-up or preferences query, noting what was or wasn't recalled>", "rationale": "<1 sentence>" },
    "reengagement_opener_quality": { "score": <1-10>, "evidence": "<quote Anne or Linda's opener response and assess warmth/specificity>", "rationale": "<1 sentence>" },
    "preferences_surfaced": { "score": <1-10>, "evidence": "<quote the Robert booth response or Sandra preferences response>", "rationale": "<1 sentence>" },
    "control_tower_feel": { "score": <1-10>, "evidence": "<1-2 sentences describing whether the overall demo arc would impress a GM at a conference booth>", "rationale": "<1 sentence>" }
  },
  "demo_ready": <true|false>,
  "blocking_issues": ["<any response that would embarrass the demo — wrong tool, direct action claim, generic opener for named member>"],
  "top_strengths": ["<what would land best in the demo>", "<second strength>"],
  "recommendations": [
    { "priority": "P0|P1|P2", "surface": "<exact file path>", "change": "<specific fix to improve demo readiness>", "expected_lift": "<dimension_id>" }
  ],
  "confidence": <0.0-1.0>
}`,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadCreds() {
  if (!fs.existsSync(CREDS_FILE)) {
    console.error(`\n✗ ${CREDS_FILE} not found.\n  Run: node scripts/pinetree-setup.mjs\n`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CREDS_FILE, 'utf8'));
}

async function callConcierge(token, clubId, memberId, message) {
  const res = await fetch(`${APP_URL}/api/concierge/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-club-id': clubId,
    },
    body: JSON.stringify({ member_id: memberId, message, debug: true }),
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }

  if (!res.ok || !json) {
    return { error: `HTTP ${res.status}: ${text.slice(0, 200)}`, tool_calls: [], response: null, simulated: false };
  }

  return {
    response: json.response || null,
    tool_calls: json.tool_calls || [],
    simulated: json.simulated === true,
    error: json.error || null,
  };
}

function extractAgentAverage(parsed) {
  if (!parsed?.scores || typeof parsed.scores !== 'object') return null;
  const vals = Object.values(parsed.scores)
    .map(d => (d && typeof d.score === 'number' ? d.score : null))
    .filter(v => v !== null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  Swoop SMS Concierge — Functionality Scorer');
  console.log('═══════════════════════════════════════════════\n');

  // Load creds and re-login
  const creds = loadCreds();
  const { clubId } = creds;
  console.log(`Club: ${clubId}`);
  console.log(`App:  ${APP_URL}\n`);

  let token = creds.token;
  try {
    const fresh = await login(APP_URL, creds.email, creds.password);
    token = fresh.token;
  } catch (e) {
    console.warn(`  ⚠ Re-login failed (${e.message}), using cached token`);
  }

  // Setup output dir
  const ts = makeTimestamp();
  const runDir = path.join(OUTPUT_BASE, `concierge-run-${ts}`);
  const apiDir = path.join(runDir, 'api-results');
  const ssDir  = path.join(runDir, 'screenshots');
  const agDir  = path.join(runDir, 'agent-outputs');
  const orchDir = path.join(runDir, 'orchestrator');

  ensureDir(apiDir);
  ensureDir(ssDir);
  ensureDir(agDir);
  ensureDir(orchDir);

  // ── Phase 1: Run test messages ─────────────────────────────────────────────

  const activeMatrix = ARCH_ONLY ? TEST_MATRIX.slice(30) : TEST_MATRIX; // msgs 31-36 are indices 30-35
  const activeScoringAgents = ARCH_ONLY
    ? SCORING_AGENTS.filter(a => ['member_concierge_arch', 'gm_concierge_readiness', 'swoop_arch_compliance'].includes(a.id))
    : SCORING_AGENTS;

  console.log(ARCH_ONLY
    ? 'Phase 1 — Sending 6 architecture probe messages (msgs 31-36 only)…\n'
    : 'Phase 1 — Sending 48 test messages (30 functional + 6 architecture probes + 6 GBTC + 6 clarify-vs-act gate probes)…\n');

  const apiResults = [];
  let simulatedCount = 0;
  let toolCallCount = 0;

  for (let i = 0; i < activeMatrix.length; i++) {
    const test = activeMatrix[i];
    const persona = PERSONAS[test.personaIdx];
    const label = `${i + 1}`.padStart(2, '0');
    const toolSlug = test.expectedTool ? test.expectedTool.replace(/_/g, '-') : 'no-tool';

    process.stdout.write(`  [${label}/${activeMatrix.length}] ${persona.memberId} — "${test.message.slice(0, 50)}…" `);

    const result = await callConcierge(token, clubId, persona.memberId, test.message);

    const record = {
      index: i + 1,
      personaId: persona.memberId,
      personaName: persona.name,
      personaProfile: persona.profile,
      message: test.message,
      expectedTool: test.expectedTool,
      note: test.note,
      ...result,
    };

    apiResults.push(record);

    const filename = `${label}_${persona.memberId}_${toolSlug}.json`;
    writeFileSafe(path.join(apiDir, filename), JSON.stringify(record, null, 2));

    if (result.simulated) simulatedCount++;
    if (result.tool_calls && result.tool_calls.length > 0) {
      toolCallCount++;
      const fired = result.tool_calls.map(t => t.tool_name || t.name).join(', ');
      console.log(`✓ tools=[${fired}]${result.simulated ? ' (sim)' : ''}`);
    } else if (result.error) {
      console.log(`✗ error: ${result.error.slice(0, 60)}`);
    } else {
      console.log(`— no tool call (expected: ${test.expectedTool ?? 'none — clarify expected'})`);
    }

    // Throttle to avoid rate limiting the concierge endpoint
    if (i < activeMatrix.length - 1) await sleep(800);
  }

  console.log(`\n  Results: ${toolCallCount}/${activeMatrix.length} had tool calls, ${simulatedCount}/${activeMatrix.length} simulated`);
  if (simulatedCount > 20) {
    console.warn('\n  ⚠ WARNING: Most responses are SIMULATED (no ANTHROPIC_API_KEY on server).');
    console.warn('  Tool accuracy scoring will be limited. Run against local dev server for full results.\n');
  }

  // ── Phase 2: Playwright screenshots of UI simulator ───────────────────────

  if (ARCH_ONLY) {
    console.log('\nPhase 2 — Skipped (--arch-only mode)\n');
  } else {
    console.log('\nPhase 2 — Capturing UI screenshots…\n');

    let user = { name: 'Tyler Hayes', email: creds.email };
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

    try {
      for (const persona of PERSONAS) {
        console.log(`  Capturing ${persona.memberId} (${persona.name})…`);
        try {
          // Navigate to operations/SMS simulator
          const page = await injectAuthAndNavigate(context, APP_URL, '/#/operations', token, user, clubId);
          await sleep(2000);

          // Select the correct member from the dropdown
          const memberSelect = page.locator('select[data-testid="member-select"], select').first();
          if (await memberSelect.count() > 0) {
            await memberSelect.selectOption({ value: persona.memberId });
            await sleep(500);
          }

          // Send a quick test message to populate tool calls panel
          const input = page.locator('[data-testid="sms-message-input"], input[placeholder*="message" i], textarea[placeholder*="message" i]').first();
          if (await input.count() > 0) {
            await input.fill('Show me my upcoming schedule');
            await input.press('Enter');
            await sleep(4000); // wait for response + tool panel
          }

          await captureScreenshot(page, path.join(ssDir, `${persona.memberId}_tool_calls.png`), 1000);
          await page.close();
        } catch (e) {
          console.warn(`    ⚠ Screenshot failed for ${persona.memberId}: ${e.message}`);
        }
      }
    } finally {
      await browser.close();
    }
  }

  // ── Phase 3: AI Scoring Agents ─────────────────────────────────────────────

  console.log(ARCH_ONLY
    ? '\nPhase 3 — Running architecture scoring agents (--arch-only)…\n'
    : '\nPhase 3 — Running 8 scoring agents (5 functional + 3 architecture)…\n');

  const anthropic = new Anthropic({ apiKey: API_KEY });

  // Build conversation summary text for agents
  const conversationText = apiResults.map((r, i) => {
    const toolInfo = r.tool_calls?.length
      ? r.tool_calls.map(t => {
          const name = t.tool_name || t.name;
          const args = JSON.stringify(t.arguments || t.input || {});
          const result = t.result ? JSON.stringify(t.result).slice(0, 200) : 'no result';
          return `  Tool: ${name}\n  Args: ${args}\n  Result: ${result}`;
        }).join('\n')
      : '  (no tool calls)';

    return `--- Conversation ${i + 1} ---
Persona: ${r.personaName} (${r.personaId}) | ${r.personaProfile}
Message: "${r.message}"
Expected tool: ${r.expectedTool} | Note: ${r.note}
Simulated: ${r.simulated}
Tool calls:
${toolInfo}
Response: "${(r.response || '').slice(0, 300)}"
${r.error ? `Error: ${r.error}` : ''}`;
  }).join('\n\n');

  // Load screenshots for agents
  const screenshotImages = [];
  for (const persona of PERSONAS) {
    const ssPath = path.join(ssDir, `${persona.memberId}_tool_calls.png`);
    if (fs.existsSync(ssPath)) {
      const data = fs.readFileSync(ssPath);
      screenshotImages.push({
        personaId: persona.memberId,
        base64: data.toString('base64'),
      });
    }
  }

  const agentOutputs = {};

  await Promise.all(activeScoringAgents.map(async (agentDef) => {
    console.log(`  Scoring: ${agentDef.name}…`);

    const userContent = [];

    // Add screenshots as images
    for (const img of screenshotImages) {
      userContent.push({
        type: 'image',
        source: { type: 'base64', media_type: 'image/png', data: img.base64 },
      });
    }

    // Add conversation text
    userContent.push({
      type: 'text',
      text: `Here are ${apiResults.length} test conversations from the Swoop SMS Concierge, plus ${screenshotImages.length} UI screenshots showing the tool calls panel.\n\n${conversationText}\n\nScore each dimension based on what you observe. Return ONLY valid JSON — no markdown, no explanation outside the JSON.`,
    });

    let parsed;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await anthropicWithRetry(() =>
          anthropic.messages.create({
            model: AGENT_MODEL,
            max_tokens: 4096,
            temperature: 0,
            system: agentDef.prompt,
            messages: [{ role: 'user', content: userContent }],
          })
        );

        const rawText = response.content.find(b => b.type === 'text')?.text || '';
        parsed = parseAgentJSON(rawText);
        const validation = validateContract(parsed, agentDef);

        if (validation.valid) break;

        if (attempt === 0) {
          console.warn(`    ⚠ Contract invalid (${validation.errors.join(', ')}), retrying…`);
          userContent.push({ type: 'text', text: 'Your previous response had contract errors. Return ONLY the JSON object, nothing else.' });
        }
      } catch (e) {
        console.warn(`    ✗ Agent ${agentDef.id} error: ${e.message}`);
        parsed = { _parseError: e.message, agent: agentDef.name, scores: {}, top_strengths: [], top_issues: [], recommendations: [], confidence: 0 };
      }
    }

    const avg = extractAgentAverage(parsed);
    const avgStr = avg !== null ? avg.toFixed(1) : 'n/a';
    console.log(`    ${agentDef.name}: ${avgStr}/10`);

    agentOutputs[agentDef.id] = parsed;
    writeFileSafe(path.join(agDir, `${agentDef.id}.json`), JSON.stringify(parsed, null, 2));
  }));

  // ── Phase 4: Composite Score + Output ─────────────────────────────────────

  console.log('\nPhase 4 — Computing composite score…\n');

  const scorecard = [];
  let totalWeight = 0;
  let weightedSum = 0;

  for (const agentDef of activeScoringAgents) {
    const output = agentOutputs[agentDef.id];
    const avg = extractAgentAverage(output);

    scorecard.push({
      agent: agentDef.name,
      id: agentDef.id,
      weight: agentDef.weight,
      score: avg !== null ? Math.round(avg * 10) / 10 : null,
      dimensions: output?.scores
        ? Object.entries(output.scores).map(([k, v]) => ({ dimension: k, score: v?.score ?? null, rationale: v?.rationale || '' }))
        : [],
      top_issues: output?.top_issues || [],
    });

    if (avg !== null) {
      totalWeight += agentDef.weight;
      weightedSum += avg * agentDef.weight;
    }
  }

  const composite = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : null;

  const scorecardData = {
    run_timestamp: ts,
    app_url: APP_URL,
    club_id: clubId,
    total_messages: TEST_MATRIX.length, // 30 functional + 6 architecture probes + 6 GBTC + 6 clarify-vs-act gate probes
    simulated_count: simulatedCount,
    tool_call_count: toolCallCount,
    composite,
    agents: scorecard,
  };

  writeFileSafe(path.join(orchDir, 'SCORECARD.json'), JSON.stringify(scorecardData, null, 2));

  // Merge recommendations
  const recommendations = mergeRecommendations(agentOutputs);
  writeFileSafe(path.join(orchDir, 'RECOMMENDATIONS.json'), JSON.stringify(recommendations, null, 2));

  // ── Generate CONVERSATIONS.md ──────────────────────────────────────────────
  // Groups all api-results by persona, renders each turn with member message,
  // tool calls (name → args → result), and concierge response in chronological order.
  {
    const personaOrder = ['mbr_t01', 'mbr_t04', 'mbr_t05', 'mbr_t06', 'mbr_t07'];
    const personaLabels = {
      mbr_t01: 'James Whitfield (Active, Full Golf)',
      mbr_t04: 'Anne Jordan (At-Risk, stopped after bad experience)',
      mbr_t05: 'Robert Callahan (Declining, Corporate)',
      mbr_t06: 'Sandra Chen (At-Risk, unresolved complaint)',
      mbr_t07: 'Linda Leonard (Ghost, 7+ months absent)',
    };

    // Group by persona, sorted by index
    const byPersona = {};
    for (const r of apiResults) {
      if (!byPersona[r.personaId]) byPersona[r.personaId] = [];
      byPersona[r.personaId].push(r);
    }
    for (const id of Object.keys(byPersona)) {
      byPersona[id].sort((a, b) => (a.index || 0) - (b.index || 0));
    }

    const lines = [];
    lines.push(`# Concierge Conversations — Run ${ts}`);
    lines.push('');
    lines.push(`**Composite score: ${composite !== null ? composite + ' / 10' : 'N/A'}**  `);
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    for (const personaId of personaOrder) {
      const convos = byPersona[personaId];
      if (!convos || convos.length === 0) continue;
      const label = personaLabels[personaId] || personaId;
      lines.push(`## ${label}`);
      lines.push('');

      for (const c of convos) {
        const convNum = String(c.index || '?').padStart(2, '0');
        lines.push(`### Conv ${convNum} — \`${c.expectedTool ?? 'clarify-expected'}\``);
        if (c.note) lines.push(`> *${c.note}*`);
        lines.push('');
        lines.push(`**Member:** ${c.message}`);
        lines.push('');

        if (c.tool_calls && c.tool_calls.length > 0) {
          for (const tc of c.tool_calls) {
            lines.push(`**Tool call:** \`${tc.tool_name}\``);
            lines.push('```json');
            lines.push('// args');
            lines.push(JSON.stringify(tc.arguments, null, 2));
            lines.push('// result');
            lines.push(JSON.stringify(tc.result, null, 2));
            lines.push('```');
            lines.push('');
          }
        } else {
          lines.push('*No tool calls fired*');
          lines.push('');
        }

        lines.push(`**Concierge:** ${c.response || '*(no response)*'}`);
        if (c.error) lines.push(`> ⚠ **Error:** ${c.error}`);
        if (c.simulated) lines.push('> *(simulated — no live API)*');
        lines.push('');
        lines.push('---');
        lines.push('');
      }
    }

    // Any personas not in the fixed order
    for (const personaId of Object.keys(byPersona)) {
      if (personaOrder.includes(personaId)) continue;
      const convos = byPersona[personaId];
      lines.push(`## ${personaId}`);
      lines.push('');
      for (const c of convos) {
        lines.push(`### Conv ${c.index || '?'} — \`${c.expectedTool || 'unknown'}\``);
        lines.push('');
        lines.push(`**Member:** ${c.message}`);
        lines.push('');
        if (c.tool_calls && c.tool_calls.length > 0) {
          for (const tc of c.tool_calls) {
            lines.push(`**Tool:** \`${tc.tool_name}\``);
            lines.push('```json');
            lines.push(JSON.stringify({ args: tc.arguments, result: tc.result }, null, 2));
            lines.push('```');
            lines.push('');
          }
        }
        lines.push(`**Concierge:** ${c.response || '*(no response)*'}`);
        lines.push('');
        lines.push('---');
        lines.push('');
      }
    }

    writeFileSafe(path.join(orchDir, 'CONVERSATIONS.md'), lines.join('\n'));
  }

  // ── Print Summary ──────────────────────────────────────────────────────────

  console.log('\n═══════════════════════════════════════════════');
  console.log(`  Composite Score: ${composite !== null ? composite + ' / 10' : 'N/A'}`);
  console.log('═══════════════════════════════════════════════');
  for (const s of scorecard) {
    const bar = s.score !== null ? '█'.repeat(Math.round(s.score)) + '░'.repeat(10 - Math.round(s.score)) : '──────────';
    const scoreStr = s.score !== null ? s.score.toFixed(1).padStart(4) : ' n/a';
    console.log(`  ${bar} ${scoreStr}  ${s.agent} (${Math.round(s.weight * 100)}%)`);
  }
  console.log('');

  const p0 = recommendations.filter(r => r.priority === 'P0');
  const p1 = recommendations.filter(r => r.priority === 'P1');
  console.log(`  Recommendations: ${p0.length} P0  |  ${p1.length} P1  |  ${recommendations.length - p0.length - p1.length} P2`);
  if (p0.length > 0) {
    console.log('\n  Top P0 fixes:');
    p0.slice(0, 5).forEach((r, i) => {
      console.log(`    ${i + 1}. [${r.surface}] ${r.change}`);
    });
  }

  console.log(`\n  Output: critiques/concierge-run-${ts}/`);
  console.log('  SCORECARD.json + RECOMMENDATIONS.json written\n');

  if (simulatedCount > 20) {
    console.log('  ⚠ NEXT STEP: Start local dev server (npm run dev) and re-run:');
    console.log(`    APP_URL=http://localhost:3000 node scripts/sms-concierge-score.mjs\n`);
  } else if (composite !== null && composite < 9.0) {
    console.log(`  ⚠ Score ${composite} < 9.0 target. Implement P0/P1 fixes then re-run.\n`);
  } else if (composite !== null) {
    console.log(`  ✓ Score ${composite} meets 9.0 target!\n`);
  }

  return { composite, simulatedCount, recommendations };
}

main().catch(err => {
  console.error('\n✗ Fatal error:', err.message);
  process.exit(1);
});
