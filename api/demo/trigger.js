/**
 * POST /api/demo/trigger
 *
 * Demo controller endpoint. Fires scripted scenarios against the real agent
 * infrastructure using seeded Pinetree personas. Each scenario writes genuine
 * events to the session logs — no mocks, no fakes, just pre-populated state.
 *
 * Returns a correlation_id the frontend polls against /api/demo/event-feed to
 * watch the cascade animate across sessions in real time.
 *
 * Scenarios:
 *   complaint         — James Whitfield files a critical complaint about the Grill.
 *                       Routes to F&B Director + GM. Live Claude draft generated.
 *   cancellation      — Robert Callahan signals cancellation intent.
 *                       Routes to Membership Director + GM.
 *   pricing_flag      — Revenue Analyst flags Tuesday twilight underfill.
 *                       Routes to GM.
 *   preference_learned — James's back-nine preference confirmed after round.
 *                       Written to James's member session.
 *   milestone         — Margaret Whitfield 5-year anniversary detected.
 *                       Written to member concierge session.
 *
 * Auth: x-demo-key header (matches DEMO_SECRET env var) or swoop_admin role.
 */

import { sql } from '@vercel/postgres';
import { getAnthropicClient } from '../agents/managed-config.js';
import { emitAgentEvent, getOrCreateAgentSession, createHandoff } from '../agents/session-core.js';
import { evaluateComplaintTrigger } from '../agents/complaint-trigger.js';

// ---------------------------------------------------------------------------
// Demo persona constants — must match seed-demo-personas.mjs
// ---------------------------------------------------------------------------

const DEMO_CLUB_ID = 'seed_pinetree';

const SESSIONS = {
  james:    'mbr_mbr_t01_concierge',   // matches mbr_${member_id}_concierge in chat.js
  sarah_gm: 'gm_usr_sarah_gm_concierge',
  maya:     'staff_usr_maya_fb_director',
  headpro:  'staff_usr_headpro_head_pro',
  robert:   'mbr_mbr_t05_concierge',
  sr:       `service_recovery_${DEMO_CLUB_ID}`,
  revenue:  `revenue_analyst_${DEMO_CLUB_ID}`,
  membership: 'staff_usr_membership_dir_membership_director',
};

const USERS = {
  sarah_id: 'usr_sarah_gm',
  maya_id:  'usr_maya_fb',
  headpro_id: 'usr_headpro',
  membership_id: 'usr_membership_dir',
};

// Pre-cached fallback for the Claude draft (used if API call exceeds 4s or fails)
const FALLBACK_DRAFT = "Maya — James Whitfield flagged the Grill service today. He's been with us since 2015. Please reach out directly and let's comp the meal. I'll follow up with him this week. Sarah";

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

function isAuthorized(req) {
  const demoKey = req.headers['x-demo-key'];
  if (demoKey && process.env.DEMO_SECRET && demoKey === process.env.DEMO_SECRET) return true;
  if (req.auth?.role === 'swoop_admin') return true;
  // Allow in non-production when no DEMO_SECRET is configured (local dev)
  if (process.env.NODE_ENV !== 'production' && !process.env.DEMO_SECRET) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Scenario handlers
// ---------------------------------------------------------------------------

async function scenarioComplaint({ reset = false } = {}) {
  const memberId = 'mbr_t01';
  const correlationId = `corr_demo_complaint_${Date.now().toString(36)}`;

  // 1. Ensure all relevant sessions exist
  await Promise.all([
    getOrCreateAgentSession(SESSIONS.james, 'identity', memberId, DEMO_CLUB_ID),
    getOrCreateAgentSession(SESSIONS.sarah_gm, 'identity', USERS.sarah_id, DEMO_CLUB_ID),
    getOrCreateAgentSession(SESSIONS.maya, 'identity', USERS.maya_id, DEMO_CLUB_ID),
    getOrCreateAgentSession(SESSIONS.sr, 'analyst', 'service_recovery', DEMO_CLUB_ID),
  ]);

  // 2. Write complaint_filed event to James's member session
  await emitAgentEvent(SESSIONS.james, DEMO_CLUB_ID, {
    type: 'request_submitted',
    source_agent: 'member_concierge',
    correlation_id: correlationId,
    request_type: 'complaint',
    description: 'Waited 38 minutes for lunch at the Grill. Service was slow and no one checked on me.',
    priority: 'critical',
    routed_to: 'Service Recovery',
    member_id: memberId,
  });

  // 3. Evaluate trigger criteria (real check against DB)
  let evaluation;
  try {
    evaluation = await evaluateComplaintTrigger(memberId, DEMO_CLUB_ID, 'critical');
  } catch (_) {
    evaluation = { shouldTrigger: true, dues: 18000, healthScore: 42, repeatComplainant: true };
  }

  // 4. Write analyst finding to SR session
  const srSummary = `James Whitfield (${DEMO_CLUB_ID}) filed a critical complaint about Grill service. Member since 2015, $18K dues, health score 42. Prior complaint on file. Routing to F&B Director for immediate recovery action.`;
  await emitAgentEvent(SESSIONS.sr, DEMO_CLUB_ID, {
    type: 'recommendation_received',
    source_agent: 'service_recovery',
    correlation_id: correlationId,
    summary: srSummary,
    member_id: memberId,
    priority: 'critical',
    context: {
      annual_dues: evaluation.dues,
      health_score: evaluation.healthScore,
      repeat_complainant: evaluation.repeatComplainant,
    },
  });

  // 5. Generate live Claude draft in Sarah's voice (with 4-second timeout + fallback)
  let draftResponse = FALLBACK_DRAFT;
  try {
    const client = getAnthropicClient();
    const draftPromise = client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      temperature: 0.3,
      system: "You are Sarah Mitchell, GM of Pinetree Country Club. Write a brief 1-2 sentence message to Maya Chen (F&B Director) about a member complaint. Warm and direct tone. No em-dashes. No bullet points. No preamble — just the message.",
      messages: [{
        role: 'user',
        content: "James Whitfield, a member since 2015 paying $18K annually with a health score of 42, just filed a critical complaint about slow Grill service. Draft your message to Maya.",
      }],
    });
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
    const result = await Promise.race([draftPromise, timeout]);
    const text = result.content?.find(c => c.type === 'text')?.text || '';
    if (text.trim()) draftResponse = text.trim();
  } catch (_) {
    // Use fallback — non-fatal
  }

  // 6. Route recommendation to F&B Director (Maya) with draft
  await emitAgentEvent(SESSIONS.maya, DEMO_CLUB_ID, {
    type: 'recommendation_received',
    source_agent: 'service_recovery',
    correlation_id: correlationId,
    summary: srSummary,
    draft_response: draftResponse,
    member_id: memberId,
    priority: 'critical',
    action_required: 'Contact James Whitfield and authorize dining comp',
    confirm_endpoint: '/api/concierge/confirm-action',
  });

  await createHandoff({
    sourceSessionId: SESSIONS.sr,
    targetSessionId: SESSIONS.maya,
    recommendationEventId: correlationId,
  }).catch(() => {});

  // 7. Route alert to GM (Sarah)
  await emitAgentEvent(SESSIONS.sarah_gm, DEMO_CLUB_ID, {
    type: 'recommendation_received',
    source_agent: 'service_recovery',
    correlation_id: correlationId,
    summary: `Service Recovery: James Whitfield complaint routed to Maya Chen (F&B). Draft sent. Member health score: 42.`,
    member_id: memberId,
    routed_to: 'Maya Chen, F&B Director',
    draft_sent: true,
  });

  await createHandoff({
    sourceSessionId: SESSIONS.sr,
    targetSessionId: SESSIONS.sarah_gm,
    recommendationEventId: correlationId,
  }).catch(() => {});

  return {
    scenario: 'complaint',
    correlation_id: correlationId,
    sessions_updated: [SESSIONS.james, SESSIONS.sr, SESSIONS.maya, SESSIONS.sarah_gm],
    member: 'James Whitfield',
    routed_to: ['Maya Chen (F&B Director)', 'Sarah Mitchell (GM)'],
    draft_generated: draftResponse !== FALLBACK_DRAFT,
  };
}

async function scenarioCancellation() {
  const memberId = 'mbr_t05';
  const correlationId = `corr_demo_cancel_${Date.now().toString(36)}`;

  await Promise.all([
    getOrCreateAgentSession(SESSIONS.robert, 'identity', memberId, DEMO_CLUB_ID),
    getOrCreateAgentSession(SESSIONS.sarah_gm, 'identity', USERS.sarah_id, DEMO_CLUB_ID),
    getOrCreateAgentSession(SESSIONS.membership, 'identity', USERS.membership_id, DEMO_CLUB_ID),
    getOrCreateAgentSession(`member_pulse_${DEMO_CLUB_ID}`, 'analyst', 'member_pulse', DEMO_CLUB_ID),
  ]);

  const summary = `Robert Callahan (CORP, $18K) shows cancellation signals: 22 health score, 0 rounds in 90 days, billing complaint unresolved 9 days. Immediate outreach recommended before next billing cycle.`;

  await emitAgentEvent(`member_pulse_${DEMO_CLUB_ID}`, DEMO_CLUB_ID, {
    type: 'recommendation_received',
    source_agent: 'member_pulse',
    correlation_id: correlationId,
    summary,
    member_id: memberId,
    risk_tier: 'critical',
  });

  await emitAgentEvent(SESSIONS.membership, DEMO_CLUB_ID, {
    type: 'recommendation_received',
    source_agent: 'member_pulse',
    correlation_id: correlationId,
    summary,
    member_id: memberId,
    action_required: 'Outreach to Robert Callahan before April 22 billing cycle',
    draft_response: "Robert — wanted to personally reach out. I know we have an unresolved billing issue and I want to make it right. Can we find 15 minutes this week? Sarah",
  });

  await emitAgentEvent(SESSIONS.sarah_gm, DEMO_CLUB_ID, {
    type: 'recommendation_received',
    source_agent: 'member_pulse',
    correlation_id: correlationId,
    summary: `At-risk alert: Robert Callahan cancellation risk HIGH. Membership Director notified. Billing complaint still open.`,
    member_id: memberId,
  });

  return {
    scenario: 'cancellation',
    correlation_id: correlationId,
    member: 'Robert Callahan',
    routed_to: ['Membership Director', 'Sarah Mitchell (GM)'],
  };
}

async function scenarioPricingFlag() {
  const correlationId = `corr_demo_pricing_${Date.now().toString(36)}`;

  await Promise.all([
    getOrCreateAgentSession(SESSIONS.sarah_gm, 'identity', USERS.sarah_id, DEMO_CLUB_ID),
    getOrCreateAgentSession(SESSIONS.revenue, 'analyst', 'revenue_analyst', DEMO_CLUB_ID),
  ]);

  const summary = `Tuesday twilight slots (3:30-5:00 PM) running at 34% utilization vs. 61% seasonal baseline. Recommend $15 rate reduction for next 3 Tuesdays. Projected capture: 8-12 additional rounds, $480-$720 incremental revenue.`;

  await emitAgentEvent(SESSIONS.revenue, DEMO_CLUB_ID, {
    type: 'recommendation_received',
    source_agent: 'revenue_analyst',
    correlation_id: correlationId,
    summary,
    recommendation_type: 'pricing',
    projected_revenue: 600,
    confidence: 0.82,
  });

  await emitAgentEvent(SESSIONS.sarah_gm, DEMO_CLUB_ID, {
    type: 'recommendation_received',
    source_agent: 'revenue_analyst',
    correlation_id: correlationId,
    summary,
    action_required: 'Approve or dismiss Tuesday twilight rate adjustment',
    auto_approve_eligible: false,
  });

  return {
    scenario: 'pricing_flag',
    correlation_id: correlationId,
    routed_to: ['Sarah Mitchell (GM)'],
  };
}

async function scenarioPreferenceLearned() {
  const memberId = 'mbr_t01';
  const correlationId = `corr_demo_pref_${Date.now().toString(36)}`;

  await getOrCreateAgentSession(SESSIONS.james, 'identity', memberId, DEMO_CLUB_ID);

  await emitAgentEvent(SESSIONS.james, DEMO_CLUB_ID, {
    type: 'preference_observed',
    source_agent: 'member_concierge',
    correlation_id: correlationId,
    field: 'course_preference',
    value: 'Back nine first (holes 10-18), then front nine if time allows',
    confidence: 0.91,
    evidence: '3 confirmed requests in last 60 days',
    member_id: memberId,
  });

  return {
    scenario: 'preference_learned',
    correlation_id: correlationId,
    preference: 'Back nine first',
    member: 'James Whitfield',
  };
}

async function scenarioMilestone() {
  const memberId = 'mbr_t01b'; // Erin Whitfield (household)
  const correlationId = `corr_demo_milestone_${Date.now().toString(36)}`;
  const session = `mbr_mbr_t01b_concierge`;

  await getOrCreateAgentSession(session, 'identity', memberId, DEMO_CLUB_ID);

  await emitAgentEvent(session, DEMO_CLUB_ID, {
    type: 'preference_observed',
    source_agent: 'engagement_autopilot',
    correlation_id: correlationId,
    field: 'milestone',
    value: '5-year membership anniversary — April 12, 2026',
    confidence: 1.0,
    suggested_action: 'Personalized note from GM + complimentary wine at next dining visit',
    member_id: memberId,
  });

  return {
    scenario: 'milestone',
    correlation_id: correlationId,
    member: 'Erin Whitfield',
    milestone: '5-year anniversary',
  };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

const SCENARIO_MAP = {
  complaint:          scenarioComplaint,
  cancellation:       scenarioCancellation,
  pricing_flag:       scenarioPricingFlag,
  preference_learned: scenarioPreferenceLearned,
  milestone:          scenarioMilestone,
};

export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEMO_ENDPOINTS) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { scenario } = req.body || {};
  if (!scenario) {
    return res.status(400).json({
      error: 'scenario required',
      available: Object.keys(SCENARIO_MAP),
    });
  }

  const fn = SCENARIO_MAP[scenario];
  if (!fn) {
    return res.status(400).json({
      error: `Unknown scenario: ${scenario}`,
      available: Object.keys(SCENARIO_MAP),
    });
  }

  try {
    const result = await fn();
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error(`[demo/trigger] scenario=${scenario} failed:`, err);
    return res.status(500).json({ error: err.message, scenario });
  }
}
