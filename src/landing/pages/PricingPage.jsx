import { theme } from '@/config/theme';
import LandingShell from '@/landing/LandingShell';
import RoiCalculatorSection from '@/landing/components/RoiCalculatorSection';
import PricingSection from '@/landing/components/PricingSection';
import { faqItems } from '@/landing/data';
import { SectionShell, FaqItem, Button } from '@/landing/ui';

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
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.colors.brass || '#B5956A', margin: '0 0 14px' }}>
          TYPICAL CLUB IS LIVE IN 2 WEEKS · NO IT REQUIRED
        </p>
        <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
          Ready to see your numbers?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, margin: '0 auto 28px', maxWidth: 440 }}>
          30 minutes. We'll show you what Swoop surfaces for a club your size — with your real systems.
        </p>
        <Button size="lg" onClick={toDemoPage} style={{ background: theme.colors.accent, color: '#FFFFFF', border: 'none' }}>
          Book the walkthrough →
        </Button>
      </div>
    </SectionShell>
  );
}

export default function PricingPage() {
  return (
    <LandingShell>
      <RoiCalculatorSection />
      <PricingSection onCtaClick={toDemoPage} />
      <PricingFaqSection />
      <PricingCtaClose />
    </LandingShell>
  );
}
