import { useNavigate } from 'react-router-dom';
import { useMemberProfile } from '@/context/MemberProfileContext';

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
      className={`border-none bg-transparent p-0 m-0 font-inherit text-brand-500 cursor-pointer underline decoration-brand-500/50 ${className || ''}`}
      style={style}
    >
      {children ?? name}
    </button>
  );
}
