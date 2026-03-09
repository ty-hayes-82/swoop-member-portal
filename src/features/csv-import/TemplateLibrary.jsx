import { theme } from '@/config/theme';

export default function TemplateLibrary({ templates, selectedKey, onSelect, onDownload }) {
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
          <h3 style={{ margin: 0, fontSize: theme.fontSize.md }}>Template Library</h3>
          <p style={{ margin: '4px 0 0', color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
            Download starter files for any system that lacks an API. Each template includes headers, three example rows,
            and instructions to keep data consistent across clubs.
          </p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: theme.spacing.md }}>
        {templates.map((template) => {
          const requiredCount = template.fields.filter((field) => field.required).length;
          const optionalCount = template.fields.length - requiredCount;
          const isSelected = template.key === selectedKey;
          return (
            <div
              key={template.key}
              style={{
                border: `1px solid ${isSelected ? theme.colors.accent : theme.colors.border}`,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
                background: isSelected ? `${theme.colors.accent}06` : theme.colors.bgCard,
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.sm,
                minHeight: 180,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{template.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, color: theme.colors.textPrimary }}>{template.label}</div>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{template.description}</div>
                </div>
              </div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
                <strong>{requiredCount}</strong> required · <strong>{optionalCount}</strong> optional fields
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => onSelect?.(template.key)}
                  style={{
                    flex: 1,
                    borderRadius: theme.radius.sm,
                    border: `1px solid ${isSelected ? theme.colors.accent : theme.colors.border}`,
                    background: isSelected ? theme.colors.accent : 'transparent',
                    color: isSelected ? theme.colors.white : theme.colors.textPrimary,
                    fontSize: theme.fontSize.xs,
                    fontWeight: 600,
                    padding: '6px 10px',
                    cursor: 'pointer',
                  }}
                >
                  {isSelected ? 'Selected' : 'Use template'}
                </button>
                <button
                  type="button"
                  onClick={() => onDownload?.(template.key)}
                  style={{
                    borderRadius: theme.radius.sm,
                    border: `1px solid ${theme.colors.border}`,
                    background: theme.colors.bgCard,
                    color: theme.colors.textSecondary,
                    fontSize: theme.fontSize.xs,
                    fontWeight: 600,
                    padding: '6px 10px',
                    cursor: 'pointer',
                  }}
                >
                  Download CSV
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
