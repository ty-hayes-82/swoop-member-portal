import { useState } from 'react';
import { theme } from '@/config/theme';
import { AGENT_ACTION_TYPES } from '@/config/actionTypes';
import MemberLink from '@/components/MemberLink.jsx';
import { getMemberProfile } from '@/services/memberService';
import { getAgentById } from '@/services/agentService';
import { SourceBadgeRow } from '@/components/ui/SourceBadge';
import InfoTooltip from '@/components/ui/InfoTooltip';

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

export function AgentActionCard({ action, onApprove, onDismiss, overrideStatus, onSelect }) {
  const [pulse, setPulse] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'approved' | 'dismissed'
  const status = overrideStatus ?? action.status;
  const isDone = status !== 'pending';
  const typeMeta = AGENT_ACTION_TYPES[action.actionType] ?? { icon: '⬡', label: action.actionType, color: theme.colors.agentCyan };
  const agent = getAgentById(action.agentId);
  const memberProfile = action.memberId ? getMemberProfile(action.memberId) : null;

  const trigger = (handler, feedbackType) => {
    setFeedback(feedbackType);
    setPulse(true);
    window.setTimeout(() => {
      setExiting(true);
      window.setTimeout(() => {
        handler?.();
        setPulse(false);
      }, 200);
    }, 250);
  };

  const handleSelect = () => {
    if (onSelect) onSelect(action);
  };

  return (
    <div
      onClick={handleSelect}
      role={onSelect ? 'button' : undefined}
      style={{
        background: feedback === 'approved' ? '#dcfce7' : feedback === 'dismissed' ? '#fee2e2' : theme.colors.bgCard,
        border: `1px solid ${feedback === 'approved' ? '#22c55e' : feedback === 'dismissed' ? '#ef4444' : theme.colors.border}`,
        borderLeft: `3px solid ${feedback === 'approved' ? '#22c55e' : feedback === 'dismissed' ? '#ef4444' : PRIORITY_COLOR[action.priority] ?? theme.colors.agentCyan}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        opacity: exiting ? 0 : isDone ? 0.68 : 1,
        transform: pulse ? 'scale(0.992)' : 'scale(1)',
        maxHeight: exiting ? 0 : 500,
        overflow: 'hidden',
        transition: 'all 0.25s ease',
        cursor: onSelect ? 'pointer' : 'default',
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
      {memberProfile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: 8 }}>
          <MemberLink memberId={memberProfile.memberId} style={{ fontWeight: 700 }}>{memberProfile.name}</MemberLink>
          <span style={{ fontSize: '11px', color: theme.colors.textMuted }}>{memberProfile.tier}</span>
          <span style={{ fontSize: '11px', fontFamily: theme.fonts.mono, color: theme.colors.textSecondary }}>Score {memberProfile.healthScore}</span>
        </div>
      )}

      {action.signals && action.signals.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <SourceBadgeRow sources={action.signals} size="xs" />
        </div>
      )}

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* FP-P01: Enhanced workflow clarity with info tooltip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '10px', color: theme.colors.textMuted, lineHeight: 1.3 }}>
            <span>What happens next?</span>
            <InfoTooltip text="Approve → Sends push notification via Swoop app → Tracks in Intervention Queue → GM sees response status within 24h. Dismiss → Marks as reviewed without sending." />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={(event) => {
                event.stopPropagation();
                trigger(onApprove, 'approved');
              }}
              title="Approve this action and send via Swoop app. Track progress in Intervention Queue."
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
              onClick={(event) => {
                event.stopPropagation();
                trigger(onDismiss, 'dismissed');
              }}
              title="Dismiss this action. It will be marked as reviewed but not executed."
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
        </div>
      )}
    </div>
  );
}
