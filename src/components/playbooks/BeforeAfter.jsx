import { theme } from '@/config/theme';

/**
 * BeforeAfter — side-by-side metric comparison
 * Props: { beforeMetrics, afterMetrics, isActive }
 */
export default function BeforeAfter({ beforeMetrics = [], afterMetrics = [], isActive = false }) {
  const s = {
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.sm },
    col: (side) => ({
      background: side === 'after' && isActive ? `${theme.colors.success}12` : theme.colors.bgCardHover,
      border: `1px solid ${side === 'after' && isActive ? `${theme.colors.success}40` : theme.colors.border}`,
      borderRadius: theme.radius.md, padding: theme.spacing.md,
    }),
    label: {
      fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: theme.spacing.sm,
    },
    metric: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      marginBottom: 6,
    },
    metricLabel: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
    metricValue: (side) => ({
      fontSize: theme.fontSize.md, fontFamily: theme.fonts.mono, fontWeight: 600,
      color: side === 'after' && isActive ? theme.colors.success : theme.colors.textPrimary,
      textDecoration: side === 'before' && isActive ? 'line-through' : 'none',
      opacity: side === 'before' && isActive ? 0.5 : 1,
    }),
  };

  const renderMetrics = (metrics, side) => (
    <div>
      <div style={s.label}>{side === 'before' ? '⬤ Before' : '⬤ After'}</div>
      {metrics.map((m, i) => (
        <div key={i} style={s.metric}>
          <span style={s.metricLabel}>{m.label}</span>
          <span style={s.metricValue(side)}>{m.value}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={s.grid}>
      <div style={s.col('before')}>{renderMetrics(beforeMetrics, 'before')}</div>
      <div style={s.col('after')}>{renderMetrics(afterMetrics, 'after')}</div>
    </div>
  );
}
