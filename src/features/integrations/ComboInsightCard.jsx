import { theme } from '@/config/theme';

const trendColor = (trend) => (trend === 'down' ? '#8f3d2b' : '#1a7a3c');

export function ComboInsightCard({ combo, systemsById }) {
  const [leftId, rightId] = combo.systems;
  const left = systemsById[leftId];
  const right = systemsById[rightId];

  if (!left || !right) return null;

  return (
    <article style={{
      background: '#fff',
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 12,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: theme.colors.textMuted }}>
          <NodeChip name={left.name} logo={left.logo} />
          <span>↔</span>
          <NodeChip name={right.name} logo={right.logo} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: theme.fonts.mono, color: theme.colors.textPrimary }}>
            {combo.kpi.value}
          </div>
          <div style={{ fontSize: 10, color: theme.colors.textMuted }}>{combo.kpi.label}</div>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 13, color: theme.colors.textSecondary, lineHeight: 1.5 }}>
        {combo.insight}
      </p>

      {combo.preview?.type === 'sparkline' ? (
        <SparklinePreview preview={combo.preview} />
      ) : (
        <div style={{
          background: theme.colors.bgDeep,
          borderRadius: 8,
          padding: '10px 12px',
          fontSize: 12,
          color: theme.colors.textSecondary,
        }}>
          <strong style={{ color: theme.colors.textPrimary }}>{combo.preview?.value}</strong> {combo.preview?.label}
        </div>
      )}
    </article>
  );
}

function NodeChip({ name, logo }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        width: 20,
        height: 20,
        borderRadius: 6,
        border: `1px solid ${theme.colors.border}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 700,
      }}>
        {logo}
      </span>
      <span>{name}</span>
    </span>
  );
}

function SparklinePreview({ preview }) {
  const points = preview.data ?? [];
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = Math.max(max - min, 1);
  const step = points.length > 1 ? 160 / (points.length - 1) : 0;
  const path = points
    .map((value, index) => {
      const x = index * step;
      const y = 32 - ((value - min) / range) * 32;
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  return (
    <div style={{ background: theme.colors.bgDeep, borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: theme.colors.textMuted }}>
          {preview.label}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: trendColor(preview.trend) }}>{preview.value}</span>
      </div>
      <svg width="160" height="36" viewBox="0 0 160 36" aria-hidden="true">
        <path d={path} fill="none" stroke={trendColor(preview.trend)} strokeWidth="2" />
      </svg>
    </div>
  );
}
