// components/ui/AgentStatusCard.jsx
// Contract: agent{}, onToggle(), onConfigure(), overrideStatus?
import { theme } from '@/config/theme';

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function AgentStatusCard({ agent, onToggle, onConfigure, onViewLog, overrideStatus }) {
  const status = overrideStatus ?? agent.status;
  const isActive = status === 'active';

  const statusStyles = {
    active:      { dot: '#4ADE80', label: 'Active',      bg: 'rgba(74,222,128,0.08)' },
    paused:      { dot: '#F59E0B', label: 'Paused',      bg: 'rgba(245,158,11,0.08)' },
    configuring: { dot: '#A78BFA', label: 'Configuring', bg: 'rgba(167,139,250,0.08)' },
  };
  const s = statusStyles[status] ?? statusStyles.paused;

  return (
    <div style={{
      background: theme.colors.bgCard,
      border: `1px solid ${theme.colors.border}`,
      borderLeft: `3px solid ${agent.accentColor}`,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      display: 'flex', flexDirection: 'column', gap: 10,
      boxShadow: theme.shadow.sm,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.textPrimary }}>
            {agent.name}
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 }}>
            {agent.lens} · {agent.schedule}
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: s.bg, borderRadius: theme.radius.sm, padding: '3px 10px',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: s.dot }}>{s.label}</span>
        </div>
      </div>

      {/* Description */}
      <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.5 }}>
        {agent.description}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: theme.spacing.lg }}>
        {[
          { label: 'Proposed',   value: agent.actionsProposed },
          { label: 'Approved',   value: agent.actionsTaken },
          ...(agent.membersMonitored ? [{ label: 'Monitoring', value: `${agent.membersMonitored} members` }] : []),
          { label: 'Last Run',   value: formatTime(agent.lastRun) },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: '10px', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </div>
            <div style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.sm, fontWeight: 600,
              color: theme.colors.textPrimary, marginTop: 1 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, borderTop: `1px solid ${theme.colors.border}`, paddingTop: 10 }}>
        <button onClick={onToggle} style={{
          flex: 1, padding: '6px 0', borderRadius: theme.radius.sm, cursor: 'pointer',
          background: isActive ? 'rgba(245,158,11,0.1)' : 'rgba(74,222,128,0.1)',
          border: `1px solid ${isActive ? 'rgba(245,158,11,0.3)' : 'rgba(74,222,128,0.3)'}`,
          color: isActive ? '#F59E0B' : '#4ADE80',
          fontSize: '11px', fontWeight: 600,
        }}>
          {isActive ? 'Pause Agent' : 'Resume Agent'}
        </button>
        {onViewLog && (
          <button onClick={onViewLog} style={{
            padding: '6px 12px', borderRadius: theme.radius.sm, cursor: 'pointer',
            background: 'transparent', border: `1px solid rgba(34,211,238,0.25)`,
            color: '#22D3EE', fontSize: '11px', fontWeight: 500,
          }}>
            Log
          </button>
        )}
        <button onClick={onConfigure} style={{
          padding: '6px 14px', borderRadius: theme.radius.sm, cursor: 'pointer',
          background: 'transparent', border: `1px solid ${theme.colors.border}`,
          color: theme.colors.textMuted, fontSize: '11px', fontWeight: 500,
        }}>
          Configure
        </button>
      </div>
    </div>
  );
}
