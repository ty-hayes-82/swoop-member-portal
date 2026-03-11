import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { SoWhatCallout } from '@/components/ui';
import TrendContext from '@/components/ui/TrendContext.jsx';
import TrendChart from '@/components/charts/TrendChart.jsx';
import { getRevenueByDay, getMonthlyRevenueSummary } from '@/services/operationsService';
import { theme } from '@/config/theme';

const WEATHER_ICONS = { sunny: '☀️', cloudy: '⛅', windy: '💨', rainy: '🌧️', perfect: '🌤️' };

// Annotates understaffed days directly on the bar — no legend hunting
const UnderstaffedLabel = ({ x, y, width, index, data }) => {
  if (!data?.[index]?.isUnderstaffed) return null;
  return (
    <g>
      <rect x={x} y={y - 22} width={width} height={18} rx={3}
        fill={theme.colors.warning} opacity={0.15} />
      <text x={x + width / 2} y={y - 9} fill={theme.colors.warning}
        textAnchor="middle" fontSize={9} fontWeight={700}>
        ⚠ short-staffed
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const total = (d?.golf ?? 0) + (d?.fb ?? 0);
  return (
    <div style={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.md, padding: theme.spacing.md, minWidth: 170,
      boxShadow: theme.shadow.md }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: theme.colors.textPrimary,
        fontSize: theme.fontSize.sm }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.operations }}>Golf</span>
        <span style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs,
          color: theme.colors.operations }}>${(d?.golf ?? 0).toLocaleString()}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.fb }}>F&B</span>
        <span style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs,
          color: theme.colors.fb }}>${(d?.fb ?? 0).toLocaleString()}</span>
      </div>
      <div style={{ borderTop: `1px solid ${theme.colors.border}`, paddingTop: 5,
        display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Total</span>
        <span style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs,
          fontWeight: 700, color: theme.colors.textPrimary }}>${total.toLocaleString()}</span>
      </div>
      {d?.isUnderstaffed && (
        <div style={{ marginTop: 6, padding: '4px 8px', borderRadius: theme.radius.sm,
          background: `${theme.colors.warning}15`, fontSize: theme.fontSize.xs,
          color: theme.colors.warning, fontWeight: 600 }}>
          ⚠ Understaffed — est. −8% revenue
        </div>
      )}
      {d?.weather && (
        <div style={{ marginTop: 4, fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
          {WEATHER_ICONS[d.weather]} {d.weather}
        </div>
      )}
    </div>
  );
};

export default function RevenueTab() {
  const data = getRevenueByDay().map(d => ({ ...d, label: `${d.day} ${d.date.slice(8)}` }));
  const summary = getMonthlyRevenueSummary();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* KPI strip */}
      <div className="grid-responsive-4">
        {[
          { label: 'Monthly Total', value: `$${(summary.total / 1000).toFixed(0)}K`, metric: 'totalRevenue', format: 'currency' },
          { label: 'Daily Average', value: `$${summary.dailyAvg.toLocaleString()}`, metric: null },
          { label: 'Weekend Avg', value: `$${summary.weekendAvg.toLocaleString()}`, metric: null },
          { label: 'Weekday Avg', value: `$${summary.weekdayAvg.toLocaleString()}`, metric: null },
        ].map(({ label, value, metric, format }) => (
          <div key={label} style={{ background: theme.colors.bgCard, boxShadow: theme.shadow.sm,
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
      <div style={{ background: theme.colors.bgDeep, borderRadius: theme.radius.md,
        padding: theme.spacing.md, border: `1px solid ${theme.colors.border}` }}>
        <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary,
          marginBottom: theme.spacing.md }}>
          Daily Revenue — January 2026
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 28, right: 4, left: -8, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fill: theme.colors.textMuted, fontSize: 10 }} tickLine={false} interval={2} />
            <YAxis tick={{ fill: theme.colors.textMuted, fontSize: 10 }} tickLine={false}
              tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="golf" stackId="a" fill={theme.colors.chartGolf} radius={[0, 0, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.isUnderstaffed ? theme.colors.warning : theme.colors.chartGolf} />
              ))}
            </Bar>
            <Bar dataKey="fb" stackId="a" fill={theme.colors.fb} radius={[3, 3, 0, 0]}>
              <LabelList content={(props) => <UnderstaffedLabel {...props} data={data} />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.md, marginTop: theme.spacing.sm }}>
          {[{ color: theme.colors.chartGolf, label: 'Golf' },
            { color: theme.colors.fb, label: 'F&B' },
            { color: theme.colors.warning, label: 'Jan 9, 16, 28 — understaffed' }].map(({ color, label }) => (
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
          { key: 'golfRevenue', color: theme.colors.chartGolf, label: 'Golf Revenue' },
          { key: 'fbRevenue',   color: theme.colors.fb,         label: 'F&B Revenue' },
        ]}
        format="currency"
      />
    </div>
  );
}
