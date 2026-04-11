/**
 * POST /api/agents/register-agents
 *
 * One-time setup endpoint that registers all 8 Swoop managed agents with the
 * Anthropic /v1/agents API. Registers the 7 domain agents first, then the
 * Chief of Staff coordinator (which references the other 7 via callable_agents).
 *
 * Stores the returned agent IDs in the `agent_registry` Postgres table so
 * trigger endpoints can look them up at runtime.
 *
 * Idempotent: if an agent name already exists in the registry, it skips
 * registration and keeps the existing ID.
 *
 * Requires ANTHROPIC_API_KEY in env.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getWriteClubId } from '../lib/withAuth.js';
import { getAnthropicClient } from './managed-config.js';

import MEMBER_RISK_PROMPT from '../../src/config/memberRiskPrompt.js';
import SERVICE_RECOVERY_PROMPT from '../../src/config/serviceRecoveryPrompt.js';
import GAME_PLAN_PROMPT from '../../src/config/gamePlanPrompt.js';
import STAFFING_DEMAND_PROMPT from '../../src/config/staffingDemandPrompt.js';
import FB_INTELLIGENCE_PROMPT from '../../src/config/fbIntelligencePrompt.js';
import BOARD_REPORT_PROMPT from '../../src/config/boardReportPrompt.js';
import { buildConciergePrompt } from '../../src/config/conciergePrompt.js';
import CHIEF_OF_STAFF_PROMPT from '../../src/config/chiefOfStaffPrompt.js';

// ---------------------------------------------------------------------------
// Agent definitions — the 7 domain agents
// ---------------------------------------------------------------------------

const DOMAIN_AGENTS = [
  {
    name: 'member-risk-lifecycle',
    description: 'Monitors member health scores and executes 5-step recovery lifecycle when members cross into At-Risk territory.',
    model: 'claude-sonnet-4-20250514',
    system_prompt: MEMBER_RISK_PROMPT,
    tools: [
      { type: 'mcp', name: 'swoop-member-data', description: 'Access member health scores, engagement history, and intervention records' },
    ],
  },
  {
    name: 'service-recovery',
    description: 'Handles high-priority complaint resolution for high-value members through a 6-step recovery lifecycle.',
    model: 'claude-sonnet-4-20250514',
    system_prompt: SERVICE_RECOVERY_PROMPT,
    tools: [
      { type: 'mcp', name: 'swoop-member-data', description: 'Access member profiles, complaint records, and service history' },
    ],
  },
  {
    name: 'tomorrows-game-plan',
    description: 'Daily 5 AM briefing agent that synthesizes 5 data domains into a prioritized Game Plan for the GM.',
    model: 'claude-sonnet-4-20250514',
    system_prompt: GAME_PLAN_PROMPT,
    tools: [
      { type: 'mcp', name: 'swoop-club-data', description: 'Access tee sheet, staffing, weather, F&B, and member data for daily planning' },
    ],
  },
  {
    name: 'staffing-demand',
    description: 'Continuous staffing monitor that runs every 6 hours and produces consequence-focused staffing recommendations.',
    model: 'claude-sonnet-4-20250514',
    system_prompt: STAFFING_DEMAND_PROMPT,
    tools: [
      { type: 'mcp', name: 'swoop-staffing-data', description: 'Access staffing schedules, demand forecasts, and labor cost data' },
    ],
  },
  {
    name: 'fb-intelligence',
    description: 'Daily F&B performance monitor that analyzes revenue vs forecast and surfaces root causes.',
    model: 'claude-sonnet-4-20250514',
    system_prompt: FB_INTELLIGENCE_PROMPT,
    tools: [
      { type: 'mcp', name: 'swoop-fb-data', description: 'Access F&B revenue, menu performance, and post-round conversion data' },
    ],
  },
  {
    name: 'board-report-compiler',
    description: 'Monthly agent that compiles intervention outcomes, member saves, and revenue impact into a board-ready report.',
    model: 'claude-sonnet-4-20250514',
    system_prompt: BOARD_REPORT_PROMPT,
    tools: [
      { type: 'mcp', name: 'swoop-reporting-data', description: 'Access 30-day intervention outcomes, financial metrics, and member retention data' },
    ],
  },
  {
    name: 'member-concierge',
    description: 'Personal AI concierge for members — books tee times, dining reservations, RSVPs to events, answers club questions.',
    model: 'claude-sonnet-4-20250514',
    // Concierge prompt is a builder function; use a generic member placeholder for registration
    system_prompt: buildConciergePrompt({ first_name: '{{member_first_name}}', last_name: '{{member_last_name}}' }, '{{club_name}}'),
    tools: [
      { type: 'mcp', name: 'swoop-concierge-tools', description: 'Book tee times, make dining reservations, RSVP to events, look up club info' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helper: register a single agent via POST /v1/agents
// ---------------------------------------------------------------------------

async function registerOneAgent(client, agentDef, betaHeaders) {
  const body = {
    name: agentDef.name,
    description: agentDef.description,
    model: agentDef.model,
    system_prompt: agentDef.system_prompt,
    tools: agentDef.tools,
  };

  // Chief of Staff also gets callable_agents
  if (agentDef.callable_agents) {
    body.callable_agents = agentDef.callable_agents;
  }

  const response = await client.post('/v1/agents', {
    body,
    headers: betaHeaders,
  });

  return response;
}

// ---------------------------------------------------------------------------
// Helper: persist agent ID to Postgres registry
// ---------------------------------------------------------------------------

async function upsertAgentRegistry(agentName, agentId, clubId) {
  await sql`
    INSERT INTO agent_registry (agent_name, agent_id, club_id, registered_at)
    VALUES (${agentName}, ${agentId}, ${clubId}, NOW())
    ON CONFLICT (agent_name, club_id)
    DO UPDATE SET agent_id = ${agentId}, registered_at = NOW()
  `;
}

async function getExistingAgentId(agentName, clubId) {
  const result = await sql`
    SELECT agent_id FROM agent_registry
    WHERE agent_name = ${agentName} AND club_id = ${clubId}
  `;
  return result.rows[0]?.agent_id || null;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

async function registerHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getWriteClubId(req);
  const client = getAnthropicClient();

  const betaHeaders = {
    'anthropic-beta': 'managed-agents-2025-04-01',
  };

  const results = {
    registered: [],
    skipped: [],
    errors: [],
  };

  // -----------------------------------------------------------------------
  // Phase 1: Register the 7 domain agents
  // -----------------------------------------------------------------------
  const registeredAgentIds = {};

  for (const agentDef of DOMAIN_AGENTS) {
    try {
      // Check if already registered
      const existingId = await getExistingAgentId(agentDef.name, clubId);
      if (existingId) {
        registeredAgentIds[agentDef.name] = existingId;
        results.skipped.push({ name: agentDef.name, agent_id: existingId });
        continue;
      }

      const response = await registerOneAgent(client, agentDef, betaHeaders);
      const agentId = response.id;

      await upsertAgentRegistry(agentDef.name, agentId, clubId);
      registeredAgentIds[agentDef.name] = agentId;
      results.registered.push({ name: agentDef.name, agent_id: agentId });
    } catch (err) {
      results.errors.push({ name: agentDef.name, error: err.message });
    }
  }

  // -----------------------------------------------------------------------
  // Phase 2: Register Chief of Staff with callable_agents referencing the 7
  // -----------------------------------------------------------------------
  const cosName = 'chief-of-staff';

  try {
    const existingCosId = await getExistingAgentId(cosName, clubId);
    if (existingCosId) {
      results.skipped.push({ name: cosName, agent_id: existingCosId });
    } else {
      // Build callable_agents list from registered IDs
      const callableAgents = Object.entries(registeredAgentIds).map(
        ([name, id]) => ({
          agent_id: id,
          name,
          description: DOMAIN_AGENTS.find(a => a.name === name)?.description || name,
        })
      );

      const cosDef = {
        name: cosName,
        description: 'Meta-agent that prioritizes, deduplicates, and coordinates actions across all 7 domain agents.',
        model: 'claude-sonnet-4-20250514',
        system_prompt: CHIEF_OF_STAFF_PROMPT,
        tools: [
          {
            type: 'agent_toolset_20260401',
            name: 'agent-coordination',
            description: 'Invoke and coordinate the 7 domain agents',
          },
        ],
        callable_agents: callableAgents,
      };

      const response = await registerOneAgent(client, cosDef, betaHeaders);
      const cosAgentId = response.id;

      await upsertAgentRegistry(cosName, cosAgentId, clubId);
      results.registered.push({ name: cosName, agent_id: cosAgentId });
    }
  } catch (err) {
    results.errors.push({ name: cosName, error: err.message });
  }

  const status = results.errors.length > 0 ? 207 : 200;
  return res.status(status).json({
    message: `Registered ${results.registered.length}, skipped ${results.skipped.length}, errors ${results.errors.length}`,
    ...results,
  });
}

export default withAuth(registerHandler);
