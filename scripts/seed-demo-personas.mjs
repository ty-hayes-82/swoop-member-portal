/**
 * scripts/seed-demo-personas.mjs
 *
 * Seeds realistic session history for all GBTC demo personas.
 * Run after reset-and-seed to populate durable memory before the demo.
 *
 * Personas:
 *   Sarah Mitchell  — GM. Morning briefings, preference patterns, past decisions.
 *   James Whitfield — Member. Learned preferences, past booking cycles, complaint history.
 *   Maya Chen       — F&B Director. Prior recommendations received and confirmed.
 *   Head Pro        — Past pace-of-play recommendations.
 *   Service Recovery analyst — Past outcome tracking.
 *
 * Usage:
 *   POSTGRES_URL="..." node scripts/seed-demo-personas.mjs
 *
 * Or call POST /api/demo/reset-and-seed which invokes this logic inline.
 */

import { createPool } from '@vercel/postgres';

const DEMO_CLUB_ID = 'seed_pinetree';

const SESSIONS = {
  james:      'mbr_mbr_t01_concierge',
  sarah_gm:   'gm_usr_sarah_gm_concierge',
  maya:       'staff_usr_maya_fb_director',
  headpro:    'staff_usr_headpro_head_pro',
  robert:     'mbr_mbr_t05_concierge',
  sr:         `service_recovery_${DEMO_CLUB_ID}`,
  revenue:    `revenue_analyst_${DEMO_CLUB_ID}`,
  membership: 'staff_usr_membership_dir_membership_director',
};

const USERS = {
  sarah_id:       'usr_sarah_gm',
  maya_id:        'usr_maya_fb',
  headpro_id:     'usr_headpro',
  membership_id:  'usr_membership_dir',
};

// ---------------------------------------------------------------------------
// Helper — days ago as ISO string
// ---------------------------------------------------------------------------
function daysAgo(n, hourOffset = 8) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hourOffset, 0, 0, 0);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const pool = createPool({ connectionString: process.env.POSTGRES_URL });

  console.log('[seed-demo-personas] Starting...');

  // ---- 1. Ensure demo users exist ----------------------------------------
  await pool.query(`
    INSERT INTO users (user_id, club_id, email, name, role, title, active)
    VALUES
      ('${USERS.sarah_id}',       '${DEMO_CLUB_ID}', 'sarah.mitchell@pinetree.demo',   'Sarah Mitchell',   'gm',                   'General Manager',           TRUE),
      ('${USERS.maya_id}',        '${DEMO_CLUB_ID}', 'maya.chen@pinetree.demo',         'Maya Chen',        'fb_director',          'F&B Director',              TRUE),
      ('${USERS.headpro_id}',     '${DEMO_CLUB_ID}', 'head.pro@pinetree.demo',          'Alex Torres',      'head_pro',             'Head Golf Professional',    TRUE),
      ('${USERS.membership_id}',  '${DEMO_CLUB_ID}', 'membership@pinetree.demo',        'Diane Park',       'membership_director',  'Membership Director',       TRUE)
    ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, active = TRUE
  `);
  console.log('[seed-demo-personas] Demo users upserted.');

  // ---- 2. Ensure agent sessions exist ------------------------------------
  const sessionRows = [
    [SESSIONS.james,      'identity', 'mbr_t01',         DEMO_CLUB_ID],
    [SESSIONS.sarah_gm,   'identity', USERS.sarah_id,    DEMO_CLUB_ID],
    [SESSIONS.maya,       'identity', USERS.maya_id,     DEMO_CLUB_ID],
    [SESSIONS.headpro,    'identity', USERS.headpro_id,  DEMO_CLUB_ID],
    [SESSIONS.robert,     'identity', 'mbr_t05',         DEMO_CLUB_ID],
    [SESSIONS.sr,         'analyst',  'service_recovery', DEMO_CLUB_ID],
    [SESSIONS.revenue,    'analyst',  'revenue_analyst',  DEMO_CLUB_ID],
    [SESSIONS.membership, 'identity', USERS.membership_id, DEMO_CLUB_ID],
  ];

  for (const [sessionId, sessionType, ownerId, clubId] of sessionRows) {
    await pool.query(`
      INSERT INTO agent_sessions (session_id, session_type, owner_id, club_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (session_id) DO UPDATE SET last_active = NOW()
    `, [sessionId, sessionType, ownerId, clubId]);
  }
  console.log('[seed-demo-personas] Agent sessions created.');

  // ---- 3. Clear existing demo session events (clean state) ---------------
  const sessionIdList = sessionRows.map(r => r[0]);
  await pool.query(`
    DELETE FROM agent_session_events WHERE session_id = ANY($1)
  `, [sessionIdList]);
  console.log('[seed-demo-personas] Cleared old demo events.');

  // ---- 4. Seed James Whitfield's member session (Move 3 — memory compound)
  const jamesEvents = [
    // Preferences observed over years of membership
    [SESSIONS.james, 'preference_observed', 'member_concierge', {
      field: 'course_routing', value: 'Back nine first (holes 10-18)', confidence: 0.91,
      evidence: '4 confirmed requests over 6 months', member_id: 'mbr_t01',
    }, daysAgo(180, 9)],

    [SESSIONS.james, 'preference_observed', 'member_concierge', {
      field: 'dining_preference', value: 'Booth 12, Grill Room. Club sandwich + Arnold Palmer.', confidence: 0.95,
      evidence: 'Observed on 8 of last 10 Grill visits', member_id: 'mbr_t01',
    }, daysAgo(120, 10)],

    [SESSIONS.james, 'preference_observed', 'member_concierge', {
      field: 'household_wine', value: "Margaret prefers Sonoma Pinot Noir — Flowers or Failla", confidence: 0.88,
      evidence: 'Confirmed by James on booking call March 2025', member_id: 'mbr_t01',
    }, daysAgo(90, 11)],

    [SESSIONS.james, 'preference_observed', 'member_concierge', {
      field: 'dietary_restriction', value: 'Shellfish allergy (James). Noted on member record.', confidence: 1.0,
      evidence: 'Medical note on file, confirmed by member', member_id: 'mbr_t01',
    }, daysAgo(60, 8)],

    [SESSIONS.james, 'preference_observed', 'member_concierge', {
      field: 'recovery_preference', value: 'Prefers direct comps over written apologies. Appreciates calls from GM.', confidence: 0.85,
      evidence: 'Pattern from 2 prior service recovery interactions', member_id: 'mbr_t01',
    }, daysAgo(45, 14)],

    [SESSIONS.james, 'preference_observed', 'member_concierge', {
      field: 'son_jake', value: "Jake Whitfield, handicap 14, plays Saturdays with James when home from college", confidence: 0.90,
      evidence: '5 joint bookings observed', member_id: 'mbr_t01',
    }, daysAgo(30, 9)],

    [SESSIONS.james, 'preference_observed', 'member_concierge', {
      field: 'tee_time_window', value: 'Thursday and Friday, 7:00-8:30 AM. Saturday 7:00 AM shotgun preferred.', confidence: 0.93,
      evidence: '18 of last 24 bookings in this window', member_id: 'mbr_t01',
    }, daysAgo(20, 10)],

    [SESSIONS.james, 'preference_observed', 'member_concierge', {
      field: 'preferred_channel', value: 'Phone call for tee time bookings. SMS for reminders.', confidence: 0.87,
      evidence: 'Self-reported on member profile + behavioral confirmation', member_id: 'mbr_t01',
    }, daysAgo(10, 11)],

    // Past booking cycle — shows the full handoff loop working
    [SESSIONS.james, 'request_submitted', 'member_concierge', {
      request_type: 'tee_time', request_id: 'req_tt_demo_001',
      description: 'Thursday 7:15 AM, North Course, foursome with usual group',
      routed_to: 'Head Pro', member_id: 'mbr_t01',
    }, daysAgo(14, 8)],

    [SESSIONS.james, 'staff_confirmed', 'head_pro_agent', {
      request_id: 'req_tt_demo_001', text: 'Confirmed — Thursday 7:16 AM, North Course, tee block reserved for your group.',
      confirmed_by: USERS.headpro_id, member_id: 'mbr_t01',
    }, daysAgo(13, 9)],
  ];

  for (const [sessionId, eventType, sourceAgent, payload, createdAt] of jamesEvents) {
    await pool.query(`
      INSERT INTO agent_session_events (session_id, event_type, payload, source_agent, created_at)
      VALUES ($1, $2, $3::jsonb, $4, $5)
    `, [sessionId, eventType, JSON.stringify({ type: eventType, ...payload }), sourceAgent, createdAt]);
  }
  console.log('[seed-demo-personas] James Whitfield session seeded (8 preferences + booking cycle).');

  // ---- 5. Seed Sarah Mitchell's GM session (Move 1 — morning briefing)
  const sarahEvents = [
    [SESSIONS.sarah_gm, 'preference_observed', 'gm_session', {
      field: 'escalation_preference', value: 'SMS for morning escalations, email for reports. No calls before 8 AM.',
      confidence: 0.92, source: 'behavior_pattern', evidence_count: 12,
    }, daysAgo(60, 7)],

    [SESSIONS.sarah_gm, 'preference_observed', 'gm_session', {
      field: 'auto_approve_threshold', value: 'Dining comps under $150 — auto-approve. Over $150 requires review.',
      confidence: 0.95, source: 'explicit_threshold_set', evidence_count: 1,
    }, daysAgo(45, 9)],

    [SESSIONS.sarah_gm, 'recommendation_received', 'service_recovery', {
      summary: 'Linda Leonard — 90-day no-show. Recommend personal outreach before renewal.',
      member_id: 'mbr_t07', action_taken: 'dismissed', dismissed_at: daysAgo(30, 10),
    }, daysAgo(30, 8)],

    [SESSIONS.sarah_gm, 'recommendation_received', 'revenue_analyst', {
      summary: 'Saturday afternoon slots 40% below benchmark. Weekend twilight pricing experiment recommended.',
      action_taken: 'approved', approved_at: daysAgo(20, 9),
    }, daysAgo(21, 7)],

    [SESSIONS.sarah_gm, 'agent_response', 'gm_briefing', {
      text: 'Morning briefing delivered. 3 at-risk members reviewed. Revenue Analyst flag approved. Service Recovery case for Sandra Chen resolved overnight.',
      briefing_date: daysAgo(3, 7).split('T')[0],
    }, daysAgo(3, 7)],
  ];

  for (const [sessionId, eventType, sourceAgent, payload, createdAt] of sarahEvents) {
    await pool.query(`
      INSERT INTO agent_session_events (session_id, event_type, payload, source_agent, created_at)
      VALUES ($1, $2, $3::jsonb, $4, $5)
    `, [sessionId, eventType, JSON.stringify({ type: eventType, ...payload }), sourceAgent, createdAt]);
  }
  console.log('[seed-demo-personas] Sarah Mitchell GM session seeded.');

  // ---- 6. Seed Maya Chen's F&B Director session (shows prior confirmation pattern)
  const mayaEvents = [
    [SESSIONS.maya, 'recommendation_received', 'service_recovery', {
      summary: 'Anne Jordan — post-event comp recommended for cold appetizers during last Thursday wine dinner.',
      member_id: 'mbr_t04', draft_response: "Anne — I heard your table had a rough start Thursday. We'd like to comp your next dinner visit as a thank-you for your patience.",
    }, daysAgo(21, 9)],

    [SESSIONS.maya, 'staff_confirmed', 'maya_chen', {
      request_id: 'req_comp_demo_001', text: 'Comp applied to Anne Jordan account. $85 credit.',
      confirmed_by: USERS.maya_id,
    }, daysAgo(20, 11)],

    [SESSIONS.maya, 'recommendation_received', 'revenue_analyst', {
      summary: 'Sunday brunch showing 28% no-show rate. Recommend confirmation SMS 24h before reservation.',
      action_required: 'Approve SMS confirmation workflow for Sunday brunch',
    }, daysAgo(7, 8)],
  ];

  for (const [sessionId, eventType, sourceAgent, payload, createdAt] of mayaEvents) {
    await pool.query(`
      INSERT INTO agent_session_events (session_id, event_type, payload, source_agent, created_at)
      VALUES ($1, $2, $3::jsonb, $4, $5)
    `, [sessionId, eventType, JSON.stringify({ type: eventType, ...payload }), sourceAgent, createdAt]);
  }
  console.log('[seed-demo-personas] Maya Chen F&B session seeded.');

  // ---- 7. Seed Head Pro session
  const headProEvents = [
    [SESSIONS.headpro, 'recommendation_received', 'member_pulse', {
      summary: 'Saturday pace-of-play averaging 5h12m on North Course. Three groups flagged for ranger intervention.',
      recommendation_type: 'operations', action_required: 'Deploy ranger pairing policy for 5+ groups',
    }, daysAgo(14, 7)],

    [SESSIONS.headpro, 'staff_confirmed', 'alex_torres', {
      request_id: 'req_pace_demo_001', text: 'Ranger deployment policy updated for Saturdays. Will monitor this weekend.',
      confirmed_by: USERS.headpro_id,
    }, daysAgo(12, 10)],
  ];

  for (const [sessionId, eventType, sourceAgent, payload, createdAt] of headProEvents) {
    await pool.query(`
      INSERT INTO agent_session_events (session_id, event_type, payload, source_agent, created_at)
      VALUES ($1, $2, $3::jsonb, $4, $5)
    `, [sessionId, eventType, JSON.stringify({ type: eventType, ...payload }), sourceAgent, createdAt]);
  }
  console.log('[seed-demo-personas] Head Pro session seeded.');

  // ---- 8. Seed Service Recovery analyst — outcome history
  const srEvents = [
    [SESSIONS.sr, 'outcome_tracked', 'service_recovery', {
      description: 'Sandra Chen complaint resolved — GM called within 24h, member retained. Health score improved from 31 to 36.',
      member_id: 'mbr_t06', outcome: 'retained', intervention_lag_hours: 18,
    }, daysAgo(30, 15)],

    [SESSIONS.sr, 'outcome_tracked', 'service_recovery', {
      description: 'Anne Jordan wine dinner comp delivered. Member rebooked for May wine pairing event.',
      member_id: 'mbr_t04', outcome: 'retained', intervention_lag_hours: 22,
    }, daysAgo(19, 14)],

    [SESSIONS.sr, 'outcome_tracked', 'service_recovery', {
      description: 'Marcus Jordan pace-of-play complaint — Head Pro contacted within 4h, Saturday policy updated.',
      member_id: 'mbr_t04b', outcome: 'resolved', intervention_lag_hours: 4,
    }, daysAgo(12, 13)],
  ];

  for (const [sessionId, eventType, sourceAgent, payload, createdAt] of srEvents) {
    await pool.query(`
      INSERT INTO agent_session_events (session_id, event_type, payload, source_agent, created_at)
      VALUES ($1, $2, $3::jsonb, $4, $5)
    `, [sessionId, eventType, JSON.stringify({ type: eventType, ...payload }), sourceAgent, createdAt]);
  }
  console.log('[seed-demo-personas] Service Recovery analyst session seeded.');

  await pool.end();
  console.log('[seed-demo-personas] Done. All demo personas seeded.');
}

main().catch(err => {
  console.error('[seed-demo-personas] Fatal error:', err);
  process.exit(1);
});
