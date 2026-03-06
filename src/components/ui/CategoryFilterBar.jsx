// CategoryFilterBar — horizontal scrollable filter tabs for 10 vendor categories
// Props: categories (with count), activeCategory (string | null), onSelect fn
// Color rule: all colors via theme.colors only — no hardcoded hex
import { theme } from '@/config/theme';

export default function CategoryFilterBar({ categories = [], activeCategory, onSelect }) {
  return (
    <div style={{
      overflowX:  'auto',
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      paddingBottom: '2px',
    }}>
      <div style={{
        display:    'flex',
        gap:        theme.spacing.sm,
        alignItems: 'center',
        minWidth:   'max-content',
        padding:    `${theme.spacing.xs} 0`,
      }}>
        {/* "All" pill */}
        <Pill
          label="All"
          icon={null}
          count={categories.reduce((s, c) => s + (c.count ?? 0), 0)}
          isActive={activeCategory === null}
          color={theme.colors.accent}
          onSelect={() => onSelect(null)}
        />

        {categories.map(cat => {
          const color = theme.colors[cat.themeColor] ?? theme.colors.accent;
          return (
            <Pill
              key={cat.id}
              label={cat.label}
              icon={cat.icon}
              count={cat.count ?? 0}
              isActive={activeCategory === cat.id}
              color={color}
              onSelect={() => onSelect(activeCategory === cat.id ? null : cat.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function Pill({ label, icon, count, isActive, color, onSelect }) {
  return (
    <button
      onClick={onSelect}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           '5px',
        padding:       '6px 12px',
        borderRadius:  theme.radius.xl,
        border:        `1px solid ${isActive ? color : theme.colors.border}`,
        background:    isActive ? color : theme.colors.bgCard,
        color:         isActive ? theme.colors.bgCard : theme.colors.textSecondary,
        fontSize:      theme.fontSize.sm,
        fontWeight:    isActive ? 700 : 500,
        cursor:        'pointer',
        whiteSpace:    'nowrap',
        transition:    'all 0.15s ease',
        fontFamily:    theme.fonts.sans,
      }}
    >
      {icon && <span style={{ fontSize: '13px', lineHeight: 1 }}>{icon}</span>}
      {label}
      {count > 0 && (
        <span style={{
          fontSize:   '10px',
          fontWeight: 700,
          background: isActive ? 'rgba(255,255,255,0.25)' : theme.colors.bgDeep,
          color:      isActive ? theme.colors.bgCard : theme.colors.textMuted,
          padding:    '1px 5px',
          borderRadius: theme.radius.sm,
          minWidth:   '18px',
          textAlign:  'center',
        }}>
          {count}
        </span>
      )}
    </button>
  );
}
