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
 * Simulation mode: when ANTHROPIC_API_KEY env var is unset.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getWriteClubId } from '../lib/withAuth.js';
import { createCoordinatorSession, createAgentThread, sendSessionEvent } from './managed-config.js';
import { evaluateRiskTrigger } from './risk-config.js';
import { checkDataAvailable, TRIGGER_REQUIREMENTS } from './data-availability-check.js';

const SIMULATION_MODE = !process.env.ANTHROPIC_API_KEY || !process.env.MANAGED_ENV_ID || !process.env.MANAGED_AGENT_ID;
const PLAYBOOK_ID = 'member-risk-lifecycle';

const RISK_LIFECYCLE_STEPS = [
  { step_number: 1, step_key: 'diagnose',             title: 'Diagnose root cause',              description: 'Identify which engagement signals declined and summarise the risk.' },
  { step_number: 2, step_key: 'propose_intervention',  title: 'Propose intervention',             description: 'Draft an archetype-appropriate intervention for GM approval.' },
  { step_number: 3, step_key: 'day_7_followup',        title: 'Day 7 follow-up',                  description: 'Check health score change and propose follow-up action if needed.' },
  { step_number: 4, step_key: 'day_14_checkin',         title: 'Day 14 check-in',                  description: 'Draft a warm check-in note; escalate if member has not re-engaged.' },
  { step_number: 5, step_key: 'day_30_outcome',         title: 'Day 30 outcome measurement',       description: 'Measure final health score delta and record intervention outcome.' },
];

// Insert a representative pending action so the Today view / Inbox can
// render this agent's recommendation. Deterministic action_id keyed by
// Real Anthropic call for the Member Pulse agent. Uses claude-haiku via
// the shared realAgentCall helper, which writes to agent_actions with a
// deterministic live_* action_id.
async function insertRealRiskAction(memberId, clubId, evaluation) {
  const { realAgentCall } = await import('./real-agent-call.js');
  const { rows } = await sql`
    SELECT first_name, last_name, archetype, health_tier
    FROM members WHERE member_id = ${memberId} AND club_id = ${clubId}
  `;
  const m = rows[0] || {};
  return realAgentCall({
    clubId,
    agentId: 'member-pulse',
    actionType: 'risk_intervention',
    memberId,
    systemPrompt: `You are the Member Pulse agent for a private golf and country club. A member's engagement health score signals risk. Recommend ONE concrete outreach action the GM should take in the next 7 days. Reference real numbers (current score, prior score if present, dues, archetype). Be specific about who contacts the member, the channel, and the talking point.`,
    contextData: {
      member: { name: `${m.first_name || ''} ${m.last_name || ''}`.trim(), archetype: m.archetype, health_tier: m.health_tier },
      score: { current: evaluation.currentScore, previous: evaluation.previousScore, delta: evaluation.delta },
      annual_dues: evaluation.dues,
    },
  });
}

async function riskHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getWriteClubId(req);
  const { member_id } = req.body;

  if (!member_id) {
    return res.status(400).json({ error: 'member_id is required' });
  }

  // Data-availability gate — agents can't call tools whose required data
  // hasn't been imported. If the gate fails, return an honest "not yet"
  // instead of attempting SQL that will crash.
  const gate = await checkDataAvailable(clubId, TRIGGER_REQUIREMENTS['risk-trigger']);
  if (!gate.ok) {
    return res.status(200).json({ triggered: false, reason: gate.reason, missing: gate.missing });
  }

  try {
    // 1. Evaluate trigger criteria via risk-config
    const evaluation = await evaluateRiskTrigger(member_id, clubId);

    // Write the agent_action FIRST. The playbook_runs/playbook_steps inserts
    // below have a history of schema drift; the agent_action is what the GM
    // actually sees in the Today view, so make it the most reliable insert.
    // Eligibility-rejected members in simulation mode still get an action
    // so the GM workflow can be tested with score-only signals.
    const shouldWriteAction = evaluation.shouldTrigger
      || (SIMULATION_MODE && evaluation.currentScore != null && evaluation.currentScore < 70);
    if (shouldWriteAction) {
      await insertRealRiskAction(member_id, clubId, evaluation);
    }

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

    // 4. Create thread within coordinator session (live or simulation)
    let sessionId = null;
    let threadId = null;

    if (!SIMULATION_MODE) {
      // Create (or reuse) a coordinator session, then spawn a thread for this agent
      const coordinator = await createCoordinatorSession();
      sessionId = coordinator.id;

      const thread = await createAgentThread(sessionId, 'member-risk-lifecycle', {
        trigger: 'health_score_crossing',
        club_id: clubId,
        member_id,
        current_score: evaluation.currentScore,
        previous_score: evaluation.previousScore,
        delta: evaluation.delta,
        annual_dues: evaluation.dues,
        timestamp: new Date().toISOString(),
      });
      threadId = thread.session_thread_id;
    } else {
      sessionId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      threadId = `sim_thread_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      console.log(`[risk-trigger] Simulation mode — session_id=${sessionId}, thread_id=${threadId}`);
    }

    // 5. Insert playbook run (with thread reference for event routing)
    const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await sql`
      INSERT INTO playbook_runs (
        run_id, club_id, playbook_id, playbook_name, member_id,
        triggered_by, trigger_reason, status,
        agent_session_id, session_thread_id, started_at
      ) VALUES (
        ${runId}, ${clubId}, ${PLAYBOOK_ID}, 'Member Risk Lifecycle', ${member_id},
        'risk-trigger',
        ${`health_score=${evaluation.currentScore} (was ${evaluation.previousScore}), delta=${evaluation.delta}, dues=${evaluation.dues}`},
        'active',
        ${sessionId}, ${threadId}, NOW()
      )
    `;

    // 6. Create playbook steps
    for (const step of RISK_LIFECYCLE_STEPS) {
      await sql`
        INSERT INTO playbook_steps (run_id, club_id, step_number, step_key, title, description, status)
        VALUES (${runId}, ${clubId}, ${step.step_number}, ${step.step_key}, ${step.title}, ${step.description}, 'pending')
      `;
    }

    // 7. Surface as a pending action so the Today view / Inbox / drawer
    // can render the agent's recommendation. /api/agents reads from
    // agent_actions, not playbook_runs — both paths need the row.
    await insertRealRiskAction(member_id, clubId, evaluation);

    return res.status(200).json({
      triggered: true,
      session_id: sessionId,
      session_thread_id: threadId,
      run_id: runId,
      simulation: SIMULATION_MODE,
      ...evaluation,
    });
  } catch (err) {
    console.error('/api/agents/risk-trigger error:', err);
    return res.status(200).json({
      triggered: false,
      reason: 'internal error: ' + err.message,
      error_class: 'server',
    });
  }
}

// ---------------------------------------------------------------------------
// Export: cron-key bypass or standard withAuth
// ---------------------------------------------------------------------------

export default function handler(req, res) {
  const cronKey = req.headers['x-cron-key'];
  if (cronKey && process.env.CRON_SECRET && cronKey === process.env.CRON_SECRET) {
    req.auth = req.auth || { clubId: req.body?.club_id || 'unknown', role: 'system' };
    return riskHandler(req, res);
  }
  return withAuth(riskHandler, { roles: ['gm', 'admin'] })(req, res);
}
