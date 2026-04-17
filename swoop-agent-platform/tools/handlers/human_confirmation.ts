import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { randomUUID } from 'node:crypto';

const ConfirmationInput = z.object({
  recipient_role: z.string(),
  action_description: z.string(),
  context_for_human: z.record(z.unknown()).optional(),
  source_system: z.enum(['jonas', 'foretees', 'toast', 'clubessential', 'northstar', 'other']),
  expected_completion: z.string().optional(),
  _session_id: z.string().optional(),
  _agent_name: z.string().optional(),
});

/**
 * Queues a human confirmation request in activity_log (existing table).
 * Returns immediately so the agent thread can continue.
 * The handoff.confirmed event fires separately when staff confirms via
 * the /api/agents/confirm-action endpoint.
 */
export async function handleRequestHumanConfirmation(
  input: Record<string, unknown>,
): Promise<unknown> {
  const parsed = ConfirmationInput.parse(input);
  const confirmationId = `confirm_${randomUUID()}`;

  await sql`
    INSERT INTO activity_log (
      confirmation_id, action_type, recipient_role, description,
      source_system, context_data, status, session_id, agent_name,
      expected_completion, created_at
    )
    VALUES (
      ${confirmationId},
      'human_confirmation_request',
      ${parsed.recipient_role},
      ${parsed.action_description},
      ${parsed.source_system},
      ${parsed.context_for_human ? JSON.stringify(parsed.context_for_human) : null},
      'pending_confirmation',
      ${parsed._session_id ?? null},
      ${parsed._agent_name ?? null},
      ${parsed.expected_completion ?? null},
      NOW()
    )
  `;

  return {
    queued: true,
    confirmation_id: confirmationId,
    recipient_role: parsed.recipient_role,
    source_system: parsed.source_system,
    message: `Action queued for ${parsed.recipient_role} to complete in ${parsed.source_system}. Confirmation ID: ${confirmationId}`,
  };
}
