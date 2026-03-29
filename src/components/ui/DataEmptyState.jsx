import { theme } from '@/config/theme';

/**
 * DataEmptyState — shown when a dashboard section has no data to display.
 * Guides the user to upload the right data type.
 */
export default function DataEmptyState({ icon, title, description, dataType }) {
  return (
    <div style={{
      padding: theme.spacing.xl,
      textAlign: 'center',
      borderRadius: theme.radius.md,
      border: `1px dashed ${theme.colors.border}`,
      background: `${theme.colors.bgDeep}`,
    }}>
      <div style={{ fontSize: '32px', marginBottom: theme.spacing.sm, opacity: 0.6 }}>{icon || '📊'}</div>
      <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: '4px' }}>
        {title || 'No data available'}
      </div>
      <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, maxWidth: 360, margin: '0 auto', lineHeight: 1.6 }}>
        {description || `Upload ${dataType || 'data'} to unlock this section.`}
      </div>
    </div>
  );
}
