import { theme } from '@/config/theme';
import { pricingTiers } from '@/landing/data';
import { SectionShell, Card, Button, Icon } from '@/landing/ui';

function PricingCard({ tier }) {
  const isPopular = tier.badge === 'Most Popular';
  const goToDemoForm = () =>
    document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <Card
      featured={isPopular}
      interactive={!isPopular}
      style={{
        padding: isPopular ? 36 : 28,
        ...(isPopular && {
          transform: 'translateY(-12px)',
          boxShadow: '0 30px 60px rgba(243,146,45,0.22), 0 10px 20px rgba(17,17,17,0.08)',
          borderWidth: 2,
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
      <Button
        variant={isPopular ? 'primary' : 'light'}
        size="md"
        block
        onClick={goToDemoForm}
      >
        {tier.cta}
      </Button>
    </Card>
  );
}

export default function PricingSection() {
  return (
    <SectionShell
      id="pricing"
      band="paper"
      eyebrow="Pricing"
      title="Simple pricing. No long-term contracts."
      subtitle="Start free with your existing systems. Upgrade when you see the value."
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 28,
          alignItems: 'stretch',
          paddingTop: 24,
        }}
      >
        {pricingTiers.map((tier) => (
          <PricingCard key={tier.name} tier={tier} />
        ))}
      </div>
    </SectionShell>
  );
}
