/**
 * api/agents/specialists/personal.js
 *
 * Phase 3: Personal Concierge Specialist module.
 *
 * Handles general requests, preference capture, relationship memory,
 * and re-engagement conversations. Focuses on depth, personalization,
 * and warm delivery.
 *
 * Not an HTTP route. Called by the member concierge or staff harness
 * when no booking or service recovery intent is detected.
 *
 * Uses claude-sonnet with temperature 0.5 for natural, warm responses.
 *
 * Exports: runPersonalConciergeSpecialist(input, sessionId, clubId, client)
 */
import { emitAgentEvent } from '../session-core.js';

const PERSONAL_CONCIERGE_MODEL = 'claude-sonnet-4-20250514';

const PERSONAL_CONCIERGE_SYSTEM_PROMPT = `You are a personal concierge for a private club.
Your role is relationship depth, personalization, and genuine care for each member.

Your responsibilities:
- General requests that fall outside booking or complaint handling.
- Capturing and reinforcing member preferences (call get_member_profile to read, note new preferences).
- Re-engagement: warmly reconnecting with members who have been absent.
- Answering club questions, sharing upcoming events, making thoughtful suggestions.
- Routing special requests to the right staff via send_request_to_club.

Tone:
- Warm, personal, and genuinely interested in the member's experience.
- Use the member's first name naturally but not in every sentence.
- Reference known preferences and history when relevant.
- Do not be transactional. This is a relationship, not a ticket queue.
- Do not use em-dashes. Use commas or colons for structure.

Available tools: get_member_profile, send_request_to_club, get_club_calendar.`;

/**
 * Run the personal concierge specialist for general or re-engagement requests.
 *
 * @param {object} input - { memberProfile, message, availableTools }
 * @param {string} sessionId - Agent session ID to emit events into.
 * @param {string} clubId - Club UUID.
 * @param {object} client - Anthropic SDK client instance.
 * @returns {Promise<{ response: string, toolCalls: object[] }>}
 */
export async function runPersonalConciergeSpecialist(input, sessionId, clubId, client) {
  const { memberProfile, message, availableTools = [] } = input;

  const memberContext = [
    `Member: ${memberProfile?.name || 'Unknown'} (${memberProfile?.membership_type || 'Member'})`,
    `First name: ${memberProfile?.first_name || memberProfile?.name?.split(' ')[0] || 'Member'}`,
    `Member since: ${memberProfile?.join_date || 'unknown'}`,
    memberProfile?.status && memberProfile.status !== 'active' ? `Status note: ${memberProfile.status}` : null,
    memberProfile?.household?.length ? `Household: ${memberProfile.household.map(h => h.name).join(', ')}` : null,
    memberProfile?.preferences?.dining ? `Dining preferences: ${memberProfile.preferences.dining}` : null,
    memberProfile?.preferences?.teeWindows ? `Golf preferences: ${memberProfile.preferences.teeWindows}` : null,
    memberProfile?.preferences?.notes ? `Background: ${memberProfile.preferences.notes}` : null,
  ].filter(Boolean).join('\n');

  const systemPrompt = `${PERSONAL_CONCIERGE_SYSTEM_PROMPT}\n\nMember context:\n${memberContext}`;

  // Emit user_message event before calling the model
  emitAgentEvent(sessionId, clubId, {
    type: 'user_message',
    text: message,
    source_agent: 'personal_concierge_specialist',
  }).catch(() => {});

  let result;
  try {
    result = await client.messages.create({
      model: PERSONAL_CONCIERGE_MODEL,
      max_tokens: 1024,
      temperature: 0.5,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
      tools: availableTools,
    });
  } catch (err) {
    console.error('[personal-concierge-specialist] Claude call failed:', err.message);
    throw err;
  }

  const toolCalls = [];
  let responseText = '';

  // Handle tool_use turn
  if (result.stop_reason === 'tool_use') {
    const toolUses = result.content.filter(c => c.type === 'tool_use');
    for (const toolUse of toolUses) {
      toolCalls.push({ tool: toolUse.name, args: toolUse.input });
      emitAgentEvent(sessionId, clubId, {
        type: 'tool_call',
        tool: toolUse.name,
        args: toolUse.input,
        status: 'called',
        source_agent: 'personal_concierge_specialist',
      }).catch(() => {});
    }
    return { response: '', toolCalls };
  }

  responseText = result.content.find(c => c.type === 'text')?.text || '';

  // Emit agent_response event
  emitAgentEvent(sessionId, clubId, {
    type: 'agent_response',
    text: responseText,
    source_agent: 'personal_concierge_specialist',
  }).catch(() => {});

  return { response: responseText, toolCalls };
}
