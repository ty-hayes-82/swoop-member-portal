// IntegrationHealthStrip — compact health bar for the Integrations page
// Props: connected, total, combosActive, totalCombos, onClickConnected, onClickCombos
import { theme } from '@/config/theme';

export default function IntegrationHealthStrip({
  connected, total, combosActive, totalCombos,
  onClickConnected, onClickCombos,
}) {
  const pct = Math.round((connected / total) * 100);

  return (
    <div style={{
      background: theme.colors.bgCard,
      border: `1px solid ${theme.colors.border ?? '#E5E5E5'}`,
      borderRadius: theme.radius.md,
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      display: 'flex', alignItems: 'center', gap: theme.spacing.lg,
    }}>
      {/* Progress bar */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: theme.fontSize.xs ?? '11px', color: theme.colors.textMuted,
          marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          Integration Health
        </div>
        <div style={{ height: '6px', background: theme.colors.bgDeep, borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: pct === 100 ? theme.colors.success : theme.colors.accent,
            borderRadius: '3px', transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Connected stat */}
      <button onClick={onClickConnected} style={statBtn()}>
        <span style={{ fontSize: '20px', fontWeight: 700, color: theme.colors.success, fontFamily: 'JetBrains Mono, monospace' }}>
          {connected}/{total}
        </span>
        <span style={{ fontSize: theme.fontSize.xs ?? '11px', color: theme.colors.textMuted }}>Systems Connected</span>
      </button>

      <div style={{ width: '1px', height: '32px', background: theme.colors.bgDeep }} />

      {/* Combos stat */}
      <button onClick={onClickCombos} style={statBtn()}>
        <span style={{ fontSize: '20px', fontWeight: 700, color: theme.colors.accent, fontFamily: 'JetBrains Mono, monospace' }}>
          {combosActive}/{totalCombos}
        </span>
        <span style={{ fontSize: theme.fontSize.xs ?? '11px', color: theme.colors.textMuted }}>Cross-System Insights</span>
      </button>
    </div>
  );
}

function statBtn() {
  return {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
    background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
    borderRadius: theme.radius.sm,
  };
}
