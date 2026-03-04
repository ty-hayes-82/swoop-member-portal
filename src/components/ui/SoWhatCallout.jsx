const VARIANT_STYLES = {
  insight:     { border: '#6BB8EF40', bg: '#6BB8EF0A', icon: '💡', color: '#6BB8EF' },
  warning:     { border: '#F59E0B40', bg: '#F59E0B0A', icon: '⚠️', color: '#F59E0B' },
  opportunity: { border: '#4ADE8040', bg: '#4ADE800A', icon: '◎', color: '#4ADE80' },
};

export default function SoWhatCallout({ children, variant = 'insight' }) {
  const s = VARIANT_STYLES[variant] || VARIANT_STYLES.insight;

  return (
    <div style={{
      border: `1px solid ${s.border}`,
      background: s.bg,
      borderRadius: '8px',
      padding: '14px 16px',
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>{s.icon}</span>
      <p style={{
        fontSize: '13px',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        fontStyle: 'italic',
      }}>
        {children}
      </p>
    </div>
  );
}
