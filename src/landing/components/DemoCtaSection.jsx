import { useState } from 'react';
import { theme } from '@/config/theme';

const buttonStyle = {
  minWidth: 180,
  height: 48,
  borderRadius: 8,
  fontFamily: theme.fonts.sans,
  fontWeight: 700,
  fontSize: '16px',
  padding: '0 24px',
  background: theme.colors.ctaGreen,
  color: theme.colors.ctaGreenText,
  border: '2px solid transparent',
  transition: 'background 150ms ease',
};

const DEMO_ENDPOINT = import.meta.env.VITE_DEMO_ENDPOINT || 'https://swoopgolf.com/api/demo-request';

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
  const [status, setStatus] = useState('idle');
  const [feedback, setFeedback] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('submitting');
    setFeedback('');
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch(DEMO_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || 'Submission failed. Please try again.');
      }
      setStatus('success');
      setFeedback("Thanks! We'll reach out within 24 hours to schedule your walkthrough.");
      event.currentTarget.reset();
    } catch (error) {
      setStatus('error');
      setFeedback(error.message || 'Something went wrong. Please try again.');
    }
  }

  return (
    <section id="demo-form" className="landing-section-padded" style={{
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
        marginBottom: theme.spacing.sm,
        maxWidth: 780,
        fontSize: theme.fontSize.lg,
      }}>
        Book a live walkthrough with your own operating scenarios: tee sheet leakage, at-risk
        members, F&B staffing pressure, and revenue pipeline blind spots.
      </p>
      <p style={{
        color: `${theme.colors.bgCard}D9`,
        marginBottom: theme.spacing.xl,
        maxWidth: 780,
      }}>
        Limited founding partner slots available — early clubs get hands-on onboarding and direct
        input on the roadmap.
      </p>
      <form
        onSubmit={handleSubmit}
        className="landing-grid-auto landing-demo-form"
        style={{ alignItems: 'end' }}
      >
        <label>
          <span style={{ display: 'block', marginBottom: 6 }}>Name</span>
          <input type="text" name="name" autoComplete="name" required style={inputStyle} />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: 6 }}>Club</span>
          <input type="text" name="club" autoComplete="organization" required style={inputStyle} />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: 6 }}>Email</span>
          <input type="email" name="email" autoComplete="email" required style={inputStyle} />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: 6 }}>Phone</span>
          <input type="tel" name="phone" autoComplete="tel" style={inputStyle} />
        </label>
        <button
          type="submit"
          className="landing-demo-submit"
          style={{ ...buttonStyle, cursor: status === 'submitting' ? 'wait' : 'pointer', opacity: status === 'submitting' ? 0.7 : 1 }}
          disabled={status === 'submitting'}
          onMouseEnter={(event) => {
            if (status !== 'submitting') event.currentTarget.style.background = theme.colors.ctaGreenHover;
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = theme.colors.ctaGreen;
          }}
        >
          {status === 'submitting' ? 'Submitting…' : 'Book Your Demo'}
        </button>
      </form>
      {(status === 'success' || status === 'error') && feedback && (
        <p style={{ marginTop: theme.spacing.md, fontSize: theme.fontSize.sm, color: status === 'success' ? theme.colors.ctaGreen : theme.colors.urgent }} role="status">
          {feedback}
        </p>
      )}
      <p style={{ marginTop: theme.spacing.md, color: `${theme.colors.bgCard}D9`, fontSize: theme.fontSize.sm }}>
        No credit card required · 30-minute walkthrough · Cancel anytime
      </p>
      <p style={{ marginTop: theme.spacing.sm, color: `${theme.colors.bgCard}99`, fontSize: theme.fontSize.sm }}>
        Or email us directly:{' '}
        <a href="mailto:demo@swoopgolf.com" style={{ color: theme.colors.ctaGreen, textDecoration: 'underline' }}>
          demo@swoopgolf.com
        </a>
        {' · '}Prefer to talk?{' '}
        <a href="tel:+14802259702" style={{ color: theme.colors.ctaGreen, textDecoration: 'underline' }}>
          (480) 225-9702
        </a>
      </p>
    </section>
  );
}
