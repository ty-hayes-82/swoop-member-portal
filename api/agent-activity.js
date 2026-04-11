import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from './lib/withAuth.js';
import { withAdminOverride } from './lib/withAdminOverride.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getReadClubId(req);
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);

  try {
    // 1. Agent activity feed with member names
    const activityResult = await sql`
      SELECT
        aa.activity_id,
        aa.agent_id,
        aa.action_type,
        aa.description,
        aa.member_id,
        aa.confidence,
        aa.auto_executed,
        aa.reasoning,
        aa.phase,
        aa.created_at,
        m.first_name || ' ' || m.last_name AS member_name
      FROM agent_activity aa
      LEFT JOIN members m ON m.member_id = aa.member_id AND m.club_id = aa.club_id
      WHERE aa.club_id = ${clubId}
      ORDER BY aa.created_at DESC
      LIMIT ${limit}
    `;

    // 2. Active playbook runs with current step info
    const playbooksResult = await sql`
      SELECT
        pr.run_id,
        pr.playbook_id,
        pr.playbook_name,
        pr.member_id,
        pr.triggered_by,
        pr.trigger_reason,
        pr.status,
        pr.started_at,
        pr.health_score_at_start,
        m.first_name || ' ' || m.last_name AS member_name,
        (
          SELECT json_build_object(
            'step_number', ps.step_number,
            'title', ps.title,
            'status', ps.status,
            'due_date', ps.due_date
          )
          FROM playbook_steps ps
          WHERE ps.run_id = pr.run_id
          AND ps.status IN ('pending', 'in_progress')
          ORDER BY ps.step_number ASC
          LIMIT 1
        ) AS current_step,
        (SELECT COUNT(*) FROM playbook_steps ps2 WHERE ps2.run_id = pr.run_id) AS total_steps,
        (SELECT COUNT(*) FROM playbook_steps ps3 WHERE ps3.run_id = pr.run_id AND ps3.status = 'completed') AS completed_steps
      FROM playbook_runs pr
      LEFT JOIN members m ON m.member_id = pr.member_id AND m.club_id = pr.club_id
      WHERE pr.club_id = ${clubId}
        AND pr.status = 'active'
      ORDER BY pr.started_at DESC
      LIMIT 20
    `;

    // 3. Coordination logs (Chief of Staff decisions)
    const coordinationResult = await sql`
      SELECT
        log_id,
        log_date,
        agents_contributing,
        actions_input,
        actions_output,
        conflicts_detected,
        conflicts_resolved,
        conflict_details,
        created_at
      FROM coordination_logs
      WHERE club_id = ${clubId}
      ORDER BY log_date DESC
      LIMIT 10
    `;

    res.status(200).json({
      activity: activityResult.rows,
      activePlaybooks: playbooksResult.rows,
      coordination: coordinationResult.rows,
    });
  } catch (error) {
    console.error('Agent activity API error:', error);
    res.status(500).json({ error: error.message });
  }
}

export default withAuth(
  withAdminOverride(handler, {
    adminTool: 'agent-activity',
    reason: 'agent activity dashboard read',
  }),
  { allowDemo: true },
);
