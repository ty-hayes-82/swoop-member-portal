/**
 * InboxTab — Full-page action inbox for the Automations hub
 * Shows pending actions with approve/dismiss, filters, and recently handled log.
 */
import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { getAllActions } from '@/services/agentService';
import SourceBadge, { SourceBadgeRow } from '@/components/ui/SourceBadge';

// Extract a dollar value from impactMetric strings like "$32K dues protected"
function extractDollar(metricStr) {
  if (!metricStr) return 0;
  const match = String(metricStr).match(/\$(\d+(?:[\.,]\d+)?)\s*([KMk]?)/);
  if (!match) return 0;
  let value = parseFloat(match[1].replace(',', ''));
  const suffix = (match[2] || '').toUpperCase();
  if (suffix === 'K') value *= 1000;
  else if (suffix === 'M') value *= 1000000;
  return value;
}

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
      {/* Hero: member name + dollar — the marketing-site framing */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex-1 min-w-0">
          {action.memberName && (
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-0.5 uppercase tracking-wide">
              {action.memberName}
              {action.archetype ? ` · ${action.archetype}` : ''}
            </div>
          )}
          <div className="text-sm font-semibold text-gray-800 dark:text-white/90 leading-snug">
            {action.description}
          </div>
          {action.rationale && (
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
              {action.rationale}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {action.impactMetric && (
            <span className="text-xs font-mono font-bold text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-500/10 border border-success-500/20 px-2 py-0.5 rounded-md whitespace-nowrap">
              {action.impactMetric}
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${badge.bg} ${badge.text}`}>
            {priority}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1.5 flex-wrap">
        {action.source && (
          <SourceBadge system={
            action.source === 'anthropic' ? 'Swoop AI' :
            action.source === 'fb-intelligence' ? 'F&B Intelligence' :
            action.source
          } size="xs" />
        )}
        {action.actionType && <span className="text-[10px] uppercase tracking-wide text-gray-400">{action.actionType.replace(/_/g, ' ').toLowerCase()}</span>}
        {action.contributing_agents && (
          <span className="text-[10px] text-purple-500 font-medium">
            Flagged by: {Array.isArray(action.contributing_agents) ? action.contributing_agents.join(' + ') : action.contributing_agents}
          </span>
        )}
      </div>

      {/* Signal sources — Pillar 1: SEE IT */}
      {Array.isArray(action.signals) && action.signals.length > 0 && (
        <div className="mb-2">
          <SourceBadgeRow systems={action.signals.map(s => typeof s === 'string' ? s : (s.source || s.system)).filter(Boolean)} />
        </div>
      )}

      {/* Drafted message preview — if available */}
      {(action.draftedMessage || action.suggestedScript || action.messageTemplate) && (
        <div className="mb-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Drafted message</div>
          <p className="text-xs text-gray-700 dark:text-gray-300 m-0 leading-relaxed line-clamp-3">
            {action.draftedMessage || action.suggestedScript || action.messageTemplate}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => {
            const channel = (action.recommendedChannel || 'email').toLowerCase();
            const execType = channel === 'sms' || channel === 'push' ? 'sms' : channel === 'call' ? 'staff_task' : 'email';
            onApprove(action.id, { executionType: execType, memberId: action.memberId, memberName: action.memberName });
          }}
          className="px-4 py-1.5 rounded-lg bg-success-500 text-white border-none text-xs font-semibold cursor-pointer hover:bg-success-600 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500"
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
  const { inbox: contextInbox, approveAction, dismissAction } = useApp();
  // Fallback: if context inbox is empty due to timing, load directly from service
  const inbox = contextInbox.length > 0 ? contextInbox : getAllActions();
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

  // Pillar 3 PROVE IT — total dollar impact rollup
  const allPending = inbox.filter(i => i.status === 'pending');
  const totalDollarImpact = allPending.reduce((sum, a) => sum + extractDollar(a.impactMetric), 0);
  const topImpactAction = allPending
    .map(a => ({ ...a, _dollar: extractDollar(a.impactMetric) }))
    .sort((a, b) => b._dollar - a._dollar)[0];

  // Trust ramp: track how many actions have been handled (approved/dismissed)
  const totalHandled = inbox.filter(i => i.status === 'approved' || i.status === 'dismissed').length;
  const totalApproved = inbox.filter(i => i.status === 'approved').length;
  const TRUST_LEVELS = [
    { threshold: 0,  label: 'Manual only',       description: 'Every action requires your approval.' },
    { threshold: 5,  label: 'Learning your style', description: 'AI is watching your approvals to understand priorities.' },
    { threshold: 15, label: 'Trusted assistant',  description: 'Low-risk actions can be auto-suggested. You still approve all.' },
    { threshold: 30, label: 'Co-pilot mode',      description: 'You can enable auto-send for low-risk outreach.' },
  ];
  const trustLevel = TRUST_LEVELS.reduce((best, l) => totalHandled >= l.threshold ? l : best, TRUST_LEVELS[0]);
  const nextLevel = TRUST_LEVELS.find(l => l.threshold > totalHandled);

  return (
    <div className="flex flex-col gap-4">
      {/* Pillar 3 PROVE IT — Impact rollup */}
      {totalPending > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4 dark:bg-white/[0.03] dark:border-gray-800">
            <div className="text-[10px] font-bold uppercase tracking-wide text-brand-500">Pending</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white/90 font-mono mt-1">{totalPending}</div>
            <div className="text-xs text-gray-500 mt-0.5">awaiting your approval</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 dark:bg-white/[0.03] dark:border-gray-800">
            <div className="text-[10px] font-bold uppercase tracking-wide text-success-500">Total Dollar Impact</div>
            <div className="text-2xl font-bold text-success-600 dark:text-success-400 font-mono mt-1">
              ${totalDollarImpact.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">if all approved</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 dark:bg-white/[0.03] dark:border-gray-800">
            <div className="text-[10px] font-bold uppercase tracking-wide text-warning-500">Highest Impact</div>
            <div className="text-base font-bold text-gray-800 dark:text-white/90 font-mono mt-1 truncate" title={topImpactAction?.description}>
              {topImpactAction?.impactMetric || (topImpactAction?._dollar ? `$${topImpactAction._dollar.toLocaleString()}` : '—')}
            </div>
            <div className="text-xs text-gray-500 mt-0.5 truncate">{topImpactAction?.description || 'No actions'}</div>
          </div>
        </div>
      )}

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

      {/* Trust Ramp — shows automation confidence level based on review history */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:bg-gray-800/50 dark:border-gray-800">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Automation Trust Level
            </div>
            <div className="text-sm font-semibold text-gray-800 dark:text-white/90 mt-0.5">
              {trustLevel.label}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              {trustLevel.description}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-bold text-brand-500 font-mono">{totalHandled}</div>
            <div className="text-[10px] text-gray-400">reviewed</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (totalHandled / 30) * 100)}%` }}
            />
          </div>
          {nextLevel && (
            <div className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
              {nextLevel.threshold - totalHandled} more to unlock "{nextLevel.label}"
            </div>
          )}
          {!nextLevel && (
            <div className="text-[10px] text-success-500 font-semibold whitespace-nowrap shrink-0">
              Max trust unlocked
            </div>
          )}
        </div>
        {totalApproved > 0 && (
          <div className="text-[10px] text-gray-400 mt-1.5">
            {totalApproved} approved · {totalHandled - totalApproved} dismissed — approval rate {Math.round((totalApproved / totalHandled) * 100)}%
          </div>
        )}
      </div>

      {/* Recently handled */}
      {handled.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowHandled(!showHandled)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 cursor-pointer bg-transparent border-none p-0 hover:text-gray-700 dark:hover:text-gray-300 focus-visible:ring-2 focus-visible:ring-brand-500"
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
