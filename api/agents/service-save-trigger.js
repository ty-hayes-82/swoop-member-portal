import { sql } from '@vercel/postgres';
import { withAuth, getWriteClubId } from '../lib/withAuth.js';
import { createManagedSession, sendSessionEvent, MANAGED_AGENT_ID, MANAGED_ENV_ID } from './managed-config.js';

const SIMULATION_MODE = !MANAGED_AGENT_ID || !MANAGED_ENV_ID;

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getWriteClubId(req);
  const { complaint_id, member_id, category, priority } = req.body;

  if (!complaint_id || !member_id) {
    return res.status(400).json({ error: 'complaint_id and member_id are required' });
  }

  try {
    // 1. Query member health_score and annual_dues
    const memberResult = await sql`
      SELECT health_score, annual_dues
      FROM members
      WHERE member_id = ${member_id} AND club_id = ${clubId}
    `;

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = memberResult.rows[0];
    const healthScore = member.health_score ?? 100;
    const annualDues = member.annual_dues ?? 0;

    // 2. Evaluate trigger criteria
    const triggered = healthScore <= 50 && annualDues >= 12000 && priority !== 'low';

    if (!triggered) {
      const reasons = [];
      if (healthScore > 50) reasons.push(`health_score ${healthScore} > 50`);
      if (annualDues < 12000) reasons.push(`annual_dues ${annualDues} < 12000`);
      if (priority === 'low') reasons.push('priority is low');
      return res.status(200).json({ triggered: false, reason: reasons.join('; ') });
    }

    // 3. Triggered — create session and playbook run
    let sessionId = null;

    if (!SIMULATION_MODE) {
      // Live mode: create Managed Agent session via Anthropic API
      const session = await createManagedSession();
      sessionId = session.id;

      // Send initial trigger event
      await sendSessionEvent(sessionId, {
        type: 'user.message',
        content: JSON.stringify({
          trigger: 'complaint_filed',
          club_id: clubId,
          member_id,
          complaint_id,
          complaint_category: category,
          complaint_priority: priority,
          health_score: healthScore,
          annual_dues: annualDues,
          timestamp: new Date().toISOString(),
        }),
      });
    } else {
      // Simulation mode: generate a fake session id
      sessionId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      console.log(`[service-save-trigger] Simulation mode — skipping Anthropic API. session_id=${sessionId}`);
    }

    // Insert playbook_runs row
    const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await sql`
      INSERT INTO playbook_runs (
        run_id, club_id, playbook_id, member_id,
        triggered_by, trigger_reason, status,
        agent_session_id, started_at
      ) VALUES (
        ${runId}, ${clubId}, 'service-save', ${member_id},
        'service-save-trigger', ${`complaint ${complaint_id} — health_score=${healthScore}, dues=${annualDues}`},
        'active',
        ${sessionId}, NOW()
      )
    `;

    return res.status(200).json({
      triggered: true,
      session_id: sessionId,
      run_id: runId,
      simulation: SIMULATION_MODE,
    });
  } catch (err) {
    console.error('/api/agents/service-save-trigger error:', err);
    return res.status(500).json({ error: err.message });
  }
}, { roles: ['gm', 'admin'] });
