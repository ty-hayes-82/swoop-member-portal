import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const id = req.query['id'] as string;
  const { decision, notes, snooze_days } = (req.body ?? {}) as { decision?: string; notes?: string; snooze_days?: number };

  if (!id || decision !== 'approved' && decision !== 'dismissed') {
    return res.status(400).json({ error: 'id and decision (approved|dismissed) required' });
  }

  const status = decision === 'approved' ? 'confirmed' : 'dismissed';
  const snoozeUntil = decision === 'dismissed' && snooze_days
    ? new Date(Date.now() + snooze_days * 86400_000).toISOString()
    : null;

  const result = await sql`
    UPDATE agent_handoffs
    SET status = ${status}, confirmed_at = NOW(),
        snoozed_until = ${snoozeUntil}
    WHERE id = ${id}
    RETURNING id, from_agent, recommendation_type, club_id
  `;

  if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

  const h = result.rows[0];

  await sql`
    INSERT INTO event_bus (event_type, payload, club_id, created_at)
    VALUES (
      'decision.recorded',
      ${JSON.stringify({ handoff_id: id, decision, notes: notes ?? null, from_agent: h.from_agent, recommendation_type: h.recommendation_type })},
      ${h.club_id},
      NOW()
    )
  `;

  res.json({ ok: true, id, status });
}
