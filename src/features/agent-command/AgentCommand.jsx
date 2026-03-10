import { useState } from 'react';
import { theme } from '@/config/theme';
import { getAgentSummary } from '@/services/agentService';
import { useApp } from '@/context/AppContext';
import InboxTab from './tabs/InboxTab';
import AgentsTab from './tabs/AgentsTab';

const TABS = [
  { key: 'inbox',  label: 'Inbox' },
  { key: 'agents', label: 'Agents' },
];

function AgentBadge() {
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
      AI
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

export function AgentCommand() {
  const summary = getAgentSummary();
  const { pendingAgentCount } = useApp();
  const [activeTab, setActiveTab] = useState('inbox');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
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
            <AgentBadge />
            <span style={{ fontSize: theme.fontSize.xl, fontWeight: 700, color: theme.colors.textPrimary, fontFamily: theme.fonts.serif }}>
              AI Agents
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
            <span>{summary.active} playbooks monitoring</span>
            <MetricSeparator />
            <span>{summary.total} total</span>
          </div>
        </div>
      </div>

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

      {activeTab === 'inbox' && <InboxTab />}
      {activeTab === 'agents' && <AgentsTab />}
    </div>
  );
}