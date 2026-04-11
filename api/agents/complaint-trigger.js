/**
 * POST /api/agents/complaint-trigger
 *
 * Complaint-driven trigger for the service-recovery agent.
 * Called when a member files a complaint, or by the UI/cron.
 *
 * Trigger criteria:
 *   - Member annual_dues >= $10,000
 *   - Complaint priority = 'high' or 'critical'
 *
 * Idempotency: rejects if an active service-recovery run already exists for this member.
 * Rate limit: 1-hour cooldown per member.
 * Simulation mode: when ANTHROPIC_API_KEY env var is unset.
 *
 * Cron auth: if x-cron-key header matches CRON_SECRET, bypasses withAuth.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getWriteClubId } from '../lib/withAuth.js';
import { createManagedSession, sendSessionEvent } from './managed-config.js';

const SIMULATION_MODE = !process.env.ANTHROPIC_API_KEY;
const PLAYBOOK_ID = 'service-recovery';

const SERVICE_RECOVERY_STEPS = [
  { step_number: 1, step_key: 'route_department',   title: 'Route to department',          description: 'Route complaint to the relevant department head with full member context.' },
  { step_number: 2, step_key: 'gm_alert',           title: 'GM alert',                     description: 'Alert GM within 2 hours with call recommendation and talking points.' },
  { step_number: 3, step_key: 'monitor_resolution',  title: 'Monitor resolution',           description: 'Track complaint resolution status and flag inaction.' },
  { step_number: 4, step_key: 'escalation_48h',      title: '48h escalation',               description: 'If unresolved after 48 hours, escalate with increased urgency.' },
  { step_number: 5, step_key: 'day_7_checkin',        title: 'Day 7 check-in',              description: 'After resolution, schedule a satisfaction check-in with the member.' },
  { step_number: 6, step_key: 'record_outcome',       title: 'Record outcome',              description: 'Record final outcome: member retained, re-engaged, or resigned.' },
];

/**
 * Evaluate whether a complaint qualifies for the service-recovery agent.
 */
export async function evaluateComplaintTrigger(memberId, clubId, complaintPriority) {
  // 1. Get member data
  const { rows: memberRows } = await sql`
    SELECT health_score, annual_dues
    FROM members
    WHERE member_id = ${memberId} AND club_id = ${clubId}
  `;

  if (memberRows.length === 0) {
    return { shouldTrigger: false, reason: 'Member not found', dues: 0, priority: complaintPriority };
  }

  const dues = Number(memberRows[0].annual_dues ?? 0);
  const healthScore = Number(memberRows[0].health_score ?? 100);

  // 2. Evaluate criteria
  const reasons = [];
  if (dues < 10000) reasons.push(`annual_dues ${dues} < 10000`);
  if (!['high', 'critical'].includes(complaintPriority)) {
    reasons.push(`priority '${complaintPriority}' is not high or critical`);
  }

  const shouldTrigger = dues >= 10000 && ['high', 'critical'].includes(complaintPriority);

  // 3. Check for repeat complainant (complaint in last 90 days)
  let repeatComplainant = false;
  if (shouldTrigger) {
    const { rows: recentComplaints } = await sql`
      SELECT COUNT(*)::int AS cnt FROM feedback
      WHERE member_id = ${memberId} AND club_id = ${clubId}
        AND submitted_at > NOW() - INTERVAL '90 days'
    `;
    repeatComplainant = (recentComplaints[0]?.cnt ?? 0) > 1;
  }

  return {
    shouldTrigger,
    reason: shouldTrigger
      ? `dues=${dues}, priority=${complaintPriority}, health_score=${healthScore}`
      : reasons.join('; '),
    dues,
    healthScore,
    priority: complaintPriority,
    repeatComplainant,
  };
}

async function complaintHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getWriteClubId(req);
  const { member_id, complaint_id, priority, category } = req.body;

  if (!member_id) {
    return res.status(400).json({ error: 'member_id is required' });
  }
  if (!priority) {
    return res.status(400).json({ error: 'priority is required' });
  }

  try {
    // 1. Evaluate trigger criteria
    const evaluation = await evaluateComplaintTrigger(member_id, clubId, priority);

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
        reason: 'Active service-recovery run already exists',
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
          trigger: 'complaint_filed',
          club_id: clubId,
          member_id,
          complaint_id: complaint_id || null,
          priority,
          category: category || null,
          annual_dues: evaluation.dues,
          health_score: evaluation.healthScore,
          repeat_complainant: evaluation.repeatComplainant,
          timestamp: new Date().toISOString(),
        }),
      });
    } else {
      sessionId = `sim_sr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    // 5. Insert playbook run
    const runId = `run_sr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await sql`
      INSERT INTO playbook_runs (
        run_id, club_id, playbook_id, member_id,
        triggered_by, trigger_reason, status,
        agent_session_id, started_at
      ) VALUES (
        ${runId}, ${clubId}, ${PLAYBOOK_ID}, ${member_id},
        'complaint-trigger',
        ${`complaint priority=${priority}, dues=${evaluation.dues}, health_score=${evaluation.healthScore}${evaluation.repeatComplainant ? ', REPEAT COMPLAINANT' : ''}`},
        'active',
        ${sessionId}, NOW()
      )
    `;

    // 6. Create playbook steps
    for (const step of SERVICE_RECOVERY_STEPS) {
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
      playbook_id: PLAYBOOK_ID,
      steps_created: SERVICE_RECOVERY_STEPS.length,
      ...evaluation,
    });
  } catch (err) {
    console.error('/api/agents/complaint-trigger error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ---------------------------------------------------------------------------
// Export: cron-key bypass or standard withAuth
// ---------------------------------------------------------------------------

export default function handler(req, res) {
  const cronKey = req.headers['x-cron-key'];
  if (cronKey && process.env.CRON_SECRET && cronKey === process.env.CRON_SECRET) {
    // Cron bypass — inject minimal auth context
    req.auth = req.auth || { clubId: req.body?.club_id || 'unknown', role: 'system' };
    return complaintHandler(req, res);
  }
  return withAuth(complaintHandler, { roles: ['gm', 'admin'] })(req, res);
}
