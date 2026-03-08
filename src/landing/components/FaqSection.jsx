import { useState } from 'react';
import { theme } from '@/config/theme';
import { faqItems } from '@/landing/data';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section style={{ marginBottom: theme.spacing.xxl }}>
      <h2 style={{ fontSize: theme.fontSize.xxl, marginBottom: theme.spacing.md }}>
        Frequently asked questions
      </h2>
      <div style={{
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        background: theme.colors.bgCard,
      }}>
        {faqItems.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={item.question} style={{ borderBottom: index < faqItems.length - 1 ? `1px solid ${theme.colors.borderLight}` : 'none' }}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                aria-expanded={isOpen}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  padding: '16px 18px',
                  background: isOpen ? theme.colors.bgDeep : theme.colors.bgCard,
                  color: theme.colors.textPrimary,
                  fontSize: theme.fontSize.md,
                  fontFamily: theme.fonts.sans,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                }}
              >
                <span>{item.question}</span>
                <span style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.lg }}>{isOpen ? '−' : '+'}</span>
              </button>
              <div style={{
                maxHeight: isOpen ? 220 : 0,
                overflow: 'hidden',
                transition: 'max-height 220ms ease',
              }}>
                <p style={{
                  margin: 0,
                  padding: '0 18px 16px',
                  color: theme.colors.textSecondary,
                  lineHeight: 1.55,
                }}>
                  {item.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
