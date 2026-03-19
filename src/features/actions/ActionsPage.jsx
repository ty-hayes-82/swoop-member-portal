import { useState, useEffect } from 'react';
import { theme } from '@/config/theme';
import { getAgentSummary } from '@/services/agentService';
import { useApp } from '@/context/AppContext';
import { useNavigationContext } from '@/context/NavigationContext';
import InboxTab from '@/features/agent-command/tabs/InboxTab';
import AgentsTab from '@/features/agent-command/tabs/AgentsTab';
import PlaybooksPage from '@/features/playbooks/PlaybooksPage';
import MemberPlaybooks from '@/features/member-health/MemberPlaybooks';
import { OutreachPlaybooks } from '@/features/outreach-playbooks';
import PageTransition from '@/components/ui/PageTransition';
import FlowLink from '@/components/ui/FlowLink';

const TABS = [
  { key: 'inbox',     label: 'Inbox' },
  { key: 'outreach',  label: 'Outreach' },
  { key: 'playbooks', label: 'Playbooks' },
  { key: 'agents',    label: 'AI Agents' },
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

export default function ActionsPage() {
  const summary = getAgentSummary();
  const { pendingAgentCount } = useApp();
  const { routeIntent, clearRouteIntent } = useNavigationContext();
  const [activeTab, setActiveTab] = useState('inbox');

  // Allow navigation intent to set initial tab (e.g., from Cockpit "Open Actions" link)
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
          <div style={{ textAlign: 'right', minWidth: 220 }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 4 }}>Impact summary</div>
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
      </div>
    </PageTransition>
  );
}
