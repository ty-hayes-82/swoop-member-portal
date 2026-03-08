import { theme } from '@/config/theme';

const ctaBase = {
  minWidth: 180,
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

  const goToApp = () => {
    window.location.assign('/');
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
          Your club runs on gut feeling. Swoop changes that.
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
        <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap' }}>
          <button
            type="button"
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
            style={{
              ...ctaBase,
              background: 'transparent',
              color: theme.colors.ctaGreen,
              borderColor: theme.colors.ctaGreen,
            }}
            onClick={goToApp}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = theme.colors.ctaGreen;
              event.currentTarget.style.color = theme.colors.ctaGreenText;
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = 'transparent';
              event.currentTarget.style.color = theme.colors.ctaGreen;
            }}
          >
            See the Platform
          </button>
        </div>
      </div>
    </section>
  );
}
