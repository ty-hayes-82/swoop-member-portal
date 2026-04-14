import { theme } from '@/config/theme';
import { foundingPartnerBenefits } from '@/landing/data';
import { SectionShell, Card, Button, IconBadge, Stat } from '@/landing/ui';

const metricCards = [
  {
    title: 'Early Warning System',
    metric: '6 days',
    subtitle: 'Average advance notice on at-risk members',
    description: 'Detected James Whitfield resignation risk 6 days before it happened by connecting POS spend decline, CRM complaint, and tee sheet pattern changes.',
  },
  {
    title: 'Waitlist Performance',
    metric: '91%',
    subtitle: 'Fill rate with retention-prioritized queue',
    description: 'Improved from 67% reactive fill rate by ranking waitlist members by retention value and match-fit, not just timestamp.',
  },
  {
    title: 'Revenue Per Slot',
    metric: '$312',
    subtitle: 'Average revenue per slot with intelligence',
    description: 'Increased from $187 reactive average by backfilling cancellations with high-engagement, high-F&B members first.',
  },
  {
    title: 'Dues at Risk Visibility',
    metric: '$1.38M',
    subtitle: 'Annual dues identified as at-risk in demo',
    description: '23 members flagged across health score decline, declining visits, unresolved complaints, and behavioral pattern changes.',
  },
];

const benefitIcons = ['Handshake', 'Compass', 'Lock'];

export default function SocialProofSection({ onCtaClick }) {
  return (
    <SectionShell
      band="cream"
      eyebrow="Proof"
      title="Intelligence in action: live demo results"
      subtitle="Metrics from the Pinetree CC demo environment (300 members, real system data). Founding partner case studies publishing Q2 2026."
    >
      <div
        className="landing-metric-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 20,
          marginBottom: 80,
        }}
      >
        {metricCards.map((card) => (
          <Card key={card.title} interactive>
            <p
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                fontWeight: 700,
                color: theme.colors.textMuted,
                margin: 0,
                letterSpacing: '0.1em',
              }}
            >
              {card.title}
            </p>
            <p
              style={{
                fontSize: 52,
                fontWeight: 800,
                fontFamily: theme.fonts.mono,
                color: theme.colors.accent,
                margin: '4px 0 0',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {card.metric}
            </p>
            <p style={{ fontSize: 16, fontWeight: 700, color: theme.neutrals.ink, margin: '8px 0 0' }}>
              {card.subtitle}
            </p>
            <p style={{ fontSize: 14, color: theme.colors.textSecondary, lineHeight: 1.55, margin: 0 }}>
              {card.description}
            </p>
          </Card>
        ))}
      </div>

      <div
        style={{
          background: theme.neutrals.paper,
          border: `2px solid ${theme.colors.accent}`,
          borderRadius: 24,
          padding: 'clamp(32px, 5vw, 56px)',
          position: 'relative',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: 999,
              background: theme.colors.accent,
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 16,
            }}
          >
            Founding Partner Program
          </span>
          <h3
            style={{
              fontSize: 'clamp(26px, 3.5vw, 38px)',
              fontWeight: 700,
              color: theme.neutrals.ink,
              margin: '0 0 12px',
              letterSpacing: '-0.02em',
            }}
          >
            Be one of our first ten clubs.
          </h3>
          <p style={{ color: theme.colors.textSecondary, fontSize: 17, maxWidth: 620, margin: '0 auto' }}>
            Hands-on implementation, direct roadmap input, and locked-in pricing for life.
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24,
            marginBottom: 32,
          }}
        >
          {foundingPartnerBenefits.map((benefit, idx) => (
            <div key={benefit.title} style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <IconBadge name={benefitIcons[idx] || 'Star'} tone="orange" />
              </div>
              <p style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px', color: theme.neutrals.ink }}>
                {benefit.title}
              </p>
              <p style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 1.55, margin: 0 }}>
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <Button
            onClick={onCtaClick ?? (() => { window.location.hash = '#/contact'; })}
          >
            Apply for Founding Partner
          </Button>
          <p style={{ marginTop: 14, color: theme.colors.textMuted, fontSize: 13 }}>
            Limited founding partner spots — early clubs get direct roadmap input
          </p>
        </div>
      </div>
    </SectionShell>
  );
}
