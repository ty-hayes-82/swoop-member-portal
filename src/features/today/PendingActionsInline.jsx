import { useMemo } from 'react';
import { AgentActionCard } from '@/components/ui';
import { trackAction } from '@/services/activityService';
import { useApp } from '@/context/AppContext';
import { useNavigation } from '@/context/NavigationContext';
import { theme } from '@/config/theme';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export default function PendingActionsInline({ excludeId = null }) {
  const { inbox, pendingAgentCount, approveAction, dismissAction, showToast } = useApp();
  const { navigate } = useNavigation();

  const topActions = useMemo(() => {
    const pending = inbox.filter((item) => item.status === 'pending' && item.id !== excludeId);
    return [...pending]
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2))
      .slice(0, 5);
  }, [inbox, excludeId]);

  if (pendingAgentCount === 0) return null;

  const handleApprove = (item) => {
    approveAction(item.id, { approvalAction: 'Approve' });
    showToast(`Approved ${item.description}`, 'success');
    trackAction({ actionType: 'approve', memberId: item.memberId, memberName: item.memberName, description: item.description, referenceId: item.id, referenceType: 'agent_action', agentId: item.agentId });
  };
  const handleDismiss = (item) => {
    dismissAction(item.id, { reason: 'Dismissed from Today view' });
    showToast(`Dismissed ${item.description}`, 'warning');
    trackAction({ actionType: 'dismiss', memberId: item.memberId, memberName: item.memberName, description: item.description, referenceId: item.id, referenceType: 'agent_action', agentId: item.agentId });
  };

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
        {pendingAgentCount > 5 && (
          <button
            onClick={() => navigate('playbooks-automation')}
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: theme.colors.accent,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            View all {pendingAgentCount} actions →
          </button>
        )}
      </div>

      {topActions.map((action) => (
        <AgentActionCard
          key={action.id}
          action={action}
          onApprove={() => handleApprove(action)}
          onDismiss={() => handleDismiss(action)}
        />
      ))}

      {pendingAgentCount > 5 && (
        <button
          onClick={() => navigate('playbooks-automation')}
          style={{
            padding: '8px 16px',
            fontSize: theme.fontSize.xs,
            fontWeight: 600,
            color: theme.colors.accent,
            background: `${theme.colors.accent}08`,
            border: `1px solid ${theme.colors.accent}30`,
            borderRadius: theme.radius.md,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          View all in Playbooks & Automation →
        </button>
      )}
    </div>
  );
}
