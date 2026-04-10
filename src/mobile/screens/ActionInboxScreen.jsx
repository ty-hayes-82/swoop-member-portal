import { useMemo, useState, useCallback, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { trackAction } from '@/services/activityService';
import useSwipeGesture from '../hooks/useSwipeGesture';
import { useMobileNav } from '../context/MobileNavContext';

const PRIORITY_COLORS = { high: '#EF4444', medium: '#F59E0B', low: '#6B7280' };
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function SwipeableActionCard({ action, onApprove, onDismiss, showHint }) {
  const cardRef = useRef(null);
  const [exiting, setExiting] = useState(null); // 'approve' | 'dismiss' | null

  const { elRef, onTouchStart, onTouchMove, onTouchEnd, isSwiping } = useSwipeGesture({
    onSwipeRight: () => handleApprove(),
    onSwipeLeft: () => handleDismiss(),
  });

  const handleApprove = () => {
    if (exiting) return;
    setExiting('approve');
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => onApprove(action), 350);
  };

  const handleDismiss = () => {
    if (exiting) return;
    setExiting('dismiss');
    setTimeout(() => onDismiss(action), 350);
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px' }}>
      {/* Swipe reveal backgrounds */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        borderRadius: '16px', overflow: 'hidden',
      }}>
        <div style={{ flex: 1, background: '#DCFCE7', display: 'flex', alignItems: 'center', paddingLeft: '20px' }}>
          <span style={{ fontSize: '24px' }}>✓</span>
        </div>
        <div style={{ flex: 1, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '20px' }}>
          <span style={{ fontSize: '24px' }}>✗</span>
        </div>
      </div>

      <div
        ref={elRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          padding: '14px 16px', borderRadius: '16px',
          background: exiting === 'approve' ? '#DCFCE7' : exiting === 'dismiss' ? '#FEE2E2' : '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderLeft: `4px solid ${PRIORITY_COLORS[action.priority] || '#F3922D'}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          position: 'relative', zIndex: 1,
          touchAction: isSwiping ? 'none' : 'pan-y',
          transition: exiting ? 'transform 0.3s ease, opacity 0.3s ease, background 0.3s ease' : 'none',
          transform: exiting === 'approve' ? 'translateX(400px)' : exiting === 'dismiss' ? 'translateX(-400px)' : undefined,
          opacity: exiting ? 0 : undefined,
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
            onClick={handleApprove}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
              background: '#12b76a', color: '#fff', fontSize: '13px', fontWeight: 700,
              cursor: 'pointer',
            }}
          >Approve</button>
          <button
            onClick={handleDismiss}
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
    </div>
  );
}

function CompletedCard({ action, expanded, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        padding: '10px 16px', borderRadius: '12px', background: '#F9FAFB',
        border: '1px solid #E5E7EB', cursor: 'pointer',
        borderLeft: `3px solid ${action.status === 'approved' ? '#12b76a' : '#EF4444'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '2px' }}>{action.status === 'approved' ? '✓' : '✗'}</span>
        <span style={{
          fontSize: '13px', fontWeight: 600, color: '#374151',
          flex: 1, overflow: 'hidden',
          ...(expanded ? {} : {
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }),
        }}>{action.description}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          style={{
            width: '44px', height: '44px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '12px', color: '#9CA3AF', flexShrink: 0,
            margin: '-10px -8px -10px 0',
          }}
        >{expanded ? '▲' : '▼'}</button>
      </div>
      {expanded && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: action.status === 'approved' ? '#12b76a' : '#EF4444' }}>{action.status}</span>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{action.source}</span>
          </div>
          {action.impactMetric && (
            <div style={{ fontSize: '12px', color: '#12b76a', marginTop: '4px', fontWeight: 500 }}>{action.impactMetric}</div>
          )}
        </div>
      )}
    </div>
  );
}

function PriorityGroup({ priority, actions, onApprove, onDismiss, onApproveAll, hintShown }) {
  const [collapsed, setCollapsed] = useState(priority !== 'high');
  const [showAll, setShowAll] = useState(false);
  const color = PRIORITY_COLORS[priority] || '#6B7280';
  const count = actions.length;

  // Group duplicate member actions. MUST stay above any early return — rules of hooks.
  const grouped = useMemo(() => {
    const memberCounts = {};
    actions.forEach(a => {
      const key = a.memberName || a.description;
      if (!memberCounts[key]) memberCounts[key] = [];
      memberCounts[key].push(a);
    });
    const result = [];
    const seen = new Set();
    actions.forEach(a => {
      const key = a.memberName || a.description;
      if (seen.has(key)) return;
      seen.add(key);
      const group = memberCounts[key];
      if (group.length >= 3) {
        result.push({ type: 'batch', memberName: key, actions: group, count: group.length });
      } else {
        group.forEach(act => result.push({ type: 'single', action: act }));
      }
    });
    return result;
  }, [actions]);

  // Early-return AFTER all hooks have run (rules-of-hooks compliant)
  if (count === 0) return null;

  const displayLimit = showAll ? grouped.length : 5;

  if (priority === 'high' || !collapsed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {priority !== 'high' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setCollapsed(true)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', borderRadius: '10px',
                background: `${color}10`, border: `1px solid ${color}30`,
                cursor: 'pointer', fontSize: '13px', fontWeight: 600, color,
              }}
            >
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>{priority}</span>
              <span style={{ color: '#6B7280', fontWeight: 400 }}>({count})</span>
            </button>
            {count >= 2 && (
              <button
                onClick={() => onApproveAll(priority)}
                style={{
                  padding: '8px 14px', borderRadius: '10px', border: 'none',
                  background: '#12b76a', color: '#fff', fontSize: '12px',
                  fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                Approve all ({count})
              </button>
            )}
          </div>
        )}
        {grouped.slice(0, displayLimit).map((item, idx) => {
          if (item.type === 'batch') {
            return (
              <BatchCard
                key={`batch-${item.memberName}`}
                memberName={item.memberName}
                actions={item.actions}
                onApproveAll={() => item.actions.forEach(a => onApprove(a))}
                onDismissAll={() => item.actions.forEach(a => onDismiss(a))}
              />
            );
          }
          return (
            <SwipeableActionCard
              key={item.action.id}
              action={item.action}
              onApprove={onApprove}
              onDismiss={onDismiss}
              showHint={!hintShown && idx === 0 && priority === 'high'}
            />
          );
        })}
        {grouped.length > 5 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            style={{
              padding: '10px', borderRadius: '10px', border: '1px solid #E5E7EB',
              background: '#F9FAFB', cursor: 'pointer', fontSize: '13px',
              fontWeight: 600, color: '#6B7280', textAlign: 'center',
            }}
          >
            Show remaining {grouped.length - 5} actions
          </button>
        )}
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

function BatchCard({ memberName, actions, onApproveAll, onDismissAll }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      padding: '14px 16px', borderRadius: '16px',
      background: '#FFFFFF', border: '1px solid #E5E7EB',
      borderLeft: `4px solid ${PRIORITY_COLORS[actions[0]?.priority] || '#F59E0B'}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F0F0F' }}>
          {actions.length} actions for {memberName}
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#9CA3AF', padding: '4px 8px' }}
        >{expanded ? '▲' : '▼'}</button>
      </div>
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
          {actions.map(a => (
            <div key={a.id} style={{ fontSize: '12px', color: '#6B7280', padding: '4px 0', borderBottom: '1px solid #F3F4F6' }}>
              {a.description}
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onApproveAll} style={{
          flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
          background: '#12b76a', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
        }}>Approve All</button>
        <button onClick={onDismissAll} style={{
          flex: 1, padding: '10px', borderRadius: '10px',
          border: '1px solid #E5E7EB', background: '#fff',
          color: '#6B7280', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
        }}>Dismiss All</button>
      </div>
    </div>
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
      high: pending.filter(a => a.priority === 'high'),
      medium: pending.filter(a => a.priority === 'medium'),
      low: pending.filter(a => !a.priority || a.priority === 'low'),
    };
  }, [inbox]);

  const completedActions = useMemo(() => inbox.filter(i => i.status !== 'pending'), [inbox]);

  const handleApprove = useCallback((action) => {
    const channel = (action.recommendedChannel || 'email').toLowerCase();
    const execType = channel === 'sms' || channel === 'push' ? 'sms' : channel === 'call' ? 'staff_task' : 'email';
    approveAction(action.id, { approvalAction: 'Mobile Approve', executionType: execType, memberId: action.memberId, memberName: action.memberName });
    showToast(`Approved: ${action.description}`, 'success');
    trackAction({ actionType: 'approve', memberId: action.memberId, memberName: action.memberName, description: action.description, referenceId: action.id });
    if (typeof localStorage !== 'undefined') localStorage.setItem('swoop_swipe_hint_seen', 'true');
  }, [approveAction, showToast]);

  const handleDismiss = useCallback((action) => {
    dismissAction(action.id, { reason: 'Dismissed from mobile' });
    showToast(`Dismissed: ${action.description}`, 'warning');
    trackAction({ actionType: 'dismiss', memberId: action.memberId, memberName: action.memberName, description: action.description, referenceId: action.id });
    if (typeof localStorage !== 'undefined') localStorage.setItem('swoop_swipe_hint_seen', 'true');
  }, [dismissAction, showToast]);

  const handleApproveAll = useCallback((priority) => {
    const actions = pendingByPriority[priority] || [];
    actions.forEach(action => {
      approveAction(action.id, { approvalAction: `Mobile Batch Approve (${priority})`, memberId: action.memberId, memberName: action.memberName });
      trackAction({ actionType: 'approve', memberId: action.memberId, memberName: action.memberName, description: action.description, referenceId: action.id });
    });
    showToast(`Approved ${actions.length} ${priority} priority actions`, 'success');
    if (navigator.vibrate) navigator.vibrate(50);
  }, [pendingByPriority, approveAction, showToast]);

  const pendingCount = inbox.filter(i => i.status === 'pending').length;
  const doneCount = completedActions.length;

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

          <PriorityGroup priority="high" actions={pendingByPriority.high} onApprove={handleApprove} onDismiss={handleDismiss} onApproveAll={handleApproveAll} hintShown={hintShown} />
          <PriorityGroup priority="medium" actions={pendingByPriority.medium} onApprove={handleApprove} onDismiss={handleDismiss} onApproveAll={handleApproveAll} hintShown={hintShown} />
          <PriorityGroup priority="low" actions={pendingByPriority.low} onApprove={handleApprove} onDismiss={handleDismiss} onApproveAll={handleApproveAll} hintShown={hintShown} />
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
