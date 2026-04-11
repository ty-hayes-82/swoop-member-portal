import { theme } from '@/config/theme';
import { pricingTiers } from '@/landing/data';

function PricingCard({ tier }) {
  const isPopular = tier.badge === 'Most Popular';
  return (
    <article
      style={{
        background: theme.colors.bgCard,
        border: `1px solid ${isPopular ? theme.colors.ctaGreen : theme.colors.border}`,
        borderRadius: theme.radius.lg,
        padding: isPopular ? '26px 22px' : '22px',
        boxShadow: isPopular ? theme.shadow.lg : theme.shadow.sm,
        transform: isPopular ? 'translateY(-6px)' : 'none',
      }}
    >
      {isPopular && (
        <span style={{
          display: 'inline-block',
          marginBottom: theme.spacing.sm,
          padding: '5px 10px',
          borderRadius: theme.radius.sm,
          background: `${theme.colors.ctaGreen}2B`,
          color: theme.colors.ctaGreenText,
          fontSize: theme.fontSize.sm,
          fontWeight: 700,
        }}>
          {tier.badge}
        </span>
      )}
      <h3 style={{ fontSize: theme.fontSize.xl, marginBottom: 6 }}>{tier.name}</h3>
      <p style={{ fontSize: theme.fontSize.xxl, margin: '0 0 10px', fontWeight: 700 }}>{tier.price}</p>
      <p style={{ color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>{tier.description}</p>
      <ul style={{ margin: `0 0 ${theme.spacing.lg}`, paddingLeft: 18, color: theme.colors.textSecondary }}>
        {tier.features.map((feature) => (
          <li key={feature} style={{ marginBottom: 8 }}>{feature}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        style={{
          width: '100%',
          borderRadius: theme.radius.md,
          border: `1px solid ${isPopular ? theme.colors.ctaGreen : theme.colors.border}`,
          background: isPopular ? theme.colors.ctaGreen : theme.colors.bgCard,
          color: isPopular ? theme.colors.ctaGreenText : theme.colors.textPrimary,
          fontWeight: 700,
          fontFamily: theme.fonts.sans,
          fontSize: theme.fontSize.md,
          padding: '12px 14px',
          cursor: 'pointer',
        }}
      >
        {tier.cta}
      </button>
    </article>
  );
}

export default function PricingSection() {
  return (
    <section id="pricing" style={{ marginBottom: theme.spacing.xxl }}>
      <h2 style={{ fontSize: theme.fontSize.xxl, marginBottom: theme.spacing.sm }}>
        Simple pricing. No long-term contracts.
      </h2>
      <p style={{ color: theme.colors.textSecondary, marginBottom: theme.spacing.xl, fontSize: theme.fontSize.lg }}>
        Start free with your existing systems. Upgrade when you see the value.
      </p>
      <div className="landing-grid-3" style={{ alignItems: 'stretch' }}>
        {pricingTiers.map((tier) => (
          <PricingCard key={tier.name} tier={tier} />
        ))}
      </div>
    </section>
  );
}
