import { theme } from '@/config/theme';

export default function BottleneckChart({ holes }) {
  const holesWithImpact = holes
    .map((hole) => ({
      ...hole,
      impact: parseFloat(hole.avgDelay) * hole.roundsAffected,
    }))
    .sort((a, b) => b.impact - a.impact);

  const maxImpact = Math.max(...holesWithImpact.map((hole) => hole.impact), 1);

  const getImpactColor = (impact) => {
    const ratio = impact / maxImpact;
    if (ratio > 0.8) return theme.colors.risk;
    if (ratio > 0.5) return theme.colors.warning;
    return theme.colors.info;
  };

  const getImpactLabel = (impact) => {
    const ratio = impact / maxImpact;
    if (ratio > 0.8) return 'HIGH';
    if (ratio > 0.5) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <div
      style={{
        background: theme.colors.cardBg,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 12,
        padding: theme.spacing.lg,
      }}
    >
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: theme.colors.textPrimary,
          marginBottom: theme.spacing.xs,
        }}
      >
        Bottleneck Holes by Impact
      </h3>
      <p
        style={{
          fontSize: 13,
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing.md,
        }}
      >
        Prioritize ranger coverage by impact score (avg delay x rounds affected).
      </p>

      <div style={{ display: 'grid', gap: theme.spacing.sm }}>
        {holesWithImpact.map((hole, index) => {
          const impactColor = getImpactColor(hole.impact);
          const impactLabel = getImpactLabel(hole.impact);
          const barWidth = Math.max((hole.impact / maxImpact) * 100, 6);
          return (
            <div
              key={hole.hole}
              style={{
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 10,
                padding: theme.spacing.sm,
                background: theme.colors.white,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  marginBottom: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: 999,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      color: theme.colors.textSecondary,
                      fontFamily: theme.fonts.mono,
                    }}
                  >
                    #{index + 1}
                  </span>
                  <span style={{ fontWeight: 700, color: theme.colors.textPrimary }}>Hole {hole.hole}</span>
                </div>
                <span
                  style={{
                    border: `1px solid ${impactColor}55`,
                    background: `${impactColor}14`,
                    color: impactColor,
                    borderRadius: 999,
                    padding: '3px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {impactLabel} impact
                </span>
              </div>

              <div
                style={{
                  height: 12,
                  borderRadius: 999,
                  background: theme.colors.bgSecondary,
                  overflow: 'hidden',
                  border: `1px solid ${theme.colors.borderLight}`,
                }}
              >
                <div
                  style={{
                    width: `${barWidth}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${impactColor}, ${impactColor}CC)`,
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px 14px',
                  fontSize: 12,
                  color: theme.colors.textSecondary,
                }}
              >
                <span>
                  Delay: <strong style={{ color: theme.colors.textPrimary, fontFamily: theme.fonts.mono }}>{hole.avgDelay} min</strong>
                </span>
                <span>
                  Rounds: <strong style={{ color: theme.colors.textPrimary, fontFamily: theme.fonts.mono }}>{hole.roundsAffected.toLocaleString()}</strong>
                </span>
                <span>
                  Score: <strong style={{ color: impactColor, fontFamily: theme.fonts.mono }}>{Math.round(hole.impact).toLocaleString()}</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
