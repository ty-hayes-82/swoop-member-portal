import { theme } from '@/config/theme';

export default function BreakdownChart({ totalLoss, paceAmount, staffingAmount, weatherAmount }) {
  const MIN_SEGMENT_PERCENT = 10;
  const categories = [
    {
      key: 'pace',
      label: 'Pace-of-Play Impact',
      amount: paceAmount,
      color: theme.colors.operations,
      icon: '⚡',
    },
    {
      key: 'staffing',
      label: 'Staffing Gaps',
      amount: staffingAmount,
      color: theme.colors.staffing,
      icon: '👥',
    },
    {
      key: 'weather',
      label: 'Weather Shifts',
      amount: weatherAmount,
      color: theme.colors.info,
      icon: '🌦️',
    },
  ].sort((a, b) => b.amount - a.amount); // Sort by amount descending

  const rawPercents = categories.map((cat) => (cat.amount / totalLoss) * 100);
  const boostedPercents = rawPercents.map((percent) => Math.max(percent, MIN_SEGMENT_PERCENT));
  const boostedTotal = boostedPercents.reduce((sum, value) => sum + value, 0);
  const normalizedPercents = boostedPercents.map((percent) => (percent / boostedTotal) * 100);

  return (
    <div style={{
      background: theme.colors.cardBg,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 12,
      padding: theme.spacing.lg,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
      }}>
        <div>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            color: theme.colors.textPrimary,
            marginBottom: 4,
          }}>
            Revenue Leakage Breakdown
          </h3>
          <p style={{
            fontSize: 13,
            color: theme.colors.textSecondary,
            margin: 0,
          }}>
            How ${ totalLoss.toLocaleString()}/month breaks down across operational categories
          </p>
        </div>
        <div style={{
          fontSize: 32,
          fontWeight: 700,
          color: theme.colors.risk,
          fontFamily: theme.fonts.mono,
        }}>
          ${totalLoss.toLocaleString()}
        </div>
      </div>

      {/* Stacked Bar */}
      <div style={{
        height: 64,
        background: theme.colors.bgSecondary,
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        marginBottom: theme.spacing.lg,
        border: `1px solid ${theme.colors.border}`,
      }}>
        {categories.map((cat, index) => {
          const widthPercent = normalizedPercents[index];
          const actualPercent = (cat.amount / totalLoss) * 100;
          return (
            <div
              key={cat.key}
              style={{
                width: `${widthPercent}%`,
                background: `linear-gradient(135deg, ${cat.color}, ${cat.color}CC)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                borderLeft: index > 0 ? `2px solid ${theme.colors.white}` : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: cat.key === 'weather' ? 72 : undefined,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.filter = 'brightness(1.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              <span style={{
                fontSize: 20,
                marginBottom: 2,
              }}>
                {cat.icon}
              </span>
              <span style={{
                fontSize: 14,
                fontWeight: 700,
                color: theme.colors.white,
                fontFamily: theme.fonts.mono,
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }}>
                ${cat.amount.toLocaleString()}
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: theme.colors.white,
                fontFamily: theme.fonts.mono,
                opacity: 0.9,
              }}>
                {actualPercent.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: theme.spacing.md,
      }}>
        {categories.map((cat) => {
          const percent = ((cat.amount / totalLoss) * 100).toFixed(0);
          return (
            <div
              key={cat.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: theme.spacing.sm,
                background: 'white',
                borderRadius: 8,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${cat.color}20, ${cat.color}10)`,
                border: `2px solid ${cat.color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                flexShrink: 0,
              }}>
                {cat.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: theme.colors.textPrimary,
                  marginBottom: 2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {cat.label}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: theme.spacing.xs,
                }}>
                  <span style={{
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: theme.fonts.mono,
                    color: cat.color,
                  }}>
                    ${cat.amount.toLocaleString()}
                  </span>
                  <span style={{
                    fontSize: 12,
                    color: theme.colors.textTertiary,
                  }}>
                    ({percent}%)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
