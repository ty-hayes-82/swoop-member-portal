// features/agent-command/AgentCommand.jsx — shell only, ~80 lines
import { useState } from 'react';
import { getAgentSummary } from '@/services/agentService';
import { useApp } from '@/context/AppContext';
import { theme } from '@/config/theme';
import InboxTab    from './tabs/InboxTab';
import AgentsTab   from './tabs/AgentsTab';
import ActivityTab from './tabs/ActivityTab';

const TABS = [
  { key: 'inbox',    label: 'Inbox',    sub: 'Pending approvals' },
  { key: 'agents',   label: 'Agents',   sub: 'Fleet overview' },
  { key: 'activity', label: 'Activity', sub: 'Audit log' },
];

export function AgentCommand() {
  const [tab, setTab] = useState('inbox');
  const summary = getAgentSummary();
  const { pendingAgentCount } = useApp();

  const pendingDisplay = pendingAgentCount > 0 ? ` · ${pendingAgentCount} pending` : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Page header */}
      <div style={{
        background: 'rgba(34,211,238,0.04)',
        border: '1px solid rgba(34,211,238,0.15)',
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>⬡</span>
            <span style={{ fontSize: theme.fontSize.xl, fontWeight: 700, color: theme.colors.textPrimary,
              fontFamily: theme.fonts.serif }}>
              Agent Command
            </span>
          </div>
          <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>
            {summary.active} agents active · {summary.total} in fleet
            <span style={{ color: pendingAgentCount > 0 ? '#22D3EE' : theme.colors.textMuted }}>
              {pendingDisplay}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 4 }}>
            Last sweep
          </div>
          <div style={{ fontFamily: theme.fonts.mono, fontWeight: 700, color: '#22D3EE', fontSize: theme.fontSize.md }}>
            6:02 AM today
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${theme.colors.border}`, paddingBottom: 0 }}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '8px 18px', borderRadius: `${theme.radius.sm} ${theme.radius.sm} 0 0`,
              background: active ? theme.colors.bgCard : 'transparent',
              borderTop: active ? `2px solid #22D3EE` : '2px solid transparent',
              borderLeft: active ? `1px solid ${theme.colors.border}` : '1px solid transparent',
              borderRight: active ? `1px solid ${theme.colors.border}` : '1px solid transparent',
              borderBottom: active ? `1px solid ${theme.colors.bgCard}` : 'none',
              color: active ? theme.colors.textPrimary : theme.colors.textMuted,
              cursor: 'pointer', fontSize: theme.fontSize.sm, fontWeight: active ? 600 : 400,
              position: 'relative', top: 1,
            }}>
              {t.label}
              {t.key === 'inbox' && pendingAgentCount > 0 && (
                <span style={{
                  marginLeft: 6, fontSize: '10px', fontWeight: 700,
                  background: '#22D3EE', color: '#000',
                  borderRadius: '10px', padding: '1px 6px',
                }}>{pendingAgentCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'inbox'    && <InboxTab />}
      {tab === 'agents'   && <AgentsTab />}
      {tab === 'activity' && <ActivityTab />}
    </div>
  );
}
