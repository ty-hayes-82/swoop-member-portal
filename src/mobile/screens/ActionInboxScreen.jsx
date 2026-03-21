import { useMemo, useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { trackAction } from '@/services/activityService';
import useSwipeGesture from '../hooks/useSwipeGesture';
import { useMobileNav } from '../context/MobileNavContext';

const PRIORITY_COLORS = { high: '#EF4444', medium: '#F59E0B', low: '#6B7280' };
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function SwipeableActionCard({ action, onApprove, onDismiss, showHint }) {
  const { elRef, onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture({
    onSwipeRight: () => onApprove(action),
    onSwipeLeft: () => onDismiss(action),
  });

  return (
    <div
      ref={elRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        padding: '14px 16px', borderRadius: '16px',
        background: '#FFFFFF', border: '1px solid #E5E7EB',
        borderLeft: `4px solid ${PRIORITY_COLORS[action.priority] || '#F3922D'}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'transform 0.15s ease, opacity 0.15s ease, background 0.15s ease',
        touchAction: 'pan-y',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{
          fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
          padding: '2px 8px', borderRadius: '10px',
          background: `${PRIORITY_COLORS[action.priority]}15`,
          color: PRIORITY_COLORS[action.priority],
        }}>
          {action.priority}
        </span>
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F0F0F', marginBottom: '4px', lineHeight: 1.4 }}>
        {action.description}
      </div>
      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '10px' }}>
        {action.impactMetric}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onApprove(action)}
          style={{
            flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
            background: '#22C55E', color: '#fff', fontSize: '13px', fontWeight: 700,
            cursor: 'pointer',
          }}
        >Approve</button>
        <button
          onClick={() => onDismiss(action)}
          style={{
            flex: 1, padding: '10px', borderRadius: '10px',
            border: '1px solid #E5E7EB', background: '#fff',
            color: '#6B7280', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer',
          }}
        >Dismiss</button>
      </div>
      {showHint && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#9CA3AF', textAlign: 'center' }}>
          Swipe right to approve · left to dismiss
        </div>
      )}
    </div>
  );
}

function CompletedCard({ action, expanded, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        padding: '10px 16px', borderRadius: '12px', background: '#F9FAFB',
        border: '1px solid #E5E7EB', opacity: 0.8, cursor: 'pointer',
        borderLeft: `3px solid ${action.status === 'approved' ? '#22C55E' : '#EF4444'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '14px' }}>{action.status === 'approved' ? '✓' : '✗'}</span>
        <span style={{
          fontSize: '13px', fontWeight: 600, color: '#374151',
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: expanded ? 'normal' : 'nowrap',
        }}>{action.description}</span>
        <span style={{ fontSize: '12px', color: '#9CA3AF', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: action.status === 'approved' ? '#22C55E' : '#EF4444' }}>{action.status}</span>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{action.source}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>{action.impactMetric}</div>
        </div>
      )}
    </div>
  );
}

function PriorityGroup({ priority, actions, onApprove, onDismiss, hintShown }) {
  const [collapsed, setCollapsed] = useState(priority !== 'high');
  const color = PRIORITY_COLORS[priority] || '#6B7280';
  const count = actions.length;

  if (count === 0) return null;

  // HIGH always expanded, MEDIUM/LOW collapsible
  if (priority === 'high' || !collapsed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {priority !== 'high' && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', borderRadius: '10px',
              background: `${color}10`, border: `1px solid ${color}30`,
              cursor: 'pointer', fontSize: '13px', fontWeight: 600, color,
            }}
          >
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>{priority}</span>
            <span style={{ color: '#6B7280', fontWeight: 400 }}>({count}) — tap to collapse</span>
          </button>
        )}
        {actions.map((action, idx) => (
          <SwipeableActionCard
            key={action.id}
            action={action}
            onApprove={onApprove}
            onDismiss={onDismiss}
            showHint={!hintShown && idx === 0 && priority === 'high'}
          />
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => setCollapsed(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderRadius: '12px',
        background: `${color}08`, border: `1px solid ${color}25`,
        cursor: 'pointer', width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          fontSize: '12px', fontWeight: 700, textTransform: 'uppercase',
          padding: '2px 8px', borderRadius: '10px',
          background: `${color}15`, color,
        }}>{priority}</span>
        <span style={{ fontSize: '13px', color: '#374151', fontWeight: 600 }}>
          {count} action{count !== 1 ? 's' : ''}
        </span>
      </div>
      <span style={{ fontSize: '14px', color: '#9CA3AF' }}>▼</span>
    </button>
  );
}

export default function ActionInboxScreen() {
  const { inbox, approveAction, dismissAction, showToast } = useApp();
  const [filter, setFilter] = useState('pending');
  const [expandedCompleted, setExpandedCompleted] = useState(null);

  const hintShown = typeof localStorage !== 'undefined' && localStorage.getItem('swoop_swipe_hint_seen') === 'true';

  const pendingByPriority = useMemo(() => {
    const pending = inbox.filter(i => i.status === 'pending');
    return {
      high: pending.filter(a => a.priority === 'high').sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)),
      medium: pending.filter(a => a.priority === 'medium'),
      low: pending.filter(a => !a.priority || a.priority === 'low'),
    };
  }, [inbox]);

  const completedActions = useMemo(() => {
    return inbox.filter(i => i.status !== 'pending');
  }, [inbox]);

  const handleApprove = useCallback((action) => {
    approveAction(action.id, { approvalAction: 'Mobile Approve' });
    showToast(`Approved: ${action.description}`, 'success');
    trackAction({ actionType: 'approve', description: action.description, referenceId: action.id });
    if (typeof localStorage !== 'undefined') localStorage.setItem('swoop_swipe_hint_seen', 'true');
  }, [approveAction, showToast]);

  const handleDismiss = useCallback((action) => {
    dismissAction(action.id, { reason: 'Dismissed from mobile' });
    showToast(`Dismissed: ${action.description}`, 'warning');
    trackAction({ actionType: 'dismiss', description: action.description, referenceId: action.id });
    if (typeof localStorage !== 'undefined') localStorage.setItem('swoop_swipe_hint_seen', 'true');
  }, [dismissAction, showToast]);

  const handleApproveAll = useCallback((priority) => {
    const actions = pendingByPriority[priority] || [];
    actions.forEach(action => {
      approveAction(action.id, { approvalAction: `Mobile Batch Approve (${priority})` });
      trackAction({ actionType: 'approve', description: action.description, referenceId: action.id });
    });
    showToast(`Approved ${actions.length} ${priority} priority actions`, 'success');
  }, [pendingByPriority, approveAction, showToast]);

  const pendingCount = inbox.filter(i => i.status === 'pending').length;
  const doneCount = inbox.filter(i => i.status !== 'pending').length;

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', background: '#F3F4F6', borderRadius: '12px', padding: '3px' }}>
        <button onClick={() => setFilter('pending')} style={{
          flex: 1, padding: '8px', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 600,
          background: filter === 'pending' ? '#fff' : 'transparent',
          color: filter === 'pending' ? '#0F0F0F' : '#6B7280',
          boxShadow: filter === 'pending' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          cursor: 'pointer',
        }}>Pending ({pendingCount})</button>
        <button onClick={() => setFilter('done')} style={{
          flex: 1, padding: '8px', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 600,
          background: filter === 'done' ? '#fff' : 'transparent',
          color: filter === 'done' ? '#0F0F0F' : '#6B7280',
          boxShadow: filter === 'done' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          cursor: 'pointer',
        }}>Completed ({doneCount})</button>
      </div>

      {filter === 'pending' && (
        <>
          {/* Batch approve button */}
          {pendingCount >= 3 && (
            <button
              onClick={() => handleApproveAll('low')}
              style={{
                padding: '10px 16px', borderRadius: '10px',
                border: '1px solid #E5E7EB', background: '#F9FAFB',
                cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                color: '#374151', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '6px',
              }}
            >
              Approve all LOW priority ({pendingByPriority.low.length})
            </button>
          )}

          {pendingCount === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
              All caught up! No pending actions.
            </div>
          )}

          <PriorityGroup priority="high" actions={pendingByPriority.high} onApprove={handleApprove} onDismiss={handleDismiss} hintShown={hintShown} />
          <PriorityGroup priority="medium" actions={pendingByPriority.medium} onApprove={handleApprove} onDismiss={handleDismiss} hintShown={hintShown} />
          <PriorityGroup priority="low" actions={pendingByPriority.low} onApprove={handleApprove} onDismiss={handleDismiss} hintShown={hintShown} />
        </>
      )}

      {filter === 'done' && (
        <>
          {completedActions.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
              No completed actions yet.
            </div>
          )}
          {completedActions.map(action => (
            <CompletedCard
              key={action.id}
              action={action}
              expanded={expandedCompleted === action.id}
              onToggle={() => setExpandedCompleted(expandedCompleted === action.id ? null : action.id)}
            />
          ))}
        </>
      )}
    </div>
  );
}
