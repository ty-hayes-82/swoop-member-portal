// PendingActionsInline — Action Queue: hero alert + pending actions with inline action panels
import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { getAllActions } from '@/services/agentService';
import MemberLink from '@/components/MemberLink';
import ActionPanel from '@/components/ui/ActionPanel';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#9CA3AF' };

// Map agent/source names to role-based owners
const SOURCE_TO_OWNER = {
  'Member Pulse': 'Membership Director',
  'Demand Optimizer': 'GM',
  'Service Recovery': 'F&B Director',
  'Revenue Analyst': 'GM',
};

function getActionOwner(action) {
  if (action.suggestedOwner) return action.suggestedOwner.split('·')[0].trim();
  if (action.source && SOURCE_TO_OWNER[action.source]) return SOURCE_TO_OWNER[action.source];
  if (action.actionType === 'STAFFING_ADJUSTMENT') return 'F&B Director';
  if (action.actionType === 'SERVICE_RECOVERY') return 'F&B Director';
  return 'GM';
}

// Build scoped recommended actions from an inbox action item
function buildRecommended(action) {
  const channel = (action.recommendedChannel || 'email').toLowerCase();
  const recommended = [];

  if (channel === 'sms' || channel === 'push') {
    recommended.push({ id: action.id, key: 'primary', icon: '💬', label: 'Send SMS', type: 'sms', description: action.impactMetric || action.description });
  } else if (channel === 'call') {
    recommended.push({ id: action.id, key: 'primary', icon: '📞', label: 'Schedule Call', type: 'staff_task', description: action.impactMetric || action.description });
  } else {
    recommended.push({ id: action.id, key: 'primary', icon: '✉', label: 'Send Email', type: 'email', description: action.impactMetric || action.description });
  }

  // Add a secondary action if member-specific
  if (action.memberId && channel !== 'call') {
    recommended.push({ key: 'secondary', icon: '📞', label: 'Schedule Follow-up Call', type: 'call', description: `Follow up with ${action.memberName || 'member'}` });
  }

  return recommended;
}

export default function PendingActionsInline({ topPriority = null }) {
  const { inbox: contextInbox, pendingAgentCount, approveAction, dismissAction } = useApp();
  // Fallback: if context inbox empty due to timing, load directly
  const inbox = contextInbox.length > 0 ? contextInbox : getAllActions();
  const { navigate } = useNavigationContext();
  const [expandedId, setExpandedId] = useState(null);

  const topActions = useMemo(() => {
    const pending = inbox.filter(
      (item) => item.status === 'pending' && item.id !== topPriority?.id
    );
    return [...pending]
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2))
      .slice(0, 3);
  }, [inbox, topPriority?.id]);

  const hasHero = !!topPriority;
  const hasActions = pendingAgentCount > 0;

  if (!hasHero && !hasActions) return null;

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div>
      <div className="text-[11px] font-bold text-brand-500 uppercase tracking-wide mb-3">
        Action Queue {hasActions ? `(${pendingAgentCount})` : ''}
      </div>

      <div className="flex flex-col gap-2">
        {/* Hero alert — top priority action card */}
        {hasHero && (
          <div>
            <div
              onClick={() => toggleExpand(topPriority.id || 'hero')}
              className="py-3.5 px-[18px] rounded-xl bg-red-500/[0.024] border border-red-500/[0.15] border-l-4 border-l-red-500 shadow-sm cursor-pointer transition-shadow duration-150 hover:shadow-md"
            >
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide py-0.5 px-2 rounded-[10px] bg-red-500/[0.08] text-red-500">
                    Priority
                  </span>
                  <span className="text-[9px] font-bold py-0.5 px-1.5 rounded bg-brand-500/[0.06] text-brand-500 uppercase tracking-tight">
                    GM
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-red-500 py-0.5 px-2 rounded-[10px] bg-red-500/[0.06]">
                  {expandedId === (topPriority.id || 'hero') ? 'Collapse' : 'Act Now'}
                </span>
              </div>
              <div className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-1 leading-snug">
                {topPriority.memberName ? (
                  <>
                    <MemberLink
                      mode="drawer"
                      memberId={topPriority.memberId}
                      className="font-bold text-gray-800 dark:text-white/90"
                    >
                      {topPriority.memberName}
                    </MemberLink>
                    {' '}{topPriority.headline.replace(topPriority.memberName, '').trim()}
                  </>
                ) : (
                  topPriority.headline
                )}
              </div>
              {topPriority.recommendation && (
                <div className="text-xs text-gray-500 leading-snug">
                  {topPriority.recommendation}
                </div>
              )}
            </div>
            {expandedId === (topPriority.id || 'hero') && (
              <ActionPanel
                context={{
                  memberId: topPriority.memberId,
                  memberName: topPriority.memberName,
                  description: topPriority.headline,
                  source: topPriority.source || 'Briefing',
                }}
                recommended={topPriority.id ? buildRecommended({
                  ...topPriority,
                  id: topPriority.actionId || topPriority.id,
                  recommendedChannel: topPriority.recommendedChannel || 'email',
                }) : [
                  { key: 'email', icon: '✉', label: 'Send Personal Email', type: 'email', description: topPriority.recommendation },
                  { key: 'call', icon: '📞', label: 'Schedule GM Call', type: 'call', description: `Call ${topPriority.memberName || 'member'}` },
                ]}
                onApprove={approveAction}
                onDismiss={dismissAction}
                onClose={() => setExpandedId(null)}
                compact
              />
            )}
          </div>
        )}

        {/* Pending action cards */}
        {topActions.map((action) => {
          const prioColor = PRIORITY_COLORS[action.priority] ?? '#ff8b00';
          const isExpanded = expandedId === action.id;
          return (
            <div key={action.id}>
              <div
                onClick={() => toggleExpand(action.id)}
                className="py-3 px-4 rounded-xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 shadow-sm cursor-pointer transition-shadow duration-150 hover:shadow-md"
                style={{ borderLeft: `4px solid ${prioColor}` }}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide py-0.5 px-2 rounded-[10px]"
                      style={{ background: `${prioColor}15`, color: prioColor }}
                    >
                      {action.priority}
                    </span>
                    <span className="text-[9px] font-bold py-0.5 px-1.5 rounded bg-brand-500/[0.06] text-brand-500 uppercase tracking-tight">
                      {getActionOwner(action)}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-brand-500 py-0.5 px-2 rounded-[10px] bg-brand-500/[0.06]">
                    {isExpanded ? 'Collapse' : 'Take action'}
                  </span>
                </div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-0.5 leading-snug">
                  {action.description}
                </div>
                {action.impactMetric && (
                  <div className="text-xs text-success-500 font-medium">
                    {action.impactMetric}
                  </div>
                )}
              </div>
              {isExpanded && (
                <ActionPanel
                  context={{
                    memberId: action.memberId,
                    memberName: action.memberName,
                    description: action.description,
                    source: action.source,
                  }}
                  recommended={buildRecommended(action)}
                  onApprove={approveAction}
                  onDismiss={dismissAction}
                  onClose={() => setExpandedId(null)}
                  compact
                />
              )}
            </div>
          );
        })}

        {/* CTA to review all */}
        {hasActions && (
          <button
            onClick={() => navigate('automations')}
            className="py-2.5 px-4 text-sm font-bold text-white bg-brand-500 border-none rounded-xl cursor-pointer text-center"
          >
            Review all {pendingAgentCount} actions in Inbox →
          </button>
        )}
      </div>
    </div>
  );
}
