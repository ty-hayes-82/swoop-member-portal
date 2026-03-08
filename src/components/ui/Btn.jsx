// Btn — Button primitive with clear visual hierarchy
// variant: 'primary' | 'secondary' | 'tertiary' | 'ghost'
// Phase A design improvement: stops all-ghost-button syndrome
import { theme } from '@/config/theme';

const BASE = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  fontFamily: theme.fonts.sans, fontWeight: 600,
  borderRadius: theme.radius.md, cursor: 'pointer',
  transition: 'all 0.15s ease', border: 'none', outline: 'none',
  textDecoration: 'none', whiteSpace: 'nowrap',
};

const SIZE = {
  sm: { padding: '5px 12px', fontSize: theme.fontSize.xs },
  md: { padding: '7px 16px', fontSize: theme.fontSize.sm },
  lg: { padding: '10px 22px', fontSize: theme.fontSize.md },
};

function getVariantStyle(variant, accentColor, disabled) {
  const accent = accentColor ?? theme.colors.accent;   // orange by default
  if (disabled) return {
    background: theme.colors.bgDeep,
    color: theme.colors.textMuted,
    border: `1px solid ${theme.colors.border}`,
    cursor: 'not-allowed', opacity: 0.6,
  };
  switch (variant) {
    case 'primary':
      return {
        background: accent, color: theme.colors.white,
        border: `1px solid ${accent}`,
        boxShadow: `0 1px 3px ${accent}40`,
      };
    case 'secondary':
      return {
        background: `${accent}10`, color: accent,
        border: `1px solid ${accent}40`,
      };
    case 'ghost':
      return {
        background: theme.colors.bgCard, color: theme.colors.textSecondary,
        border: `1px solid ${theme.colors.border}`,
      };
    case 'tertiary':
    default:
      return {
        background: 'none', color: theme.colors.textSecondary,
        border: 'none', padding: undefined,
        fontWeight: 500, fontSize: theme.fontSize.sm,
        textDecoration: 'none',
      };
  }
}

export default function Btn({
  variant = 'ghost',
  size = 'md',
  accent,
  disabled = false,
  onClick,
  children,
  style = {},
}) {
  const sizeStyle = variant === 'tertiary' ? {} : SIZE[size];
  const variantStyle = getVariantStyle(variant, accent, disabled);

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...BASE, ...sizeStyle, ...variantStyle, ...style }}
    >
      {children}
    </button>
  );
}
