/**
 * POST /api/agents/cos-trigger
 *
 * Chief of Staff meta-agent trigger.
 * Runs after Tomorrow's Game Plan completes (called from gameplan-trigger
 * or cron). Also runs on-demand when >3 pending actions exist from
 * different agents.
 *
 * Flow:
 *   1. Pull all pending actions across all agents
 *   2. Pull agent confidence scores for tie-breaking
 *   3. Detect conflicts + duplicates
 *   4. Merge duplicates, resolve conflicts
 *   5. Rank and cap at 5 output actions
 *   6. Save coordination log
 *
 * Simulation mode: when MANAGED_AGENT_ID or MANAGED_ENV_ID are unset,
 * runs deterministic merge/dedup/rank without calling the LLM.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getWriteClubId } from '../lib/withAuth.js';
import { createManagedSession, sendSessionEvent, MANAGED_AGENT_ID, MANAGED_ENV_ID } from './managed-config.js';

const SIMULATION_MODE = !MANAGED_AGENT_ID || !MANAGED_ENV_ID;

// ---------------------------------------------------------------------------
// Data pull helpers (reused by MCP tool handlers in api/mcp.js)
// ---------------------------------------------------------------------------

/**
 * Pull all pending actions for a club, across all agents.
 */
export async function pullAllPendingActions(clubId) {
  const result = await sql`
    SELECT action_id, club_id, agent_id, action_type, priority, source,
      description, impact_metric, member_id, status, timestamp,
      contributing_agents, coordination_log_id
    FROM agent_actions
    WHERE club_id = ${clubId} AND status = 'pending'
    ORDER BY
      CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END ASC,
      timestamp DESC
  `;
  return {
    actions: result.rows.map(r => ({
      action_id: r.action_id,
      club_id: r.club_id,
      agent_id: r.agent_id,
      action_type: r.action_type,
      priority: r.priority,
      source: r.source,
      description: r.description,
      impact_metric: r.impact_metric,
      member_id: r.member_id,
      status: r.status,
      timestamp: r.timestamp,
      contributing_agents: r.contributing_agents,
      coordination_log_id: r.coordination_log_id,
    })),
    count: result.rows.length,
  };
}

/**
 * Pull agent confidence scores (historical accuracy).
 */
export async function pullAgentConfidenceScores(clubId) {
  const result = await sql`
    SELECT agent_id,
      AVG(confidence) AS avg_confidence,
      COUNT(*) AS total_actions
    FROM agent_activity
    WHERE club_id = ${clubId}
    GROUP BY agent_id
  `;
  return {
    agents: result.rows.map(r => ({
      agent_id: r.agent_id,
      avg_confidence: r.avg_confidence != null ? Number(r.avg_confidence) : null,
      total_actions: Number(r.total_actions),
    })),
  };
}

/**
 * Merge multiple actions into a single combined action.
 * Dismisses originals with reason 'merged'.
 */
export async function mergeActions(clubId, actionIds, mergedDescription, mergedPriority, mergedImpact) {
  const contributingAgents = [];
  for (const id of actionIds) {
    const r = await sql`SELECT agent_id FROM agent_actions WHERE action_id = ${id}`;
    if (r.rows.length > 0) contributingAgents.push(r.rows[0].agent_id);
  }
  const uniqueAgents = [...new Set(contributingAgents)];

  // Create merged action
  const mergedId = `act_cos_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await sql`
    INSERT INTO agent_actions (action_id, club_id, agent_id, action_type, priority, source, description, impact_metric, status, timestamp, contributing_agents)
    VALUES (${mergedId}, ${clubId}, 'chief-of-staff', 'alert_staff', ${mergedPriority}, 'chief-of-staff', ${mergedDescription}, ${mergedImpact || null}, 'pending', NOW(), ${uniqueAgents})
  `;

  // Dismiss originals
  for (const id of actionIds) {
    await sql`
      UPDATE agent_actions
      SET status = 'dismissed', dismissal_reason = 'merged', dismissed_at = NOW()
      WHERE action_id = ${id}
    `;
  }

  return { merged_action_id: mergedId, contributing_agents: uniqueAgents, dismissed: actionIds };
}

/**
 * Resolve a conflict between two actions.
 */
export async function resolveConflict(winnerActionId, loserActionId, rationale) {
  await sql`
    UPDATE agent_actions
    SET status = 'dismissed', dismissal_reason = ${`conflict_resolved: ${rationale}`}, dismissed_at = NOW()
    WHERE action_id = ${loserActionId}
  `;
  return { winner: winnerActionId, loser: loserActionId, rationale, resolved: true };
}

/**
 * Save coordination log.
 */
export async function saveCoordinationLog(clubId, logDate, agentsContributing, actionsInput, actionsOutput, conflictsDetected, conflictsResolved, conflictDetails) {
  const result = await sql`
    INSERT INTO coordination_logs (club_id, log_date, agents_contributing, actions_input, actions_output, conflicts_detected, conflicts_resolved, conflict_details)
    VALUES (${clubId}, ${logDate}, ${agentsContributing}, ${actionsInput}, ${actionsOutput}, ${conflictsDetected}, ${conflictsResolved}, ${JSON.stringify(conflictDetails || [])})
    ON CONFLICT (club_id, log_date) DO UPDATE SET
      agents_contributing = EXCLUDED.agents_contributing,
      actions_input = EXCLUDED.actions_input,
      actions_output = EXCLUDED.actions_output,
      conflicts_detected = EXCLUDED.conflicts_detected,
      conflicts_resolved = EXCLUDED.conflicts_resolved,
      conflict_details = EXCLUDED.conflict_details,
      created_at = NOW()
    RETURNING log_id
  `;
  return { log_id: result.rows[0].log_id, saved: true };
}

// ---------------------------------------------------------------------------
// Simulation logic
// ---------------------------------------------------------------------------

const PRIORITY_RANK = { high: 1, medium: 2, low: 3 };

/**
 * Detect duplicate actions (same member_id from different agents).
 */
function detectDuplicates(actions) {
  const byMember = {};
  for (const a of actions) {
    if (!a.member_id) continue;
    if (!byMember[a.member_id]) byMember[a.member_id] = [];
    byMember[a.member_id].push(a);
  }
  const duplicates = [];
  for (const [memberId, group] of Object.entries(byMember)) {
    const agents = [...new Set(group.map(a => a.agent_id))];
    if (agents.length > 1) {
      duplicates.push({ member_id: memberId, actions: group, agents });
    }
  }
  return duplicates;
}

/**
 * Detect conflicting actions (contradictory staffing recommendations).
 */
function detectConflicts(actions) {
  const conflicts = [];
  const staffingActions = actions.filter(a => a.action_type === 'rebalance' || a.description?.toLowerCase().includes('staff'));
  for (let i = 0; i < staffingActions.length; i++) {
    for (let j = i + 1; j < staffingActions.length; j++) {
      const a = staffingActions[i];
      const b = staffingActions[j];
      if (a.agent_id !== b.agent_id) {
        const aAdds = a.description?.toLowerCase().includes('add');
        const bAdds = b.description?.toLowerCase().includes('add');
        const aReduce = a.description?.toLowerCase().includes('reduc') || a.description?.toLowerCase().includes('release');
        const bReduce = b.description?.toLowerCase().includes('reduc') || b.description?.toLowerCase().includes('release');
        if ((aAdds && bReduce) || (aReduce && bAdds)) {
          conflicts.push({ action_a: a, action_b: b, type: 'staffing_contradiction' });
        }
      }
    }
  }
  return conflicts;
}

/**
 * Simulation-mode coordination: merge, dedup, resolve, rank, cap at 5.
 */
function simulateCoordination(actions, confidenceScores) {
  const confidenceMap = {};
  for (const a of confidenceScores.agents || []) {
    confidenceMap[a.agent_id] = a.avg_confidence ?? 0.5;
  }

  const duplicates = detectDuplicates(actions);
  const conflicts = detectConflicts(actions);
  const conflictDetails = [];
  const dismissedIds = new Set();

  // Handle duplicates: merge into one action per member
  for (const dup of duplicates) {
    const sorted = [...dup.actions].sort((a, b) => (PRIORITY_RANK[a.priority] || 4) - (PRIORITY_RANK[b.priority] || 4));
    const winner = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      dismissedIds.add(sorted[i].action_id);
    }
    // Mark winner with contributing agents
    winner.contributing_agents = dup.agents;
    winner.description = `[Merged] ${winner.description} (also flagged by ${dup.agents.filter(a => a !== winner.agent_id).join(', ')})`;
  }

  // Handle conflicts: higher confidence wins
  for (const conflict of conflicts) {
    const confA = confidenceMap[conflict.action_a.agent_id] ?? 0.5;
    const confB = confidenceMap[conflict.action_b.agent_id] ?? 0.5;
    const winner = confA >= confB ? conflict.action_a : conflict.action_b;
    const loser = winner === conflict.action_a ? conflict.action_b : conflict.action_a;
    dismissedIds.add(loser.action_id);
    conflictDetails.push({
      type: conflict.type,
      winner: winner.action_id,
      loser: loser.action_id,
      rationale: `${winner.agent_id} has higher confidence (${(confidenceMap[winner.agent_id] ?? 0.5).toFixed(2)}) vs ${loser.agent_id} (${(confidenceMap[loser.agent_id] ?? 0.5).toFixed(2)})`,
    });
  }

  // Filter to surviving actions, rank, cap at 5
  const surviving = actions
    .filter(a => !dismissedIds.has(a.action_id))
    .sort((a, b) => (PRIORITY_RANK[a.priority] || 4) - (PRIORITY_RANK[b.priority] || 4));
  const output = surviving.slice(0, 5);

  return {
    output,
    duplicates_merged: duplicates.length,
    conflicts_detected: conflicts.length,
    conflicts_resolved: conflicts.length,
    conflict_details: conflictDetails,
    dismissed_ids: [...dismissedIds],
    agents_contributing: [...new Set(actions.map(a => a.agent_id))],
  };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

async function cosTriggerHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getWriteClubId(req);
  const today = new Date().toISOString().split('T')[0];

  try {
    // 1. Pull all pending actions
    const { actions, count: inputCount } = await pullAllPendingActions(clubId);

    // 2. Pull confidence scores
    const confidenceScores = await pullAgentConfidenceScores(clubId);

    // Check threshold: need actions from >1 agent or called post-game-plan
    const uniqueAgents = [...new Set(actions.map(a => a.agent_id))];
    const calledByGamePlan = req.body?.trigger === 'post_game_plan';

    if (!calledByGamePlan && (inputCount < 3 || uniqueAgents.length < 2)) {
      return res.status(200).json({
        triggered: false,
        reason: 'Insufficient pending actions from different agents',
        pending_count: inputCount,
        unique_agents: uniqueAgents.length,
      });
    }

    // 3. Managed agent or simulation
    if (!SIMULATION_MODE) {
      const session = await createManagedSession();
      await sendSessionEvent(session.id, {
        type: 'user.message',
        content: JSON.stringify({
          trigger: 'chief_of_staff_coordination',
          club_id: clubId,
          pending_actions: actions,
          confidence_scores: confidenceScores,
          timestamp: new Date().toISOString(),
        }),
      });
      return res.status(200).json({
        triggered: true,
        session_id: session.id,
        simulation: false,
        input_actions: inputCount,
      });
    }

    // Simulation mode
    const coordination = simulateCoordination(actions, confidenceScores);

    // Dismiss losers in DB
    for (const id of coordination.dismissed_ids) {
      await sql`
        UPDATE agent_actions
        SET status = 'dismissed', dismissal_reason = 'cos_coordination', dismissed_at = NOW()
        WHERE action_id = ${id}
      `;
    }

    // Tag surviving actions with coordination log reference
    const logResult = await saveCoordinationLog(
      clubId,
      today,
      coordination.agents_contributing,
      inputCount,
      coordination.output.length,
      coordination.conflicts_detected,
      coordination.conflicts_resolved,
      coordination.conflict_details,
    );

    for (const action of coordination.output) {
      await sql`
        UPDATE agent_actions
        SET coordination_log_id = ${logResult.log_id},
            contributing_agents = COALESCE(${action.contributing_agents || null}, contributing_agents)
        WHERE action_id = ${action.action_id}
      `;
    }

    return res.status(200).json({
      triggered: true,
      simulation: true,
      log_id: logResult.log_id,
      input_actions: inputCount,
      output_actions: coordination.output.length,
      conflicts_detected: coordination.conflicts_detected,
      conflicts_resolved: coordination.conflicts_resolved,
      agents_contributing: coordination.agents_contributing,
    });
  } catch (err) {
    console.error('/api/agents/cos-trigger error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export default function handler(req, res) {
  const cronKey = req.headers['x-cron-key'];
  if (cronKey && process.env.CRON_SECRET && cronKey === process.env.CRON_SECRET) {
    req.auth = req.auth || { clubId: req.body?.club_id || 'unknown', role: 'system' };
    return cosTriggerHandler(req, res);
  }
  return withAuth(cosTriggerHandler, { roles: ['gm', 'admin'] })(req, res);
}
