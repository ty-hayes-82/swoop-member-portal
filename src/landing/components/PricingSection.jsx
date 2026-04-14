import { theme } from '@/config/theme';
import { pricingTiers } from '@/landing/data';
import { SectionShell, Card, Button, Icon } from '@/landing/ui';

const pricingMobileStyles = `
  @media (max-width: 768px) {
    .pricing-grid { grid-template-columns: 1fr !important; }
    .pricing-card-featured { order: -1; transform: none !important; }
  }
`;

const TIER_CTA_LABELS = {
  '$0/mo': 'Start free — no card',
  '$499/mo': 'Book demo — Standard',
  '$1,499/mo': 'Talk to founders',
};

function PricingCard({ tier, onCtaClick }) {
  const isPopular = !!tier.badge;
  const isFree = tier.price === '$0/mo';
  const ctaLabel = TIER_CTA_LABELS[tier.price] ?? tier.cta;
  const handleCta = onCtaClick ?? (() =>
    document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));

  return (
    <Card
      featured={isPopular}
      interactive={!isPopular}
      className={isPopular ? 'pricing-card-featured' : undefined}
      style={{
        padding: isPopular ? 36 : 28,
        position: 'relative',
        ...(isPopular && {
          transform: 'translateY(-12px) scale(1.03)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 30px 60px rgba(243,146,45,0.22)',
          border: '2px solid #F3922D',
          zIndex: 1,
        }),
      }}
    >
      {isPopular && (
        <span
          style={{
            position: 'absolute',
            top: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '6px 16px',
            borderRadius: 999,
            background: theme.colors.accent,
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            whiteSpace: 'nowrap',
            boxShadow: '0 6px 16px rgba(243,146,45,0.4)',
          }}
        >
          {tier.badge}
        </span>
      )}
      {isPopular && tier.badgeFootnote && (
        <p style={{ fontSize: 11, color: theme.colors.textMuted, margin: '20px 0 -4px', textAlign: 'center', fontStyle: 'italic' }}>
          {tier.badgeFootnote}
        </p>
      )}
      <h3 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: theme.neutrals.ink }}>{tier.name}</h3>
      <p style={{ fontSize: 42, margin: '4px 0 0', fontWeight: 800, color: theme.neutrals.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>
        {tier.price}
      </p>
      <p style={{ color: theme.colors.textSecondary, fontSize: 15, lineHeight: 1.55, margin: '0 0 8px' }}>
        {tier.description}
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'grid', gap: 10 }}>
        {tier.features.map((feature) => (
          <li
            key={feature}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              fontSize: 14,
              color: theme.neutrals.ink,
              lineHeight: 1.5,
            }}
          >
            <Icon name="Check" size={18} color={theme.colors.accent} strokeWidth={3} style={{ flexShrink: 0, marginTop: 2 }} />
            {feature}
          </li>
        ))}
      </ul>
      {tier.technical && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.08)', fontSize: 12, color: '#666' }}>
          <strong style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Technical</strong>
          <p style={{ margin: '6px 0 0' }}>{tier.technical}</p>
        </div>
      )}
      <Button
        variant={isPopular ? 'primary' : 'light'}
        size="md"
        block
        onClick={handleCta}
        style={{ width: '100%', minHeight: 52, marginTop: 20 }}
      >
        {ctaLabel}
      </Button>
    </Card>
  );
}

export default function PricingSection({ onCtaClick }) {
  return (
    <SectionShell
      id="pricing"
      band="paper"
      eyebrow="THE TERMS"
      title="Start at zero. Upgrade when the math shows up."
      subtitle="No long-term contract. Cancel at the end of any month."
    >
      <style>{pricingMobileStyles}</style>
      {/* Founding partners banner */}
      <div
        style={{
          background: '#FAF7F2',
          border: '1px solid rgba(17,17,17,0.10)',
          borderRadius: 12,
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 24,
          marginBottom: 32,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: theme.colors.accent,
              margin: '0 0 4px',
            }}
          >
            Founding Partners · 3 of 10 seats remaining
          </p>
          <p style={{ fontSize: 13, color: theme.colors.textSecondary, margin: 0, maxWidth: 520 }}>
            A small founding cohort gets hands-on onboarding, direct roadmap influence, and
            pricing locked for life.
          </p>
        </div>
        <Button
          size="sm"
          onClick={onCtaClick ?? (() => document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))}
          style={{ whiteSpace: 'nowrap' }}
        >
          Claim a founding seat
        </Button>
      </div>

      <div
        className="pricing-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 28,
          alignItems: 'stretch',
          paddingTop: 8,
        }}
      >
        {pricingTiers.map((tier) => (
          <PricingCard key={tier.name} tier={tier} onCtaClick={onCtaClick} />
        ))}
      </div>

      {/* Reassurance strip */}
      <div style={{ textAlign: 'center', marginTop: 40, paddingTop: 32, borderTop: '1px solid rgba(17,17,17,0.07)' }}>
        <p style={{ fontSize: 14, color: theme.colors.textMuted, margin: 0 }}>
          Most clubs are live in under 2 weeks · No IT team required · Month-to-month, cancel any time
        </p>
      </div>
    </SectionShell>
  );
}
