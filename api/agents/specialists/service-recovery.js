/**
 * api/agents/specialists/service-recovery.js
 *
 * Phase 3: Service Recovery Specialist module.
 *
 * Handles complaints, escalations, and billing disputes.
 * Not an HTTP route. Called by the member concierge or staff harness
 * when a complaint or escalation is identified.
 *
 * Uses claude-sonnet for quality empathetic responses.
 * Temperature 0.3 for measured warmth without being formulaic.
 *
 * Exports: runServiceRecoverySpecialist(input, sessionId, clubId, client)
 */
import { emitAgentEvent } from '../session-core.js';

const SERVICE_RECOVERY_MODEL = 'claude-sonnet-4-20250514';

const SERVICE_RECOVERY_SYSTEM_PROMPT = `You are a service recovery specialist for a private club.
Your job is to handle complaints, escalations, and billing disputes with professionalism and genuine care.

Process for every complaint:
1. Acknowledge: name the specific problem the member described.
2. Empathize: one sentence showing you understand how this affected them.
3. Route: tell them exactly which person and department will resolve this, with a timeline.
4. Confirm: restate the reference number and next step so they feel certain something is happening.

Rules:
- Never minimize or deflect. Own the issue on behalf of the club.
- Never promise outcomes beyond your authority (discounts, free items, policy changes).
- Use file_complaint to create a formal complaint record.
- Use send_request_to_club to route to the correct department with urgency context.
- For billing disputes: always route to billing/accounting and provide reference ID.
- Do not use em-dashes. Use commas or colons for structure.
- Keep responses under 4 sentences unless more detail is genuinely needed.
- Close with the member's first name.`;

/**
 * Run the service recovery specialist for a complaint or escalation.
 *
 * @param {object} input - { memberProfile, message, availableTools }
 * @param {string} sessionId - Agent session ID to emit events into.
 * @param {string} clubId - Club UUID.
 * @param {object} client - Anthropic SDK client instance.
 * @returns {Promise<{ response: string, toolCalls: object[] }>}
 */
export async function runServiceRecoverySpecialist(input, sessionId, clubId, client) {
  const { memberProfile, message, availableTools = [] } = input;

  const memberContext = [
    `Member: ${memberProfile?.name || 'Unknown'} (${memberProfile?.membership_type || 'Member'})`,
    `First name: ${memberProfile?.first_name || memberProfile?.name?.split(' ')[0] || 'Member'}`,
    memberProfile?.status ? `Account status: ${memberProfile.status}` : null,
    memberProfile?.preferences?.notes ? `Background notes: ${memberProfile.preferences.notes}` : null,
  ].filter(Boolean).join('\n');

  const systemPrompt = `${SERVICE_RECOVERY_SYSTEM_PROMPT}\n\nMember context:\n${memberContext}`;

  // Emit user_message event before calling the model
  emitAgentEvent(sessionId, clubId, {
    type: 'user_message',
    text: message,
    source_agent: 'service_recovery_specialist',
  }).catch(() => {});

  let result;
  try {
    result = await client.messages.create({
      model: SERVICE_RECOVERY_MODEL,
      max_tokens: 768,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
      tools: availableTools,
    });
  } catch (err) {
    console.error('[service-recovery-specialist] Claude call failed:', err.message);
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
        source_agent: 'service_recovery_specialist',
      }).catch(() => {});
    }
    return { response: '', toolCalls };
  }

  responseText = result.content.find(c => c.type === 'text')?.text || '';

  // Emit agent_response event
  emitAgentEvent(sessionId, clubId, {
    type: 'agent_response',
    text: responseText,
    source_agent: 'service_recovery_specialist',
  }).catch(() => {});

  return { response: responseText, toolCalls };
}
