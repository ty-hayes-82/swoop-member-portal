import { useMemo, useState } from 'react';
import { getAgents } from '@/services/agentService';
import { useApp } from '@/context/AppContext';
import { theme } from '@/config/theme';
import { AgentActionDrawer } from '../AgentActionDrawer';

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const STATUS_STYLE = {
  pending: { color: theme.colors.agentCyan, bg: `${theme.colors.agentCyan}1F` },
  approved: { color: theme.colors.agentApproved, bg: `${theme.colors.agentApproved}1F` },
  dismissed: { color: theme.colors.agentDismissed, bg: `${theme.colors.agentDismissed}1F` },
};

export default function ActivityTab() {
  const { inbox, approveAction, dismissAction, showToast } = useApp();
  const agents = getAgents();
  const [agentFilter, setAgentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [drawerAction, setDrawerAction] = useState(null);

  const filtered = useMemo(() => {
    return inbox
      .filter((entry) => (agentFilter === 'all' ? true : entry.agentId === agentFilter))
      .filter((entry) => (statusFilter === 'all' ? true : entry.status === statusFilter))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [inbox, agentFilter, statusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <div
        style={{
          background: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, fontWeight: 700 }}>Agent Audit Log</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 }}>
            Chronological record of proposed and adjudicated actions.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={agentFilter}
            onChange={(event) => setAgentFilter(event.target.value)}
            style={{
              background: theme.colors.bgDeep,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.sm,
              color: theme.colors.textPrimary,
              fontSize: theme.fontSize.xs,
              padding: '6px 8px',
            }}
          >
            <option value="all">All agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={{
              background: theme.colors.bgDeep,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.sm,
              color: theme.colors.textPrimary,
              fontSize: theme.fontSize.xs,
              padding: '6px 8px',
            }}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
        {filtered.map((entry) => {
          const statusMeta = STATUS_STYLE[entry.status] ?? STATUS_STYLE.pending;
          return (
            <div
              key={entry.id}
              onClick={() => setDrawerAction(entry)}
              style={{
                background: theme.colors.bgCard,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: statusMeta.color,
                      background: statusMeta.bg,
                      borderRadius: theme.radius.sm,
                      padding: '2px 8px',
                    }}
                  >
                    {entry.status}
                  </span>
                  <span style={{ fontSize: '11px', color: theme.colors.textMuted }}>{entry.source}</span>
                </div>
                <span style={{ fontSize: '11px', color: theme.colors.textMuted }}>{formatTimestamp(entry.timestamp)}</span>
              </div>
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, fontWeight: 600, marginBottom: 4 }}>
                {entry.description}
              </div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.agentApproved }}>Impact: {entry.impactMetric}</div>
            </div>
          );
        })}
      </div>
      {drawerAction && (
        <AgentActionDrawer
          action={drawerAction}
          onClose={() => setDrawerAction(null)}
          onApprove={(label) => {
            approveAction(drawerAction.id, { approvalAction: label ?? 'Approved from activity log' });
            showToast(`Approved ${drawerAction.description}`, 'success');
          }}
          onDismiss={(label) => {
            dismissAction(drawerAction.id, { reason: label ?? 'Dismissed from activity log' });
            showToast(`Dismissed ${drawerAction.description}`, 'warning');
          }}
        />
      )}
    </div>
  );
}
