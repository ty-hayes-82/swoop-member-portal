// trendsService.js — exposes trend narratives and chart-ready data from trends.js
// This is the Phase 2 swap point: replace static imports with API fetch here.
// Ceiling: 200 lines. Target: 80 lines.
import { trends, MONTHS } from '@/data/trends.js';

const FORMAT_FNS = {
  percent:  v => `${(v * 100).toFixed(0)}%`,
  currency: v => `$${(v / 1000).toFixed(0)}K`,
  number:   v => v.toLocaleString(),
};

/**
 * getTrendNarrative(metricKey, format?)
 * Returns everything needed to render a trend line and narrative.
 */
export function getTrendNarrative(metricKey, format = 'number') {
  const series = trends[metricKey];
  if (!series || series.length < 2) return null;

  const fmt      = FORMAT_FNS[format] ?? FORMAT_FNS.number;
  const current  = series[series.length - 1];
  const prior    = series[series.length - 2];
  const priorMonth = MONTHS[MONTHS.length - 2];        // 'Dec'
  const oldestMonth = MONTHS[0];                       // 'Aug'

  const pctChange = prior !== 0 ? ((current - prior) / Math.abs(prior)) * 100 : 0;
  const direction = current > prior ? 'up' : current < prior ? 'down' : 'flat';

  // Count consecutive months moving same direction
  let streak = 1;
  for (let i = series.length - 2; i > 0; i--) {
    const movingUp   = series[i] > series[i - 1];
    const currentUp  = direction === 'up';
    if (movingUp === currentUp) streak++;
    else break;
  }

  // Total change from start of window
  const totalChange = series[0] !== 0 ? ((current - series[0]) / Math.abs(series[0])) * 100 : 0;

  return {
    current, prior, direction, pctChange, priorMonth, oldestMonth,
    streak, series, months: MONTHS,
    currentFormatted: fmt(current),
    priorFormatted:   fmt(prior),
    totalChange,
  };
}

/**
 * getTrendChartData(metricKey, format?)
 * Returns month-keyed array suitable for Recharts.
 */
export function getTrendChartData(metricKey) {
  const series = trends[metricKey];
  if (!series) return [];
  return MONTHS.map((month, i) => ({
    month,
    value: series[i] ?? 0,
    isCurrent: i === MONTHS.length - 1,
  }));
}

/**
 * getMultiSeriesTrendData(keys)
 * Returns a merged array for multi-line/grouped bar charts.
 * e.g. getMultiSeriesTrendData(['golfRevenue','fbRevenue'])
 */
export function getMultiSeriesTrendData(keys) {
  return MONTHS.map((month, i) => {
    const point = { month, isCurrent: i === MONTHS.length - 1 };
    keys.forEach(k => { point[k] = trends[k]?.[i] ?? 0; });
    return point;
  });
}
