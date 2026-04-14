import { theme } from '@/config/theme';
import { SectionShell, Card } from '@/landing/ui';

const quotes = [
  {
    quote:
      'The Saturday brief is the first club-tech vendor deliverable I\'ve ever forwarded to my board without rewriting. Two members we were about to lose are still here because of it.',
    attribution: 'D. Marchetti · GM · Founding partner · 380-member private club · Name withheld through Q2 2026 pilot',
    role: 'Member Retention',
  },
  {
    quote:
      "Our waitlist fill rate jumped from 67% to 91% in the first month. The difference isn't more members — it's the right members in the right slots.",
    attribution: 'Director of Operations · Southeast · founding partner (pending)',
    role: 'Demand Optimization',
  },
  {
    quote:
      'Our board meeting used to be twelve spreadsheets and a lot of gut feel. Now it\'s one report generated overnight that shows exactly which actions protected revenue.',
    attribution: 'GM, 450-member club · founding partner (pending)',
    role: 'Board Reporting',
  },
];

export default function TestimonialsSection() {
  return (
    <SectionShell
      band="sand"
      eyebrow="In their words"
      title="Built with the GMs who live it."
      subtitle="Swoop is in closed pilot with founding-partner clubs. Attributed quotes publish Q2 2026 — these are paraphrased with permission."
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 28,
        }}
      >
        {quotes.map((q) => (
          <Card key={q.quote} interactive style={{ padding: 32, gap: 16 }}>
            <span className="landing-quote-mark" aria-hidden="true">&ldquo;</span>
            <p
              className="landing-quote-text"
              style={{ fontSize: 'clamp(18px, 1.6vw, 22px)', marginTop: -12 }}
            >
              {q.quote}
            </p>
            <div
              style={{
                marginTop: 'auto',
                paddingTop: 18,
                borderTop: '1px solid rgba(17,17,17,0.08)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: theme.colors.accent,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 4,
                }}
              >
                {q.role}
              </div>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary, lineHeight: 1.5 }}>
                {q.attribution}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </SectionShell>
  );
}
