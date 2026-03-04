const VARIANT_STYLES = {
  urgent:   { bg: '#EF444420', color: '#EF4444', border: '#EF444440' },
  warning:  { bg: '#F59E0B20', color: '#F59E0B', border: '#F59E0B40' },
  success:  { bg: '#22C55E20', color: '#22C55E', border: '#22C55E40' },
  neutral:  { bg: '#8BAF8B20', color: '#8BAF8B', border: '#8BAF8B40' },
  effort:   { bg: '#6BB8EF20', color: '#6BB8EF', border: '#6BB8EF40' },
  timeline: { bg: '#A78BFA20', color: '#A78BFA', border: '#A78BFA40' },
};

export default function Badge({ text, variant = 'neutral', size = 'sm' }) {
  const s = VARIANT_STYLES[variant] || VARIANT_STYLES.neutral;
  const pad = size === 'sm' ? '2px 8px' : '4px 12px';
  const fs  = size === 'sm' ? '11px' : '13px';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: pad,
      borderRadius: '999px',
      fontSize: fs,
      fontWeight: 600,
      letterSpacing: '0.02em',
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
      fontFamily: 'var(--font-sans)',
    }}>
      {text}
    </span>
  );
}
