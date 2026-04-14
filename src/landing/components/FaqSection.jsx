import { theme } from '@/config/theme';
import { faqItems } from '@/landing/data';
import { SectionShell, FaqItem } from '@/landing/ui';

export default function FaqSection() {
  return (
    <SectionShell
      band="paper"
      container="narrow"
      eyebrow="FAQ"
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
        {faqItems.map((item, idx) => (
          <FaqItem
            key={item.question}
            question={item.question}
            answer={item.answer}
            defaultOpen={idx === 0 || item.question === "Is my members' data secure?"}
          />
        ))}
      </div>
    </SectionShell>
  );
}
