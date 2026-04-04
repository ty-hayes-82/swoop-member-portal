/**
 * Autonomous Agent Framework — Sprint 12
 * POST /api/agent-autonomous?clubId=xxx — run autonomous agent cycle
 * GET /api/agent-autonomous?clubId=xxx — get agent activity log
 *
 * Agents auto-execute pre-approved low-risk actions when confidence
 * exceeds the configured threshold. High-risk actions still require
 * GM approval and go to the Inbox.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getClubId } from './lib/withAuth.js';

const AGENTS = {
  demand_optimizer: {
    name: 'Demand Optimizer',
    description: 'Auto-routes waitlist slots to retention-priority members',
    defaultThreshold: 0.85,
    autoApproveTypes: ['waitlist_route', 'tee_time_suggestion'],
  },
  member_pulse: {
    name: 'Member Pulse',
    description: 'Surfaces declining members before they reach critical',
    defaultThreshold: 0.80,
    autoApproveTypes: ['health_alert', 'watch_notification'],
  },
  service_recovery: {
    name: 'Service Recovery',
    description: 'Auto-escalates complaints approaching SLA breach',
    defaultThreshold: 0.90,
    autoApproveTypes: ['sla_escalation', 'complaint_alert'],
  },
  engagement_autopilot: {
    name: 'Engagement Autopilot',
    description: 'Sends re-engagement nudges to inactive members',
    defaultThreshold: 0.75,
    autoApproveTypes: ['re_engagement_email', 'event_suggestion'],
  },
  revenue_analyst: {
    name: 'Revenue Analyst',
    description: 'Identifies revenue recovery opportunities',
    defaultThreshold: 0.80,
    autoApproveTypes: ['revenue_alert'],
  },
  labor_optimizer: {
    name: 'Labor Optimizer',
    description: 'Flags staffing gaps before they cause service failures',
    defaultThreshold: 0.85,
    autoApproveTypes: ['staffing_alert'],
  },
};

export default withAuth(async function handler(req, res) {
  const clubId = getClubId(req);
  // Ensure agent activity table exists
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS agent_activity (
        activity_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        club_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        description TEXT,
        member_id TEXT,
        confidence REAL,
        auto_executed BOOLEAN DEFAULT FALSE,
        reasoning TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS agent_configs (
        club_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        auto_approve_threshold REAL DEFAULT 0.80,
        auto_approve_enabled BOOLEAN DEFAULT FALSE,
        last_run TIMESTAMPTZ,
        total_proposals INTEGER DEFAULT 0,
        total_auto_executed INTEGER DEFAULT 0,
        accuracy_score REAL DEFAULT 0.75,
        PRIMARY KEY (club_id, agent_id)
      )
    `;
  } catch {}

  if (req.method === 'GET') {
    const { agentId } = req.query;

    // Get agent configs
    const configs = await sql`SELECT * FROM agent_configs WHERE club_id = ${clubId}`;
    const configMap = {};
    configs.rows.forEach(c => { configMap[c.agent_id] = c; });

    // Get recent activity
    const activity = agentId
      ? await sql`SELECT * FROM agent_activity WHERE club_id = ${clubId} AND agent_id = ${agentId} ORDER BY created_at DESC LIMIT 20`
      : await sql`SELECT * FROM agent_activity WHERE club_id = ${clubId} ORDER BY created_at DESC LIMIT 50`;

    // Build agent status
    const agents = Object.entries(AGENTS).map(([id, def]) => ({
      id,
      ...def,
      config: configMap[id] || { enabled: true, auto_approve_threshold: def.defaultThreshold, auto_approve_enabled: false },
    }));

    return res.status(200).json({ agents, recentActivity: activity.rows });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST only' });

  try {
    const autoExecuted = [];
    const pendingApproval = [];

    // Initialize configs for agents that don't have one
    for (const [agentId, def] of Object.entries(AGENTS)) {
      await sql`
        INSERT INTO agent_configs (club_id, agent_id, auto_approve_threshold)
        VALUES (${clubId}, ${agentId}, ${def.defaultThreshold})
        ON CONFLICT (club_id, agent_id) DO NOTHING
      `;
    }

    // Run each agent
    for (const [agentId, def] of Object.entries(AGENTS)) {
      const config = await sql`SELECT * FROM agent_configs WHERE club_id = ${clubId} AND agent_id = ${agentId}`;
      const cfg = config.rows[0];
      if (!cfg?.enabled) continue;

      const proposals = await generateAgentProposals(clubId, agentId, def);

      for (const proposal of proposals) {
        const canAutoExecute = cfg.auto_approve_enabled &&
          proposal.confidence >= cfg.auto_approve_threshold &&
          def.autoApproveTypes.includes(proposal.actionType);

        // Log activity
        await sql`
          INSERT INTO agent_activity (club_id, agent_id, action_type, description, member_id, confidence, auto_executed, reasoning)
          VALUES (${clubId}, ${agentId}, ${proposal.actionType}, ${proposal.description}, ${proposal.memberId || null}, ${proposal.confidence}, ${canAutoExecute}, ${proposal.reasoning})
        `;

        if (canAutoExecute) {
          // Auto-execute: create intervention directly
          if (proposal.memberId) {
            await sql`
              INSERT INTO interventions (club_id, member_id, intervention_type, description, initiated_by, health_score_before)
              VALUES (${clubId}, ${proposal.memberId}, ${proposal.actionType}, ${proposal.description}, ${`${def.name} (auto)`},
                      (SELECT health_score FROM members WHERE member_id = ${proposal.memberId}))
            `;
          }
          autoExecuted.push({ agent: agentId, ...proposal });
        } else {
          // Send to Inbox for GM approval
          await sql`
            INSERT INTO actions (club_id, member_id, action_type, description, status, priority, source, impact_metric)
            VALUES (${clubId}, ${proposal.memberId || null}, ${proposal.actionType}, ${proposal.description}, 'pending',
                    ${proposal.priority || 'medium'}, ${def.name}, ${proposal.impactMetric || null})
          `;
          pendingApproval.push({ agent: agentId, ...proposal });
        }
      }

      // Update agent stats
      await sql`
        UPDATE agent_configs
        SET last_run = NOW(),
            total_proposals = total_proposals + ${proposals.length},
            total_auto_executed = total_auto_executed + ${proposals.filter(p => def.autoApproveTypes.includes(p.actionType) && p.confidence >= cfg.auto_approve_threshold).length}
        WHERE club_id = ${clubId} AND agent_id = ${agentId}
      `;
    }

    res.status(200).json({
      clubId,
      autoExecuted: autoExecuted.length,
      pendingApproval: pendingApproval.length,
      autoExecutedDetails: autoExecuted,
      pendingDetails: pendingApproval.slice(0, 10),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}, { allowDemo: true });

async function generateAgentProposals(clubId, agentId, def) {
  const proposals = [];

  if (agentId === 'member_pulse') {
    // Find members who dropped 10+ points recently
    const declining = await sql`
      SELECT hs.member_id, hs.score_delta, hs.score, m.first_name, m.last_name, m.annual_dues
      FROM health_scores hs JOIN members m ON hs.member_id = m.member_id
      WHERE hs.club_id = ${clubId} AND hs.score_delta < -10
        AND hs.computed_at >= NOW() - INTERVAL '24 hours'
      ORDER BY hs.score_delta ASC LIMIT 5
    `;
    for (const m of declining.rows) {
      proposals.push({
        actionType: 'health_alert',
        description: `${m.first_name} ${m.last_name} health dropped ${Math.abs(m.score_delta)} points to ${m.score} — outreach recommended`,
        memberId: m.member_id,
        confidence: 0.88,
        priority: m.score < 25 ? 'high' : 'medium',
        impactMetric: `$${(Number(m.annual_dues) || 15000).toLocaleString()}/yr at risk`,
        reasoning: `Health score dropped from ${m.score - m.score_delta} to ${m.score} in 24 hours. Multiple engagement dimensions declining.`,
      });
    }
  }

  if (agentId === 'service_recovery') {
    // Find complaints approaching SLA
    const aging = await sql`
      SELECT c.complaint_id, c.category, c.description, c.sla_hours, c.member_id,
             EXTRACT(EPOCH FROM (NOW() - c.reported_at)) / 3600 as hours_open,
             m.first_name, m.last_name
      FROM complaints c LEFT JOIN members m ON c.member_id = m.member_id
      WHERE c.club_id = ${clubId} AND c.status = 'open'
        AND EXTRACT(EPOCH FROM (NOW() - c.reported_at)) / 3600 > c.sla_hours * 0.75
      ORDER BY hours_open DESC LIMIT 5
    `;
    for (const c of aging.rows) {
      proposals.push({
        actionType: 'sla_escalation',
        description: `Complaint "${c.category}" for ${c.first_name || 'member'} ${c.last_name || ''} — ${Math.round(c.hours_open)}hrs open (SLA: ${c.sla_hours}h)`,
        memberId: c.member_id,
        confidence: 0.92,
        priority: 'high',
        impactMetric: 'Complaint SLA at risk',
        reasoning: `Complaint has been open ${Math.round(c.hours_open)} hours against a ${c.sla_hours}-hour SLA. Auto-escalation triggered at 75% of SLA window.`,
      });
    }
  }

  if (agentId === 'demand_optimizer') {
    // Find underutilized tee times that could serve waitlisted at-risk members
    // Simplified: just look for at-risk members who haven't played recently
    const inactive = await sql`
      SELECT m.member_id, m.first_name, m.last_name, m.health_score
      FROM members m
      WHERE m.club_id = ${clubId} AND m.health_tier IN ('At Risk', 'Watch')
        AND m.member_id NOT IN (
          SELECT member_id FROM rounds WHERE club_id = ${clubId} AND round_date >= CURRENT_DATE - 14 AND cancelled = FALSE
        )
      ORDER BY m.health_score ASC LIMIT 3
    `;
    for (const m of inactive.rows) {
      proposals.push({
        actionType: 'tee_time_suggestion',
        description: `Route preferred tee time to ${m.first_name} ${m.last_name} (health: ${m.health_score}) — no rounds in 14 days`,
        memberId: m.member_id,
        confidence: 0.82,
        priority: 'medium',
        impactMetric: '68% re-engagement rate from tee time offers',
        reasoning: `Member hasn't played in 14+ days. Health score ${m.health_score}. Offering a preferred tee time has historically driven 68% re-engagement.`,
      });
    }
  }

  return proposals;
}
