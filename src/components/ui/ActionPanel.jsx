/**
 * ActionPanel — Inline expandable action panel scoped to a specific item.
 * Replaces the context-free sidebar with contextual, in-place action recommendations.
 *
 * Props:
 *   context       — { memberId, memberName, description, source } — what triggered this panel
 *   recommended   — [{ id, label, icon, type, description }] — AI-ranked actions for this context
 *   onApprove     — (actionId, meta) => void
 *   onDismiss     — (actionId, meta) => void
 *   onClose       — () => void — collapse the panel
 *   compact       — boolean — render in a tighter layout for card footers
 */
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { trackAction, checkRecentOutreach } from '@/services/activityService';

const MORE_ACTIONS = [
  { key: 'email', icon: '✉', label: 'Send Email', type: 'email' },
  { key: 'sms', icon: '💬', label: 'Send SMS', type: 'sms' },
  { key: 'call', icon: '📞', label: 'Schedule Call', type: 'call' },
  { key: 'staff-alert', icon: '📢', label: 'Staff Alert', type: 'staff_task' },
  { key: 'front-desk', icon: '🚩', label: 'Front Desk Flag', type: 'staff_task' },
  { key: 'comp', icon: '🎁', label: 'Comp Offer', type: 'comp_offer' },
];

export default function ActionPanel({ context = {}, recommended = [], onApprove, onDismiss, onClose, compact = false }) {
  const { approveAction, dismissAction, addAction, showToast } = useApp();
  const [showMore, setShowMore] = useState(false);
  const [handled, setHandled] = useState(new Set());

  const handleApprove = (action) => {
    const id = action.id || `ap_${Date.now()}`;
    const meta = {
      executionType: action.type || 'email',
      memberId: context.memberId,
      memberName: context.memberName,
      skipCloudSend: !action.id,
    };

    if (action.id && onApprove) {
      onApprove(action.id, meta);
    } else if (action.id) {
      approveAction(action.id, meta);
    } else {
      // Quick action — add to inbox then approve
      addAction({
        description: `${action.label} — ${context.memberName || 'Member'}`,
        memberId: context.memberId,
        memberName: context.memberName,
        actionType: 'RETENTION_OUTREACH',
        source: context.source || 'Quick Action',
        priority: 'medium',
        impactMetric: action.label,
      });
      approveAction(id, meta);
    }

    showToast(`${action.label} approved for ${context.memberName || 'member'}`, 'success');
    trackAction({
      actionType: 'approve',
      actionSubtype: action.type || 'general',
      memberId: context.memberId,
      memberName: context.memberName,
      description: `Inline approved: ${action.label}`,
    });
    setHandled(prev => new Set(prev).add(action.id || action.key));
  };

  const handleDismiss = (action) => {
    if (action.id && onDismiss) {
      onDismiss(action.id);
    } else if (action.id) {
      dismissAction(action.id);
    } else {
      // Ad-hoc recommendation without a persisted ID — log directly
      trackAction({
        actionType: 'dismiss',
        actionSubtype: 'inline',
        memberId: context.memberId,
        memberName: context.memberName,
        description: `Dismissed: ${action.label}`,
      });
    }
    setHandled(prev => new Set(prev).add(action.id || action.key));
  };

  const handleQuickAction = (actionDef) => {
    const check = checkRecentOutreach(context.memberId);
    if (check.recentlyContacted) {
      showToast(`Note: ${context.memberName || 'Member'} was contacted ${check.hoursAgo}h ago (${check.lastContact?.type})`, 'warning');
    }
    const meta = {
      executionType: actionDef.type,
      memberId: context.memberId,
      memberName: context.memberName,
      skipCloudSend: true,
    };
    addAction({
      description: `${actionDef.label} — ${context.memberName || 'Member'}`,
      memberId: context.memberId,
      memberName: context.memberName,
      actionType: 'RETENTION_OUTREACH',
      source: context.source || 'Quick Action',
      priority: 'medium',
      impactMetric: actionDef.label,
    });
    const id = `ap_${Date.now()}`;
    approveAction(id, meta);
    showToast(`${actionDef.label} triggered for ${context.memberName || 'member'}`, 'success');
    trackAction({
      actionType: actionDef.type,
      memberId: context.memberId,
      memberName: context.memberName,
      description: actionDef.label,
    });
    setShowMore(false);
  };

  const activeRecommended = recommended.filter(r => !handled.has(r.id || r.key));
  const py = compact ? 'py-2.5 px-3' : 'py-3.5 px-4';

  return (
    <div className={`${py} rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 mt-2`}>
      {/* Recommended actions */}
      {activeRecommended.length > 0 && (
        <div className="mb-2">
          <div className="text-[10px] font-bold text-brand-500 uppercase tracking-wide mb-2">
            Recommended
          </div>
          <div className="flex flex-col gap-1.5">
            {activeRecommended.map((action) => (
              <div
                key={action.id || action.key}
                className="flex items-center justify-between gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-700"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm shrink-0">{action.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-800 dark:text-white/90 truncate">{action.label}</div>
                    {action.description && (
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{action.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleApprove(action); }}
                    className="px-3 py-1 rounded-md bg-success-500 text-white text-[11px] font-semibold border-none cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDismiss(action); }}
                    className="px-2.5 py-1 rounded-md bg-transparent text-gray-500 text-[11px] font-semibold border border-gray-200 cursor-pointer dark:border-gray-700 dark:text-gray-400"
                  >
                    Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All handled */}
      {activeRecommended.length === 0 && recommended.length > 0 && (
        <div className="text-center py-2">
          <div className="text-xs text-success-500 font-semibold">All actions handled</div>
        </div>
      )}

      {/* More actions picker */}
      <div>
        <button
          onClick={(e) => { e.stopPropagation(); setShowMore(!showMore); }}
          className="text-[11px] font-semibold text-brand-500 bg-transparent border-none cursor-pointer p-0 flex items-center gap-1"
        >
          {showMore ? '▾' : '▸'} More actions
        </button>
        {showMore && (
          <div className="flex gap-1.5 flex-wrap mt-2">
            {MORE_ACTIONS.map((a) => (
              <button
                key={a.key}
                onClick={(e) => { e.stopPropagation(); handleQuickAction(a); }}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-gray-200 bg-white text-gray-700 cursor-pointer inline-flex items-center gap-1 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300"
              >
                <span>{a.icon}</span> {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Close */}
      {onClose && (
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="mt-2 text-[11px] text-gray-400 bg-transparent border-none cursor-pointer p-0 hover:text-gray-600"
        >
          Collapse
        </button>
      )}
    </div>
  );
}
