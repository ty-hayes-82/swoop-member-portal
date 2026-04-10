// revenueService.js — Pillar 3 (PROVE IT) revenue leakage attribution
// Connects pace-of-play, staffing, and weather data to dollar-quantified
// revenue leakage. Powers the Revenue page and the Today RevenueSummaryCard.

import { getPaceFBImpact, getBottleneckHoles, getSlowRoundRate } from './operationsService';
import { getUnderstaffedDays } from './staffingService';

/**
 * @typedef {Object} LeakageData
 * @property {number} PACE_LOSS                Dollars per month lost to slow pace
 * @property {number} STAFFING_LOSS            Dollars per month lost to understaffing
 * @property {number} WEATHER_LOSS             Dollars per month lost to weather no-shows
 * @property {number} TOTAL                    Sum of the three buckets
 * @property {string[]} sources                Source system labels
 */

/**
 * @typedef {Object} RevenueScenario
 * @property {number} recoveredPace
 * @property {number} recoveredStaffing
 * @property {number} totalRecovery
 */

/**
 * @typedef {Object} BottleneckSummary
 * @property {number} hole
 * @property {string} course
 * @property {number} avgDelay                 Minutes
 * @property {number} roundsAffected
 * @property {number} fastConversionPct        0-100
 * @property {number} slowConversionPct        0-100
 * @property {number} dollarPerSlowRound
 */

/**
 * @typedef {Object} SlowRoundContext
 * @property {number} totalRounds
 * @property {number} slowRounds
 * @property {number} overallRate              0-1
 * @property {number} weekendRate              0-1
 */


// Static weather no-show estimate for demo. In production, derive from
// weather_events × cancelled bookings × avg dining check.
const WEATHER_NO_SHOW_LOSS_MONTHLY = 420;

/**
 * getLeakageData — returns the F&B revenue leakage decomposition.
 * Returns null when no relevant gates are open.
 *
 * Shape: { PACE_LOSS, STAFFING_LOSS, WEATHER_LOSS, TOTAL, sources: [...] }
 *
 * @returns {LeakageData|null}
 */
export function getLeakageData() {
  // Data-driven: underlying services return empty/zero when data isn't loaded,
  // so the math naturally produces null/zero — no explicit gate checks needed.
  const paceFB = getPaceFBImpact();
  const staffDays = getUnderstaffedDays();

  const PACE_LOSS = paceFB.revenueLostPerMonth || 0;
  const STAFFING_LOSS = staffDays.reduce((sum, day) => sum + (day.revenueLoss || 0), 0);
  const WEATHER_LOSS = (PACE_LOSS > 0 || STAFFING_LOSS > 0) ? WEATHER_NO_SHOW_LOSS_MONTHLY : 0;

  const TOTAL = PACE_LOSS + STAFFING_LOSS + WEATHER_LOSS;
  if (TOTAL === 0) return null;

  return {
    PACE_LOSS,
    STAFFING_LOSS,
    WEATHER_LOSS,
    TOTAL,
    sources: ['Tee Sheet', 'POS', 'Scheduling', 'Weather'],
  };
}

/**
 * getDollarPerSlowRound — the proprietary cross-domain metric.
 * "Every slow round that skips dining costs $X."
 * Computed from pace-FB conversion gap × average check.
 *
 * The storyboard quotes $31/round which factors in full revenue impact
 * (dining + lost food retail + lost beverage). The pure dining-conversion
 * delta computes lower (~$8). We use the full-impact figure for demo
 * since it represents end-to-end business impact, with a fallback to
 * the computed conversion gap for real-data clubs.
 *
 * @returns {number}
 */
export function getDollarPerSlowRound() {
  const paceFB = getPaceFBImpact();
  if (!paceFB || !paceFB.slowRoundsPerMonth) return 0;

  // Try total-impact derivation first: monthly loss / monthly slow rounds
  if (paceFB.revenueLostPerMonth && paceFB.slowRoundsPerMonth) {
    const computed = paceFB.revenueLostPerMonth / paceFB.slowRoundsPerMonth;
    if (Number.isFinite(computed) && computed > 0) {
      return Math.round(computed);
    }
  }

  // Fallback: dining-conversion delta × average check
  const fastValue = (paceFB.fastConversionRate || 0) * (paceFB.avgCheckFast || 0);
  const slowValue = (paceFB.slowConversionRate || 0) * (paceFB.avgCheckSlow || 0);
  return Math.round(fastValue - slowValue);
}

/**
 * getRevenueScenario — models recovery from a slow-round reduction.
 * @param {number} reductionPct — fraction (0-1) of slow rounds eliminated.
 * @returns {RevenueScenario}
 */
export function getRevenueScenario(reductionPct = 0) {
  const leakage = getLeakageData();
  if (!leakage) return { recoveredPace: 0, recoveredStaffing: 0, totalRecovery: 0 };

  // Pace recovery scales linearly with reduction
  const recoveredPace = Math.round(leakage.PACE_LOSS * reductionPct);

  // Staffing recovery: each 10% pace reduction also frees ~5% staffing pressure
  // (faster rounds → smoother dining flow → fewer understaffing emergencies)
  const recoveredStaffing = Math.round(leakage.STAFFING_LOSS * reductionPct * 0.5);

  return {
    recoveredPace,
    recoveredStaffing,
    totalRecovery: recoveredPace + recoveredStaffing,
  };
}

/**
 * getBottleneckSummary — primary bottleneck hole + drill-down data
 * @returns {BottleneckSummary|null}
 */
export function getBottleneckSummary() {
  const holes = getBottleneckHoles();
  if (!holes || holes.length === 0) return null;
  // Sort by avgDelay × roundsAffected to find highest-impact hole
  const sorted = [...holes].sort(
    (a, b) => (b.avgDelay * b.roundsAffected) - (a.avgDelay * a.roundsAffected)
  );
  const top = sorted[0];
  const paceFB = getPaceFBImpact();
  return {
    hole: top.hole,
    course: top.course,
    avgDelay: top.avgDelay,
    roundsAffected: top.roundsAffected,
    fastConversionPct: Math.round((paceFB.fastConversionRate || 0) * 100),
    slowConversionPct: Math.round((paceFB.slowConversionRate || 0) * 100),
    dollarPerSlowRound: getDollarPerSlowRound(),
  };
}

/**
 * getSlowRoundContext — overall slow-round stats for scenario modeling
 * @returns {SlowRoundContext}
 */
export function getSlowRoundContext() {
  const stats = getSlowRoundRate();
  return {
    totalRounds: stats?.totalRounds || 0,
    slowRounds: stats?.slowRounds || 0,
    overallRate: stats?.overallRate || 0,
    weekendRate: stats?.weekendRate || 0,
  };
}
