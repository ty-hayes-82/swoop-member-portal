// operationsService.js — Phase 1 static · Phase 2 /api/operations
// Phase 2 swap: DataProvider calls _init() before render. All exports stay synchronous.

import { apiFetch } from './apiClient';
import { dailyRevenue } from '@/data/revenue';
import { paceDistribution, slowRoundStats, bottleneckHoles, paceFBImpact } from '@/data/pace';
import { waitlistEntries } from '@/data/pipeline';

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

export const getRevenueByDay = () =>
  _d ? _d.revenueByDay
     : dailyRevenue.map(d => ({
         date: d.date, day: d.day, golf: d.golf, fb: d.fb,
         total: d.golf + d.fb, weather: d.weather, isUnderstaffed: d.isUnderstaffed,
       }));

export const getMonthlyRevenueSummary = () => {
  if (_d) return _d.monthlySummary;
  const data = dailyRevenue;
  const total = data.reduce((s, d) => s + d.golf + d.fb, 0);
  const weekendDays = data.filter(d => ['Sat','Sun'].includes(d.day));
  const weekdayDays = data.filter(d => !['Sat','Sun'].includes(d.day) && d.golf > 0);
  return {
    total,
    golfTotal: data.reduce((s, d) => s + d.golf, 0),
    fbTotal:   data.reduce((s, d) => s + d.fb, 0),
    dailyAvg:  Math.round(total / data.filter(d => d.golf > 0).length),
    weekendAvg: Math.round(weekendDays.reduce((s, d) => s + d.golf + d.fb, 0) / weekendDays.length),
    weekdayAvg: Math.round(weekdayDays.reduce((s, d) => s + d.golf + d.fb, 0) / weekdayDays.length),
  };
};

export const getPaceDistribution = () => {
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
};

export const getSlowRoundRate = () => {
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

export const getDemandGaps = () =>
  _d ? _d.demandGaps
     : waitlistEntries.map(w => ({
         date: w.date, slot: w.slot,
         waitlistCount: w.count, eventOverlap: w.hasEventOverlap,
       }));

export const sourceSystems = ['Tee Sheet', 'Weather API'];
