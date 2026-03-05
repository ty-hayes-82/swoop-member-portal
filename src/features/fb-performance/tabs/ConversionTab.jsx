import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { SoWhatCallout } from '@/components/ui';
import { getPostRoundConversion } from '@/services/fbService';
import { theme } from '@/config/theme';

export default function ConversionTab() {
  const data = getPostRoundConversion();
  const overall = 0.35;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.md }}>
        {[
          { label: 'Overall Conversion', value: `${(overall * 100).toFixed(0)}%`, accent: theme.colors.fb },
          { label: 'Best Archetype',  value: '50%', sub: 'Die-Hard Golfer', accent: theme.colors.success },
          { label: 'Lowest Archetype', value: '10%', sub: 'Ghost',          accent: theme.colors.urgent },
        ].map(({ label, value, sub, accent }) => (
          <div key={label} style={{ background: theme.colors.bgCard, boxShadow: theme.shadow.sm, borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.border}`, padding: theme.spacing.md }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            <div style={{ fontSize: theme.fontSize.xl, fontFamily: theme.fonts.mono,
              fontWeight: 700, color: accent, marginTop: 4 }}>{value}</div>
            {sub && <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ background: theme.colors.bgDeep, borderRadius: theme.radius.md,
        padding: theme.spacing.md, border: `1px solid ${theme.colors.border}` }}>
        <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
          Post-Round Dining Conversion by Archetype
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 60, left: 8, bottom: 0 }}>
            <XAxis type="number" domain={[0, 1]} tickFormatter={v => `${(v * 100).toFixed(0)}%`}
              tick={{ fill: theme.colors.textMuted, fontSize: 10 }} tickLine={false} />
            <YAxis type="category" dataKey="archetype" tick={{ fill: theme.colors.textSecondary, fontSize: 11 }}
              tickLine={false} width={120} />
            <Tooltip formatter={v => [`${(v * 100).toFixed(0)}%`, 'Conversion rate']}
              contentStyle={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
                borderRadius: 8, boxShadow: theme.shadow.md, fontSize: 12 }}
              labelStyle={{ color: theme.colors.textPrimary, fontWeight: 600 }} />
            <Bar dataKey="rate" fill={theme.colors.fb} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SoWhatCallout variant="opportunity">
        Weekend Warriors convert at 25% — well below the 35% average. Targeted post-round
        nudges for this archetype could add <strong>~$1,400/month</strong> in incremental dining.
      </SoWhatCallout>
    </div>
  );
}
