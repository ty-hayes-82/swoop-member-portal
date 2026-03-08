import { theme } from '@/config/theme';

const trustSignals = [
  '28 System Integrations',
  'Live in Under 2 Weeks',
  'No Rip-and-Replace',
  'SOC 2 on Roadmap',
];

const vendorLogos = [
  { name: 'ForeTees', color: theme.colors.navOperations },
  { name: 'Jonas', color: theme.colors.navBriefing },
  { name: 'Northstar', color: theme.colors.navPipeline },
  { name: 'Clubessential', color: theme.colors.navMembers },
  { name: 'Square', color: theme.colors.navStaffing },
  { name: 'ADP', color: theme.colors.navFb },
];

export default function TrustStrip() {
  return (
    <section style={{ marginBottom: theme.spacing.xl }}>
      <p
        style={{
          textAlign: 'center',
          color: theme.colors.textMuted,
          fontSize: theme.fontSize.sm,
          letterSpacing: '0.02em',
          marginBottom: theme.spacing.md,
        }}
      >
        {trustSignals.join(' · ')}
      </p>
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: '16px', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginRight: '4px' }}>
          Works with:
        </span>
        {vendorLogos.map((v) => (
          <span key={v.name} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.borderLight}`,
            background: theme.colors.bgCard,
            fontSize: theme.fontSize.xs, fontWeight: 600,
            color: theme.colors.textSecondary,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: v.color, flexShrink: 0,
            }} />
            {v.name}
          </span>
        ))}
      </div>
    </section>
  );
}
