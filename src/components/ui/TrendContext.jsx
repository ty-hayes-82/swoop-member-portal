// TrendContext — inline trend narrative for primary metrics.
// "28% · up from 22% in Nov · 3-month trend"
// Props: metricKey (string), format ('percent'|'currency'|'number')
// Ceiling: 150 lines. Target: 60 lines.
import { getTrendNarrative } from '@/services/trendsService.js';
import { theme } from '@/config/theme.js';

const ARROW = { up: '▲', down: '▼', flat: '→' };

// When "up" is bad (e.g. slow round rate, complaints, at-risk count)
const INVERTED_METRICS = new Set([
  'slowRoundRate', 'complaintsPerMonth', 'atRiskMemberCount', 'resignationCount',
]);

export default function TrendContext({ metricKey, format = 'number', style = {} }) {
  const t = getTrendNarrative(metricKey, format);
  if (!t) return null;

  const isInverted = INVERTED_METRICS.has(metricKey);
  const isGood = isInverted ? t.direction === 'down' : t.direction === 'up';
  const isBad  = isInverted ? t.direction === 'up'   : t.direction === 'down';

  const arrowColor = isBad  ? theme.colors.urgent
    : isGood ? theme.colors.success
    : theme.colors.textMuted;

  const sign = t.pctChange >= 0 ? '+' : '';
  const streakLabel = t.streak >= 3
    ? ` · ${t.streak}-month ${isInverted
        ? (t.direction === 'up' ? 'deterioration' : 'improvement')
        : (t.direction === 'up' ? 'growth' : 'decline')}`
    : '';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
      flexWrap: 'wrap', ...style,
    }}>
      <span style={{ color: arrowColor, fontWeight: 700 }}>
        {ARROW[t.direction]} {sign}{Math.abs(t.pctChange).toFixed(0)}%
      </span>
      <span>vs. {t.priorMonth}</span>
      {t.streak >= 2 && (
        <span style={{ color: isBad ? theme.colors.warning : isGood ? theme.colors.success : theme.colors.textMuted }}>
          {streakLabel}
        </span>
      )}
    </div>
  );
}
