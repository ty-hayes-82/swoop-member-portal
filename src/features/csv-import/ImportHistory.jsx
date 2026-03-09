import { theme } from '@/config/theme';

const statusTokens = {
  Complete: { color: theme.colors.success, label: 'Complete' },
  Partial: { color: theme.colors.warning, label: 'Partial' },
  Failed: { color: theme.colors.urgent, label: 'Failed' },
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function ImportHistory({ history = [] }) {
  return (
    <section style={{ border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.lg, padding: theme.spacing.lg, background: theme.colors.bgCard }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <div>
          <h3 style={{ margin: 0, fontSize: theme.fontSize.md }}>Import history</h3>
          <p style={{ margin: '4px 0 0', color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
            Every upload is logged with owner, record counts, and status. Use this trail for audits or to repeat monthly uploads.
          </p>
        </div>
      </div>
      <div style={{ overflowX: 'auto', marginTop: theme.spacing.md }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
          <thead>
            <tr style={{ textAlign: 'left', color: theme.colors.textMuted }}>
              <th style={{ padding: '8px', borderBottom: `1px solid ${theme.colors.border}` }}>File</th>
              <th style={{ padding: '8px', borderBottom: `1px solid ${theme.colors.border}` }}>Category</th>
              <th style={{ padding: '8px', borderBottom: `1px solid ${theme.colors.border}` }}>Records</th>
              <th style={{ padding: '8px', borderBottom: `1px solid ${theme.colors.border}` }}>Status</th>
              <th style={{ padding: '8px', borderBottom: `1px solid ${theme.colors.border}` }}>Uploaded</th>
              <th style={{ padding: '8px', borderBottom: `1px solid ${theme.colors.border}` }}>Owner</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => {
              const status = statusTokens[entry.status] ?? statusTokens.Partial;
              return (
                <tr key={entry.id} style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                  <td style={{ padding: '10px 8px', fontFamily: theme.fonts.mono }}>{entry.fileName}</td>
                  <td style={{ padding: '10px 8px' }}>{entry.category}</td>
                  <td style={{ padding: '10px 8px' }}>{entry.recordCount?.toLocaleString() ?? '—'}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      padding: '2px 10px',
                      borderRadius: 999,
                      border: `1px solid ${status.color}40`,
                      background: `${status.color}12`,
                      color: status.color,
                      fontSize: theme.fontSize.xs,
                      fontWeight: 600,
                    }}>
                      {status.label}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', color: theme.colors.textSecondary }}>{formatDate(entry.uploadedAt)}</td>
                  <td style={{ padding: '10px 8px', color: theme.colors.textSecondary }}>{entry.uploadedBy}</td>
                </tr>
              );
            })}
            {history.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: theme.spacing.lg, textAlign: 'center', color: theme.colors.textMuted }}>
                  No uploads recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
