/**
 * Data Flywheel aggregator (Phase A — agent framework plan).
 *
 * Rolls up the existing `interventions` table into weekly
 * `model_calibration_snapshots` rows. No LLM calls. No new agent. Just SQL.
 *
 * Why this exists:
 *   - Board Report needs week-over-week intervention effectiveness numbers
 *     that match imported data exactly (zero-fallback rule).
 *   - Member Pulse needs a way to detect score-model false positives so
 *     thresholds can be calibrated against real outcomes.
 *   - Chief of Staff needs aggregate context (this week vs last week saves)
 *     to summarise the agent platform's performance at a glance.
 *
 * The aggregator is idempotent — re-running the same week is a no-op via
 * the (club_id, week_start) UNIQUE constraint + ON CONFLICT update.
 *
 * Usage:
 *   import { aggregateClubWeek } from './flywheel-aggregator.js';
 *   await aggregateClubWeek(clubId, '2026-04-06'); // ISO Monday
 *
 *   // OR aggregate the most recent N weeks for a club
 *   await aggregateRecentWeeks(clubId, 12);
 */

import { sql } from '@vercel/postgres';

/**
 * Compute week_start (Monday) and week_end (Sunday) for a given date.
 */
function weekRange(dateStr) {
  const d = new Date(dateStr);
  // Monday=1 ... Sunday=0; shift Sunday to 7 then offset to Monday
  const day = d.getUTCDay() || 7;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - (day - 1));
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    week_start: monday.toISOString().slice(0, 10),
    week_end: sunday.toISOString().slice(0, 10),
  };
}

/**
 * Aggregate one club for one week. Returns the snapshot row (created or updated).
 */
export async function aggregateClubWeek(clubId, anchorDate) {
  const { week_start, week_end } = weekRange(anchorDate);

  // Pull intervention rollup for the week. Uses the deployed schema:
  // initiated_at, outcome_measured_at, is_member_save, dues_protected,
  // health_score_before, health_score_after.
  const { rows } = await sql`
    SELECT
      COUNT(*) FILTER (WHERE initiated_at::date BETWEEN ${week_start} AND ${week_end}) AS started,
      COUNT(*) FILTER (
        WHERE outcome_measured_at IS NOT NULL
        AND outcome_measured_at::date BETWEEN ${week_start} AND ${week_end}
      ) AS completed,
      COUNT(*) FILTER (WHERE is_member_save = TRUE
        AND outcome_measured_at::date BETWEEN ${week_start} AND ${week_end}) AS saves,
      COALESCE(SUM(dues_protected) FILTER (WHERE is_member_save = TRUE
        AND outcome_measured_at::date BETWEEN ${week_start} AND ${week_end}), 0) AS dues_protected,
      AVG(health_score_after - health_score_before) FILTER (
        WHERE health_score_before IS NOT NULL AND health_score_after IS NOT NULL
        AND outcome_measured_at::date BETWEEN ${week_start} AND ${week_end}
      ) AS avg_delta,
      COUNT(*) FILTER (
        WHERE is_member_save = FALSE
        AND health_score_after >= 70
        AND outcome_measured_at::date BETWEEN ${week_start} AND ${week_end}
      ) AS false_positives
    FROM interventions
    WHERE club_id = ${clubId}
  `;

  const r = rows[0] || {};
  const interventionsStarted = Number(r.started || 0);
  const interventionsCompleted = Number(r.completed || 0);
  const memberSaves = Number(r.saves || 0);
  const duesProtected = Number(r.dues_protected || 0);
  const avgDelta = r.avg_delta != null ? Number(r.avg_delta) : null;
  const falsePositives = Number(r.false_positives || 0);

  // Upsert. The (club_id, week_start) UNIQUE constraint makes this idempotent.
  const { rows: insertedRows } = await sql`
    INSERT INTO model_calibration_snapshots (
      club_id, week_start, week_end,
      interventions_started, interventions_completed,
      member_saves, dues_protected_total,
      avg_score_delta, false_positive_count
    ) VALUES (
      ${clubId}, ${week_start}, ${week_end},
      ${interventionsStarted}, ${interventionsCompleted},
      ${memberSaves}, ${duesProtected},
      ${avgDelta}, ${falsePositives}
    )
    ON CONFLICT (club_id, week_start) DO UPDATE SET
      interventions_started = EXCLUDED.interventions_started,
      interventions_completed = EXCLUDED.interventions_completed,
      member_saves = EXCLUDED.member_saves,
      dues_protected_total = EXCLUDED.dues_protected_total,
      avg_score_delta = EXCLUDED.avg_score_delta,
      false_positive_count = EXCLUDED.false_positive_count
    RETURNING *
  `;

  return insertedRows[0];
}

/**
 * Aggregate the most recent N weeks for a club. Useful as a one-shot
 * backfill or as a weekly cron's catch-up logic.
 */
export async function aggregateRecentWeeks(clubId, weeks = 12) {
  const out = [];
  const now = new Date();
  for (let i = 0; i < weeks; i++) {
    const anchor = new Date(now);
    anchor.setUTCDate(now.getUTCDate() - i * 7);
    const snapshot = await aggregateClubWeek(clubId, anchor.toISOString().slice(0, 10));
    out.push(snapshot);
  }
  return out;
}
