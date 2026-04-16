/**
 * POST /api/demo/trigger-scenario
 *
 * GBTC demo controller: fires pre-scripted scenarios through the real
 * agent session event log and handoff infrastructure. Each trigger writes
 * authentic events to agent_session_events and agent_handoffs, so the
 * frontend receives real data from the real event stream.
 *
 * Scenarios:
 *   complaint_filed     — James Whitfield files Grill complaint → Service Recovery activates → routes to Maya
 *   engagement_decay    — Member Pulse detects James declining → escalates to GM Sarah
 *   pricing_rec         — Revenue Analyst flags Tuesday twilight → routes to GM
 *   preference_learned  — Preference observed from James's behavior (back nine, booth 12)
 *   recovery_confirmed  — Maya confirms service recovery completed
 *   member_at_risk      — Member Pulse high-risk escalation with $32K LTV context
 *
 * Body: { scenario, club_id? }
 * Auth: demo endpoints only (NODE_ENV !== 'production' || ALLOW_DEMO_ENDPOINTS)
 */

import { getOrCreateAgentSession, emitAgentEvent, createHandoff } from '../agents/session-core.js';
import { getAnthropicClient } from '../agents/managed-config.js';

const FALLBACK_DRAFT = "Maya — James Whitfield flagged the Grill service today. He's been a member for over a decade. Please reach out directly and let's comp the visit. I'll follow up with him this week. Sarah";

const DEMO_CLUB_ID = 'seed_pinetree';

// Session IDs for the Pinetree demo
const SESSIONS = {
  james: 'mbr_t01_concierge',
  sarah_gm: 'gm_sarah_mitchell_concierge',
  maya_fb: 'staff_maya_chen_fb_director',
  head_pro: 'staff_head_pro_pinetree',
  service_recovery: 'service_recovery_seed_pinetree',
  member_pulse: 'member_pulse_seed_pinetree',
  revenue_analyst: 'revenue_analyst_seed_pinetree',
};

async function ensureSessions(clubId) {
  await Promise.all([
    getOrCreateAgentSession(SESSIONS.james, 'identity', 'mbr_t01', clubId),
    getOrCreateAgentSession(SESSIONS.sarah_gm, 'identity', 'gm_sarah_mitchell', clubId),
    getOrCreateAgentSession(SESSIONS.maya_fb, 'identity', 'staff_maya_chen', clubId),
    getOrCreateAgentSession(SESSIONS.head_pro, 'identity', 'staff_head_pro', clubId),
    getOrCreateAgentSession(SESSIONS.service_recovery, 'analyst', 'service_recovery', clubId),
    getOrCreateAgentSession(SESSIONS.member_pulse, 'analyst', 'member_pulse', clubId),
    getOrCreateAgentSession(SESSIONS.revenue_analyst, 'analyst', 'revenue_analyst', clubId),
  ]);
}

// ---------------------------------------------------------------------------
// Scenario definitions
// ---------------------------------------------------------------------------

async function generateGmDraft() {
  try {
    const client = getAnthropicClient();
    const draftPromise = client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      temperature: 0.3,
      system: "You are Sarah Mitchell, GM of Pinetree Country Club. Write a brief 1-2 sentence message to Maya Chen (F&B Director) about a member complaint. Warm, direct tone. No em-dashes. No bullet points. No preamble — just the message itself.",
      messages: [{ role: 'user', content: "James Whitfield, a member since 2015 paying $18K annually (health score 42, declining), filed a critical complaint about a 47-minute Grill wait with no server check-in. This is his second complaint. Draft your message to Maya." }],
    });
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
    const result = await Promise.race([draftPromise, timeout]);
    const text = result.content?.find(c => c.type === 'text')?.text?.trim() || '';
    return text || FALLBACK_DRAFT;
  } catch (_) {
    return FALLBACK_DRAFT;
  }
}

async function scenario_complaint_filed(clubId) {
  const correlationId = `demo_complaint_${Date.now().toString(36)}`;
  const events = [];

  // 1. James files complaint via concierge
  await emitAgentEvent(SESSIONS.james, clubId, {
    type: 'user_message',
    source_agent: 'member_concierge',
    correlation_id: correlationId,
    member_id: 'mbr_t01',
    member_name: 'James Whitfield',
    text: 'The service at the Grill today was unacceptable. We waited 47 minutes and nobody checked on us once.',
    channel: 'concierge_chat',
  });
  events.push({ session: 'James Whitfield', type: 'complaint_filed', label: 'James files Grill complaint' });

  // 2. Concierge logs the complaint event
  await emitAgentEvent(SESSIONS.james, clubId, {
    type: 'request_submitted',
    source_agent: 'member_concierge',
    correlation_id: correlationId,
    request_type: 'complaint',
    department: 'F&B',
    severity: 'high',
    description: '47-minute wait at Grill Room, Jan 16. No server check-ins. Member visibly frustrated.',
    member_id: 'mbr_t01',
    prior_complaint: true,
    health_score: 42,
  });

  // 3. Service Recovery agent picks up the signal
  await emitAgentEvent(SESSIONS.service_recovery, clubId, {
    type: 'recommendation_received',
    source_agent: 'service_recovery_analyst',
    correlation_id: correlationId,
    priority: 'high',
    member_id: 'mbr_t01',
    member_name: 'James Whitfield',
    signal: 'complaint_filed',
    context: {
      complaint_text: '47-minute Grill wait, no check-ins',
      prior_complaints: 1,
      health_score: 42,
      health_trend: 'declining',
      rounds_this_month: 1,
      ltv_at_risk: 32000,
    },
    recommendation: 'Immediate personal outreach from F&B Director. Comp current visit. Schedule follow-up check-in.',
  });
  events.push({ session: 'Service Recovery', type: 'recommendation_received', label: 'Service Recovery activates' });

  // 4. Service Recovery drafts escalation and routes to Maya (F&B Director).
  // Generate the draft in Sarah's voice live via Claude API (4-second timeout + fallback).
  const [draftedResponse, handoffId] = await Promise.all([
    generateGmDraft(),
    createHandoff({
      sourceSessionId: SESSIONS.service_recovery,
      targetSessionId: SESSIONS.maya_fb,
      correlationId,
    }),
  ]);

  await emitAgentEvent(SESSIONS.maya_fb, clubId, {
    type: 'recommendation_received',
    source_agent: 'service_recovery_analyst',
    correlation_id: correlationId,
    handoff_id: handoffId,
    priority: 'urgent',
    member_id: 'mbr_t01',
    member_name: 'James Whitfield',
    ltv_at_risk: 32000,
    context_summary: 'James Whitfield (health 42, declining) filed 2nd complaint — 47-min Grill wait. Prior complaint Jan 8 unresolved. $32K LTV at risk.',
    drafted_response: draftedResponse,
    action_items: [
      'Comp today\'s Grill visit',
      'Personal call from Maya within 2 hours',
      'Flag for GM morning briefing',
    ],
  });
  events.push({ session: 'Maya Chen (F&B Director)', type: 'recommendation_received', label: 'Routed to Maya with draft' });

  // 5. Also write to GM session for morning briefing context
  await emitAgentEvent(SESSIONS.sarah_gm, clubId, {
    type: 'recommendation_received',
    source_agent: 'service_recovery_analyst',
    correlation_id: correlationId,
    priority: 'medium',
    summary: 'Service Recovery: James Whitfield filed 2nd complaint. Maya notified, handling.',
    member_id: 'mbr_t01',
    handoff_id: handoffId,
  });

  return { scenario: 'complaint_filed', correlation_id: correlationId, events_written: events, draft_generated: draftedResponse !== FALLBACK_DRAFT };
}

async function scenario_engagement_decay(clubId) {
  const correlationId = `demo_decay_${Date.now().toString(36)}`;
  const events = [];

  // Member Pulse detects decay pattern
  await emitAgentEvent(SESSIONS.member_pulse, clubId, {
    type: 'recommendation_received',
    source_agent: 'member_pulse_analyst',
    correlation_id: correlationId,
    priority: 'high',
    member_id: 'mbr_t01',
    member_name: 'James Whitfield',
    decay_signals: {
      rounds: 'Oct: 4 → Nov: 3 → Dec: 2 → Jan: 1',
      dining: 'Dining spend down 68% month-over-month',
      email: 'Newsletter opens down from 71% → 28%',
      events: 'Declined last 2 member events',
    },
    resignation_probability: 0.71,
    ltv_at_risk: 32000,
    recommendation: 'Personal reactivation outreach from GM. Reference back nine preference. Offer preferred tee time reservation.',
  });
  events.push({ session: 'Member Pulse', type: 'decay_detected', label: 'Member Pulse detects James declining' });

  // Routes to Sarah GM
  const handoffId = await createHandoff({
    sourceSessionId: SESSIONS.member_pulse,
    targetSessionId: SESSIONS.sarah_gm,
    correlationId,
  });

  await emitAgentEvent(SESSIONS.sarah_gm, clubId, {
    type: 'recommendation_received',
    source_agent: 'member_pulse_analyst',
    correlation_id: correlationId,
    handoff_id: handoffId,
    priority: 'high',
    member_id: 'mbr_t01',
    member_name: 'James Whitfield',
    ltv_at_risk: 32000,
    resignation_probability: 0.71,
    context_summary: 'James Whitfield — 6-year member, $18K dues — showing 4-domain decay pattern. 71% resignation probability. Prefers back nine, Thu/Fri mornings.',
    suggested_action: 'Reserve James his preferred Thu 7:30 AM back nine slot proactively. Call him personally. Reference his caddie preference (Eddie).',
  });
  events.push({ session: 'Sarah Mitchell (GM)', type: 'recommendation_received', label: 'Escalated to GM Sarah' });

  return { scenario: 'engagement_decay', correlation_id: correlationId, events_written: events };
}

async function scenario_pricing_rec(clubId) {
  const correlationId = `demo_pricing_${Date.now().toString(36)}`;
  const events = [];

  await emitAgentEvent(SESSIONS.revenue_analyst, clubId, {
    type: 'recommendation_received',
    source_agent: 'revenue_analyst',
    correlation_id: correlationId,
    priority: 'medium',
    opportunity: 'Tuesday twilight underpriced vs. demand',
    signal: 'Tuesdays 4–7 PM booking at 91% fill rate at current $42 rate. Comparable courses at $58–$65.',
    revenue_impact: '$2,340/month additional revenue at $58 rate (same fill rate assumption)',
    recommendation: 'Pilot $55 Tuesday twilight for 4 weeks. Revert if fill rate drops below 75%.',
  });
  events.push({ session: 'Revenue Analyst', type: 'pricing_opportunity', label: 'Revenue Analyst flags Tuesday twilight' });

  const handoffId = await createHandoff({
    sourceSessionId: SESSIONS.revenue_analyst,
    targetSessionId: SESSIONS.sarah_gm,
    correlationId,
  });

  await emitAgentEvent(SESSIONS.sarah_gm, clubId, {
    type: 'recommendation_received',
    source_agent: 'revenue_analyst',
    correlation_id: correlationId,
    handoff_id: handoffId,
    priority: 'medium',
    summary: 'Revenue Analyst: Tuesday twilight at 91% fill — room to capture $2,340/mo by moving to $55.',
    action_required: 'Approve or adjust pricing pilot. No system changes until you confirm.',
  });
  events.push({ session: 'Sarah Mitchell (GM)', type: 'recommendation_received', label: 'Routed to GM for approval' });

  return { scenario: 'pricing_rec', correlation_id: correlationId, events_written: events };
}

async function scenario_preference_learned(clubId) {
  const events = [];

  await emitAgentEvent(SESSIONS.james, clubId, {
    type: 'preference_observed',
    source_agent: 'member_concierge',
    field: 'tee_window',
    value: 'Thursday/Friday 7:00–8:30 AM back nine start',
    confidence: 0.94,
    source: 'Booking pattern — 11 of last 14 rounds',
    observed_at: new Date().toISOString(),
  });
  events.push({ session: 'James Whitfield', type: 'preference_observed', label: 'Preference learned: back nine Thu/Fri mornings' });

  await emitAgentEvent(SESSIONS.james, clubId, {
    type: 'preference_observed',
    source_agent: 'member_concierge',
    field: 'dining_seating',
    value: 'Grill Room booth 12, window side',
    confidence: 0.88,
    source: 'Reservation pattern — requested or moved to booth 12 on 8 of 10 dining visits',
    observed_at: new Date().toISOString(),
  });
  events.push({ session: 'James Whitfield', type: 'preference_observed', label: 'Preference learned: booth 12, window side' });

  await emitAgentEvent(SESSIONS.james, clubId, {
    type: 'preference_observed',
    source_agent: 'member_concierge',
    field: 'dietary',
    value: 'Shellfish allergy — confirmed with server 3 separate visits',
    confidence: 1.0,
    source: 'Staff notes + server confirmations',
    observed_at: new Date().toISOString(),
  });
  events.push({ session: 'James Whitfield', type: 'preference_observed', label: 'Dietary flag: shellfish allergy (confirmed)' });

  return { scenario: 'preference_learned', events_written: events };
}

async function scenario_recovery_confirmed(clubId) {
  const correlationId = `demo_recovery_${Date.now().toString(36)}`;
  const events = [];

  await emitAgentEvent(SESSIONS.maya_fb, clubId, {
    type: 'staff_confirmed',
    source_agent: 'maya_fb_agent',
    correlation_id: correlationId,
    request_id: 'req_demo_complaint_recovery',
    confirmed_by: 'staff_maya_chen',
    actions_taken: [
      'Comped full lunch tab ($84)',
      'Personal call completed — James appreciated the call',
      'Reserved booth 12 for James + Erin this Saturday dinner',
    ],
    member_response: 'Positive — James said "I appreciate you calling personally."',
    member_id: 'mbr_t01',
  });
  events.push({ session: 'Maya Chen (F&B Director)', type: 'staff_confirmed', label: 'Maya confirms recovery done' });

  // Outcome tracked back to analyst
  await emitAgentEvent(SESSIONS.service_recovery, clubId, {
    type: 'outcome_tracked',
    source_agent: 'maya_fb_agent',
    correlation_id: correlationId,
    outcome: 'positive',
    member_id: 'mbr_t01',
    recovery_actions: 'Comp + personal call + Saturday reservation',
    member_response: 'Positive',
    ltv_protected: 32000,
  });
  events.push({ session: 'Service Recovery', type: 'outcome_tracked', label: 'Loop closed — $32K LTV protected' });

  // Update James's session
  await emitAgentEvent(SESSIONS.james, clubId, {
    type: 'staff_confirmed',
    source_agent: 'maya_fb_agent',
    correlation_id: correlationId,
    recovery_completed: true,
    message_sent: "James, it's Maya at Pinetree. I just heard about your experience today — that's not the standard we hold ourselves to. I've taken care of today's tab and I'd love to reserve booth 12 for you and Erin this Saturday. Does 7 PM work?",
  });

  return { scenario: 'recovery_confirmed', correlation_id: correlationId, events_written: events };
}

async function scenario_member_at_risk(clubId) {
  const correlationId = `demo_atrisk_${Date.now().toString(36)}`;
  const events = [];

  await emitAgentEvent(SESSIONS.member_pulse, clubId, {
    type: 'recommendation_received',
    source_agent: 'member_pulse_analyst',
    correlation_id: correlationId,
    priority: 'critical',
    member_id: 'mbr_t01',
    member_name: 'James Whitfield',
    resignation_probability: 0.84,
    ltv_at_risk: 32000,
    tenure_years: 6,
    trigger: 'Unresolved complaint + engagement decay + 9 days silence',
    context: {
      last_visit: '9 days ago',
      open_complaint: 'Grill Room slow service — still unresolved',
      rounds: '1 this month vs. 4 average',
      dining: '$0 this month',
      historical_ltv: '$54K over 6 years',
    },
    urgency: 'Act within 48 hours. Past 7-day window shows 2.4x higher resignation rate.',
  });
  events.push({ session: 'Member Pulse', type: 'critical_escalation', label: 'CRITICAL: 84% resignation risk' });

  const handoffId = await createHandoff({
    sourceSessionId: SESSIONS.member_pulse,
    targetSessionId: SESSIONS.sarah_gm,
    correlationId,
  });

  await emitAgentEvent(SESSIONS.sarah_gm, clubId, {
    type: 'recommendation_received',
    source_agent: 'member_pulse_analyst',
    correlation_id: correlationId,
    handoff_id: handoffId,
    priority: 'critical',
    member_id: 'mbr_t01',
    member_name: 'James Whitfield',
    ltv_at_risk: 32000,
    context_summary: 'CRITICAL: James Whitfield at 84% resignation risk. $32K LTV. 9 days since last visit. Open Grill complaint. This is a 48-hour window.',
    suggested_action: 'Personal call from you today. Reference back nine. Offer Thursday tee time + booth 12 dinner.',
  });
  events.push({ session: 'Sarah Mitchell (GM)', type: 'critical_escalation', label: 'GM alerted: 48-hour window' });

  return { scenario: 'member_at_risk', correlation_id: correlationId, events_written: events };
}

// ---------------------------------------------------------------------------
// HTTP handler
// ---------------------------------------------------------------------------

const SCENARIO_HANDLERS = {
  complaint_filed: scenario_complaint_filed,
  engagement_decay: scenario_engagement_decay,
  pricing_rec: scenario_pricing_rec,
  preference_learned: scenario_preference_learned,
  recovery_confirmed: scenario_recovery_confirmed,
  member_at_risk: scenario_member_at_risk,
};

function isAuthorized(req) {
  const demoKey = req.headers['x-demo-key'];
  if (demoKey && process.env.DEMO_SECRET && demoKey === process.env.DEMO_SECRET) return true;
  if (req.auth?.role === 'swoop_admin') return true;
  // Allow unauthenticated in non-production when DEMO_SECRET is not set
  if (process.env.NODE_ENV !== 'production' && !process.env.DEMO_SECRET) return true;
  return false;
}

export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEMO_ENDPOINTS) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized — x-demo-key required' });
  }

  const { scenario, club_id } = req.body || {};
  const clubId = club_id || DEMO_CLUB_ID;

  if (!scenario) {
    return res.status(400).json({
      error: 'scenario required',
      available: Object.keys(SCENARIO_HANDLERS),
    });
  }

  const handler_fn = SCENARIO_HANDLERS[scenario];
  if (!handler_fn) {
    return res.status(400).json({
      error: `Unknown scenario: ${scenario}`,
      available: Object.keys(SCENARIO_HANDLERS),
    });
  }

  try {
    await ensureSessions(clubId);
    const result = await handler_fn(clubId);
    return res.status(200).json({ ok: true, club_id: clubId, ...result });
  } catch (err) {
    console.error('[trigger-scenario] error:', err);
    return res.status(500).json({ error: err.message });
  }
}
