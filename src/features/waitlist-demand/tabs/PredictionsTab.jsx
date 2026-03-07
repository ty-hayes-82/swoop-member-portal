import { Badge, SoWhatCallout, Sparkline, StatCard } from '@/components/ui';
import {
  getCancellationPredictions,
  getCancellationSummary,
  getCancellationRiskSparkline,
} from '@/services/waitlistService';
import { theme } from '@/config/theme';

const PROBABILITY_COLOR = (probability) => {
  if (probability >= 0.65) return theme.colors.urgent;
  if (probability >= 0.45) return theme.colors.warning;
  return theme.colors.success;
};

const PROBABILITY_TIER = (probability) => {
  if (probability >= 0.65) return { text: 'High Risk', variant: 'urgent' };
  if (probability >= 0.45) return { text: 'Watch', variant: 'warning' };
  return { text: 'Stable', variant: 'success' };
};

function ProbabilityBar({ probability }) {
  const color = PROBABILITY_COLOR(probability);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: 999,
          overflow: 'hidden',
          background: theme.colors.bgDeep,
        }}
      >
        <div
          style={{
            width: `${Math.round(probability * 100)}%`,
            height: '100%',
            borderRadius: 999,
            background: color,
          }}
        />
      </div>
      <span style={{ minWidth: 36, textAlign: 'right', color, fontFamily: theme.fonts.mono, fontWeight: 700 }}>
        {Math.round(probability * 100)}%
      </span>
    </div>
  );
}

function PredictionRow({ prediction }) {
  const isHighRisk = prediction.cancelProbability >= 0.6;
  const riskTier = PROBABILITY_TIER(prediction.cancelProbability);

  return (
    <tr style={{ borderTop: `1px solid ${theme.colors.border}`, background: isHighRisk ? `${theme.colors.urgent}08` : 'transparent' }}>
      <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
        <div style={{ color: theme.colors.textPrimary, fontWeight: 600, fontSize: theme.fontSize.sm }}>
          {prediction.memberName}
        </div>
        <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>{prediction.teeTime}</div>
      </td>
      <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }}>
        {prediction.archetype}
      </td>
      <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, minWidth: 160 }}>
        <ProbabilityBar probability={prediction.cancelProbability} />
      </td>
      <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
        <Badge text={riskTier.text} variant={riskTier.variant} size="sm" />
      </td>
      <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }}>
        {prediction.recommendedAction}
      </td>
      <td
        style={{
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          textAlign: 'right',
          fontFamily: theme.fonts.mono,
          color: isHighRisk ? theme.colors.urgent : theme.colors.textMuted,
          fontSize: theme.fontSize.sm,
          fontWeight: 700,
        }}
      >
        ${prediction.estimatedRevenueLost.toLocaleString()}
      </td>
    </tr>
  );
}

export default function PredictionsTab() {
  const predictions = getCancellationPredictions();
  const summary = getCancellationSummary();
  const topRisk = predictions[0];

  const stats = [
    {
      label: 'Bookings Scored',
      value: summary.total,
      sparklineData: getCancellationRiskSparkline(),
      badge: { text: 'Forecast Window', variant: 'timeline' },
      source: 'ForeTees',
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
      source: 'Jonas POS',
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
              Weather + engagement + history signals ranked by cancellation probability.
            </div>
          </div>
          <Badge text={summary.topDriver} variant="effort" />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: theme.colors.bg }}>
                {['Member', 'Archetype', 'Cancel Risk', 'Tier', 'Recommended Action', 'Rev at Risk'].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      textAlign: heading === 'Rev at Risk' ? 'right' : 'left',
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
              {predictions.map((prediction) => (
                <PredictionRow key={prediction.bookingId} prediction={prediction} />
              ))}
            </tbody>
          </table>
        </div>
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
          <Sparkline data={getCancellationRiskSparkline()} color={theme.colors.warning} height={48} showDots />
        </div>
      </div>

      <SoWhatCallout variant="insight">
        <strong>GM decision:</strong> pre-confirm and personally intervene on <strong>{topRisk?.memberName}</strong> first.
        This booking has a <strong>{Math.round((topRisk?.cancelProbability ?? 0) * 100)}%</strong> cancellation likelihood,
        with ${topRisk?.estimatedRevenueLost?.toLocaleString() ?? 0} at immediate risk. Proactive outreach and
        pre-alerting the waitlist converts probable loss into retained play.
      </SoWhatCallout>
    </div>
  );
}
