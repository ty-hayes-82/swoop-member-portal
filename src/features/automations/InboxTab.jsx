/**
 * InboxTab — Full-page action inbox for the Automations hub
 * Shows pending actions with approve/dismiss, filters, and recently handled log.
 */
import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { getAllActions } from '@/services/agentService';
import { getDataMode, isGateOpen } from '@/services/demoGate';
import { SourceBadgeRow } from '@/components/ui/SourceBadge';
import ActionCard from '@/components/ui/ActionCard';
import { getComplaintCorrelation, getUnderstaffedDays } from '@/services/staffingService';

// Map source/agent identifiers to a role-based owner label for the card header.
const SOURCE_TO_OWNER = {
  'Member Pulse': 'Membership',
  'Demand Optimizer': 'GM',
  'Service Recovery': 'F&B',
  'Revenue Analyst': 'GM',
};
function getOwnerLabel(action) {
  if (action?.suggestedOwner) return action.suggestedOwner.split('·')[0].trim();
  if (action?.source && SOURCE_TO_OWNER[action.source]) return SOURCE_TO_OWNER[action.source];
  if (action?.actionType === 'STAFFING_ADJUSTMENT') return 'F&B';
  if (action?.actionType === 'SERVICE_RECOVERY') return 'F&B';
  return 'GM';
}

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

function InboxActionCard({ action, onApprove, onDismiss }) {
  const handleApprove = () => {
    const channel = (action.recommendedChannel || 'email').toLowerCase();
    const execType = channel === 'sms' || channel === 'push' ? 'sms' : channel === 'call' ? 'staff_task' : 'email';
    onApprove(action.id, { executionType: execType, memberId: action.memberId, memberName: action.memberName });
  };
  const handleDismiss = () => onDismiss(action.id);

  const titleNode = action.memberName ? (
    <>
      <span className="text-[10px] font-bold text-swoop-text-muted uppercase tracking-wide block mb-0.5">
        {action.memberName}{action.archetype ? ` · ${action.archetype}` : ''}
      </span>
      {action.description}
    </>
  ) : action.description;

  const hasDraft = !!(action.draftedMessage || action.suggestedScript || action.messageTemplate);
  const hasSignals = Array.isArray(action.signals) && action.signals.length > 0;
  const hasRationale = !!action.rationale;
  const hasContrib = !!action.contributing_agents;
  const hasActionType = !!action.actionType;
  const hasExpandable = hasDraft || hasSignals || hasRationale || hasContrib || hasActionType;

  return (
    <ActionCard
      action={action}
      ownerLabel={getOwnerLabel(action)}
      titleNode={titleNode}
      onApprove={handleApprove}
      onDismiss={handleDismiss}
    >
      {hasExpandable && (
        <div className="mt-2 px-4 py-3 rounded-xl bg-swoop-row border border-swoop-border">
          {hasRationale && (
            <div className="text-[11px] text-swoop-text-muted leading-snug mb-2">
              {action.rationale}
            </div>
          )}
          {(hasActionType || hasContrib) && (
            <div className="flex items-center gap-2 text-xs text-swoop-text-muted mb-2 flex-wrap">
              {hasActionType && (
                <span className="text-[10px] uppercase tracking-wide text-swoop-text-label">
                  {action.actionType.replace(/_/g, ' ').toLowerCase()}
                </span>
              )}
              {hasContrib && (
                <span className="text-[10px] text-purple-500 font-medium">
                  Flagged by: {Array.isArray(action.contributing_agents) ? action.contributing_agents.join(' + ') : action.contributing_agents}
                </span>
              )}
            </div>
          )}
          {hasSignals && (
            <div className="mb-2">
              <div className="text-[9px] font-bold uppercase tracking-widest text-swoop-text-label mb-1">Signals</div>
              <SourceBadgeRow systems={action.signals.map(s => typeof s === 'string' ? s : (s.source || s.system)).filter(Boolean)} />
            </div>
          )}
          {hasDraft && (
            <div className="p-2.5 rounded-lg bg-swoop-panel border border-swoop-border-inset">
              <div className="text-[9px] font-bold uppercase tracking-widest text-swoop-text-label mb-1">Drafted message</div>
              <p className="text-xs text-swoop-text-2 m-0 leading-relaxed">
                {action.draftedMessage || action.suggestedScript || action.messageTemplate}
              </p>
            </div>
          )}
        </div>
      )}
    </ActionCard>
  );
}

function HandledCard({ action }) {
  const isApproved = action.status === 'approved';
  const time = action.approvedAt || action.dismissedAt;
  const timeStr = time ? new Date(time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-swoop-border-inset last:border-b-0">
      <div className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
        isApproved ? 'bg-success-50 text-success-500' : 'bg-swoop-row text-swoop-text-label'
      }`}>
        {isApproved ? '✓' : '×'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-swoop-text-2 line-clamp-1">{action.description}</div>
        <div className="text-[10px] text-swoop-text-label mt-0.5">
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
  const highCount = inbox.filter(i => i.status === 'pending' && (i.priority === 'high' || i.priority === 'urgent')).length;

  const handleBulkApproveHigh = () => {
    const targets = inbox.filter(i => i.status === 'pending' && (i.priority === 'high' || i.priority === 'urgent'));
    if (!targets.length) return;
    if (!window.confirm(`Approve ${targets.length} high-priority action${targets.length === 1 ? '' : 's'}?`)) return;
    targets.forEach(a => approveAction(a.id, { executionType: 'email', memberId: a.memberId, memberName: a.memberName }));
  };
  const handleBulkApproveAll = () => {
    const targets = inbox.filter(i => i.status === 'pending');
    if (!targets.length) return;
    if (!window.confirm(`Approve all ${targets.length} pending actions?`)) return;
    targets.forEach(a => approveAction(a.id, { executionType: 'email', memberId: a.memberId, memberName: a.memberName }));
  };

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
    { threshold: 5,  label: 'Training your style', description: 'Swoop is learning your approval patterns to calibrate priorities.' },
    { threshold: 15, label: 'Trusted assistant',  description: 'Low-risk actions can be auto-suggested. You still approve all.' },
    { threshold: 30, label: 'Co-pilot mode',      description: 'You can enable auto-send for low-risk outreach.' },
  ];
  const trustLevel = TRUST_LEVELS.reduce((best, l) => totalHandled >= l.threshold ? l : best, TRUST_LEVELS[0]);
  const nextLevel = TRUST_LEVELS.find(l => l.threshold > totalHandled);

  // Service recovery alerts — unresolved complaints and understaffed days surfaced inline
  const allComplaints = getComplaintCorrelation();
  const unresolvedComplaints = allComplaints.filter(f => f.status !== 'resolved');
  const understaffedDays = getUnderstaffedDays();

  return (
    <div className="flex flex-col gap-4">
      {/* Service Recovery Alerts — surfaces unresolved complaints and staffing gaps */}
      {(unresolvedComplaints.length > 0 || understaffedDays.length > 0) && (
        <div className="rounded-xl border border-error-500/25 bg-error-500/[0.04] p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-error-500 mb-3">
            Service Recovery Needed
          </div>
          <div className="flex flex-col gap-2">
            {unresolvedComplaints.slice(0, 3).map((c, i) => (
              <div key={c.id || i} className="flex items-start gap-3 py-2 px-3 rounded-lg bg-swoop-panel border border-swoop-border">
                <span className="text-sm shrink-0">🔴</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-swoop-text">
                    {c.memberName || c.member || 'Member'}: {c.category ? c.category.replace(/_/g, ' ') : 'service issue'}
                  </div>
                  <div className="text-[11px] text-swoop-text-muted mt-0.5">
                    {c.description || c.complaint || 'Complaint awaiting resolution'}{c.date ? ` · Filed ${new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-error-500/10 text-error-500">Open</span>
              </div>
            ))}
            {unresolvedComplaints.length > 3 && (
              <div className="text-[11px] text-swoop-text-muted pl-3">
                +{unresolvedComplaints.length - 3} more unresolved complaint{unresolvedComplaints.length - 3 !== 1 ? 's' : ''}: see Service tab
              </div>
            )}
            {understaffedDays.length > 0 && (
              <div className="flex items-start gap-3 py-2 px-3 rounded-lg bg-swoop-panel border border-swoop-border">
                <span className="text-sm shrink-0">⚠️</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-swoop-text">
                    {understaffedDays.length} understaffed day{understaffedDays.length !== 1 ? 's' : ''} this period
                  </div>
                  <div className="text-[11px] text-swoop-text-muted mt-0.5">
                    Review staffing coverage on the Service tab to address gaps before next high-demand day.
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning-500/10 text-warning-500">Review</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pillar 3 PROVE IT — Impact rollup (gradient glass stat cards) */}
      {totalPending > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="swoop-stat-card">
            <div className="text-[10px] font-bold uppercase tracking-wider text-brand-500">Pending</div>
            <div className="text-[32px] font-extrabold text-swoop-text font-mono mt-1 leading-none">{totalPending}</div>
            <div className="text-xs text-swoop-text-muted mt-1">awaiting your approval</div>
          </div>
          <div className="swoop-stat-card">
            <div className="text-[10px] font-bold uppercase tracking-wider text-success-500">Total Dollar Impact</div>
            <div className="text-[32px] font-extrabold text-success-500 font-mono mt-1 leading-none">
              ${totalDollarImpact.toLocaleString()}
            </div>
            <div className="text-xs text-swoop-text-muted mt-1">if all approved</div>
          </div>
          <div className="swoop-stat-card">
            <div className="text-[10px] font-bold uppercase tracking-wider text-warning-500">Highest Impact</div>
            <div className="text-base font-extrabold text-swoop-text font-mono mt-1 truncate" title={topImpactAction?.description}>
              {topImpactAction?.impactMetric || (topImpactAction?._dollar ? `$${topImpactAction._dollar.toLocaleString()}` : '—')}
            </div>
            <div className="text-xs text-swoop-text-muted mt-1 truncate">{topImpactAction?.description || 'No actions'}</div>
          </div>
        </div>
      )}

      {/* Bulk Actions Toolbar — process many high-priority items at once */}
      {totalPending > 0 && (
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-swoop-row border border-swoop-border flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-widest text-swoop-text-label">
            Bulk Actions
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleBulkApproveHigh}
              disabled={highCount === 0}
              className="swoop-bulk-btn swoop-bulk-btn--high"
              title="Approve every pending high-priority action"
            >
              Approve All High ({highCount})
            </button>
            <button
              type="button"
              onClick={handleBulkApproveAll}
              className="swoop-bulk-btn swoop-bulk-btn--all"
              title="Approve every pending action"
            >
              Approve All ({totalPending})
            </button>
          </div>
        </div>
      )}

      {/* Filter bar with keyboard shortcut hints + bottom separator */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-swoop-border">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-swoop-text-2">
            {totalPending} pending action{totalPending !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-swoop-text-label">
            <span className="inline-flex items-center gap-1.5">
              <kbd className="swoop-kbd">A</kbd> Approve
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="swoop-kbd">D</kbd> Dismiss
            </span>
          </div>
        </div>
        <div className="flex gap-1 flex-wrap">
          {['all', 'urgent', 'high', 'medium', 'low'].map(p => {
            const isActive = priorityFilter === p;
            return (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer border transition-all ${
                  isActive
                    ? 'bg-brand-500/[0.14] text-brand-500 border-brand-500/40'
                    : 'bg-transparent text-swoop-text-muted border-swoop-border hover:text-swoop-text hover:border-white/20'
                }`}
              >
                {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pending actions */}
      {pending.length === 0 ? (
        (() => {
          // Live mode with data connected — agents are scanning, not "all caught up"
          const isLiveWithData = getDataMode() === 'live' && isGateOpen('members') && priorityFilter === 'all';
          if (isLiveWithData) {
            return (
              <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-brand-600 animate-spin" style={{ animationDuration: '3s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-brand-800">Scanning for revenue and retention opportunities</div>
                    <div className="text-xs text-brand-600/80 mt-0.5">
                      Your agents are analyzing member activity, tee sheet patterns, and service records. Recommendations will appear here as they are generated.
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-swoop-text-muted mb-2">What your agents are looking for</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { icon: '⚠️', label: 'At-risk members', detail: 'Members with declining visit frequency or low engagement scores' },
                    { icon: '🏌️', label: 'Tee sheet patterns', detail: 'Members who haven\'t booked in 30+ days compared to their usual cadence' },
                    { icon: '🎂', label: 'Milestone opportunities', detail: 'Birthdays, anniversaries, and first-year member check-ins' },
                    { icon: '📊', label: 'Revenue recovery', detail: 'Understaffed periods and pace-of-play revenue leakage' },
                  ].map(item => (
                    <div key={item.label} className="flex items-start gap-2 bg-white/60 rounded-lg p-2.5 border border-brand-100">
                      <span className="text-base shrink-0">{item.icon}</span>
                      <div>
                        <div className="text-xs font-semibold text-swoop-text-2">{item.label}</div>
                        <div className="text-[10px] text-swoop-text-muted mt-0.5 leading-snug">{item.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div className="py-12 text-center">
              <div className="text-3xl mb-3">✓</div>
              <div className="font-semibold text-swoop-text-2 mb-1">All caught up</div>
              <div className="text-sm text-swoop-text-muted">
                {priorityFilter !== 'all'
                  ? `No ${priorityFilter} priority actions. Try "All" filter.`
                  : 'No pending actions right now. Your AI agents will surface recommendations here.'}
              </div>
            </div>
          );
        })()
      ) : (
        <div className="grid gap-3">
          {pending.map(action => (
            <InboxActionCard
              key={action.id}
              action={action}
              onApprove={approveAction}
              onDismiss={dismissAction}
            />
          ))}
        </div>
      )}

      {/* Trust Ramp — shows automation confidence level based on review history */}
      <div className="rounded-xl border border-swoop-border bg-swoop-row px-4 py-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-swoop-text-muted">
              Automation Trust Level
            </div>
            <div className="text-sm font-semibold text-swoop-text mt-0.5">
              {trustLevel.label}
            </div>
            <div className="text-[11px] text-swoop-text-muted mt-0.5">
              {trustLevel.description}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-bold text-brand-500 font-mono">{totalHandled}</div>
            <div className="text-[10px] text-swoop-text-label">reviewed</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-swoop-border rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (totalHandled / 30) * 100)}%` }}
            />
          </div>
          {nextLevel && (
            <div className="text-[10px] text-swoop-text-label whitespace-nowrap shrink-0">
              {nextLevel.threshold - totalHandled} more approvals to reach "{nextLevel.label}"
            </div>
          )}
          {!nextLevel && (
            <div className="text-[10px] text-success-500 font-semibold whitespace-nowrap shrink-0">
              Max trust unlocked
            </div>
          )}
        </div>
        {totalApproved > 0 && (
          <div className="text-[10px] text-swoop-text-label mt-1.5">
            {totalApproved} approved · {totalHandled - totalApproved} dismissed · approval rate {Math.round((totalApproved / totalHandled) * 100)}%
          </div>
        )}
      </div>

      {/* Recently handled */}
      {handled.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowHandled(!showHandled)}
            className="flex items-center gap-1.5 text-xs font-semibold text-swoop-text-muted cursor-pointer bg-transparent border-none p-0 hover:text-swoop-text-2 focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <svg className={`w-3 h-3 transition-transform ${showHandled ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
            Recently handled ({handled.length})
          </button>
          {showHandled && (
            <div className="mt-2 rounded-xl border border-swoop-border bg-swoop-row px-4 py-2">
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
