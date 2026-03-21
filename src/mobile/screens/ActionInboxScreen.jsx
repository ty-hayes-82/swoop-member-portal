import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { trackAction } from '@/services/activityService';
import useSwipeGesture from '../hooks/useSwipeGesture';
import { useMobileNav } from '../context/MobileNavContext';

const PRIORITY_COLORS = { high: '#EF4444', medium: '#F59E0B', low: '#6B7280' };

function SwipeableActionCard({ action, onApprove, onDismiss, onTapMember }) {
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
          fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
          padding: '2px 8px', borderRadius: '10px',
          background: `${PRIORITY_COLORS[action.priority]}15`,
          color: PRIORITY_COLORS[action.priority],
        }}>
          {action.priority}
        </span>
        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{action.source}</span>
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
      <div style={{ marginTop: '8px', fontSize: '11px', color: '#9CA3AF', textAlign: 'center' }}>
        Swipe right to approve · left to dismiss
      </div>
    </div>
  );
}

export default function ActionInboxScreen() {
  const { inbox, approveAction, dismissAction, showToast } = useApp();
  const [filter, setFilter] = useState('pending');

  const actions = useMemo(() => {
    let items = inbox;
    if (filter === 'pending') items = items.filter(i => i.status === 'pending');
    else if (filter === 'done') items = items.filter(i => i.status !== 'pending');
    return [...items].sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 };
      return (p[a.priority] ?? 2) - (p[b.priority] ?? 2);
    });
  }, [inbox, filter]);

  const handleApprove = (action) => {
    approveAction(action.id, { approvalAction: 'Mobile Approve' });
    showToast(`Approved: ${action.description}`, 'success');
    trackAction({ actionType: 'approve', description: action.description, referenceId: action.id });
  };

  const handleDismiss = (action) => {
    dismissAction(action.id, { reason: 'Dismissed from mobile' });
    showToast(`Dismissed: ${action.description}`, 'warning');
    trackAction({ actionType: 'dismiss', description: action.description, referenceId: action.id });
  };

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

      {/* Cards */}
      {actions.length === 0 && (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
          {filter === 'pending' ? 'All caught up! No pending actions.' : 'No completed actions yet.'}
        </div>
      )}
      {actions.map(action => (
        filter === 'pending' ? (
          <SwipeableActionCard
            key={action.id}
            action={action}
            onApprove={handleApprove}
            onDismiss={handleDismiss}
          />
        ) : (
          <div key={action.id} style={{
            padding: '12px 16px', borderRadius: '12px', background: '#F9FAFB',
            border: '1px solid #E5E7EB', opacity: 0.8,
            borderLeft: `3px solid ${action.status === 'approved' ? '#22C55E' : '#EF4444'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: action.status === 'approved' ? '#22C55E' : '#EF4444' }}>{action.status}</span>
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{action.source}</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginTop: '4px' }}>{action.description}</div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{action.impactMetric}</div>
          </div>
        )
      ))}
    </div>
  );
}
