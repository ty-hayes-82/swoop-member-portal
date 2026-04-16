// PendingActionsInline — Action Queue: hero alert + pending actions with inline action panels
import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { getAllActions } from '@/services/agentService';
import MemberLink from '@/components/MemberLink';
import ActionPanel from '@/components/ui/ActionPanel';
import ActionCard from '@/components/ui/ActionCard';
import { apiFetch } from '@/services/apiClient';

// Fire-and-forget POST to /api/recommendation-feedback. The human-eval loop
// reads this aggregate to judge whether individual agents are producing
// recommendations GMs actually act on.
function sendFeedback({ feedback, actionId, agentId, reason, snoozeHours, rating }) {
  apiFetch('/api/recommendation-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedback, actionId, agentId, reason, snoozeHours, rating }),
  }).catch(() => { /* feedback is fire-and-forget */ });
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

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
  const [snoozedIds, setSnoozedIds] = useState(() => new Set());

  // Wrapped action handlers that also POST feedback for the human-eval loop
  const handleApprove = (id, meta) => {
    approveAction(id, meta);
    const action = inbox.find(a => a.id === id);
    sendFeedback({ feedback: 'accept', actionId: id, agentId: action?.agentId });
  };
  const handleDismiss = (id, meta) => {
    dismissAction(id, meta);
    const action = inbox.find(a => a.id === id);
    sendFeedback({ feedback: 'dismiss', actionId: id, agentId: action?.agentId, reason: meta?.reason });
  };
  const handleSnooze = (id, hours = 24) => {
    const action = inbox.find(a => a.id === id);
    setSnoozedIds(prev => { const next = new Set(prev); next.add(id); return next; });
    sendFeedback({ feedback: 'snooze', actionId: id, agentId: action?.agentId, snoozeHours: hours });
  };

  const topActions = useMemo(() => {
    const pending = inbox.filter(
      (item) => item.status === 'pending'
        && item.id !== topPriority?.id
        && !snoozedIds.has(item.id)
    );
    return [...pending]
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2))
      .slice(0, 5);
  }, [inbox, topPriority?.id, snoozedIds]);

  const totalPending = inbox.filter(i => i.status === 'pending' && !snoozedIds.has(i.id)).length;

  const hasHero = !!topPriority;
  const hasActions = pendingAgentCount > 0;

  if (!hasHero && !hasActions) return null;

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-bold text-brand-500 uppercase tracking-wide">
          Top {topActions.length} Critical Actions
          {totalPending > topActions.length && (
            <span className="ml-1 font-normal text-swoop-text-label normal-case tracking-normal">of {totalPending} total</span>
          )}
        </div>
        {totalPending > topActions.length && (
          <button
            type="button"
            onClick={() => navigate('automations')}
            className="text-[10px] font-semibold text-brand-400 hover:underline bg-transparent border-none cursor-pointer p-0"
          >
            See all {totalPending} →
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {/* Hero alert — top priority action card */}
        {hasHero && (() => {
          const heroId = topPriority.id || 'hero';
          const heroAction = {
            id: heroId,
            priority: topPriority.priority || 'high',
            description: topPriority.headline,
            impactMetric: topPriority.recommendation,
            source: topPriority.source || 'Briefing',
          };
          const heroTitle = topPriority.memberName ? (
            <>
              <MemberLink
                mode="drawer"
                memberId={topPriority.memberId}
                className="font-bold text-swoop-text"
              >
                {topPriority.memberName}
              </MemberLink>
              {' '}{topPriority.headline.replace(topPriority.memberName, '').trim()}
            </>
          ) : topPriority.headline;

          return (
            <ActionCard
              key={heroId}
              action={heroAction}
              ownerLabel="GM"
              titleNode={heroTitle}
              impactNode={topPriority.recommendation}
              expanded={expandedId === heroId}
              onToggle={() => toggleExpand(heroId)}
              onApprove={() => toggleExpand(heroId)}
              approveLabel="Act Now"
            >
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
                onApprove={handleApprove}
                onDismiss={handleDismiss}
                onClose={() => setExpandedId(null)}
                compact
              />
            </ActionCard>
          );
        })()}

        {/* Pending action cards */}
        {topActions.map((action) => (
          <ActionCard
            key={action.id}
            action={action}
            ownerLabel={getActionOwner(action)}
            expanded={expandedId === action.id}
            onToggle={() => toggleExpand(action.id)}
            onSnooze={(a, hours) => handleSnooze(a.id, hours)}
            onApprove={(a) => {
              const channel = (a.recommendedChannel || 'email').toLowerCase();
              const execType = channel === 'sms' || channel === 'push' ? 'sms' : channel === 'call' ? 'staff_task' : 'email';
              handleApprove(a.id, { executionType: execType, memberId: a.memberId, memberName: a.memberName });
            }}
          >
            <ActionPanel
              context={{
                memberId: action.memberId,
                memberName: action.memberName,
                description: action.description,
                source: action.source,
              }}
              recommended={buildRecommended(action)}
              onApprove={handleApprove}
              onDismiss={handleDismiss}
              onClose={() => setExpandedId(null)}
              compact
            />
          </ActionCard>
        ))}

        {/* CTA to review all */}
        {hasActions && (
          <button
            onClick={() => navigate('automations')}
            className="py-2.5 px-4 text-sm font-bold text-white bg-brand-500 border-none rounded-xl cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Review all {pendingAgentCount} actions in Inbox →
          </button>
        )}
      </div>
    </div>
  );
}
