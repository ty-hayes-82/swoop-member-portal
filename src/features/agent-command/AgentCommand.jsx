import { useState } from 'react';
import { getAgentSummary } from '@/services/agentService';
import { useApp } from '@/context/AppContext';
import { theme } from '@/config/theme';
import InboxTab from './tabs/InboxTab';
import AgentsTab from './tabs/AgentsTab';
import ActivityTab from './tabs/ActivityTab';

const TABS = [
  { key: 'inbox', label: 'Inbox', sub: 'Pending approvals' },
  { key: 'agents', label: 'Agents', sub: 'Fleet overview' },
  { key: 'activity', label: 'Activity', sub: 'Audit log' },
];

export function AgentCommand() {
  const [tab, setTab] = useState('inbox');
  const summary = getAgentSummary();
  const { pendingAgentCount } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <div
        style={{
          background: 'rgba(34,211,238,0.04)',
          border: '1px solid rgba(34,211,238,0.15)',
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>⬡</span>
            <span style={{ fontSize: theme.fontSize.xl, fontWeight: 700, color: theme.colors.textPrimary, fontFamily: theme.fonts.serif }}>
              Agent Command
            </span>
          </div>
          <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>
            {summary.active} active of {summary.total} agents · {pendingAgentCount} pending approvals
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 4 }}>Queue health</div>
          <div style={{ fontFamily: theme.fonts.mono, fontWeight: 700, color: '#22D3EE', fontSize: theme.fontSize.md }}>
            {summary.approved} approved · {summary.dismissed} dismissed
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${theme.colors.border}` }}>
        {TABS.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              style={{
                padding: '8px 16px',
                borderRadius: `${theme.radius.sm} ${theme.radius.sm} 0 0`,
                border: 'none',
                borderBottom: active ? '2px solid #22D3EE' : '2px solid transparent',
                background: 'transparent',
                color: active ? theme.colors.textPrimary : theme.colors.textMuted,
                cursor: 'pointer',
                fontSize: theme.fontSize.sm,
                fontWeight: active ? 700 : 500,
              }}
            >
              {item.label}
              {item.key === 'inbox' && pendingAgentCount > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: '10px',
                    fontWeight: 700,
                    background: '#22D3EE',
                    color: '#000',
                    borderRadius: 10,
                    padding: '1px 6px',
                  }}
                >
                  {pendingAgentCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'inbox' && <InboxTab />}
      {tab === 'agents' && <AgentsTab />}
      {tab === 'activity' && <ActivityTab />}
    </div>
  );
}
