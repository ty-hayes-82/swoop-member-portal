// fbService.js — Phase 1 static · Phase 2 /api/fb

import { apiFetch } from './apiClient';
import { isAuthenticatedClub } from '@/config/constants';
import { outlets, postRoundConversion, rainDayImpact, fbMonthComparison } from '@/data/outlets';
import { dailyRevenue } from '@/data/revenue';

let _d = null;

export const _init = async () => {
  try {
    const data = await apiFetch('/api/fb');
    if (data) _d = data;
  } catch { /* keep static fallback */ }
};

export const getOutletPerformance = () => _d ? _d.outlets : isAuthenticatedClub() ? [] : outlets;

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const normalizeConversionEntries = (entries = []) =>
  entries.map((entry = {}) => ({
    archetype: entry.archetype ?? 'Unknown',
    rate: toNumber(entry.rate),
    avgCheck: Number.isFinite(Number(entry.avgCheck)) ? Number(entry.avgCheck) : null,
  }));

export const getPostRoundConversion = () => {
  if (!_d && isAuthenticatedClub()) return { overall: 0, byArchetype: [] };
  const source = _d?.postRoundConversion ?? postRoundConversion;

  if (!source) {
    return { overall: 0, byArchetype: [] };
  }

  if (Array.isArray(source)) {
    const byArchetype = normalizeConversionEntries(source);
    const overall = byArchetype.length
      ? byArchetype.reduce((sum, item) => sum + item.rate, 0) / byArchetype.length
      : 0;

    return { overall, byArchetype };
  }

  const byArchetype = normalizeConversionEntries(source.byArchetype);
  const overallFromApi = toNumber(source.overall, NaN);
  const fallbackOverall = byArchetype.length
    ? byArchetype.reduce((sum, item) => sum + item.rate, 0) / byArchetype.length
    : 0;

  return {
    overall: Number.isFinite(overallFromApi) ? overallFromApi : fallbackOverall,
    byArchetype,
  };
};

export const getRainDayImpact = () => {
  if (_d) return _d.rainDayImpact;
  if (isAuthenticatedClub()) return [];
  const avgGolf = dailyRevenue.filter(d => d.weather !== 'rainy' && d.golf > 0)
    .reduce((s, d) => s + d.golf, 0) /
    dailyRevenue.filter(d => d.weather !== 'rainy' && d.golf > 0).length;
  const avgFb = dailyRevenue.filter(d => d.weather !== 'rainy')
    .reduce((s, d) => s + d.fb, 0) /
    dailyRevenue.filter(d => d.weather !== 'rainy').length;
  return rainDayImpact.map(d => ({
    ...d,
    golfVsAvg: Math.round(((d.golfRevenue - avgGolf) / avgGolf) * 100),
    fbVsAvg:   Math.round(((d.fbRevenue   - avgFb)   / avgFb)   * 100),
  }));
};

export const getFBMonthComparison = () => {
  if (_d?.fbMonthComparison) return _d.fbMonthComparison;
  if (isAuthenticatedClub()) return [];
  return fbMonthComparison;
};

export const getMealPeriodBreakdown = () => {
  const src = _d ? _d.outlets : isAuthenticatedClub() ? [] : outlets;
  return src.flatMap(o =>
    (o.periods ?? []).map(p => ({
      outlet: o.outlet, period: p.period,
      revenue: p.revenue, covers: p.covers,
      avgCheck: p.covers > 0 ? +(p.revenue / p.covers).toFixed(2) : 0,
    }))
  );
};

export const getFBSummary = () => {
  if (_d) return _d.fbSummary;
  if (isAuthenticatedClub()) return { totalRevenue: 0, totalCovers: 0, understaffingLoss: 0, overallAvgCheck: 0 };
  return {
    totalRevenue:       outlets.reduce((s, o) => s + o.revenue, 0),
    totalCovers:        outlets.reduce((s, o) => s + o.covers, 0),
    understaffingLoss:  outlets.reduce((s, o) => s + Math.abs(o.understaffedImpact), 0),
    overallAvgCheck:    +(
      outlets.reduce((s, o) => s + o.revenue, 0) /
      outlets.reduce((s, o) => s + o.covers, 0)
    ).toFixed(2),
  };
};

export const sourceSystems = ['POS', 'Tee Sheet', 'Weather API'];
