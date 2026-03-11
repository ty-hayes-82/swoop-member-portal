import { theme } from '@/config/theme';

export default function BottleneckChart({ holes }) {
  // Calculate impact score (delay × rounds affected) and sort descending
  const holesWithImpact = holes.map(hole => ({
    ...hole,
    impact: parseFloat(hole.avgDelay) * hole.roundsAffected,
  })).sort((a, b) => b.impact - a.impact);

  const maxImpact = Math.max(...holesWithImpact.map(h => h.impact));

  // Color coding based on impact
  const getImpactColor = (impact) => {
    const ratio = impact / maxImpact;
    if (ratio > 0.8) return theme.colors.risk;
    if (ratio > 0.5) return '#F59E0B'; // warning amber
    return '#6BB8EF'; // info blue
  };

  const getImpactLabel = (impact) => {
    const ratio = impact / maxImpact;
    if (ratio > 0.8) return 'HIGH';
    if (ratio > 0.5) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <div style={{
      background: theme.colors.cardBg,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 12,
      padding: theme.spacing.lg,
    }}>
      <h3 style={{
        fontSize: 16,
        fontWeight: 600,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.md,
      }}>
        🎯 Bottleneck Holes (Ranked by Impact)
      </h3>
      <p style={{
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.lg,
      }}>
        Impact score = delay time × rounds affected. Target high-impact holes first for maximum revenue recovery.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        {holesWithImpact.map((hole, index) => {
          const impactPercent = (hole.impact / maxImpact) * 100;
          const impactColor = getImpactColor(hole.impact);
          const impactLabel = getImpactLabel(hole.impact);

          return (
            <div
              key={hole.hole}
              style={{
                background: 'white',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 8,
                padding: theme.spacing.md,
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(31, 47, 36, 0.08)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: theme.spacing.sm,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                  {/* Rank Badge */}
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: index === 0 ? impactColor : theme.colors.bgSecondary,
                    color: index === 0 ? 'white' : theme.colors.textSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 14,
                    fontFamily: theme.fonts.mono,
                  }}>
                    #{index + 1}
                  </div>

                  {/* Hole Info */}
                  <div>
                    <div style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: theme.colors.textPrimary,
                    }}>
                      Hole {hole.hole}
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: theme.colors.textSecondary,
                    }}>
                      {hole.course}
                    </div>
                  </div>
                </div>

                {/* Impact Badge */}
                <div style={{
                  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                  borderRadius: 6,
                  background: `${impactColor}20`,
                  border: `1px solid ${impactColor}40`,
                  fontSize: 11,
                  fontWeight: 700,
                  color: impactColor,
                  letterSpacing: 0.5,
                }}>
                  {impactLabel} IMPACT
                </div>
              </div>

              {/* Metrics */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: theme.spacing.md,
                marginBottom: theme.spacing.sm,
              }}>
                <Metric label="Avg Delay" value={`${hole.avgDelay} min`} />
                <Metric label="Rounds Affected" value={hole.roundsAffected.toLocaleString()} />
                <Metric 
                  label="Impact Score" 
                  value={Math.round(hole.impact).toLocaleString()} 
                  highlight 
                />
              </div>

              {/* Visual Bar */}
              <div style={{
                height: 24,
                background: theme.colors.bgSecondary,
                borderRadius: 6,
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div style={{
                  width: `${impactPercent}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${impactColor}, ${impactColor}CC)`,
                  transition: 'width 0.5s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: theme.spacing.sm,
                }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'white',
                    fontFamily: theme.fonts.mono,
                  }}>
                    {impactPercent.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 768px) {
          [data-metrics-grid] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function Metric({ label, value, highlight }) {
  return (
    <div data-metrics-grid>
      <div style={{
        fontSize: 11,
        color: theme.colors.textTertiary,
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 15,
        fontWeight: highlight ? 700 : 600,
        color: highlight ? theme.colors.textPrimary : theme.colors.textSecondary,
        fontFamily: theme.fonts.mono,
      }}>
        {value}
      </div>
    </div>
  );
}
