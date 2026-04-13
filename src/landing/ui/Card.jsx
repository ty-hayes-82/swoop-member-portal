import { theme } from '@/config/theme';

export default function Card({
  as: Tag = 'article',
  featured = false,
  padded = true,
  interactive = false,
  children,
  style,
  ...rest
}) {
  const base = {
    background: theme.neutrals.paper,
    border: `1px solid ${featured ? theme.colors.accent : 'rgba(17,17,17,0.08)'}`,
    borderRadius: 18,
    padding: padded ? 'clamp(24px, 3vw, 32px)' : 0,
    boxShadow: featured ? theme.shadow.cardHover : theme.shadow.card,
    transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    position: 'relative',
    ...(featured && { transform: 'translateY(-4px)' }),
    ...style,
  };

  const handlers = interactive
    ? {
        onMouseEnter: (e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = theme.shadow.cardHover;
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.transform = featured ? 'translateY(-4px)' : 'none';
          e.currentTarget.style.boxShadow = featured ? theme.shadow.cardHover : theme.shadow.card;
        },
      }
    : {};

  return (
    <Tag style={base} {...handlers} {...rest}>
      {children}
    </Tag>
  );
}
