// ComboInsightCard — cross-system insight card with KPI or sparkline preview
// Props: id, systems, label, insight, automations, preview, swoop_only,
//        isExpanded, onToggle, allSystems, sparklineData (resolved by parent)
import { theme } from '@/config/theme';
import Sparkline from './Sparkline';

export default function ComboInsightCard({
  systems, label, insight, automations, preview, swoop_only,
  isExpanded, onToggle, allSystems, sparklineData,
}) {
  return (
    <div style={{
      background: theme.colors.bgCard,
      border: `1px solid ${theme.colors.border ?? '#E5E5E5'}`,
      borderRadius: theme.radius.md,
      overflow: 'hidden',
      transition: 'box-shadow 0.15s ease',
    }}>
      {/* Header — always visible */}
      <button onClick={onToggle} style={{
        display: 'flex', width: '100%', alignItems: 'center',
        justifyContent: 'space-between', padding: theme.spacing.md,
        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <SystemBadges systems={systems} allSystems={allSystems} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.textPrimary, lineHeight: 1.3 }}>
              {label}
            </div>
            {swoop_only && (
              <span style={{
                fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                color: theme.colors.accent, background: `${theme.colors.accent}18`,
                padding: '1px 5px', borderRadius: '3px', display: 'inline-block', marginTop: '3px',
              }}>
                Swoop Only
              </span>
            )}
          </div>
        </div>
        <span style={{ color: theme.colors.textMuted, fontSize: '12px', marginLeft: '8px', flexShrink: 0 }}>
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded body */}
      {isExpanded && (
        <div style={{ padding: `0 ${theme.spacing.md} ${theme.spacing.md}`, borderTop: `1px solid ${theme.colors.bgDeep}` }}>
          <p style={{ fontSize: '12px', color: theme.colors.textSecondary ?? theme.colors.textMuted, lineHeight: 1.6, margin: '12px 0' }}>
            {insight}
          </p>

          {/* Automations */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.colors.textMuted, marginBottom: '6px' }}>
              Automations
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {automations.map((a, i) => (
                <li key={i} style={{ fontSize: '12px', color: theme.colors.textPrimary, display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ color: theme.colors.success, flexShrink: 0, marginTop: '1px' }}>→</span> {a}
                </li>
              ))}
            </ul>
          </div>

          {/* Preview */}
          <PreviewWidget preview={preview} sparklineData={sparklineData} />
        </div>
      )}
    </div>
  );
}

function SystemBadges({ systems, allSystems }) {
  return (
    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
      {systems.map(id => {
        const sys = allSystems.find(s => s.id === id);
        if (!sys) return null;
        const color = theme.colors[sys.themeColor] ?? theme.colors.accent;
        return (
          <span key={id} style={{
            fontSize: '10px', fontWeight: 600, color,
            background: `${color}18`, border: `1px solid ${color}40`,
            padding: '2px 6px', borderRadius: '4px',
          }}>
            {sys.name}
          </span>
        );
      })}
    </div>
  );
}

function PreviewWidget({ preview, sparklineData }) {
  const bg = theme.colors.bgDeep;
  return (
    <div style={{ background: bg, borderRadius: theme.radius.sm, padding: '10px 12px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.colors.textMuted, marginBottom: '6px' }}>
        {preview.label}
      </div>
      {preview.type === 'sparkline' && sparklineData?.length > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <Sparkline data={sparklineData} height={36} color={preview.trend === 'down' ? theme.colors.warning : theme.colors.success} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: theme.colors.textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>{preview.value}</div>
            <div style={{ fontSize: '10px', color: theme.colors.textMuted }}>{preview.subtext}</div>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: theme.colors.textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>{preview.value}</div>
          <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginTop: '2px' }}>{preview.subtext}</div>
        </div>
      )}
    </div>
  );
}
