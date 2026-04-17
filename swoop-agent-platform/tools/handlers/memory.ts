import { z } from 'zod';
import { sql } from '@vercel/postgres';

const ObserveInput = z.object({
  member_id: z.string(),
  preference_type: z.string(),
  value: z.unknown(),
  confidence: z.number().min(0).max(1).optional(),
  source: z.string(),
});

const RecallInput = z.object({
  member_id: z.string(),
  event_types: z.array(z.string()).optional(),
  time_window: z.string().optional(),
  max_events: z.number().int().positive().optional().default(20),
});

const LogDecisionInput = z.object({
  session_id: z.string(),
  decision_type: z.string(),
  disposition: z.enum(['approved', 'overridden', 'dismissed', 'escalated']),
  reasoning_chain: z.array(z.record(z.unknown())).optional(),
  expected_outcome: z.string().optional(),
});

export async function handleObservePreference(input: Record<string, unknown>): Promise<unknown> {
  const parsed = ObserveInput.parse(input);

  await sql`
    INSERT INTO agent_session_events (session_id, event_type, payload, created_at)
    SELECT
      session_id,
      'preference.observed',
      ${JSON.stringify({
        preference_type: parsed.preference_type,
        value: parsed.value,
        confidence: parsed.confidence ?? null,
        source: parsed.source,
        observed_at: new Date().toISOString(),
      })},
      NOW()
    FROM agent_sessions
    WHERE entity_type = 'member' AND entity_id = ${parsed.member_id}
    LIMIT 1
  `;

  return { observed: true, member_id: parsed.member_id, preference_type: parsed.preference_type };
}

export async function handleRecallMemberContext(input: Record<string, unknown>): Promise<unknown> {
  const parsed = RecallInput.parse(input);

  // Build time filter from ISO 8601 duration (P30D → 30 days)
  const daysMatch = parsed.time_window?.match(/^P(\d+)D$/);
  const days = daysMatch?.[1] ? parseInt(daysMatch[1], 10) : 90;

  const eventTypes = parsed.event_types ?? [];

  let rows;
  if (eventTypes.length > 0) {
    const result = await sql`
      SELECT event_type, payload, created_at
      FROM agent_session_events
      WHERE session_id = (
        SELECT session_id FROM agent_sessions
        WHERE entity_type = 'member' AND entity_id = ${parsed.member_id}
        LIMIT 1
      )
      AND event_type = ANY(${eventTypes as unknown as string})
      AND created_at >= NOW() - (${days} || ' days')::interval
      ORDER BY created_at DESC
      LIMIT ${parsed.max_events}
    `;
    rows = result.rows;
  } else {
    const result = await sql`
      SELECT event_type, payload, created_at
      FROM agent_session_events
      WHERE session_id = (
        SELECT session_id FROM agent_sessions
        WHERE entity_type = 'member' AND entity_id = ${parsed.member_id}
        LIMIT 1
      )
      AND created_at >= NOW() - (${days} || ' days')::interval
      ORDER BY created_at DESC
      LIMIT ${parsed.max_events}
    `;
    rows = result.rows;
  }

  return { member_id: parsed.member_id, events: rows, count: rows.length };
}

export async function handleLogDecision(input: Record<string, unknown>): Promise<unknown> {
  const parsed = LogDecisionInput.parse(input);

  await sql`
    INSERT INTO agent_session_events (session_id, event_type, payload, created_at)
    VALUES (
      ${parsed.session_id},
      'decision.made',
      ${JSON.stringify({
        decision_type: parsed.decision_type,
        disposition: parsed.disposition,
        reasoning_chain: parsed.reasoning_chain ?? [],
        expected_outcome: parsed.expected_outcome ?? null,
        logged_at: new Date().toISOString(),
      })},
      NOW()
    )
  `;

  return { logged: true, session_id: parsed.session_id, disposition: parsed.disposition };
}
