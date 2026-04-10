/**
 * POST /api/agents/risk-trigger
 *
 * Health-score-driven trigger for the member-risk-lifecycle agent.
 * Called by the health-monitor cron or manually from the UI.
 *
 * Trigger criteria:
 *   - health_score crossed from Watch (50-70) to At-Risk (<50)
 *   - annual_dues >= $8,000
 *   - score delta > 15 pts in 30 days
 *
 * Idempotency: rejects if an active run already exists for this member.
 * Rate limit: 1-hour cooldown per member.
 * Simulation mode: when MANAGED_AGENT_ID or MANAGED_ENV_ID are unset.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getWriteClubId } from '../lib/withAuth.js';
import { createManagedSession, sendSessionEvent, MANAGED_AGENT_ID, MANAGED_ENV_ID } from './managed-config.js';
import { evaluateRiskTrigger } from './risk-config.js';

const SIMULATION_MODE = !MANAGED_AGENT_ID || !MANAGED_ENV_ID;
const PLAYBOOK_ID = 'member-risk-lifecycle';

const RISK_LIFECYCLE_STEPS = [
  { step_number: 1, step_key: 'diagnose',             title: 'Diagnose root cause',              description: 'Identify which engagement signals declined and summarise the risk.' },
  { step_number: 2, step_key: 'propose_intervention',  title: 'Propose intervention',             description: 'Draft an archetype-appropriate intervention for GM approval.' },
  { step_number: 3, step_key: 'day_7_followup',        title: 'Day 7 follow-up',                  description: 'Check health score change and propose follow-up action if needed.' },
  { step_number: 4, step_key: 'day_14_checkin',         title: 'Day 14 check-in',                  description: 'Draft a warm check-in note; escalate if member has not re-engaged.' },
  { step_number: 5, step_key: 'day_30_outcome',         title: 'Day 30 outcome measurement',       description: 'Measure final health score delta and record intervention outcome.' },
];

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getWriteClubId(req);
  const { member_id } = req.body;

  if (!member_id) {
    return res.status(400).json({ error: 'member_id is required' });
  }

  try {
    // 1. Evaluate trigger criteria via risk-config
    const evaluation = await evaluateRiskTrigger(member_id, clubId);

    if (!evaluation.shouldTrigger) {
      return res.status(200).json({ triggered: false, ...evaluation });
    }

    // 2. Idempotency — reject if active run already exists
    const { rows: activeRuns } = await sql`
      SELECT run_id FROM playbook_runs
      WHERE club_id = ${clubId} AND member_id = ${member_id}
        AND playbook_id = ${PLAYBOOK_ID} AND status = 'active'
    `;
    if (activeRuns.length > 0) {
      return res.status(200).json({
        triggered: false,
        reason: 'Active run already exists',
        existing_run_id: activeRuns[0].run_id,
      });
    }

    // 3. Rate limit — max 1 trigger per member per hour
    const { rows: recentRuns } = await sql`
      SELECT started_at FROM playbook_runs
      WHERE club_id = ${clubId} AND member_id = ${member_id}
        AND playbook_id = ${PLAYBOOK_ID}
      ORDER BY started_at DESC LIMIT 1
    `;
    if (recentRuns.length > 0) {
      const lastStarted = new Date(recentRuns[0].started_at);
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (lastStarted > hourAgo) {
        return res.status(200).json({
          triggered: false,
          reason: 'Rate limited — last run started less than 1 hour ago',
          last_started_at: lastStarted.toISOString(),
        });
      }
    }

    // 4. Create session (live or simulation)
    let sessionId = null;

    if (!SIMULATION_MODE) {
      const session = await createManagedSession();
      sessionId = session.id;

      await sendSessionEvent(sessionId, {
        type: 'user.message',
        content: JSON.stringify({
          trigger: 'health_score_crossing',
          club_id: clubId,
          member_id,
          current_score: evaluation.currentScore,
          previous_score: evaluation.previousScore,
          delta: evaluation.delta,
          annual_dues: evaluation.dues,
          timestamp: new Date().toISOString(),
        }),
      });
    } else {
      sessionId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      console.log(`[risk-trigger] Simulation mode — session_id=${sessionId}`);
    }

    // 5. Insert playbook run
    const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await sql`
      INSERT INTO playbook_runs (
        run_id, club_id, playbook_id, member_id,
        triggered_by, trigger_reason, status,
        agent_session_id, started_at
      ) VALUES (
        ${runId}, ${clubId}, ${PLAYBOOK_ID}, ${member_id},
        'risk-trigger',
        ${`health_score=${evaluation.currentScore} (was ${evaluation.previousScore}), delta=${evaluation.delta}, dues=${evaluation.dues}`},
        'active',
        ${sessionId}, NOW()
      )
    `;

    // 6. Create playbook steps
    for (const step of RISK_LIFECYCLE_STEPS) {
      await sql`
        INSERT INTO playbook_steps (run_id, club_id, step_number, step_key, title, description, status)
        VALUES (${runId}, ${clubId}, ${step.step_number}, ${step.step_key}, ${step.title}, ${step.description}, 'pending')
      `;
    }

    return res.status(200).json({
      triggered: true,
      session_id: sessionId,
      run_id: runId,
      simulation: SIMULATION_MODE,
      ...evaluation,
    });
  } catch (err) {
    console.error('/api/agents/risk-trigger error:', err);
    return res.status(500).json({ error: err.message });
  }
}, { roles: ['gm', 'admin'] });
