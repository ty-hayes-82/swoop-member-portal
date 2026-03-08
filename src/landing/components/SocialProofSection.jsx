import { theme } from '@/config/theme';
import { foundingPartnerBenefits } from '@/landing/data';

export default function SocialProofSection() {
  return (
    <section style={{ marginBottom: theme.spacing.xxl }}>
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
          3 of 10 spots remaining
        </p>
      </div>
    </section>
  );
}
