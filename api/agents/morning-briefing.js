/**
 * api/agents/morning-briefing.js
 *
 * Vercel API route — GM morning briefing from the session event log.
 *
 * GET ?clubId=...&hours=12
 * Response: { recommendations: [...], decisions: [...], recoveries: [...] }
 *
 * Source: agent_handoffs + agent_session_events only.
 * Never queries the analytics Postgres tables directly.
 */

import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = req.query['clubId'];
  const hours = parseInt(req.query['hours'] ?? '12', 10);

  if (!clubId) {
    return res.status(400).json({ error: 'clubId required' });
  }

  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const [handoffs, decisions, recoveries] = await Promise.all([
    sql`
      SELECT from_agent, to_agent, recommendation_type, summary, priority,
             member_id, dollar_impact, created_at
      FROM agent_handoffs
      WHERE club_id = ${clubId}
        AND created_at >= ${since}
        AND status = 'pending'
      ORDER BY priority DESC, created_at DESC
      LIMIT 20
    `,
    sql`
      SELECT session_id, payload, created_at
      FROM agent_session_events
      WHERE event_type = 'decision.made'
        AND created_at >= ${since}
        AND payload->>'club_id' = ${clubId}
      ORDER BY created_at DESC
      LIMIT 10
    `,
    sql`
      SELECT session_id, payload, created_at
      FROM agent_session_events
      WHERE event_type IN ('handoff.confirmed', 'outcome.tracked')
        AND created_at >= ${since}
        AND payload->>'club_id' = ${clubId}
      ORDER BY created_at DESC
      LIMIT 10
    `,
  ]);

  return res.status(200).json({
    as_of: new Date().toISOString(),
    window_hours: hours,
    recommendations: handoffs.rows,
    decisions: decisions.rows.map(r => ({ ...r, payload: r.payload })),
    recent_outcomes: recoveries.rows.map(r => ({ ...r, payload: r.payload })),
  });
}
