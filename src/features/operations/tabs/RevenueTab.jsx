import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SoWhatCallout } from '@/components/ui';
import TrendContext from '@/components/ui/TrendContext.jsx';
import TrendChart from '@/components/charts/TrendChart.jsx';
import { getRevenueByDay, getMonthlyRevenueSummary } from '@/services/operationsService';
import { theme } from '@/config/theme';

const WEATHER_ICONS = { sunny: '☀️', cloudy: '⛅', windy: '💨', rainy: '🌧️', perfect: '🌤️' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.md, padding: theme.spacing.md, minWidth: 160 }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: theme.colors.textPrimary }}>{label}</div>
      <div style={{ color: theme.colors.operations }}>Golf: ${(d?.golf ?? 0).toLocaleString()}</div>
      <div style={{ color: theme.colors.fb }}>F&B: ${(d?.fb ?? 0).toLocaleString()}</div>
      {d?.isUnderstaffed && <div style={{ color: theme.colors.warning, marginTop: 4 }}>⚠ Understaffed</div>}
      {d?.weather && <div style={{ color: theme.colors.textMuted, marginTop: 2 }}>{WEATHER_ICONS[d.weather]} {d.weather}</div>}
    </div>
  );
};

export default function RevenueTab() {
  const data = getRevenueByDay().map(d => ({ ...d, label: `${d.day} ${d.date.slice(8)}` }));
  const summary = getMonthlyRevenueSummary();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: theme.spacing.md }}>
        {[
          { label: 'Monthly Total', value: `$${(summary.total / 1000).toFixed(0)}K`, metric: 'golfRevenue', format: 'currency' },
          { label: 'Daily Average', value: `$${summary.dailyAvg.toLocaleString()}`, metric: null },
          { label: 'Weekend Avg', value: `$${summary.weekendAvg.toLocaleString()}`, metric: null },
          { label: 'Weekday Avg', value: `$${summary.weekdayAvg.toLocaleString()}`, metric: null },
        ].map(({ label, value, metric, format }) => (
          <div key={label} style={{ background: theme.colors.bgCardHover,
            border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md,
            padding: theme.spacing.md }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            <div style={{ fontSize: theme.fontSize.xl, fontFamily: theme.fonts.mono,
              fontWeight: 700, color: theme.colors.textPrimary, marginTop: 4 }}>{value}</div>
            {metric && <TrendContext metricKey={metric} format={format} style={{ marginTop: 4 }} />}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: theme.colors.bgCardHover, borderRadius: theme.radius.md,
        padding: theme.spacing.md, border: `1px solid ${theme.colors.border}` }}>
        <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
          Daily Revenue — January 2026
          <span style={{ marginLeft: theme.spacing.md, color: theme.colors.warning }}>▲ Understaffed days marked</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fill: theme.colors.textMuted, fontSize: 10 }} tickLine={false} interval={2} />
            <YAxis tick={{ fill: theme.colors.textMuted, fontSize: 10 }} tickLine={false}
              tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="golf" stackId="a" fill={theme.colors.operations} radius={[0, 0, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.isUnderstaffed ? theme.colors.warning : theme.colors.operations} />
              ))}
            </Bar>
            <Bar dataKey="fb" stackId="a" fill={theme.colors.fb} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: theme.spacing.md, marginTop: theme.spacing.sm }}>
          {[{ color: theme.colors.operations, label: 'Golf Revenue' },
            { color: theme.colors.fb, label: 'F&B Revenue' },
            { color: theme.colors.warning, label: 'Understaffed Day' }].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
              <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <SoWhatCallout variant="insight">
        Jan 9, 16, 28 — Grill Room understaffed — revenue ran ~8% below comparable days.
        Three gaps cost an estimated <strong>$3,400</strong> in lost revenue this month.
      </SoWhatCallout>

      {/* Full trend chart #1 — 6-month revenue */}
      <TrendChart
        title="Monthly Revenue Trend — Golf + F&B"
        seriesKeys={[
          { key: 'golfRevenue', color: theme.colors.operations, label: 'Golf Revenue' },
          { key: 'fbRevenue',   color: theme.colors.fb,         label: 'F&B Revenue' },
        ]}
        format="currency"
      />
    </div>
  );
}
