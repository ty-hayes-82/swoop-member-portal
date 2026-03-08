import { useMemo, useState } from 'react';
import { AgentActionCard, SoWhatCallout, StoryHeadline } from '@/components/ui';
import { getAgents } from '@/services/agentService';
import { useApp } from '@/context/AppContext';
import { theme } from '@/config/theme';

export default function InboxTab() {
  const { inbox, pendingCount, approveAction, dismissAction } = useApp();
  const [filterAgent, setFilterAgent] = useState('all');
  const agents = getAgents();

  const pendingActions = useMemo(
    () => inbox.filter((item) => item.status === 'pending'),
    [inbox]
  );

  const visible = useMemo(() => {
    if (filterAgent === 'all') return pendingActions;
    return pendingActions.filter((item) => item.agentId === filterAgent);
  }, [pendingActions, filterAgent]);

  const approvedToday = inbox.filter((item) => item.status === 'approved').length;
  const dismissedToday = inbox.filter((item) => item.status === 'dismissed').length;

  const bulkApprove = () => visible.forEach((item) => approveAction(item.id));
  const bulkDismiss = () => visible.forEach((item) => dismissAction(item.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <StoryHeadline
        variant="insight"
        headline={`${pendingCount} agent action${pendingCount !== 1 ? 's' : ''} waiting for approval.`}
        context="Each proposal includes source, impact estimate, and an approval path. Review individually or apply bulk decisions by filter."
      />

      <div className="grid-responsive-4">
        {[
          { label: 'Pending', value: pendingCount, accent: theme.colors.agentCyan },
          { label: 'Visible', value: visible.length, accent: theme.colors.textSecondary },
          { label: 'Approved', value: approvedToday, accent: theme.colors.agentApproved },
          { label: 'Dismissed', value: dismissedToday, accent: theme.colors.agentDismissed },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              padding: theme.spacing.md,
            }}
          >
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {stat.label}
            </div>
            <div style={{ marginTop: 2, fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xl, fontWeight: 700, color: stat.accent }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          background: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Filter by agent</span>
          <select
            value={filterAgent}
            onChange={(event) => setFilterAgent(event.target.value)}
            style={{
              background: theme.colors.bgDeep,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.sm,
              color: theme.colors.textPrimary,
              fontSize: theme.fontSize.xs,
              padding: '6px 8px',
            }}
          >
            <option value="all">All agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            disabled={visible.length === 0}
            onClick={bulkApprove}
            style={{
              borderRadius: theme.radius.sm,
              border: `1px solid ${theme.colors.agentApproved}4D`,
              background: `${theme.colors.agentApproved}1F`,
              color: theme.colors.agentApproved,
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: visible.length > 0 ? 'pointer' : 'default',
              opacity: visible.length > 0 ? 1 : 0.5,
            }}
          >
            Approve visible
          </button>
          <button
            disabled={visible.length === 0}
            onClick={bulkDismiss}
            style={{
              borderRadius: theme.radius.sm,
              border: `1px solid ${theme.colors.border}`,
              background: 'transparent',
              color: theme.colors.textMuted,
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: visible.length > 0 ? 'pointer' : 'default',
              opacity: visible.length > 0 ? 1 : 0.5,
            }}
          >
            Dismiss visible
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        {visible.map((action) => (
          <AgentActionCard
            key={action.id}
            action={action}
            onApprove={() => approveAction(action.id)}
            onDismiss={() => dismissAction(action.id)}
          />
        ))}
      </div>

      {visible.length === 0 && (
        <SoWhatCallout variant="insight">
          No pending actions for this filter. Change filter scope or wait for the next agent sweep.
        </SoWhatCallout>
      )}
    </div>
  );
}
