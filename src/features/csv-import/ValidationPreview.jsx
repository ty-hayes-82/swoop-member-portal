import { theme } from '@/config/theme';

const badgeStyles = {
  ready: { label: 'Ready', color: theme.colors.success },
  warnings: { label: 'Warnings', color: theme.colors.warning },
  errors: { label: 'Errors', color: theme.colors.urgent },
};

export default function ValidationPreview({ validation, onImport, importing }) {
  if (!validation || validation.status === 'idle') {
    return (
      <section style={{ border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.lg, padding: theme.spacing.lg, background: theme.colors.bgCard }}>
        <h3 style={{ margin: 0, fontSize: theme.fontSize.md }}>Validation</h3>
        <p style={{ margin: '6px 0 0', color: theme.colors.textMuted }}>Map your fields to run validation on required values, formats, and ranges.</p>
      </section>
    );
  }

  const { totals, issues, status } = validation;
  const blocked = status === 'blocked';

  const summaryChips = [
    { key: 'ready', value: totals.ready, ...badgeStyles.ready },
    { key: 'warnings', value: totals.warnings, ...badgeStyles.warnings },
    { key: 'errors', value: totals.errors, ...badgeStyles.errors },
  ];

  const renderIssues = (title, items, color) => (
    <div style={{ marginTop: theme.spacing.sm }}>
      <div style={{ fontSize: theme.fontSize.xs, color, fontWeight: 600 }}>{title}</div>
      <ul style={{ margin: '6px 0 0', paddingLeft: '18px', color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }}>
        {items.slice(0, 5).map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );

  const statusText = blocked
    ? 'Resolve structural issues and errors before importing.'
    : status === 'warnings'
      ? 'Rows with warnings will be imported with caveats.'
      : 'All rows validated. Ready to import.';

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <div>
          <h3 style={{ margin: 0, fontSize: theme.fontSize.md }}>Validation</h3>
          <p style={{ margin: '4px 0 0', color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>{statusText}</p>
        </div>
        <button
          type="button"
          disabled={blocked || importing}
          onClick={onImport}
          style={{
            border: 'none',
            borderRadius: theme.radius.sm,
            padding: '8px 16px',
            background: blocked ? theme.colors.border : theme.colors.accent,
            color: blocked ? theme.colors.textSecondary : theme.colors.white,
            fontWeight: 600,
            cursor: blocked ? 'not-allowed' : 'pointer',
          }}
        >
          {importing ? 'Importing…' : 'Confirm import'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {summaryChips.map((chip) => (
          <div key={chip.key} style={{
            minWidth: 90,
            borderRadius: theme.radius.sm,
            border: `1px solid ${chip.color}33`,
            background: `${chip.color}0F`,
            padding: '8px 12px',
          }}>
            <div style={{ fontSize: theme.fontSize.xs, color: chip.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{chip.label}</div>
            <div style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.lg, color: theme.colors.textPrimary }}>{chip.value}</div>
          </div>
        ))}
      </div>
      {issues?.structural?.length > 0 && renderIssues('Structural', issues.structural, theme.colors.urgent)}
      {issues?.errors?.length > 0 && renderIssues('Errors', issues.errors, theme.colors.urgent)}
      {issues?.warnings?.length > 0 && renderIssues('Warnings', issues.warnings, theme.colors.warning)}
    </section>
  );
}
