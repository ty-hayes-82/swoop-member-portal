// components/ui/AgentActionCard.jsx — 100 lines
// Contract: action{}, onApprove(), onDismiss(), showRationale?, overrideStatus?
import { useState } from 'react';
import { theme } from '@/config/theme';
import { AGENT_ACTION_TYPES } from '@/config/constants';

const PRIORITY_COLORS = {
  high:   { bg: 'rgba(192,57,43,0.06)', border: 'rgba(192,57,43,0.25)', label: '#C0392B' },
  medium: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.25)', label: '#F59E0B' },
  low:    { bg: 'transparent',           border: theme.colors.border,     label: theme.colors.textMuted },
};

export function AgentActionCard({ action, onApprove, onDismiss, showRationale = false, overrideStatus }) {
  const [expanded, setExpanded] = useState(showRationale);
  const status = overrideStatus ?? action.status;
  const isDone = status === 'approved' || status === 'dismissed';
  const pc = PRIORITY_COLORS[action.priority] ?? PRIORITY_COLORS.low;
  const actionTypeMeta = AGENT_ACTION_TYPES[action.proposedAction?.type] ?? { icon: '⚡', label: action.proposedAction?.type, color: '#22D3EE' };

  return (
    <div style={{
      background: isDone ? theme.colors.bg : pc.bg,
      border: `1px solid ${isDone ? theme.colors.border : pc.border}`,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      opacity: isDone ? 0.6 : 1,
      transition: 'opacity 0.2s',
    }}>
      {/* Type pill + headline */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <span style={{
          flexShrink: 0, fontSize: '11px', fontWeight: 700,
          background: `${actionTypeMeta.color}18`, color: actionTypeMeta.color,
          border: `1px solid ${actionTypeMeta.color}30`,
          borderRadius: theme.radius.sm, padding: '2px 8px', whiteSpace: 'nowrap',
        }}>
          {actionTypeMeta.icon} {actionTypeMeta.label}
        </span>
        {status === 'approved' && <span style={{ fontSize: '11px', color: '#4ADE80', fontWeight: 600 }}>✓ Approved</span>}
        {status === 'dismissed' && <span style={{ fontSize: '11px', color: theme.colors.textMuted, fontWeight: 600 }}>✕ Dismissed</span>}
      </div>

      <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary, lineHeight: 1.4, marginBottom: 6 }}>
        {action.headline}
      </div>

      {/* Impact + signals */}
      <div style={{ display: 'flex', gap: theme.spacing.md, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', background: 'rgba(74,222,128,0.1)', color: '#4ADE80',
          border: '1px solid rgba(74,222,128,0.2)', borderRadius: theme.radius.sm, padding: '1px 8px' }}>
          {action.estimatedImpact}
        </span>
        <span style={{ fontSize: '11px', color: theme.colors.textMuted }}>
          {action.sourceSignals?.length} signals · {new Date(action.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>
      </div>

      {/* Expandable rationale */}
      <button onClick={() => setExpanded(e => !e)} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        fontSize: '11px', color: '#22D3EE', fontWeight: 500, marginBottom: expanded ? 8 : 0,
      }}>
        {expanded ? '▾ Hide rationale' : '▸ Show rationale'}
      </button>

      {expanded && (
        <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.6,
          background: theme.colors.bgDeep, borderRadius: theme.radius.sm, padding: theme.spacing.sm, marginBottom: 10 }}>
          {action.rationale}
          {action.proposedAction?.body && (
            <div style={{ marginTop: 8, padding: 8, background: theme.colors.bgCard,
              borderRadius: theme.radius.sm, fontFamily: theme.fonts.mono, fontSize: '11px',
              color: theme.colors.textPrimary, whiteSpace: 'pre-wrap', borderLeft: `2px solid #22D3EE` }}>
              {action.proposedAction.body || action.proposedAction.message || action.proposedAction.note}
            </div>
          )}
        </div>
      )}

      {/* Approve / Dismiss buttons */}
      {!isDone && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onApprove} style={{
            flex: 1, padding: '7px 0', borderRadius: theme.radius.sm, cursor: 'pointer',
            background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
            color: '#4ADE80', fontSize: '12px', fontWeight: 700,
          }}>✓ Approve</button>
          <button onClick={onDismiss} style={{
            padding: '7px 18px', borderRadius: theme.radius.sm, cursor: 'pointer',
            background: 'transparent', border: `1px solid ${theme.colors.border}`,
            color: theme.colors.textMuted, fontSize: '12px',
          }}>Dismiss</button>
        </div>
      )}
    </div>
  );
}
