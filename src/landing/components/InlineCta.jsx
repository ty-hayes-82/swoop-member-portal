import { theme } from '@/config/theme';

export default function InlineCta({ text = 'See how it works', targetId = 'demo-form' }) {
  const onClick = (event) => {
    event.preventDefault();
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{ textAlign: 'center', marginBottom: theme.spacing.xxl }}>
      <a href={`#${targetId}`} onClick={onClick} style={{
        color: theme.colors.accent,
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: theme.fontSize.lg,
      }}>
        {text} &rarr;
      </a>
    </div>
  );
}
