/**
 * api/agents/gm-routing.js
 *
 * Phase 2b: GM Routing Brain.
 *
 * POST /api/agents/gm-routing
 *
 * Accepts a recommendation from any source agent and routes it to the
 * correct target session (staff role agent). Creates a handoff record
 * and emits recommendation_received events to both the GM session and
 * the target staff agent session.
 *
 * Auth: staff or GM role required.
 * Body: { club_id, gm_user_id, recommendation }
 *   recommendation: { summary, source_agent, target_role, target_session_id, correlation_id?, urgency? }
 */
import { withAuth } from '../lib/withAuth.js';
import {
  getOrCreateAgentSession,
  emitAgentEvent,
  createHandoff,
} from './session-core.js';

async function gmRoutingHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { club_id, gm_user_id, recommendation } = req.body;

  if (!club_id || !gm_user_id || !recommendation) {
    return res.status(400).json({ error: 'club_id, gm_user_id, and recommendation are required' });
  }

  const { summary, source_agent, target_role, target_session_id, correlation_id = null, urgency = 'normal' } = recommendation;

  if (!summary || !source_agent || !target_session_id) {
    return res.status(400).json({ error: 'recommendation must include summary, source_agent, and target_session_id' });
  }

  // Ensure GM session exists and is active
  const gmSessionId = `gm_${gm_user_id}_concierge`;
  await getOrCreateAgentSession(gmSessionId, 'identity', gm_user_id, club_id);

  // Emit recommendation_received to GM session
  try {
    await emitAgentEvent(gmSessionId, club_id, {
      type: 'recommendation_received',
      summary,
      source_agent,
      target_role: target_role || null,
      target_session_id,
      urgency,
      correlation_id,
      routed_by: 'gm_routing',
    });
  } catch (e) {
    console.warn('[gm-routing] emitAgentEvent to GM session failed:', e.message);
  }

  // Emit recommendation_received to the target staff session
  try {
    await emitAgentEvent(target_session_id, club_id, {
      type: 'recommendation_received',
      summary,
      source_agent,
      target_role: target_role || null,
      urgency,
      correlation_id,
      routed_by: 'gm_routing',
    });
  } catch (e) {
    console.warn('[gm-routing] emitAgentEvent to target session failed:', e.message);
  }

  // Create handoff record linking the GM session to the target session
  const handoffId = await createHandoff({
    sourceSessionId: gmSessionId,
    targetSessionId: target_session_id,
    recommendationEventId: null,
    correlationId: correlation_id,
  });

  return res.status(200).json({
    handoff_id: handoffId,
    status: 'routed',
    gm_session_id: gmSessionId,
    target_session_id,
  });
}

export default withAuth(gmRoutingHandler, { roles: ['gm', 'assistant_gm', 'staff', 'swoop_admin'] });
