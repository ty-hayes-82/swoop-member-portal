import { sql } from '@vercel/postgres';
import { withAuth, getWriteClubId } from '../lib/withAuth.js';
import { createManagedSession, sendSessionEvent } from './managed-config.js';
import { checkDataAvailable, TRIGGER_REQUIREMENTS } from './data-availability-check.js';
import { realAgentCall } from './real-agent-call.js';

const SIMULATION_MODE = !process.env.ANTHROPIC_API_KEY || !process.env.MANAGED_ENV_ID || !process.env.MANAGED_AGENT_ID;

async function serviceSaveHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getWriteClubId(req);
  const { complaint_id, member_id, category, priority } = req.body;

  if (!complaint_id || !member_id) {
    return res.status(400).json({ error: 'complaint_id and member_id are required' });
  }

  const gate = await checkDataAvailable(clubId, TRIGGER_REQUIREMENTS['service-save-trigger']);
  if (!gate.ok) {
    return res.status(200).json({ triggered: false, reason: gate.reason, missing: gate.missing });
  }

  try {
    // 1. Query member health_score and annual_dues
    const memberResult = await sql`
      SELECT health_score, annual_dues, first_name, last_name, health_tier
      FROM members
      WHERE member_id = ${member_id} AND club_id = ${clubId}
    `;

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = memberResult.rows[0];
    const healthScore = member.health_score ?? 100;
    const annualDues = member.annual_dues ?? 0;

    // SIM-mode demo write — fire the agent regardless of strict criteria so
    // the GM can see a real Anthropic recommendation against any complaint
    // they file. The strict eligibility check still gates the playbook flow
    // below; only the agent_actions surface is unconditional.
    if (SIMULATION_MODE) {
      try {
        await realAgentCall({
          clubId,
          agentId: 'member-service-recovery',
          actionType: 'service_save',
          memberId: member_id,
          systemPrompt: `You are the Member Service Recovery agent for a private golf and country club. A member has filed a complaint. Recommend ONE concrete service-save action the GM can execute in the next 24 hours. Reference real numbers (dues, health score, complaint priority).`,
          contextData: {
            member: {
              name: `${member.first_name || ''} ${member.last_name || ''}`.trim(),
              annual_dues: annualDues,
              health_score: healthScore,
              health_tier: member.health_tier,
            },
            complaint: { complaint_id, category: category || null, priority },
          },
        });
      } catch (err) {
        console.warn('[service-save-trigger] real agent call failed:', err.message);
      }
    }

    // 2. Evaluate trigger criteria
    const triggered = healthScore <= 50 && annualDues >= 12000 && priority !== 'low';

    if (!triggered) {
      const reasons = [];
      if (healthScore > 50) reasons.push(`health_score ${healthScore} > 50`);
      if (annualDues < 12000) reasons.push(`annual_dues ${annualDues} < 12000`);
      if (priority === 'low') reasons.push('priority is low');
      return res.status(200).json({ triggered: false, reason: reasons.join('; ') });
    }

    // 3. Idempotency check — reject if active run already exists (Fix 2)
    const activeRunResult = await sql`
      SELECT run_id FROM playbook_runs
      WHERE club_id = ${clubId} AND member_id = ${member_id}
        AND playbook_id = 'service-save' AND status = 'active'
    `;
    if (activeRunResult.rows.length > 0) {
      return res.status(200).json({
        triggered: false,
        reason: 'Active run already exists',
        existing_run_id: activeRunResult.rows[0].run_id,
      });
    }

    // 4. Rate limit — max 1 trigger per member per hour (Fix 6)
    const recentRunResult = await sql`
      SELECT started_at FROM playbook_runs
      WHERE club_id = ${clubId} AND member_id = ${member_id}
        AND playbook_id = 'service-save'
      ORDER BY started_at DESC LIMIT 1
    `;
    if (recentRunResult.rows.length > 0) {
      const lastStarted = new Date(recentRunResult.rows[0].started_at);
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (lastStarted > hourAgo) {
        return res.status(200).json({
          triggered: false,
          reason: 'Rate limited — last run started less than 1 hour ago',
          last_started_at: lastStarted.toISOString(),
        });
      }
    }

    // 5. Triggered — create session and playbook run
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
        run_id, club_id, playbook_id, playbook_name, member_id,
        triggered_by, trigger_reason, status,
        agent_session_id, started_at
      ) VALUES (
        ${runId}, ${clubId}, 'service-save', 'Service Save', ${member_id},
        'service-save-trigger', ${`complaint ${complaint_id} — health_score=${healthScore}, dues=${annualDues}`},
        'active',
        ${sessionId}, NOW()
      )
    `;

    // Create playbook steps immediately (Fix 5)
    const SERVICE_SAVE_STEPS = [
      { step_number: 1, step_key: 'route_complaint', title: 'Route complaint to F&B Director', description: 'Escalate the complaint to the relevant department head with full member context.' },
      { step_number: 2, step_key: 'gm_outreach', title: 'GM personal outreach', description: 'GM calls or sends a personal note acknowledging the issue.' },
      { step_number: 3, step_key: 'day_7_survey', title: 'Follow-up survey (Day 7)', description: 'Send a brief satisfaction check-in 7 days after the incident.' },
      { step_number: 4, step_key: 'day_14_checkin', title: 'Check-in note (Day 14)', description: 'Send a warm personal note 14 days after the incident.' },
      { step_number: 5, step_key: 'day_30_outcome', title: 'Outcome measurement (Day 30)', description: 'Measure health score delta and determine if member was saved.' },
    ];
    for (const step of SERVICE_SAVE_STEPS) {
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
    });
  } catch (err) {
    console.error('/api/agents/service-save-trigger error:', err);
    return res.status(200).json({
      triggered: false,
      reason: 'internal error: ' + err.message,
      error_class: 'server',
    });
  }
}

export default function handler(req, res) {
  const cronKey = req.headers['x-cron-key'];
  if (cronKey && process.env.CRON_SECRET && cronKey === process.env.CRON_SECRET) {
    req.auth = req.auth || { clubId: req.body?.club_id || 'unknown', role: 'system' };
    return serviceSaveHandler(req, res);
  }
  return withAuth(serviceSaveHandler, { roles: ['gm', 'admin'] })(req, res);
}
