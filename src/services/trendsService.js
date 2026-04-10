// trendsService.js — Phase 1 static · Phase 2 /api/trends
// Narrative and chart helpers stay pure functions — they work on whatever data source is active.

import { apiFetch } from './apiClient';
import { shouldUseStatic, getDataMode } from './demoGate';
import { trends as staticTrends, MONTHS as STATIC_MONTHS, outletTrends as staticOutletTrends } from '@/data/trends.js';

let _d = null; // { trends, outletTrends, months }

// ── Guided data loader integration (Phase 1 — additive only) ──
import { registerService } from './guidedDataLoader';
export function _mergeData(partial) { _d = { ...(_d || {}), ...partial }; }
export function _resetData() { _d = null; }
registerService('trendsService', { mergeData: _mergeData, resetData: _resetData });

export const _init = async () => {
  if (getDataMode() === 'guided') return; // guided mode — _mergeData populates _d
  try {
    const data = await apiFetch('/api/trends');
    if (data) _d = data;
  } catch { /* keep static fallback */ }
};

const _trends = () => _d?.trends ?? (shouldUseStatic('pipeline') ? staticTrends : {});
const _months = () => _d?.months ?? (shouldUseStatic('pipeline') ? STATIC_MONTHS : []);

export function getTrendChartData(metricKey) {
  const series = _trends()[metricKey];
  const months = _months();
  if (!series) return [];
  return months.map((month, i) => ({
    month, value: series[i] ?? 0, isCurrent: i === months.length - 1,
  }));
}

export function getMultiSeriesTrendData(keys) {
  const months = _months();
  return months.map((month, i) => {
    const point = { month, isCurrent: i === months.length - 1 };
    keys.forEach(k => { point[k] = _trends()[k]?.[i] ?? 0; });
    return point;
  });
}

