import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { SoWhatCallout, Sparkline } from '@/components/ui';
import TrendContext from '@/components/ui/TrendContext.jsx';
import { getOutletPerformance, getFBSummary } from '@/services/fbService';
import { outletTrends, MONTHS } from '@/data/trends.js';
import { theme } from '@/config/theme';

export default function OutletTab() {
  const outlets = getOutletPerformance();
  const summary = getFBSummary();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.md }}>
        {[
          { label: 'Total F&B Revenue', value: `$${(summary.totalRevenue / 1000).toFixed(0)}K`, metric: 'fbRevenue', format: 'currency' },
          { label: 'Total Covers', value: summary.totalCovers.toLocaleString(), metric: null },
          { label: 'Understaffing Loss', value: `-$${(summary.understaffingLoss / 1000).toFixed(1)}K`, metric: null },
        ].map(({ label, value, metric, format }) => (
          <div key={label} style={{ background: theme.colors.bgCard, boxShadow: theme.shadow.sm, borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.border}`, padding: theme.spacing.md }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            <div style={{ fontSize: theme.fontSize.xl, fontFamily: theme.fonts.mono,
              fontWeight: 700, color: theme.colors.fb, marginTop: 4 }}>{value}</div>
            {metric && <TrendContext metricKey={metric} format={format} style={{ marginTop: 4 }} />}
          </div>
        ))}
      </div>

      {/* Outlet revenue chart */}
      <div style={{ background: theme.colors.bgDeep, borderRadius: theme.radius.md,
        padding: theme.spacing.md, border: `1px solid ${theme.colors.border}` }}>
        <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
          Revenue by Outlet — January 2026
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={outlets} margin={{ top: 4, right: 4, left: -8, bottom: 40 }}>
            <XAxis dataKey="outlet" tick={{ fill: theme.colors.textMuted, fontSize: 10 }}
              tickLine={false} angle={-20} textAnchor="end" />
            <YAxis tick={{ fill: theme.colors.textMuted, fontSize: 10 }} tickLine={false}
              tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip formatter={v => [`$${v.toLocaleString()}`, 'Revenue']}
              contentStyle={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, borderRadius: 8 }}
              labelStyle={{ color: theme.colors.textPrimary }} />
            <Bar dataKey="revenue" fill={theme.colors.fb} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Outlet detail table */}
      <div style={{ background: theme.colors.bgDeep, borderRadius: theme.radius.md,
        border: `1px solid ${theme.colors.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
          <thead>
            <tr style={{ background: theme.colors.bg }}>
              {['Outlet', 'Revenue', 'Covers', 'Avg Check', '6-mo Trend', 'Understaffing Impact'].map(h => (
                <th key={h} style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, textAlign: 'left',
                  color: theme.colors.textMuted, fontSize: theme.fontSize.xs, textTransform: 'uppercase',
                  letterSpacing: '0.06em', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {outlets.map((o, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  color: theme.colors.textPrimary, fontWeight: 500 }}>{o.outlet}</td>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  color: theme.colors.fb, fontFamily: theme.fonts.mono }}>
                  ${o.revenue.toLocaleString()}
                </td>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  color: theme.colors.textSecondary, fontFamily: theme.fonts.mono }}>{o.covers}</td>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  color: theme.colors.textSecondary, fontFamily: theme.fonts.mono }}>
                  ${o.avgCheck.toFixed(2)}
                </td>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
                  {outletTrends[o.outlet] && (
                    <div style={{ width: 72, height: 24 }}>
                      <Sparkline data={outletTrends[o.outlet]} height={24} color={theme.colors.fb} />
                    </div>
                  )}
                </td>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
                  {o.understaffedImpact < 0
                    ? <span style={{ color: theme.colors.warning, fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs }}>
                        -${Math.abs(o.understaffedImpact).toLocaleString()}
                      </span>
                    : <span style={{ color: theme.colors.textMuted }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SoWhatCallout variant="warning">
        Grill Room lost an estimated <strong>$2,760</strong> on understaffed days.
        It's the highest-volume lunch outlet — every staffing gap has an outsized impact.
      </SoWhatCallout>
    </div>
  );
}
