import { theme } from '@/config/theme';
import LandingShell from '@/landing/LandingShell';
import RoiCalculatorSection from '@/landing/components/RoiCalculatorSection';
import PricingSection from '@/landing/components/PricingSection';
import { faqItems } from '@/landing/data';
import { SectionShell, FaqItem, Button } from '@/landing/ui';

const pricingStats = [
  { value: '3,000+', label: 'Private clubs in the US with 200+ members', source: 'NGCOA 2023' },
  { value: '$2.1B', label: 'Annual dues revenue at risk from preventable churn', source: 'Club Benchmarking 2024' },
  { value: '67%', label: 'Of clubs still rely on disconnected point solutions', source: 'NGCOA 2023' },
];

function PricingHero() {
  const scrollToPlans = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <SectionShell band="dark" eyebrow="PRICING" title="The platform that pays for itself.">
      <div style={{ textAlign: 'center', marginTop: -8, marginBottom: 40 }}>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.70)', maxWidth: 580, margin: '0 auto 28px', lineHeight: 1.65 }}>
          Most clubs recover Swoop's annual cost within 60 days of their first early intervention. Start free. Upgrade when the ROI is obvious.
        </p>
        <Button size="lg" onClick={scrollToPlans} style={{ background: theme.colors.accent, color: '#FFFFFF', border: 'none' }}>
          See the plans →
        </Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
        {pricingStats.map((s) => (
          <div
            key={s.value}
            style={{
              textAlign: 'center',
              padding: '28px 20px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
            }}
          >
            <p style={{ fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 800, fontFamily: theme.fonts.mono, color: theme.colors.accent, margin: '0 0 8px', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {s.value}
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 6px', lineHeight: 1.5 }}>
              {s.label}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, fontStyle: 'italic' }}>
              ({s.source})
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

const PRICING_FAQ_QUESTIONS = new Set([
  'Do I need to replace my current software?',
  'How long does setup take?',
  "Is my members' data secure?",
  'What does a founding-partner pilot actually look like?',
  'What happens if we cancel?',
]);

const pricingFaqItems = faqItems.filter((item) => PRICING_FAQ_QUESTIONS.has(item.question));

const toDemoPage = () => { window.location.hash = '#/contact'; };

function PricingFaqSection() {
  return (
    <SectionShell
      band="cream"
      container="narrow"
      eyebrow="Pricing FAQ"
      title="Things GMs ask us."
    >
      <div
        style={{
          background: theme.neutrals.paper,
          borderRadius: 20,
          padding: 'clamp(12px, 3vw, 32px)',
          border: '1px solid rgba(17,17,17,0.08)',
        }}
      >
        {pricingFaqItems.map((item, idx) => (
          <FaqItem key={item.question} question={item.question} answer={item.answer} defaultOpen={idx === 0} />
        ))}
      </div>
    </SectionShell>
  );
}

function PricingCtaClose() {
  return (
    <SectionShell band="dark" size="sm">
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: '0 0 12px' }}>
          Ready to see which of your members are at risk?
        </p>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, maxWidth: 460, margin: '0 auto 24px' }}>
          Setup takes 15 minutes. Your first member brief arrives tomorrow morning.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#/contact" onClick={() => { window.location.hash = '#/contact'; }}
            style={{ display: 'inline-block', background: '#F3922D', color: '#fff', fontWeight: 700, fontSize: 16, padding: '14px 32px', borderRadius: 8, textDecoration: 'none' }}>
            Book a 30-min Walkthrough →
          </a>
          <a href="#/contact" onClick={() => { window.location.hash = '#/contact'; }}
            style={{ display: 'inline-block', background: 'transparent', color: '#fff', fontWeight: 600, fontSize: 16, padding: '14px 32px', borderRadius: 8, textDecoration: 'none', border: '2px solid rgba(255,255,255,0.3)' }}>
            Start Free — No Credit Card
          </a>
        </div>
      </div>
    </SectionShell>
  );
}

export default function PricingPage() {
  return (
    <LandingShell>
      <PricingHero />
      <RoiCalculatorSection />
      <PricingSection onCtaClick={toDemoPage} />
      <PricingFaqSection />
      <PricingCtaClose />
    </LandingShell>
  );
}
