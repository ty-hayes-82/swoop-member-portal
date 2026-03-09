import { useMemo } from 'react';
import { Badge, SoWhatCallout, Sparkline, StatCard } from '@/components/ui';
import CancellationRiskRow from '@/features/pipeline/components/CancellationRiskRow';
import MemberLink from '@/components/MemberLink.jsx';
import { cancellationProbabilities } from '@/data/pipeline';
import { theme } from '@/config/theme';

const FORECAST_WINDOWS = [
  { key: '30d', label: '30 Days', multiplier: 1.0, weight: 0.52 },
  { key: '60d', label: '60 Days', multiplier: 1.8, weight: 0.35 },
  { key: '90d', label: '90 Days', multiplier: 2.3, weight: 0.13 },
];

function buildForecast(predictions) {
  const baseRevenueAtRisk = predictions
    .filter((p) => p.cancelProbability >= 0.45)
    .reduce((sum, p) => sum + p.estimatedRevenueLost, 0);

  return FORECAST_WINDOWS.map((window) => {
    const projectedCancellations = Math.round(
      predictions.reduce((sum, prediction) => sum + prediction.cancelProbability * window.weight, 0),
    );

    return {
      ...window,
      projectedCancellations,
      projectedRevenueAtRisk: Math.round(baseRevenueAtRisk * window.multiplier),
      preventablePct: Math.round(58 - window.multiplier * 8),
    };
  });
}

function buildTrend(prediction) {
  const p = prediction.cancelProbability;
  return [
    Math.max(0.05, p - 0.14),
    Math.max(0.05, p - 0.09),
    Math.max(0.05, p - 0.05),
    Math.max(0.05, p - 0.02),
    p,
  ];
}

function buildCountdown(index) {
  const base = 2 + (index % 5);
  return Math.max(1, base);
}

export default function PredictionsTab() {
  const predictions = useMemo(
    () => [...cancellationProbabilities].sort((a, b) => b.cancelProbability - a.cancelProbability),
    [],
  );

  const summary = useMemo(() => {
    const highRisk = predictions.filter((p) => p.cancelProbability >= 0.6);
    return {
      total: predictions.length,
      highRisk: highRisk.length,
      totalRevAtRisk: highRisk.reduce((sum, p) => sum + p.estimatedRevenueLost, 0),
      topDriver: 'Wind advisory + unresolved service friction',
    };
  }, [predictions]);

  const forecast = useMemo(() => buildForecast(predictions), [predictions]);
  const topRisk = predictions[0];

  const stats = [
    {
      label: 'Bookings Scored',
      value: summary.total,
      sparklineData: predictions.map((p) => Math.round(p.cancelProbability * 100)).reverse(),
      badge: { text: 'Forecast Window', variant: 'timeline' },
      source: 'Tee Sheet',
    },
    {
      label: 'High-Risk Cancellations',
      value: summary.highRisk,
      badge: { text: 'Immediate Action', variant: 'urgent' },
      sparklineData: predictions.slice(0, 6).map((p) => Math.round(p.cancelProbability * 100)).reverse(),
      source: 'Weather API',
    },
    {
      label: 'Revenue at Risk',
      value: summary.totalRevAtRisk,
      format: 'currency',
      badge: { text: 'If Unaddressed', variant: 'warning' },
      sparklineData: predictions.slice(0, 6).map((p) => p.estimatedRevenueLost).reverse(),
      source: 'POS',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: theme.spacing.md }}>
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div
        style={{
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          background: theme.colors.bgCard,
          boxShadow: theme.shadow.sm,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: theme.spacing.md,
            borderBottom: `1px solid ${theme.colors.border}`,
            background: theme.colors.bgDeep,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ color: theme.colors.textPrimary, fontWeight: 700, fontSize: theme.fontSize.sm }}>
              Cancellation Risk Scoring
            </div>
            <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>
              Ranked using weather, behavior drift, and unresolved service events.
            </div>
          </div>
          <Badge text={summary.topDriver} variant="effort" />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: theme.colors.bg }}>
                {['Member', 'Cancel Risk', 'Countdown', 'Last Activity', 'Trend'].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      textAlign: 'left',
                      color: theme.colors.textMuted,
                      fontSize: theme.fontSize.xs,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {predictions.map((prediction, index) => (
                <CancellationRiskRow
                  key={prediction.bookingId}
                  memberId={prediction.memberId}
                  memberName={prediction.memberName}
                  cancelProbability={prediction.cancelProbability}
                  daysUntilCancellation={buildCountdown(index)}
                  lastActivityDate={prediction.drivers?.[0] ?? 'Unknown'}
                  trend={buildTrend(prediction)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: theme.spacing.md }}>
        {forecast.map((item) => (
          <div
            key={item.key}
            style={{
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              background: theme.colors.bgCard,
              padding: theme.spacing.md,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <strong style={{ fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>{item.label}</strong>
              <Badge text={`${item.preventablePct}% preventable`} variant="success" size="sm" />
            </div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 8 }}>
              Projected cancellations: <strong>{item.projectedCancellations}</strong>
            </div>
            <div style={{ fontFamily: theme.fonts.mono, color: theme.colors.warning, fontWeight: 700 }}>
              ${item.projectedRevenueAtRisk.toLocaleString()} at risk
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          background: theme.colors.bgCard,
          padding: theme.spacing.md,
        }}
      >
        <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 4 }}>
          Cancellation Risk Trend (Top 6 bookings)
        </div>
        <div style={{ height: 48 }}>
          <Sparkline
            data={predictions.slice(0, 6).map((p) => Math.round(p.cancelProbability * 100)).reverse()}
            color={theme.colors.warning}
            height={48}
            showDots
          />
        </div>
      </div>

      <SoWhatCallout variant="insight">
        <strong>GM decision:</strong> intervene first on {topRisk ? (
          <MemberLink memberId={topRisk.memberId}>{topRisk.memberName}</MemberLink>
        ) : (
          <strong>the top-ranked member</strong>
        )} and pre-assign their likely
        cancellation slot to the highest-priority waitlist member. This converts forecasted churn volatility into
        protected play volume and retained spend.
      </SoWhatCallout>
    </div>
  );
}
