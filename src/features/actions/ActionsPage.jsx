import { useState, useEffect, useMemo } from 'react';
import { theme } from '@/config/theme';
import { getAgentSummary } from '@/services/agentService';
import { getIntegrationSummary } from '@/services/integrationsService';
import { useApp } from '@/context/AppContext';
import { useNavigationContext } from '@/context/NavigationContext';
import InboxTab from '@/features/agent-command/tabs/InboxTab';
import AgentsTab from '@/features/agent-command/tabs/AgentsTab';
import PlaybooksPage from '@/features/playbooks/PlaybooksPage';
import MemberPlaybooks from '@/features/member-health/MemberPlaybooks';
import { OutreachPlaybooks } from '@/features/outreach-playbooks';
import PageTransition from '@/components/ui/PageTransition';
import FlowLink from '@/components/ui/FlowLink';
import { AgentActionCard } from '@/components/ui';

const TABS = [
  { key: 'inbox',     label: 'Inbox' },
  { key: 'outreach',  label: 'Outreach' },
  { key: 'playbooks', label: 'Playbooks' },
  { key: 'agents',    label: 'AI Agents' },
  { key: 'history',   label: 'History' },
];

function ActionsBadge() {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: '999px',
        border: `1px solid ${theme.colors.agentCyan}44`,
        background: `${theme.colors.agentCyan}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        color: theme.colors.agentCyan,
        fontSize: theme.fontSize.sm,
      }}
      aria-hidden="true"
    >
      ⚡
    </div>
  );
}

function MetricSeparator() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: theme.colors.border,
        opacity: 0.7,
        display: 'inline-flex',
        flexShrink: 0,
      }}
    />
  );
}

function HistoryTab({ searchTerm }) {
  const { inbox } = useApp();
  const completedActions = useMemo(() => {
    let items = inbox.filter(i => i.status === 'approved' || i.status === 'dismissed');
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      items = items.filter(i => (i.description || '').toLowerCase().includes(q) || (i.source || '').toLowerCase().includes(q));
    }
    return items.sort((a, b) => new Date(b.approvedAt || b.dismissedAt || b.timestamp) - new Date(a.approvedAt || a.dismissedAt || a.timestamp));
  }, [inbox, searchTerm]);

  if (completedActions.length === 0) {
    return (
      <div style={{ padding: theme.spacing.xl, textAlign: 'center', color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
        No completed actions yet. Approved and dismissed actions will appear here.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      <div style={{ fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {completedActions.length} completed action{completedActions.length !== 1 ? 's' : ''}
      </div>
      {completedActions.map(action => (
        <div key={action.id} style={{
          background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md,
          borderLeft: `3px solid ${action.status === 'approved' ? theme.colors.success500 : theme.colors.danger500}`,
          padding: theme.spacing.md, opacity: 0.9,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                background: action.status === 'approved' ? `${theme.colors.success500}1F` : `${theme.colors.danger500}1F`,
                color: action.status === 'approved' ? theme.colors.success500 : theme.colors.danger500,
                textTransform: 'uppercase',
              }}>
                {action.status}
              </span>
              <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{action.source}</span>
            </div>
            <span style={{ fontSize: '11px', fontFamily: theme.fonts.mono, color: theme.colors.textMuted }}>
              {new Date(action.approvedAt || action.dismissedAt || action.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
          <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
            {action.description}
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
            {action.impactMetric}
          </div>
          {action.approvalAction && (
            <div style={{ marginTop: 8, fontSize: '11px', color: theme.colors.success700, background: `${theme.colors.success500}0A`, padding: '4px 8px', borderRadius: 4, display: 'inline-block' }}>
              {action.approvalAction}
            </div>
          )}
          {action.dismissalReason && action.dismissalReason !== 'No reason provided' && (
            <div style={{ marginTop: 8, fontSize: '11px', color: theme.colors.danger700, background: `${theme.colors.danger500}0A`, padding: '4px 8px', borderRadius: 4, display: 'inline-block' }}>
              Reason: {action.dismissalReason}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ActionsPage() {
  const summary = getAgentSummary();
  const integrationStatus = getIntegrationSummary();
  const { pendingAgentCount } = useApp();
  const { routeIntent, clearRouteIntent } = useNavigationContext();
  const [searchTerm, setSearchTerm] = useState('');
  // Eagerly read routeIntent during initial render to prevent tab flash
  const [activeTab, setActiveTab] = useState(() => {
    if (routeIntent?.tab && TABS.some((t) => t.key === routeIntent.tab)) {
      return routeIntent.tab;
    }
    return 'inbox';
  });

  // Handle subsequent navigation intents while component is already mounted
  useEffect(() => {
    if (routeIntent?.tab && TABS.some((t) => t.key === routeIntent.tab)) {
      setActiveTab(routeIntent.tab);
      clearRouteIntent();
    }
  }, [routeIntent, clearRouteIntent]);

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
        {/* Header summary */}
        <div
          style={{
            background: `${theme.colors.accent}10`,
            border: `1px solid ${theme.colors.accent}44`,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: theme.spacing.md,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ActionsBadge />
              <span style={{ fontSize: theme.fontSize.xl, fontWeight: 700, color: theme.colors.textPrimary, fontFamily: theme.fonts.serif }}>
                Actions
              </span>
            </div>
            <div
              style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <span>{pendingAgentCount} actions ready for review</span>
              <MetricSeparator />
              <span>{summary.approved} approved / {summary.dismissed} dismissed today</span>
            </div>
          </div>
          <div
            onClick={() => setActiveTab('agents')}
            style={{ textAlign: 'right', minWidth: 220, cursor: 'pointer' }}
            role="button"
            title="View AI Agents"
          >
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 4 }}>Impact summary →</div>
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontWeight: 700,
                color: theme.colors.agentCyan,
                fontSize: theme.fontSize.md,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <span>{summary.active} agents active</span>
              <MetricSeparator />
              <span>{summary.total} agents deployed</span>
            </div>
          </div>
        </div>

        {/* Integration health + search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: 12,
              background: integrationStatus.syncStatus === 'Healthy' ? `${theme.colors.success500}12` : `${theme.colors.warning500}12`,
              color: integrationStatus.syncStatus === 'Healthy' ? theme.colors.success500 : theme.colors.warning500,
              border: `1px solid ${integrationStatus.syncStatus === 'Healthy' ? theme.colors.success500 + '30' : theme.colors.warning500 + '30'}`,
            }}>
              {integrationStatus.connected} systems connected {integrationStatus.syncStatus === 'Healthy' ? '— all healthy' : '— monitoring'}
            </span>
            <span style={{ fontSize: '11px', color: theme.colors.textMuted }}>
              Last sync: {integrationStatus.dataFreshness} ago
            </span>
          </div>
          <input
            type="text"
            placeholder="Search actions, playbooks, agents..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              padding: '7px 14px', fontSize: theme.fontSize.xs, fontFamily: theme.fonts.sans,
              background: theme.colors.bgDeep, border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.sm, color: theme.colors.textPrimary,
              outline: 'none', minWidth: 220,
            }}
          />
        </div>

        <FlowLink flowNum="01" persona="Sarah" />

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: theme.colors.bgDeep, borderRadius: theme.radius.md, padding: '3px', border: `1px solid ${theme.colors.border}`, alignSelf: 'flex-start' }}>
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              padding: '7px 20px', borderRadius: '8px', fontSize: theme.fontSize.sm, fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: activeTab === key ? theme.colors.bgCard : 'transparent',
              color: activeTab === key ? theme.colors.textPrimary : theme.colors.textMuted,
              boxShadow: activeTab === key ? theme.shadow.sm : 'none',
            }}>{label}{key === 'inbox' && pendingAgentCount > 0 ? ` (${pendingAgentCount})` : ''}</button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'inbox' && <InboxTab />}
        {activeTab === 'playbooks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xl }}>
            <div>
              <div style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }}>
                Response Plans
              </div>
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
                Automated protocols triggered by health score changes and service events.
              </div>
              <MemberPlaybooks />
            </div>
            <div style={{ borderTop: `1px solid ${theme.colors.border}`, paddingTop: theme.spacing.lg }}>
              <div style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }}>
                Playbook Templates
              </div>
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
                Step-by-step playbooks for service recovery, retention saves, and proactive outreach.
              </div>
              <PlaybooksPage />
            </div>
          </div>
        )}
        {activeTab === 'agents' && <AgentsTab />}
        {activeTab === 'outreach' && <OutreachPlaybooks />}
        {activeTab === 'history' && <HistoryTab searchTerm={searchTerm} />}
      </div>
    </PageTransition>
  );
}
