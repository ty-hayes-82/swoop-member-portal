import { theme } from '@/config/theme';

const statusStyles = {
  auto: { label: 'Auto-match', color: theme.colors.accent },
  manual: { label: 'Manual', color: theme.colors.info ?? theme.colors.textSecondary },
  unmapped: { label: 'Unmapped', color: theme.colors.urgent },
};

export default function FieldMapper({ mappings = [], targetFields = [], onChange, previewRows = [] }) {
  if (!mappings.length) {
    return (
      <section style={{ border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.lg, padding: theme.spacing.lg, background: theme.colors.bgCard }}>
        <h3 style={{ margin: 0, fontSize: theme.fontSize.md }}>Field Mapping</h3>
        <p style={{ margin: '6px 0 0', color: theme.colors.textMuted }}>Upload a CSV or XLSX file to map columns into Swoop fields.</p>
      </section>
    );
  }

  const selectOptions = [
    { value: '', label: 'Ignore this column' },
    ...targetFields.map((field) => ({
      value: field.key,
      label: `${field.label}${field.required ? ' · required' : ''}`,
    })),
  ];

  const previewHeaders = mappings.map((mapping) => mapping.source || '(unnamed)').slice(0, 6);

  return (
    <section style={{
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      background: theme.colors.bgCard,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.md,
    }}>
      <div>
        <h3 style={{ margin: 0, fontSize: theme.fontSize.md }}>Field Mapping</h3>
        <p style={{ margin: '4px 0 0', color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
          Confirm or override how your file columns map into Swoop fields. Required fields are highlighted automatically.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {mappings.map((mapping) => {
          const status = statusStyles[mapping.status] ?? statusStyles.manual;
          const isRequired = targetFields.find((field) => field.key === mapping.target)?.required;
          return (
            <div
              key={mapping.source || Math.random()}
              style={{
                border: `1px solid ${isRequired ? theme.colors.accent : theme.colors.border}`,
                borderRadius: theme.radius.md,
                padding: '10px 12px',
                display: 'grid',
                gridTemplateColumns: '1.5fr 1.2fr',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600 }}>{mapping.source || '(empty column)'}</div>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
                  {mapping.confidence ? `Confidence ${(mapping.confidence * 100).toFixed(0)}%` : 'No match yet'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <select
                  value={mapping.target ?? ''}
                  onChange={(event) => onChange?.(mapping.source, event.target.value)}
                  style={{
                    flex: 1,
                    borderRadius: theme.radius.sm,
                    border: `1px solid ${theme.colors.border}`,
                    padding: '6px 8px',
                    fontSize: theme.fontSize.sm,
                    background: theme.colors.bg,
                    color: theme.colors.textPrimary,
                  }}
                >
                  {selectOptions.map((option) => (
                    <option key={`${mapping.source}-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span style={{
                  fontSize: theme.fontSize.xs,
                  color: status.color,
                  borderRadius: 999,
                  border: `1px solid ${status.color}44`,
                  padding: '2px 8px',
                  fontWeight: 600,
                }}>
                  {status.label}
                  {isRequired ? ' · required' : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {previewRows.length > 0 && (
        <div style={{ borderTop: `1px solid ${theme.colors.border}`, paddingTop: theme.spacing.md }}>
          <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, marginBottom: 6 }}>Preview (first 5 rows)</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.fontSize.xs }}>
              <thead>
                <tr>
                  {previewHeaders.map((header) => (
                    <th key={header} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${theme.colors.border}`, color: theme.colors.textMuted }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 5).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {previewHeaders.map((header) => (
                      <td key={`${rowIndex}-${header}`} style={{ padding: '6px 8px', borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                        {row[header] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
