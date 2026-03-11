import { theme } from '@/config/theme';
import { paceFBImpact, slowRoundStats, bottleneckHoles } from '@/data/pace';
import ComparisonCard from '../components/ComparisonCard';
import BottleneckChart from '../components/BottleneckChart';

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
  const revenuePerRoundDelta = (fastConversionRate * avgCheckFast * 4) - (slowConversionRate * avgCheckSlow * 4);

  return (
    <div style={{ padding: theme.spacing.md, display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      
      {/* Summary KPI Cards */}
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

      {/* P0: Side-by-Side Visual Comparison (THE CENTERPIECE) */}
      <ComparisonCard
        fastData={{
          conversionRate: fastConversionRate,
          avgCheck: avgCheckFast,
        }}
        slowData={{
          conversionRate: slowConversionRate,
          avgCheck: avgCheckSlow,
        }}
        delta={revenuePerRoundDelta}
      />

      {/* P1: Bottleneck Holes Visual Chart */}
      <BottleneckChart holes={bottleneckHoles} />

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
