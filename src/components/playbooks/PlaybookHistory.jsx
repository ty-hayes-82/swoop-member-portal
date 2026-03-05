// PlaybookHistory.jsx — shows simulated past run history for each playbook
// Hard ceiling: 150 lines. Target: 80 lines.

import { PLAYBOOK_HISTORY } from '@/config/actionTypes';
import { theme } from '@/config/theme';

export default function PlaybookHistory({ playbookId, accent }) {
  const history = PLAYBOOK_HISTORY[playbookId];
  if (!history?.length) return null;

  return (
    <div style={{
      marginBottom: theme.spacing.md,
      padding: theme.spacing.md,
      background: `${theme.colors.success}06`,
      border: `1px solid ${theme.colors.success}20`,
      borderRadius: theme.radius.md,
    }}>
      <div style={{
        fontSize: '11px', fontWeight: 600, color: theme.colors.success,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        marginBottom: theme.spacing.sm,
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <span>✓</span> Track Record
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {history.map((record, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center',
            padding: '8px 10px',
            background: theme.colors.bgCardHover,
            borderRadius: theme.radius.sm,
            gap: theme.spacing.md,
          }}>
            {/* Quarter */}
            <span style={{
              fontSize: '11px', fontWeight: 700, color: theme.colors.textMuted,
              fontFamily: theme.fonts.mono, minWidth: '48px',
            }}>
              {record.quarter}
            </span>

            {/* Runs count */}
            <span style={{
              fontSize: '11px', color: theme.colors.textMuted,
              padding: '2px 6px',
              background: `${accent}12`,
              borderRadius: '4px',
              flexShrink: 0,
            }}>
              {record.runs}× run
            </span>

            {/* Outcome */}
            <span style={{
              fontSize: '12px', color: theme.colors.textSecondary,
              flex: 1, minWidth: 0,
            }}>
              {record.outcome}
            </span>

            {/* Impact */}
            <span style={{
              fontSize: '12px', fontWeight: 700,
              color: theme.colors.success,
              fontFamily: theme.fonts.mono,
              flexShrink: 0,
            }}>
              {record.impact}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
