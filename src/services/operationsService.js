// operationsService.js — Phase 1 static · Phase 2 /api/operations
// Phase 2 swap: DataProvider calls _init() before render. All exports stay synchronous.

import { dailyRevenue } from '@/data/revenue';
import { paceDistribution, slowRoundStats, bottleneckHoles, paceFBImpact } from '@/data/pace';
import { waitlistEntries } from '@/data/pipeline';

let _d = null; // hydrated by _init()

export const _init = async () => {
  try {
    const res = await fetch('/api/operations');
    if (res.ok) _d = await res.json();
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

export const getPaceDistribution = () => _d ? _d.paceDistribution : paceDistribution;
export const getSlowRoundRate    = () => _d ? _d.slowRoundStats    : slowRoundStats;
export const getBottleneckHoles  = () => _d ? _d.bottleneckHoles   : bottleneckHoles;
export const getPaceFBImpact     = () => _d ? _d.paceFBImpact      : paceFBImpact;

export const getDemandGaps = () =>
  _d ? _d.demandGaps
     : waitlistEntries.map(w => ({
         date: w.date, slot: w.slot,
         waitlistCount: w.count, eventOverlap: w.hasEventOverlap,
       }));

export const sourceSystems = ['Tee Sheet', 'Weather API'];
