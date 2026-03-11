import { theme } from '@/config/theme';

export default function RecoveryCTA({ recoverableAmount, totalLoss, staffingTabAmount }) {
  const remainingGap = totalLoss - recoverableAmount;
  const recoverablePercent = ((recoverableAmount / totalLoss) * 100).toFixed(0);
  const remainingPercent = ((remainingGap / totalLoss) * 100).toFixed(0);

  return (
    <div style={{
      background: `linear-gradient(135deg, ${theme.colors.opportunity}15, ${theme.colors.opportunity}08)`,
      border: `3px solid ${theme.colors.opportunity}`,
      borderRadius: 16,
      padding: theme.spacing.xl,
      boxShadow: '0 8px 24px rgba(74, 222, 128, 0.15)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.lg }}>
        {/* Icon */}
        <div style={{
          fontSize: 48,
          lineHeight: 1,
          flexShrink: 0,
        }}>
          💡
        </div>

        <div style={{ flex: 1 }}>
          {/* Headline */}
          <h3 style={{
            fontSize: 22,
            fontWeight: 700,
            color: theme.colors.textPrimary,
            marginBottom: theme.spacing.md,
            lineHeight: 1.3,
          }}>
            Recover ${recoverableAmount.toLocaleString()}/month with ranger deployment
          </h3>

          {/* Visual Breakdown */}
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
          }}>
            {/* Progress Bar */}
            <div style={{
              display: 'flex',
              height: 48,
              borderRadius: 8,
              overflow: 'hidden',
              marginBottom: theme.spacing.md,
              border: `1px solid ${theme.colors.border}`,
            }}>
              <div style={{
                width: `${recoverablePercent}%`,
                background: `linear-gradient(135deg, ${theme.colors.opportunity}, ${theme.colors.opportunity}CC)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1F2F24',
                fontWeight: 700,
                fontSize: 14,
                fontFamily: theme.fonts.mono,
              }}>
                ${recoverableAmount.toLocaleString()}
              </div>
              <div style={{
                width: `${remainingPercent}%`,
                background: `linear-gradient(135deg, ${theme.colors.textTertiary}40, ${theme.colors.textTertiary}20)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.colors.textSecondary,
                fontWeight: 600,
                fontSize: 14,
                fontFamily: theme.fonts.mono,
              }}>
                ${remainingGap.toLocaleString()}
              </div>
            </div>

            {/* Legend */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: theme.spacing.md,
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  marginBottom: 4,
                }}>
                  <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    background: theme.colors.opportunity,
                  }} />
                  <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: theme.colors.textPrimary,
                  }}>
                    Recoverable via Pace Management
                  </span>
                </div>
                <div style={{
                  fontSize: 12,
                  color: theme.colors.textSecondary,
                  paddingLeft: 20,
                }}>
                  Deploy rangers on bottleneck holes
                </div>
              </div>
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  marginBottom: 4,
                }}>
                  <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    background: theme.colors.textTertiary,
                    opacity: 0.4,
                  }} />
                  <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: theme.colors.textPrimary,
                  }}>
                    Remaining Gap
                  </span>
                </div>
                <div style={{
                  fontSize: 12,
                  color: theme.colors.textSecondary,
                  paddingLeft: 20,
                }}>
                  Addressable via Staffing optimization (see tab 2)
                </div>
              </div>
            </div>
          </div>

          {/* Explanation Text */}
          <p style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing.lg,
          }}>
            <strong style={{ color: theme.colors.textPrimary }}>Target holes 4, 8, 12, and 16</strong> during peak times (Sat/Sun 8am-11am). 
            Rangers can reduce average delays by 15 minutes, recovering approximately <strong style={{ color: theme.colors.opportunity }}>{recoverablePercent}%</strong> of 
            pace-related F&B losses. The remaining ${remainingGap.toLocaleString()} is addressable through staffing and scheduling optimization.
          </p>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: theme.spacing.md,
            flexWrap: 'wrap',
          }}>
            <button style={{
              background: `linear-gradient(135deg, ${theme.colors.opportunity}, ${theme.colors.opportunity}DD)`,
              color: '#1F2F24',
              fontWeight: 700,
              fontSize: 15,
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              boxShadow: `0 4px 12px ${theme.colors.opportunity}40`,
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 6px 16px ${theme.colors.opportunity}50`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${theme.colors.opportunity}40`;
            }}
            >
              📋 Approve Ranger Schedule
            </button>
            <button style={{
              background: 'white',
              color: theme.colors.textPrimary,
              fontWeight: 600,
              fontSize: 15,
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              borderRadius: 8,
              border: `2px solid ${theme.colors.border}`,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = theme.colors.bgSecondary;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'white';
            }}
            >
              👁️ View Staffing Tab
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
