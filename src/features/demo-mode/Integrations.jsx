// Integrations.jsx — supported systems + go-live timeline for Demo Mode
// Answers: "How quickly can Swoop connect to our systems?"
import { theme } from '@/config/theme';

const SUPPORTED_SYSTEMS = [
  { name: 'ForeTees',     category: 'Tee Sheet',          icon: '⛳', color: theme.colors.operations,  goLive: '3–5 days' },
  { name: 'Jonas POS',    category: 'Food & Beverage',    icon: '🍽', color: theme.colors.fb,           goLive: '3–5 days' },
  { name: 'Northstar',    category: 'Member CRM',         icon: '★',  color: theme.colors.members,      goLive: '5–7 days' },
  { name: 'ClubReady',    category: 'Staff Scheduling',   icon: '📅', color: theme.colors.staffing,     goLive: '2–3 days' },
  { name: 'Club Prophet', category: 'Membership Mgmt',    icon: '◉',  color: theme.colors.briefing,     goLive: '5–7 days' },
  { name: 'Lightspeed',   category: 'POS (alternative)',  icon: '⚡', color: theme.colors.fb,           goLive: '5–7 days' },
  { name: 'GolfGenius',   category: 'Tournament Mgmt',    icon: '🏆', color: theme.colors.operations,   goLive: '3–5 days' },
  { name: 'EZLinks',      category: 'Tee Sheet (alt)',    icon: '🔗', color: theme.colors.pipeline,     goLive: '5–7 days' },
];

const TIMELINE = [
  { day: 'Day 1–2',   label: 'Credential exchange',  detail: 'API keys provided, connection tested in sandbox' },
  { day: 'Day 3–5',   label: 'Data validation',       detail: 'Historical data ingested, correlation checks run' },
  { day: 'Day 5–7',   label: 'Dashboard live',        detail: 'GM receives login, first Daily Briefing generated' },
  { day: 'Day 7–14',  label: 'Playbooks configured',  detail: "Thresholds tuned to the club's specific patterns" },
];

export default function Integrations() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>

      {/* Supported systems grid */}
      <div>
        <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary,
          marginBottom: theme.spacing.md }}>
          Supported Systems
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: theme.spacing.sm }}>
          {SUPPORTED_SYSTEMS.map(sys => (
            <div key={sys.name} style={{
              background: theme.colors.bgCardHover,
              border: `1px solid ${sys.color}30`,
              borderRadius: theme.radius.sm,
              padding: theme.spacing.sm,
              display: 'flex', alignItems: 'center', gap: theme.spacing.sm,
            }}>
              <span style={{ fontSize: '18px' }}>{sys.icon}</span>
              <div>
                <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: sys.color }}>{sys.name}</div>
                <div style={{ fontSize: '10px', color: theme.colors.textMuted }}>{sys.category}</div>
                <div style={{ fontSize: '10px', color: theme.colors.success, marginTop: '2px' }}>Live in {sys.goLive}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Go-live timeline */}
      <div>
        <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary,
          marginBottom: theme.spacing.md }}>
          Typical Go-Live Timeline: ForeTees + Jonas POS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {TIMELINE.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: theme.spacing.md, alignItems: 'flex-start' }}>
              <div style={{ fontFamily: theme.fonts.mono, fontSize: '11px', color: theme.colors.operations,
                fontWeight: 700, minWidth: '60px', paddingTop: '2px' }}>
                {step.day}
              </div>
              <div style={{ flex: 1, borderLeft: `2px solid ${theme.colors.border}`, paddingLeft: theme.spacing.md }}>
                <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>
                  {step.label}
                </div>
                <div style={{ fontSize: '11px', color: theme.colors.textMuted, marginTop: '2px' }}>
                  {step.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Closing stat */}
      <div style={{ padding: theme.spacing.md, background: `${theme.colors.operations}10`,
        border: `1px solid ${theme.colors.operations}30`, borderRadius: theme.radius.sm,
        textAlign: 'center' }}>
        <span style={{ fontSize: theme.fontSize.md, color: theme.colors.textPrimary }}>
          Most clubs are live in{' '}
          <strong style={{ color: theme.colors.operations, fontFamily: theme.fonts.mono }}>under 2 weeks</strong>
          {' '}— with no changes to existing systems.
        </span>
      </div>
    </div>
  );
}
