// operationsService.js — Phase 1 static · Phase 2 /api/operations
// Phase 2 swap: DataProvider calls _init() before render. All exports stay synchronous.

import { apiFetch } from './apiClient';
import { shouldUseStatic, getDataMode } from './demoGate';
import { isAuthenticatedClub } from '@/config/constants';
import { dailyRevenue } from '@/data/revenue';
import { paceDistribution, slowRoundStats, bottleneckHoles, paceFBImpact } from '@/data/pace';
import { waitlistEntries } from '@/data/pipeline';
import { todayTeeSheet, teeSheetSummary } from '@/data/teeSheet';

/**
 * @typedef {Object} DailyRevenueRow
 * @property {string} date                     YYYY-MM-DD
 * @property {number} golf
 * @property {number} fb
 * @property {string} [weather]
 * @property {boolean} [isUnderstaffed]
 */

/**
 * @typedef {Object} MonthlyRevenueSummary
 * @property {number} total
 * @property {number} golfTotal
 * @property {number} fbTotal
 * @property {number} dailyAvg
 * @property {number} weekendAvg
 * @property {number} weekdayAvg
 */

/**
 * @typedef {Object} SlowRoundStats
 * @property {number} totalRounds
 * @property {number} slowRounds
 * @property {number} overallRate              0-1
 * @property {number} weekendRate              0-1
 * @property {number} weekdayRate              0-1
 * @property {number} threshold                Minutes
 */

/**
 * @typedef {Object} BottleneckHole
 * @property {number} hole
 * @property {string} course
 * @property {number} avgDelay                 Minutes
 * @property {number} roundsAffected
 */

/**
 * @typedef {Object} PaceFBImpact
 * @property {number} fastConversionRate       0-1
 * @property {number} slowConversionRate       0-1
 * @property {number} avgCheckFast             Dollars
 * @property {number} avgCheckSlow             Dollars
 * @property {number} slowRoundsPerMonth
 * @property {number} revenueLostPerMonth      Dollars/month
 */

/**
 * @typedef {Object} TeeSheetRow
 * @property {string} time
 * @property {string} [memberId]
 * @property {string} [memberName]
 * @property {number} [players]
 * @property {string} [course]
 */

/**
 * @typedef {Object} TeeSheetSummary
 * @property {number} totalRounds
 * @property {number} weatherTemp
 * @property {string} weatherCondition
 */

let _d = null; // hydrated by _init()

// ── Guided data loader integration (Phase 1 — additive only) ──
import { registerService } from './guidedDataLoader';
export function _mergeData(partial) { _d = { ...(_d || {}), ...partial }; }
export function _resetData() { _d = null; }
registerService('operationsService', { mergeData: _mergeData, resetData: _resetData });
const DEFAULT_PACE_DISTRIBUTION = [
  { bucket: '< 3:45', minutes: 225, count: 142, isSlow: false },
  { bucket: '3:45-4:00', minutes: 240, count: 318, isSlow: false },
  { bucket: '4:00-4:15', minutes: 255, count: 496, isSlow: false },
  { bucket: '4:15-4:30', minutes: 270, count: 612, isSlow: false },
  { bucket: '4:30-4:45', minutes: 285, count: 388, isSlow: true },
  { bucket: '4:45-5:00', minutes: 300, count: 198, isSlow: true },
  { bucket: '5:00+', minutes: 315, count: 82, isSlow: true },
];
const DEFAULT_SLOW_ROUND_STATS = {
  totalRounds: 2236,
  slowRounds: 668,
  overallRate: 0.28,
  weekendRate: 0.38,
  weekdayRate: 0.19,
  threshold: 270,
};
const DEFAULT_BOTTLENECK_HOLES = [
  { hole: 4, course: 'Championship', avgDelay: 8.2, roundsAffected: 312 },
  { hole: 8, course: 'Championship', avgDelay: 7.6, roundsAffected: 287 },
  { hole: 12, course: 'Championship', avgDelay: 9.1, roundsAffected: 341 },
  { hole: 16, course: 'Championship', avgDelay: 6.8, roundsAffected: 261 },
];
const DEFAULT_PACE_FB_IMPACT = {
  fastConversionRate: 0.41,
  slowConversionRate: 0.22,
  avgCheckFast: 34.2,
  avgCheckSlow: 28.5,
  slowRoundsPerMonth: 668,
  revenueLostPerMonth: 5760,
};

const toNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const sanitizeRate = (value, fallback) => Math.max(0, Math.min(1, toNumber(value, fallback)));
const sanitizePositive = (value, fallback = 0) => Math.max(0, toNumber(value, fallback));
const toBucket = (value, fallback) => (typeof value === 'string' && value.trim() ? value.trim() : fallback);

export const _init = async () => {
  if (getDataMode() === 'guided') return; // guided mode — _mergeData populates _d
  try {
    const data = await apiFetch('/api/operations');
    if (data) _d = data;
  } catch { /* keep static fallback */ }
};

/** @returns {DailyRevenueRow[]} */
export const getRevenueByDay = () => {
  if (_d?.revenueByDay) return _d.revenueByDay;
  if (!shouldUseStatic('fb')) return [];
  return dailyRevenue;
};

/** @returns {MonthlyRevenueSummary} */
export const getMonthlyRevenueSummary = () => {
  if (_d?.monthlySummary) return _d.monthlySummary;
  const fbOpen = shouldUseStatic('fb');
  const teeOpen = shouldUseStatic('tee-sheet');
  if (!fbOpen && !teeOpen) return { total: 0, golfTotal: 0, fbTotal: 0, dailyAvg: 0, weekendAvg: 0, weekdayAvg: 0 };
  const golfTotal = teeOpen ? dailyRevenue.reduce((s, r) => s + (r.golf || 0), 0) : 0;
  const fbTotal = fbOpen ? dailyRevenue.reduce((s, r) => s + (r.fb || 0), 0) : 0;
  const total = golfTotal + fbTotal;
  const dailyAvg = dailyRevenue.length ? Math.round(total / dailyRevenue.length) : 0;
  return { total, golfTotal, fbTotal, dailyAvg, weekendAvg: 0, weekdayAvg: 0 };
};

const EMPTY_SLOW_ROUND = { totalRounds: 0, slowRounds: 0, overallRate: 0, weekendRate: 0, weekdayRate: 0, threshold: 270 };
/** @returns {SlowRoundStats} */
export const getSlowRoundRate = () => {
  if (_d?.slowRoundStats) {
    const source = _d.slowRoundStats;
    const totalRounds = Math.round(sanitizePositive(source?.totalRounds, DEFAULT_SLOW_ROUND_STATS.totalRounds));
    const slowRounds = Math.round(sanitizePositive(source?.slowRounds, DEFAULT_SLOW_ROUND_STATS.slowRounds));
    return {
      totalRounds,
      slowRounds: Math.min(totalRounds || slowRounds, slowRounds),
      overallRate: sanitizeRate(source?.overallRate, DEFAULT_SLOW_ROUND_STATS.overallRate),
      weekendRate: sanitizeRate(source?.weekendRate, DEFAULT_SLOW_ROUND_STATS.weekendRate),
      weekdayRate: sanitizeRate(source?.weekdayRate, DEFAULT_SLOW_ROUND_STATS.weekdayRate),
      threshold: sanitizePositive(source?.threshold, DEFAULT_SLOW_ROUND_STATS.threshold),
    };
  }
  if (!shouldUseStatic('pace')) return EMPTY_SLOW_ROUND;
  const source = (slowRoundStats ?? DEFAULT_SLOW_ROUND_STATS);
  const totalRounds = Math.round(sanitizePositive(source?.totalRounds, DEFAULT_SLOW_ROUND_STATS.totalRounds));
  const slowRounds = Math.round(sanitizePositive(source?.slowRounds, DEFAULT_SLOW_ROUND_STATS.slowRounds));
  return {
    totalRounds,
    slowRounds: Math.min(totalRounds || slowRounds, slowRounds),
    overallRate: sanitizeRate(source?.overallRate, DEFAULT_SLOW_ROUND_STATS.overallRate),
    weekendRate: sanitizeRate(source?.weekendRate, DEFAULT_SLOW_ROUND_STATS.weekendRate),
    weekdayRate: sanitizeRate(source?.weekdayRate, DEFAULT_SLOW_ROUND_STATS.weekdayRate),
    threshold: sanitizePositive(source?.threshold, DEFAULT_SLOW_ROUND_STATS.threshold),
  };
};

/** @returns {BottleneckHole[]} */
export const getBottleneckHoles = () => {
  if (_d?.bottleneckHoles) {
    const source = _d.bottleneckHoles;
    if (!Array.isArray(source) || source.length === 0) return DEFAULT_BOTTLENECK_HOLES;
    return source.map((item, index) => {
      const fallback = DEFAULT_BOTTLENECK_HOLES[index] ?? DEFAULT_BOTTLENECK_HOLES[DEFAULT_BOTTLENECK_HOLES.length - 1];
      return {
        hole: Math.max(1, Math.round(sanitizePositive(item?.hole, fallback.hole))),
        course: toBucket(item?.course, fallback.course),
        avgDelay: sanitizePositive(item?.avgDelay, fallback.avgDelay),
        roundsAffected: Math.round(sanitizePositive(item?.roundsAffected, fallback.roundsAffected)),
      };
    });
  }
  if (!shouldUseStatic('pace')) return [];
  const source = (bottleneckHoles ?? DEFAULT_BOTTLENECK_HOLES);
  if (!Array.isArray(source) || source.length === 0) return DEFAULT_BOTTLENECK_HOLES;
  return source.map((item, index) => {
    const fallback = DEFAULT_BOTTLENECK_HOLES[index] ?? DEFAULT_BOTTLENECK_HOLES[DEFAULT_BOTTLENECK_HOLES.length - 1];
    return {
      hole: Math.max(1, Math.round(sanitizePositive(item?.hole, fallback.hole))),
      course: toBucket(item?.course, fallback.course),
      avgDelay: sanitizePositive(item?.avgDelay, fallback.avgDelay),
      roundsAffected: Math.round(sanitizePositive(item?.roundsAffected, fallback.roundsAffected)),
    };
  });
};

const EMPTY_PACE_FB = { fastConversionRate: 0, slowConversionRate: 0, avgCheckFast: 0, avgCheckSlow: 0, slowRoundsPerMonth: 0, revenueLostPerMonth: 0 };
/** @returns {PaceFBImpact} */
export const getPaceFBImpact = () => {
  if (_d?.paceFBImpact) {
    const source = _d.paceFBImpact;
    return {
      fastConversionRate: sanitizeRate(source?.fastConversionRate, DEFAULT_PACE_FB_IMPACT.fastConversionRate),
      slowConversionRate: sanitizeRate(source?.slowConversionRate, DEFAULT_PACE_FB_IMPACT.slowConversionRate),
      avgCheckFast: sanitizePositive(source?.avgCheckFast, DEFAULT_PACE_FB_IMPACT.avgCheckFast),
      avgCheckSlow: sanitizePositive(source?.avgCheckSlow, DEFAULT_PACE_FB_IMPACT.avgCheckSlow),
      slowRoundsPerMonth: Math.round(sanitizePositive(source?.slowRoundsPerMonth, DEFAULT_PACE_FB_IMPACT.slowRoundsPerMonth)),
      revenueLostPerMonth: Math.round(sanitizePositive(source?.revenueLostPerMonth, DEFAULT_PACE_FB_IMPACT.revenueLostPerMonth)),
    };
  }
  if (!shouldUseStatic('pace')) return EMPTY_PACE_FB;
  const source = (paceFBImpact ?? DEFAULT_PACE_FB_IMPACT);
  return {
    fastConversionRate: sanitizeRate(source?.fastConversionRate, DEFAULT_PACE_FB_IMPACT.fastConversionRate),
    slowConversionRate: sanitizeRate(source?.slowConversionRate, DEFAULT_PACE_FB_IMPACT.slowConversionRate),
    avgCheckFast: sanitizePositive(source?.avgCheckFast, DEFAULT_PACE_FB_IMPACT.avgCheckFast),
    avgCheckSlow: sanitizePositive(source?.avgCheckSlow, DEFAULT_PACE_FB_IMPACT.avgCheckSlow),
    slowRoundsPerMonth: Math.round(sanitizePositive(source?.slowRoundsPerMonth, DEFAULT_PACE_FB_IMPACT.slowRoundsPerMonth)),
    revenueLostPerMonth: Math.round(sanitizePositive(source?.revenueLostPerMonth, DEFAULT_PACE_FB_IMPACT.revenueLostPerMonth)),
  };
};

// ── Tee Sheet ─────────────────────────────────────────────────

/** @returns {TeeSheetRow[]} */
export const getTodayTeeSheet = () => {
  if (_d?.todayTeeSheet) return _d.todayTeeSheet;
  if (!shouldUseStatic('tee-sheet')) return [];
  return todayTeeSheet;
};

/** @returns {TeeSheetSummary} */
export const getTeeSheetSummary = () => {
  if (_d?.teeSheetSummary) return _d.teeSheetSummary;
  if (!shouldUseStatic('tee-sheet')) return { totalRounds: 0, weatherTemp: 0, weatherCondition: '' };
  return teeSheetSummary;
};

export const sourceSystems = ['Tee Sheet', 'Weather API'];
