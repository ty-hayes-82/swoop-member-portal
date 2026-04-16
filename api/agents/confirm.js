/**
 * api/agents/confirm.js
 *
 * Phase 5: Confirmation Loop endpoint.
 *
 * POST /api/agents/confirm
 *
 * Staff confirms (or rejects) that they took action in the source system
 * (ForeTees, Jonas POS, Clubessential, etc.). Closes the handoff loop.
 *
 * Body: { handoff_id, status, notes?, acted_at? }
 *   handoff_id: string (from agent_handoffs table)
 *   status: 'confirmed' | 'rejected'
 *   notes: optional human note about what was done or why rejected
 *   acted_at: optional ISO timestamp of when the action was taken
 *
 * On confirm: emits staff_confirmed to target session + outcome_tracked to source session.
 * On reject:  emits staff_rejected to target session + outcome_tracked to source session.
 *
 * Auth: staff or GM role required.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from '../lib/withAuth.js';
import {
  updateHandoff,
  emitAgentEvent,
} from './session-core.js';

const VALID_STATUSES = new Set(['confirmed', 'rejected']);

async function confirmHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { handoff_id, status, notes = null, acted_at = null } = req.body;

  if (!handoff_id || !status) {
    return res.status(400).json({ error: 'handoff_id and status are required' });
  }
  if (!VALID_STATUSES.has(status)) {
    return res.status(400).json({ error: 'status must be confirmed or rejected' });
  }

  // Load the handoff so we know which sessions to notify
  let handoff = null;
  try {
    const r = await sql`
      SELECT handoff_id, source_session_id, target_session_id, status AS current_status, created_at
      FROM agent_handoffs
      WHERE handoff_id = ${handoff_id}
    `;
    handoff = r.rows[0] || null;
  } catch (err) {
    console.warn('[confirm] handoff lookup failed:', err.message);
  }

  if (!handoff) {
    return res.status(404).json({ error: 'Handoff not found' });
  }
  if (handoff.current_status === 'confirmed' || handoff.current_status === 'rejected') {
    return res.status(409).json({ error: `Handoff is already ${handoff.current_status}` });
  }

  const clubId = getReadClubId(req);
  const confirmedAt = acted_at || new Date().toISOString();
  const outcome = { notes, acted_at: confirmedAt, confirmed_by: req.user?.user_id || null };

  // Update the handoff record
  await updateHandoff(handoff_id, status, outcome);

  // Emit to the target session (the staff agent that received the task)
  const targetEvent = status === 'confirmed'
    ? { type: 'staff_confirmed', text: notes || 'Action confirmed in source system.', handoff_id, acted_at: confirmedAt }
    : { type: 'staff_rejected',  reason: notes || 'Action was not taken.', handoff_id };

  emitAgentEvent(handoff.target_session_id, clubId, {
    ...targetEvent,
    source_agent: 'confirm_endpoint',
  }).catch(() => {});

  // Emit outcome_tracked to the source session (the analyst that originated the recommendation)
  emitAgentEvent(handoff.source_session_id, clubId, {
    type: 'outcome_tracked',
    description: status === 'confirmed'
      ? `Staff confirmed action for handoff ${handoff_id}. ${notes || ''}`
      : `Staff rejected handoff ${handoff_id}. Reason: ${notes || 'none given'}`,
    handoff_id,
    status,
    acted_at: confirmedAt,
    source_agent: 'confirm_endpoint',
  }).catch(() => {});

  return res.status(200).json({
    handoff_id,
    status,
    source_session_id: handoff.source_session_id,
    target_session_id: handoff.target_session_id,
    session_updated: true,
  });
}

export default withAuth(confirmHandler, { roles: ['gm', 'assistant_gm', 'staff', 'swoop_admin'] });
