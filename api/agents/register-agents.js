/**
 * POST /api/agents/register-agents
 *
 * One-time setup endpoint that registers all Swoop managed agents with the
 * Anthropic /v1/agents API. Registers domain agents first, then the
 * Chief of Staff coordinator (which references them via callable_agents).
 *
 * Agent Roster (13 agents):
 *   Opus  — Chief of Staff, Personal Concierge, Service Recovery (member-facing)
 *   Sonnet — Member Risk, Service Recovery (club-side), F&B Intelligence,
 *            Board Report, Game Plan, Revenue Analyst, Growth Pipeline
 *   Haiku  — Booking Agent, Staffing & Demand
 *
 * Stores agent IDs in `agent_registry` Postgres table.
 * Idempotent: skips registration if agent name already exists.
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
import CHIEF_OF_STAFF_PROMPT from '../../src/config/chiefOfStaffPrompt.js';
import BOOKING_AGENT_PROMPT from '../../src/config/bookingAgentPrompt.js';
import REVENUE_ANALYST_PROMPT from '../../src/config/revenueAnalystPrompt.js';
import GROWTH_PIPELINE_PROMPT from '../../src/config/growthPipelinePrompt.js';
import { buildPersonalConciergePrompt } from '../../src/config/personalConciergePrompt.js';
import { buildMemberServiceRecoveryPrompt } from '../../src/config/memberServiceRecoveryPrompt.js';

// ---------------------------------------------------------------------------
// Model constants
// ---------------------------------------------------------------------------
const OPUS   = 'claude-opus-4-20250514';
const SONNET = 'claude-sonnet-4-20250514';
const HAIKU  = 'claude-haiku-4-5-20251001';

// ---------------------------------------------------------------------------
// Agent definitions — 12 domain agents (+ Chief of Staff = 13 total)
// ---------------------------------------------------------------------------

const DOMAIN_AGENTS = [
  // --- Opus: emotional intelligence + orchestration ---
  {
    name: 'personal-concierge',
    description: 'Relationship layer — knows member preferences, proactively suggests activities, cross-sells. Member-facing.',
    model: OPUS,
    system_prompt: buildPersonalConciergePrompt({ first_name: '{{member_first_name}}', last_name: '{{member_last_name}}' }, '{{club_name}}'),
    tools: [
      { type: 'mcp', name: 'swoop-concierge-tools', description: 'Lookup member, get preferences, send messages, list events, get weather' },
    ],
  },
  {
    name: 'member-service-recovery',
    description: 'Member-facing complaint handler — empathy-first, files complaints, offers recovery. Emotional intelligence critical.',
    model: OPUS,
    system_prompt: buildMemberServiceRecoveryPrompt({ first_name: '{{member_first_name}}', last_name: '{{member_last_name}}' }, '{{club_name}}'),
    tools: [
      { type: 'mcp', name: 'swoop-complaint-tools', description: 'Log complaints, submit service requests, get member history' },
    ],
  },

  // --- Haiku: transactional, high-volume, speed matters ---
  {
    name: 'booking-agent',
    description: 'Transactional booking engine — tee times, dining, events, waitlist. Fast, accurate, high-volume.',
    model: HAIKU,
    system_prompt: BOOKING_AGENT_PROMPT,
    tools: [
      { type: 'mcp', name: 'swoop-booking-tools', description: 'Book tee times, dining reservations, check availability, manage waitlist, register for events' },
    ],
  },
  {
    name: 'staffing-demand',
    description: 'Continuous staffing monitor — consequence-focused recommendations with dollar quantification.',
    model: HAIKU,
    system_prompt: STAFFING_DEMAND_PROMPT,
    tools: [
      { type: 'mcp', name: 'swoop-staffing-data', description: 'Access staffing schedules, demand forecasts, and labor cost data' },
    ],
  },

  // --- Sonnet: analytical + structured ---
  {
    name: 'member-risk-lifecycle',
    description: 'Monitors member health scores and executes 5-step recovery lifecycle when members cross into At-Risk territory.',
    model: SONNET,
    system_prompt: MEMBER_RISK_PROMPT,
    tools: [
      { type: 'mcp', name: 'swoop-member-data', description: 'Access member health scores, engagement history, and intervention records' },
    ],
  },
  {
    name: 'service-recovery',
    description: 'Club-side (GM-facing) complaint resolution — routes to departments, provides GM talking points, tracks escalation.',
    model: SONNET,
    system_prompt: SERVICE_RECOVERY_PROMPT,
    tools: [
      { type: 'mcp', name: 'swoop-member-data', description: 'Access member profiles, complaint records, and service history' },
    ],
  },
  {
    name: 'tomorrows-game-plan',
    description: 'Daily 5 AM briefing — synthesizes 5 data domains into a prioritized Game Plan for the GM.',
    model: SONNET,
    system_prompt: GAME_PLAN_PROMPT,
    tools: [
      { type: 'mcp', name: 'swoop-club-data', description: 'Access tee sheet, staffing, weather, F&B, and member data for daily planning' },
    ],
  },
  {
    name: 'fb-intelligence',
    description: 'Daily F&B performance monitor — root cause analysis of revenue vs forecast, post-round conversion tracking.',
    model: SONNET,
    system_prompt: FB_INTELLIGENCE_PROMPT,
    tools: [
      { type: 'mcp', name: 'swoop-fb-data', description: 'Access F&B revenue, menu performance, and post-round conversion data' },
    ],
  },
  {
    name: 'board-report-compiler',
    description: 'Monthly board-ready report — intervention outcomes, member saves, revenue impact, KPI synthesis.',
    model: SONNET,
    system_prompt: BOARD_REPORT_PROMPT,
    tools: [
      { type: 'mcp', name: 'swoop-reporting-data', description: 'Access 30-day intervention outcomes, financial metrics, and member retention data' },
    ],
  },
  {
    name: 'revenue-analyst',
    description: 'Financial performance analysis — revenue trends, leaks, conversion gaps, cross-domain correlations.',
    model: SONNET,
    system_prompt: REVENUE_ANALYST_PROMPT,
    tools: [
      { type: 'mcp', name: 'swoop-revenue-data', description: 'Access F&B revenue, golf revenue, event revenue, membership dues, and financial forecasts' },
    ],
  },
  {
    name: 'growth-pipeline',
    description: 'Guest-to-member conversion pipeline — prospect tracking, propensity scoring, targeted outreach recommendations.',
    model: SONNET,
    system_prompt: GROWTH_PIPELINE_PROMPT,
    tools: [
      { type: 'mcp', name: 'swoop-growth-data', description: 'Access guest passes, trial memberships, referral programs, and prospect activity' },
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
  // Phase 2: Register Chief of Staff with callable_agents referencing all 12
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
        description: 'Meta-agent that prioritizes, deduplicates, and coordinates actions across all 12 domain agents.',
        model: OPUS,
        system_prompt: CHIEF_OF_STAFF_PROMPT,
        tools: [
          {
            type: 'agent_toolset_20260401',
            name: 'agent-coordination',
            description: 'Invoke and coordinate domain agents: booking, concierge, service recovery (member + club), risk, staffing, F&B, game plan, board report, revenue, growth',
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
