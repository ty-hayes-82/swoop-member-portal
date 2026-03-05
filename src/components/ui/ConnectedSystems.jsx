// ConnectedSystems.jsx — integration status panel for Daily Briefing + Demo Mode
// Hard ceiling: 150 lines. Target: 80 lines.

import { theme } from '@/config/theme';

const SYSTEMS = [
  {
    name:     'ForeTees',
    role:     'Tee Sheet · Golf Operations',
    icon:     '⛳',
    color:    theme.colors.operations,
    lastSync: '4 min ago',
    records:  '2,524 bookings',
  },
  {
    name:     'Jonas POS',
    role:     'Food & Beverage · Payments',
    icon:     '🍽',
    color:    theme.colors.fb,
    lastSync: '2 min ago',
    records:  '3,851 checks',
  },
  {
    name:     'Northstar',
    role:     'Member CRM · Email',
    icon:     '★',
    color:    theme.colors.members,
    lastSync: '8 min ago',
    records:  '300 members',
  },
  {
    name:     'ClubReady',
    role:     'Staff Scheduling',
    icon:     '📅',
    color:    theme.colors.staffing,
    lastSync: '12 min ago',
    records:  '701 shifts',
  },
  {
    name:     'Club Prophet',
    role:     'Membership Management',
    icon:     '◉',
    color:    theme.colors.briefing,
    lastSync: '6 min ago',
    records:  '300 accounts',
  },
];

export default function ConnectedSystems({ compact = false }) {
  return (
    <div style={{
      background:   theme.colors.bgCard,
      border:       `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.md,
      overflow:     'hidden',
    }}>
      <div style={{
        padding:      `${theme.spacing.sm} ${theme.spacing.md}`,
        borderBottom: `1px solid ${theme.colors.border}`,
        display:      'flex',
        alignItems:   'center',
        gap:          theme.spacing.sm,
      }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: theme.colors.textSecondary,
          letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Connected Systems
        </span>
        <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px',
          background: `${theme.colors.success}20`, color: theme.colors.success, fontWeight: 600 }}>
          {SYSTEMS.length} Live
        </span>
      </div>

      <div style={{ padding: compact ? `${theme.spacing.sm} ${theme.spacing.md}` : theme.spacing.md,
        display: 'flex', flexDirection: 'column', gap: compact ? '6px' : theme.spacing.sm }}>
        {SYSTEMS.map(sys => (
          <div key={sys.name} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
            {/* Green dot */}
            <div style={{ width: 6, height: 6, borderRadius: '50%',
              background: theme.colors.success, flexShrink: 0, boxShadow: `0 0 4px ${theme.colors.success}` }} />

            <span style={{ fontSize: '13px' }}>{sys.icon}</span>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: sys.color }}>{sys.name}</span>
                {!compact && (
                  <span style={{ fontSize: '10px', color: theme.colors.textMuted }}>{sys.role}</span>
                )}
              </div>
              {!compact && (
                <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginTop: '1px' }}>
                  {sys.records} · synced {sys.lastSync}
                </div>
              )}
            </div>

            <span style={{ fontSize: '10px', color: theme.colors.success, flexShrink: 0 }}>●</span>
          </div>
        ))}
      </div>
    </div>
  );
}
