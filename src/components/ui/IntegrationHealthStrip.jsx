// IntegrationHealthStrip — health bar + recommended next prompt
// Props: connected, total, combosActive, totalCombos, nextRecommended[],
//        onClickConnected, onClickCombos
import { theme } from '@/config/theme';

export default function IntegrationHealthStrip({
  connected, total, combosActive, totalCombos,
  nextRecommended = [], onClickConnected, onClickCombos,
}) {
  const pct = Math.round((connected / total) * 100);
  const remaining = total - connected;

  return (
    <div style={{
      background: theme.colors.bgCard,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.md,
      overflow: 'hidden',
    }}>
      {/* Main row */}
      <div style={{
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        display: 'flex', alignItems: 'center', gap: theme.spacing.lg,
      }}>
        {/* Progress bar + framing */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: theme.colors.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Integration Health
            </span>
            <span style={{ fontSize: '11px', color: theme.colors.textMuted }}>
              {connected} connected · {remaining} available
            </span>
          </div>
          <div style={{ height: '6px', background: theme.colors.bgDeep, borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: pct >= 50 ? theme.colors.success : theme.colors.accent,
              borderRadius: '3px', transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* Connected stat */}
        <button onClick={onClickConnected} style={statBtn()}>
          <span style={{ fontSize: '20px', fontWeight: 700, color: theme.colors.success, fontFamily: theme.fonts.mono }}>
            {connected}/{total}
          </span>
          <span style={{ fontSize: '11px', color: theme.colors.textMuted }}>Systems Connected</span>
        </button>

        <div style={{ width: '1px', height: '32px', background: theme.colors.bgDeep }} />

        {/* Combos stat */}
        <button onClick={onClickCombos} style={statBtn()}>
          <span style={{ fontSize: '20px', fontWeight: 700, color: theme.colors.accent, fontFamily: theme.fonts.mono }}>
            {combosActive}/{totalCombos}
          </span>
          <span style={{ fontSize: '11px', color: theme.colors.textMuted }}>Cross-System Insights</span>
        </button>
      </div>

      {/* Recommended next row */}
      {nextRecommended.length > 0 && (
        <div style={{
          borderTop: `1px solid ${theme.colors.bgDeep}`,
          padding: '8px 16px',
          display: 'flex', alignItems: 'center', gap: '8px',
          background: `${theme.colors.operations}08`,
        }}>
          <span style={{ fontSize: '11px', color: theme.colors.operations, fontWeight: 700 }}>
            ↗ Recommended next:
          </span>
          {nextRecommended.slice(0, 3).map((v, i) => (
            <span key={v.id} style={{
              fontSize: '11px', color: theme.colors.textPrimary,
              background: theme.colors.bgDeep, borderRadius: theme.radius.sm,
              padding: '2px 8px', fontWeight: 500,
            }}>
              {v.icon} {v.name}
            </span>
          ))}
          <span style={{ fontSize: '11px', color: theme.colors.textMuted, marginLeft: '4px' }}>
            — connecting these unlocks {nextRecommended.length} more insights
          </span>
        </div>
      )}
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
