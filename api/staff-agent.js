/**
 * api/staff-agent.js
 *
 * Phase 4: Vercel API route for staff role agents.
 *
 * POST /api/staff-agent
 *   Body: { role, user_id, message, trigger_type?, club? }
 *   Returns: { response, session_id, role }
 *
 * GET /api/staff-agent?role=&user_id=
 *   Returns morning briefing: { priorities, at_risk_items, pending_actions, raw_response }
 *
 * Auth: staff or GM role required.
 */
import { withAuth, getReadClubId } from './lib/withAuth.js';
import { runStaffAgent, deliverMorningBriefing } from './agents/staff-harness.js';

const VALID_ROLES = new Set([
  'membership_director',
  'fb_director',
  'head_pro',
  'dining_room_manager',
  'controller',
]);

async function staffAgentHandler(req, res) {
  const clubId = getReadClubId(req);

  // ── GET: morning briefing ──────────────────────────────────────────────
  if (req.method === 'GET') {
    const { role, user_id } = req.query;

    if (!role || !user_id) {
      return res.status(400).json({ error: 'role and user_id are required query params' });
    }
    if (!VALID_ROLES.has(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${[...VALID_ROLES].join(', ')}` });
    }

    try {
      const briefing = await deliverMorningBriefing({ role, userId: user_id, clubId });
      return res.status(200).json({ role, user_id, ...briefing });
    } catch (err) {
      console.error('[staff-agent] Morning briefing error:', err.message);
      return res.status(500).json({ error: 'Failed to generate morning briefing' });
    }
  }

  // ── POST: chat turn ────────────────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { role, user_id, message, trigger_type = 'chat', club = null } = req.body;

  if (!role || !user_id || !message) {
    return res.status(400).json({ error: 'role, user_id, and message are required' });
  }
  if (!VALID_ROLES.has(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${[...VALID_ROLES].join(', ')}` });
  }
  if (typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'message must be a non-empty string' });
  }

  try {
    const result = await runStaffAgent({
      role,
      userId: user_id,
      clubId,
      message: message.trim(),
      triggerType: trigger_type,
      club,
    });

    return res.status(200).json({
      response: result.response,
      session_id: result.session_id,
      role,
    });
  } catch (err) {
    console.error('[staff-agent] runStaffAgent error:', err.message);
    return res.status(500).json({ error: 'Staff agent error. Please try again.' });
  }
}

export default withAuth(staffAgentHandler, { roles: ['gm', 'assistant_gm', 'staff', 'swoop_admin'] });
