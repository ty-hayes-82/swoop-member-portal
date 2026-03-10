import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell, CartesianGrid } from 'recharts';
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
  padding: theme.spacing.sm,
};

const ConversionTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0]?.payload;
  const rate = Number.isFinite(entry?.rate) ? `${(entry.rate * 100).toFixed(0)}%` : '—';
  const avgCheck = Number.isFinite(entry?.avgCheck) ? `$${entry.avgCheck.toFixed(2)}` : '—';
  return (
    <div style={tooltipStyle}>
      <div style={{ fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>Conversion: <strong>{rate}</strong></div>
      <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>Avg check: <strong>{avgCheck}</strong></div>
    </div>
  );
};

const formatPercent = (value, fallback = '—') => (Number.isFinite(value) ? `${(value * 100).toFixed(0)}%` : fallback);

export default function ConversionTab() {
  const dataSource = getPostRoundConversion();
  const byArchetype = Array.isArray(dataSource?.byArchetype)
    ? dataSource.byArchetype
    : Array.isArray(dataSource)
      ? dataSource
      : [];
  const rawData = byArchetype.map((entry = {}) => ({
    archetype: entry?.archetype ?? 'Unknown',
    rate: Number.isFinite(Number(entry?.rate)) ? Number(entry.rate) : 0,
    avgCheck: Number.isFinite(Number(entry?.avgCheck)) ? Number(entry.avgCheck) : null,
  }));
  const data = [...rawData].sort((a, b) => b.rate - a.rate);
  const hasData = data.length > 0;
  const serviceOverall = Number.isFinite(Number(dataSource?.overall)) ? Number(dataSource.overall) : null;
  const overall = Number.isFinite(serviceOverall)
    ? serviceOverall
    : hasData
      ? data.reduce((sum, item) => sum + item.rate, 0) / data.length
      : 0.35;
  const best = hasData ? data.reduce((prev, curr) => (curr.rate > prev.rate ? curr : prev), data[0]) : null;
  const lowest = hasData ? data.reduce((prev, curr) => (curr.rate < prev.rate ? curr : prev), data[0]) : null;
  const weekendRate = data.find((item) => /weekend/i.test(item.archetype))?.rate ?? null;
  const summaryCards = [
    {
      label: 'Overall Conversion',
      value: formatPercent(Number.isFinite(overall) ? overall : 0.35),
      sub: Number.isFinite(serviceOverall) ? 'Live POS data' : hasData ? 'Weighted average' : 'Demo baseline',
      accent: theme.colors.accent,
    },
    {
      label: 'Best Archetype',
      value: formatPercent(best?.rate),
      sub: best?.archetype ?? '—',
      accent: theme.colors.navOperations,
    },
    {
      label: 'Lowest Archetype',
      value: formatPercent(lowest?.rate),
      sub: lowest?.archetype ?? '—',
      accent: theme.colors.urgent,
    },
  ];

  const weekendLift = Number.isFinite(overall) && Number.isFinite(weekendRate)
    ? Math.max(0, overall - weekendRate)
    : 0.1;
  const estimatedImpact = Math.round(weekendLift * 14000) || 1400;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: theme.spacing.md }}>
        {summaryCards.map((card) => (
          <div
            key={card.label}
            style={{
              ...cardStyles.base,
              background: 'linear-gradient(150deg, #FFFFFF 0%, #FDF1E3 100%)',
              borderColor: `${card.accent}22`,
              boxShadow: theme.shadow.sm,
            }}
          >
            <div style={cardStyles.label}>{card.label}</div>
            <div style={{ ...cardStyles.value, color: card.accent }}>{card.value}</div>
            <div style={cardStyles.sub}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: theme.colors.black,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
          border: `1px solid ${theme.colors.graphite ?? '#2A2A2A'}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            fontSize: theme.fontSize.sm,
            color: 'rgba(255,255,255,0.8)',
            marginBottom: theme.spacing.md,
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span>Post-Round Dining Conversion by Archetype</span>
          <span style={{ fontSize: theme.fontSize.xs, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em' }}>
            Goal: 45%+
          </span>
        </div>
        {hasData ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} layout="vertical" margin={{ top: 8, right: 48, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="conversionBar" x1="0" x2="1" y1="0" y2="0">
                  {gradientStops.map((stop) => (
                    <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity} />
                  ))}
                </linearGradient>
              </defs>
              <CartesianGrid stroke={theme.colors.graphite ?? '#2A2A2A'} strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[0, 0.6]}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
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
              <Tooltip content={<ConversionTooltip />} />
              <Bar dataKey="rate" radius={[0, 8, 8, 0]} fill="url(#conversionBar)">
                {data.map((entry) => (
                  <Cell key={entry.archetype} fillOpacity={entry.rate < overall ? 0.6 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ padding: theme.spacing.lg, textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
            No conversion data available yet. Connect tee sheet + POS to visualize post-round performance.
          </div>
        )}
        <div
          style={{
            marginTop: theme.spacing.sm,
            fontSize: theme.fontSize.xs,
            color: 'rgba(255,255,255,0.82)',
            background: 'rgba(243,146,45,0.12)',
            border: '1px solid rgba(243,146,45,0.48)',
            borderRadius: theme.radius.sm,
            padding: theme.spacing.sm,
          }}
        >
          Annotation: when pace slows, Grill Room post-round traffic drops first; pace recovery is an F&B lever, not only a golf ops lever.
        </div>
      </div>

      <SoWhatCallout variant="opportunity">
        Weekend Warriors convert at <strong>{formatPercent(weekendRate ?? 0.25)}</strong> — well below the {formatPercent(overall)} blend.
        Moving them to the average unlocks roughly <strong>${estimatedImpact.toLocaleString()}/month</strong> in dining revenue and keeps
        the grill room staffed for weekends.
      </SoWhatCallout>
    </div>
  );
}
