import { getCorrelationInsights } from '@/services/experienceInsightsService';
import { theme } from '@/config/theme';

const impactColors = {
  high: theme.colors.urgent,
  medium: theme.colors.warning,
  low: theme.colors.textMuted,
};

export default function InsightCards({ onDeepDive }) {
  const insights = getCorrelationInsights().slice(0, 5);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: theme.spacing.md }}>
      {insights.map((insight) => (
        <div
          key={insight.id}
          style={{
            background: theme.colors.bgCard,
            borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.border}`,
            padding: theme.spacing.md,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {insight.domains.map((d) => (
              <span key={d} style={{
                fontSize: '9px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '1px 6px',
                borderRadius: '3px',
                background: `${theme.colors.accent}14`,
                color: theme.colors.accent,
              }}>
                {d}
              </span>
            ))}
          </div>
          <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.textPrimary, lineHeight: 1.3 }}>
            {insight.headline}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              display: 'inline-flex',
              padding: '3px 8px',
              borderRadius: '4px',
              background: `${impactColors[insight.impact]}12`,
              border: `1px solid ${impactColors[insight.impact]}30`,
              fontFamily: theme.fonts.mono,
              fontSize: '14px',
              fontWeight: 700,
              color: impactColors[insight.impact],
            }}>
              {insight.metric.value}
            </span>
            {onDeepDive && (
              <button
                onClick={() => onDeepDive()}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: theme.colors.accent,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Deep Dive →
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
