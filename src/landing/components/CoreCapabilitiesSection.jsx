import { theme } from '@/config/theme';
import { coreCapabilities } from '@/landing/data';
import { SectionShell, Card, IconBadge, Stat } from '@/landing/ui';

const iconMap = {
  Users: 'Users',
  Calendar: 'Calendar',
  Utensils: 'Utensils',
  UsersRound: 'UsersRound',
  DollarSign: 'DollarSign',
};

export default function CoreCapabilitiesSection() {
  return (
    <SectionShell
      id="platform"
      band="cream"
      eyebrow="Platform"
      title="Five core capabilities. One operating view."
      subtitle="Swoop combines member behavior, demand, service, labor, and revenue so your team can act with confidence instead of assumptions."
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
        }}
      >
        {coreCapabilities.map((capability) => (
          <Card key={capability.title} interactive>
            <IconBadge name={iconMap[capability.icon] || 'Circle'} tone="orange" />
            <h3 style={{ fontSize: 22, fontWeight: 700, margin: '4px 0 0', color: theme.neutrals.ink }}>
              {capability.title}
            </h3>
            <p style={{ fontSize: 15, color: theme.colors.textSecondary, margin: 0, lineHeight: 1.55 }}>
              {capability.summary}
            </p>
            {capability.bullets?.length > 0 && (
              <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: theme.neutrals.ink, fontSize: 14, lineHeight: 1.6 }}>
                {capability.bullets.map((bullet) => (
                  <li key={bullet} style={{ marginBottom: 4 }}>{bullet}</li>
                ))}
              </ul>
            )}
            <div
              style={{
                marginTop: 'auto',
                paddingTop: 16,
                borderTop: '1px solid rgba(17,17,17,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: 12,
              }}
            >
              <div style={{ fontSize: 11, color: theme.colors.textMuted, maxWidth: 180, lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 3 }}>
                  {capability.source}
                </span>
                {capability.freshness}
              </div>
              {capability.metric && <Stat value={capability.metric.value} label={capability.metric.label} />}
            </div>
          </Card>
        ))}
      </div>
    </SectionShell>
  );
}
