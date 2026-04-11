import { theme } from '@/config/theme';

const ctaBase = {
  height: 48,
  borderRadius: 8,
  fontFamily: theme.fonts.sans,
  fontWeight: 700,
  fontSize: '16px',
  padding: '0 22px',
  transition: 'all 150ms ease',
  border: '2px solid transparent',
};

const TEAL = '#14B8A6';
const TEAL_HOVER = '#0D9488';

export default function HeroSection() {
  const goToDemoForm = () => {
    document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="landing-section-padded" style={{ padding: '88px 0 80px' }}>
      <div style={{ maxWidth: 820 }}>
        <p style={{
          color: theme.colors.accent,
          fontSize: theme.fontSize.sm,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: theme.spacing.md,
        }}>
          The Operating System for Private Clubs
        </p>
        <h1 style={{
          fontFamily: theme.fonts.serif,
          fontSize: 'clamp(38px, 5.5vw, 60px)',
          lineHeight: 1.1,
          marginBottom: theme.spacing.lg,
          maxWidth: 800,
        }}>
          Your members get{' '}
          <em style={{ color: theme.colors.accent, fontStyle: 'italic' }}>a concierge.</em>
          <br />
          Your GM gets{' '}
          <em style={{ color: TEAL, fontStyle: 'italic' }}>a command center.</em>
        </h1>
        <p style={{
          color: theme.colors.textSecondary,
          fontSize: 'clamp(17px, 2vw, 22px)',
          lineHeight: 1.55,
          maxWidth: 760,
          marginBottom: theme.spacing.xl,
        }}>
          AI agents that work both sides of the club relationship. Members book,
          ask, and engage through a personal concierge. The GM sees the full
          picture, acts on coordinated intelligence, and proves the impact to
          the board.
        </p>
        <div className="landing-hero-ctas">
          <button
            type="button"
            className="landing-hero-cta"
            style={{
              ...ctaBase,
              background: theme.colors.accent,
              color: '#FFFFFF',
            }}
            onClick={goToDemoForm}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = theme.colors.ctaGreenHover;
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = theme.colors.accent;
            }}
          >
            Book a 30-Minute Demo
          </button>
          <a
            href="#/demo/split-screen"
            className="landing-hero-cta"
            style={{
              ...ctaBase,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              background: 'transparent',
              color: TEAL,
              borderColor: TEAL,
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = TEAL;
              event.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = 'transparent';
              event.currentTarget.style.color = TEAL;
            }}
          >
            See a Day in Action
          </a>
        </div>
      </div>
    </section>
  );
}
