/**
 * POST /api/agents/staffing-trigger
 *
 * Trigger for the staffing-demand alignment agent.
 * Called by /api/cron/staffing-monitor every 6 hours + event-driven wakes.
 *
 * Flow:
 *   1. Pull staffing schedule, demand forecast, weather, F&B reservations
 *   2. Pull historical staffing outcomes for feedback loop
 *   3. In simulation mode, synthesize recommendations locally
 *   4. Save recommendations to staffing_recommendations table
 *   5. Create actions for high-impact gaps
 *
 * Simulation mode: when ANTHROPIC_API_KEY env var is unset,
 * runs deterministic analysis without calling the LLM.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getWriteClubId } from '../lib/withAuth.js';
import { createManagedSession, sendSessionEvent } from './managed-config.js';
import { checkDataAvailable, TRIGGER_REQUIREMENTS } from './data-availability-check.js';

const SIMULATION_MODE = !process.env.ANTHROPIC_API_KEY;

// ---------------------------------------------------------------------------
// Data pull functions
// ---------------------------------------------------------------------------

/**
 * Pull staffing vs demand gap analysis for a given date and club.
 *
 * Real schema mapping:
 * - staff_shifts.outlet_id (not `outlet`)
 * - staff_shifts.shift_date (not `date`)
 * - "shift" derived from start_time (morning/lunch/dinner buckets)
 * - "staff_count" derived from COUNT(*) per outlet_id + time bucket
 * - fb_reservations table does not exist — fall back to an empty demand
 *   array and lean on the rounds-based demand path below.
 */
export async function pullStaffingVsDemand(clubId, date) {
  // Scheduled staff headcount per outlet_id + shift bucket
  const staffResult = await sql`
    SELECT
      outlet_id AS outlet,
      CASE
        WHEN EXTRACT(HOUR FROM start_time::time) < 11 THEN 'morning'
        WHEN EXTRACT(HOUR FROM start_time::time) < 16 THEN 'lunch'
        ELSE 'dinner'
      END AS shift,
      COUNT(*) AS staff_count
    FROM staff_shifts
    WHERE shift_date = ${date} AND club_id = ${clubId}
    GROUP BY outlet_id, shift
    ORDER BY outlet, shift
  `;

  // F&B reservations table doesn't exist in deployed schema. Fall back to
  // empty demand — the rounds-based path below still runs.
  const demandResult = { rows: [] };

  // Get tee sheet for round-based demand
  const roundsResult = await sql`
    SELECT COUNT(*) AS total_rounds,
      SUM(CASE WHEN tee_time < '12:00' THEN 1 ELSE 0 END) AS morning_rounds,
      SUM(CASE WHEN tee_time >= '12:00' THEN 1 ELSE 0 END) AS afternoon_rounds
    FROM bookings
    WHERE booking_date = ${date} AND club_id = ${clubId} AND status = 'confirmed'
  `;

  const rounds = roundsResult.rows[0] || {};
  const shifts = staffResult.rows.map(r => ({
    outlet: r.outlet,
    shift: r.shift,
    staff_count: Number(r.staff_count),
  }));
  const demand = demandResult.rows.map(r => ({
    outlet: r.outlet,
    meal_period: r.meal_period,
    projected_covers: Number(r.projected_covers),
    reservation_count: Number(r.reservation_count),
  }));

  // Compute gap analysis per outlet
  const gaps = [];
  for (const d of demand) {
    const matchingShift = shifts.find(s => s.outlet === d.outlet && s.shift === d.meal_period);
    const staffCount = matchingShift ? matchingShift.staff_count : 0;
    const coverToStaffRatio = staffCount > 0 ? d.projected_covers / staffCount : Infinity;
    // Historical ideal: 10 covers per staff member
    const idealStaff = Math.ceil(d.projected_covers / 10);
    const gap = staffCount - idealStaff;

    gaps.push({
      outlet: d.outlet,
      time_window: d.meal_period,
      current_staff: staffCount,
      ideal_staff: idealStaff,
      gap, // negative = understaffed, positive = overstaffed
      projected_covers: d.projected_covers,
      cover_to_staff_ratio: coverToStaffRatio === Infinity ? null : Math.round(coverToStaffRatio * 10) / 10,
    });
  }

  return {
    date,
    total_rounds: Number(rounds.total_rounds ?? 0),
    morning_rounds: Number(rounds.morning_rounds ?? 0),
    afternoon_rounds: Number(rounds.afternoon_rounds ?? 0),
    shifts,
    demand,
    gaps,
    total_staff: shifts.reduce((sum, s) => sum + s.staff_count, 0),
    total_covers: demand.reduce((sum, d) => sum + d.projected_covers, 0),
  };
}

/**
 * Pull historical staffing outcomes for feedback loop.
 */
export async function pullHistoricalOutcomes(clubId, lookbackDays = 30) {
  const result = await sql`
    SELECT rec_id, target_date, outlet, time_window,
      current_staff, recommended_staff, demand_forecast,
      revenue_at_risk, confidence, rationale, status, actual_outcome, created_at
    FROM staffing_recommendations
    WHERE club_id = ${clubId}
      AND created_at > NOW() - INTERVAL '1 day' * ${lookbackDays}
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

/**
 * Save a staffing recommendation.
 */
export async function saveStaffingRecommendation(clubId, rec) {
  const result = await sql`
    INSERT INTO staffing_recommendations (
      club_id, target_date, outlet, time_window,
      current_staff, recommended_staff, demand_forecast,
      revenue_at_risk, confidence, rationale, status
    ) VALUES (
      ${clubId}, ${rec.target_date}, ${rec.outlet}, ${rec.time_window},
      ${rec.current_staff}, ${rec.recommended_staff}, ${rec.demand_forecast},
      ${rec.revenue_at_risk}, ${rec.confidence}, ${rec.rationale}, 'pending'
    )
    RETURNING rec_id
  `;
  return { rec_id: result.rows[0].rec_id, saved: true };
}

// ---------------------------------------------------------------------------
// Simulation synthesizers
// ---------------------------------------------------------------------------

/**
 * Compute confidence based on historical outcome count.
 */
function computeConfidence(historyCount) {
  if (historyCount === 0) return 0.5;
  if (historyCount <= 5) return 0.55 + (historyCount * 0.03);
  if (historyCount <= 15) return 0.65 + ((historyCount - 5) * 0.02);
  return Math.min(0.9, 0.75 + ((historyCount - 15) * 0.005));
}

/**
 * Build simulated staffing recommendations from data pulls.
 */
function buildSimulatedRecommendations(staffingDemand, weather, complaints, history) {
  const recommendations = [];
  const confidence = computeConfidence(history.count);

  for (const gap of staffingDemand.gaps) {
    const avgCheck = 28; // avg per-cover revenue

    if (gap.gap < 0) {
      // Understaffed
      const revenueAtRisk = Math.abs(gap.gap) * gap.projected_covers * avgCheck * 0.15;
      let rationale = `${gap.outlet} ${gap.time_window}: ${gap.current_staff} staff scheduled for ${gap.projected_covers} projected covers (ratio ${gap.cover_to_staff_ratio}:1). Ideal is ${gap.ideal_staff} staff.`;

      // Cross-domain: weather
      if (weather.available && weather.golf_demand_modifier < -0.1) {
        rationale += ` Weather shift (${weather.condition}, ${weather.wind_mph} mph wind) may compress demand into F&B outlets.`;
      }

      // Cross-domain: complaints
      if (complaints.count > 0) {
        rationale += ` ${complaints.count} open complaint(s) — understaffing compounds service risk.`;
      }

      rationale += ` Revenue at risk: $${Math.round(revenueAtRisk).toLocaleString()}.`;

      recommendations.push({
        outlet: gap.outlet,
        time_window: gap.time_window,
        current_staff: gap.current_staff,
        recommended_staff: gap.ideal_staff,
        demand_forecast: gap.projected_covers,
        revenue_at_risk: Math.round(revenueAtRisk * 100) / 100,
        confidence,
        rationale,
        type: 'understaffed',
      });
    } else if (gap.gap > 1) {
      // Overstaffed by 2+
      const laborSavings = gap.gap * 18 * 4; // $18/hr * 4 hr shift
      const rationale = `${gap.outlet} ${gap.time_window}: ${gap.current_staff} staff scheduled for ${gap.projected_covers} projected covers. Historical average for similar demand is ${gap.ideal_staff}. Recommend releasing ${gap.gap} to save $${laborSavings} in labor cost.`;

      recommendations.push({
        outlet: gap.outlet,
        time_window: gap.time_window,
        current_staff: gap.current_staff,
        recommended_staff: gap.ideal_staff,
        demand_forecast: gap.projected_covers,
        revenue_at_risk: -laborSavings, // negative = savings
        confidence,
        rationale,
        type: 'overstaffed',
      });
    }
  }

  return recommendations;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

async function staffingHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getWriteClubId(req);
  const { target_date, trigger_type } = req.body;

  if (!target_date) {
    return res.status(400).json({ error: 'target_date is required (YYYY-MM-DD)' });
  }

  const gate = await checkDataAvailable(clubId, TRIGGER_REQUIREMENTS['staffing-trigger']);
  if (!gate.ok) {
    return res.status(200).json({ triggered: false, reason: gate.reason, missing: gate.missing });
  }

  try {
    // 1. Pull staffing vs demand data
    const [staffingDemand, weather, complaints, history] = await Promise.all([
      pullStaffingVsDemand(clubId, target_date),
      sql`
        SELECT condition, temp_high, temp_low, wind_mph, precipitation_in,
          golf_demand_modifier, fb_demand_modifier
        FROM weather_daily
        WHERE date = ${target_date} AND club_id = ${clubId}
        LIMIT 1
      `.then(r => {
        if (r.rows.length === 0) return { available: false };
        const w = r.rows[0];
        return {
          available: true,
          condition: w.condition,
          wind_mph: Number(w.wind_mph),
          golf_demand_modifier: Number(w.golf_demand_modifier),
          fb_demand_modifier: Number(w.fb_demand_modifier),
        };
      }),
      sql`
        SELECT feedback_id, member_id, category, status, sentiment_score
        FROM feedback
        WHERE club_id = ${clubId} AND status != 'resolved'
        ORDER BY submitted_at DESC
      `.then(r => ({ complaints: r.rows, count: r.rows.length })),
      pullHistoricalOutcomes(clubId),
    ]);

    // 2. Create session or simulate
    let sessionId = null;

    if (!SIMULATION_MODE) {
      const session = await createManagedSession();
      sessionId = session.id;

      await sendSessionEvent(sessionId, {
        type: 'user.message',
        content: JSON.stringify({
          trigger: 'staffing_demand_alignment',
          trigger_type: trigger_type || '6h_cycle',
          club_id: clubId,
          target_date,
          staffing_demand: staffingDemand,
          weather,
          open_complaints: complaints,
          historical_outcomes: history,
          timestamp: new Date().toISOString(),
        }),
      });

      return res.status(200).json({
        triggered: true,
        session_id: sessionId,
        simulation: false,
        trigger_type: trigger_type || '6h_cycle',
      });
    }

    // Simulation mode
    sessionId = `sim_sd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const recommendations = buildSimulatedRecommendations(staffingDemand, weather, complaints, history);

    // 3. Save each recommendation
    const savedRecs = [];
    for (const rec of recommendations) {
      const { rec_id } = await saveStaffingRecommendation(clubId, {
        target_date,
        outlet: rec.outlet,
        time_window: rec.time_window,
        current_staff: rec.current_staff,
        recommended_staff: rec.recommended_staff,
        demand_forecast: rec.demand_forecast,
        revenue_at_risk: rec.revenue_at_risk,
        confidence: rec.confidence,
        rationale: rec.rationale,
      });
      savedRecs.push({ rec_id, ...rec });
    }

    // 4. Create actions for understaffed gaps
    for (const rec of recommendations.filter(r => r.type === 'understaffed')) {
      await sql`
        INSERT INTO agent_actions (action_id, club_id, agent_id, action_type, priority, source, description, impact_metric, status, timestamp)
        VALUES (
          ${`act_sd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`},
          ${clubId}, 'staffing-demand', 'rebalance',
          ${rec.revenue_at_risk > 500 ? 'high' : 'medium'},
          'staffing-demand',
          ${`Add ${rec.recommended_staff - rec.current_staff} staff to ${rec.outlet} ${rec.time_window}`},
          ${`$${Math.round(rec.revenue_at_risk)} revenue at risk`},
          'pending', NOW()
        )
      `;
    }

    return res.status(200).json({
      triggered: true,
      session_id: sessionId,
      simulation: true,
      trigger_type: trigger_type || '6h_cycle',
      recommendation_count: recommendations.length,
      recommendations: savedRecs.map(r => ({
        rec_id: r.rec_id,
        outlet: r.outlet,
        time_window: r.time_window,
        type: r.type,
        current_staff: r.current_staff,
        recommended_staff: r.recommended_staff,
        revenue_at_risk: r.revenue_at_risk,
        confidence: r.confidence,
      })),
      data_pulls: {
        total_rounds: staffingDemand.total_rounds,
        total_staff: staffingDemand.total_staff,
        total_covers: staffingDemand.total_covers,
        gaps_found: staffingDemand.gaps.length,
        weather: weather.available,
        open_complaints: complaints.count,
        historical_recs: history.count,
      },
    });
  } catch (err) {
    console.error('/api/agents/staffing-trigger error:', err);
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
    return staffingHandler(req, res);
  }
  return withAuth(staffingHandler, { roles: ['gm', 'admin'] })(req, res);
}
