// revenueService.js — Pillar 3 (PROVE IT) revenue leakage attribution
// Connects pace-of-play, staffing, and weather data to dollar-quantified
// revenue leakage. Powers the Revenue page and the Today RevenueSummaryCard.

import { getPaceFBImpact, getBottleneckHoles, getSlowRoundRate } from './operationsService';
import { getUnderstaffedDays } from './staffingService';
import { getDailyForecast } from './weatherService';
import { weatherDaily as staticWeatherData } from '../data/weather';

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


// Weather no-show F&B loss — derived from forecast rainy/adverse day counts.
// Each rainy or high-wind day costs ~$400 in lost F&B from weather no-shows.
// Falls back to static weather data (src/data/weather.js) when no live forecast.
const AVG_DAILY_WEATHER_IMPACT = 400;

function getWeatherNoShowLoss() {
  // Try live forecast first (up to 30 days if available)
  const liveForecast = getDailyForecast(30);
  if (liveForecast && liveForecast.length >= 5) {
    const adverseDays = liveForecast.filter(d =>
      d.rain || (d.precipProb > 50) || (d.wind > 20) || d.condition === 'rainy'
    ).length;
    // Scale to monthly: if we have N days of forecast, extrapolate to 30
    const monthlyAdverse = Math.round(adverseDays * (30 / liveForecast.length));
    return monthlyAdverse * AVG_DAILY_WEATHER_IMPACT;
  }
  // Fall back to static weather data
  const rainyDays = staticWeatherData.filter(d => d.rain || d.condition === 'rainy' || d.wind > 20).length;
  return rainyDays * AVG_DAILY_WEATHER_IMPACT;
}

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
  const WEATHER_LOSS = (PACE_LOSS > 0 || STAFFING_LOSS > 0) ? getWeatherNoShowLoss() : 0;

  const TOTAL = PACE_LOSS + STAFFING_LOSS + WEATHER_LOSS;
  if (TOTAL === 0) return null;

  // Prior-month comparison requires actual historical data.
  // Only show delta when real prior-month data exists (not yet implemented).
  // Returning null signals the UI to hide the "vs last month" row.
  const PRIOR_MONTH_TOTAL = null;
  const MOM_DELTA = null;

  return {
    PACE_LOSS,
    STAFFING_LOSS,
    WEATHER_LOSS,
    TOTAL,
    PRIOR_MONTH_TOTAL,
    MOM_DELTA,
    sources: ['Tee Sheet', 'POS', 'Scheduling', 'Weather'],
  };
}

/**
 * getDollarPerSlowRound — the proprietary cross-domain metric.
 * "Every slow round that skips dining costs $X."
 * Computed from pace-FB conversion gap × average check.
 *
 * Computed from revenueLostPerMonth / slowRoundsPerMonth.
 * With the dining-conversion gap data ($5,177/mo / 668 slow rounds),
 * this yields ~$8/round. Fallback uses conversion-rate delta × avg check.
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

/** Average F&B check size from POS transaction data */
export function getAvgCheckSize() {
  const paceFB = getPaceFBImpact();
  return Math.round(paceFB.avgCheckFast || 34);
}
