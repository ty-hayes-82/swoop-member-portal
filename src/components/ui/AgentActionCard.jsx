import { useState } from 'react';
import { theme } from '@/config/theme';
import { AGENT_ACTION_TYPES } from '@/config/actionTypes';
import { getAgentById } from '@/services/agentService';

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const PRIORITY_COLOR = {
  high: theme.colors.urgent,
  medium: theme.colors.warning,
  low: theme.colors.agentDismissed,
};

export function AgentActionCard({ action, onApprove, onDismiss, overrideStatus }) {
  const [pulse, setPulse] = useState(false);
  const [exiting, setExiting] = useState(false);
  const status = overrideStatus ?? action.status;
  const isDone = status !== 'pending';
  const typeMeta = AGENT_ACTION_TYPES[action.actionType] ?? { icon: '⬡', label: action.actionType, color: theme.colors.agentCyan };
  const agent = getAgentById(action.agentId);

  const trigger = (handler) => {
    setPulse(true);
    setExiting(true);
    window.setTimeout(() => {
      handler?.();
      setPulse(false);
    }, 140);
  };

  return (
    <div
      style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderLeft: `3px solid ${PRIORITY_COLOR[action.priority] ?? theme.colors.agentCyan}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        opacity: exiting ? 0 : isDone ? 0.68 : 1,
        transform: pulse ? 'scale(0.992)' : 'scale(1)',
        maxHeight: exiting ? 0 : 500,
        overflow: 'hidden',
        transition: 'transform 0.14s ease, opacity 0.2s ease, max-height 0.25s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: typeMeta.color,
            background: `${typeMeta.color}1A`,
            border: `1px solid ${typeMeta.color}33`,
            borderRadius: theme.radius.sm,
            padding: '2px 8px',
          }}
        >
          {typeMeta.icon} {typeMeta.label}
        </span>
        <span style={{ fontSize: '11px', color: theme.colors.textMuted }}>{formatTime(action.timestamp)}</span>
      </div>

      <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, fontWeight: 600, lineHeight: 1.5, marginBottom: 8 }}>
        {action.description}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <span
          style={{
            fontSize: '11px',
            color: agent?.accentColor ?? theme.colors.agentCyan,
            background: `${agent?.accentColor ?? theme.colors.agentCyan}1A`,
            border: `1px solid ${(agent?.accentColor ?? theme.colors.agentCyan)}33`,
            borderRadius: theme.radius.sm,
            padding: '2px 8px',
          }}
        >
          {action.source}
        </span>
        <span
          style={{
            fontSize: '11px',
            color: theme.colors.agentApproved,
            background: `${theme.colors.agentApproved}1A`,
            border: `1px solid ${theme.colors.agentApproved}40`,
            borderRadius: theme.radius.sm,
            padding: '2px 8px',
          }}
        >
          Impact: {action.impactMetric}
        </span>
      </div>

      {status === 'approved' && <div style={{ fontSize: '11px', color: theme.colors.agentApproved, fontWeight: 700 }}>Approved</div>}
      {status === 'dismissed' && <div style={{ fontSize: '11px', color: theme.colors.textMuted, fontWeight: 700 }}>Dismissed</div>}

      {!isDone && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => trigger(onApprove)}
            style={{
              flex: 1,
              borderRadius: theme.radius.sm,
              border: `1px solid ${theme.colors.agentApproved}4D`,
              background: `${theme.colors.agentApproved}1F`,
              color: theme.colors.agentApproved,
              padding: '7px 0',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Approve
          </button>
          <button
            onClick={() => trigger(onDismiss)}
            style={{
              borderRadius: theme.radius.sm,
              border: `1px solid ${theme.colors.border}`,
              background: 'transparent',
              color: theme.colors.textMuted,
              padding: '7px 12px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
