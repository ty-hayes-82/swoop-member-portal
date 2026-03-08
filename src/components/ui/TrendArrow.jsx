export default function TrendArrow({ direction, value, period, inverted = false }) {
  const isGood = inverted ? direction === 'down' : direction === 'up';
  const isFlat = direction === 'flat';
  const color = isFlat ? 'var(--text-muted)' : (isGood ? 'var(--success)' : 'var(--urgent)');
  const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '—';
  const pct   = value == null ? '' : typeof value === 'string' ? value : `${Math.abs(value).toFixed(1)}%`;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '3px',
      fontSize: '13px',
      fontWeight: 600,
      color,
      fontFamily: 'var(--font-sans)',
    }}>
      <span style={{ fontSize: '10px' }}>{arrow}</span>
      <span>{pct}</span>
      {period && (
        <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '11px' }}>
          {period}
        </span>
      )}
    </span>
  );
}
