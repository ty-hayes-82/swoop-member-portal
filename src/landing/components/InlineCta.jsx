import { theme } from '@/config/theme';
import { Icon } from '@/landing/ui';

export default function InlineCta({ text = 'See how it works', targetId = 'demo-form' }) {
  const onClick = (event) => {
    event.preventDefault();
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <a
        href={`#${targetId}`}
        onClick={onClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: theme.colors.accent,
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: 16,
          borderBottom: `2px solid ${theme.colors.accent}`,
          paddingBottom: 4,
        }}
      >
        {text}
        <Icon name="ArrowRight" size={18} color={theme.colors.accent} />
      </a>
    </div>
  );
}
