// fbService.js — Phase 1 static · Phase 2 /api/fb
// V4: All modes use live DB data via _init(). No static fallback.

import { apiFetch } from './apiClient';

let _d = null;

export const _init = async () => {
  try {
    const data = await apiFetch('/api/fb');
    if (data) _d = data;
  } catch { /* keep empty fallback */ }
};

export const getOutletPerformance = () => _d ? _d.outlets : [];

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
  if (!_d) return { overall: 0, byArchetype: [] };
  const source = _d.postRoundConversion;

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
  return [];
};

export const getFBMonthComparison = () => {
  if (_d?.fbMonthComparison) return _d.fbMonthComparison;
  return [];
};

export const getMealPeriodBreakdown = () => {
  const src = _d ? _d.outlets : [];
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
  return { totalRevenue: 0, totalCovers: 0, understaffingLoss: 0, overallAvgCheck: 0 };
};

export const sourceSystems = ['POS', 'Tee Sheet', 'Weather API'];
