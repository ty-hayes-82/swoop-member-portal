import { useNavigate } from 'react-router-dom';
import { useMemberProfile } from '@/context/MemberProfileContext';
import { theme } from '@/config/theme';

export default function MemberLink({ memberId, name, children, mode = 'drawer', style, className }) {
  const { openProfile } = useMemberProfile();
  const navigate = useNavigate();

  if (!memberId) {
    return <span className={className} style={style}>{children ?? name}</span>;
  }

  const handleClick = (event) => {
    event?.stopPropagation?.();
    event?.preventDefault?.();
    if (mode === 'route') {
      navigate(`/member/${memberId}`);
      return;
    }
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
      {children ?? name}
    </button>
  );
}
