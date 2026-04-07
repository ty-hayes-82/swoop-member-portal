// trendsService.js — Phase 1 static · Phase 2 /api/trends
// Narrative and chart helpers stay pure functions — they work on whatever data source is active.

import { apiFetch } from './apiClient';
import { isSourceLoaded } from './demoGate';
import { isAuthenticatedClub } from '@/config/constants';
import { trends as staticTrends, MONTHS as STATIC_MONTHS, outletTrends as staticOutletTrends } from '@/data/trends.js';

let _d = null; // { trends, outletTrends, months }

export const _init = async () => {
  try {
    const data = await apiFetch('/api/trends');
    if (data) _d = data;
  } catch { /* keep static fallback */ }
};

const _trends = () => _d ? _d.trends : {};
const _months = () => _d ? _d.months : [];

const FORMAT_FNS = {
  percent:  v => `${(v * 100).toFixed(0)}%`,
  currency: v => `$${(v / 1000).toFixed(0)}K`,
  number:   v => v.toLocaleString(),
};

export function getTrendNarrative(metricKey, format = 'number') {
  if (!isSourceLoaded('pipeline')) return null;
  const series = _trends()[metricKey];
  const months = _months();
  if (!series || series.length < 2) return null;
  const fmt       = FORMAT_FNS[format] ?? FORMAT_FNS.number;
  const current   = series[series.length - 1];
  const prior     = series[series.length - 2];
  const pctChange = prior !== 0 ? ((current - prior) / Math.abs(prior)) * 100 : 0;
  const direction = current > prior ? 'up' : current < prior ? 'down' : 'flat';
  let streak = 1;
  for (let i = series.length - 2; i > 0; i--) {
    if ((series[i] > series[i-1]) === (direction === 'up')) streak++;
    else break;
  }
  const totalChange = series[0] !== 0 ? ((current - series[0]) / Math.abs(series[0])) * 100 : 0;
  return {
    current, prior, direction, pctChange,
    priorMonth:   months[months.length - 2],
    oldestMonth:  months[0],
    streak, series, months,
    currentFormatted: fmt(current),
    priorFormatted:   fmt(prior),
    totalChange,
  };
}

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

export function getOutletTrendData(outletName) {
  const src = _d ? _d.outletTrends : {};
  const months = _months();
  const series = src?.[outletName];
  if (!series) return [];
  return months.map((month, i) => ({
    month, value: series[i] ?? 0, isCurrent: i === months.length - 1,
  }));
}
