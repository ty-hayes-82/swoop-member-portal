#!/usr/bin/env node
/**
 * sms-concierge-score.mjs
 *
 * SMS Concierge functionality test + AI scoring pipeline.
 *
 * Sends 36 targeted messages across 5 member personas (30 functional + 6 architecture
 * validation probes for Managed Agents Sprint A-D benefits), captures tool_calls[],
 * takes Playwright screenshots of the UI, then scores with 7 specialist agents:
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
  { personaIdx: 0, message: 'Book my usual Saturday tee time, 7am',              expectedTool: 'book_tee_time',           note: 'date inference + recurring slot' },
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
  { personaIdx: 1, message: 'Book 4 tee times for our group next Saturday morning', expectedTool: 'book_tee_time',        note: 'party size parameter' },
  { personaIdx: 1, message: 'The course was in terrible shape last Sunday',      expectedTool: 'file_complaint',          note: 'course maintenance complaint' },

  // ── Robert Callahan (mbr_t05) — Declining, reactivation ──
  { personaIdx: 2, message: 'Reserve the private dining room for Saturday evening', expectedTool: 'make_dining_reservation', note: 'room preference param' },
  { personaIdx: 2, message: "I'm having trouble with my locker combination",     expectedTool: 'send_request_to_club',    note: 'facilities request' },
  { personaIdx: 2, message: "What's my handicap?",                               expectedTool: 'get_member_profile',      note: 'specific profile field' },
  { personaIdx: 2, message: 'Put me and my wife down for the charity gala',      expectedTool: 'rsvp_event',              note: 'multi-person RSVP' },
  { personaIdx: 2, message: "Get me a tee time Saturday at dawn",                expectedTool: 'book_tee_time',           note: 'vague time expression' },
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
  { personaIdx: 3, message: 'I need to book golf and dinner for Saturday — can you handle both?', expectedTool: 'book_tee_time', note: 'Sprint D: multi-intent routing across booking + dining brains' },
  { personaIdx: 4, message: "I haven't been around in ages — what do I need to know and what should I do first?", expectedTool: 'get_club_calendar', note: 'Sprint D: personal concierge intent + ghost re-engagement' },
  { personaIdx: 0, message: 'Set me up for next Saturday — tee time at 8 and dinner after for me and my client', expectedTool: 'book_tee_time', note: 'Sprint D: multi-request coordination across booking + dining' },
];

// ─── Scoring Agent Definitions ────────────────────────────────────────────────

const SCORING_AGENTS = [
  {
    id: 'tool_accuracy',
    name: 'Tool Selection Accuracy',
    weight: 0.25,
    dimensions: ['correct_tool_fired', 'tool_not_called_when_needed', 'wrong_tool_called', 'ambiguous_handled', 'edge_case_recovery'],
    prompt: `You are a senior QA engineer evaluating an AI concierge for a private country club. Be precise and evidence-based. Do NOT hallucinate evidence. Only cite things actually present in the conversations. Never use em-dashes (—) in your output text: use commas, colons, or periods instead.

IMPORTANT CONTEXT:
- Bookings (tee times, dining, RSVPs, cancellations) correctly return { status: "request_submitted", pending: true, routed_to: "..." } — this is the CORRECT behavior (human-in-the-loop). Do NOT penalize for this.
- When simulated=true, tool_calls[] will be empty — this is an environment issue, not a code bug. Note it per conversation but do not let it tank scores if simulated mode produces coherent responses.
- Score based only on what you can directly observe in the conversations provided.

SCORE EACH DIMENSION 1-10 based only on observed evidence:
- correct_tool_fired: Count conversations where tool_calls[] contains the expected tool. Score = (correct / total_non_simulated) * 10. If all simulated, score 5 and note environment issue.
- tool_not_called_when_needed: How often was tool_calls[] EMPTY on non-simulated responses when an action was clearly needed? (10=never empty when needed, 1=always empty)
- wrong_tool_called: How often was the WRONG tool selected (e.g. get_my_schedule instead of get_club_calendar)? (10=never wrong, 1=frequently wrong)
- ambiguous_handled: For ambiguous messages ("cancel everything", "book my usual"), did the concierge make a reasonable choice rather than failing? (10=always reasonable, 1=always fails)
- edge_case_recovery: When the member has no data (ghost member, no bookings), did the concierge handle gracefully? (10=always graceful, 1=throws errors or gives nonsense)

Return ONLY valid JSON matching this contract exactly:
{
  "agent": "Tool Selection Accuracy",
  "scores": {
    "correct_tool_fired": { "score": <1-10>, "evidence": "<cite specific conversation # and tool names>", "rationale": "<1 sentence stating the count/ratio>" },
    "tool_not_called_when_needed": { "score": <1-10>, "evidence": "<cite specific conversation # where tool was missing>", "rationale": "<1 sentence>" },
    "wrong_tool_called": { "score": <1-10>, "evidence": "<cite specific conversation # where wrong tool was called, or 'none observed'>", "rationale": "<1 sentence>" },
    "ambiguous_handled": { "score": <1-10>, "evidence": "<cite specific ambiguous message and how it was handled>", "rationale": "<1 sentence>" },
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
    id: 'response_naturalness',
    name: 'Response Naturalness',
    weight: 0.17,
    dimensions: ['confirmation_clarity', 'error_messaging', 'tone_warmth', 'action_summary', 'follow_up_proactivity'],
    prompt: `You are a hospitality expert and conversation designer evaluating an AI concierge for a private country club. Be precise and evidence-based. Quote actual response text when citing evidence. Never use em-dashes (—) in your output text: use commas, colons, or periods instead.

IMPORTANT CONTEXT:
- Bookings return { status: "request_submitted", pending: true, routed_to: "Pro Shop" } — the concierge SHOULD say something like "I've sent your request to the pro shop — they'll confirm within the hour." This is correct. Penalize if it says "confirmed" without routing language.
- Banned openers (penalize if used): "Perfect", "Great", "I'm sorry", "Certainly", "Absolutely", "Of course", "Done —", "Filed —", "I've escalated"
- Em-dashes (—) in any response are a style violation: penalize under tone_warmth
- Approved openers: first name, "On it!", "You got it!", "Love it!", "All set!", "Nice!", "Sending that now!", "On the way!"
- Responses must be 2-4 sentences max and use the member's first name at least once.
- No markdown, no bullet points, no asterisks in the response text.

SCORE EACH DIMENSION 1-10 based only on observed responses:
- confirmation_clarity: Does the response clearly state what was sent/requested with specifics (date, time, where it was routed)? (10=always specific — "sent your Saturday 4/19 7am tee time request to the pro shop", 1=vague "done" or no confirmation)
- error_messaging: When tools fail or nothing is found, does the concierge give a helpful response with next steps rather than a blank? (10=always helpful, 1=empty or just "something went wrong")
- tone_warmth: Is the tone warm, texting-natural, and club-appropriate? Uses contractions, first name, emotional reactions? (10=very warm and natural, 1=robotic/formal)
- action_summary: After a tool call, does the response summarize what was done — the specific action, to whom, what to expect next? (10=always specific, 1=just "done" or "filed")
- follow_up_proactivity: After completing a request, does the concierge suggest one related action? (after golf → dinner, after RSVP → related event) (10=always offers follow-up, 1=never)

Return ONLY valid JSON matching this contract exactly:
{
  "agent": "Response Naturalness",
  "scores": {
    "confirmation_clarity": { "score": <1-10>, "evidence": "<quote actual response text showing confirmation or lack thereof>", "rationale": "<1 sentence>" },
    "error_messaging": { "score": <1-10>, "evidence": "<quote specific error response or note none observed>", "rationale": "<1 sentence>" },
    "tone_warmth": { "score": <1-10>, "evidence": "<quote a response showing tone quality>", "rationale": "<1 sentence>" },
    "action_summary": { "score": <1-10>, "evidence": "<quote response showing action summary or its absence>", "rationale": "<1 sentence>" },
    "follow_up_proactivity": { "score": <1-10>, "evidence": "<quote a response with or without follow-up suggestion>", "rationale": "<1 sentence>" }
  },
  "top_strengths": ["<specific observed strength with example>", "<specific observed strength>"],
  "top_issues": ["<specific issue with quoted evidence>", "<specific issue>"],
  "recommendations": [
    { "priority": "P0|P1|P2", "surface": "<src/config/conciergePrompt.js>", "change": "<specific actionable change to system prompt>", "expected_lift": "<dimension_id>" }
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

  // ── Phase 1: Run all 30 API calls ──────────────────────────────────────────

  console.log('Phase 1 — Sending 36 test messages (30 functional + 6 architecture probes)…\n');

  const apiResults = [];
  let simulatedCount = 0;
  let toolCallCount = 0;

  for (let i = 0; i < TEST_MATRIX.length; i++) {
    const test = TEST_MATRIX[i];
    const persona = PERSONAS[test.personaIdx];
    const label = `${i + 1}`.padStart(2, '0');
    const toolSlug = test.expectedTool.replace(/_/g, '-');

    process.stdout.write(`  [${label}/${TEST_MATRIX.length}] ${persona.memberId} — "${test.message.slice(0, 50)}…" `);

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
      console.log(`— no tool call (expected: ${test.expectedTool})`);
    }

    // Throttle to avoid rate limiting the concierge endpoint
    if (i < TEST_MATRIX.length - 1) await sleep(800);
  }

  console.log(`\n  Results: ${toolCallCount}/${TEST_MATRIX.length} had tool calls, ${simulatedCount}/${TEST_MATRIX.length} simulated`);
  if (simulatedCount > 20) {
    console.warn('\n  ⚠ WARNING: Most responses are SIMULATED (no ANTHROPIC_API_KEY on server).');
    console.warn('  Tool accuracy scoring will be limited. Run against local dev server for full results.\n');
  }

  // ── Phase 2: Playwright screenshots of UI simulator ───────────────────────

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

  // ── Phase 3: AI Scoring Agents ─────────────────────────────────────────────

  console.log('\nPhase 3 — Running 7 scoring agents (5 functional + 2 architecture)…\n');

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

  await Promise.all(SCORING_AGENTS.map(async (agentDef) => {
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

  for (const agentDef of SCORING_AGENTS) {
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
    total_messages: TEST_MATRIX.length, // 30 functional + 6 architecture probes
    simulated_count: simulatedCount,
    tool_call_count: toolCallCount,
    composite,
    agents: scorecard,
  };

  writeFileSafe(path.join(orchDir, 'SCORECARD.json'), JSON.stringify(scorecardData, null, 2));

  // Merge recommendations
  const recommendations = mergeRecommendations(agentOutputs);
  writeFileSafe(path.join(orchDir, 'RECOMMENDATIONS.json'), JSON.stringify(recommendations, null, 2));

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
