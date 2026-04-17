import { z } from 'zod';
import { sql } from '@vercel/postgres';

const SurfaceInput = z.object({
  target_role: z.string(),
  recommendation_type: z.string(),
  signal_bundle: z.record(z.unknown()),
  confidence: z.number().min(0).max(1).optional(),
  urgency: z.enum(['now', 'today', 'this_week']).optional().default('today'),
  suggested_action: z.string(),
});

const TrackOutcomeInput = z.object({
  recommendation_id: z.string(),
  outcome: z.string(),
  metric: z.record(z.unknown()).optional(),
  measured_at: z.string().optional(),
});

const HoldInput = z.object({
  gm_session_id: z.string(),
  proposed_action: z.record(z.unknown()),
  hold_reason: z.string(),
});

export async function handleSurfaceRecommendation(input: Record<string, unknown>): Promise<unknown> {
  const parsed = SurfaceInput.parse(input);

  // Write to agent_handoffs (identity agent reads this on wake)
  const result = await sql`
    INSERT INTO agent_handoffs (
      from_agent, to_agent, recommendation_type,
      payload, confidence, urgency, status, created_at
    )
    VALUES (
      'analyst',
      ${parsed.target_role},
      ${parsed.recommendation_type},
      ${JSON.stringify({
        signal_bundle: parsed.signal_bundle,
        suggested_action: parsed.suggested_action,
      })},
      ${parsed.confidence ?? null},
      ${parsed.urgency},
      'pending',
      NOW()
    )
    RETURNING id
  `;

  const recommendationId = result.rows[0]?.id as string;

  // Also publish to event_bus for real-time pickup
  await sql`
    INSERT INTO event_bus (event_type, payload, created_at)
    VALUES (
      'recommendation.surfaced',
      ${JSON.stringify({
        recommendation_id: recommendationId,
        target_role: parsed.target_role,
        recommendation_type: parsed.recommendation_type,
        urgency: parsed.urgency,
        suggested_action: parsed.suggested_action,
        surfaced_at: new Date().toISOString(),
      })},
      NOW()
    )
  `;

  return { surfaced: true, recommendation_id: recommendationId, target_role: parsed.target_role };
}

export async function handleTrackOutcome(input: Record<string, unknown>): Promise<unknown> {
  const parsed = TrackOutcomeInput.parse(input);

  await sql`
    UPDATE agent_handoffs
    SET
      outcome = ${parsed.outcome},
      outcome_metric = ${parsed.metric ? JSON.stringify(parsed.metric) : null},
      outcome_at = ${parsed.measured_at ?? new Date().toISOString()},
      status = 'outcome_tracked'
    WHERE id = ${parsed.recommendation_id}
  `;

  // Emit outcome.tracked event back to the analyst session so it can learn
  await sql`
    INSERT INTO event_bus (event_type, payload, created_at)
    VALUES (
      'outcome.tracked',
      ${JSON.stringify({
        recommendation_id: parsed.recommendation_id,
        outcome: parsed.outcome,
        metric: parsed.metric ?? null,
        measured_at: parsed.measured_at ?? new Date().toISOString(),
      })},
      NOW()
    )
  `;

  return { tracked: true, recommendation_id: parsed.recommendation_id, outcome: parsed.outcome };
}

export async function handleHoldForReview(input: Record<string, unknown>): Promise<unknown> {
  const parsed = HoldInput.parse(input);

  await sql`
    INSERT INTO agent_session_events (session_id, event_type, payload, created_at)
    VALUES (
      ${parsed.gm_session_id},
      'action.held_for_review',
      ${JSON.stringify({
        proposed_action: parsed.proposed_action,
        hold_reason: parsed.hold_reason,
        held_at: new Date().toISOString(),
      })},
      NOW()
    )
  `;

  return { held: true, gm_session_id: parsed.gm_session_id, hold_reason: parsed.hold_reason };
}
