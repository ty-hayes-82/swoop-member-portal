import { theme } from '@/config/theme';

const sizeStyles = {
  sm: { height: 36, padding: '0 16px', fontSize: 14 },
  md: { height: 44, padding: '0 20px', fontSize: 15 },
  lg: { height: 52, padding: '0 26px', fontSize: 16 },
};

const base = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  borderRadius: 10,
  fontFamily: theme.fonts.sans,
  fontWeight: 700,
  border: '2px solid transparent',
  cursor: 'pointer',
  transition: 'background 160ms ease, color 160ms ease, transform 160ms ease, box-shadow 160ms ease',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

const variants = {
  primary: {
    background: theme.colors.accent,
    color: '#FFFFFF',
    boxShadow: '0 8px 20px rgba(243,146,45,0.28)',
  },
  primaryHover: {
    background: '#D97706',
    boxShadow: '0 12px 26px rgba(243,146,45,0.38)',
    transform: 'translateY(-1px)',
  },
  ghost: {
    background: 'transparent',
    color: theme.neutrals.ink,
    borderColor: theme.neutrals.ink,
  },
  ghostHover: {
    background: theme.neutrals.ink,
    color: '#FFFFFF',
  },
  light: {
    background: '#FFFFFF',
    color: theme.neutrals.ink,
    border: '2px solid rgba(17,17,17,0.1)',
  },
  lightHover: {
    borderColor: theme.colors.accent,
    color: theme.colors.accent,
  },
};

export default function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'lg',
  onClick,
  href,
  children,
  style,
  type = 'button',
  block = false,
  ...rest
}) {
  const hoverKey = `${variant}Hover`;
  const mergedStyle = {
    ...base,
    ...sizeStyles[size],
    ...variants[variant],
    width: block ? '100%' : 'auto',
    ...style,
  };

  const props = {
    onClick,
    style: mergedStyle,
    onMouseEnter: (e) => {
      Object.assign(e.currentTarget.style, variants[hoverKey] || {});
    },
    onMouseLeave: (e) => {
      Object.assign(e.currentTarget.style, {
        ...variants[variant],
        transform: 'none',
      });
    },
    ...rest,
  };

  if (Tag === 'a' || href) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} {...props}>
      {children}
    </button>
  );
}
