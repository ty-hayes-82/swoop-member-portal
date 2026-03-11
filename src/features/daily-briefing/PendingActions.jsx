import { theme } from '@/config/theme';
import Badge from '@/components/ui/Badge.jsx';
import { useApp } from '@/context/AppContext.jsx';

const PLAYBOOK_META = {
  'service-save':      { color: theme.colors.urgent, urgency: 'urgent',  icon: '🛡', label: 'Service Save' },
  'slow-saturday':     { color: theme.colors.chartGolf, urgency: 'warning', icon: '⏱', label: 'Slow Saturday' },
  'engagement-decay':  { color: theme.colors.chartFB, urgency: 'warning', icon: '📉', label: 'Engagement Decay' },
  'staffing-gap':      { color: theme.colors.warning, urgency: 'warning', icon: '⚠', label: 'Staffing Gap' },
};

export default function PendingActions({ actions, onNavigate }) {
  const { playbooks, activatePlaybook } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {actions.map(action => {
        const meta    = PLAYBOOK_META[action.playbookId] || {};
        const pbState = playbooks[action.playbookId];
        const isActive = pbState?.active;

        return (
          <div key={action.playbookId} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 16px',
            background: isActive ? `${meta.color}0A` : 'var(--bg-card)',
            border: `1px solid ${isActive ? meta.color + '40' : 'var(--border)'}`,
            borderRadius: '8px',
            transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{meta.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {action.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {isActive ? `Active${action.measuredImpact ? ` · +$${action.measuredImpact.toLocaleString()} measured` : ''}` : 'Ready to activate'}
              </div>
              {!isActive && (
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: '2px' }}>
                  Activate starts monitoring and queues agent actions in Intervention Queue.
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
              {!isActive && <Badge text={meta.urgency === 'urgent' ? 'Urgent' : 'Recommended'} variant={meta.urgency} size="sm" />}
              {isActive && <Badge text="Active" variant="success" size="sm" />}
              {/* GMC-03: Clarify action workflow */}
              <button
                onClick={() => isActive ? null : activatePlaybook(action.playbookId)}
                title={isActive ? 'Playbook is currently active and running' : 'Activate → Triggers agent actions → Track in Intervention Queue'}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: isActive ? 'transparent' : meta.color,
                  color: isActive ? 'var(--text-muted)' : theme.colors.textPrimary,
                  border: isActive ? '1px solid var(--border)' : 'none',
                  cursor: isActive ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {isActive ? 'Active' : 'Activate'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
