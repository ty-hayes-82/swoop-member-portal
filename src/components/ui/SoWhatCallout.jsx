const VARIANT_STYLES = {
  insight:     { border: '#6BB8EF', bg: '#6BB8EF0D', icon: '💡', color: '#6BB8EF' },
  warning:     { border: '#F59E0B', bg: '#F59E0B0D', icon: '⚠️', color: '#F59E0B' },
  urgent:      { border: '#C0392B', bg: '#C0392B0D', icon: '⚠',  color: '#C0392B' },
  opportunity: { border: '#F3922D', bg: '#F3922D0D', icon: '◎',  color: '#F3922D' },
};

export default function SoWhatCallout({ children, variant = 'insight' }) {
  const s = VARIANT_STYLES[variant] || VARIANT_STYLES.insight;

  return (
    <div style={{
      borderLeft: `4px solid ${s.border}`,
      borderTop: `1px solid ${s.border}22`,
      borderBottom: `1px solid ${s.border}22`,
      borderRight: `1px solid ${s.border}18`,
      background: s.bg,
      borderRadius: `0 8px 8px 0`,
      padding: '14px 18px',
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-start',
      boxShadow: `0 2px 8px ${s.border}14`,
    }}>
      <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>{s.icon}</span>
      <p style={{
        fontSize: '13px',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        fontStyle: 'italic',
        margin: 0,
      }}>
        {children}
      </p>
    </div>
  );
}
