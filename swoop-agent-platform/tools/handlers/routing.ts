import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { getClubContext, isCapabilityAvailable } from '../../sessions/club_context.ts';

const RouteInput = z.object({
  target_role: z.enum(['tee_time', 'fb', 'dining', 'events', 'membership', 'pro_shop', 'controller', 'head_pro']),
  member_context: z.record(z.unknown()).optional(),
  request_summary: z.string(),
  priority: z.enum(['urgent', 'normal', 'whenever']).optional().default('normal'),
});

const EscalateInput = z.object({
  from_role: z.string(),
  to_role: z.string(),
  reason: z.string(),
  original_request: z.record(z.unknown()).optional(),
});

/**
 * Records the routing intent and returns routing metadata.
 * When clubId is provided, enforces capability gates before allowing the route.
 * The actual callable_agent invocation is handled natively by Managed Agents.
 */
export async function handleRouteToRoleAgent(
  input: Record<string, unknown>,
  clubId: string = '',
): Promise<unknown> {
  const parsed = RouteInput.parse(input);

  if (clubId) {
    const ctx = await getClubContext(clubId);
    const check = isCapabilityAvailable(parsed.target_role, ctx);
    if (!check.allowed) {
      return {
        routed: false,
        available: false,
        target_role: parsed.target_role,
        reason: check.reason ?? 'This capability is not currently available.',
      };
    }
  }

  await sql`
    INSERT INTO event_bus (event_type, payload, created_at)
    VALUES (
      'handoff.requested',
      ${JSON.stringify({ ...parsed, routed_at: new Date().toISOString() })},
      NOW()
    )
  `;

  return {
    routed: true,
    target_role: parsed.target_role,
    priority: parsed.priority,
    message: `Request routed to ${parsed.target_role} agent.`,
  };
}

export async function handleEscalateToRole(input: Record<string, unknown>): Promise<unknown> {
  const parsed = EscalateInput.parse(input);

  await sql`
    INSERT INTO event_bus (event_type, payload, created_at)
    VALUES (
      'handoff.escalated',
      ${JSON.stringify({ ...parsed, escalated_at: new Date().toISOString() })},
      NOW()
    )
  `;

  return {
    escalated: true,
    from_role: parsed.from_role,
    to_role: parsed.to_role,
    reason: parsed.reason,
  };
}
