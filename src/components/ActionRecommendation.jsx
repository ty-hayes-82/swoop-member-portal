/**
 * ActionRecommendation - Recommended action card
 * Shows owner, due-by, and expected proof metric
 * Follows OS-03: eliminate narrative-only cards, every section ends with action
 */
export default function ActionRecommendation({ action, owner, dueBy, proofMetric, variant = 'default' }) {
  const variantStyles = {
    default: {
      bg: 'var(--bg-card)',
      border: '1px solid var(--accent)',
      borderLeft: '4px solid var(--accent)',
    },
    subtle: {
      bg: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderLeft: '4px solid var(--accent)',
    },
    inline: {
      bg: 'transparent',
      border: 'none',
      borderLeft: '3px solid var(--accent)',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div
      style={{
        background: style.bg,
        border: style.border,
        borderLeft: style.borderLeft,
        borderRadius: variant === 'inline' ? '4px' : '8px',
        padding: variant === 'inline' ? '12px 16px' : '16px 20px',
        marginTop: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <span style={{ fontSize: '18px', lineHeight: 1 }}>→</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
            {action}
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              marginTop: '8px',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            <div>
              <span style={{ opacity: 0.7 }}>Owner: </span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{owner}</span>
            </div>
            <div>
              <span style={{ opacity: 0.7 }}>Due: </span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{dueBy}</span>
            </div>
            {proofMetric && (
              <div>
                <span style={{ opacity: 0.7 }}>Expected result: </span>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{proofMetric}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
