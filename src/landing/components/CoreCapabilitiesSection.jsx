import { theme } from '@/config/theme';
import { coreCapabilities } from '@/landing/data';
import { SectionShell, Card, IconBadge } from '@/landing/ui';

const iconMap = {
  Users: 'Users',
  Calendar: 'Calendar',
  Utensils: 'Utensils',
  UsersRound: 'UsersRound',
  DollarSign: 'DollarSign',
  Send: 'Send',
  Mail: 'Mail',
};

export default function CoreCapabilitiesSection() {
  return (
    <SectionShell
      id="platform"
      band="cream"
      eyebrow="THE PLATFORM"
      title="Six jobs Swoop does before your GM finishes coffee."
      subtitle="Member behavior, demand, service, labor, revenue, outreach — all surfaced on one page your team can act from before the first tee time."
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
        }}
      >
        {coreCapabilities.map((capability) => (
          <Card key={capability.title} interactive>
            <IconBadge name={iconMap[capability.icon] || 'Circle'} tone="neutral" />
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: '8px 0 4px', color: theme.neutrals.ink }}>
              {capability.title}
            </h3>
            <p style={{ fontSize: 14, color: theme.colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
              {capability.summary}
            </p>
            {capability.bullets?.length > 0 && (
              <ul
                style={{
                  margin: '8px 0 0',
                  paddingLeft: 16,
                  color: theme.colors.textSecondary,
                  fontSize: 13,
                  lineHeight: 1.65,
                }}
              >
                {capability.bullets.map((bullet) => (
                  <li key={bullet} style={{ marginBottom: 3 }}>{bullet}</li>
                ))}
              </ul>
            )}
            <div
              style={{
                marginTop: 'auto',
                paddingTop: 14,
                borderTop: '1px solid rgba(17,17,17,0.07)',
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: theme.colors.textMuted,
                  margin: 0,
                }}
              >
                READS FROM: {capability.source}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </SectionShell>
  );
}
