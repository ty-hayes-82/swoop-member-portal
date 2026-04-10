// api/mcp.js — MCP server for Managed Agent POC
// Exposes 30 tools over JSON-RPC (HTTP transport) for the Managed Agent fleet.
// Auth: x-mcp-token header validated against MCP_AUTH_TOKEN env var.

import { sql } from '@vercel/postgres';
import { getAnthropicClient } from './agents/managed-config.js';
import { notifyClubAgents } from './agents/agent-bridge.js';

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
  // --- Phase 3: Tomorrow's Game Plan tools ---
  {
    name: 'get_tee_sheet_summary',
    description: "Get tomorrow's bookings summary: total rounds, peak windows (morning/afternoon split), and notable at-risk members playing.",
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        date: { type: 'string', description: 'Target date (YYYY-MM-DD)' },
      },
      required: ['club_id', 'date'],
    },
  },
  {
    name: 'get_weather_forecast',
    description: "Get the weather forecast for a date including conditions, temperature, wind, precipitation, and golf/F&B demand modifiers.",
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        date: { type: 'string', description: 'Target date (YYYY-MM-DD)' },
      },
      required: ['club_id', 'date'],
    },
  },
  {
    name: 'get_staffing_schedule',
    description: 'Get the scheduled staff by outlet and shift for a given date. Returns shift details and total staff count.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        date: { type: 'string', description: 'Target date (YYYY-MM-DD)' },
      },
      required: ['club_id', 'date'],
    },
  },
  {
    name: 'get_fb_reservations',
    description: 'Get dining reservations and projected covers by outlet and meal period for a given date.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        date: { type: 'string', description: 'Target date (YYYY-MM-DD)' },
      },
      required: ['club_id', 'date'],
    },
  },
  {
    name: 'get_daily_game_plan_history',
    description: 'Get the previous 7 days of game plans for continuity and outcome tracking.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
      },
      required: ['club_id'],
    },
  },
  {
    name: 'save_game_plan',
    description: 'Save a completed game plan to the daily_game_plans table. Upserts on (club_id, plan_date).',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        plan_date: { type: 'string', description: 'Plan date (YYYY-MM-DD)' },
        risk_level: { type: 'string', enum: ['low', 'normal', 'elevated', 'high'], description: 'Overall risk assessment' },
        action_count: { type: 'integer', description: 'Number of action items in the plan' },
        plan_content: { type: 'object', description: 'Full structured game plan (JSON)' },
      },
      required: ['club_id', 'plan_date', 'plan_content'],
    },
  },
  // --- Phase 4: Staffing-Demand Alignment tools ---
  {
    name: 'get_staffing_vs_demand',
    description: 'Get current staff schedule overlaid with demand forecast, gap analysis by outlet and time window. Includes cover-to-staff ratios and ideal staffing levels.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        date: { type: 'string', description: 'Target date (YYYY-MM-DD)' },
      },
      required: ['club_id', 'date'],
    },
  },
  {
    name: 'get_historical_staffing_outcomes',
    description: 'Get past staffing recommendations with outcomes for feedback loop. Shows what was forecast, scheduled, and what actually happened.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        lookback_days: { type: 'integer', description: 'Number of days to look back (default 30)', default: 30 },
      },
      required: ['club_id'],
    },
  },
  {
    name: 'update_staffing_recommendation',
    description: 'Write a staffing recommendation with confidence score to the staffing_recommendations table.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        target_date: { type: 'string', description: 'Target date (YYYY-MM-DD)' },
        outlet: { type: 'string', description: 'Outlet name (e.g., Grill Room)' },
        time_window: { type: 'string', description: 'Time window (e.g., 11:00 AM - 2:00 PM)' },
        current_staff: { type: 'integer', description: 'Currently scheduled staff count' },
        recommended_staff: { type: 'integer', description: 'Recommended staff count' },
        demand_forecast: { type: 'integer', description: 'Projected covers or rounds' },
        revenue_at_risk: { type: 'number', description: 'Dollar amount at risk (negative = savings)' },
        confidence: { type: 'number', description: 'Confidence score 0-1' },
        rationale: { type: 'string', description: 'Explanation citing consequence and cross-domain signals' },
      },
      required: ['club_id', 'target_date', 'outlet', 'time_window', 'recommended_staff', 'rationale'],
    },
  },
  // --- Phase 5: Chief of Staff tools ---
  {
    name: 'get_all_pending_actions',
    description: 'Pull all pending actions across all agents for a club. Returns actions ordered by priority then timestamp.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
      },
      required: ['club_id'],
    },
  },
  {
    name: 'merge_actions',
    description: 'Merge 2+ actions into a single combined action with multi-agent provenance. Dismisses the originals with reason "merged".',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        action_ids: { type: 'array', items: { type: 'string' }, description: 'Array of action IDs to merge' },
        merged_description: { type: 'string', description: 'Description for the merged action' },
        merged_priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priority for the merged action' },
        merged_impact: { type: 'string', description: 'Impact metric for the merged action' },
      },
      required: ['club_id', 'action_ids', 'merged_description', 'merged_priority'],
    },
  },
  {
    name: 'resolve_conflict',
    description: 'Mark a conflict between two actions as resolved. The winning action stays pending; the losing action is dismissed with rationale.',
    inputSchema: {
      type: 'object',
      properties: {
        action_id_winner: { type: 'string', description: 'Action ID that wins the conflict' },
        action_id_loser: { type: 'string', description: 'Action ID that loses the conflict' },
        rationale: { type: 'string', description: 'Explanation for the resolution decision' },
      },
      required: ['action_id_winner', 'action_id_loser', 'rationale'],
    },
  },
  {
    name: 'get_agent_confidence_scores',
    description: 'Pull historical accuracy per agent: average confidence and total action count. Used for tie-breaking in conflict resolution.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
      },
      required: ['club_id'],
    },
  },
  {
    name: 'save_coordination_log',
    description: 'Write a coordination summary to the coordination_logs table. Upserts on (club_id, log_date).',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        log_date: { type: 'string', description: 'Coordination date (YYYY-MM-DD)' },
        agents_contributing: { type: 'array', items: { type: 'string' }, description: 'Agent IDs that contributed' },
        actions_input: { type: 'integer', description: 'Total actions received from agents' },
        actions_output: { type: 'integer', description: 'Final actions after merge/dedup/prioritize' },
        conflicts_detected: { type: 'integer', description: 'Number of conflicts detected' },
        conflicts_resolved: { type: 'integer', description: 'Number of conflicts resolved' },
        conflict_details: { type: 'object', description: 'Details of conflicts and resolutions (JSON)' },
      },
      required: ['club_id', 'log_date', 'agents_contributing', 'actions_input', 'actions_output'],
    },
  },
  // --- Phase 6: F&B Intelligence tools ---
  {
    name: 'get_daily_fb_performance',
    description: 'Pull daily F&B performance: revenue, covers, margin by outlet and meal period.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        date: { type: 'string', description: 'Date (YYYY-MM-DD)' },
      },
      required: ['club_id', 'date'],
    },
  },
  {
    name: 'get_menu_mix_analysis',
    description: 'Pull menu mix analysis: item-level sales, margin contribution, and category mix for a given date.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        date: { type: 'string', description: 'Date (YYYY-MM-DD)' },
      },
      required: ['club_id', 'date'],
    },
  },
  {
    name: 'get_cover_vs_reservation_delta',
    description: 'Compare reservation covers vs actual covers to measure no-show and walk-in rates.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        date: { type: 'string', description: 'Date (YYYY-MM-DD)' },
      },
      required: ['club_id', 'date'],
    },
  },
  // --- Phase 6: Board Report Compiler tools ---
  {
    name: 'get_monthly_intervention_summary',
    description: 'Pull monthly intervention summary: all interventions, outcomes, and member saves for a given month.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        month: { type: 'string', description: 'Month (YYYY-MM)' },
      },
      required: ['club_id', 'month'],
    },
  },
  {
    name: 'get_monthly_staffing_outcomes',
    description: 'Pull monthly staffing recommendation outcomes: recommendations, approval rates, and actual results.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        month: { type: 'string', description: 'Month (YYYY-MM)' },
      },
      required: ['club_id', 'month'],
    },
  },
  {
    name: 'get_monthly_revenue_attribution',
    description: 'Pull monthly revenue attribution: approved agent actions and their dollar impact, grouped by agent.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        month: { type: 'string', description: 'Month (YYYY-MM)' },
      },
      required: ['club_id', 'month'],
    },
  },
  {
    name: 'save_draft_board_report',
    description: 'Save a draft board report for GM review. Upserts on (club_id, report_month).',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        month: { type: 'string', description: 'Report month (YYYY-MM)' },
        report: { type: 'object', description: 'Full report object with content, metrics, and attribution chain' },
      },
      required: ['club_id', 'month', 'report'],
    },
  },
  // --- Phase 7: Member Concierge tools ---
  {
    name: 'book_tee_time',
    description: 'Check tee time availability and create a booking for a member. Returns the new booking ID or an error if the slot is taken.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        course_id: { type: 'string', description: 'Course ID' },
        member_id: { type: 'string', description: 'Member ID of the booker' },
        booking_date: { type: 'string', description: 'Date (YYYY-MM-DD)' },
        tee_time: { type: 'string', description: 'Tee time (HH:MM)' },
        player_count: { type: 'integer', description: 'Number of players (1-4)', default: 1 },
        guest_names: { type: 'array', items: { type: 'string' }, description: 'Names of any guests in the group' },
      },
      required: ['club_id', 'course_id', 'member_id', 'booking_date', 'tee_time'],
    },
  },
  {
    name: 'make_dining_reservation',
    description: 'Check dining outlet availability and create a reservation for a member.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        outlet_id: { type: 'string', description: 'Dining outlet ID' },
        member_id: { type: 'string', description: 'Member ID' },
        reservation_date: { type: 'string', description: 'Date (YYYY-MM-DD)' },
        reservation_time: { type: 'string', description: 'Time (HH:MM)' },
        party_size: { type: 'integer', description: 'Number of guests including member', default: 2 },
        special_requests: { type: 'string', description: 'Any special requests or dietary needs' },
      },
      required: ['club_id', 'outlet_id', 'member_id', 'reservation_date', 'reservation_time'],
    },
  },
  {
    name: 'rsvp_event',
    description: 'Register a member for a club event.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        event_id: { type: 'string', description: 'Event ID' },
        member_id: { type: 'string', description: 'Member ID' },
        guest_count: { type: 'integer', description: 'Number of additional guests', default: 0 },
      },
      required: ['club_id', 'event_id', 'member_id'],
    },
  },
  {
    name: 'cancel_tee_time',
    description: 'Cancel a previously booked tee time for a member.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        member_id: { type: 'string', description: 'Member ID' },
        booking_date: { type: 'string', description: 'Date of the tee time to cancel' },
        tee_time: { type: 'string', description: 'Time of the tee time to cancel' },
      },
      required: ['club_id', 'member_id', 'booking_date'],
    },
  },
  {
    name: 'file_complaint',
    description: 'File a complaint or feedback on behalf of a member. Routes to the appropriate manager.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        member_id: { type: 'string', description: 'Member ID' },
        category: { type: 'string', enum: ['food_and_beverage', 'golf_operations', 'facilities', 'staff', 'billing', 'other'] },
        description: { type: 'string', description: 'What happened — the member complaint in their own words' },
      },
      required: ['club_id', 'member_id', 'category', 'description'],
    },
  },
  {
    name: 'get_my_schedule',
    description: "Get a member's upcoming bookings, dining reservations, and event registrations.",
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
    name: 'get_club_calendar',
    description: 'Get upcoming club events, specials, and weather forecasts.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        limit: { type: 'integer', description: 'Max events to return', default: 10 },
      },
      required: ['club_id'],
    },
  },
  {
    name: 'send_request_to_club',
    description: 'Escalate a member request to club staff for follow-up. Creates a visible request in the staff queue.',
    inputSchema: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: 'Club ID' },
        member_id: { type: 'string', description: 'Member ID' },
        request_type: { type: 'string', enum: ['general', 'maintenance', 'billing', 'membership', 'complaint', 'suggestion'], description: 'Category of request' },
        description: { type: 'string', description: 'Detailed description of the request' },
      },
      required: ['club_id', 'member_id', 'request_type', 'description'],
    },
  },
  {
    name: 'get_my_profile',
    description: "Get a member-safe view of their own profile: name, preferences, household, upcoming schedule. Does NOT include health scores or risk classifications.",
    inputSchema: {
      type: 'object',
      properties: {
        member_id: { type: 'string', description: 'Member ID' },
        club_id: { type: 'string', description: 'Club ID' },
      },
      required: ['member_id', 'club_id'],
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

// --- Phase 3: Game Plan tool handlers ---

async function getTeeSheetSummary({ club_id, date }) {
  const result = await sql`
    SELECT COUNT(*) AS total_rounds,
      SUM(CASE WHEN tee_time < '12:00' THEN 1 ELSE 0 END) AS morning_rounds,
      SUM(CASE WHEN tee_time >= '12:00' THEN 1 ELSE 0 END) AS afternoon_rounds
    FROM bookings
    WHERE booking_date = ${date} AND club_id = ${club_id} AND status = 'confirmed'
  `;
  const row = result.rows[0] || {};

  const notable = await sql`
    SELECT b.member_id, m.first_name, m.last_name, m.health_score, m.annual_dues, b.tee_time
    FROM bookings b
    JOIN members m ON b.member_id = m.member_id AND b.club_id = m.club_id
    WHERE b.booking_date = ${date} AND b.club_id = ${club_id} AND b.status = 'confirmed'
      AND m.health_tier IN ('at-risk', 'critical')
    ORDER BY m.annual_dues DESC
    LIMIT 5
  `;

  return {
    date,
    total_rounds: Number(row.total_rounds ?? 0),
    morning_rounds: Number(row.morning_rounds ?? 0),
    afternoon_rounds: Number(row.afternoon_rounds ?? 0),
    notable_members: notable.rows.map(r => ({
      member_id: r.member_id,
      name: `${r.first_name} ${r.last_name}`.trim(),
      health_score: Number(r.health_score),
      annual_dues: Number(r.annual_dues),
      tee_time: r.tee_time,
    })),
  };
}

async function getWeatherForecast({ club_id, date }) {
  const result = await sql`
    SELECT condition, temp_high, temp_low, wind_mph, precipitation_in,
      golf_demand_modifier, fb_demand_modifier
    FROM weather_daily
    WHERE date = ${date} AND club_id = ${club_id}
    LIMIT 1
  `;
  if (result.rows.length === 0) {
    return { available: false, date, message: 'No weather data for this date' };
  }
  const w = result.rows[0];
  return {
    available: true,
    date,
    condition: w.condition,
    temp_high: Number(w.temp_high),
    temp_low: Number(w.temp_low),
    wind_mph: Number(w.wind_mph),
    precipitation_in: Number(w.precipitation_in),
    golf_demand_modifier: Number(w.golf_demand_modifier),
    fb_demand_modifier: Number(w.fb_demand_modifier),
  };
}

async function getStaffingSchedule({ club_id, date }) {
  const result = await sql`
    SELECT ss.outlet, ss.shift, ss.staff_count
    FROM staff_shifts ss
    WHERE ss.date = ${date} AND ss.club_id = ${club_id}
    ORDER BY ss.outlet, ss.shift
  `;
  return {
    date,
    shifts: result.rows.map(r => ({
      outlet: r.outlet,
      shift: r.shift,
      staff_count: Number(r.staff_count),
    })),
    total_staff: result.rows.reduce((sum, r) => sum + Number(r.staff_count), 0),
  };
}

async function getFbReservations({ club_id, date }) {
  const result = await sql`
    SELECT outlet, meal_period, SUM(covers) AS total_covers, COUNT(*) AS reservation_count
    FROM fb_reservations
    WHERE date = ${date} AND club_id = ${club_id}
    GROUP BY outlet, meal_period
    ORDER BY outlet, meal_period
  `;
  return {
    date,
    reservations: result.rows.map(r => ({
      outlet: r.outlet,
      meal_period: r.meal_period,
      total_covers: Number(r.total_covers),
      reservation_count: Number(r.reservation_count),
    })),
    total_covers: result.rows.reduce((sum, r) => sum + Number(r.total_covers), 0),
  };
}

async function getDailyGamePlanHistory({ club_id }) {
  const result = await sql`
    SELECT plan_id, plan_date, risk_level, action_count, plan_content,
      created_at, actions_approved, actions_dismissed
    FROM daily_game_plans
    WHERE club_id = ${club_id}
    ORDER BY plan_date DESC
    LIMIT 7
  `;
  return {
    plans: result.rows.map(r => ({
      plan_id: r.plan_id,
      plan_date: r.plan_date,
      risk_level: r.risk_level,
      action_count: Number(r.action_count),
      plan_content: r.plan_content,
      actions_approved: Number(r.actions_approved ?? 0),
      actions_dismissed: Number(r.actions_dismissed ?? 0),
    })),
    count: result.rows.length,
  };
}

async function saveGamePlanTool({ club_id, plan_date, risk_level, action_count, plan_content }) {
  const result = await sql`
    INSERT INTO daily_game_plans (club_id, plan_date, risk_level, action_count, plan_content)
    VALUES (${club_id}, ${plan_date}, ${risk_level || 'normal'}, ${action_count || 0}, ${JSON.stringify(plan_content)})
    ON CONFLICT (club_id, plan_date) DO UPDATE SET
      risk_level = EXCLUDED.risk_level,
      action_count = EXCLUDED.action_count,
      plan_content = EXCLUDED.plan_content,
      created_at = NOW()
    RETURNING plan_id
  `;
  return { plan_id: result.rows[0].plan_id, saved: true };
}

async function updateComplaintStatus({ feedback_id, status, resolution_notes }) {
  const isResolved = status === 'resolved';
  const result = await sql`
    UPDATE feedback
    SET status = ${status},
        resolved_at = CASE WHEN ${isResolved}::boolean THEN NOW() ELSE resolved_at END,
        resolution_notes = COALESCE(${resolution_notes || null}, resolution_notes)
    WHERE feedback_id = ${feedback_id}
    RETURNING feedback_id
  `;
  if (result.rows.length === 0) {
    return { error: `Feedback ${feedback_id} not found`, updated: false };
  }
  return { feedback_id, status, updated: true };
}

// --- Phase 4: Staffing-Demand Alignment tool handlers ---

async function getStaffingVsDemand({ club_id, date }) {
  const staffResult = await sql`
    SELECT ss.outlet, ss.shift, ss.staff_count
    FROM staff_shifts ss
    WHERE ss.date = ${date} AND ss.club_id = ${club_id}
    ORDER BY ss.outlet, ss.shift
  `;

  const demandResult = await sql`
    SELECT outlet, meal_period, SUM(covers) AS projected_covers, COUNT(*) AS reservation_count
    FROM fb_reservations
    WHERE date = ${date} AND club_id = ${club_id}
    GROUP BY outlet, meal_period
    ORDER BY outlet, meal_period
  `;

  const roundsResult = await sql`
    SELECT COUNT(*) AS total_rounds,
      SUM(CASE WHEN tee_time < '12:00' THEN 1 ELSE 0 END) AS morning_rounds,
      SUM(CASE WHEN tee_time >= '12:00' THEN 1 ELSE 0 END) AS afternoon_rounds
    FROM bookings
    WHERE booking_date = ${date} AND club_id = ${club_id} AND status = 'confirmed'
  `;

  const rounds = roundsResult.rows[0] || {};
  const shifts = staffResult.rows.map(r => ({
    outlet: r.outlet, shift: r.shift, staff_count: Number(r.staff_count),
  }));
  const demand = demandResult.rows.map(r => ({
    outlet: r.outlet, meal_period: r.meal_period,
    projected_covers: Number(r.projected_covers),
    reservation_count: Number(r.reservation_count),
  }));

  const gaps = [];
  for (const d of demand) {
    const match = shifts.find(s => s.outlet === d.outlet && s.shift === d.meal_period);
    const staffCount = match ? match.staff_count : 0;
    const idealStaff = Math.ceil(d.projected_covers / 10);
    gaps.push({
      outlet: d.outlet, time_window: d.meal_period,
      current_staff: staffCount, ideal_staff: idealStaff,
      gap: staffCount - idealStaff,
      projected_covers: d.projected_covers,
      cover_to_staff_ratio: staffCount > 0 ? Math.round(d.projected_covers / staffCount * 10) / 10 : null,
    });
  }

  return {
    date,
    total_rounds: Number(rounds.total_rounds ?? 0),
    morning_rounds: Number(rounds.morning_rounds ?? 0),
    afternoon_rounds: Number(rounds.afternoon_rounds ?? 0),
    shifts, demand, gaps,
    total_staff: shifts.reduce((sum, s) => sum + s.staff_count, 0),
    total_covers: demand.reduce((sum, d) => sum + d.projected_covers, 0),
  };
}

async function getHistoricalStaffingOutcomes({ club_id, lookback_days }) {
  const days = lookback_days || 30;
  const result = await sql`
    SELECT rec_id, target_date, outlet, time_window,
      current_staff, recommended_staff, demand_forecast,
      revenue_at_risk, confidence, rationale, status, actual_outcome, created_at
    FROM staffing_recommendations
    WHERE club_id = ${club_id}
      AND created_at > NOW() - INTERVAL '1 day' * ${days}
    ORDER BY target_date DESC
    LIMIT 30
  `;
  return {
    recommendations: result.rows.map(r => ({
      rec_id: r.rec_id,
      target_date: r.target_date,
      outlet: r.outlet,
      time_window: r.time_window,
      current_staff: Number(r.current_staff ?? 0),
      recommended_staff: Number(r.recommended_staff ?? 0),
      demand_forecast: Number(r.demand_forecast ?? 0),
      revenue_at_risk: Number(r.revenue_at_risk ?? 0),
      confidence: Number(r.confidence ?? 0.5),
      rationale: r.rationale,
      status: r.status,
      actual_outcome: r.actual_outcome,
    })),
    count: result.rows.length,
  };
}

async function updateStaffingRecommendationTool({ club_id, target_date, outlet, time_window, current_staff, recommended_staff, demand_forecast, revenue_at_risk, confidence, rationale }) {
  const result = await sql`
    INSERT INTO staffing_recommendations (
      club_id, target_date, outlet, time_window,
      current_staff, recommended_staff, demand_forecast,
      revenue_at_risk, confidence, rationale, status
    ) VALUES (
      ${club_id}, ${target_date}, ${outlet}, ${time_window},
      ${current_staff || null}, ${recommended_staff}, ${demand_forecast || null},
      ${revenue_at_risk || null}, ${confidence || 0.5}, ${rationale}, 'pending'
    )
    RETURNING rec_id
  `;
  return { rec_id: result.rows[0].rec_id, saved: true };
}

// --- Phase 5: Chief of Staff tool handlers ---

async function getAllPendingActions({ club_id }) {
  const result = await sql`
    SELECT action_id, club_id, agent_id, action_type, priority, source,
      description, impact_metric, member_id, status, timestamp,
      contributing_agents, coordination_log_id
    FROM agent_actions
    WHERE club_id = ${club_id} AND status = 'pending'
    ORDER BY
      CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END ASC,
      timestamp DESC
  `;
  return {
    actions: result.rows.map(r => ({
      action_id: r.action_id,
      agent_id: r.agent_id,
      action_type: r.action_type,
      priority: r.priority,
      source: r.source,
      description: r.description,
      impact_metric: r.impact_metric,
      member_id: r.member_id,
      timestamp: r.timestamp,
      contributing_agents: r.contributing_agents,
    })),
    count: result.rows.length,
  };
}

async function mergeActionsTool({ club_id, action_ids, merged_description, merged_priority, merged_impact }) {
  const contributingAgents = [];
  for (const id of action_ids) {
    const r = await sql`SELECT agent_id FROM agent_actions WHERE action_id = ${id}`;
    if (r.rows.length > 0) contributingAgents.push(r.rows[0].agent_id);
  }
  const uniqueAgents = [...new Set(contributingAgents)];

  const mergedId = `act_cos_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await sql`
    INSERT INTO agent_actions (action_id, club_id, agent_id, action_type, priority, source, description, impact_metric, status, timestamp, contributing_agents)
    VALUES (${mergedId}, ${club_id}, 'chief-of-staff', 'alert_staff', ${merged_priority}, 'chief-of-staff', ${merged_description}, ${merged_impact || null}, 'pending', NOW(), ${uniqueAgents})
  `;

  for (const id of action_ids) {
    await sql`
      UPDATE agent_actions
      SET status = 'dismissed', dismissal_reason = 'merged', dismissed_at = NOW()
      WHERE action_id = ${id}
    `;
  }

  return { merged_action_id: mergedId, contributing_agents: uniqueAgents, dismissed: action_ids };
}

async function resolveConflictTool({ action_id_winner, action_id_loser, rationale }) {
  await sql`
    UPDATE agent_actions
    SET status = 'dismissed', dismissal_reason = ${`conflict_resolved: ${rationale}`}, dismissed_at = NOW()
    WHERE action_id = ${action_id_loser}
  `;
  return { winner: action_id_winner, loser: action_id_loser, rationale, resolved: true };
}

async function getAgentConfidenceScores({ club_id }) {
  const result = await sql`
    SELECT agent_id,
      AVG(confidence) AS avg_confidence,
      COUNT(*) AS total_actions
    FROM agent_activity
    WHERE club_id = ${club_id}
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

async function saveCoordinationLogTool({ club_id, log_date, agents_contributing, actions_input, actions_output, conflicts_detected, conflicts_resolved, conflict_details }) {
  const result = await sql`
    INSERT INTO coordination_logs (club_id, log_date, agents_contributing, actions_input, actions_output, conflicts_detected, conflicts_resolved, conflict_details)
    VALUES (${club_id}, ${log_date}, ${agents_contributing}, ${actions_input}, ${actions_output}, ${conflicts_detected || 0}, ${conflicts_resolved || 0}, ${JSON.stringify(conflict_details || [])})
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

// --- Phase 7: Member Concierge tool handlers ---

async function bookTeeTime({ club_id, course_id, member_id, booking_date, tee_time, player_count, guest_names }) {
  const players = player_count || 1;

  // Check if slot is already taken
  const check = await sql`
    SELECT COUNT(*)::int AS cnt FROM bookings
    WHERE booking_date = ${booking_date} AND tee_time = ${tee_time}
      AND course_id = ${course_id} AND club_id = ${club_id}
      AND status = 'confirmed'
  `;
  if (Number(check.rows[0]?.cnt) > 0) {
    return { error: 'slot_taken', message: `The ${tee_time} slot on ${booking_date} is already booked.` };
  }

  const bookingId = `bkg_c_${Date.now()}`;
  await sql`
    INSERT INTO bookings (booking_id, club_id, course_id, booking_date, tee_time, player_count, status)
    VALUES (${bookingId}, ${club_id}, ${course_id}, ${booking_date}, ${tee_time}, ${players}, 'confirmed')
  `;

  // Insert the member as player 1
  const playerId = `bp_c_${Date.now()}_1`;
  await sql`
    INSERT INTO booking_players (player_id, booking_id, member_id, is_guest, position_in_group)
    VALUES (${playerId}, ${bookingId}, ${member_id}, 0, 1)
  `;

  // Insert any guests
  const guests = guest_names || [];
  for (let i = 0; i < guests.length; i++) {
    const guestPlayerId = `bp_c_${Date.now()}_${i + 2}`;
    await sql`
      INSERT INTO booking_players (player_id, booking_id, guest_name, is_guest, position_in_group)
      VALUES (${guestPlayerId}, ${bookingId}, ${guests[i]}, 1, ${i + 2})
    `;
  }

  const result = { booking_id: bookingId, status: 'confirmed', date: booking_date, tee_time, player_count: players };

  // Phase 8: notify club-side agents via the bridge
  try {
    const bridge = await notifyClubAgents(club_id, member_id, {
      type: 'book_tee_time',
      details: { booking_date, tee_time, player_count: players, booking_id: bookingId },
    });
    result.bridge = { notified: true, notifications: bridge.notifications?.length ?? 0 };
  } catch (_) { /* bridge errors are non-blocking */ }

  return result;
}

async function makeDiningReservation({ club_id, outlet_id, member_id, reservation_date, reservation_time, party_size, special_requests }) {
  const size = party_size || 2;

  // Check outlet capacity
  const outletResult = await sql`
    SELECT name, weekday_covers, weekend_covers FROM dining_outlets
    WHERE outlet_id = ${outlet_id} AND club_id = ${club_id}
  `;
  if (outletResult.rows.length === 0) {
    return { error: 'outlet_not_found', message: `Dining outlet ${outlet_id} not found.` };
  }

  const outlet = outletResult.rows[0];
  const dayOfWeek = new Date(reservation_date).getDay();
  const maxCovers = (dayOfWeek === 0 || dayOfWeek === 6) ? outlet.weekend_covers : outlet.weekday_covers;

  // Count existing covers for this date
  const coverCheck = await sql`
    SELECT COALESCE(SUM(
      CASE WHEN subtotal = 0 AND status = 'reserved' THEN 1 ELSE 0 END
    ), 0)::int AS reserved_covers
    FROM pos_checks
    WHERE outlet_id = ${outlet_id} AND opened_at::date = ${reservation_date}::date
  `;
  const currentCovers = Number(coverCheck.rows[0]?.reserved_covers ?? 0);
  if (currentCovers + size > maxCovers) {
    return { error: 'no_availability', message: `${outlet.name} is fully booked on ${reservation_date}.` };
  }

  const checkId = `chk_c_${Date.now()}`;
  await sql`
    INSERT INTO pos_checks (check_id, outlet_id, member_id, opened_at, subtotal, total, status)
    VALUES (${checkId}, ${outlet_id}, ${member_id}, ${reservation_date + 'T' + reservation_time}, 0, 0, 'reserved')
  `;

  const result = {
    reservation_id: checkId,
    outlet: outlet.name,
    date: reservation_date,
    time: reservation_time,
    party_size: size,
    special_requests: special_requests || null,
    status: 'reserved',
  };

  // Phase 8: notify club-side agents via the bridge
  try {
    const bridge = await notifyClubAgents(club_id, member_id, {
      type: 'make_dining_reservation',
      details: { reservation_date, reservation_time, party_size: size, reservation_id: checkId },
    });
    result.bridge = { notified: true, notifications: bridge.notifications?.length ?? 0 };
  } catch (_) { /* bridge errors are non-blocking */ }

  return result;
}

async function rsvpEvent({ club_id, event_id, member_id, guest_count }) {
  const guests = guest_count || 0;

  // Check event exists and has capacity
  const eventResult = await sql`
    SELECT name, event_date, capacity, registration_fee FROM event_definitions
    WHERE event_id = ${event_id} AND club_id = ${club_id}
  `;
  if (eventResult.rows.length === 0) {
    return { error: 'event_not_found', message: `Event ${event_id} not found.` };
  }

  const evt = eventResult.rows[0];

  // Check current registration count
  const regCount = await sql`
    SELECT COUNT(*)::int AS cnt FROM event_registrations
    WHERE event_id = ${event_id} AND status = 'registered'
  `;
  const currentRegs = Number(regCount.rows[0]?.cnt ?? 0);
  if (currentRegs + 1 + guests > evt.capacity) {
    return { error: 'event_full', message: `${evt.name} is at capacity.` };
  }

  // Check if already registered
  const existing = await sql`
    SELECT registration_id FROM event_registrations
    WHERE event_id = ${event_id} AND member_id = ${member_id} AND status = 'registered'
  `;
  if (existing.rows.length > 0) {
    return { error: 'already_registered', message: `You are already registered for ${evt.name}.` };
  }

  const regId = `reg_c_${Date.now()}`;
  await sql`
    INSERT INTO event_registrations (registration_id, event_id, member_id, status, guest_count, fee_paid, registered_at)
    VALUES (${regId}, ${event_id}, ${member_id}, 'registered', ${guests}, ${Number(evt.registration_fee)}, NOW()::text)
  `;

  const result = {
    registration_id: regId,
    event_name: evt.name,
    event_date: evt.event_date,
    guest_count: guests,
    fee: Number(evt.registration_fee),
    status: 'registered',
  };

  // Phase 8: notify club-side agents via the bridge
  try {
    const bridge = await notifyClubAgents(club_id, member_id, {
      type: 'rsvp_event',
      details: { event_id, event_date: evt.event_date, guest_count: guests, registration_id: regId },
    });
    result.bridge = { notified: true, notifications: bridge.notifications?.length ?? 0 };
  } catch (_) { /* bridge errors are non-blocking */ }

  return result;
}

async function cancelTeeTime({ club_id, member_id, booking_date, tee_time }) {
  // Find the booking
  const result = await sql`
    SELECT b.booking_id, b.tee_time, b.player_count, b.status
    FROM bookings b
    JOIN booking_players bp ON bp.booking_id = b.booking_id
    WHERE bp.member_id = ${member_id} AND b.club_id = ${club_id}
      AND b.booking_date = ${booking_date}::date AND b.status = 'confirmed'
    ORDER BY b.tee_time
    LIMIT 1
  `;
  if (result.rows.length === 0) {
    return { error: 'not_found', message: `No confirmed tee time found on ${booking_date}.` };
  }
  const booking = result.rows[0];
  await sql`UPDATE bookings SET status = 'cancelled' WHERE booking_id = ${booking.booking_id}`;

  const cancelResult = {
    booking_id: booking.booking_id,
    booking_date,
    tee_time: booking.tee_time,
    status: 'cancelled',
  };

  // Notify club-side agents
  try {
    await notifyClubAgents(club_id, member_id, {
      type: 'cancel_booking',
      details: { booking_id: booking.booking_id, booking_date, tee_time: booking.tee_time },
    });
  } catch (_) { /* non-blocking */ }

  return cancelResult;
}

async function fileComplaint({ club_id, member_id, category, description }) {
  const feedbackId = `fb_${Date.now()}`;
  await sql`
    INSERT INTO feedback (feedback_id, club_id, member_id, category, sentiment_score, status, submitted_at)
    VALUES (${feedbackId}, ${club_id}, ${member_id}, ${category}, 2, 'open', NOW())
  `;

  // Notify club-side agents (service-recovery)
  try {
    await notifyClubAgents(club_id, member_id, {
      type: 'complaint',
      details: { feedback_id: feedbackId, category, description },
    });
  } catch (_) { /* non-blocking */ }

  return {
    complaint_id: feedbackId,
    category,
    status: 'filed',
  };
}

async function getMySchedule({ member_id, club_id }) {
  const bookingsResult = await sql`
    SELECT b.booking_id, b.booking_date, b.tee_time, b.player_count, b.status, c.name AS course_name
    FROM bookings b
    JOIN booking_players bp ON bp.booking_id = b.booking_id
    LEFT JOIN courses c ON c.course_id = b.course_id
    WHERE bp.member_id = ${member_id} AND b.club_id = ${club_id}
      AND b.booking_date >= CURRENT_DATE AND b.status = 'confirmed'
    ORDER BY b.booking_date, b.tee_time
  `;

  const eventsResult = await sql`
    SELECT er.registration_id, er.status, er.guest_count, ed.name AS event_name, ed.event_date, ed.type
    FROM event_registrations er
    JOIN event_definitions ed ON ed.event_id = er.event_id
    WHERE er.member_id = ${member_id} AND ed.club_id = ${club_id}
      AND er.status = 'registered' AND ed.event_date >= CURRENT_DATE::text
    ORDER BY ed.event_date
  `;

  return {
    tee_times: bookingsResult.rows.map(r => ({
      booking_id: r.booking_id,
      date: r.booking_date,
      tee_time: r.tee_time,
      course: r.course_name,
      players: Number(r.player_count),
    })),
    events: eventsResult.rows.map(r => ({
      registration_id: r.registration_id,
      event_name: r.event_name,
      date: r.event_date,
      type: r.type,
      guests: Number(r.guest_count),
    })),
  };
}

async function getClubCalendar({ club_id, limit }) {
  const maxEvents = limit || 10;
  const eventsResult = await sql`
    SELECT event_id, name, type, event_date, capacity, registration_fee, description
    FROM event_definitions
    WHERE club_id = ${club_id} AND event_date >= CURRENT_DATE::text
    ORDER BY event_date
    LIMIT ${maxEvents}
  `;

  const weatherResult = await sql`
    SELECT date, condition, temp_high, temp_low, wind_mph
    FROM weather_daily
    WHERE club_id = ${club_id} AND date >= CURRENT_DATE::text
    ORDER BY date
    LIMIT 7
  `;

  return {
    events: eventsResult.rows.map(r => ({
      event_id: r.event_id,
      name: r.name,
      type: r.type,
      date: r.event_date,
      capacity: Number(r.capacity),
      fee: Number(r.registration_fee),
      description: r.description,
    })),
    weather: weatherResult.rows.map(r => ({
      date: r.date,
      condition: r.condition,
      high: Number(r.temp_high),
      low: Number(r.temp_low),
      wind: Number(r.wind_mph),
    })),
  };
}

async function sendRequestToClub({ club_id, member_id, request_type, description }) {
  const result = await sql`
    INSERT INTO member_requests (club_id, member_id, request_type, description, source)
    VALUES (${club_id}, ${member_id}, ${request_type}, ${description}, 'concierge')
    RETURNING request_id
  `;
  return { request_id: result.rows[0].request_id, status: 'pending', message: 'Your request has been sent to the club staff.' };
}

async function getMyProfile({ member_id, club_id }) {
  const memberResult = await sql`
    SELECT member_id::text AS member_id, first_name, last_name, email, phone,
      membership_type, join_date, membership_status, household_id, archetype,
      preferred_channel, annual_dues
    FROM members
    WHERE member_id = ${member_id} AND club_id = ${club_id}
  `;
  if (memberResult.rows.length === 0) {
    return { error: `Member ${member_id} not found` };
  }

  const m = memberResult.rows[0];

  // Get household members
  const householdResult = m.household_id ? await sql`
    SELECT member_id::text AS member_id, first_name, last_name, membership_type
    FROM members
    WHERE household_id = ${m.household_id} AND club_id = ${club_id} AND member_id != ${member_id}
  ` : { rows: [] };

  // Get preferences from concierge session
  const sessionResult = await sql`
    SELECT preferences_cache FROM member_concierge_sessions
    WHERE member_id = ${member_id} AND club_id = ${club_id}
  `;

  return {
    member_id: m.member_id,
    name: `${m.first_name} ${m.last_name}`.trim(),
    email: m.email,
    phone: m.phone,
    membership_type: m.membership_type,
    join_date: m.join_date,
    status: m.membership_status,
    preferred_channel: m.preferred_channel,
    household: householdResult.rows.map(h => ({
      member_id: h.member_id,
      name: `${h.first_name} ${h.last_name}`.trim(),
      membership_type: h.membership_type,
    })),
    preferences: sessionResult.rows[0]?.preferences_cache || null,
  };
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
  // Phase 3
  get_tee_sheet_summary: getTeeSheetSummary,
  get_weather_forecast: getWeatherForecast,
  get_staffing_schedule: getStaffingSchedule,
  get_fb_reservations: getFbReservations,
  get_daily_game_plan_history: getDailyGamePlanHistory,
  save_game_plan: saveGamePlanTool,
  // Phase 4
  get_staffing_vs_demand: getStaffingVsDemand,
  get_historical_staffing_outcomes: getHistoricalStaffingOutcomes,
  update_staffing_recommendation: updateStaffingRecommendationTool,
  // Phase 5
  get_all_pending_actions: getAllPendingActions,
  merge_actions: mergeActionsTool,
  resolve_conflict: resolveConflictTool,
  get_agent_confidence_scores: getAgentConfidenceScores,
  save_coordination_log: saveCoordinationLogTool,
  // Phase 7 — Member Concierge
  book_tee_time: bookTeeTime,
  cancel_tee_time: cancelTeeTime,
  make_dining_reservation: makeDiningReservation,
  rsvp_event: rsvpEvent,
  file_complaint: fileComplaint,
  get_my_schedule: getMySchedule,
  get_club_calendar: getClubCalendar,
  send_request_to_club: sendRequestToClub,
  get_my_profile: getMyProfile,
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
