// Integrations.jsx — supported systems panel for Demo Mode
// Hard ceiling: 200 lines. Target: 120 lines.

import { theme } from '@/config/theme';

const INTEGRATIONS = [
  {
    name: 'ForeTees',       icon: '⛳', color: theme.colors.operations,
    category: 'Tee Sheet',
    dataFeeds: ['Bookings', 'Pace of play', 'Waitlist', 'Guest players'],
    status: 'supported',
  },
  {
    name: 'Club Prophet',   icon: '◉', color: theme.colors.briefing,
    category: 'Membership',
    dataFeeds: ['Member profiles', 'Dues', 'Health scores', 'Resignations'],
    status: 'supported',
  },
  {
    name: 'Jonas POS',      icon: '🍽', color: theme.colors.fb,
    category: 'Food & Beverage',
    dataFeeds: ['POS checks', 'Line items', 'Outlet performance', 'Post-round dining'],
    status: 'supported',
  },
  {
    name: 'Northstar',      icon: '★', color: theme.colors.members,
    category: 'CRM / Email',
    dataFeeds: ['Member CRM', 'Email campaigns', 'Open/click rates', 'Engagement decay'],
    status: 'supported',
  },
  {
    name: 'ClubReady',      icon: '📅', color: theme.colors.staffing,
    category: 'Staff Scheduling',
    dataFeeds: ['Shift coverage', 'Understaffed alerts', 'Labor costs'],
    status: 'supported',
  },
  {
    name: 'Lightspeed',     icon: '⚡', color: '#94A3B8',
    category: 'POS',
    dataFeeds: ['Transactions', 'Inventory'],
    status: 'coming-soon',
  },
];

const TIMELINE = [
  { week: 'Week 1', label: 'Credential exchange + read-only API access',  color: theme.colors.operations },
  { week: 'Week 2', label: 'Data validation + cross-domain link verification', color: theme.colors.fb },
  { week: 'Week 3', label: 'Dashboard live — Daily Briefing populating',  color: theme.colors.members },
  { week: 'Week 4', label: 'Playbooks activated + baseline metrics locked', color: theme.colors.success },
];

export default function Integrations() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xl }}>

      {/* System grid */}
      <div>
        <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textSecondary,
          letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: theme.spacing.md }}>
          Supported Systems
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.md }}>
          {INTEGRATIONS.map(sys => (
            <div key={sys.name} style={{
              background:   theme.colors.bgCardHover,
              border:       `1px solid ${sys.status === 'supported' ? sys.color + '40' : theme.colors.border}`,
              borderRadius: theme.radius.md,
              padding:      theme.spacing.md,
              opacity:      sys.status === 'coming-soon' ? 0.6 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                marginBottom: theme.spacing.sm }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>{sys.icon}</span>
                  <span style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: sys.color }}>
                    {sys.name}
                  </span>
                </div>
                {sys.status === 'coming-soon'
                  ? <span style={{ fontSize: '10px', color: theme.colors.textMuted, padding: '2px 6px',
                      border: `1px solid ${theme.colors.border}`, borderRadius: '4px' }}>Soon</span>
                  : <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.colors.success,
                      display: 'block', boxShadow: `0 0 5px ${theme.colors.success}`, marginTop: 3 }} />
                }
              </div>
              <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginBottom: '6px',
                textTransform: 'uppercase', letterSpacing: '0.05em' }}>{sys.category}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {sys.dataFeeds.map(f => (
                  <div key={f} style={{ fontSize: '11px', color: theme.colors.textSecondary,
                    display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ color: sys.color, fontSize: '8px' }}>▸</span> {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Go-live timeline */}
      <div>
        <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textSecondary,
          letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: theme.spacing.md }}>
          Typical Go-Live Timeline — ForeTees + Jonas POS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {TIMELINE.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              background: theme.colors.bgCardHover, borderRadius: theme.radius.sm,
              border: `1px solid ${theme.colors.border}` }}>
              <span style={{ fontSize: theme.fontSize.xs, fontFamily: theme.fonts.mono,
                fontWeight: 700, color: t.color, minWidth: '48px' }}>{t.week}</span>
              <span style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>
                {t.label}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: theme.spacing.sm, fontSize: theme.fontSize.xs,
          color: theme.colors.textMuted, textAlign: 'center' }}>
          Live in 2 weeks with ForeTees + Jonas · All data read-only · No guest network access required
        </div>
      </div>

    </div>
  );
}
