// features/agent-command/tabs/ActivityTab.jsx — 120 lines target
import { getActivityLog, getAgentDefinitions } from '@/services/agentService';
import { useApp } from '@/context/AppContext';
import { theme } from '@/config/theme';

const TYPE_META = {
  sweep:      { icon: '◎', color: '#22D3EE', label: 'Sweep' },
  briefing:   { icon: '📋', color: '#6BB8EF', label: 'Briefing' },
  action:     { icon: '⚡', color: '#F472B6', label: 'Action' },
  playbook:   { icon: '▶', color: '#4ADE80', label: 'Playbook' },
  adjustment: { icon: '⊞', color: '#F59E0B', label: 'Adjustment' },
};

function formatTimestamp(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function ActivityTab() {
  const log = getActivityLog();
  const agents = getAgentDefinitions();
  const { getActionStatus, getAllActions } = useApp();

  // Supplement with any user-approved/dismissed actions from session
  const sessionLog = typeof getAllActions === 'function'
    ? [] // placeholder — session actions will be added in Phase B
    : [];

  const agentMap = Object.fromEntries(agents.map(a => [a.id, a]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Header */}
      <div style={{
        background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md, padding: theme.spacing.md, boxShadow: theme.shadow.sm,
      }}>
        <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.textPrimary }}>
          Agent Activity Log
        </div>
        <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 }}>
          Every action your agents have taken or proposed, in reverse chronological order.
        </div>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative' }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute', left: 18, top: 0, bottom: 0,
          width: 1, background: theme.colors.border, zIndex: 0,
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {log.map((entry, i) => {
            const meta = TYPE_META[entry.type] ?? TYPE_META.action;
            const agent = agentMap[entry.agentId];
            return (
              <div key={entry.id} style={{
                display: 'flex', gap: 16, paddingBottom: i < log.length - 1 ? 20 : 0,
                position: 'relative', zIndex: 1,
              }}>
                {/* Icon node */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: theme.colors.bgCard, border: `2px solid ${meta.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px',
                }}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div style={{
                  flex: 1, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.md, padding: theme.spacing.md,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: meta.color,
                        background: `${meta.color}14`, borderRadius: theme.radius.sm,
                        padding: '1px 7px', marginRight: 8 }}>
                        {meta.label}
                      </span>
                      {agent && (
                        <span style={{ fontSize: '11px', color: theme.colors.textMuted }}>
                          {agent.name}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: theme.colors.textMuted, flexShrink: 0 }}>
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                  <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600,
                    color: theme.colors.textPrimary, marginBottom: 4 }}>
                    {entry.summary}
                  </div>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.5 }}>
                    {entry.details}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
