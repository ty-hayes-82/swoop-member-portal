import { theme } from '@/config/theme';
import { getAgentSummary } from '@/services/agentService';
import { useApp } from '@/context/AppContext';
import InboxTab from './tabs/InboxTab';

export function AgentCommand() {
  const summary = getAgentSummary();
  const { pendingAgentCount } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <div
        style={{
          background: `${theme.colors.accent}10`,
          border: `1px solid ${theme.colors.accent}44`,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: theme.spacing.md,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>🗂</span>
            <span style={{ fontSize: theme.fontSize.xl, fontWeight: 700, color: theme.colors.textPrimary, fontFamily: theme.fonts.serif }}>
              Recommended Actions
            </span>
          </div>
          <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>
            {pendingAgentCount} actions ready for review · {summary.approved} approved / {summary.dismissed} dismissed today
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 4 }}>Impact summary</div>
          <div style={{ fontFamily: theme.fonts.mono, fontWeight: 700, color: theme.colors.agentCyan, fontSize: theme.fontSize.md }}>
            {summary.active} playbooks monitoring · {summary.total} total
          </div>
        </div>
      </div>

      <InboxTab />
    </div>
  );
}
