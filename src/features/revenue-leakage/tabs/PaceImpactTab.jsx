import { theme } from '@/config/theme';
import { paceFBImpact, slowRoundStats, bottleneckHoles } from '@/data/pace';

export default function PaceImpactTab() {
  const {
    fastConversionRate,
    slowConversionRate,
    avgCheckFast,
    avgCheckSlow,
    slowRoundsPerMonth,
    revenueLostPerMonth,
  } = paceFBImpact;

  const conversionDrop = ((fastConversionRate - slowConversionRate) / fastConversionRate * 100).toFixed(0);
  const checkDrop = ((avgCheckFast - avgCheckSlow) / avgCheckFast * 100).toFixed(0);

  return (
    <div style={{ padding: theme.spacing.md, display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Summary Card */}
      <div style={{
        background: theme.colors.cardBg,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 8,
        padding: theme.spacing.lg,
      }}>
        <h3 style={{
          fontSize: 18,
          fontWeight: 600,
          color: theme.colors.textPrimary,
          marginBottom: theme.spacing.md,
        }}>
          Slow Rounds = Lost Dining Revenue
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: theme.spacing.md,
        }}>
          <MetricCard
            label="Slow rounds in January"
            value={slowRoundsPerMonth.toLocaleString()}
            sublabel={`${(slowRoundStats.overallRate * 100).toFixed(0)}% of all rounds`}
          />
          <MetricCard
            label="Post-round conversion drop"
            value={`${conversionDrop}%`}
            sublabel={`${(fastConversionRate * 100).toFixed(0)}% → ${(slowConversionRate * 100).toFixed(0)}% after slow rounds`}
          />
          <MetricCard
            label="Average check drop"
            value={`${checkDrop}%`}
            sublabel={`$${avgCheckFast.toFixed(2)} → $${avgCheckSlow.toFixed(2)} per person`}
          />
          <MetricCard
            label="Monthly revenue lost"
            value={`$${revenueLostPerMonth.toLocaleString()}`}
            sublabel="Fixable through pace management"
            highlight
          />
        </div>
      </div>

      {/* The Math */}
      <div style={{
        background: theme.colors.cardBg,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 8,
        padding: theme.spacing.lg,
      }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 600,
          color: theme.colors.textPrimary,
          marginBottom: theme.spacing.md,
        }}>
          How Revenue Leaks
        </h3>
        <div style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: theme.colors.textSecondary,
          fontFamily: theme.fonts.mono,
        }}>
          <p style={{ marginBottom: theme.spacing.sm }}>
            <strong style={{ color: theme.colors.textPrimary }}>Fast rounds (≤4:30):</strong><br />
            • {(fastConversionRate * 100).toFixed(0)}% dine post-round<br />
            • ${avgCheckFast.toFixed(2)} average check<br />
            • Revenue per round: ${(fastConversionRate * avgCheckFast * 4).toFixed(2)} (4-person foursome)
          </p>
          <p style={{ marginBottom: theme.spacing.sm }}>
            <strong style={{ color: theme.colors.textPrimary }}>Slow rounds (&gt;4:30):</strong><br />
            • {(slowConversionRate * 100).toFixed(0)}% dine post-round<br />
            • ${avgCheckSlow.toFixed(2)} average check<br />
            • Revenue per round: ${(slowConversionRate * avgCheckSlow * 4).toFixed(2)} (4-person foursome)
          </p>
          <p>
            <strong style={{ color: theme.colors.risk }}>Lost per slow round:</strong> ${((fastConversionRate * avgCheckFast * 4) - (slowConversionRate * avgCheckSlow * 4)).toFixed(2)}<br />
            <strong style={{ color: theme.colors.risk }}>× {slowRoundsPerMonth} slow rounds:</strong> <span style={{ 
              fontSize: 16, 
              fontWeight: 700, 
              color: theme.colors.risk 
            }}>${revenueLostPerMonth.toLocaleString()}/month</span>
          </p>
        </div>
      </div>

      {/* Bottleneck Holes */}
      <div style={{
        background: theme.colors.cardBg,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 8,
        padding: theme.spacing.lg,
      }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 600,
          color: theme.colors.textPrimary,
          marginBottom: theme.spacing.md,
        }}>
          Bottleneck Holes (Where Pace Breaks Down)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {bottleneckHoles.map((hole) => (
            <div
              key={hole.hole}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: theme.spacing.sm,
                background: theme.colors.bgSecondary,
                borderRadius: 6,
                fontSize: 14,
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: theme.colors.textPrimary }}>
                  Hole {hole.hole}
                </span>
                {' '}
                <span style={{ color: theme.colors.textSecondary }}>
                  ({hole.course})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                <div style={{ textAlign: 'right', fontSize: 13, color: theme.colors.textSecondary }}>
                  Avg delay: <strong style={{ color: theme.colors.textPrimary }}>{hole.avgDelay} min</strong>
                </div>
                <div style={{ textAlign: 'right', fontSize: 13, color: theme.colors.textSecondary }}>
                  Rounds affected: <strong style={{ color: theme.colors.textPrimary }}>{hole.roundsAffected}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Recommendation */}
      <div style={{
        background: `linear-gradient(135deg, ${theme.colors.opportunity}15, ${theme.colors.opportunity}05)`,
        border: `1px solid ${theme.colors.opportunity}40`,
        borderRadius: 8,
        padding: theme.spacing.lg,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md }}>
          <span style={{ fontSize: 24 }}>💡</span>
          <div>
            <h4 style={{ 
              fontSize: 15, 
              fontWeight: 600, 
              color: theme.colors.textPrimary,
              marginBottom: theme.spacing.xs,
            }}>
              Recommended Action
            </h4>
            <p style={{ 
              fontSize: 14, 
              lineHeight: 1.5, 
              color: theme.colors.textSecondary,
              margin: 0,
            }}>
              Deploy ranger on holes 4, 8, 12, and 16 during peak times. Reduce avg pace by 15 minutes = recover 
              {' '}<strong style={{ color: theme.colors.opportunity }}>${(revenueLostPerMonth * 0.35).toLocaleString()}/month</strong> in F&B revenue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sublabel, highlight }) {
  return (
    <div>
      <div style={{
        fontSize: 12,
        fontWeight: 500,
        color: theme.colors.textSecondary,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: highlight ? 24 : 20,
        fontWeight: 700,
        color: highlight ? theme.colors.risk : theme.colors.textPrimary,
        fontFamily: theme.fonts.mono,
        marginBottom: 4,
      }}>
        {value}
      </div>
      {sublabel && (
        <div style={{
          fontSize: 12,
          color: theme.colors.textTertiary,
          lineHeight: 1.4,
        }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}
