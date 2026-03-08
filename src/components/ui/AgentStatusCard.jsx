import { theme } from '@/config/theme';

function formatLastAction(timestamp) {
  if (!timestamp) return 'No recent action';
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const STATUS_STYLE = {
  active: { label: 'Active', color: theme.colors.agentApproved, bg: `${theme.colors.agentApproved}1F` },
  idle: { label: 'Idle', color: theme.colors.agentDismissed, bg: `${theme.colors.agentDismissed}1F` },
  learning: { label: 'Learning', color: theme.colors.warning, bg: `${theme.colors.warning}1F` },
};

export function AgentStatusCard({ agent, overrideStatus, onToggle, onConfigure, onViewLog }) {
  const status = overrideStatus ?? agent.status;
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.idle;
  const accuracy = Math.max(0, Math.min(100, agent.accuracy ?? 0));

  return (
    <div
      style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderLeft: `3px solid ${agent.accentColor ?? theme.colors.agentCyan}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.textPrimary }}>{agent.name}</div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: style.color,
            background: style.bg,
            borderRadius: 12,
            padding: '2px 8px',
          }}
        >
          {style.label}
        </span>
      </div>

      <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.5 }}>{agent.description}</div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: '11px', color: theme.colors.textMuted }}>Accuracy</span>
          <span style={{ fontFamily: theme.fonts.mono, fontSize: '11px', color: theme.colors.textPrimary }}>{accuracy}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: theme.colors.bgDeep, overflow: 'hidden' }}>
          <div style={{ width: `${accuracy}%`, height: '100%', background: theme.colors.agentCyan, transition: 'width 0.2s ease' }} />
        </div>
      </div>

      <div style={{ fontSize: '11px', color: theme.colors.textMuted }}>
        Last action: <span style={{ color: theme.colors.textSecondary }}>{formatLastAction(agent.lastAction)}</span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onToggle}
          style={{
            flex: 1,
            borderRadius: theme.radius.sm,
            border: `1px solid ${status === 'active' ? `${theme.colors.warning}59` : `${theme.colors.agentApproved}59`}`,
            background: status === 'active' ? `${theme.colors.warning}1A` : `${theme.colors.agentApproved}1A`,
            color: status === 'active' ? theme.colors.warning : theme.colors.agentApproved,
            padding: '6px 8px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {status === 'active' ? 'Set Idle' : 'Set Active'}
        </button>
        {onViewLog && (
          <button
            onClick={onViewLog}
            style={{
              borderRadius: theme.radius.sm,
              border: `1px solid ${theme.colors.agentCyan}4D`,
              background: 'transparent',
              color: theme.colors.agentCyan,
              padding: '6px 10px',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Thought Log
          </button>
        )}
        {onConfigure && (
          <button
            onClick={onConfigure}
            style={{
              borderRadius: theme.radius.sm,
              border: `1px solid ${theme.colors.border}`,
              background: 'transparent',
              color: theme.colors.textMuted,
              padding: '6px 10px',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Configure
          </button>
        )}
      </div>
    </div>
  );
}
