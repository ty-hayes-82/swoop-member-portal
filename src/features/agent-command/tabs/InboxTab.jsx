// features/agent-command/tabs/InboxTab.jsx — 140 lines target
import { AgentActionCard, SoWhatCallout, StoryHeadline } from '@/components/ui';
import { getPendingActions, getAgentSummary, getTopPendingAction } from '@/services/agentService';
import { useApp } from '@/context/AppContext';
import { theme } from '@/config/theme';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export default function InboxTab() {
  const { getActionStatus, approveAction, dismissAction } = useApp();
  const actions = getPendingActions().sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  );
  const summary = getAgentSummary();
  const approved = actions.filter(a => getActionStatus(a.id) === 'approved').length;
  const dismissed = actions.filter(a => getActionStatus(a.id) === 'dismissed').length;
  const stillPending = actions.filter(a => getActionStatus(a.id) === 'pending').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <StoryHeadline
        variant="insight"
        headline={`${stillPending} agent action${stillPending !== 1 ? 's' : ''} waiting for your approval.`}
        context="Your agents ran their morning sweeps and identified the highest-leverage interventions for today. Each action has a rationale, estimated impact, and a draft ready to execute. You approve. They act."
      />

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: theme.spacing.md }}>
        {[
          { label: 'Pending',  value: stillPending, accent: '#22D3EE' },
          { label: 'High Priority', value: actions.filter(a => a.priority === 'high' && getActionStatus(a.id) === 'pending').length, accent: theme.colors.urgent },
          { label: 'Approved Today', value: approved, accent: '#4ADE80' },
          { label: 'Active Agents', value: summary.active, accent: theme.colors.textSecondary },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{
            background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md, padding: theme.spacing.md, boxShadow: theme.shadow.sm,
          }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            <div style={{ fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.mono,
              fontWeight: 700, color: accent, marginTop: 2 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Action cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        {actions.map(action => (
          <AgentActionCard
            key={action.id}
            action={action}
            overrideStatus={getActionStatus(action.id)}
            showRationale={action.priority === 'high' && getActionStatus(action.id) === 'pending'}
            onApprove={() => approveAction(action.id)}
            onDismiss={() => dismissAction(action.id)}
          />
        ))}
      </div>

      {stillPending === 0 && (
        <SoWhatCallout variant="insight">
          <strong>Inbox clear.</strong> All {actions.length} actions have been reviewed.
          {approved > 0 && ` ${approved} approved and ready for execution.`}
          {dismissed > 0 && ` ${dismissed} dismissed.`} Next agent sweep at 6:00 AM tomorrow.
        </SoWhatCallout>
      )}

      {stillPending > 0 && (
        <SoWhatCallout variant="warning">
          <strong>Each approval takes less than 30 seconds.</strong> Without them, three at-risk members
          go uncontacted today — including James Whitfield, who has a tee time in 3 hours and an unresolved
          complaint. Noteefy fills tee times. Swoop prevents the resignations.
        </SoWhatCallout>
      )}
    </div>
  );
}
