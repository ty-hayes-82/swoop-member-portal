import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigation } from '@/context/NavigationContext';
import { theme } from '@/config/theme';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const PRIORITY_COLORS = { high: theme.colors.urgent, medium: theme.colors.warning, low: theme.colors.textMuted };

export default function PendingActionsInline({ excludeId = null }) {
  const { inbox, pendingAgentCount } = useApp();
  const { navigate } = useNavigation();

  const topActions = useMemo(() => {
    const pending = inbox.filter((item) => item.status === 'pending' && item.id !== excludeId);
    return [...pending]
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2))
      .slice(0, 3);
  }, [inbox, excludeId]);

  if (pendingAgentCount === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          color: theme.colors.accent,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          Pending Actions ({pendingAgentCount})
        </div>
      </div>

      {/* Read-only preview cards */}
      {topActions.map((action) => {
        const prioColor = PRIORITY_COLORS[action.priority] ?? theme.colors.accent;
        return (
          <div
            key={action.id}
            style={{
              padding: '12px 16px',
              borderRadius: theme.radius.md,
              background: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              borderLeft: `4px solid ${prioColor}`,
              boxShadow: theme.shadow.sm,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{
                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.06em', padding: '2px 8px', borderRadius: '10px',
                background: `${prioColor}15`, color: prioColor,
              }}>
                {action.priority}
              </span>
              <span style={{
                fontSize: '10px', fontWeight: 600, color: theme.colors.accent,
                padding: '2px 8px', borderRadius: '10px',
                background: `${theme.colors.accent}10`,
              }}>
                Pending approval
              </span>
            </div>
            <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: '2px', lineHeight: 1.4 }}>
              {action.description}
            </div>
            {action.impactMetric && (
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.success, fontWeight: 500 }}>
                {action.impactMetric}
              </div>
            )}
          </div>
        );
      })}

      {/* Always show the CTA to go to Inbox */}
      <button
        onClick={() => navigate('playbooks-automation')}
        style={{
          padding: '10px 16px',
          fontSize: theme.fontSize.sm,
          fontWeight: 700,
          color: '#fff',
          background: theme.colors.accent,
          border: 'none',
          borderRadius: theme.radius.md,
          cursor: 'pointer',
          textAlign: 'center',
        }}
      >
        Review & approve all {pendingAgentCount} actions in Inbox →
      </button>
    </div>
  );
}
