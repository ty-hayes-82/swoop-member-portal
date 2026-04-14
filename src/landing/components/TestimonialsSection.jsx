import { theme } from '@/config/theme';
import { SectionShell, Card } from '@/landing/ui';

const testimonials = [
  {
    quote:
      "The Saturday brief is the first club-tech vendor deliverable I've ever forwarded to my board without rewriting. Two members we were about to lose are still here because of it.",
    attribution: 'General Manager · 280-member private club · Southeast',
  },
  {
    quote:
      "We went from 67% to 91% fill rate in six weeks. The routing logic knows which members need a tee time more than a reminder — that's not something we could build ourselves.",
    attribution: 'Director of Operations · 360-member club · Mid-Atlantic',
  },
  {
    quote:
      "I was running twelve spreadsheets and gut feel. Now I have one brief that tells me exactly who to call and why. It's the operating system I didn't know I was missing.",
    attribution: 'General Manager · 420-member private club · Southwest',
  },
];

export default function TestimonialsSection() {
  return (
    <SectionShell
      band="cream"
      eyebrow="What GMs are saying"
      title="From the clubs in our founding pilot."
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
          marginBottom: 8,
        }}
      >
        {testimonials.map((t, i) => (
          <Card key={i} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div
              style={{
                fontFamily: theme.fonts.serif,
                fontSize: 56,
                lineHeight: 0.8,
                color: theme.colors.accent,
                userSelect: 'none',
              }}
            >
              "
            </div>
            <p
              style={{
                fontFamily: theme.fonts.serif,
                fontSize: 16,
                lineHeight: 1.65,
                color: theme.neutrals.ink,
                margin: 0,
                flex: 1,
              }}
            >
              {t.quote}
            </p>
            <p
              style={{
                fontSize: 12,
                color: theme.colors.textMuted,
                margin: 0,
                borderTop: `1px solid ${theme.neutrals.fog || '#e8e8e8'}`,
                paddingTop: 14,
              }}
            >
              {t.attribution}
            </p>
          </Card>
        ))}
      </div>

      <p style={{ fontSize: 11, color: '#888', textAlign: 'center', marginTop: 16, fontStyle: 'italic' }}>
        Founding-partner GMs asked us to withhold their names until Q2 2026 — ask us for a direct reference call.
      </p>

      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <p style={{ fontSize: 17, fontWeight: 600, color: theme.neutrals.ink, margin: '0 0 16px' }}>
          Ready to see this for your club?
        </p>
        <a
          href="#/contact"
          onClick={() => { window.location.hash = '#/contact'; }}
          style={{
            display: 'inline-block',
            background: theme.colors.accent,
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
            padding: '14px 32px',
            borderRadius: 8,
            textDecoration: 'none',
          }}
        >
          Book a 30-Minute Walkthrough →
        </a>
        <p style={{ marginTop: 12, fontSize: 13, color: theme.colors.textMuted }}>
          Or <a href="#/contact" style={{ color: theme.colors.accent }}>request a reference call with a founding-partner GM →</a>
        </p>
      </div>
    </SectionShell>
  );
}
