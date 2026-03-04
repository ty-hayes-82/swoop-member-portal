export default function EmptyState({ icon = '◌', title = 'No data', message }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      gap: '12px',
      color: 'var(--text-muted)',
    }}>
      <span style={{ fontSize: '32px', opacity: 0.5 }}>{icon}</span>
      <span style={{ fontSize: '15px', fontWeight: 500 }}>{title}</span>
      {message && (
        <span style={{ fontSize: '13px', textAlign: 'center', maxWidth: '280px', lineHeight: 1.5 }}>
          {message}
        </span>
      )}
    </div>
  );
}
