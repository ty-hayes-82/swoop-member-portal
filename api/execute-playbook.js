/**
 * Playbook Execution Engine — Sprint 10
 * POST /api/execute-playbook — activate a playbook for a member
 * GET /api/execute-playbook?clubId=xxx — get active playbook runs
 * PUT /api/execute-playbook — advance/complete a playbook step
 *
 * Creates sequenced action plans with steps, owners, and deadlines.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getClubId } from './lib/withAuth.js';

export default withAuth(async function handler(req, res) {
  const clubId = getClubId(req);
  // Ensure playbook execution tables exist
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS playbook_runs (
        run_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        club_id TEXT NOT NULL,
        playbook_id TEXT NOT NULL,
        playbook_name TEXT NOT NULL,
        member_id TEXT NOT NULL,
        triggered_by TEXT,
        trigger_reason TEXT,
        status TEXT DEFAULT 'active',
        started_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        health_score_at_start REAL,
        health_score_at_end REAL,
        outcome TEXT
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS playbook_steps (
        step_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        run_id TEXT NOT NULL,
        club_id TEXT NOT NULL,
        step_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        assigned_to TEXT,
        due_date TIMESTAMPTZ,
        status TEXT DEFAULT 'pending',
        completed_at TIMESTAMPTZ,
        completed_by TEXT,
        notes TEXT
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_playbook_runs_club ON playbook_runs(club_id, status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_playbook_steps_run ON playbook_steps(run_id, step_number)`;
  } catch {}

  if (req.method === 'GET') {
    const { memberId, status } = req.query;

    let runs;
    if (memberId) {
      runs = await sql`
        SELECT pr.*, m.first_name, m.last_name, m.health_score
        FROM playbook_runs pr JOIN members m ON pr.member_id = m.member_id
        WHERE pr.club_id = ${clubId} AND pr.member_id = ${memberId}
        ORDER BY pr.started_at DESC
      `;
    } else {
      const filterStatus = status || 'active';
      runs = await sql`
        SELECT pr.*, m.first_name, m.last_name, m.health_score
        FROM playbook_runs pr JOIN members m ON pr.member_id = m.member_id
        WHERE pr.club_id = ${clubId} AND pr.status = ${filterStatus}
        ORDER BY pr.started_at DESC LIMIT 50
      `;
    }

    // Get steps for each run
    const enriched = [];
    for (const run of runs.rows) {
      const steps = await sql`
        SELECT * FROM playbook_steps WHERE run_id = ${run.run_id} ORDER BY step_number
      `;
      const completedSteps = steps.rows.filter(s => s.status === 'completed').length;
      enriched.push({
        ...run,
        memberName: `${run.first_name} ${run.last_name}`,
        currentHealth: run.health_score,
        steps: steps.rows,
        progress: `${completedSteps}/${steps.rows.length}`,
        currentStep: steps.rows.find(s => s.status === 'pending') || null,
      });
    }

    return res.status(200).json({ runs: enriched });
  }

  if (req.method === 'POST') {
    const { playbookId, playbookName, memberId, triggeredBy, triggerReason, steps } = req.body;

    if (!playbookId || !memberId || !steps?.length) {
      return res.status(400).json({ error: 'playbookId, memberId, and steps[] required' });
    }

    try {
      // Get member's current health score
      const memberResult = await sql`
        SELECT health_score FROM members WHERE member_id = ${memberId}
      `;
      const currentScore = memberResult.rows[0]?.health_score || null;

      // Create run
      const runId = `run_${Date.now()}`;
      await sql`
        INSERT INTO playbook_runs (run_id, club_id, playbook_id, playbook_name, member_id, triggered_by, trigger_reason, health_score_at_start)
        VALUES (${runId}, ${clubId}, ${playbookId}, ${playbookName || playbookId}, ${memberId}, ${triggeredBy || 'system'}, ${triggerReason || null}, ${currentScore})
      `;

      // Create steps
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const dueDate = step.dueDays
          ? new Date(Date.now() + step.dueDays * 86400000).toISOString()
          : null;

        await sql`
          INSERT INTO playbook_steps (run_id, club_id, step_number, title, description, assigned_to, due_date)
          VALUES (${runId}, ${clubId}, ${i + 1}, ${step.title}, ${step.description || null}, ${step.assignedTo || null}, ${dueDate})
        `;
      }

      // Create notification for first step
      try {
        const firstStep = steps[0];
        if (firstStep.assignedTo) {
          await sql`
            INSERT INTO notifications (club_id, type, title, body, priority, related_member_id)
            VALUES (${clubId}, 'playbook_step', ${`Playbook activated: ${playbookName}`},
                    ${`Step 1: ${firstStep.title}. Assigned to ${firstStep.assignedTo}.`},
                    'high', ${memberId})
          `;
        }
      } catch {}

      res.status(201).json({
        runId,
        playbookName,
        memberId,
        totalSteps: steps.length,
        message: `Playbook "${playbookName}" activated with ${steps.length} steps.`,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'PUT') {
    const { stepId, status, completedBy, notes, runId } = req.body;

    if (stepId && status) {
      // Complete a step
      await sql`
        UPDATE playbook_steps
        SET status = ${status}, completed_at = ${status === 'completed' ? new Date().toISOString() : null},
            completed_by = ${completedBy || null}, notes = ${notes || null}
        WHERE step_id = ${stepId}
      `;

      // Check if all steps are done
      if (runId) {
        const remaining = await sql`
          SELECT COUNT(*) as count FROM playbook_steps
          WHERE run_id = ${runId} AND status != 'completed'
        `;
        if (Number(remaining.rows[0]?.count) === 0) {
          // All steps done — complete the run
          const run = await sql`SELECT member_id FROM playbook_runs WHERE run_id = ${runId}`;
          const currentScore = await sql`
            SELECT health_score FROM members WHERE member_id = ${run.rows[0]?.member_id}
          `;
          await sql`
            UPDATE playbook_runs
            SET status = 'completed', completed_at = NOW(),
                health_score_at_end = ${currentScore.rows[0]?.health_score || null},
                outcome = 'All steps completed'
            WHERE run_id = ${runId}
          `;
        } else {
          // Notify next step assignee
          const nextStep = await sql`
            SELECT * FROM playbook_steps
            WHERE run_id = ${runId} AND status = 'pending'
            ORDER BY step_number LIMIT 1
          `;
          if (nextStep.rows.length > 0 && nextStep.rows[0].assigned_to) {
            const runInfo = await sql`SELECT playbook_name, club_id, member_id FROM playbook_runs WHERE run_id = ${runId}`;
            try {
              await sql`
                INSERT INTO notifications (club_id, type, title, body, priority, related_member_id)
                VALUES (${runInfo.rows[0]?.club_id}, 'playbook_step',
                        ${`Next step: ${nextStep.rows[0].title}`},
                        ${`Playbook "${runInfo.rows[0]?.playbook_name}" — Step ${nextStep.rows[0].step_number}: ${nextStep.rows[0].title}`},
                        'normal', ${runInfo.rows[0]?.member_id})
              `;
            } catch {}
          }
        }
      }

      return res.status(200).json({ ok: true, message: `Step updated to ${status}` });
    }

    return res.status(400).json({ error: 'stepId and status required' });
  }

  if (!['GET', 'POST', 'PUT'].includes(req.method)) {
    res.status(405).json({ error: 'Method not allowed' });
  }
}, { allowDemo: true });
