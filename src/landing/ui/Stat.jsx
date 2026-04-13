import { theme } from '@/config/theme';

export default function Stat({ value, label, inline = false, size = 'md' }) {
  const valueSize = size === 'lg' ? 36 : size === 'sm' ? 20 : 26;
  return (
    <div
      style={{
        display: inline ? 'inline-flex' : 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 2,
        padding: inline ? '8px 14px' : 0,
        border: inline ? `1px solid ${theme.colors.border}` : 'none',
        borderRadius: inline ? 10 : 0,
      }}
    >
      <span
        style={{
          fontFamily: theme.fonts.mono,
          fontSize: valueSize,
          fontWeight: 700,
          lineHeight: 1.1,
          color: theme.neutrals.ink,
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 12,
          color: theme.colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 600,
        }}
      >
        {label}
      </span>
    </div>
  );
}
