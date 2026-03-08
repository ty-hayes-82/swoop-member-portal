import { theme } from '@/config/theme';
import { foundingPartnerBenefits } from '@/landing/data';

const integrations = [
  'ForeTees', 'Jonas Club Software', 'Northstar', 'Club Essential',
  'Square POS', 'Lightspeed', 'QuickBooks', 'ClubReady',
];

const pillStyle = {
  display: 'inline-block',
  padding: '6px 14px',
  borderRadius: 999,
  background: theme.colors.bgCard,
  border: `1px solid ${theme.colors.border}`,
  fontSize: theme.fontSize.sm,
  fontWeight: 500,
};

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
    metric: '$1.4M',
    subtitle: 'Annual dues identified as at-risk in demo',
    description: '5 members flagged across health score decline, declining visits, unresolved complaints, and behavioral pattern changes.',
  },
];

export default function SocialProofSection() {
  return (
    <section style={{ marginBottom: theme.spacing.xxl }}>
      {/* Integration Trust Strip */}
      <div style={{
        background: '#F3F4F6',
        borderRadius: theme.radius.lg,
        padding: '24px',
        marginBottom: theme.spacing.xl,
        textAlign: 'center',
      }}>
        <p style={{ fontWeight: 600, marginBottom: theme.spacing.md, color: theme.colors.textPrimary }}>
          Connects to the systems you already use
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: theme.spacing.md }}>
          {integrations.map((name) => (
            <span key={name} style={pillStyle}>{name}</span>
          ))}
        </div>
        <p style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, margin: 0 }}>
          28 integrations · Live in under 2 weeks · No rip-and-replace
        </p>
      </div>

      {/* Metric Proof Cards */}
      <div style={{ marginBottom: theme.spacing.xxl }}>
        <h2 style={{ fontSize: theme.fontSize.xxl, marginBottom: theme.spacing.sm, textAlign: 'center' }}>
          What Swoop detects in the demo scenario
        </h2>
        <p style={{ color: theme.colors.textMuted, marginBottom: theme.spacing.xl, textAlign: 'center', maxWidth: 700, margin: '0 auto ' + theme.spacing.xl }}>
          These metrics are from the Oakmont Hills CC demo environment (300 members, Jan 2026). Real founding partner case studies will be published as clubs onboard.
        </p>
        <div className="landing-grid-2" style={{ gap: theme.spacing.lg }}>
          {metricCards.map((card) => (
            <article
              key={card.title}
              style={{
                border: `1px solid ${theme.colors.border}`,
                borderLeft: `4px solid ${theme.colors.ctaGreen}`,
                borderRadius: theme.radius.lg,
                padding: '24px',
                background: theme.colors.bgCard,
              }}
            >
              <p style={{ fontSize: theme.fontSize.sm, textTransform: 'uppercase', fontWeight: 600, color: theme.colors.textMuted, marginBottom: theme.spacing.xs }}>
                {card.title}
              </p>
              <p style={{ fontSize: '42px', fontWeight: 700, fontFamily: theme.fonts.mono, color: theme.colors.ctaGreen, marginBottom: theme.spacing.xs, lineHeight: 1 }}>
                {card.metric}
              </p>
              <p style={{ fontSize: theme.fontSize.md, fontWeight: 600, marginBottom: theme.spacing.sm, color: theme.colors.textPrimary }}>
                {card.subtitle}
              </p>
              <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 1.5 }}>
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </div>

      <h2 style={{ fontSize: theme.fontSize.xxl, marginBottom: theme.spacing.md }}>
        Founding Partner Program
      </h2>
      <p style={{ color: theme.colors.textMuted, marginBottom: theme.spacing.lg }}>
        We&apos;re onboarding our first 10 clubs with hands-on implementation, direct roadmap input,
        and locked-in pricing. Be one of them.
      </p>
      <div className="landing-grid-3">
        {foundingPartnerBenefits.map((benefit) => (
          <article
            key={benefit.title}
            style={{
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.lg,
              padding: '20px',
              background: theme.colors.bgCard,
            }}
          >
            <p style={{ fontSize: theme.fontSize.lg, marginBottom: theme.spacing.sm, fontWeight: 700 }}>
              {benefit.title}
            </p>
            <p style={{ color: theme.colors.textSecondary }}>{benefit.description}</p>
          </article>
        ))}
      </div>
      <div style={{ marginTop: theme.spacing.lg }}>
        <a
          href="#demo-form"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 20px',
            borderRadius: theme.radius.md,
            background: theme.colors.ctaGreen,
            color: theme.colors.ctaGreenText,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Apply for Founding Partner
        </a>
        <p style={{ marginTop: theme.spacing.sm, color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
          Limited founding partner spots — early clubs get direct roadmap input
        </p>
      </div>
    </section>
  );
}
