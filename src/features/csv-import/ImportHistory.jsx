import { useState } from 'react';
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
  const [expandedId, setExpandedId] = useState(null);

  return (
    <section style={{ border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.lg, padding: theme.spacing.lg, background: theme.colors.bgCard }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <div>
          <h3 style={{ margin: 0, fontSize: theme.fontSize.md }}>Import history</h3>
          <p style={{ margin: '4px 0 0', color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
            Every upload is logged with owner, record counts, and status. Click any row for details.
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
              const isExpanded = expandedId === entry.id;
              const hasDetails = entry.status !== 'Complete' || entry.errors || entry.warnings;
              return (
                <>
                  <tr
                    key={entry.id}
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    style={{
                      borderBottom: isExpanded ? 'none' : `1px solid ${theme.colors.borderLight}`,
                      cursor: 'pointer',
                      background: isExpanded ? `${status.color}06` : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
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
                    <td style={{ padding: '10px 8px', color: theme.colors.textSecondary }}>
                      {entry.uploadedBy}
                      <span style={{ float: 'right', fontSize: '10px', color: theme.colors.textMuted }}>{isExpanded ? '\u25B2' : '\u25BC'}</span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${entry.id}_detail`}>
                      <td colSpan={6} style={{ padding: '0 8px 12px', borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                        <div style={{
                          padding: '14px 16px',
                          borderRadius: theme.radius.sm,
                          background: entry.status === 'Failed' ? '#FEF2F2' : entry.status === 'Partial' ? '#FFFBEB' : '#F0FDF4',
                          border: `1px solid ${status.color}25`,
                        }}>
                          {entry.status === 'Complete' && (
                            <div style={{ color: theme.colors.success, fontSize: theme.fontSize.sm, fontWeight: 600 }}>
                              All {entry.recordCount} records imported successfully. No errors or warnings.
                            </div>
                          )}
                          {entry.status === 'Partial' && (
                            <>
                              <div style={{ fontWeight: 600, fontSize: theme.fontSize.sm, color: theme.colors.warning, marginBottom: '8px' }}>
                                {entry.importedCount ?? Math.round(entry.recordCount * 0.92)} of {entry.recordCount} records imported
                              </div>
                              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginBottom: '8px' }}>
                                {entry.warningCount ?? 15} rows had warnings and were skipped:
                              </div>
                              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.8 }}>
                                {(entry.warnings || [
                                  '12 rows missing tee_time field — required for tee time matching',
                                  '3 duplicate booking IDs found — skipped to prevent double-counting',
                                ]).map((w, i) => <li key={i}>{w}</li>)}
                              </ul>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                <button style={{ padding: '5px 12px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', border: `1px solid ${theme.colors.warning}40`, background: `${theme.colors.warning}12`, color: theme.colors.warning, cursor: 'pointer' }}>
                                  Download Error Report
                                </button>
                                <button style={{ padding: '5px 12px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', border: `1px solid ${theme.colors.border}`, background: 'transparent', color: theme.colors.textSecondary, cursor: 'pointer' }}>
                                  Fix & Re-upload
                                </button>
                              </div>
                            </>
                          )}
                          {entry.status === 'Failed' && (
                            <>
                              <div style={{ fontWeight: 600, fontSize: theme.fontSize.sm, color: theme.colors.urgent, marginBottom: '8px' }}>
                                Import failed — 0 of {entry.recordCount} records imported
                              </div>
                              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginBottom: '8px' }}>
                                {entry.errorCount ?? 2} critical errors prevented import:
                              </div>
                              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.8 }}>
                                {(entry.errors || [
                                  'Column "Total Due" could not be mapped to any known field — expected "amount" or "total"',
                                  'Date format mismatch on 89 rows: found "01/14/26", expected "YYYY-MM-DD" or "MM/DD/YYYY"',
                                ]).map((e, i) => <li key={i} style={{ color: theme.colors.urgent }}>{e}</li>)}
                              </ul>
                              {(entry.errorSample || [
                                { row: 3, field: 'date', value: '01/14/26', expected: 'YYYY-MM-DD' },
                                { row: 47, field: 'Total Due', value: '$42.50', expected: 'Unmapped column' },
                                { row: 112, field: 'date', value: '1/9/26', expected: 'YYYY-MM-DD' },
                              ]).length > 0 && (
                                <>
                                  <div style={{ fontSize: '11px', fontWeight: 600, color: theme.colors.textSecondary, marginTop: '10px', marginBottom: '6px' }}>Sample problem rows:</div>
                                  <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                                    <thead>
                                      <tr style={{ color: theme.colors.textMuted, borderBottom: `1px solid ${theme.colors.border}` }}>
                                        <th style={{ padding: '4px 6px', textAlign: 'left' }}>Row</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'left' }}>Field</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'left' }}>Value</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'left' }}>Expected</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(entry.errorSample || [
                                        { row: 3, field: 'date', value: '01/14/26', expected: 'YYYY-MM-DD' },
                                        { row: 47, field: 'Total Due', value: '$42.50', expected: 'Unmapped column' },
                                        { row: 112, field: 'date', value: '1/9/26', expected: 'YYYY-MM-DD' },
                                      ]).map((s, i) => (
                                        <tr key={i} style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                                          <td style={{ padding: '4px 6px', fontFamily: theme.fonts.mono }}>{s.row}</td>
                                          <td style={{ padding: '4px 6px', fontFamily: theme.fonts.mono, color: theme.colors.urgent }}>{s.field}</td>
                                          <td style={{ padding: '4px 6px', fontFamily: theme.fonts.mono }}>{s.value}</td>
                                          <td style={{ padding: '4px 6px', color: theme.colors.textMuted }}>{s.expected}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </>
                              )}
                              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                <button style={{ padding: '5px 12px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', border: `1px solid ${theme.colors.urgent}40`, background: `${theme.colors.urgent}12`, color: theme.colors.urgent, cursor: 'pointer' }}>
                                  Download Error Report
                                </button>
                                <button style={{ padding: '5px 12px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', border: `1px solid ${theme.colors.border}`, background: 'transparent', color: theme.colors.textSecondary, cursor: 'pointer' }}>
                                  Fix & Re-upload
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
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
