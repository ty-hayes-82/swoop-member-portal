// TrendChart — expandable 6-month chart panel.
// Collapsed: single "Show 6-month trend ▸" toggle row.
// Expanded: full Recharts bar chart with current month highlighted.
// Ceiling: 100 lines. Target: 90 lines.
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getTrendChartData, getMultiSeriesTrendData } from '@/services/trendsService.js';
import { theme } from '@/config/theme.js';

const FMT = {
  percent:  v => `${(v * 100).toFixed(0)}%`,
  currency: v => `$${(v / 1000).toFixed(0)}K`,
  number:   v => v.toLocaleString(),
};

export default function TrendChart({
  title, metricKey, seriesKeys, color = theme.colors.chartGolf,
  format = 'number', defaultExpanded = false,
}) {
  const [open, setOpen] = useState(defaultExpanded);
  const data = seriesKeys
    ? getMultiSeriesTrendData(seriesKeys.map(s => s.key))
    : getTrendChartData(metricKey);
  const fmt = FMT[format] ?? FMT.number;

  return (
    <div style={{ borderRadius: theme.radius.md, border: `1px solid ${theme.colors.border}`,
      background: theme.colors.bgCard, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        background: 'none', border: 'none', cursor: 'pointer',
        borderBottom: open ? `1px solid ${theme.colors.border}` : 'none',
      }}>
        <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary,
          fontWeight: 600, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-block', fontSize: '14px', color: theme.colors.textMuted,
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}>›</span>
          {title}
        </span>
        <span style={{ fontSize: '10px', color: theme.colors.textMuted }}>Aug–Jan · 6 months</span>
      </button>

      {open && (
        <div style={{ padding: theme.spacing.md }}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fill: theme.colors.textMuted, fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: theme.colors.textMuted, fontSize: 10 }} tickLine={false}
                tickFormatter={v => fmt(v)} />
              <Tooltip
                formatter={(v, name) => [fmt(v), seriesKeys?.find(s => s.key === name)?.label ?? name]}
                contentStyle={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
                  borderRadius: 8, fontSize: 12, boxShadow: theme.shadow.md }}
                labelStyle={{ color: theme.colors.textPrimary, fontWeight: 600 }} />
              {seriesKeys ? seriesKeys.map(s => (
                <Bar key={s.key} dataKey={s.key} fill={s.color} radius={[3,3,0,0]}>
                  {data.map((d, i) => <Cell key={i} fill={d.isCurrent ? s.color : `${s.color}70`} />)}
                </Bar>
              )) : (
                <Bar dataKey="value" radius={[3,3,0,0]}>
                  {data.map((d, i) => <Cell key={i} fill={d.isCurrent ? color : `${color}70`} />)}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
          {seriesKeys && (
            <div style={{ display: 'flex', gap: theme.spacing.md, marginTop: theme.spacing.sm, alignItems: 'center' }}>
              {seriesKeys.map(s => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '10px', color: theme.colors.textMuted }}>{s.label}</span>
                </div>
              ))}
              <span style={{ fontSize: '10px', color: theme.colors.textMuted, marginLeft: 'auto' }}>
                Jan = full opacity
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
