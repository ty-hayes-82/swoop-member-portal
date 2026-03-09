import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell, CartesianGrid } from 'recharts';
import { SoWhatCallout, Sparkline } from '@/components/ui';
import TrendContext from '@/components/ui/TrendContext.jsx';
import { getOutletPerformance, getFBSummary } from '@/services/fbService';
import { outletTrends } from '@/data/trends.js';
import { theme } from '@/config/theme';

const tooltipStyle = {
  background: theme.colors.bgCard,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: 12,
  boxShadow: theme.shadow.md,
};

export default function OutletTab() {
  const outlets = getOutletPerformance();
  const summary = getFBSummary();
  const goal = 95000;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: theme.spacing.md }}>
        {[{
          label: 'Total F&B Revenue',
          value: `$${(summary.totalRevenue / 1000).toFixed(0)}K`,
          metric: 'fbRevenue',
          format: 'currency',
          accent: theme.colors.accent,
        }, {
          label: 'Total Covers',
          value: summary.totalCovers.toLocaleString(),
          accent: theme.colors.navOperations,
        }, {
          label: 'Understaffing Loss',
          value: `-$${(summary.understaffingLoss / 1000).toFixed(1)}K`,
          accent: theme.colors.warning,
        }].map(card => (
          <div key={card.label} style={{
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            border: `1px solid ${card.accent}33`,
            background: '#FFFFFF',
            boxShadow: theme.shadow.sm,
          }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</div>
            <div style={{ fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.mono, fontWeight: 700, color: card.accent }}>{card.value}</div>
            {card.metric && <TrendContext metricKey={card.metric} format={card.format} style={{ marginTop: 4 }} />}
          </div>
        ))}
      </div>

      <div style={{
        background: `linear-gradient(120deg, ${theme.colors.black} 0%, #1F1F1F 60%, ${theme.colors.black} 100%)`,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        border: `1px solid #2A2A2A`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: theme.spacing.md }}>
          <div style={{ fontSize: theme.fontSize.sm, color: 'rgba(255,255,255,0.85)' }}>Revenue by Outlet — January 2026</div>
          <div style={{ fontSize: theme.fontSize.xs, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em' }}>Target per outlet: ${goal.toLocaleString()}</div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={outlets} margin={{ top: 8, right: 24, left: -4, bottom: 40 }}>
            <defs>
              <linearGradient id="outletBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFB347" stopOpacity={0.95} />
                <stop offset="90%" stopColor="#F3922D" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#2A2A2A" strokeDasharray="3 3" />
            <XAxis dataKey="outlet" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }} tickLine={false} angle={-20} textAnchor="end" interval={0} />
            <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} tickLine={false} />
            <ReferenceLine y={goal} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" />
            <Tooltip formatter={v => [`$${v.toLocaleString()}`, 'Revenue']} contentStyle={tooltipStyle} labelStyle={{ color: theme.colors.textPrimary }} />
            <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="url(#outletBar)">
              {outlets.map(entry => (
                <Cell key={entry.outlet} opacity={entry.revenue >= goal ? 1 : 0.75} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{
          marginTop: theme.spacing.sm,
          fontSize: theme.fontSize.xs,
          color: 'rgba(255,255,255,0.82)',
          background: 'rgba(243,146,45,0.12)',
          border: '1px solid rgba(243,146,45,0.48)',
          borderRadius: theme.radius.sm,
          padding: theme.spacing.sm,
        }}>
          Annotation: when pace slows, Grill Room post-round traffic drops first; pace recovery is an F&B lever, not only a golf ops lever.
        </div>
      </div>

      <div style={{ background: theme.colors.bgCard, borderRadius: theme.radius.md, border: `1px solid ${theme.colors.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
          <thead>
            <tr style={{ background: theme.colors.bg }}>
              {['Outlet', 'Revenue', 'Covers', 'Avg Check', '6-mo Trend', 'Understaffing Impact'].map(h => (
                <th key={h} style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, textAlign: 'left', color: theme.colors.textMuted, fontSize: theme.fontSize.xs, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {outlets.map((o, i) => (
              <tr key={o.outlet} style={{ borderTop: `1px solid ${theme.colors.border}`, background: i % 2 ? theme.colors.bg : theme.colors.bgCard }}>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, color: theme.colors.textPrimary, fontWeight: 500 }}>{o.outlet}</td>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, color: theme.colors.accent, fontFamily: theme.fonts.mono }}>
                  ${o.revenue.toLocaleString()}
                </td>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, color: theme.colors.textSecondary, fontFamily: theme.fonts.mono }}>{o.covers}</td>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, color: theme.colors.textSecondary, fontFamily: theme.fonts.mono }}>
                  ${o.avgCheck.toFixed(2)}
                </td>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
                  {outletTrends[o.outlet] && (
                    <div style={{ width: 80, height: 26 }}>
                      <Sparkline data={outletTrends[o.outlet]} height={26} color={theme.colors.navOperations} />
                    </div>
                  )}
                </td>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
                  {o.understaffedImpact < 0
                    ? <span style={{ color: theme.colors.warning, fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs }}>-${Math.abs(o.understaffedImpact).toLocaleString()}</span>
                    : <span style={{ color: theme.colors.textMuted }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SoWhatCallout variant="warning">
        Grill Room lost an estimated <strong>$2,760</strong> on understaffed days. It is the highest-volume lunch outlet — every staffing gap shows up in F&B before it hits dues.
      </SoWhatCallout>
    </div>
  );
}
