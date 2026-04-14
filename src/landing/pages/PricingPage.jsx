import { theme } from '@/config/theme';
import LandingShell from '@/landing/LandingShell';
import RoiCalculatorSection from '@/landing/components/RoiCalculatorSection';
import PricingSection from '@/landing/components/PricingSection';
import { faqItems } from '@/landing/data';
import { SectionShell, FaqItem } from '@/landing/ui';

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

export default function PricingPage() {
  return (
    <LandingShell>
      <RoiCalculatorSection />
      <PricingSection onCtaClick={toDemoPage} />
      <PricingFaqSection />
    </LandingShell>
  );
}
