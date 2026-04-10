// api/mcp.js — MCP server for Managed Agent POC
// Exposes 12 tools over JSON-RPC (HTTP transport) for the Service Save Orchestrator.
// Auth: x-mcp-token header validated against MCP_AUTH_TOKEN env var.

import { sql } from '@vercel/postgres';
import { getAnthropicClient } from './agents/managed-config.js';

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function validateToken(req) {
  const token = req.headers['x-mcp-token'];
  if (!token || token !== process.env.MCP_AUTH_TOKEN) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Tool definitions (returned by tools/list)
// ---------------------------------------------------------------------------

const TOOL_DEFINITIONS = [
  {
    name: 'get_member_profile',
    description: "Get a member's full profile including health score, archetype, dues, engagement history, and recent complaints.",
    inputSchema: {
      type: 'object',
      properties: {
        member_id: { type: 'string', description: 'Member ID (e.g., mbr_203)' },
        club_id: { type: 'string', description: 'Club ID' },
      },
      required: ['member_id', 'club_id'],
    },
  },
  {
    name: 'get_open_complaints',
    description: 'Get open/unresolved complaints for a club, optionally filtered to a specific member.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string' },
        member_id: { type: 'string', description: 'Optional. Filter to one member.' },
        min_age_hours: { type: 'integer', description: 'Only return complaints older than N hours.' },
      },
      required: ['club_id'],
    },
  },
  {
    name: 'create_action',
    description: "Propose an action for GM review. The action will appear in the GM's action queue with status 'pending' until approved or dismissed.",
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string' },
        member_id: { type: 'string' },
        action_type: { type: 'string', enum: ['outreach', 'schedule', 'flag', 'rebalance', 'comp', 'alert_staff'] },
        description: { type: 'string', description: 'Human-readable description of the proposed action' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        impact_metric: { type: 'string', description: "e.g., '$18K/yr at risk'" },
        assigned_to: { type: 'string', description: 'Role or name of staff to execute' },
        source: { type: 'string', description: 'Agent name' },
      },
      required: ['club_id', 'action_type', 'description', 'priority', 'source'],
    },
  },
  {
    name: 'update_playbook_step',
    description: 'Update the status of a playbook step (mark as completed, skipped, or add notes).',
    inputSchema: {
      type: 'object',
      properties: {
        step_id: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'skipped'] },
        completed_by: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['step_id', 'status'],
    },
  },
  {
    name: 'start_playbook_run',
    description: 'Initialize a new playbook run for a member. Creates the run record and all step records.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string' },
        playbook_id: { type: 'string', enum: ['service-save', 'new-member-90day', 'staffing-adjustment'] },
        member_id: { type: 'string' },
        triggered_by: { type: 'string', description: 'Who or what triggered this run' },
        trigger_reason: { type: 'string' },
      },
      required: ['club_id', 'playbook_id', 'member_id', 'triggered_by', 'trigger_reason'],
    },
  },
  {
    name: 'get_action_status',
    description: 'Check the current status of a previously proposed action.',
    inputSchema: {
      type: 'object',
      properties: {
        action_id: { type: 'string' },
      },
      required: ['action_id'],
    },
  },
  {
    name: 'record_intervention_outcome',
    description: 'Record the outcome of an intervention: health score before/after, dues protected, whether it qualifies as a member save.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string' },
        member_id: { type: 'string' },
        action_id: { type: 'string' },
        intervention_type: { type: 'string', enum: ['call', 'email', 'comp', 'event_invite'] },
        description: { type: 'string' },
        initiated_by: { type: 'string' },
        health_score_before: { type: 'number' },
        health_score_after: { type: 'number' },
        outcome: { type: 'string', enum: ['retained', 're-engaged', 'resigned', 'pending'] },
        dues_protected: { type: 'number' },
        is_member_save: { type: 'boolean' },
      },
      required: ['club_id', 'member_id', 'intervention_type', 'health_score_before', 'outcome'],
    },
  },
  {
    name: 'get_member_list',
    description: 'Get a filtered list of members by criteria such as health tier, archetype, score range, dues, or inactivity.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string' },
        health_tier: { type: 'string', enum: ['healthy', 'watch', 'at-risk', 'critical'] },
        archetype: { type: 'string' },
        min_health_score: { type: 'integer' },
        max_health_score: { type: 'integer' },
        min_dues: { type: 'integer' },
        inactive_days: { type: 'integer', description: 'Members with no activity in N days' },
        limit: { type: 'integer', default: 20 },
      },
      required: ['club_id'],
    },
  },
  {
    name: 'record_agent_activity',
    description: 'Record an agent activity entry for reasoning chain logging and audit trail.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string' },
        agent_id: { type: 'string' },
        action_type: { type: 'string' },
        description: { type: 'string' },
        member_id: { type: 'string' },
        confidence: { type: 'number' },
        auto_executed: { type: 'boolean', default: false },
        reasoning: { type: 'string' },
        phase: { type: 'string' },
      },
      required: ['club_id', 'agent_id', 'action_type', 'description'],
    },
  },
  {
    name: 'draft_member_message',
    description: 'Draft a personalized outreach message from the GM to a member. Returns the draft text for GM review.',
    inputSchema: {
      type: 'object',
      properties: {
        member_id: { type: 'string' },
        context: { type: 'string', description: 'Why this message is being sent' },
        tone: { type: 'string', enum: ['warm', 'formal', 'apologetic', 'celebratory'], default: 'warm' },
        channel: { type: 'string', enum: ['email', 'sms', 'note'], default: 'email' },
      },
      required: ['member_id', 'context'],
    },
  },
  // --- Phase 2: Service Recovery tools ---
  {
    name: 'get_complaint_history',
    description: "Pull a member's complaint history (last 12 months). Returns all feedback entries sorted by most recent.",
    inputSchema: {
      type: 'object',
      properties: {
        member_id: { type: 'string', description: 'Member ID' },
        club_id: { type: 'string', description: 'Club ID' },
      },
      required: ['member_id', 'club_id'],
    },
  },
  {
    name: 'update_complaint_status',
    description: 'Write a resolution status back to a complaint/feedback record. Sets resolved_at to now.',
    inputSchema: {
      type: 'object',
      properties: {
        feedback_id: { type: 'string', description: 'Feedback/complaint ID to update' },
        status: { type: 'string', description: "New status (e.g., 'resolved', 'in_progress')" },
        resolution_notes: { type: 'string', description: 'Notes describing the resolution' },
      },
      required: ['feedback_id', 'status'],
    },
  },
];

// ---------------------------------------------------------------------------
// Playbook step templates
// ---------------------------------------------------------------------------

const PLAYBOOK_STEPS = {
  'service-save': [
    { step_number: 1, step_key: 'route_complaint', title: 'Route complaint to F&B Director', description: 'Escalate the complaint to the relevant department head with full member context.' },
    { step_number: 2, step_key: 'gm_outreach', title: 'GM personal outreach', description: 'GM calls or sends a personal note acknowledging the issue.' },
    { step_number: 3, step_key: 'day_7_survey', title: 'Follow-up survey (Day 7)', description: 'Send a brief satisfaction check-in 7 days after the incident.' },
    { step_number: 4, step_key: 'day_14_checkin', title: 'Check-in note (Day 14)', description: 'Send a warm personal note 14 days after the incident.' },
    { step_number: 5, step_key: 'day_30_outcome', title: 'Outcome measurement (Day 30)', description: 'Measure health score delta and determine if member was saved.' },
  ],
};

const PLAYBOOK_NAMES = {
  'service-save': 'Service Save Protocol',
  'new-member-90day': 'New Member 90-Day Onboarding',
  'staffing-adjustment': 'Staffing Adjustment Protocol',
};

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------

async function getMemberProfile({ member_id, club_id }) {
  const [memberResult, feedbackResult, healthResult] = await Promise.all([
    sql`
      SELECT member_id::text AS member_id, first_name, last_name, email, phone,
        membership_type, annual_dues, join_date, membership_status,
        household_id, archetype, health_score, health_tier,
        preferred_channel, data_completeness
      FROM members
      WHERE member_id = ${member_id} AND club_id = ${club_id}
    `,
    sql`
      SELECT feedback_id, category, status, sentiment_score, description, submitted_at
      FROM feedback
      WHERE member_id = ${member_id} AND club_id = ${club_id}
      ORDER BY submitted_at DESC
      LIMIT 10
    `,
    sql`
      SELECT score, tier, golf_score, dining_score, email_score, event_score,
        computed_at, archetype, score_delta
      FROM health_scores
      WHERE member_id = ${member_id} AND club_id = ${club_id}
      ORDER BY computed_at DESC
      LIMIT 1
    `,
  ]);

  if (memberResult.rows.length === 0) {
    return { error: `Member ${member_id} not found in club ${club_id}` };
  }

  const m = memberResult.rows[0];
  const health = healthResult.rows[0] || null;

  return {
    member_id: m.member_id,
    name: `${m.first_name} ${m.last_name}`.trim(),
    email: m.email,
    phone: m.phone,
    membership_type: m.membership_type,
    annual_dues: Number(m.annual_dues),
    join_date: m.join_date,
    status: m.membership_status,
    household_id: m.household_id,
    archetype: m.archetype,
    health_score: health ? Number(health.score) : (m.health_score != null ? Number(m.health_score) : null),
    health_tier: health ? health.tier : m.health_tier,
    health_breakdown: health ? {
      golf: Number(health.golf_score),
      dining: Number(health.dining_score),
      email: Number(health.email_score),
      events: Number(health.event_score),
    } : null,
    score_delta: health ? Number(health.score_delta) : null,
    preferred_channel: m.preferred_channel,
    recent_complaints: feedbackResult.rows.map(f => ({
      feedback_id: f.feedback_id,
      category: f.category,
      status: f.status,
      sentiment_score: Number(f.sentiment_score),
      description: f.description,
      submitted_at: f.submitted_at,
    })),
  };
}

async function getOpenComplaints({ club_id, member_id, min_age_hours }) {
  let result;
  if (member_id && min_age_hours) {
    result = await sql`
      SELECT feedback_id, member_id, category, status, sentiment_score,
        description, submitted_at,
        EXTRACT(EPOCH FROM (NOW() - submitted_at::timestamp)) / 3600 AS age_hours
      FROM feedback
      WHERE club_id = ${club_id}
        AND status != 'resolved'
        AND member_id = ${member_id}
        AND EXTRACT(EPOCH FROM (NOW() - submitted_at::timestamp)) / 3600 >= ${min_age_hours}
      ORDER BY submitted_at DESC
    `;
  } else if (member_id) {
    result = await sql`
      SELECT feedback_id, member_id, category, status, sentiment_score,
        description, submitted_at,
        EXTRACT(EPOCH FROM (NOW() - submitted_at::timestamp)) / 3600 AS age_hours
      FROM feedback
      WHERE club_id = ${club_id}
        AND status != 'resolved'
        AND member_id = ${member_id}
      ORDER BY submitted_at DESC
    `;
  } else if (min_age_hours) {
    result = await sql`
      SELECT feedback_id, member_id, category, status, sentiment_score,
        description, submitted_at,
        EXTRACT(EPOCH FROM (NOW() - submitted_at::timestamp)) / 3600 AS age_hours
      FROM feedback
      WHERE club_id = ${club_id}
        AND status != 'resolved'
        AND EXTRACT(EPOCH FROM (NOW() - submitted_at::timestamp)) / 3600 >= ${min_age_hours}
      ORDER BY submitted_at DESC
    `;
  } else {
    result = await sql`
      SELECT feedback_id, member_id, category, status, sentiment_score,
        description, submitted_at,
        EXTRACT(EPOCH FROM (NOW() - submitted_at::timestamp)) / 3600 AS age_hours
      FROM feedback
      WHERE club_id = ${club_id}
        AND status != 'resolved'
      ORDER BY submitted_at DESC
    `;
  }

  return {
    complaints: result.rows.map(r => ({
      feedback_id: r.feedback_id,
      member_id: r.member_id,
      category: r.category,
      status: r.status,
      sentiment_score: Number(r.sentiment_score),
      description: r.description,
      submitted_at: r.submitted_at,
      age_hours: Math.round(Number(r.age_hours)),
    })),
    count: result.rows.length,
  };
}

async function createAction({ club_id, member_id, action_type, description, priority, impact_metric, assigned_to, source }) {
  const actionId = `act_mcp_${Date.now()}`;
  await sql`
    INSERT INTO agent_actions (action_id, club_id, agent_id, action_type, priority, source, description, impact_metric, member_id, status, timestamp)
    VALUES (${actionId}, ${club_id}, ${source}, ${action_type}, ${priority}, ${source}, ${description}, ${impact_metric || null}, ${member_id || null}, 'pending', NOW())
  `;
  return { action_id: actionId, status: 'pending' };
}

async function updatePlaybookStep({ step_id, status, completed_by, notes }) {
  const completedAt = (status === 'completed' || status === 'skipped') ? new Date().toISOString() : null;
  await sql`
    UPDATE playbook_steps
    SET status = ${status},
        completed_by = COALESCE(${completed_by || null}, completed_by),
        notes = COALESCE(${notes || null}, notes),
        completed_at = COALESCE(${completedAt}::timestamptz, completed_at)
    WHERE step_id = ${step_id}
  `;
  return { step_id, status, updated: true };
}

async function startPlaybookRun({ club_id, playbook_id, member_id, triggered_by, trigger_reason }) {
  const steps = PLAYBOOK_STEPS[playbook_id];
  if (!steps) {
    // For playbooks without predefined steps, create the run with no steps
    const runResult = await sql`
      INSERT INTO playbook_runs (club_id, playbook_id, playbook_name, member_id, triggered_by, trigger_reason, status, started_at)
      VALUES (${club_id}, ${playbook_id}, ${PLAYBOOK_NAMES[playbook_id] || playbook_id}, ${member_id}, ${triggered_by}, ${trigger_reason}, 'active', NOW())
      RETURNING run_id
    `;
    return { run_id: runResult.rows[0].run_id, steps: [] };
  }

  // Get member's current health score for the run record
  const healthResult = await sql`
    SELECT health_score FROM members WHERE member_id = ${member_id} AND club_id = ${club_id}
  `;
  const healthAtStart = healthResult.rows[0]?.health_score ?? null;

  const runResult = await sql`
    INSERT INTO playbook_runs (club_id, playbook_id, playbook_name, member_id, triggered_by, trigger_reason, status, started_at, health_score_at_start)
    VALUES (${club_id}, ${playbook_id}, ${PLAYBOOK_NAMES[playbook_id]}, ${member_id}, ${triggered_by}, ${trigger_reason}, 'active', NOW(), ${healthAtStart})
    RETURNING run_id
  `;
  const runId = runResult.rows[0].run_id;

  // Insert all steps
  const insertedSteps = [];
  for (const step of steps) {
    const stepResult = await sql`
      INSERT INTO playbook_steps (run_id, club_id, step_number, step_key, title, description, status)
      VALUES (${runId}, ${club_id}, ${step.step_number}, ${step.step_key || null}, ${step.title}, ${step.description}, 'pending')
      RETURNING step_id
    `;
    insertedSteps.push({
      step_id: stepResult.rows[0].step_id,
      step_number: step.step_number,
      title: step.title,
      status: 'pending',
    });
  }

  return { run_id: runId, steps: insertedSteps };
}

async function getActionStatus({ action_id }) {
  const result = await sql`
    SELECT action_id, status, approved_at, dismissed_at, dismissal_reason, approval_action, timestamp
    FROM agent_actions
    WHERE action_id = ${action_id}
  `;
  if (result.rows.length === 0) {
    return { error: `Action ${action_id} not found` };
  }
  const r = result.rows[0];
  return {
    action_id: r.action_id,
    status: r.status,
    created_at: r.timestamp ? new Date(r.timestamp).toISOString() : null,
    approved_at: r.approved_at ? new Date(r.approved_at).toISOString() : null,
    dismissed_at: r.dismissed_at ? new Date(r.dismissed_at).toISOString() : null,
    dismissal_reason: r.dismissal_reason,
    approval_action: r.approval_action,
  };
}

async function recordInterventionOutcome({ club_id, member_id, action_id, intervention_type, description, initiated_by, health_score_before, health_score_after, outcome, dues_protected, is_member_save }) {
  const result = await sql`
    INSERT INTO member_interventions (club_id, member_id, trigger_type, trigger_detail, action_taken, outcome, health_before, health_after, dues_at_risk, intervention_date)
    VALUES (
      ${club_id},
      ${member_id},
      ${intervention_type},
      ${action_id || null},
      ${description || null},
      ${outcome},
      ${health_score_before},
      ${health_score_after || null},
      ${dues_protected || null},
      CURRENT_DATE
    )
    RETURNING intervention_id
  `;
  return {
    intervention_id: result.rows[0].intervention_id,
    is_member_save: is_member_save || false,
    outcome,
  };
}

async function getMemberList({ club_id, health_tier, archetype, min_health_score, max_health_score, min_dues, inactive_days, limit }) {
  const conditions = [`club_id = $1`];
  const values = [club_id];
  let idx = 2;

  if (health_tier) {
    conditions.push(`health_tier = $${idx}`);
    values.push(health_tier);
    idx++;
  }
  if (archetype) {
    conditions.push(`archetype = $${idx}`);
    values.push(archetype);
    idx++;
  }
  if (min_health_score != null) {
    conditions.push(`health_score >= $${idx}`);
    values.push(min_health_score);
    idx++;
  }
  if (max_health_score != null) {
    conditions.push(`health_score <= $${idx}`);
    values.push(max_health_score);
    idx++;
  }
  if (min_dues != null) {
    conditions.push(`annual_dues >= $${idx}`);
    values.push(min_dues);
    idx++;
  }
  if (inactive_days != null) {
    conditions.push(`last_activity < NOW() - INTERVAL '1 day' * $${idx}`);
    values.push(inactive_days);
    idx++;
  }

  const whereClause = conditions.join(' AND ');
  const queryLimit = limit || 20;
  values.push(queryLimit);

  const result = await sql.query(
    `SELECT member_id::text AS member_id, first_name || ' ' || last_name AS name,
       health_score, health_tier, archetype, annual_dues, last_activity
     FROM members
     WHERE ${whereClause}
     ORDER BY health_score ASC NULLS LAST
     LIMIT $${idx}`,
    values,
  );

  return {
    members: result.rows.map(r => ({
      member_id: r.member_id,
      name: r.name?.trim(),
      health_score: r.health_score != null ? Number(r.health_score) : null,
      health_tier: r.health_tier,
      archetype: r.archetype,
      annual_dues: r.annual_dues != null ? Number(r.annual_dues) : null,
      last_activity: r.last_activity,
    })),
    count: result.rows.length,
  };
}

async function recordAgentActivity({ club_id, agent_id, action_type, description, member_id, confidence, auto_executed, reasoning, phase }) {
  const result = await sql`
    INSERT INTO agent_activity (club_id, agent_id, action_type, description, member_id, confidence, auto_executed, reasoning, phase)
    VALUES (${club_id}, ${agent_id}, ${action_type}, ${description}, ${member_id || null}, ${confidence || null}, ${auto_executed || false}, ${reasoning || null}, ${phase || null})
    RETURNING activity_id
  `;
  return { activity_id: result.rows[0].activity_id };
}

async function draftMemberMessage({ member_id, context, tone, channel }) {
  // Fetch member context for the prompt
  const memberResult = await sql`
    SELECT first_name, last_name, membership_type, archetype, annual_dues, health_score
    FROM members WHERE member_id = ${member_id}
  `;
  if (memberResult.rows.length === 0) {
    return { error: `Member ${member_id} not found` };
  }
  const m = memberResult.rows[0];
  const memberContext = {
    name: `${m.first_name} ${m.last_name}`.trim(),
    membership_type: m.membership_type,
    archetype: m.archetype,
  };

  const channelGuidance = {
    email: 'Write a brief email (3 short paragraphs max). No subject line or signature block.',
    sms: 'Write a concise SMS message (under 300 characters). Casual but respectful.',
    note: 'Write a brief handwritten-style note (2-3 sentences).',
  };

  const systemPrompt = `You are writing a personal outreach message on behalf of the General Manager of a private golf club.

Rules:
- Write in first person from the GM's perspective.
- Tone: ${tone || 'warm'}.
- ${channelGuidance[channel || 'email']}
- Never mention data, scores, systems, or anything that sounds like it came from a database.
- The message should feel handwritten and sincere, not corporate.
- Focus on acknowledgment, care, and a specific next step.`;

  const client = getAnthropicClient();
  const data = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `Write a personal outreach message for this member:\n\nMember: ${JSON.stringify(memberContext)}\nContext: ${context}\nChannel: ${channel || 'email'}`,
    }],
  });

  const draft = data.content?.[0]?.text ?? '';

  return { draft, channel: channel || 'email', tone: tone || 'warm' };
}

async function getComplaintHistory({ member_id, club_id }) {
  const result = await sql`
    SELECT feedback_id, category, status, sentiment_score, description,
      submitted_at, resolved_at, resolution_notes
    FROM feedback
    WHERE member_id = ${member_id} AND club_id = ${club_id}
      AND submitted_at > NOW() - INTERVAL '12 months'
    ORDER BY submitted_at DESC
  `;
  return {
    complaints: result.rows.map(r => ({
      feedback_id: r.feedback_id,
      category: r.category,
      status: r.status,
      sentiment_score: r.sentiment_score != null ? Number(r.sentiment_score) : null,
      description: r.description,
      submitted_at: r.submitted_at,
      resolved_at: r.resolved_at,
      resolution_notes: r.resolution_notes,
    })),
    count: result.rows.length,
  };
}

async function updateComplaintStatus({ feedback_id, status, resolution_notes }) {
  await sql`
    UPDATE feedback
    SET status = ${status},
        resolved_at = NOW(),
        resolution_notes = ${resolution_notes || null}
    WHERE feedback_id = ${feedback_id}
  `;
  return { feedback_id, status, updated: true };
}

// ---------------------------------------------------------------------------
// Tool dispatch
// ---------------------------------------------------------------------------

const TOOL_HANDLERS = {
  get_member_profile: getMemberProfile,
  get_open_complaints: getOpenComplaints,
  create_action: createAction,
  update_playbook_step: updatePlaybookStep,
  start_playbook_run: startPlaybookRun,
  get_action_status: getActionStatus,
  record_intervention_outcome: recordInterventionOutcome,
  draft_member_message: draftMemberMessage,
  get_member_list: getMemberList,
  record_agent_activity: recordAgentActivity,
  get_complaint_history: getComplaintHistory,
  update_complaint_status: updateComplaintStatus,
};

// ---------------------------------------------------------------------------
// JSON-RPC handler
// ---------------------------------------------------------------------------

function jsonRpcError(id, code, message) {
  return { jsonrpc: '2.0', error: { code, message }, id: id ?? null };
}

function jsonRpcResult(id, result) {
  return { jsonrpc: '2.0', result, id };
}

export default async function handler(req, res) {
  // CORS for MCP clients
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-mcp-token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth
  if (!validateToken(req)) {
    return res.status(401).json(jsonRpcError(null, -32000, 'Invalid or missing x-mcp-token'));
  }

  const { jsonrpc, method, params, id } = req.body ?? {};

  if (jsonrpc !== '2.0') {
    return res.status(400).json(jsonRpcError(id, -32600, 'Invalid JSON-RPC version'));
  }

  // tools/list — return all tool definitions
  if (method === 'tools/list') {
    return res.status(200).json(jsonRpcResult(id, { tools: TOOL_DEFINITIONS }));
  }

  // tools/call — execute a tool
  if (method === 'tools/call') {
    const toolName = params?.name;
    const args = params?.arguments ?? {};

    const handler = TOOL_HANDLERS[toolName];
    if (!handler) {
      return res.status(200).json(jsonRpcResult(id, {
        isError: true,
        content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
      }));
    }

    try {
      const result = await handler(args);
      return res.status(200).json(jsonRpcResult(id, {
        content: [{ type: 'text', text: JSON.stringify(result) }],
      }));
    } catch (err) {
      console.error(`MCP tool ${toolName} error:`, err);
      return res.status(200).json(jsonRpcResult(id, {
        isError: true,
        content: [{ type: 'text', text: `Tool error: ${err.message}` }],
      }));
    }
  }

  // Unknown method
  return res.status(200).json(jsonRpcError(id, -32601, `Unknown method: ${method}`));
}
