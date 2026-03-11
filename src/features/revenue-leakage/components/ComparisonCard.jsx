import { theme } from '@/config/theme';

export default function ComparisonCard({ fastData, slowData, delta }) {
  const roundedDelta = delta.toFixed(2);

  return (
    <div style={{
      background: theme.colors.cardBg,
      border: `2px solid ${theme.colors.border}`,
      borderRadius: 12,
      padding: theme.spacing.xl,
      boxShadow: '0 4px 12px rgba(31, 47, 36, 0.08)',
    }}>
      <h3 style={{
        fontSize: 18,
        fontWeight: 600,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.lg,
        textAlign: 'center',
      }}>
        How Revenue Leaks
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: theme.spacing.lg,
        alignItems: 'center',
      }} data-comparison-grid>
        {/* Fast Rounds Column */}
        <div style={{
          background: `linear-gradient(135deg, ${theme.colors.opportunity}10, ${theme.colors.opportunity}05)`,
          border: `2px solid ${theme.colors.opportunity}`,
          borderRadius: 12,
          padding: theme.spacing.lg,
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: theme.colors.opportunity,
            marginBottom: theme.spacing.md,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            ⚡ Fast Rounds
          </div>
          <div style={{
            fontSize: 13,
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing.md,
          }}>
            Under 4.5 hours
          </div>
          
          <MetricRow 
            label="Post-round dining" 
            value={`${(fastData.conversionRate * 100).toFixed(0)}%`}
            good
          />
          <MetricRow 
            label="Average check" 
            value={`$${fastData.avgCheck.toFixed(2)}`}
            good
          />
          <div style={{
            marginTop: theme.spacing.md,
            paddingTop: theme.spacing.md,
            borderTop: `1px solid ${theme.colors.opportunity}40`,
          }}>
            <div style={{
              fontSize: 12,
              color: theme.colors.textSecondary,
              marginBottom: 4,
            }}>
              Revenue per round
            </div>
            <div style={{
              fontSize: 24,
              fontWeight: 700,
              color: theme.colors.opportunity,
              fontFamily: theme.fonts.mono,
            }}>
              ${(fastData.conversionRate * fastData.avgCheck * 4).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Delta Arrow */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: theme.spacing.xs,
          padding: theme.spacing.sm,
          border: `1px solid ${theme.colors.risk}40`,
          borderRadius: theme.radius.md,
          background: `${theme.colors.risk}08`,
        }}>
          <div style={{
            fontSize: 24,
            color: theme.colors.risk,
          }}>
            →
          </div>
          <div style={{
            fontSize: 11,
            color: theme.colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
            textAlign: 'center',
          }}>
            Revenue lost per slow round
          </div>
          <div style={{
            fontSize: 32,
            fontWeight: 700,
            color: theme.colors.risk,
            fontFamily: theme.fonts.mono,
            lineHeight: 1.1,
          }}>
            ${roundedDelta}
          </div>
        </div>

        {/* Slow Rounds Column */}
        <div style={{
          background: `linear-gradient(135deg, ${theme.colors.risk}10, ${theme.colors.risk}05)`,
          border: `2px solid ${theme.colors.risk}`,
          borderRadius: 12,
          padding: theme.spacing.lg,
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: theme.colors.risk,
            marginBottom: theme.spacing.md,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            🐌 Slow Rounds
          </div>
          <div style={{
            fontSize: 13,
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing.md,
          }}>
            Over 4.5 hours
          </div>
          
          <MetricRow 
            label="Post-round dining" 
            value={`${(slowData.conversionRate * 100).toFixed(0)}%`}
            bad
          />
          <MetricRow 
            label="Average check" 
            value={`$${slowData.avgCheck.toFixed(2)}`}
            bad
          />
          <div style={{
            marginTop: theme.spacing.md,
            paddingTop: theme.spacing.md,
            borderTop: `1px solid ${theme.colors.risk}40`,
          }}>
            <div style={{
              fontSize: 12,
              color: theme.colors.textSecondary,
              marginBottom: 4,
            }}>
              Revenue per round
            </div>
            <div style={{
              fontSize: 24,
              fontWeight: 700,
              color: theme.colors.risk,
              fontFamily: theme.fonts.mono,
            }}>
              ${(slowData.conversionRate * slowData.avgCheck * 4).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-friendly stacked version */}
      <style>{`
        @media (max-width: 768px) {
          [data-comparison-grid] {
            grid-template-columns: 1fr !important;
            gap: ${theme.spacing.md} !important;
          }
          [data-comparison-grid] > div:nth-child(2) {
            order: 3;
            flex-direction: row !important;
          }
        }
      `}</style>
    </div>
  );
}

function MetricRow({ label, value, good, bad }) {
  const color = good ? theme.colors.opportunity : bad ? theme.colors.risk : theme.colors.textPrimary;
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: `${theme.spacing.xs} 0`,
      fontSize: 14,
    }}>
      <span style={{ color: theme.colors.textSecondary }}>
        {label}
      </span>
      <span style={{
        fontWeight: 600,
        fontFamily: theme.fonts.mono,
        color,
      }}>
        {value}
      </span>
    </div>
  );
}
