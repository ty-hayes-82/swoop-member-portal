import { theme } from '@/config/theme';

const baseStyle = {
  height: 48,
  padding: '0 16px',
  borderRadius: 10,
  border: '1px solid rgba(17,17,17,0.15)',
  background: '#FFFFFF',
  fontFamily: theme.fonts.sans,
  fontSize: 15,
  color: theme.neutrals.ink,
  width: '100%',
  outline: 'none',
  transition: 'border-color 160ms, box-shadow 160ms',
  boxSizing: 'border-box',
};

const focusStyle = {
  borderColor: theme.colors.accent,
  boxShadow: `0 0 0 3px rgba(243,146,45,0.15)`,
};

export default function Input({ label, textarea = false, tone = 'light', style, ...rest }) {
  const Field = textarea ? 'textarea' : 'input';
  const labelColor = tone === 'dark' ? 'rgba(255,255,255,0.75)' : theme.colors.textSecondary;
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      {label && (
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: labelColor,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {label}
        </span>
      )}
      <Field
        {...rest}
        style={{
          ...baseStyle,
          ...(textarea && { height: 'auto', minHeight: 120, padding: 14, resize: 'vertical' }),
          ...style,
        }}
        onFocus={(e) => Object.assign(e.currentTarget.style, focusStyle)}
        onBlur={(e) => Object.assign(e.currentTarget.style, { borderColor: 'rgba(17,17,17,0.15)', boxShadow: 'none' })}
      />
    </label>
  );
}
