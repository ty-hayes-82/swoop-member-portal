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

export default function HeroSection() {
  const goToDemoForm = () => {
    document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="landing-section-padded" style={{ padding: '88px 0 80px' }}>
      <div style={{ maxWidth: 780 }}>
        <p style={{
          color: theme.colors.accent,
          fontSize: theme.fontSize.sm,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: theme.spacing.md,
        }}>
          Swoop Golf
        </p>
        <h1 style={{
          fontFamily: theme.fonts.serif,
          fontSize: 'clamp(42px, 6vw, 68px)',
          lineHeight: 1.05,
          marginBottom: theme.spacing.lg,
          maxWidth: 760,
        }}>
          Know a member is leaving before they do.
        </h1>
        <p style={{
          color: theme.colors.textSecondary,
          fontSize: 'clamp(18px, 2vw, 24px)',
          maxWidth: 760,
          marginBottom: theme.spacing.xl,
        }}>
          The AI-powered GM platform that fills tee times with the right members
          {' '}— and proves the revenue impact of every decision.
        </p>
        <div className="landing-hero-ctas">
          <button
            type="button"
            className="landing-hero-cta"
            style={{
              ...ctaBase,
              background: theme.colors.ctaGreen,
              color: theme.colors.ctaGreenText,
            }}
            onClick={goToDemoForm}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = theme.colors.ctaGreenHover;
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = theme.colors.ctaGreen;
            }}
          >
            Book a Demo
          </button>
          <button
            type="button"
            className="landing-hero-cta"
            style={{
              ...ctaBase,
              background: 'transparent',
              color: theme.colors.ctaGreen,
              borderColor: theme.colors.ctaGreen,
            }}
            onClick={goToDemoForm}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = theme.colors.ctaGreen;
              event.currentTarget.style.color = theme.colors.ctaGreenText;
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = 'transparent';
              event.currentTarget.style.color = theme.colors.ctaGreen;
            }}
          >
            See How It Works
          </button>
        </div>
      </div>
    </section>
  );
}
