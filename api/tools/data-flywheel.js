/**
 * Data Flywheel — Records outcomes, calibrates models, and benchmarks clubs.
 *
 * GET/POST /api/tools/data-flywheel?action=record_outcome|calibrate_model|benchmark
 *
 * Three endpoints via ?action= query param:
 *   record_outcome  (POST) — Record intervention outcome
 *   calibrate_model (GET)  — Health model calibration metrics
 *   benchmark       (GET)  — Cohort benchmarking data
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId, getWriteClubId } from '../lib/withAuth.js';
import { logError } from '../lib/logger.js';

export default withAuth(async function handler(req, res) {
  const action = req.query.action;

  if (!action) {
    return res.status(400).json({ error: 'action query param required (record_outcome|calibrate_model|benchmark)' });
  }

  try {
    switch (action) {
      case 'record_outcome':
        return await handleRecordOutcome(req, res);
      case 'calibrate_model':
        return await handleCalibrateModel(req, res);
      case 'benchmark':
        return await handleBenchmark(req, res);
      default:
        return res.status(400).json({ error: `Unknown action: ${action}. Use record_outcome, calibrate_model, or benchmark.` });
    }
  } catch (e) {
    logError(`/api/tools/data-flywheel?action=${action}`, e);
    return res.status(500).json({ error: e.message });
  }
});

// ---------------------------------------------------------------------------
// POST ?action=record_outcome
// Records the outcome of an agent-recommended intervention.
// ---------------------------------------------------------------------------
async function handleRecordOutcome(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'record_outcome requires POST' });
  }

  const clubId = getWriteClubId(req);
  if (!clubId) {
    return res.status(400).json({ error: 'clubId query param required' });
  }

  const { action_id, outcome, member_retained, revenue_impact, notes } = req.body || {};

  if (!action_id) {
    return res.status(400).json({ error: 'action_id is required' });
  }
  if (!outcome || !['success', 'partial', 'failure'].includes(outcome)) {
    return res.status(400).json({ error: 'outcome must be success, partial, or failure' });
  }

  const result = await sql`
    INSERT INTO intervention_outcomes (
      club_id, action_id, outcome, member_retained,
      revenue_impact, notes, recorded_at
    ) VALUES (
      ${clubId}, ${action_id}, ${outcome},
      ${member_retained ?? null}, ${revenue_impact ?? 0},
      ${notes ?? null}, NOW()
    )
    RETURNING outcome_id, action_id, outcome, recorded_at
  `;

  return res.status(201).json({
    message: 'Outcome recorded',
    record: result.rows[0],
  });
}

// ---------------------------------------------------------------------------
// GET ?action=calibrate_model&clubId=xxx&period=30d|90d|180d
// Returns health model calibration metrics.
// ---------------------------------------------------------------------------
async function handleCalibrateModel(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'calibrate_model requires GET' });
  }

  const clubId = getReadClubId(req);
  if (!clubId) {
    return res.status(400).json({ error: 'clubId query param required' });
  }

  const period = req.query.period || '90d';
  const validPeriods = { '30d': 30, '90d': 90, '180d': 180 };
  const days = validPeriods[period];
  if (!days) {
    return res.status(400).json({ error: 'period must be 30d, 90d, or 180d' });
  }

  // Count members who were predicted at-risk (health_score < 50) during the period
  const predicted = await sql`
    SELECT COUNT(DISTINCT member_id) AS cnt
    FROM intervention_outcomes io
    JOIN interventions i ON io.action_id::text = i.intervention_id::text
    WHERE io.club_id = ${clubId}
      AND io.recorded_at >= NOW() - MAKE_INTERVAL(days => ${days})
  `;

  // Count actual resignations during the period
  const actualResignations = await sql`
    SELECT COUNT(*) AS cnt
    FROM member_resignations
    WHERE club_id = ${clubId}
      AND resigned_at >= NOW() - MAKE_INTERVAL(days => ${days})
  `;

  // False positives: predicted at-risk but outcome was success (member stayed and thrived)
  const falsePositives = await sql`
    SELECT COUNT(*) AS cnt
    FROM intervention_outcomes
    WHERE club_id = ${clubId}
      AND recorded_at >= NOW() - MAKE_INTERVAL(days => ${days})
      AND outcome = 'success'
      AND member_retained = true
  `;

  // False negatives: members who resigned but had NO intervention
  const falseNegatives = await sql`
    SELECT COUNT(*) AS cnt
    FROM member_resignations mr
    WHERE mr.club_id = ${clubId}
      AND mr.resigned_at >= NOW() - MAKE_INTERVAL(days => ${days})
      AND NOT EXISTS (
        SELECT 1 FROM interventions i
        WHERE i.member_id = mr.member_id
          AND i.club_id = mr.club_id
          AND i.initiated_at >= mr.resigned_at - INTERVAL '90 days'
      )
  `;

  const predictedCount = Number(predicted.rows[0]?.cnt || 0);
  const actualCount = Number(actualResignations.rows[0]?.cnt || 0);
  const fpCount = Number(falsePositives.rows[0]?.cnt || 0);
  const fnCount = Number(falseNegatives.rows[0]?.cnt || 0);

  const totalPredictions = predictedCount + fnCount;
  const accuracyPct = totalPredictions > 0
    ? Math.round(((totalPredictions - fpCount - fnCount) / totalPredictions) * 100)
    : null;

  const calibrationScore = actualCount > 0
    ? Math.round((predictedCount / actualCount) * 100) / 100
    : null;

  return res.status(200).json({
    club_id: clubId,
    period,
    predicted_resignations: predictedCount,
    actual_resignations: actualCount,
    false_positives: fpCount,
    false_negatives: fnCount,
    accuracy_pct: accuracyPct,
    calibration_score: calibrationScore,
  });
}

// ---------------------------------------------------------------------------
// GET ?action=benchmark&clubId=xxx&metric=post_round_dining|retention_rate|...
// Returns cohort benchmarking data.
// ---------------------------------------------------------------------------
async function handleBenchmark(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'benchmark requires GET' });
  }

  const clubId = getReadClubId(req);
  if (!clubId) {
    return res.status(400).json({ error: 'clubId query param required' });
  }

  const metric = req.query.metric;
  const validMetrics = ['post_round_dining', 'retention_rate', 'f&b_per_member', 'rounds_per_member'];
  if (!metric || !validMetrics.includes(metric)) {
    return res.status(400).json({
      error: `metric must be one of: ${validMetrics.join(', ')}`,
    });
  }

  // Get the club's own value for this metric
  const clubRow = await sql`
    SELECT club_value
    FROM club_benchmarks
    WHERE club_id = ${clubId}
      AND metric_key = ${metric}
    ORDER BY computed_at DESC
    LIMIT 1
  `;

  const clubValue = clubRow.rows.length > 0 ? Number(clubRow.rows[0].club_value) : null;

  // Get cohort stats — all clubs with this metric
  const cohort = await sql`
    SELECT
      COUNT(DISTINCT club_id) AS clubs_in_cohort,
      AVG(club_value) AS cohort_avg,
      PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY club_value) AS cohort_p25,
      PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY club_value) AS cohort_p75
    FROM (
      SELECT DISTINCT ON (club_id) club_id, club_value
      FROM club_benchmarks
      WHERE metric_key = ${metric}
      ORDER BY club_id, computed_at DESC
    ) latest
  `;

  const cohortRow = cohort.rows[0] || {};
  const clubsInCohort = Number(cohortRow.clubs_in_cohort || 0);

  // Calculate percentile rank for this club
  let percentileRank = null;
  if (clubValue !== null && clubsInCohort > 0) {
    const rank = await sql`
      SELECT COUNT(*) AS below
      FROM (
        SELECT DISTINCT ON (club_id) club_id, club_value
        FROM club_benchmarks
        WHERE metric_key = ${metric}
        ORDER BY club_id, computed_at DESC
      ) latest
      WHERE club_value < ${clubValue}
    `;
    const below = Number(rank.rows[0]?.below || 0);
    percentileRank = Math.round((below / clubsInCohort) * 100);
  }

  return res.status(200).json({
    club_id: clubId,
    metric,
    club_value: clubValue,
    cohort_avg: cohortRow.cohort_avg != null ? Math.round(Number(cohortRow.cohort_avg) * 100) / 100 : null,
    cohort_p25: cohortRow.cohort_p25 != null ? Math.round(Number(cohortRow.cohort_p25) * 100) / 100 : null,
    cohort_p75: cohortRow.cohort_p75 != null ? Math.round(Number(cohortRow.cohort_p75) * 100) / 100 : null,
    percentile_rank: percentileRank,
    clubs_in_cohort: clubsInCohort,
  });
}
