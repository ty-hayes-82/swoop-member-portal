// operationsService.js — Phase 1 data access layer
// Phase 2: replace imports with fetch() calls. Shape stays identical.

import { dailyRevenue } from '@/data/revenue';
import { paceDistribution, slowRoundStats, bottleneckHoles, paceFBImpact } from '@/data/pace';
import { waitlistEntries } from '@/data/pipeline';

export const getRevenueByDay = () =>
  dailyRevenue.map(d => ({
    date: d.date,
    day: d.day,
    golf: d.golf,
    fb: d.fb,
    total: d.golf + d.fb,
    weather: d.weather,
    isUnderstaffed: d.isUnderstaffed,
  }));

export const getMonthlyRevenueSummary = () => {
  const data = dailyRevenue;
  const total = data.reduce((s, d) => s + d.golf + d.fb, 0);
  const weekendDays = data.filter(d => ['Sat', 'Sun'].includes(d.day));
  const weekdayDays = data.filter(d => !['Sat', 'Sun'].includes(d.day) && d.golf > 0);
  return {
    total,
    golfTotal: data.reduce((s, d) => s + d.golf, 0),
    fbTotal: data.reduce((s, d) => s + d.fb, 0),
    dailyAvg: Math.round(total / data.filter(d => d.golf > 0).length),
    weekendAvg: Math.round(weekendDays.reduce((s, d) => s + d.golf + d.fb, 0) / weekendDays.length),
    weekdayAvg: Math.round(weekdayDays.reduce((s, d) => s + d.golf + d.fb, 0) / weekdayDays.length),
  };
};

export const getPaceDistribution = () => paceDistribution;

export const getSlowRoundRate = () => slowRoundStats;

export const getBottleneckHoles = () => bottleneckHoles;

export const getDemandGaps = () =>
  waitlistEntries.map(w => ({
    date: w.date,
    slot: w.slot,
    waitlistCount: w.count,
    eventOverlap: w.hasEventOverlap,
  }));

export const getPaceFBImpact = () => paceFBImpact;
