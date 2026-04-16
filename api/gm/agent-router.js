/**
 * api/gm/agent-router.js
 *
 * Agent invocation protocol for the GM concierge.
 *
 * Allows the GM concierge to call specialist analyst agents as tools
 * and receive structured JSON results. This is the missing bridge between
 * the GM chat session and the Type 2 domain-analyst layer.
 *
 * The protocol mirrors the routed_to pattern already present in booking results,
 * but with agent-to-agent semantics:
 *   GM concierge asks → agent-router invokes analyst → result returned as JSON
 *
 * POST /api/gm/agent-router
 *   Body: {
 *     agent: 'member_pulse' | 'service_recovery' | 'revenue_analyst' | 'labor_optimizer' | 'engagement_autopilot',
 *     context?: object,   // Optional additional context from the GM session
 *   }
 *   Returns: { agent, findings, session_id, handoff_ids }
 *
 * Auth: GM, assistant_gm, swoop_admin
 *
 * Also exports `routeToAgent(agent, clubId, context)` for direct invocation
 * by the GM concierge session harness without going through HTTP.
 */

import { withAuth, getReadClubId } from '../lib/withAuth.js';
import { run as runMemberPulse } from '../agents/analysts/member-pulse.js';
import { run as runServiceRecovery } from '../agents/analysts/service-recovery.js';
import { run as runRevenueAnalyst } from '../agents/analysts/revenue-analyst.js';
import { run as runLaborOptimizer } from '../agents/analysts/labor-optimizer.js';
import { run as runEngagementAutopilot } from '../agents/analysts/engagement-autopilot.js';

const AGENT_REGISTRY = {
  member_pulse:          runMemberPulse,
  service_recovery:      runServiceRecovery,
  revenue_analyst:       runRevenueAnalyst,
  labor_optimizer:       runLaborOptimizer,
  engagement_autopilot:  runEngagementAutopilot,
};

/**
 * Route a GM question to the appropriate analyst agent.
 * Returns structured findings the GM concierge can include in its response.
 *
 * @param {string} agentName - one of AGENT_REGISTRY keys
 * @param {string} clubId
 * @param {object} opts - passed through to the analyst's run() function
 * @returns {Promise<{ agent: string, findings: string, session_id: string, error?: string }>}
 */
export async function routeToAgent(agentName, clubId, opts = {}) {
  const runFn = AGENT_REGISTRY[agentName];
  if (!runFn) {
    return {
      agent: agentName,
      findings: `Unknown agent: ${agentName}. Available: ${Object.keys(AGENT_REGISTRY).join(', ')}`,
      session_id: null,
      error: 'unknown_agent',
    };
  }
  try {
    const result = await runFn(clubId, { ...opts, triggerType: 'gm_query' });
    return {
      agent: agentName,
      findings: result.findings,
      session_id: result.session_id,
      handoff_ids: result.handoff_ids || [],
      targets_notified: result.targets_notified || 0,
    };
  } catch (err) {
    console.error(`[agent-router] ${agentName} failed:`, err.message);
    return {
      agent: agentName,
      findings: `The ${agentName} agent encountered an error: ${err.message}`,
      session_id: null,
      error: err.message,
    };
  }
}

// ---------------------------------------------------------------------------
// HTTP handler
// ---------------------------------------------------------------------------

async function agentRouterHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getReadClubId(req);
  const { agent, context = {} } = req.body;

  if (!agent) {
    return res.status(400).json({
      error: 'agent is required',
      available_agents: Object.keys(AGENT_REGISTRY),
    });
  }

  const result = await routeToAgent(agent, clubId, context);

  if (result.error === 'unknown_agent') {
    return res.status(400).json(result);
  }
  return res.status(200).json(result);
}

export default withAuth(agentRouterHandler, { roles: ['gm', 'assistant_gm', 'swoop_admin'] });
