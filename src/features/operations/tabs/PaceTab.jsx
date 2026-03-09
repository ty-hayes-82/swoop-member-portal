import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { SoWhatCallout, Badge } from '@/components/ui';
import TrendContext from '@/components/ui/TrendContext.jsx';
import TrendChart from '@/components/charts/TrendChart.jsx';
import { getPaceDistribution, getSlowRoundRate, getBottleneckHoles, getPaceFBImpact } from '@/services/operationsService';
import { theme } from '@/config/theme';

export default function PaceTab() {
  const dist = getPaceDistribution();
  const stats = getSlowRoundRate();
  const holes = getBottleneckHoles();
  const fbImpact = getPaceFBImpact();
  const lostRevFmt = `$${fbImpact.revenueLostPerMonth.toLocaleString()}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.md }}>
        {[
          { label: 'Slow Round Rate', value: `${(stats.overallRate * 100).toFixed(0)}%`,
            sub: `>${stats.threshold} min`, urgent: true, metric: 'slowRoundRate' },
          { label: 'Weekend Rate', value: `${(stats.weekendRate * 100).toFixed(0)}%`,
            sub: 'Sat/Sun only', urgent: true, metric: null },
          { label: 'Weekday Rate', value: `${(stats.weekdayRate * 100).toFixed(0)}%`,
            sub: 'Mon–Fri', urgent: false, metric: null },
        ].map(({ label, value, sub, urgent, metric }) => (
          <div key={label} style={{ background: theme.colors.bgCard, boxShadow: theme.shadow.sm,
            border: `1px solid ${urgent ? `${theme.colors.urgent}40` : theme.colors.border}`,
            borderRadius: theme.radius.md, padding: theme.spacing.md }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            <div style={{ fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.mono,
              fontWeight: 700, color: urgent ? theme.colors.urgent : theme.colors.textPrimary }}>{value}</div>
            {metric
              ? <TrendContext metricKey={metric} format="percent" style={{ marginTop: 4 }} />
              : <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{sub}</div>
            }
          </div>
        ))}
      </div>

      {/* Round distribution chart */}
      <div style={{ background: theme.colors.bgDeep, borderRadius: theme.radius.md,
        padding: theme.spacing.md, border: `1px solid ${theme.colors.border}` }}>
        <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
          Round Duration Distribution — Jan 2026
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dist} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <XAxis dataKey="bucket" tick={{ fill: theme.colors.textMuted, fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fill: theme.colors.textMuted, fontSize: 10 }} tickLine={false} />
            <Tooltip
              formatter={(v, _name, props) => {
                const isSlow = props?.payload?.isSlow;
                return [`${v} rounds`, isSlow ? 'Slow round' : 'Normal round'];
              }}
              contentStyle={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
                borderRadius: 8, boxShadow: theme.shadow.md, fontSize: 12 }}
              labelStyle={{ color: theme.colors.textPrimary, fontWeight: 600, marginBottom: 4 }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {dist.map((d, i) => <Cell key={i} fill={d.isSlow ? theme.colors.urgent : theme.colors.chartGolf} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.md }}>
          <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
            <span style={{ color: theme.colors.chartGolf }}>■</span> Normal pace
          </span>
          <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
            <span style={{ color: theme.colors.urgent }}>■</span> Slow (4:30+)
          </span>
        </div>
      </div>

      {/* Bottleneck holes */}
      <div style={{ background: theme.colors.bgDeep, borderRadius: theme.radius.md,
        padding: theme.spacing.md, border: `1px solid ${theme.colors.border}` }}>
        <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary,
          marginBottom: theme.spacing.md }}>Bottleneck Holes</div>
        <div className="grid-responsive-4">
          {holes.map(h => (
            <div key={h.hole} style={{ textAlign: 'center', padding: theme.spacing.sm,
              background: theme.colors.bg, borderRadius: theme.radius.md,
              border: `1px solid ${theme.colors.border}` }}>
              <div style={{ fontSize: theme.fontSize.lg, fontFamily: theme.fonts.mono,
                fontWeight: 700, color: theme.colors.urgent }}>#{h.hole}</div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{h.course.split(' ')[0]}</div>
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.warning, marginTop: 2 }}>
                +{h.avgDelay} min avg
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* F&B impact inline */}
      <SoWhatCallout variant="warning">
        Slow rounds → <strong>15% lower post-round dining conversion</strong>.
        Fast rounds convert at {(fbImpact.fastConversionRate * 100).toFixed(0)}% vs
        {` ${(fbImpact.slowConversionRate * 100).toFixed(0)}%`} for slow rounds —
        costing roughly <strong>{lostRevFmt}/month</strong> in lost dining revenue.
      </SoWhatCallout>

      {/* Full trend chart #2 — 6-month slow round rate */}
      <TrendChart
        title="Slow Round Rate Trend — 6-month deterioration"
        metricKey="slowRoundRate"
        color={theme.colors.urgent}
        format="percent"
      />
    </div>
  );
}
