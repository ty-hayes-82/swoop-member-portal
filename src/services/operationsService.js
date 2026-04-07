// operationsService.js — Phase 1 static · Phase 2 /api/operations
// Phase 2 swap: DataProvider calls _init() before render. All exports stay synchronous.

import { apiFetch } from './apiClient';
import { shouldUseStatic } from './demoGate';
import { isAuthenticatedClub } from '@/config/constants';
import { dailyRevenue } from '@/data/revenue';
import { paceDistribution, slowRoundStats, bottleneckHoles, paceFBImpact } from '@/data/pace';
import { waitlistEntries } from '@/data/pipeline';
import { todayTeeSheet, teeSheetSummary } from '@/data/teeSheet';

let _d = null; // hydrated by _init()
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
  try {
    const data = await apiFetch('/api/operations');
    if (data) _d = data;
  } catch { /* keep static fallback */ }
};

export const getRevenueByDay = () => {
  if (_d) return _d.revenueByDay;
  if (!shouldUseStatic('fb')) return [];
  return dailyRevenue;
};

export const getMonthlyRevenueSummary = () => {
  if (_d) return _d.monthlySummary;
  return { total: 0, golfTotal: 0, fbTotal: 0, dailyAvg: 0, weekendAvg: 0, weekdayAvg: 0 };
};

export const getPaceDistribution = () => {
  if (_d) {
    const source = (_d?.paceDistribution ?? paceDistribution ?? DEFAULT_PACE_DISTRIBUTION);
    if (!Array.isArray(source) || source.length === 0) return DEFAULT_PACE_DISTRIBUTION;
    return source.map((item, index) => {
      const fallback = DEFAULT_PACE_DISTRIBUTION[index] ?? DEFAULT_PACE_DISTRIBUTION[DEFAULT_PACE_DISTRIBUTION.length - 1];
      return {
        bucket: toBucket(item?.bucket, fallback.bucket),
        minutes: sanitizePositive(item?.minutes, fallback.minutes),
        count: Math.round(sanitizePositive(item?.count, fallback.count)),
        isSlow: typeof item?.isSlow === 'boolean' ? item.isSlow : fallback.isSlow,
      };
    });
  }
  if (!shouldUseStatic('pace')) return [];
  return paceDistribution ?? DEFAULT_PACE_DISTRIBUTION;
};

export const getSlowRoundRate = () => {
  if (!_d && !shouldUseStatic('pace')) return { totalRounds: 0, slowRounds: 0, overallRate: 0, weekendRate: 0, weekdayRate: 0, threshold: 270 };
  const source = (_d?.slowRoundStats ?? slowRoundStats ?? DEFAULT_SLOW_ROUND_STATS);
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

export const getBottleneckHoles = () => {
  if (!_d && !shouldUseStatic('pace')) return [];
  const source = (_d?.bottleneckHoles ?? bottleneckHoles ?? DEFAULT_BOTTLENECK_HOLES);
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

export const getPaceFBImpact = () => {
  if (!_d && !shouldUseStatic('pace')) return { fastConversionRate: 0, slowConversionRate: 0, avgCheckFast: 0, avgCheckSlow: 0, slowRoundsPerMonth: 0, revenueLostPerMonth: 0 };
  const source = (_d?.paceFBImpact ?? paceFBImpact ?? DEFAULT_PACE_FB_IMPACT);
  return {
    fastConversionRate: sanitizeRate(source?.fastConversionRate, DEFAULT_PACE_FB_IMPACT.fastConversionRate),
    slowConversionRate: sanitizeRate(source?.slowConversionRate, DEFAULT_PACE_FB_IMPACT.slowConversionRate),
    avgCheckFast: sanitizePositive(source?.avgCheckFast, DEFAULT_PACE_FB_IMPACT.avgCheckFast),
    avgCheckSlow: sanitizePositive(source?.avgCheckSlow, DEFAULT_PACE_FB_IMPACT.avgCheckSlow),
    slowRoundsPerMonth: Math.round(sanitizePositive(source?.slowRoundsPerMonth, DEFAULT_PACE_FB_IMPACT.slowRoundsPerMonth)),
    revenueLostPerMonth: Math.round(sanitizePositive(source?.revenueLostPerMonth, DEFAULT_PACE_FB_IMPACT.revenueLostPerMonth)),
  };
};

export const getDemandGaps = () => {
  if (_d) return _d.demandGaps;
  if (isAuthenticatedClub()) return [];
  return waitlistEntries.map(w => ({
    date: w.date, slot: w.slot,
    waitlistCount: w.count, eventOverlap: w.hasEventOverlap,
  }));
};

// ── Tee Sheet ─────────────────────────────────────────────────

export const getTodayTeeSheet = () => {
  if (!shouldUseStatic('tee-sheet') && !_d) return [];
  return _d?.todayTeeSheet ?? todayTeeSheet;
};

export const getTeeSheetSummary = () => {
  if (!shouldUseStatic('tee-sheet') && !_d) return { totalRounds: 0, weatherTemp: 0, weatherCondition: '' };
  return _d?.teeSheetSummary ?? teeSheetSummary;
};

export const sourceSystems = ['Tee Sheet', 'Weather API'];
