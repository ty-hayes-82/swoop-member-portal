/**
 * api/agents/staff-harness.js
 *
 * Phase 4: Shared harness for all five staff role agents.
 *
 * Provides two exported functions:
 *   runStaffAgent({ role, userId, clubId, message, triggerType })
 *   deliverMorningBriefing({ role, userId, clubId, signals })
 *
 * Roles: membership_director, fb_director, head_pro, dining_room_manager, controller
 *
 * Each call:
 *   1. Gets or creates the agent session for this role.
 *   2. Fetches pending handoffs and recent events for context.
 *   3. Loads the role-specific prompt.
 *   4. Calls claude-sonnet with prompt + context + message.
 *   5. Emits events to the universal session log.
 */
import { getAnthropicClient } from './managed-config.js';
import {
  getOrCreateAgentSession,
  emitAgentEvent,
  getAgentEvents,
  getPendingHandoffs,
  formatEventSliceAsContext,
} from './session-core.js';
import {
  buildMembershipDirectorPrompt,
  buildFbDirectorPrompt,
  buildHeadProPrompt,
  buildDiningRoomManagerPrompt,
  buildControllerPrompt,
} from '../../src/config/staffAgentPrompts.js';

const STAFF_MODEL = 'claude-sonnet-4-20250514';
const STAFF_MAX_TOKENS = 2048;

// ---------------------------------------------------------------------------
// Role prompt dispatch
// ---------------------------------------------------------------------------

const ROLE_PROMPT_BUILDERS = {
  membership_director: buildMembershipDirectorPrompt,
  fb_director: buildFbDirectorPrompt,
  head_pro: buildHeadProPrompt,
  dining_room_manager: buildDiningRoomManagerPrompt,
  controller: buildControllerPrompt,
};

const VALID_ROLES = new Set(Object.keys(ROLE_PROMPT_BUILDERS));

// ---------------------------------------------------------------------------
// Main exported functions
// ---------------------------------------------------------------------------

/**
 * Run a staff role agent for a single message turn.
 *
 * @param {object} params
 * @param {string} params.role - One of the five valid role slugs.
 * @param {string} params.userId - Staff user ID.
 * @param {string} params.clubId - Club UUID.
 * @param {string} params.message - The message or query from the staff user.
 * @param {string} [params.triggerType] - 'chat' | 'morning_briefing' | 'signal' (default: 'chat')
 * @param {object} [params.club] - { name, club_id } for prompt context.
 * @returns {Promise<{ response: string, session_id: string, pending_handoffs: object[] }>}
 */
export async function runStaffAgent({ role, userId, clubId, message, triggerType = 'chat', club = null }) {
  if (!VALID_ROLES.has(role)) {
    throw new Error(`Invalid staff role: ${role}. Must be one of: ${[...VALID_ROLES].join(', ')}`);
  }

  const sessionId = `staff_${userId}_${role}`;

  // 1. Ensure session exists
  await getOrCreateAgentSession(sessionId, 'identity', userId, clubId);

  // 2. Fetch pending handoffs for context injection
  let pendingHandoffs = [];
  try {
    pendingHandoffs = await getPendingHandoffs(sessionId);
  } catch (e) {
    console.warn('[staff-harness] getPendingHandoffs failed:', e.message);
  }

  // 3. Fetch recent events for context injection
  let recentEvents = [];
  try {
    recentEvents = await getAgentEvents(sessionId, { last: 15 });
  } catch (e) {
    console.warn('[staff-harness] getAgentEvents failed:', e.message);
  }

  // 4. Build role prompt with signals
  const signals = {
    pendingHandoffs,
    agentEvents: recentEvents,
    recentRecommendations: [],
  };
  const clubContext = club || { name: 'the club', club_id: clubId };
  const promptBuilder = ROLE_PROMPT_BUILDERS[role];
  let systemPrompt = promptBuilder(clubContext, signals);

  // Append formatted event history as additional context
  const eventContext = formatEventSliceAsContext(recentEvents);
  if (eventContext) {
    systemPrompt += `\n\nRecent session history:\n${eventContext}`;
  }

  // 5. Emit user_message event before calling the model
  emitAgentEvent(sessionId, clubId, {
    type: 'user_message',
    text: message,
    source_agent: `staff_${role}`,
  }).catch(() => {});

  // 6. Call the model
  const client = getAnthropicClient();
  let responseText = '';
  try {
    const result = await client.messages.create({
      model: STAFF_MODEL,
      max_tokens: STAFF_MAX_TOKENS,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    });
    responseText = result.content.find(c => c.type === 'text')?.text || '';
  } catch (err) {
    console.error(`[staff-harness] Claude call failed for role=${role}:`, err.message);
    throw err;
  }

  // 7. Emit agent_response event
  emitAgentEvent(sessionId, clubId, {
    type: 'agent_response',
    text: responseText,
    source_agent: `staff_${role}`,
  }).catch(() => {});

  return {
    response: responseText,
    session_id: sessionId,
    pending_handoffs: pendingHandoffs,
  };
}

/**
 * Generate the morning briefing for a staff role agent.
 *
 * @param {object} params
 * @param {string} params.role - One of the five valid role slugs.
 * @param {string} params.userId - Staff user ID.
 * @param {string} params.clubId - Club UUID.
 * @param {object} [params.signals] - { pendingHandoffs, agentEvents, recentRecommendations }
 * @param {object} [params.club] - { name, club_id }
 * @returns {Promise<{ priorities: string[], at_risk_items: string[], pending_actions: string[], raw_response: string }>}
 */
export async function deliverMorningBriefing({ role, userId, clubId, signals = null, club = null }) {
  if (!VALID_ROLES.has(role)) {
    throw new Error(`Invalid staff role: ${role}. Must be one of: ${[...VALID_ROLES].join(', ')}`);
  }

  const sessionId = `staff_${userId}_${role}`;

  // Get or create the session
  await getOrCreateAgentSession(sessionId, 'identity', userId, clubId);

  // Load signals if not provided
  let resolvedSignals = signals;
  if (!resolvedSignals) {
    const [pendingHandoffs, agentEvents] = await Promise.all([
      getPendingHandoffs(sessionId).catch(() => []),
      getAgentEvents(sessionId, { last: 20 }).catch(() => []),
    ]);
    resolvedSignals = { pendingHandoffs, agentEvents, recentRecommendations: [] };
  }

  const clubContext = club || { name: 'the club', club_id: clubId };
  const promptBuilder = ROLE_PROMPT_BUILDERS[role];
  const systemPrompt = promptBuilder(clubContext, resolvedSignals);

  const briefingRequest = `Generate my morning briefing. Use the signal data provided in the system prompt.
Format your response as:
PENDING ACTIONS: (numbered list)
AT-RISK ITEMS: (numbered list)
TODAY'S PRIORITIES: (numbered list)`;

  const client = getAnthropicClient();
  let rawResponse = '';
  try {
    const result = await client.messages.create({
      model: STAFF_MODEL,
      max_tokens: 1024,
      temperature: 0.2,
      system: systemPrompt,
      messages: [{ role: 'user', content: briefingRequest }],
    });
    rawResponse = result.content.find(c => c.type === 'text')?.text || '';
  } catch (err) {
    console.error(`[staff-harness] Morning briefing call failed for role=${role}:`, err.message);
    throw err;
  }

  // Emit briefing event to session log
  emitAgentEvent(sessionId, clubId, {
    type: 'agent_response',
    text: rawResponse,
    source_agent: `staff_${role}_briefing`,
  }).catch(() => {});

  // Parse the structured response into sections
  const priorities = _extractSection(rawResponse, "TODAY'S PRIORITIES");
  const atRiskItems = _extractSection(rawResponse, 'AT-RISK ITEMS');
  const pendingActions = _extractSection(rawResponse, 'PENDING ACTIONS');

  return {
    priorities,
    at_risk_items: atRiskItems,
    pending_actions: pendingActions,
    raw_response: rawResponse,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Extract a numbered list section from a briefing response.
 * @param {string} text
 * @param {string} sectionHeader
 * @returns {string[]}
 */
function _extractSection(text, sectionHeader) {
  if (!text) return [];
  const headerIndex = text.toUpperCase().indexOf(sectionHeader.toUpperCase());
  if (headerIndex === -1) return [];

  const afterHeader = text.slice(headerIndex + sectionHeader.length);
  // Find the next section header or end of string
  const nextHeaderMatch = afterHeader.match(/\n[A-Z][A-Z\s']+:/);
  const sectionText = nextHeaderMatch
    ? afterHeader.slice(0, nextHeaderMatch.index)
    : afterHeader;

  return sectionText
    .split('\n')
    .map(l => l.replace(/^\s*\d+\.\s*/, '').replace(/^-\s*/, '').trim())
    .filter(l => l.length > 0);
}
