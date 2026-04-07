import { sql } from '@vercel/postgres';
import { withAuth, getClubId } from './lib/withAuth.js';

export default withAuth(async function handler(req, res) {
  const clubId = getClubId(req);
  try {
    if (req.method === 'POST') {
      const { actionId, operation, meta } = req.body;
      if (operation === 'approve') {
        await sql`UPDATE agent_actions SET status = 'approved', approved_at = NOW(), approval_action = ${meta?.approvalAction ?? null} WHERE action_id = ${actionId} AND club_id = ${clubId}`;
      } else if (operation === 'dismiss') {
        await sql`UPDATE agent_actions SET status = 'dismissed', dismissed_at = NOW(), dismissal_reason = ${meta?.reason ?? ''} WHERE action_id = ${actionId} AND club_id = ${clubId}`;
      }
      return res.status(200).json({ ok: true });
    }

    const [agentsResult, actionsResult] = await Promise.all([
      sql`SELECT * FROM agent_definitions WHERE club_id = ${clubId} ORDER BY name`,
      sql`SELECT * FROM agent_actions WHERE club_id = ${clubId} ORDER BY timestamp DESC`,
    ]);

    const agents = agentsResult.rows.map((r) => ({
      id: r.agent_id,
      name: r.name,
      description: r.description,
      status: r.status,
      model: r.model,
      avatar: r.avatar,
      sourceSystems: r.source_systems,
      lastAction: r.last_run,
    }));

    const actions = actionsResult.rows.map((r) => ({
      id: r.action_id,
      agentId: r.agent_id,
      actionType: r.action_type,
      priority: r.priority,
      source: r.source,
      description: r.description,
      impactMetric: r.impact_metric,
      memberId: r.member_id,
      status: r.status,
      approvalAction: r.approval_action,
      dismissalReason: r.dismissal_reason,
      timestamp: r.timestamp ? new Date(r.timestamp).toISOString() : new Date().toISOString(),
      approvedAt: r.approved_at ? new Date(r.approved_at).toISOString() : null,
      dismissedAt: r.dismissed_at ? new Date(r.dismissed_at).toISOString() : null,
    }));

    res.status(200).json({ agents, actions });
  } catch (err) {
    console.error('/api/agents error:', err);
    res.status(500).json({ error: err.message });
  }
}, { allowDemo: true });
