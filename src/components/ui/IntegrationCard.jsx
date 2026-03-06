// IntegrationCard — single integration system card with status + partner list
// Props: id, name, category, icon, themeColor, status, lastSync, partners, description,
//        isSelected, onSelect
import { theme } from '@/config/theme';

const STATUS_CONFIG = {
  connected:   { label: 'Connected',   dot: theme.colors.success },
  available:   { label: 'Available',   dot: theme.colors.warning ?? '#B5760A' },
  coming_soon: { label: 'Coming Q2',   dot: theme.colors.textMuted },
};

export default function IntegrationCard({
  name, category, icon, themeColor, status, lastSync, partners, description,
  isSelected, onSelect,
}) {
  const color = theme.colors[themeColor] ?? theme.colors.accent;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.available;

  return (
    <button
      onClick={onSelect}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        background: isSelected ? `${color}12` : theme.colors.bgCard,
        border: `1.5px solid ${isSelected ? color : (theme.colors.border ?? '#E5E5E5')}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        opacity: status === 'coming_soon' ? 0.7 : 1,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px', lineHeight: 1 }}>{icon}</span>
          <div>
            <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color }}>{name}</div>
            <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginTop: '1px' }}>{category}</div>
          </div>
        </div>
        <StatusPip cfg={cfg} lastSync={lastSync} />
      </div>

      {/* Description */}
      <p style={{ fontSize: '11px', color: theme.colors.textSecondary ?? theme.colors.textMuted, lineHeight: 1.5, margin: '0 0 8px' }}>
        {description}
      </p>

      {/* Partners */}
      <div style={{ fontSize: '10px', color: theme.colors.textMuted }}>
        Also: {partners.slice(1).join(', ')}
      </div>
    </button>
  );
}

function StatusPip({ cfg, lastSync }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
        <span style={{ fontSize: '10px', color: cfg.dot, fontWeight: 600 }}>{cfg.label}</span>
      </div>
      {lastSync && (
        <span style={{ fontSize: '10px', color: theme.colors.textMuted }}>Synced {lastSync}</span>
      )}
    </div>
  );
}
