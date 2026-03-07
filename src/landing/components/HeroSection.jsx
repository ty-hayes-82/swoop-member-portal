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
  return (
    <section style={{ padding: '88px 0 80px' }}>
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
          and proves the revenue impact of every decision.
        </p>
        <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap' }}>
          <button
            type="button"
            style={{
              ...ctaBase,
              background: '#4ADE80',
              color: '#1F2F24',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = '#43C872';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = '#4ADE80';
            }}
          >
            Book a Demo
          </button>
          <button
            type="button"
            style={{
              ...ctaBase,
              background: 'transparent',
              color: '#4ADE80',
              borderColor: '#4ADE80',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = '#4ADE80';
              event.currentTarget.style.color = '#1F2F24';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = 'transparent';
              event.currentTarget.style.color = '#4ADE80';
            }}
          >
            See the Platform
          </button>
        </div>
      </div>
    </section>
  );
}
