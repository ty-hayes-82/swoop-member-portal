// VendorCard — individual vendor card with tier badge, status, and combo count
// Props: id, name, categoryLabel, icon, themeColor, tier, status,
//        lastSync, description, comboCount, isSelected, onSelect
// Color rule: all colors via theme.colors only — no hardcoded hex
import { theme } from '@/config/theme';
import TierBadge from './TierBadge';

const STATUS_DOT = {
  connected:   { color: 'success',  label: 'Connected'   },
  available:   { color: 'warning',  label: 'Available'   },
  coming_soon: { color: 'textMuted', label: 'Coming Soon' },
};

export default function VendorCard({
  name, categoryLabel, icon, themeColor, tier, status,
  lastSync, description, comboCount = 0, isSelected, onSelect,
}) {
  const cfg         = STATUS_DOT[status] ?? STATUS_DOT.available;
  const statusColor = theme.colors[cfg.color];
  const accentColor = theme.colors[themeColor] ?? theme.colors.accent;

  return (
    <button
      onClick={onSelect}
      style={{
        display:       'flex',
        flexDirection: 'column',
        gap:           theme.spacing.sm,
        width:         '100%',
        textAlign:     'left',
        background:    theme.colors.bgCard,
        border:        `1px solid ${isSelected ? accentColor : theme.colors.border}`,
        borderLeft:    `3px solid ${isSelected ? accentColor : 'transparent'}`,
        borderRadius:  theme.radius.md,
        padding:       theme.spacing.md,
        cursor:        'pointer',
        transition:    'box-shadow 0.15s ease, border-color 0.15s ease',
        boxShadow:     isSelected ? theme.shadow.md : theme.shadow.sm,
        fontFamily:    theme.fonts.sans,
      }}
    >
      {/* Top row: icon + name + TierBadge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          fontSize: '18px', lineHeight: 1,
          width: '32px', height: '32px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', borderRadius: theme.radius.sm,
          background: `${accentColor}14`, flexShrink: 0,
        }}>
          {icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: theme.fontSize.sm, fontWeight: 700,
            color: theme.colors.textPrimary, lineHeight: 1.3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {name}
          </div>
          <div style={{
            fontSize: '11px', color: accentColor, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            {categoryLabel}
          </div>
        </div>
        <TierBadge tier={tier} size="sm" />
      </div>

      {/* Description */}
      <p style={{
        fontSize: '12px', color: theme.colors.textSecondary,
        lineHeight: 1.5, margin: 0,
        display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {description}
      </p>

      {/* Bottom row: status + combo count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: statusColor, flexShrink: 0,
          }} />
          <span style={{ fontSize: '11px', color: theme.colors.textMuted, fontWeight: 500 }}>
            {cfg.label}
            {status === 'connected' && lastSync ? ` · ${lastSync}` : ''}
          </span>
        </div>
        {comboCount > 0 && (
          <span style={{
            fontSize: '11px', color: theme.colors.accent,
            fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px',
          }}>
            {comboCount} combo insight{comboCount > 1 ? 's' : ''} →
          </span>
        )}
      </div>
    </button>
  );
}
