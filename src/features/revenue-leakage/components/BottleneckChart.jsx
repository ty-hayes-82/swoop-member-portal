import { theme } from '@/config/theme';

export default function BottleneckChart({ holes }) {
  // Calculate impact score (delay × rounds affected) and sort descending
  const holesWithImpact = holes.map(hole => ({
    ...hole,
    impact: parseFloat(hole.avgDelay) * hole.roundsAffected,
  })).sort((a, b) => b.impact - a.impact);

  const maxImpact = Math.max(...holesWithImpact.map(h => h.impact));

  // Color coding based on impact
  const getImpactColor = (impact) => {
    const ratio = impact / maxImpact;
    if (ratio > 0.8) return theme.colors.risk;
    if (ratio > 0.5) return '#F59E0B'; // warning amber
    return '#6BB8EF'; // info blue
  };

  const getImpactLabel = (impact) => {
    const ratio = impact / maxImpact;
    if (ratio > 0.8) return 'HIGH';
    if (ratio > 0.5) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <div style={{
      background: theme.colors.cardBg,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 12,
      padding: theme.spacing.lg,
    }}>
      <h3 style={{
        fontSize: 16,
        fontWeight: 600,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs,
      }}>
        🎯 Bottleneck Holes by Impact
      </h3>
      <p style={{
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
      }}>
        Compact view: prioritize highest impact first (delay x rounds affected).
      </p>

      <div style={{
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '72px 1fr 1fr 1fr 120px',
          gap: theme.spacing.sm,
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          background: theme.colors.bgSecondary,
          borderBottom: `1px solid ${theme.colors.border}`,
          fontSize: 11,
          fontWeight: 600,
          color: theme.colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        }}>
          <span>Rank</span>
          <span>Hole</span>
          <span>Avg Delay</span>
          <span>Rounds</span>
          <span>Impact</span>
        </div>
        {holesWithImpact.map((hole, index) => {
          const impactColor = getImpactColor(hole.impact);
          const impactLabel = getImpactLabel(hole.impact);
          return (
            <div
              key={hole.hole}
              style={{
                display: 'grid',
                gridTemplateColumns: '72px 1fr 1fr 1fr 120px',
                gap: theme.spacing.sm,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                borderBottom: index === holesWithImpact.length - 1 ? 'none' : `1px solid ${theme.colors.borderLight}`,
                alignItems: 'center',
                fontSize: 13,
              }}
            >
              <span style={{ fontFamily: theme.fonts.mono, color: theme.colors.textSecondary, fontWeight: 700 }}>
                #{index + 1}
              </span>
              <span style={{ color: theme.colors.textPrimary, fontWeight: 600 }}>
                Hole {hole.hole}
              </span>
              <span style={{ color: theme.colors.textSecondary, fontFamily: theme.fonts.mono }}>
                {hole.avgDelay} min
              </span>
              <span style={{ color: theme.colors.textSecondary, fontFamily: theme.fonts.mono }}>
                {hole.roundsAffected.toLocaleString()}
              </span>
              <span style={{
                justifySelf: 'start',
                border: `1px solid ${impactColor}55`,
                background: `${impactColor}18`,
                color: impactColor,
                borderRadius: 999,
                padding: '2px 10px',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.3,
                textTransform: 'uppercase',
              }}>
                {impactLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
