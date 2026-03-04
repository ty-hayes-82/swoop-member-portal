// fbService.js — Phase 1 data access layer

import { outlets, postRoundConversion, rainDayImpact } from '@/data/outlets';
import { dailyRevenue } from '@/data/revenue';

export const getOutletPerformance = () => outlets;

export const getPostRoundConversion = () => postRoundConversion;

export const getRainDayImpact = () => {
  const avgGolf = dailyRevenue
    .filter(d => d.weather !== 'rainy' && d.golf > 0)
    .reduce((s, d) => s + d.golf, 0) / dailyRevenue.filter(d => d.weather !== 'rainy' && d.golf > 0).length;

  const avgFb = dailyRevenue
    .filter(d => d.weather !== 'rainy')
    .reduce((s, d) => s + d.fb, 0) / dailyRevenue.filter(d => d.weather !== 'rainy').length;

  return rainDayImpact.map(d => ({
    ...d,
    golfVsAvg: Math.round(((d.golfRevenue - avgGolf) / avgGolf) * 100),
    fbVsAvg: Math.round(((d.fbRevenue - avgFb) / avgFb) * 100),
  }));
};

export const getMealPeriodBreakdown = () =>
  outlets.flatMap(o =>
    o.periods.map(p => ({
      outlet: o.outlet,
      period: p.period,
      revenue: p.revenue,
      covers: p.covers,
      avgCheck: p.covers > 0 ? +(p.revenue / p.covers).toFixed(2) : 0,
    }))
  );

export const getFBSummary = () => ({
  totalRevenue: outlets.reduce((s, o) => s + o.revenue, 0),
  totalCovers: outlets.reduce((s, o) => s + o.covers, 0),
  understaffingLoss: outlets.reduce((s, o) => s + Math.abs(o.understaffedImpact), 0),
  overallAvgCheck: +(
    outlets.reduce((s, o) => s + o.revenue, 0) /
    outlets.reduce((s, o) => s + o.covers, 0)
  ).toFixed(2),
});
