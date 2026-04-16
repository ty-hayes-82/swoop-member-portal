/**
 * api/agents/specialists/booking.js
 *
 * Phase 3: Booking Specialist module.
 *
 * Handles tee time, dining, and event booking execution.
 * Not an HTTP route. Called by the member concierge or staff harness
 * when a booking action is identified.
 *
 * Uses claude-haiku for low-cost, high-accuracy booking confirmation.
 * Temperature 0 for deterministic outputs.
 *
 * Exports: runBookingSpecialist(input, sessionId, clubId, client)
 */
import { emitAgentEvent } from '../session-core.js';

const BOOKING_MODEL = 'claude-haiku-4-5-20251001';

const BOOKING_SYSTEM_PROMPT = `You are a booking execution specialist for a private club.
Your only job is to confirm and process booking requests accurately.

Rules:
- Execute the requested booking precisely as described. No upselling, no small talk.
- Confirm every detail: date, time, course/outlet/event, party size, member name.
- If a detail is ambiguous or missing, ask exactly one clarifying question.
- Return a concise confirmation with reference ID, date, time, and location.
- Do not offer alternatives unless the exact request is unavailable.
- Do not use em-dashes. Use commas or colons for structure.
- Response format: brief confirmation sentence, then details as a short list.

Available booking tools: book_tee_time, cancel_tee_time, make_dining_reservation, rsvp_event.`;

/**
 * Run the booking specialist for a single member booking request.
 *
 * @param {object} input - { memberProfile, message, availableTools }
 * @param {string} sessionId - Agent session ID to emit events into.
 * @param {string} clubId - Club UUID.
 * @param {object} client - Anthropic SDK client instance.
 * @returns {Promise<{ response: string, toolCalls: object[] }>}
 */
export async function runBookingSpecialist(input, sessionId, clubId, client) {
  const { memberProfile, message, availableTools = [] } = input;

  // Build compact member context for the prompt
  const memberContext = [
    `Member: ${memberProfile?.name || 'Unknown'} (${memberProfile?.membership_type || 'Member'})`,
    memberProfile?.preferences?.teeWindows ? `Usual tee windows: ${memberProfile.preferences.teeWindows}` : null,
    memberProfile?.preferences?.dining ? `Dining preference: ${memberProfile.preferences.dining}` : null,
  ].filter(Boolean).join('\n');

  const systemPrompt = `${BOOKING_SYSTEM_PROMPT}\n\nMember context:\n${memberContext}`;

  // Emit user_message event before calling the model
  emitAgentEvent(sessionId, clubId, {
    type: 'user_message',
    text: message,
    source_agent: 'booking_specialist',
  }).catch(() => {});

  let result;
  try {
    result = await client.messages.create({
      model: BOOKING_MODEL,
      max_tokens: 512,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
      tools: availableTools,
    });
  } catch (err) {
    console.error('[booking-specialist] Claude call failed:', err.message);
    throw err;
  }

  const toolCalls = [];
  let responseText = '';

  // Handle single tool_use turn if model decides to call a tool
  if (result.stop_reason === 'tool_use') {
    const toolUses = result.content.filter(c => c.type === 'tool_use');
    for (const toolUse of toolUses) {
      toolCalls.push({ tool: toolUse.name, args: toolUse.input });
      emitAgentEvent(sessionId, clubId, {
        type: 'tool_call',
        tool: toolUse.name,
        args: toolUse.input,
        status: 'called',
        source_agent: 'booking_specialist',
      }).catch(() => {});
    }
    // Return structured tool calls for the caller to execute
    return { response: '', toolCalls };
  }

  responseText = result.content.find(c => c.type === 'text')?.text || '';

  // Emit agent_response event
  emitAgentEvent(sessionId, clubId, {
    type: 'agent_response',
    text: responseText,
    source_agent: 'booking_specialist',
  }).catch(() => {});

  return { response: responseText, toolCalls };
}
