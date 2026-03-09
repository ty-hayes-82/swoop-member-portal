import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { SoWhatCallout } from '@/components/ui';
import { getPostRoundConversion } from '@/services/fbService';
import { theme } from '@/config/theme';

const gradientStops = [
  { offset: '0%', color: theme.colors.accent, opacity: 0.9 },
  { offset: '80%', color: theme.colors.operations, opacity: 1 },
];

const cardStyles = {
  base: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    border: `1px solid ${theme.colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  value: {
    fontSize: theme.fontSize.xl,
    fontFamily: theme.fonts.mono,
    fontWeight: 700,
  },
  sub: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
};

const tooltipStyle = {
  background: theme.colors.bgCard,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: 12,
  boxShadow: theme.shadow.md,
};

export default function ConversionTab() {
  const data = getPostRoundConversion();
  const overall = 0.35;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: theme.spacing.md }}>
        {[{
          label: 'Overall Conversion',
          value: `${(overall * 100).toFixed(0)}%`,
          accent: theme.colors.accent,
          sub: 'All rounds',
        }, {
          label: 'Best Archetype',
          value: '50%',
          sub: 'Die-Hard Golfer',
          accent: theme.colors.navOperations,
        }, {
          label: 'Lowest Archetype',
          value: '10%',
          sub: 'Ghost archetype',
          accent: theme.colors.urgent,
        }].map(card => (
          <div key={card.label} style={{
            ...cardStyles.base,
            background: 'linear-gradient(150deg, #FFFFFF 0%, #FDF1E3 100%)',
            borderColor: `${card.accent}22`,
            boxShadow: theme.shadow.sm,
          }}>
            <div style={cardStyles.label}>{card.label}</div>
            <div style={{ ...cardStyles.value, color: card.accent }}>{card.value}</div>
            <div style={cardStyles.sub}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: '#111111',
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        border: `1px solid rgba(255,255,255,0.08)`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ fontSize: theme.fontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: theme.spacing.md, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span>Post-Round Dining Conversion by Archetype</span>
          <span style={{ fontSize: theme.fontSize.xs, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em' }}>
            Goal: 45%+
          </span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 48, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="conversionBar" x1="0" x2="1" y1="0" y2="0">
                {gradientStops.map(stop => (
                  <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity} />
                ))}
              </linearGradient>
            </defs>
            <XAxis
              type="number"
              domain={[0, 0.6]}
              tickFormatter={v => `${(v * 100).toFixed(0)}%`}
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="archetype"
              tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }}
              tickLine={false}
              width={140}
            />
            <ReferenceLine x={overall} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" />
            <Tooltip
              formatter={v => [`${(v * 100).toFixed(0)}%`, 'Conversion']}
              contentStyle={tooltipStyle}
              labelStyle={{ color: theme.colors.textPrimary, fontWeight: 600 }}
            />
            <Bar dataKey="rate" radius={[0, 8, 8, 0]} fill="url(#conversionBar)">
              {data.map(entry => (
                <Cell key={entry.archetype} fillOpacity={entry.rate < overall ? 0.6 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SoWhatCallout variant="opportunity">
        Weekend Warriors convert at 25% — well below the 35% blended rate. Moving them to 35%
        adds roughly <strong>$1,400/month</strong> in dining revenue and keeps service staff utilized on weekends.
      </SoWhatCallout>
    </div>
  );
}
