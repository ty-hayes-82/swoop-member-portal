/**
 * POST /api/agents/gameplan-trigger
 *
 * One-shot trigger for the daily game plan agent.
 * Called by /api/cron/daily-gameplan at 5 AM club local time.
 *
 * Flow:
 *   1. Check if a plan already exists for today (idempotent)
 *   2. Pull all 5 data domains via MCP tool functions
 *   3. In simulation mode, build a structured plan from the raw data
 *   4. Save the plan to daily_game_plans
 *   5. Create actions for each plan item
 *
 * Simulation mode: when MANAGED_AGENT_ID or MANAGED_ENV_ID are unset,
 * runs a deterministic data-pull + save without calling the LLM.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getWriteClubId } from '../lib/withAuth.js';
import { createManagedSession, sendSessionEvent, MANAGED_AGENT_ID, MANAGED_ENV_ID } from './managed-config.js';

const SIMULATION_MODE = !MANAGED_AGENT_ID || !MANAGED_ENV_ID;

/**
 * Pull tee sheet summary for a given date and club.
 */
export async function pullTeeSheet(clubId, date) {
  const result = await sql`
    SELECT COUNT(*) AS total_rounds,
      SUM(CASE WHEN tee_time < '12:00' THEN 1 ELSE 0 END) AS morning_rounds,
      SUM(CASE WHEN tee_time >= '12:00' THEN 1 ELSE 0 END) AS afternoon_rounds
    FROM bookings
    WHERE booking_date = ${date} AND club_id = ${clubId} AND status = 'confirmed'
  `;
  const row = result.rows[0] || {};

  // Notable members: at-risk members with bookings tomorrow
  const notable = await sql`
    SELECT b.member_id, m.first_name, m.last_name, m.health_score, m.annual_dues, b.tee_time
    FROM bookings b
    JOIN members m ON b.member_id = m.member_id AND b.club_id = m.club_id
    WHERE b.booking_date = ${date} AND b.club_id = ${clubId} AND b.status = 'confirmed'
      AND m.health_tier IN ('at-risk', 'critical')
    ORDER BY m.annual_dues DESC
    LIMIT 5
  `;

  return {
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

/**
 * Pull weather forecast for a given date and club.
 */
export async function pullWeather(clubId, date) {
  const result = await sql`
    SELECT condition, temp_high, temp_low, wind_mph, precipitation_in,
      golf_demand_modifier, fb_demand_modifier
    FROM weather_daily
    WHERE date = ${date} AND club_id = ${clubId}
    LIMIT 1
  `;
  if (result.rows.length === 0) {
    return { available: false, stale: true };
  }
  const w = result.rows[0];
  return {
    available: true,
    stale: false,
    condition: w.condition,
    temp_high: Number(w.temp_high),
    temp_low: Number(w.temp_low),
    wind_mph: Number(w.wind_mph),
    precipitation_in: Number(w.precipitation_in),
    golf_demand_modifier: Number(w.golf_demand_modifier),
    fb_demand_modifier: Number(w.fb_demand_modifier),
  };
}

/**
 * Pull staffing schedule for a given date and club.
 */
export async function pullStaffing(clubId, date) {
  const result = await sql`
    SELECT ss.outlet, ss.shift, ss.staff_count, ss.date
    FROM staff_shifts ss
    WHERE ss.date = ${date} AND ss.club_id = ${clubId}
    ORDER BY ss.outlet, ss.shift
  `;
  return {
    shifts: result.rows.map(r => ({
      outlet: r.outlet,
      shift: r.shift,
      staff_count: Number(r.staff_count),
    })),
    total_staff: result.rows.reduce((sum, r) => sum + Number(r.staff_count), 0),
  };
}

/**
 * Pull F&B reservations for a given date and club.
 */
export async function pullFbReservations(clubId, date) {
  const result = await sql`
    SELECT outlet, meal_period, SUM(covers) AS total_covers, COUNT(*) AS reservation_count
    FROM fb_reservations
    WHERE date = ${date} AND club_id = ${clubId}
    GROUP BY outlet, meal_period
    ORDER BY outlet, meal_period
  `;
  return {
    reservations: result.rows.map(r => ({
      outlet: r.outlet,
      meal_period: r.meal_period,
      total_covers: Number(r.total_covers),
      reservation_count: Number(r.reservation_count),
    })),
    total_covers: result.rows.reduce((sum, r) => sum + Number(r.total_covers), 0),
  };
}

/**
 * Pull previous 7 days of game plans.
 */
export async function pullGamePlanHistory(clubId) {
  const result = await sql`
    SELECT plan_id, plan_date, risk_level, action_count, plan_content,
      created_at, actions_approved, actions_dismissed
    FROM daily_game_plans
    WHERE club_id = ${clubId}
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
  };
}

/**
 * Save a completed game plan.
 */
export async function saveGamePlan(clubId, planDate, riskLevel, actionCount, planContent) {
  const result = await sql`
    INSERT INTO daily_game_plans (club_id, plan_date, risk_level, action_count, plan_content)
    VALUES (${clubId}, ${planDate}, ${riskLevel}, ${actionCount}, ${JSON.stringify(planContent)})
    ON CONFLICT (club_id, plan_date) DO UPDATE SET
      risk_level = EXCLUDED.risk_level,
      action_count = EXCLUDED.action_count,
      plan_content = EXCLUDED.plan_content,
      created_at = NOW()
    RETURNING plan_id
  `;
  return { plan_id: result.rows[0].plan_id };
}

/**
 * Synthesize risk level from data pulls (simulation mode).
 */
function synthesizeRiskLevel(teeSheet, weather, staffing, complaints) {
  let score = 0;
  if (teeSheet.total_rounds > 120) score++;
  if (teeSheet.notable_members.length > 0) score++;
  if (weather.available && weather.wind_mph > 15) score++;
  if (weather.available && weather.golf_demand_modifier < -0.1) score++;
  if (staffing.total_staff === 0) score++;
  if (complaints.count > 2) score++;

  if (score >= 4) return 'high';
  if (score >= 3) return 'elevated';
  if (score >= 1) return 'normal';
  return 'low';
}

/**
 * Build a simulated plan from raw data pulls (no LLM).
 */
function buildSimulatedPlan(teeSheet, weather, staffing, fbRes, complaints, history) {
  const actions = [];

  // Cross-domain: at-risk member + open complaint
  if (teeSheet.notable_members.length > 0 && complaints.count > 0) {
    const member = teeSheet.notable_members[0];
    actions.push({
      headline: `Priority service for ${member.name} (at-risk, open complaint)`,
      rationale: `${member.name} has a health score of ${member.health_score} and is playing today. There are ${complaints.count} open complaints. Ensure service team is briefed.`,
      impact: `$${member.annual_dues.toLocaleString()}/yr at risk`,
      owner: 'Director of Golf',
      domains: ['tee_sheet', 'member_risk'],
    });
  }

  // Cross-domain: weather + staffing
  if (weather.available && weather.wind_mph > 15 && teeSheet.total_rounds > 80) {
    actions.push({
      headline: 'Adjust afternoon staffing for weather-driven demand shift',
      rationale: `Wind gusts of ${weather.wind_mph} mph expected. With ${teeSheet.total_rounds} rounds booked, expect morning cancellations and compressed afternoon play. Shift staffing accordingly.`,
      impact: 'Reduced complaint risk on weather day',
      owner: 'Operations Manager',
      domains: ['weather', 'staffing'],
    });
  }

  // Cross-domain: high covers + staffing gap
  if (fbRes.total_covers > 100 && staffing.total_staff < 10) {
    actions.push({
      headline: 'Add Grill Room coverage for high-cover lunch period',
      rationale: `${fbRes.total_covers} covers projected with only ${staffing.total_staff} total staff scheduled. Historical complaint rate doubles when cover-to-staff ratio exceeds 12:1.`,
      impact: 'Estimated $2,400 F&B revenue at risk',
      owner: 'F&B Director',
      domains: ['fb', 'staffing'],
    });
  }

  return {
    summary: actions.length === 0
      ? 'Low-risk day. No action required.'
      : `${actions.length} action item${actions.length > 1 ? 's' : ''} identified across ${new Set(actions.flatMap(a => a.domains)).size} domains.`,
    actions,
    data_pulls: {
      tee_sheet: teeSheet,
      weather,
      staffing,
      fb_reservations: fbRes,
      open_complaints: complaints,
      history_days: history.plans.length,
    },
  };
}

async function gameplanHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getWriteClubId(req);
  const { plan_date } = req.body;

  if (!plan_date) {
    return res.status(400).json({ error: 'plan_date is required (YYYY-MM-DD)' });
  }

  try {
    // 1. Idempotency: check if plan already exists for this date
    const { rows: existingPlans } = await sql`
      SELECT plan_id FROM daily_game_plans
      WHERE club_id = ${clubId} AND plan_date = ${plan_date}
    `;
    if (existingPlans.length > 0) {
      return res.status(200).json({
        triggered: false,
        reason: 'Plan already exists for this date',
        existing_plan_id: existingPlans[0].plan_id,
      });
    }

    // 2. Pull all 5 data domains
    const [teeSheet, weather, staffing, fbRes, complaints, history] = await Promise.all([
      pullTeeSheet(clubId, plan_date),
      pullWeather(clubId, plan_date),
      pullStaffing(clubId, plan_date),
      pullFbReservations(clubId, plan_date),
      sql`
        SELECT feedback_id, member_id, category, status, sentiment_score, description, submitted_at
        FROM feedback
        WHERE club_id = ${clubId} AND status != 'resolved'
        ORDER BY submitted_at DESC
      `.then(r => ({ complaints: r.rows, count: r.rows.length })),
      pullGamePlanHistory(clubId),
    ]);

    // 3. Create session or simulate
    let sessionId = null;

    if (!SIMULATION_MODE) {
      const session = await createManagedSession();
      sessionId = session.id;

      await sendSessionEvent(sessionId, {
        type: 'user.message',
        content: JSON.stringify({
          trigger: 'daily_game_plan',
          club_id: clubId,
          plan_date,
          tee_sheet: teeSheet,
          weather,
          staffing,
          fb_reservations: fbRes,
          open_complaints: complaints,
          history,
          timestamp: new Date().toISOString(),
        }),
      });

      return res.status(200).json({
        triggered: true,
        session_id: sessionId,
        simulation: false,
        data_pulls: { tee_sheet: true, weather: true, staffing: true, fb: true, complaints: true },
      });
    }

    // Simulation mode: synthesize plan locally
    sessionId = `sim_gp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const riskLevel = synthesizeRiskLevel(teeSheet, weather, staffing, complaints);
    const planContent = buildSimulatedPlan(teeSheet, weather, staffing, fbRes, complaints, history);

    // 4. Save game plan
    const { plan_id } = await saveGamePlan(clubId, plan_date, riskLevel, planContent.actions.length, planContent);

    // 5. Create actions for each plan item
    for (const action of planContent.actions) {
      await sql`
        INSERT INTO agent_actions (action_id, club_id, agent_id, action_type, priority, source, description, impact_metric, status, timestamp)
        VALUES (
          ${`act_gp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`},
          ${clubId}, 'tomorrows-game-plan', 'alert_staff',
          ${riskLevel === 'high' ? 'high' : riskLevel === 'elevated' ? 'high' : 'medium'},
          'tomorrows-game-plan',
          ${action.headline},
          ${action.impact},
          'pending', NOW()
        )
      `;
    }

    return res.status(200).json({
      triggered: true,
      session_id: sessionId,
      plan_id,
      simulation: true,
      risk_level: riskLevel,
      action_count: planContent.actions.length,
      data_pulls: {
        tee_sheet: teeSheet.total_rounds,
        weather: weather.available,
        staffing: staffing.total_staff,
        fb_covers: fbRes.total_covers,
        open_complaints: complaints.count,
        history_days: history.plans.length,
      },
    });
  } catch (err) {
    console.error('/api/agents/gameplan-trigger error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ---------------------------------------------------------------------------
// Export: cron-key bypass or standard withAuth
// ---------------------------------------------------------------------------

export default function handler(req, res) {
  const cronKey = req.headers['x-cron-key'];
  if (cronKey && process.env.CRON_SECRET && cronKey === process.env.CRON_SECRET) {
    req.auth = req.auth || { clubId: req.body?.club_id || 'unknown', role: 'system' };
    return gameplanHandler(req, res);
  }
  return withAuth(gameplanHandler, { roles: ['gm', 'admin'] })(req, res);
}
