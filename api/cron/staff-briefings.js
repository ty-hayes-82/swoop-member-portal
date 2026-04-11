/**
 * Staff Briefings Cron
 * Schedule: 6 AM UTC daily (0 6 * * *)
 *
 * Generates 4 department-specific briefings per club:
 *   1. Starter / Pro Shop
 *   2. F&B / Dining
 *   3. GM (enhanced morning brief)
 *   4. Events / Membership
 *
 * Each briefing is stored in the staff_briefings table as structured JSON
 * with a natural-language summary.
 */
import { sql } from '@vercel/postgres';
import { logWarn, logInfo } from '../lib/logger.js';

const LOG_CTX = '/api/cron/staff-briefings';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function today() {
  return new Date().toISOString().split('T')[0];
}

/** Safe query wrapper — returns empty rows if table doesn't exist. */
async function safeQuery(queryFn) {
  try {
    const result = await queryFn();
    return result.rows || [];
  } catch {
    return [];
  }
}

function pct(n, d) {
  if (!d) return '0%';
  return `${Math.round((n / d) * 100)}%`;
}

// ---------------------------------------------------------------------------
// Ensure staff_briefings table exists
// ---------------------------------------------------------------------------

async function ensureTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS staff_briefings (
        id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        club_id         TEXT NOT NULL,
        department      TEXT NOT NULL,
        briefing_date   DATE NOT NULL,
        content         JSONB NOT NULL,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(club_id, department, briefing_date)
      )
    `;
  } catch {
    // Table may already exist — that's fine
  }
}

// ---------------------------------------------------------------------------
// 1. Starter / Pro Shop Briefing
// ---------------------------------------------------------------------------

async function buildStarterBriefing(clubId, dateStr) {
  // Today's tee times with player details
  const bookings = await safeQuery(() => sql`
    SELECT b.booking_id, b.tee_time, b.player_count, b.transportation,
           b.has_caddie, b.round_type, b.status, b.course_id,
           bp.member_id, bp.is_guest, bp.guest_name, bp.position_in_group,
           m.first_name, m.last_name, m.membership_type, m.health_score,
           m.health_tier, m.archetype
    FROM bookings b
    JOIN booking_players bp ON bp.booking_id = b.booking_id
    LEFT JOIN members m ON m.member_id = bp.member_id
    WHERE b.club_id = ${clubId}
      AND b.booking_date = ${dateStr}
      AND b.status != 'cancelled'
    ORDER BY b.tee_time, bp.position_in_group
  `);

  // Weather for pace impact
  const weather = await safeQuery(() => sql`
    SELECT conditions, high_temp, low_temp, wind_mph, precip_prob
    FROM weather_forecasts
    WHERE club_id = ${clubId} AND forecast_date = ${dateStr}::date
    LIMIT 1
  `);

  // Member preferences from concierge sessions
  const prefs = await safeQuery(() => sql`
    SELECT member_id, preferences_cache
    FROM member_concierge_sessions
    WHERE club_id = ${clubId}
      AND preferences_cache IS NOT NULL
  `);
  const prefMap = new Map(prefs.map(p => [p.member_id, p.preferences_cache]));

  // Group bookings by tee time
  const teeTimeMap = new Map();
  for (const row of bookings) {
    if (!teeTimeMap.has(row.booking_id)) {
      teeTimeMap.set(row.booking_id, {
        booking_id: row.booking_id,
        tee_time: row.tee_time,
        course_id: row.course_id,
        player_count: row.player_count,
        transportation: row.transportation,
        has_caddie: row.has_caddie,
        round_type: row.round_type,
        players: [],
      });
    }
    const group = teeTimeMap.get(row.booking_id);
    const memberPrefs = row.member_id ? prefMap.get(row.member_id) : null;
    group.players.push({
      member_id: row.member_id,
      name: row.is_guest ? (row.guest_name || 'Guest') : `${row.first_name} ${row.last_name}`.trim(),
      is_guest: !!row.is_guest,
      membership_type: row.membership_type,
      health_score: row.health_score,
      health_tier: row.health_tier,
      archetype: row.archetype,
      at_risk: row.health_score != null && row.health_score < 50,
      preferences: memberPrefs || null,
    });
  }

  const teeSheet = Array.from(teeTimeMap.values()).sort((a, b) => a.tee_time.localeCompare(b.tee_time));

  // Derive flags
  const atRiskMembers = [];
  const vipMembers = [];
  const cartPrep = [];

  for (const group of teeSheet) {
    for (const p of group.players) {
      if (p.is_guest) continue;
      if (p.at_risk) atRiskMembers.push({ name: p.name, health_score: p.health_score, tee_time: group.tee_time });
      if (p.membership_type === 'LEG' || p.membership_type === 'FG') {
        vipMembers.push({ name: p.name, membership_type: p.membership_type, tee_time: group.tee_time });
      }
      if (p.preferences) {
        cartPrep.push({ name: p.name, tee_time: group.tee_time, preferences: p.preferences });
      }
    }
  }

  const wx = weather[0] || null;
  const weatherNote = wx
    ? `${wx.conditions}, ${wx.high_temp}°F high, wind ${wx.wind_mph}mph, ${Math.round((wx.precip_prob || 0) * 100)}% precip`
    : 'No forecast available';
  const paceWarning = wx && (wx.wind_mph > 15 || wx.precip_prob > 0.4)
    ? 'Expect slower pace — advise groups accordingly.'
    : null;

  // Natural language summary
  const totalGroups = teeSheet.length;
  const totalPlayers = teeSheet.reduce((s, g) => s + g.players.length, 0);
  const lines = [
    `${totalGroups} tee times today with ${totalPlayers} players.`,
    atRiskMembers.length ? `${atRiskMembers.length} at-risk member(s) playing — extra attention recommended.` : null,
    vipMembers.length ? `VIP greetings needed: ${vipMembers.map(v => v.name).join(', ')}.` : null,
    cartPrep.length ? `${cartPrep.length} cart(s) need preference prep.` : null,
    `Weather: ${weatherNote}.`,
    paceWarning,
  ].filter(Boolean);

  return {
    department: 'starter_pro_shop',
    data: { tee_sheet: teeSheet, at_risk_members: atRiskMembers, vip_members: vipMembers, cart_prep: cartPrep, weather: wx, pace_warning: paceWarning },
    summary: lines.join(' '),
  };
}

// ---------------------------------------------------------------------------
// 2. F&B / Dining Briefing
// ---------------------------------------------------------------------------

async function buildFnbBriefing(clubId, dateStr) {
  // Count today's tee times to estimate post-round dining volume
  const bookingCount = await safeQuery(() => sql`
    SELECT COUNT(DISTINCT booking_id) AS total_bookings,
           SUM(player_count) AS total_players
    FROM bookings
    WHERE club_id = ${clubId} AND booking_date = ${dateStr} AND status != 'cancelled'
  `);

  // Historical post-round dining rate (last 30 days)
  const diningRate = await safeQuery(() => sql`
    SELECT COUNT(*) FILTER (WHERE post_round_dining = 1) AS diners,
           COUNT(*) AS total
    FROM pos_checks pc
    JOIN bookings b ON b.booking_id = pc.linked_booking_id
    WHERE b.club_id = ${clubId}
      AND b.booking_date >= (${dateStr}::date - INTERVAL '30 days')::text
      AND b.booking_date < ${dateStr}
  `);

  // Members with dining preferences who are playing today
  const diningPrefs = await safeQuery(() => sql`
    SELECT DISTINCT m.member_id, m.first_name, m.last_name, m.health_score,
           m.health_tier, mcs.preferences_cache
    FROM members m
    JOIN booking_players bp ON bp.member_id = m.member_id
    JOIN bookings b ON b.booking_id = bp.booking_id
    LEFT JOIN member_concierge_sessions mcs ON mcs.member_id = m.member_id AND mcs.club_id = m.club_id
    WHERE b.club_id = ${clubId}
      AND b.booking_date = ${dateStr}
      AND b.status != 'cancelled'
      AND mcs.preferences_cache IS NOT NULL
  `);

  // At-risk members dining (health_score < 50)
  const atRiskDiners = diningPrefs.filter(r => r.health_score != null && r.health_score < 50);

  // Today's events that involve dining
  const diningEvents = await safeQuery(() => sql`
    SELECT e.event_id, e.name, e.type, e.capacity,
           COUNT(er.registration_id) AS registered
    FROM event_definitions e
    LEFT JOIN event_registrations er ON er.event_id = e.event_id AND er.status != 'cancelled'
    WHERE e.club_id = ${clubId} AND e.event_date = ${dateStr}
      AND e.type IN ('dining', 'social')
    GROUP BY e.event_id, e.name, e.type, e.capacity
  `);

  const stats = bookingCount[0] || { total_bookings: 0, total_players: 0 };
  const rate = diningRate[0] || { diners: 0, total: 0 };
  const postRoundRate = rate.total > 0 ? Number(rate.diners) / Number(rate.total) : 0.35;
  const estimatedDiners = Math.round(Number(stats.total_players || 0) * postRoundRate);

  const lines = [
    `${stats.total_bookings} tee times today (${stats.total_players} players).`,
    `Estimated post-round diners: ~${estimatedDiners} (${pct(rate.diners, rate.total)} historical rate).`,
    atRiskDiners.length ? `${atRiskDiners.length} at-risk member(s) expected — assign experienced servers.` : null,
    diningPrefs.length ? `${diningPrefs.length} player(s) with known preferences on file.` : null,
    diningEvents.length ? `Dining events today: ${diningEvents.map(e => `${e.name} (${e.registered}/${e.capacity})`).join(', ')}.` : null,
  ].filter(Boolean);

  return {
    department: 'fnb_dining',
    data: {
      tee_sheet_volume: { bookings: Number(stats.total_bookings), players: Number(stats.total_players) },
      estimated_post_round_diners: estimatedDiners,
      historical_dining_rate: Math.round(postRoundRate * 100),
      member_preferences: diningPrefs.map(r => ({
        member_id: r.member_id,
        name: `${r.first_name} ${r.last_name}`.trim(),
        at_risk: r.health_score != null && r.health_score < 50,
        preferences: r.preferences_cache,
      })),
      at_risk_diners: atRiskDiners.map(r => ({
        member_id: r.member_id,
        name: `${r.first_name} ${r.last_name}`.trim(),
        health_score: r.health_score,
      })),
      dining_events: diningEvents,
    },
    summary: lines.join(' '),
  };
}

// ---------------------------------------------------------------------------
// 3. GM Briefing (enhanced morning brief)
// ---------------------------------------------------------------------------

async function buildGmBriefing(clubId, dateStr) {
  // Members to personally greet (at-risk + VIP playing today)
  const greetList = await safeQuery(() => sql`
    SELECT DISTINCT m.member_id, m.first_name, m.last_name,
           m.membership_type, m.health_score, m.health_tier,
           b.tee_time
    FROM members m
    JOIN booking_players bp ON bp.member_id = m.member_id
    JOIN bookings b ON b.booking_id = bp.booking_id
    WHERE b.club_id = ${clubId}
      AND b.booking_date = ${dateStr}
      AND b.status != 'cancelled'
      AND (m.health_score < 50 OR m.membership_type IN ('LEG', 'FG'))
    ORDER BY m.health_score ASC NULLS LAST
  `);

  // Overnight agent actions pending approval
  const pendingActions = await safeQuery(() => sql`
    SELECT action_id, agent_id, action_type, priority, description,
           member_id, timestamp
    FROM agent_actions
    WHERE club_id = ${clubId} AND status = 'pending'
    ORDER BY
      CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
      timestamp DESC
    LIMIT 10
  `);

  // Unresolved complaints with aging
  const openComplaints = await safeQuery(() => sql`
    SELECT c.complaint_id, c.member_id, c.category, c.description,
           c.status, c.priority, c.reported_at, c.sla_hours,
           m.first_name, m.last_name, m.health_score,
           EXTRACT(EPOCH FROM (NOW() - c.reported_at)) / 3600 AS hours_open
    FROM complaints c
    LEFT JOIN members m ON m.member_id = c.member_id AND m.club_id = c.club_id
    WHERE c.club_id = ${clubId} AND c.status != 'resolved'
    ORDER BY
      CASE c.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
      c.reported_at ASC
    LIMIT 10
  `);

  // Revenue risk: at-risk members by annual dues
  const revenueRisk = await safeQuery(() => sql`
    SELECT COUNT(*) AS at_risk_count,
           COALESCE(SUM(annual_dues), 0) AS at_risk_dues
    FROM members
    WHERE club_id = ${clubId}
      AND membership_status = 'active'
      AND health_score IS NOT NULL
      AND health_score < 50
  `);

  // Churn predictions for high-risk members
  const churnRisk = await safeQuery(() => sql`
    SELECT cp.member_id, cp.prob_30d, cp.prob_90d,
           m.first_name, m.last_name, m.annual_dues
    FROM churn_predictions cp
    JOIN members m ON m.member_id = cp.member_id AND m.club_id = cp.club_id
    WHERE cp.club_id = ${clubId} AND cp.prob_30d > 0.3
    ORDER BY cp.prob_30d DESC
    LIMIT 5
  `);

  // Unresolved feedback
  const openFeedback = await safeQuery(() => sql`
    SELECT COUNT(*) AS count
    FROM feedback
    WHERE club_id = ${clubId} AND status NOT IN ('resolved')
  `);

  const risk = revenueRisk[0] || { at_risk_count: 0, at_risk_dues: 0 };
  const fbCount = openFeedback[0]?.count || 0;
  const breachingComplaints = openComplaints.filter(c => c.hours_open > (c.sla_hours || 24));

  // Top 3 priorities
  const priorities = [];
  if (breachingComplaints.length) priorities.push(`${breachingComplaints.length} complaint(s) breaching SLA — resolve immediately`);
  if (greetList.filter(g => g.health_score != null && g.health_score < 50).length) {
    priorities.push(`Personally greet ${greetList.filter(g => g.health_score != null && g.health_score < 50).length} at-risk member(s) on course today`);
  }
  if (pendingActions.length) priorities.push(`Review ${pendingActions.length} pending agent action(s)`);
  if (Number(risk.at_risk_dues) > 0) priorities.push(`$${Number(risk.at_risk_dues).toLocaleString()} in annual dues at risk from ${risk.at_risk_count} member(s)`);
  if (fbCount > 0) priorities.push(`${fbCount} unresolved feedback item(s)`);

  const top3 = priorities.slice(0, 3);

  const lines = [
    greetList.length ? `Greet today: ${greetList.map(g => g.first_name).join(', ')} (${greetList.length} total).` : 'No special greetings needed today.',
    pendingActions.length ? `${pendingActions.length} agent action(s) pending your approval.` : null,
    openComplaints.length ? `${openComplaints.length} open complaint(s), ${breachingComplaints.length} breaching SLA.` : 'No open complaints.',
    `Revenue risk: $${Number(risk.at_risk_dues).toLocaleString()} across ${risk.at_risk_count} at-risk member(s).`,
    top3.length ? `Top priorities: ${top3.map((p, i) => `${i + 1}) ${p}`).join('; ')}.` : null,
  ].filter(Boolean);

  return {
    department: 'gm',
    data: {
      greet_today: greetList.map(g => ({
        member_id: g.member_id,
        name: `${g.first_name} ${g.last_name}`.trim(),
        membership_type: g.membership_type,
        health_score: g.health_score,
        tee_time: g.tee_time,
        reason: g.health_score != null && g.health_score < 50 ? 'at_risk' : 'vip',
      })),
      pending_agent_actions: pendingActions,
      open_complaints: openComplaints.map(c => ({
        complaint_id: c.complaint_id,
        member: c.first_name ? `${c.first_name} ${c.last_name}`.trim() : null,
        category: c.category,
        priority: c.priority,
        hours_open: Math.round(c.hours_open || 0),
        sla_hours: c.sla_hours,
        breaching_sla: (c.hours_open || 0) > (c.sla_hours || 24),
      })),
      revenue_risk: { at_risk_count: Number(risk.at_risk_count), at_risk_dues: Number(risk.at_risk_dues) },
      churn_risk: churnRisk,
      top_priorities: top3,
    },
    summary: lines.join(' '),
  };
}

// ---------------------------------------------------------------------------
// 4. Events / Membership Briefing
// ---------------------------------------------------------------------------

async function buildEventsBriefing(clubId, dateStr) {
  // Today's events with attendance
  const events = await safeQuery(() => sql`
    SELECT e.event_id, e.name, e.type, e.event_date, e.capacity, e.description,
           COUNT(er.registration_id) FILTER (WHERE er.status != 'cancelled') AS registered,
           COUNT(er.registration_id) FILTER (WHERE er.status = 'attended') AS attended,
           COUNT(er.registration_id) FILTER (WHERE er.status = 'cancelled') AS cancelled
    FROM event_definitions e
    LEFT JOIN event_registrations er ON er.event_id = e.event_id
    WHERE e.club_id = ${clubId} AND e.event_date = ${dateStr}
    GROUP BY e.event_id, e.name, e.type, e.event_date, e.capacity, e.description
    ORDER BY e.name
  `);

  // Upcoming events (next 7 days) for awareness
  const upcoming = await safeQuery(() => sql`
    SELECT e.event_id, e.name, e.type, e.event_date, e.capacity,
           COUNT(er.registration_id) FILTER (WHERE er.status != 'cancelled') AS registered
    FROM event_definitions e
    LEFT JOIN event_registrations er ON er.event_id = e.event_id
    WHERE e.club_id = ${clubId}
      AND e.event_date > ${dateStr}
      AND e.event_date <= (${dateStr}::date + INTERVAL '7 days')::text
    GROUP BY e.event_id, e.name, e.type, e.event_date, e.capacity
    ORDER BY e.event_date
  `);

  // New members (joined in last 30 days) — onboarding status
  const newMembers = await safeQuery(() => sql`
    SELECT m.member_id, m.first_name, m.last_name, m.join_date,
           m.membership_type, m.health_score
    FROM members m
    WHERE m.club_id = ${clubId}
      AND m.membership_status = 'active'
      AND m.join_date >= (${dateStr}::date - INTERVAL '30 days')::text
    ORDER BY m.join_date DESC
  `);

  // Resignation risk flags (churn predictions + low health)
  const resignationRisk = await safeQuery(() => sql`
    SELECT m.member_id, m.first_name, m.last_name, m.membership_type,
           m.annual_dues, m.health_score,
           cp.prob_30d, cp.prob_90d, cp.risk_factors
    FROM members m
    LEFT JOIN churn_predictions cp ON cp.member_id = m.member_id AND cp.club_id = m.club_id
    WHERE m.club_id = ${clubId}
      AND m.membership_status = 'active'
      AND (m.health_score < 40 OR cp.prob_30d > 0.3)
    ORDER BY COALESCE(cp.prob_30d, 0) DESC, m.health_score ASC
    LIMIT 10
  `);

  // Upcoming renewals — members whose join anniversary is in next 30 days
  const renewals = await safeQuery(() => sql`
    SELECT member_id, first_name, last_name, membership_type,
           join_date, annual_dues, health_score
    FROM members
    WHERE club_id = ${clubId}
      AND membership_status = 'active'
      AND TO_CHAR(join_date::date, 'MM-DD')
          BETWEEN TO_CHAR(${dateStr}::date, 'MM-DD')
          AND TO_CHAR((${dateStr}::date + INTERVAL '30 days'), 'MM-DD')
    ORDER BY join_date
    LIMIT 20
  `);

  const lines = [
    events.length
      ? `Today's events: ${events.map(e => `${e.name} (${e.registered}/${e.capacity} registered)`).join(', ')}.`
      : 'No events today.',
    upcoming.length ? `${upcoming.length} event(s) in the next 7 days.` : null,
    newMembers.length ? `${newMembers.length} new member(s) in onboarding (last 30 days).` : null,
    resignationRisk.length ? `${resignationRisk.length} member(s) flagged for resignation risk.` : null,
    renewals.length ? `${renewals.length} membership renewal(s) approaching in next 30 days.` : null,
  ].filter(Boolean);

  return {
    department: 'events_membership',
    data: {
      todays_events: events,
      upcoming_events: upcoming,
      new_members_onboarding: newMembers.map(m => ({
        member_id: m.member_id,
        name: `${m.first_name} ${m.last_name}`.trim(),
        join_date: m.join_date,
        membership_type: m.membership_type,
        health_score: m.health_score,
        days_since_join: Math.floor((Date.now() - new Date(m.join_date).getTime()) / 86400000),
      })),
      resignation_risk: resignationRisk.map(m => ({
        member_id: m.member_id,
        name: `${m.first_name} ${m.last_name}`.trim(),
        membership_type: m.membership_type,
        annual_dues: m.annual_dues,
        health_score: m.health_score,
        churn_prob_30d: m.prob_30d,
        risk_factors: m.risk_factors,
      })),
      upcoming_renewals: renewals,
    },
    summary: lines.join(' '),
  };
}

// ---------------------------------------------------------------------------
// Store briefing
// ---------------------------------------------------------------------------

async function storeBriefing(clubId, dateStr, briefing) {
  try {
    await sql`
      INSERT INTO staff_briefings (club_id, department, briefing_date, content)
      VALUES (
        ${clubId},
        ${briefing.department},
        ${dateStr}::date,
        ${JSON.stringify({ summary: briefing.summary, ...briefing.data })}::jsonb
      )
      ON CONFLICT (club_id, department, briefing_date)
      DO UPDATE SET content = EXCLUDED.content, created_at = NOW()
    `;
  } catch (err) {
    logWarn(LOG_CTX, `failed to store ${briefing.department} briefing`, { clubId, error: err.message });
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  const auth = req.headers['authorization'] || '';
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    logWarn(LOG_CTX, 'unauthorized cron invocation', {
      ip: req.headers['x-forwarded-for'],
      hasAuthHeader: !!req.headers['authorization'],
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  logInfo(LOG_CTX, 'cron tick start');

  try {
    await ensureTable();

    const { rows: clubs } = await sql`SELECT club_id FROM club`;
    const dateStr = today();
    const results = [];

    for (const club of clubs) {
      const clubId = club.club_id;
      try {
        const [starter, fnb, gm, events] = await Promise.all([
          buildStarterBriefing(clubId, dateStr),
          buildFnbBriefing(clubId, dateStr),
          buildGmBriefing(clubId, dateStr),
          buildEventsBriefing(clubId, dateStr),
        ]);

        // Store all four briefings
        await Promise.all([
          storeBriefing(clubId, dateStr, starter),
          storeBriefing(clubId, dateStr, fnb),
          storeBriefing(clubId, dateStr, gm),
          storeBriefing(clubId, dateStr, events),
        ]);

        results.push({
          club_id: clubId,
          departments: [starter.department, fnb.department, gm.department, events.department],
          summaries: {
            starter_pro_shop: starter.summary,
            fnb_dining: fnb.summary,
            gm: gm.summary,
            events_membership: events.summary,
          },
        });
      } catch (err) {
        logWarn(LOG_CTX, `club ${clubId} failed`, { error: err.message });
        results.push({ club_id: clubId, error: err.message });
      }
    }

    logInfo(LOG_CTX, `completed for ${clubs.length} club(s)`, { date: dateStr });
    return res.status(200).json({ ok: true, briefing_date: dateStr, clubs: results });
  } catch (err) {
    logWarn(LOG_CTX, 'cron error', { error: err.message });
    return res.status(500).json({ error: err.message });
  }
}
