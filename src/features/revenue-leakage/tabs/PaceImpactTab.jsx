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
            trend={{
              points: [701, 694, 688, 676, 668],
              deltaLabel: '↓ 5% vs 6-mo avg',
              direction: 'improving',
            }}
          />
          <MetricCard
            label="Post-round conversion drop"
            value={`${conversionDrop}%`}
            sublabel={`${(fastConversionRate * 100).toFixed(0)}% → ${(slowConversionRate * 100).toFixed(0)}% after slow rounds`}
            trend={{
              points: [40, 42, 43, 45, 46],
              deltaLabel: '↑ 4 pts vs Dec',
              direction: 'worsening',
            }}
          />
          <MetricCard
            label="Average check drop"
            value={`${checkDrop}%`}
            sublabel={`$${avgCheckFast.toFixed(2)} → $${avgCheckSlow.toFixed(2)} per person`}
            trend={{
              points: [13, 14, 15, 16, 17],
              deltaLabel: '↑ 2 pts vs Dec',
              direction: 'worsening',
            }}
          />
          <MetricCard
            label="Monthly revenue lost"
            value={`$${revenueLostPerMonth.toLocaleString()}`}
            sublabel="Fixable through pace management"
            highlight
            trend={{
              points: [5100, 5280, 5440, 5600, 5760],
              deltaLabel: '↑ 12% vs Dec',
              direction: 'worsening',
            }}
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

function MetricCard({ label, value, sublabel, highlight, trend }) {
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
      {trend && (
        <div style={{ marginTop: theme.spacing.xs }}>
          <MiniTrend points={trend.points} />
          <div
            style={{
              fontSize: 11,
              marginTop: 3,
              color: trend.direction === 'worsening' ? theme.colors.risk : theme.colors.opportunity,
              fontWeight: 600,
            }}
          >
            {trend.deltaLabel}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniTrend({ points }) {
  if (!points || points.length === 0) return null;
  const width = 84;
  const height = 22;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const path = points
    .map((point, index) => {
      const x = index * step;
      const y = height - ((point - min) / span) * (height - 2) - 1;
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={path} fill="none" stroke={theme.colors.textMuted} strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}
