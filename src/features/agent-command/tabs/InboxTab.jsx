import { useEffect, useMemo, useState } from 'react';
import { AgentActionCard, SoWhatCallout, StoryHeadline } from '@/components/ui';
import { getAgents } from '@/services/agentService';
import { trackAction } from '@/services/activityService';
import { useApp } from '@/context/AppContext';
import { theme } from '@/config/theme';
import { AgentActionDrawer } from '../AgentActionDrawer';


const CATEGORY_CONFIG = {
  retention: { label: 'Retention', color: '#ef4444', icon: '\u2764' },
  revenue: { label: 'Revenue', color: '#22c55e', icon: '\ud83d\udcb0' },
  staffing: { label: 'Staffing', color: '#f59e0b', icon: '\ud83d\udc65' },
  demand: { label: 'Demand', color: '#3b82f6', icon: '\ud83d\udcc8' },
  engagement: { label: 'Engagement', color: '#8b5cf6', icon: '\u2728' },
};

const getActionCategory = (action) => {
  const src = (action.source || '').toLowerCase();
  const desc = (action.description || '').toLowerCase();
  if (src.includes('pulse') || src.includes('recovery') || desc.includes('churn') || desc.includes('resign') || desc.includes('retention')) return 'retention';
  if (src.includes('revenue') || desc.includes('revenue') || desc.includes('f&b') || desc.includes('uplift')) return 'revenue';
  if (src.includes('labor') || desc.includes('staff') || desc.includes('labor')) return 'staffing';
  if (src.includes('demand') || desc.includes('demand') || desc.includes('waitlist') || desc.includes('tee')) return 'demand';
  return 'engagement';
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export default function InboxTab() {
  const { inbox, pendingCount, approveAction, dismissAction, showToast } = useApp();
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [drawerAction, setDrawerAction] = useState(null);
  const agents = getAgents();

  const pendingActions = useMemo(
    () => inbox.filter((item) => item.status === 'pending'),
    [inbox]
  );

  const visible = useMemo(() => {
    let base = inbox;
    // Apply status filter
    if (filterStatus === 'pending') base = base.filter(i => i.status === 'pending');
    else if (filterStatus === 'high') base = base.filter(i => i.status === 'pending' && i.priority === 'high');
    else if (filterStatus === 'approved') base = base.filter(i => i.status === 'approved');
    else if (filterStatus === 'dismissed') base = base.filter(i => i.status === 'dismissed');
    // Apply agent filter
    if (filterAgent !== 'all') base = base.filter(i => i.agentId === filterAgent);
    return [...base].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2));
  }, [inbox, filterAgent, filterStatus]);

  const [groupByCategory, setGroupByCategory] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const groupedActions = useMemo(() => {
    if (!groupByCategory) return null;
    const groups = {};
    visible.forEach(action => {
      const cat = getActionCategory(action);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(action);
    });
    return groups;
  }, [visible, groupByCategory]);

  useEffect(() => {
    if (drawerAction && !visible.some((item) => item.id === drawerAction.id)) {
      setDrawerAction(null);
    }
  }, [drawerAction, visible]);

  const approvedToday = inbox.filter((item) => item.status === 'approved').length;
  const dismissedToday = inbox.filter((item) => item.status === 'dismissed').length;

  const handleApprove = (item, contextLabel) => {
    approveAction(item.id, { approvalAction: contextLabel ?? 'Approve' });
    showToast(`Approved ${item.description}${contextLabel ? ` — ${contextLabel}` : ''}`, 'success');
    trackAction({ actionType: 'approve', memberId: item.memberId, memberName: item.memberName, description: item.description, referenceId: item.id, referenceType: 'agent_action', agentId: item.agentId, meta: { priority: item.priority, impact: item.impactMetric, contextLabel: contextLabel } });
  };
  const handleDismiss = (item, contextLabel) => {
    dismissAction(item.id, { reason: contextLabel ?? 'No reason provided' });
    showToast(`Dismissed ${item.description}${contextLabel ? ` — ${contextLabel}` : ''}`, 'warning');
    trackAction({ actionType: 'dismiss', memberId: item.memberId, memberName: item.memberName, description: item.description, referenceId: item.id, referenceType: 'agent_action', agentId: item.agentId, meta: { reason: contextLabel ?? 'No reason provided' } });
  };
  const bulkApprove = () => visible.forEach((item) => handleApprove(item));
  const bulkDismiss = () => visible.forEach((item) => handleDismiss(item));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <StoryHeadline
        variant="insight"
        headline={`${pendingCount} agent action${pendingCount !== 1 ? 's' : ''} waiting for approval.`}
        context="Each proposal includes source, impact estimate, and an approval path. Review individually or apply bulk decisions by filter."
      />

      <div className="grid-responsive-4">
        {[
          { label: 'Pending', value: pendingCount, accent: theme.colors.agentCyan, filterKey: 'pending' },
          { label: 'High Priority', value: pendingActions.filter(a => a.priority === 'high').length, accent: theme.colors.urgent, filterKey: 'high' },
          { label: 'Approved', value: approvedToday, accent: theme.colors.agentApproved, filterKey: 'approved' },
          { label: 'Dismissed', value: dismissedToday, accent: theme.colors.agentDismissed, filterKey: 'dismissed' },
        ].map((stat) => (
          <div
            key={stat.label}
            onClick={() => setFilterStatus(stat.filterKey)}
            role="button"
            tabIndex={0}
            style={{
              background: filterStatus === stat.filterKey ? `${stat.accent}0A` : theme.colors.bgCard,
              border: `1px solid ${filterStatus === stat.filterKey ? stat.accent + '60' : theme.colors.border}`,
              borderRadius: theme.radius.md,
              padding: theme.spacing.md,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: theme.fontSize.xs, color: filterStatus === stat.filterKey ? stat.accent : theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: filterStatus === stat.filterKey ? 700 : 400 }}>
              {stat.label}
            </div>
            <div style={{ marginTop: 2, fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xl, fontWeight: 700, color: stat.accent }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          background: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Filter by priority</span>
          <select
            value={filterAgent}
            onChange={(event) => setFilterAgent(event.target.value)}
            style={{
              background: theme.colors.bgDeep,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.sm,
              color: theme.colors.textPrimary,
              fontSize: theme.fontSize.xs,
              padding: '6px 8px',
            }}
          >
            <option value="all">All actions</option>
            <option value="high">High priority</option>
            <option value="medium">Medium priority</option>
            <option value="low">Low priority</option>
          </select>
          <button
            onClick={() => setGroupByCategory(!groupByCategory)}
            style={{
              borderRadius: theme.radius.sm,
              border: '1px solid ' + (groupByCategory ? theme.colors.accent + '60' : theme.colors.border),
              background: groupByCategory ? theme.colors.accent + '15' : 'transparent',
              color: groupByCategory ? theme.colors.accent : theme.colors.textMuted,
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {groupByCategory ? '\u2713 Grouped' : 'Group by category'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            disabled={visible.length === 0}
            onClick={bulkApprove}
            style={{
              borderRadius: theme.radius.sm,
              border: `1px solid ${theme.colors.agentApproved}4D`,
              background: `${theme.colors.agentApproved}1F`,
              color: theme.colors.agentApproved,
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: visible.length > 0 ? 'pointer' : 'default',
              opacity: visible.length > 0 ? 1 : 0.5,
            }}
          >
            Approve visible
          </button>
          <button
            disabled={visible.length === 0}
            onClick={bulkDismiss}
            style={{
              borderRadius: theme.radius.sm,
              border: `1px solid ${theme.colors.border}`,
              background: 'transparent',
              color: theme.colors.textMuted,
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: visible.length > 0 ? 'pointer' : 'default',
              opacity: visible.length > 0 ? 1 : 0.5,
            }}
          >
            Dismiss visible
          </button>
        </div>
      </div>

      {groupByCategory && groupedActions ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
          {Object.entries(groupedActions).sort(([,a],[,b]) => (PRIORITY_ORDER[a[0]?.priority] ?? 2) - (PRIORITY_ORDER[b[0]?.priority] ?? 2)).map(([cat, actions]) => {
            const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.engagement;
            return (
              <div key={cat}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: theme.spacing.sm, paddingBottom: theme.spacing.xs, borderBottom: '1px solid ' + cfg.color + '30' }}>
                  <span style={{ fontSize: '14px' }}>{cfg.icon}</span>
                  <span style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cfg.label}</span>
                  <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginLeft: 'auto' }}>{actions.length} action{actions.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                  {actions.map((action) => (
                    <AgentActionCard
                      key={action.id}
                      action={action}
                      onApprove={() => handleApprove(action)}
                      onDismiss={() => handleDismiss(action)}
                      onSelect={() => setDrawerAction(action)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          {!showAll && visible.length > 3 && (
            <div style={{ fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Today's Priority · ~35 min for top 3 actions
            </div>
          )}
          {(showAll ? visible : visible.slice(0, 3)).map((action) => (
            <AgentActionCard
              key={action.id}
              action={action}
              onApprove={() => handleApprove(action)}
              onDismiss={() => handleDismiss(action)}
              onSelect={() => setDrawerAction(action)}
            />
          ))}
          {!showAll && visible.length > 3 && (
            <button
              onClick={() => setShowAll(true)}
              style={{
                padding: '8px 16px',
                fontSize: theme.fontSize.xs,
                fontWeight: 600,
                color: theme.colors.accent,
                background: `${theme.colors.accent}08`,
                border: `1px solid ${theme.colors.accent}30`,
                borderRadius: theme.radius.md,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Show all {visible.length} actions
            </button>
          )}
        </div>
      )}

      {visible.length === 0 && (
        <SoWhatCallout variant="insight">
          No pending actions for this filter. Change filter scope or wait for the next agent sweep.
        </SoWhatCallout>
      )}

      {drawerAction && (
        <AgentActionDrawer
          action={drawerAction}
          onClose={() => setDrawerAction(null)}
          onApprove={(label) => handleApprove(drawerAction, label)}
          onDismiss={(label) => handleDismiss(drawerAction, label)}
        />
      )}
    </div>
  );
}
