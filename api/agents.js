import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId, getWriteClubId } from './lib/withAuth.js';
import { sendSessionEvent, MANAGED_AGENT_ID, MANAGED_ENV_ID } from './agents/managed-config.js';

export default withAuth(async function handler(req, res) {
  // B25: GET is a read (swoop_admin may cross-club view), POST approves/dismisses
  // agent_actions which is a mutation — default-deny, session club only.
  const clubId = req.method === 'POST' ? getWriteClubId(req) : getReadClubId(req);
  try {
    if (req.method === 'POST') {
      const { actionId, operation, meta } = req.body;
      if (operation === 'approve') {
        await sql`UPDATE agent_actions SET status = 'approved', approved_at = NOW(), approval_action = ${meta?.approvalAction ?? null} WHERE action_id = ${actionId} AND club_id = ${clubId}`;
      } else if (operation === 'dismiss') {
        await sql`UPDATE agent_actions SET status = 'dismissed', dismissed_at = NOW(), dismissal_reason = ${meta?.reason ?? ''} WHERE action_id = ${actionId} AND club_id = ${clubId}`;
      }

      // Forward approve/dismiss to managed agent session if one exists for this action's member
      if (operation === 'approve' || operation === 'dismiss') {
        try {
          const actionRow = await sql`
            SELECT member_id FROM agent_actions
            WHERE action_id = ${actionId} AND club_id = ${clubId}
          `;
          const memberId = actionRow.rows[0]?.member_id;
          if (memberId) {
            const runRow = await sql`
              SELECT agent_session_id FROM playbook_runs
              WHERE member_id = ${memberId} AND club_id = ${clubId}
                AND status = 'active' AND agent_session_id IS NOT NULL
              ORDER BY started_at DESC LIMIT 1
            `;
            const sessionId = runRow.rows[0]?.agent_session_id;
            if (sessionId) {
              const eventType = operation === 'approve' ? 'action_approved' : 'action_dismissed';
              const eventPayload = {
                type: eventType,
                action_id: actionId,
                ...(operation === 'approve'
                  ? { approved_by: req.auth?.userId }
                  : { reason: meta?.reason ?? '' }),
              };
              if (MANAGED_AGENT_ID && MANAGED_ENV_ID) {
                await sendSessionEvent(sessionId, eventPayload);
              } else {
                console.log(`[agents] Simulation mode — ${eventType} for session ${sessionId} logged`);
              }
            }
          }
        } catch (fwdErr) {
          // Non-fatal: log but don't fail the approve/dismiss
          console.error('[agents] Failed to forward event to managed session:', fwdErr.message);
        }
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
    res.status(500).json({ error: 'Internal error' });
  }
}, { allowDemo: true });
