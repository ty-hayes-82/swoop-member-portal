import { sql } from '@vercel/postgres';
import { withAuth } from '../lib/withAuth.js';
import { sendSessionEvent } from './managed-config.js';

const SIMULATION_MODE = !process.env.ANTHROPIC_API_KEY;

const VALID_EVENT_TYPES = ['action_approved', 'action_dismissed', 'complaint_resolved', 'member_resigned'];

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { run_id, event_type, payload } = req.body;

  if (!run_id || !event_type) {
    return res.status(400).json({ error: 'run_id and event_type are required' });
  }

  if (!VALID_EVENT_TYPES.includes(event_type)) {
    return res.status(400).json({ error: `Invalid event_type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}` });
  }

  try {
    // Look up agent_session_id from playbook_runs
    const result = await sql`
      SELECT agent_session_id FROM playbook_runs
      WHERE run_id = ${run_id} AND status = 'active'
    `;

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Active playbook run not found' });
    }

    const sessionId = result.rows[0].agent_session_id;

    if (!sessionId) {
      return res.status(200).json({ forwarded: false, reason: 'No agent session associated with this run' });
    }

    if (!SIMULATION_MODE) {
      // Live mode: forward event to the managed agent session
      await sendSessionEvent(sessionId, {
        type: event_type,
        ...(payload || {}),
      });
    } else {
      console.log(`[session-webhook] Simulation mode — event ${event_type} for session ${sessionId} logged but not forwarded`);
    }

    return res.status(200).json({ forwarded: !SIMULATION_MODE, simulation: SIMULATION_MODE, session_id: sessionId });
  } catch (err) {
    console.error('/api/agents/session-webhook error:', err);
    return res.status(500).json({ error: err.message });
  }
}, { roles: ['gm', 'admin'] });
