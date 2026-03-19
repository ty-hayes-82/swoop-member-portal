import { theme } from '@/config/theme';
import { Panel } from '@/components/ui';

const mono = "'JetBrains Mono', monospace";

const archetypeRetention = [
  { name: 'Die-Hard Golfer',  rate: 96, trend: 'stable',    trendLabel: 'stable',         color: '#16a34a' },
  { name: 'Social Butterfly',  rate: 93, trend: 'improving', trendLabel: 'improving +3pp', color: '#16a34a' },
  { name: 'Balanced Active',   rate: 91, trend: 'stable',    trendLabel: 'stable',         color: '#16a34a' },
  { name: 'Snowbird',          rate: 88, trend: 'seasonal',  trendLabel: 'seasonal variance', color: '#d97706' },
  { name: 'Weekend Warrior',   rate: 84, trend: 'declining', trendLabel: '-2pp declining',  color: '#dc2626' },
  { name: 'New Member',        rate: 82, trend: 'declining', trendLabel: 'first-year risk', color: '#dc2626' },
  { name: 'Declining',         rate: 61, trend: 'declining', trendLabel: 'intervention priority', color: '#dc2626' },
  { name: 'Ghost',             rate: 42, trend: 'declining', trendLabel: 'highest churn',   color: '#dc2626' },
];

const tenureChurn = [
  { label: 'Year 1',   churn: 18, note: 'Highest risk period' },
  { label: 'Year 2-3', churn: 8,  note: 'Settling in' },
  { label: 'Year 4-7', churn: 4,  note: 'Established' },
  { label: 'Year 8+',  churn: 2,  note: 'Most loyal' },
];

function getRetentionBarColor(rate) {
  if (rate >= 90) return theme.colors.success || '#16a34a';
  if (rate >= 80) return theme.colors.warning || '#d97706';
  if (rate >= 60) return '#f97316';
  return theme.colors.urgent || '#dc2626';
}

function getTrendIcon(trend) {
  if (trend === 'improving') return '\u2191';
  if (trend === 'declining') return '\u2193';
  if (trend === 'seasonal') return '\u223C';
  return '\u2192';
}

export default function CohortTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      {/* Retention by Archetype */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
      }}>
        <h4 style={{ fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary, margin: 0, marginBottom: '4px' }}>
          Retention by Archetype
        </h4>
        <p style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, margin: 0, marginBottom: theme.spacing.md }}>
          12-month retention rate per behavioral archetype
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {archetypeRetention.map((a) => (
            <div key={a.name} style={{
              display: 'grid',
              gridTemplateColumns: '160px 1fr 80px 160px',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: theme.radius.sm,
              background: a.rate < 70 ? 'rgba(239,68,68,0.04)' : a.rate < 85 ? 'rgba(245,158,11,0.04)' : 'rgba(34,197,94,0.03)',
              border: `1px solid ${a.rate < 70 ? 'rgba(239,68,68,0.1)' : a.rate < 85 ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.08)'}`,
            }}>
              <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>{a.name}</span>
              <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  width: a.rate + '%',
                  height: '100%',
                  background: getRetentionBarColor(a.rate),
                  borderRadius: '5px',
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <span style={{ fontFamily: mono, fontSize: theme.fontSize.sm, fontWeight: 700, color: getRetentionBarColor(a.rate), textAlign: 'right' }}>
                {a.rate}%
              </span>
              <span style={{ fontSize: '12px', color: a.color, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '14px' }}>{getTrendIcon(a.trend)}</span>
                {a.trendLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Churn Risk by Tenure */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
      }}>
        <h4 style={{ fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary, margin: 0, marginBottom: '4px' }}>
          Churn Risk by Tenure
        </h4>
        <p style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, margin: 0, marginBottom: theme.spacing.md }}>
          Annual churn rate by membership duration
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: theme.spacing.sm }}>
          {tenureChurn.map((t) => {
            const isHighRisk = t.churn >= 10;
            const bgColor = isHighRisk ? 'rgba(239,68,68,0.06)' : t.churn >= 5 ? 'rgba(245,158,11,0.06)' : 'rgba(34,197,94,0.04)';
            const borderColor = isHighRisk ? 'rgba(239,68,68,0.15)' : t.churn >= 5 ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.1)';
            const valueColor = isHighRisk ? (theme.colors.urgent || '#dc2626') : t.churn >= 5 ? (theme.colors.warning || '#d97706') : (theme.colors.success || '#16a34a');

            return (
              <div key={t.label} style={{
                background: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                  {t.label}
                </div>
                <div style={{ fontFamily: mono, fontSize: '28px', fontWeight: 800, color: valueColor, lineHeight: 1.1 }}>
                  {t.churn}%
                </div>
                <div style={{ fontSize: '11px', color: theme.colors.textSecondary, marginTop: '6px', fontWeight: 500 }}>
                  {t.note}
                </div>
                {/* Mini bar */}
                <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '2px', marginTop: '10px', overflow: 'hidden' }}>
                  <div style={{
                    width: Math.min(t.churn * 5, 100) + '%',
                    height: '100%',
                    background: valueColor,
                    borderRadius: '2px',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Insight */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(59,130,246,0.04) 100%)',
        border: '1px solid rgba(139,92,246,0.15)',
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: theme.radius.sm,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', flexShrink: 0, border: '1px solid rgba(139,92,246,0.2)',
        }}>
          {'\uD83D\uDCA1'}
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgb(139,92,246)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
            Key Insight
          </div>
          <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, margin: 0, lineHeight: 1.7, fontWeight: 500 }}>
            New Members and Declining archetypes represent <strong>15% of membership</strong> but <strong>54% of churn</strong>.
            Focusing retention efforts on these two groups would reduce overall churn by <strong>40%</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
