/**
 * api/agents/confirm-action.js
 *
 * Vercel API route — staff confirms a pending human_confirmation request.
 *
 * POST body: { confirmationId, action: 'confirm' | 'dismiss' }
 * Response: { ok: true, confirmationId, action }
 *
 * Updates activity_log row from pending_confirmation → confirmed/dismissed.
 * The originating session's next poll picks up the status change.
 */

import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { confirmationId, action } = req.body ?? {};

  if (!confirmationId || !['confirm', 'dismiss'].includes(action)) {
    return res.status(400).json({ error: 'confirmationId and action (confirm|dismiss) required' });
  }

  const newStatus = action === 'confirm' ? 'confirmed' : 'dismissed';

  const result = await sql`
    UPDATE activity_log
    SET status = ${newStatus}, resolved_at = NOW()
    WHERE confirmation_id = ${confirmationId}
      AND status = 'pending_confirmation'
    RETURNING confirmation_id, session_id, agent_name, action_type
  `;

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Confirmation not found or already resolved' });
  }

  const row = result.rows[0];

  await sql`
    INSERT INTO agent_session_events (session_id, event_type, payload, created_at)
    VALUES (
      ${row.session_id},
      'handoff.confirmed',
      ${JSON.stringify({ confirmation_id: confirmationId, action: newStatus, agent: row.agent_name, action_type: row.action_type })},
      NOW()
    )
  `;

  return res.status(200).json({ ok: true, confirmationId, action: newStatus });
}
