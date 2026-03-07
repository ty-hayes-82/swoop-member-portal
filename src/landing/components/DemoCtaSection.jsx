import { theme } from '@/config/theme';

const buttonStyle = {
  minWidth: 180,
  height: 48,
  borderRadius: 8,
  fontFamily: theme.fonts.sans,
  fontWeight: 700,
  fontSize: '16px',
  padding: '0 24px',
  background: '#4ADE80',
  color: '#1F2F24',
  border: '2px solid transparent',
  transition: 'background 150ms ease',
};

const inputStyle = {
  width: '100%',
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.md,
  padding: '12px 14px',
  fontSize: theme.fontSize.md,
  fontFamily: theme.fonts.sans,
  background: theme.colors.bgCard,
  color: theme.colors.textPrimary,
};

export default function DemoCtaSection() {
  return (
    <section style={{
      margin: `${theme.spacing.xxl} 0`,
      borderRadius: theme.radius.xl,
      background: theme.colors.bgSidebar,
      color: theme.colors.bgCard,
      padding: '54px 28px',
    }}>
      <h2 style={{ fontSize: 'clamp(30px, 4vw, 46px)', marginBottom: theme.spacing.md }}>
        See what your club misses today and can recover tomorrow.
      </h2>
      <p style={{
        color: `${theme.colors.bgCard}D9`,
        marginBottom: theme.spacing.xl,
        maxWidth: 780,
        fontSize: theme.fontSize.lg,
      }}>
        Book a live walkthrough with your own operating scenarios: tee sheet leakage, at-risk
        members, F&B staffing pressure, and revenue pipeline blind spots.
      </p>
      <form
        onSubmit={(event) => event.preventDefault()}
        className="landing-grid-auto"
        style={{ alignItems: 'end' }}
      >
        <label>
          <span style={{ display: 'block', marginBottom: 6 }}>First Name</span>
          <input type="text" name="firstName" autoComplete="given-name" style={inputStyle} />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: 6 }}>Club</span>
          <input type="text" name="club" autoComplete="organization" style={inputStyle} />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: 6 }}>Email</span>
          <input type="email" name="email" autoComplete="email" style={inputStyle} />
        </label>
        <button
          type="submit"
          style={buttonStyle}
          onMouseEnter={(event) => {
            event.currentTarget.style.background = '#43C872';
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = '#4ADE80';
          }}
        >
          Book Your Demo
        </button>
      </form>
    </section>
  );
}
