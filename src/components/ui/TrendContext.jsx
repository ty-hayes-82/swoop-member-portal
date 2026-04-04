// TrendContext — inline trend narrative for primary metrics.
import { getTrendNarrative } from '@/services/trendsService.js';

const ARROW = { up: '\u25B2', down: '\u25BC', flat: '\u2192' };

// When "up" is bad (e.g. slow round rate, complaints, at-risk count)
const INVERTED_METRICS = new Set([
  'slowRoundRate', 'complaintsPerMonth', 'atRiskMemberCount', 'resignationCount',
]);

export default function TrendContext({ metricKey, format = 'number', className = '' }) {
  const t = getTrendNarrative(metricKey, format);
  if (!t) return null;

  const isInverted = INVERTED_METRICS.has(metricKey);
  const isGood = isInverted ? t.direction === 'down' : t.direction === 'up';
  const isBad  = isInverted ? t.direction === 'up'   : t.direction === 'down';

  const arrowColorCls = isBad ? 'text-error-500' : isGood ? 'text-success-500' : 'text-gray-500';
  const streakColorCls = isBad ? 'text-warning-500' : isGood ? 'text-success-500' : 'text-gray-500';

  const sign = t.pctChange >= 0 ? '+' : '';
  const streakLabel = t.streak >= 3
    ? ` \u00B7 ${t.streak}-month ${isInverted
        ? (t.direction === 'up' ? 'deterioration' : 'improvement')
        : (t.direction === 'up' ? 'growth' : 'decline')}`
    : '';

  return (
    <div className={`flex items-center gap-1.5 text-xs text-gray-500 flex-wrap dark:text-gray-400 ${className}`}>
      <span className={`${arrowColorCls} font-bold`}>
        {ARROW[t.direction]} {sign}{typeof t.pctChange === 'number' && !isNaN(t.pctChange) ? Math.abs(t.pctChange).toFixed(0) : '\u2014'}%
      </span>
      <span>vs. {t.priorMonth}</span>
      {t.streak >= 2 && (
        <span className={streakColorCls}>
          {streakLabel}
        </span>
      )}
    </div>
  );
}
