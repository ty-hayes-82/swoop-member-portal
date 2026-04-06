/**
 * InboxTab — Full-page action inbox for the Automations hub
 * Shows pending actions with approve/dismiss, filters, and recently handled log.
 */
import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';

const PRIORITY_COLORS = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-400',
  low: 'border-l-blue-400',
};

const PRIORITY_BADGES = {
  high: { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
  medium: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  low: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
};

function ActionCard({ action, onApprove, onDismiss }) {
  const priority = action.priority || 'medium';
  const badge = PRIORITY_BADGES[priority] || PRIORITY_BADGES.medium;

  return (
    <div className={`border border-gray-200 rounded-xl px-4 py-3.5 bg-white border-l-4 ${PRIORITY_COLORS[priority] || ''} dark:bg-gray-900 dark:border-gray-800`}>
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="text-sm font-semibold text-gray-800 dark:text-white/90 leading-snug">
          {action.description}
        </div>
        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${badge.bg} ${badge.text}`}>
          {priority}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
        {action.source && <span>{action.source}</span>}
        {action.source && action.actionType && <span>&middot;</span>}
        {action.actionType && <span>{action.actionType.replace(/_/g, ' ').toLowerCase()}</span>}
      </div>

      {action.impactMetric && (
        <div className="text-xs text-brand-600 dark:text-brand-400 font-medium mb-2.5">
          {action.impactMetric}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onApprove(action.id, { executionType: 'email', memberId: action.memberId })}
          className="px-4 py-1.5 rounded-lg bg-success-500 text-white border-none text-xs font-semibold cursor-pointer hover:bg-success-600 transition-colors"
        >
          Approve
        </button>
        <button
          onClick={() => onDismiss(action.id)}
          className="px-4 py-1.5 rounded-lg bg-transparent text-gray-500 border border-gray-200 text-xs font-semibold cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function HandledCard({ action }) {
  const isApproved = action.status === 'approved';
  const time = action.approvedAt || action.dismissedAt;
  const timeStr = time ? new Date(time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <div className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
        isApproved ? 'bg-success-50 text-success-500 dark:bg-success-500/10' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
      }`}>
        {isApproved ? '✓' : '×'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-700 dark:text-gray-300 line-clamp-1">{action.description}</div>
        <div className="text-[10px] text-gray-400 mt-0.5">
          {isApproved ? 'Approved' : 'Dismissed'} {timeStr && `· ${timeStr}`}
        </div>
      </div>
    </div>
  );
}

export default function InboxTab() {
  const { inbox, approveAction, dismissAction } = useApp();
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showHandled, setShowHandled] = useState(false);

  const pending = useMemo(() => {
    const p = inbox.filter(i => i.status === 'pending');
    if (priorityFilter === 'all') return p;
    return p.filter(i => (i.priority || 'medium') === priorityFilter);
  }, [inbox, priorityFilter]);

  const handled = useMemo(() =>
    inbox
      .filter(i => i.status === 'approved' || i.status === 'dismissed')
      .sort((a, b) => new Date(b.approvedAt || b.dismissedAt || 0) - new Date(a.approvedAt || a.dismissedAt || 0))
      .slice(0, 15),
    [inbox]
  );

  const totalPending = inbox.filter(i => i.status === 'pending').length;

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {totalPending} pending action{totalPending !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex gap-1">
          {['all', 'high', 'medium', 'low'].map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold cursor-pointer border transition-colors ${
                priorityFilter === p
                  ? 'bg-gray-800 text-white border-gray-800 dark:bg-gray-200 dark:text-gray-900 dark:border-gray-200'
                  : 'bg-transparent text-gray-500 border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
              }`}
            >
              {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Pending actions */}
      {pending.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-3xl mb-3">✓</div>
          <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">All caught up</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {priorityFilter !== 'all'
              ? `No ${priorityFilter} priority actions. Try "All" filter.`
              : 'No pending actions right now. Your AI agents will surface recommendations here.'}
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {pending.map(action => (
            <ActionCard
              key={action.id}
              action={action}
              onApprove={approveAction}
              onDismiss={dismissAction}
            />
          ))}
        </div>
      )}

      {/* Recently handled */}
      {handled.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowHandled(!showHandled)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 cursor-pointer bg-transparent border-none p-0 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <svg className={`w-3 h-3 transition-transform ${showHandled ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
            Recently handled ({handled.length})
          </button>
          {showHandled && (
            <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 dark:bg-gray-800/50 dark:border-gray-800">
              {handled.map(action => (
                <HandledCard key={action.id} action={action} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
