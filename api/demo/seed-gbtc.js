/**
 * POST /api/demo/seed-gbtc
 *
 * Idempotent GBTC demo seed. Populates agent_session_events with 6+ weeks of
 * realistic history for the Pinetree demo personas:
 *   - Sarah Mitchell (GM) — morning briefing history, decision log, preferences
 *   - James Whitfield (member) — full concierge history with learned preferences
 *   - Maya Chen (F&B Director) — staff briefings, recovery actions
 *   - Analyst sessions — Revenue Analyst, Service Recovery, Member Pulse histories
 *
 * Idempotency: uses correlation_id 'gbtc_seed_v1' — running twice is safe,
 * the session rows will upsert and history events are additive.
 *
 * Body: { club_id? }
 * Returns: { ok, sessions_created, events_written }
 */

import { getOrCreateAgentSession, emitAgentEvent, createHandoff } from '../agents/session-core.js';

const DEMO_CLUB_ID = 'seed_pinetree';

const SESSIONS = {
  james: 'mbr_t01_concierge',
  sarah_gm: 'gm_sarah_mitchell_concierge',
  maya_fb: 'staff_maya_chen_fb_director',
  head_pro: 'staff_head_pro_pinetree',
  service_recovery: 'service_recovery_seed_pinetree',
  member_pulse: 'member_pulse_seed_pinetree',
  revenue_analyst: 'revenue_analyst_seed_pinetree',
};

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEMO_ENDPOINTS) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const clubId = req.body?.club_id || DEMO_CLUB_ID;
  let eventsWritten = 0;

  try {
    // Create all sessions
    await Promise.all([
      getOrCreateAgentSession(SESSIONS.james, 'identity', 'mbr_t01', clubId),
      getOrCreateAgentSession(SESSIONS.sarah_gm, 'identity', 'gm_sarah_mitchell', clubId),
      getOrCreateAgentSession(SESSIONS.maya_fb, 'identity', 'staff_maya_chen', clubId),
      getOrCreateAgentSession(SESSIONS.head_pro, 'identity', 'staff_head_pro', clubId),
      getOrCreateAgentSession(SESSIONS.service_recovery, 'analyst', 'service_recovery', clubId),
      getOrCreateAgentSession(SESSIONS.member_pulse, 'analyst', 'member_pulse', clubId),
      getOrCreateAgentSession(SESSIONS.revenue_analyst, 'analyst', 'revenue_analyst', clubId),
    ]);

    // -----------------------------------------------------------------------
    // JAMES WHITFIELD — 6 weeks of concierge history
    // -----------------------------------------------------------------------

    // Preferences learned from behavior (6–4 weeks ago)
    const jamesPrefs = [
      { field: 'tee_window', value: 'Thursday/Friday 7:00–8:30 AM back nine start', confidence: 0.94, source: 'Booking pattern — 11 of last 14 rounds' },
      { field: 'dining_seating', value: 'Grill Room booth 12, window side', confidence: 0.88, source: 'Reservation pattern — moved to booth 12 on 8 of 10 dining visits' },
      { field: 'dietary', value: 'Shellfish allergy (confirmed)', confidence: 1.0, source: 'Staff notes + server confirmations (3 visits)' },
      { field: 'caddie', value: 'Prefers Eddie Marsh on back nine rounds', confidence: 0.82, source: 'Caddie request pattern' },
      { field: 'beverage', value: 'Coffee refills during round, sparkling water at Grill', confidence: 0.79, source: 'Beverage cart and server notes' },
      { field: 'guest_pattern', value: 'Brings son Logan (junior) 2nd/4th Saturdays; wife Erin for wine dinners', confidence: 0.91, source: 'Guest registration + dining pattern' },
    ];
    for (const pref of jamesPrefs) {
      await emitAgentEvent(SESSIONS.james, clubId, {
        type: 'preference_observed',
        source_agent: 'member_concierge',
        correlation_id: 'gbtc_seed_v1',
        ...pref,
      });
      eventsWritten++;
    }

    // Booking history (weeks 5–3)
    const bookings = [
      { daysAgo_: 38, text: 'Book Thursday 7:15 AM back nine — me and Mike', type: 'tee_time' },
      { daysAgo_: 31, text: 'Reserve booth 12 for four on Saturday dinner, 7:30 PM', type: 'dining' },
      { daysAgo_: 24, text: 'Tee time Friday 8 AM, just me this week', type: 'tee_time' },
      { daysAgo_: 17, text: 'Book Logan for the junior clinic Saturday morning', type: 'event_rsvp' },
      { daysAgo_: 10, text: 'Can I get a table for Erin and me for the wine dinner Thursday?', type: 'dining' },
    ];
    for (const b of bookings) {
      await emitAgentEvent(SESSIONS.james, clubId, {
        type: 'user_message',
        source_agent: 'member_concierge',
        text: b.text,
        correlation_id: `gbtc_booking_${b.daysAgo_}`,
      });
      await emitAgentEvent(SESSIONS.james, clubId, {
        type: 'request_submitted',
        source_agent: 'member_concierge',
        request_type: b.type,
        correlation_id: `gbtc_booking_${b.daysAgo_}`,
        status: 'confirmed',
      });
      eventsWritten += 2;
    }

    // The complaint (9 days ago)
    const complaintCorr = 'gbtc_complaint_jan16';
    await emitAgentEvent(SESSIONS.james, clubId, {
      type: 'user_message',
      source_agent: 'member_concierge',
      correlation_id: complaintCorr,
      text: 'The service at the Grill today was unacceptable. We waited 47 minutes and nobody checked on us once.',
    });
    await emitAgentEvent(SESSIONS.james, clubId, {
      type: 'request_submitted',
      source_agent: 'member_concierge',
      correlation_id: complaintCorr,
      request_type: 'complaint',
      department: 'F&B',
      severity: 'high',
      description: '47-minute Grill Room wait, no server check-ins',
      status: 'pending',
    });
    eventsWritten += 2;

    // -----------------------------------------------------------------------
    // SARAH MITCHELL (GM) — decision history, briefings, preference learning
    // -----------------------------------------------------------------------

    // Morning briefing deliveries (last 5 days)
    for (let i = 5; i >= 1; i--) {
      await emitAgentEvent(SESSIONS.sarah_gm, clubId, {
        type: 'recommendation_received',
        source_agent: 'morning_briefing',
        correlation_id: `gbtc_briefing_day_${i}`,
        summary: `Morning briefing Day -${i}: ${i === 5 ? '3 at-risk members, Tuesday pricing opp, staffing gap Sat lunch' : i === 3 ? 'James Whitfield complaint unresolved, Revenue Analyst pricing rec pending' : 'Service recovery update: Maya handled Whitfield, $32K protected'}`,
        at_risk_count: i === 5 ? 3 : 2,
        pending_actions: i,
      });
      eventsWritten++;
    }

    // GM decisions (approvals + dismissals)
    const gmDecisions = [
      { type: 'approval', summary: 'Approved: Revenue Analyst pricing pilot — Tuesday twilight $55 for 4 weeks', daysAgo_: 15 },
      { type: 'approval', summary: 'Approved: Service recovery comp for James Whitfield via Maya', daysAgo_: 8 },
      { type: 'dismissal', summary: 'Dismissed: Labor optimizer suggestion to reduce cart staff Saturday (disagree with forecast)', daysAgo_: 12 },
      { type: 'preference_observed', summary: 'Sarah consistently approves service recovery comps < $100 without additional detail', daysAgo_: 10 },
      { type: 'preference_observed', summary: 'Sarah prefers 3-item briefing max — dismisses items 4+ in every briefing', daysAgo_: 5 },
    ];
    for (const d of gmDecisions) {
      await emitAgentEvent(SESSIONS.sarah_gm, clubId, {
        type: d.type,
        source_agent: 'gm_concierge',
        correlation_id: 'gbtc_seed_v1',
        summary: d.summary,
      });
      eventsWritten++;
    }

    // -----------------------------------------------------------------------
    // MAYA CHEN (F&B DIRECTOR) — briefings, recovery actions
    // -----------------------------------------------------------------------

    await emitAgentEvent(SESSIONS.maya_fb, clubId, {
      type: 'recommendation_received',
      source_agent: 'service_recovery_analyst',
      correlation_id: complaintCorr,
      priority: 'urgent',
      member_id: 'mbr_t01',
      member_name: 'James Whitfield',
      ltv_at_risk: 32000,
      context_summary: 'James Whitfield (health 42, declining) filed 2nd complaint — 47-min Grill wait. Prior complaint Jan 8 unresolved. $32K LTV at risk.',
      drafted_response: "James, it's Maya at Pinetree. I just heard about your experience today and I'm genuinely sorry — that's not the standard we hold ourselves to. I'd love to make it right. Could we arrange a complimentary dinner for you and Erin this week?",
    });
    eventsWritten++;

    // -----------------------------------------------------------------------
    // ANALYST SESSIONS — revenue, service recovery, member pulse histories
    // -----------------------------------------------------------------------

    // Revenue Analyst — 3 recommendations, 2 outcomes tracked
    const revRecs = [
      { summary: 'Tuesday twilight underpriced: 91% fill at $42, suggest $55 pilot', outcome: 'approved', daysAgo_: 18 },
      { summary: 'Saturday lunch under-staffed: 3.2 servers vs 5.1 demand forecast', outcome: 'routed_to_f&b', daysAgo_: 10 },
      { summary: 'Cart beverage revenue down 18% vs last year — menu refresh opportunity', outcome: 'pending', daysAgo_: 3 },
    ];
    for (const r of revRecs) {
      await emitAgentEvent(SESSIONS.revenue_analyst, clubId, {
        type: 'recommendation_received',
        source_agent: 'revenue_analyst',
        correlation_id: 'gbtc_seed_v1',
        summary: r.summary,
        outcome: r.outcome,
      });
      eventsWritten++;
    }

    // Service Recovery — pattern history
    const srHistory = [
      { member: 'Anne Jordan', issue: 'Slow pace of play complaint — walked off Jan 7', status: 'resolved', daysAgo_: 25 },
      { member: 'Robert Mills', issue: 'Two slow-play complaints ignored, dining decline', status: 'escalated_to_gm', daysAgo_: 14 },
      { member: 'James Whitfield', issue: '47-min Grill wait, second complaint', status: 'routed_to_maya', daysAgo_: 9 },
    ];
    for (const h of srHistory) {
      await emitAgentEvent(SESSIONS.service_recovery, clubId, {
        type: 'recommendation_received',
        source_agent: 'service_recovery_analyst',
        correlation_id: 'gbtc_seed_v1',
        member_name: h.member,
        issue: h.issue,
        status: h.status,
      });
      eventsWritten++;
    }

    // Member Pulse — at-risk tracking
    const mpHistory = [
      { member: 'James Whitfield', score: 42, trend: 'declining', risk: 0.71, ltv: 32000 },
      { member: 'Anne Jordan', score: 28, trend: 'declining', risk: 0.82, ltv: 28000 },
      { member: 'Robert Callahan', score: 22, trend: 'declining', risk: 0.66, ltv: 18000 },
    ];
    for (const m of mpHistory) {
      await emitAgentEvent(SESSIONS.member_pulse, clubId, {
        type: 'recommendation_received',
        source_agent: 'member_pulse_analyst',
        correlation_id: 'gbtc_seed_v1',
        member_name: m.member,
        health_score: m.score,
        trend: m.trend,
        resignation_probability: m.risk,
        ltv_at_risk: m.ltv,
      });
      eventsWritten++;
    }

    return res.status(200).json({
      ok: true,
      club_id: clubId,
      sessions_created: Object.keys(SESSIONS).length,
      events_written: eventsWritten,
      personas: ['Sarah Mitchell (GM)', 'James Whitfield (member)', 'Maya Chen (F&B)', 'Head Pro', 'Service Recovery', 'Member Pulse', 'Revenue Analyst'],
    });
  } catch (err) {
    console.error('[seed-gbtc] error:', err);
    return res.status(500).json({ error: err.message });
  }
}
