import Badge from '@/components/ui/Badge.jsx';
import { useApp } from '@/context/AppContext.jsx';

const PLAYBOOK_META = {
  'service-save':      { color: '#EF4444', urgency: 'urgent',  icon: '🛡', label: 'Service Save' },
  'slow-saturday':     { color: '#4ADE80', urgency: 'warning', icon: '⏱', label: 'Slow Saturday' },
  'engagement-decay':  { color: '#A78BFA', urgency: 'warning', icon: '📉', label: 'Engagement Decay' },
  'staffing-gap':      { color: '#F59E0B', urgency: 'warning', icon: '⚠', label: 'Staffing Gap' },
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
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
              {!isActive && <Badge text={meta.urgency === 'urgent' ? 'Urgent' : 'Recommended'} variant={meta.urgency} size="sm" />}
              {isActive && <Badge text="Active" variant="success" size="sm" />}
              <button
                onClick={() => isActive ? null : activatePlaybook(action.playbookId)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: isActive ? 'transparent' : meta.color,
                  color: isActive ? 'var(--text-muted)' : '#000',
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
