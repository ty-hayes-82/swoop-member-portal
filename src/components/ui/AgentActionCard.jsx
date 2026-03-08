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
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#94A3B8',
};

export function AgentActionCard({ action, onApprove, onDismiss, overrideStatus }) {
  const [pulse, setPulse] = useState(false);
  const status = overrideStatus ?? action.status;
  const isDone = status !== 'pending';
  const typeMeta = AGENT_ACTION_TYPES[action.actionType] ?? { icon: '⬡', label: action.actionType, color: '#22D3EE' };
  const agent = getAgentById(action.agentId);

  const trigger = (handler) => {
    setPulse(true);
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
        borderLeft: `3px solid ${PRIORITY_COLOR[action.priority] ?? '#22D3EE'}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        opacity: isDone ? 0.68 : 1,
        transform: pulse ? 'scale(0.992)' : 'scale(1)',
        transition: 'transform 0.14s ease, opacity 0.2s ease',
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
            color: agent?.accentColor ?? '#22D3EE',
            background: `${agent?.accentColor ?? '#22D3EE'}1A`,
            border: `1px solid ${(agent?.accentColor ?? '#22D3EE')}33`,
            borderRadius: theme.radius.sm,
            padding: '2px 8px',
          }}
        >
          {action.source}
        </span>
        <span
          style={{
            fontSize: '11px',
            color: '#4ADE80',
            background: 'rgba(74,222,128,0.1)',
            border: '1px solid rgba(74,222,128,0.25)',
            borderRadius: theme.radius.sm,
            padding: '2px 8px',
          }}
        >
          Impact: {action.impactMetric}
        </span>
      </div>

      {status === 'approved' && <div style={{ fontSize: '11px', color: '#4ADE80', fontWeight: 700 }}>Approved</div>}
      {status === 'dismissed' && <div style={{ fontSize: '11px', color: theme.colors.textMuted, fontWeight: 700 }}>Dismissed</div>}

      {!isDone && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => trigger(onApprove)}
            style={{
              flex: 1,
              borderRadius: theme.radius.sm,
              border: '1px solid rgba(74,222,128,0.3)',
              background: 'rgba(74,222,128,0.12)',
              color: '#4ADE80',
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
