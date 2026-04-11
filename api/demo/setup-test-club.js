/**
 * Setup Test Club for Concierge
 * POST /api/demo/setup-test-club
 *
 * Creates a "Pinetree Country Club" (club_id = 'test_concierge') by copying
 * ALL seed data from seed_pinetree tables. Idempotent — safe to call repeatedly.
 * After copying, triggers health score computation so the concierge has
 * fully scored member data to query.
 */
import { sql } from '@vercel/postgres';
import { logError, logInfo } from '../lib/logger.js';

const SEED_CLUB = 'seed_pinetree';
const TARGET_CLUB = 'test_concierge';
const CLUB_NAME = 'Pinetree Country Club';

// ---------------------------------------------------------------------------
// Copy functions — reuse exact INSERT...SELECT patterns from guided-copy.js
// but hardcode target to test_concierge (no auth required).
// ---------------------------------------------------------------------------

async function copyClub(client) {
  // Ensure club record exists
  await client.query(`
    INSERT INTO club (club_id, name)
    VALUES ($1, $2)
    ON CONFLICT (club_id) DO NOTHING
  `, [TARGET_CLUB, CLUB_NAME]);

  // Copy profile fields from seed club
  await client.query(`
    UPDATE club SET
      city = s.city,
      state = s.state,
      zip = s.zip,
      founded_year = s.founded_year,
      member_count = s.member_count,
      course_count = s.course_count,
      outlet_count = s.outlet_count,
      brand_voice = s.brand_voice,
      timezone = s.timezone,
      latitude = s.latitude,
      longitude = s.longitude,
      updated_at = NOW()
    FROM club s
    WHERE club.club_id = $1 AND s.club_id = $2
  `, [TARGET_CLUB, SEED_CLUB]);

  const w = await client.query(`
    INSERT INTO weather_daily (
      weather_id, club_id, date, condition, temp_high, temp_low,
      wind_mph, precipitation_in, golf_demand_modifier, fb_demand_modifier
    )
    SELECT
      weather_id || '_' || $1, $1, date, condition, temp_high, temp_low,
      wind_mph, precipitation_in, golf_demand_modifier, fb_demand_modifier
    FROM weather_daily WHERE club_id = $2
    ON CONFLICT (weather_id) DO NOTHING
  `, [TARGET_CLUB, SEED_CLUB]);
  return { club: 1, weather_daily: w.rowCount };
}

async function copyMembers(client) {
  const copied = {};
  const clubId = TARGET_CLUB;

  const mt = await client.query(`
    INSERT INTO membership_types (type_code, club_id, name, annual_dues, fb_minimum, golf_eligible)
    SELECT type_code || '_' || $1, $1, name, annual_dues, fb_minimum, golf_eligible
    FROM membership_types WHERE club_id = $2
    ON CONFLICT (type_code) DO NOTHING
  `, [clubId, SEED_CLUB]);
  copied.membership_types = mt.rowCount;

  const hh = await client.query(`
    INSERT INTO households (household_id, club_id, primary_member_id, member_count, address, is_multi_member)
    SELECT household_id || '_' || $1, $1, primary_member_id || '_' || $1, member_count, address, is_multi_member
    FROM households WHERE club_id = $2
    ON CONFLICT (household_id) DO NOTHING
  `, [clubId, SEED_CLUB]);
  copied.households = hh.rowCount;

  const m = await client.query(`
    INSERT INTO members (
      member_id, member_number, club_id, external_id, first_name, last_name,
      email, phone, date_of_birth, gender, membership_type, membership_status,
      join_date, resigned_on, household_id, archetype, annual_dues, account_balance,
      ghin_number, communication_opt_in, health_score, health_tier, last_health_update,
      data_completeness, preferred_channel, data_source
    )
    SELECT
      member_id || '_' || $1, member_number, $1, external_id, first_name, last_name,
      email, phone, date_of_birth, gender, membership_type || '_' || $1, membership_status,
      join_date, resigned_on, household_id || '_' || $1, NULL, annual_dues, account_balance,
      ghin_number, communication_opt_in, NULL, NULL, NULL,
      0, preferred_channel, 'concierge_setup'
    FROM members WHERE club_id = $2
    ON CONFLICT (member_id) DO NOTHING
  `, [clubId, SEED_CLUB]);
  copied.members = m.rowCount;

  return copied;
}

async function copyTeeSheet(client) {
  const copied = {};
  const clubId = TARGET_CLUB;

  const c = await client.query(`
    INSERT INTO courses (course_id, club_id, name, holes, par, tee_interval_min, first_tee, last_tee)
    SELECT course_id || '_' || $1, $1, name, holes, par, tee_interval_min, first_tee, last_tee
    FROM courses WHERE club_id = $2
    ON CONFLICT (course_id) DO NOTHING
  `, [clubId, SEED_CLUB]);
  copied.courses = c.rowCount;

  const b = await client.query(`
    INSERT INTO bookings (
      booking_id, club_id, course_id, booking_date, tee_time, player_count,
      has_guest, transportation, has_caddie, round_type, status,
      check_in_time, round_start, round_end, duration_minutes
    )
    SELECT
      booking_id || '_' || $1, $1, course_id || '_' || $1, booking_date, tee_time, player_count,
      has_guest, transportation, has_caddie, round_type, status,
      check_in_time, round_start, round_end, duration_minutes
    FROM bookings WHERE club_id = $2
    ON CONFLICT (booking_id) DO NOTHING
  `, [clubId, SEED_CLUB]);
  copied.bookings = b.rowCount;

  const bp = await client.query(`
    INSERT INTO booking_players (
      player_id, booking_id, member_id, guest_name, is_guest, is_warm_lead, position_in_group
    )
    SELECT
      bp.player_id || '_' || $1,
      bp.booking_id || '_' || $1,
      CASE WHEN bp.member_id IS NOT NULL THEN bp.member_id || '_' || $1 ELSE NULL END,
      bp.guest_name, bp.is_guest, bp.is_warm_lead, bp.position_in_group
    FROM booking_players bp
    JOIN bookings bk ON bp.booking_id = bk.booking_id
    WHERE bk.club_id = $2
    ON CONFLICT (player_id) DO NOTHING
  `, [clubId, SEED_CLUB]);
  copied.booking_players = bp.rowCount;

  return copied;
}

async function copyFb(client) {
  const copied = {};
  const clubId = TARGET_CLUB;

  const d = await client.query(`
    INSERT INTO dining_outlets (outlet_id, club_id, name, type, meal_periods, weekday_covers, weekend_covers)
    SELECT outlet_id || '_' || $1, $1, name, type, meal_periods, weekday_covers, weekend_covers
    FROM dining_outlets WHERE club_id = $2
    ON CONFLICT (outlet_id) DO NOTHING
  `, [clubId, SEED_CLUB]);
  copied.dining_outlets = d.rowCount;

  const pc = await client.query(`
    INSERT INTO pos_checks (
      check_id, outlet_id, member_id, opened_at, closed_at,
      first_item_fired_at, last_item_fulfilled_at, subtotal, tax_amount,
      tip_amount, comp_amount, discount_amount, void_amount, total,
      payment_method, post_round_dining, linked_booking_id, event_id, is_understaffed_day
    )
    SELECT
      pc.check_id || '_' || $1,
      pc.outlet_id || '_' || $1,
      CASE WHEN pc.member_id IS NOT NULL THEN pc.member_id || '_' || $1 ELSE NULL END,
      pc.opened_at, pc.closed_at,
      pc.first_item_fired_at, pc.last_item_fulfilled_at, pc.subtotal, pc.tax_amount,
      pc.tip_amount, pc.comp_amount, pc.discount_amount, pc.void_amount, pc.total,
      pc.payment_method, pc.post_round_dining,
      CASE WHEN pc.linked_booking_id IS NOT NULL THEN pc.linked_booking_id || '_' || $1 ELSE NULL END,
      CASE WHEN pc.event_id IS NOT NULL THEN pc.event_id || '_' || $1 ELSE NULL END,
      pc.is_understaffed_day
    FROM pos_checks pc
    JOIN dining_outlets do2 ON pc.outlet_id = do2.outlet_id
    WHERE do2.club_id = $2
    ON CONFLICT (check_id) DO NOTHING
  `, [clubId, SEED_CLUB]);
  copied.pos_checks = pc.rowCount;

  const li = await client.query(`
    INSERT INTO pos_line_items (
      line_item_id, check_id, item_name, category, unit_price, quantity,
      line_total, is_comp, is_void, fired_at
    )
    SELECT
      li.line_item_id || '_' || $1,
      li.check_id || '_' || $1,
      li.item_name, li.category, li.unit_price, li.quantity,
      li.line_total, li.is_comp, li.is_void, li.fired_at
    FROM pos_line_items li
    JOIN pos_checks pc ON li.check_id = pc.check_id
    JOIN dining_outlets do2 ON pc.outlet_id = do2.outlet_id
    WHERE do2.club_id = $2
    ON CONFLICT (line_item_id) DO NOTHING
  `, [clubId, SEED_CLUB]);
  copied.pos_line_items = li.rowCount;

  const pp = await client.query(`
    INSERT INTO pos_payments (
      payment_id, check_id, payment_method, amount, processed_at, is_split
    )
    SELECT
      pp.payment_id || '_' || $1,
      pp.check_id || '_' || $1,
      pp.payment_method, pp.amount, pp.processed_at, pp.is_split
    FROM pos_payments pp
    JOIN pos_checks pc ON pp.check_id = pc.check_id
    JOIN dining_outlets do2 ON pc.outlet_id = do2.outlet_id
    WHERE do2.club_id = $2
    ON CONFLICT (payment_id) DO NOTHING
  `, [clubId, SEED_CLUB]);
  copied.pos_payments = pp.rowCount;

  const co = await client.query(`
    INSERT INTO close_outs (
      closeout_id, club_id, date, golf_revenue, fb_revenue, total_revenue,
      rounds_played, covers, weather, is_understaffed
    )
    SELECT
      closeout_id || '_' || $1, $1, date, golf_revenue, fb_revenue, total_revenue,
      rounds_played, covers, weather, is_understaffed
    FROM close_outs WHERE club_id = $2
    ON CONFLICT (closeout_id) DO NOTHING
  `, [clubId, SEED_CLUB]);
  copied.close_outs = co.rowCount;

  return copied;
}

async function copyComplaints(client) {
  const copied = {};
  const clubId = TARGET_CLUB;

  const fb = await client.query(`
    INSERT INTO feedback (
      feedback_id, member_id, club_id, submitted_at, category,
      sentiment_score, description, status, resolved_at, is_understaffed_day
    )
    SELECT
      feedback_id || '_' || $1,
      CASE WHEN member_id IS NOT NULL THEN member_id || '_' || $1 ELSE NULL END,
      $1, submitted_at, category,
      sentiment_score, description, status, resolved_at, is_understaffed_day
    FROM feedback WHERE club_id = $2
    ON CONFLICT (feedback_id) DO NOTHING
  `, [clubId, SEED_CLUB]);
  copied.feedback = fb.rowCount;

  const sr = await client.query(`
    INSERT INTO service_requests (
      request_id, club_id, member_id, booking_id, request_type,
      requested_at, response_time_min, resolved_at, resolution_notes, is_understaffed_day
    )
    SELECT
      request_id || '_' || $1, $1,
      CASE WHEN member_id IS NOT NULL THEN member_id || '_' || $1 ELSE NULL END,
      CASE WHEN booking_id IS NOT NULL THEN booking_id || '_' || $1 ELSE NULL END,
      request_type,
      requested_at, response_time_min, resolved_at, resolution_notes, is_understaffed_day
    FROM service_requests WHERE club_id = $2
    ON CONFLICT (request_id) DO NOTHING
  `, [clubId, SEED_CLUB]);
  copied.service_requests = sr.rowCount;

  return copied;
}

async function copyEmail(client) {
  const copied = {};
  const clubId = TARGET_CLUB;

  const ec = await client.query(`
    INSERT INTO email_campaigns (
      campaign_id, club_id, subject, type, send_date, recipient_count, html_content_url
    )
    SELECT
      campaign_id || '_' || $1, $1, subject, type, send_date, recipient_count, html_content_url
    FROM email_campaigns WHERE club_id = $2
    ON CONFLICT (campaign_id) DO NOTHING
  `, [clubId, SEED_CLUB]);
  copied.email_campaigns = ec.rowCount;

  const ee = await client.query(`
    INSERT INTO email_events (
      event_id, campaign_id, member_id, event_type, occurred_at, link_clicked, device_type
    )
    SELECT
      ee.event_id || '_' || $1,
      ee.campaign_id || '_' || $1,
      ee.member_id || '_' || $1,
      ee.event_type, ee.occurred_at, ee.link_clicked, ee.device_type
    FROM email_events ee
    JOIN email_campaigns ec ON ee.campaign_id = ec.campaign_id
    WHERE ec.club_id = $2
    ON CONFLICT (event_id) DO NOTHING
  `, [clubId, SEED_CLUB]);
  copied.email_events = ee.rowCount;

  const ed = await client.query(`
    INSERT INTO event_definitions (
      event_id, club_id, name, type, event_date, capacity, registration_fee, description
    )
    SELECT
      event_id || '_' || $1, $1, name, type, event_date, capacity, registration_fee, description
    FROM event_definitions WHERE club_id = $2
    ON CONFLICT (event_id) DO NOTHING
  `, [clubId, SEED_CLUB]);
  copied.event_definitions = ed.rowCount;

  const er = await client.query(`
    INSERT INTO event_registrations (
      registration_id, event_id, member_id, status, guest_count,
      fee_paid, registered_at, checked_in_at
    )
    SELECT
      er.registration_id || '_' || $1,
      er.event_id || '_' || $1,
      er.member_id || '_' || $1,
      er.status, er.guest_count, er.fee_paid, er.registered_at, er.checked_in_at
    FROM event_registrations er
    JOIN event_definitions ed ON er.event_id = ed.event_id
    WHERE ed.club_id = $2
    ON CONFLICT (registration_id) DO NOTHING
  `, [clubId, SEED_CLUB]);
  copied.event_registrations = er.rowCount;

  return copied;
}

async function copyStaffing(client) {
  const copied = {};
  const clubId = TARGET_CLUB;

  const s = await client.query(`
    INSERT INTO staff (
      staff_id, club_id, first_name, last_name, department, role,
      hire_date, hourly_rate, is_full_time
    )
    SELECT
      staff_id || '_' || $1, $1, first_name, last_name, department, role,
      hire_date, hourly_rate, is_full_time
    FROM staff WHERE club_id = $2
    ON CONFLICT (staff_id) DO NOTHING
  `, [clubId, SEED_CLUB]);
  copied.staff = s.rowCount;

  const ss = await client.query(`
    INSERT INTO staff_shifts (
      shift_id, club_id, staff_id, shift_date, outlet_id,
      start_time, end_time, hours_worked, is_understaffed_day, notes
    )
    SELECT
      ss.shift_id || '_' || $1, $1,
      ss.staff_id || '_' || $1,
      ss.shift_date,
      CASE WHEN ss.outlet_id IS NOT NULL THEN ss.outlet_id || '_' || $1 ELSE NULL END,
      ss.start_time, ss.end_time, ss.hours_worked, ss.is_understaffed_day, ss.notes
    FROM staff_shifts ss
    JOIN staff st ON ss.staff_id = st.staff_id
    WHERE st.club_id = $2
    ON CONFLICT (shift_id) DO NOTHING
  `, [clubId, SEED_CLUB]);
  copied.staff_shifts = ss.rowCount;

  return copied;
}

async function copyAgents(client) {
  const copied = {};
  const clubId = TARGET_CLUB;

  const ad = await client.query(`
    INSERT INTO agent_definitions (
      agent_id, club_id, name, description, status, model, avatar,
      source_systems, last_run
    )
    SELECT
      agent_id || '_' || $1, $1, name, description, status, model, avatar,
      source_systems, last_run
    FROM agent_definitions WHERE club_id = $2
    ON CONFLICT (agent_id) DO NOTHING
  `, [clubId, SEED_CLUB]);
  copied.agent_definitions = ad.rowCount;

  const aa = await client.query(`
    INSERT INTO agent_actions (
      action_id, club_id, agent_id, action_type, priority, source,
      description, impact_metric, member_id, status, approval_action,
      dismissal_reason, timestamp, approved_at, dismissed_at
    )
    SELECT
      aa.action_id || '_' || $1, $1,
      aa.agent_id || '_' || $1,
      aa.action_type, aa.priority, aa.source,
      aa.description, aa.impact_metric,
      CASE WHEN aa.member_id IS NOT NULL THEN aa.member_id || '_' || $1 ELSE NULL END,
      aa.status, aa.approval_action,
      aa.dismissal_reason, aa.timestamp, aa.approved_at, aa.dismissed_at
    FROM agent_actions aa
    JOIN agent_definitions ad ON aa.agent_id = ad.agent_id
    WHERE ad.club_id = $2
    ON CONFLICT (action_id) DO NOTHING
  `, [clubId, SEED_CLUB]);
  copied.agent_actions = aa.rowCount;

  return copied;
}

// ---------------------------------------------------------------------------
// Lightweight health score computation (inline, no auth dependency)
// Uses same logic as /api/compute-health-scores but scoped to test club.
// ---------------------------------------------------------------------------

async function computeHealthScores(client) {
  // Count members updated
  const result = await client.query(`
    WITH golf_scores AS (
      SELECT
        m.member_id,
        LEAST(100, COALESCE(COUNT(DISTINCT bp.booking_id), 0) * 4) AS golf_score
      FROM members m
      LEFT JOIN booking_players bp ON bp.member_id = m.member_id
      LEFT JOIN bookings b ON bp.booking_id = b.booking_id AND b.booking_date >= NOW() - INTERVAL '180 days'
      WHERE m.club_id = $1
      GROUP BY m.member_id
    ),
    dining_scores AS (
      SELECT
        m.member_id,
        LEAST(100, COALESCE(COUNT(DISTINCT pc.check_id), 0) * 5) AS dining_score
      FROM members m
      LEFT JOIN pos_checks pc ON pc.member_id = m.member_id AND pc.opened_at >= NOW() - INTERVAL '180 days'
      WHERE m.club_id = $1
      GROUP BY m.member_id
    ),
    email_scores AS (
      SELECT
        m.member_id,
        LEAST(100, COALESCE(COUNT(DISTINCT ee.event_id), 0) * 8) AS email_score
      FROM members m
      LEFT JOIN email_events ee ON ee.member_id = m.member_id AND ee.event_type IN ('open', 'click') AND ee.occurred_at >= NOW() - INTERVAL '180 days'
      WHERE m.club_id = $1
      GROUP BY m.member_id
    ),
    event_scores AS (
      SELECT
        m.member_id,
        LEAST(100, COALESCE(COUNT(DISTINCT er.registration_id), 0) * 15) AS event_score
      FROM members m
      LEFT JOIN event_registrations er ON er.member_id = m.member_id AND er.status IN ('confirmed', 'attended') AND er.registered_at >= NOW() - INTERVAL '180 days'
      WHERE m.club_id = $1
      GROUP BY m.member_id
    ),
    combined AS (
      SELECT
        g.member_id,
        ROUND(g.golf_score * 0.30 + d.dining_score * 0.25 + e.email_score * 0.25 + ev.event_score * 0.20) AS health_score,
        g.golf_score, d.dining_score, e.email_score, ev.event_score
      FROM golf_scores g
      JOIN dining_scores d ON g.member_id = d.member_id
      JOIN email_scores e ON g.member_id = e.member_id
      JOIN event_scores ev ON g.member_id = ev.member_id
    )
    UPDATE members m SET
      health_score = c.health_score,
      health_tier = CASE
        WHEN c.health_score >= 67 THEN 'Healthy'
        WHEN c.health_score >= 45 THEN 'Watch'
        WHEN c.health_score >= 25 THEN 'At Risk'
        ELSE 'Critical'
      END,
      last_health_update = NOW(),
      data_completeness = CASE
        WHEN (c.golf_score > 0)::int + (c.dining_score > 0)::int + (c.email_score > 0)::int + (c.event_score > 0)::int = 0 THEN 0
        ELSE ((c.golf_score > 0)::int + (c.dining_score > 0)::int + (c.email_score > 0)::int + (c.event_score > 0)::int) * 25
      END
    FROM combined c
    WHERE m.member_id = c.member_id AND m.club_id = $1
  `, [TARGET_CLUB]);

  return result.rowCount;
}

// ---------------------------------------------------------------------------
// Handler — no auth required (demo endpoint)
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const start = Date.now();

  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 0. Ensure member_concierge_sessions table exists (needed for chat persistence)
    await client.query(`
      CREATE TABLE IF NOT EXISTS member_concierge_sessions (
        session_id          TEXT PRIMARY KEY,
        club_id             TEXT NOT NULL,
        member_id           TEXT NOT NULL,
        last_active         TIMESTAMPTZ DEFAULT NOW(),
        preferences_cache   JSONB,
        conversation_summary TEXT,
        created_at          TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(club_id, member_id)
      )
    `);

    // 1. Club profile + weather
    const clubCopied = await copyClub(client);

    // 2. Members (must come before things that reference member_id)
    const membersCopied = await copyMembers(client);

    // 3. Tee sheet
    const teeSheetCopied = await copyTeeSheet(client);

    // 4. F&B
    const fbCopied = await copyFb(client);

    // 5. Complaints
    const complaintsCopied = await copyComplaints(client);

    // 6. Email + events
    const emailCopied = await copyEmail(client);

    // 7. Staffing
    const staffingCopied = await copyStaffing(client);

    // 8. Agents
    const agentsCopied = await copyAgents(client);

    // 9. Compute health scores
    const membersScored = await computeHealthScores(client);

    await client.query('COMMIT');

    const duration_ms = Date.now() - start;

    const summary = {
      ...clubCopied,
      ...membersCopied,
      ...teeSheetCopied,
      ...fbCopied,
      ...complaintsCopied,
      ...emailCopied,
      ...staffingCopied,
      ...agentsCopied,
    };

    logInfo('/api/demo/setup-test-club', 'Test club setup complete', {
      club_id: TARGET_CLUB,
      summary,
      members_scored: membersScored,
      duration_ms,
    });

    return res.status(200).json({
      success: true,
      club_id: TARGET_CLUB,
      club_name: CLUB_NAME,
      members_copied: membersCopied.members || 0,
      bookings_copied: teeSheetCopied.bookings || 0,
      checks_copied: fbCopied.pos_checks || 0,
      feedback_copied: complaintsCopied.feedback || 0,
      campaigns_copied: emailCopied.email_campaigns || 0,
      staff_copied: staffingCopied.staff || 0,
      agents_copied: agentsCopied.agent_definitions || 0,
      members_scored: membersScored,
      all_tables: summary,
      duration_ms,
    });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    logError('/api/demo/setup-test-club', e, { phase: 'setup' });
    return res.status(500).json({ error: `Failed to setup test club: ${e.message}` });
  } finally {
    client.release();
    pool.end().catch(() => {});
  }
}
