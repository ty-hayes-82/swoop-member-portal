import { useMemberProfile } from '@/context/MemberProfileContext';
import { theme } from '@/config/theme';

export default function MemberLink({ memberId, children, mode = 'drawer', style, className }) {
  const { openProfile } = useMemberProfile();

  if (!memberId) {
    return <span className={className} style={style}>{children}</span>;
  }

  const handleClick = (event) => {
    event?.stopPropagation?.();
    openProfile(memberId, { mode });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      style={{
        border: 'none',
        background: 'none',
        padding: 0,
        margin: 0,
        font: 'inherit',
        color: theme.colors.accent,
        cursor: 'pointer',
        textDecoration: 'underline',
        textDecorationColor: theme.colors.accent + '80',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
