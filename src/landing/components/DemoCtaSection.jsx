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
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const isSubmitting = status === 'submitting';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validatePayload(payload) {
    if (!payload.name || !payload.club || !payload.email || !payload.phone) {
      return 'All fields are required.';
    }
    if (!emailPattern.test(payload.email)) {
      return 'Please provide a valid email address.';
    }
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: `${formData.get('name') ?? ''}`.trim(),
      club: `${formData.get('club') ?? ''}`.trim(),
      email: `${formData.get('email') ?? ''}`.trim(),
      phone: `${formData.get('phone') ?? ''}`.trim(),
    };

    const validationError = validatePayload(payload);
    if (validationError) {
      setStatus('error');
      setErrorMsg(validationError);
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      const response = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to submit demo request.');
      }
      setSubmittedName(payload.name);
      setStatus('success');
      event.currentTarget.reset();
    } catch (error) {
      setStatus('error');
      setErrorMsg(error.message || 'Unable to submit demo request.');
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
          <input type="text" name="name" autoComplete="name" style={inputStyle} disabled={isSubmitting} required />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: 6 }}>Club</span>
          <input type="text" name="club" autoComplete="organization" style={inputStyle} disabled={isSubmitting} required />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: 6 }}>Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            style={inputStyle}
            disabled={isSubmitting}
            required
          />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: 6 }}>Phone</span>
          <input type="tel" name="phone" autoComplete="tel" style={inputStyle} disabled={isSubmitting} required />
        </label>
        <button
          type="submit"
          className="landing-demo-submit"
          style={{
            ...buttonStyle,
            opacity: isSubmitting ? 0.85 : 1,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
          disabled={isSubmitting}
          onMouseEnter={(event) => {
            if (!isSubmitting) event.currentTarget.style.background = theme.colors.ctaGreenHover;
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = theme.colors.ctaGreen;
          }}
        >
          {isSubmitting ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: theme.spacing.sm }}>
              <span
                aria-hidden="true"
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: `2px solid ${theme.colors.ctaGreenText}`,
                  borderRightColor: 'transparent',
                  display: 'inline-block',
                  animation: 'spin 700ms linear infinite',
                }}
              />
              Submitting...
            </span>
          ) : 'Book Your Demo'}
        </button>
      </form>
      <p style={{ marginTop: theme.spacing.md, color: `${theme.colors.bgCard}D9`, fontSize: theme.fontSize.sm }}>
        No credit card required · 30-minute walkthrough · Cancel anytime
      </p>
      {status === 'success' && (
        <p style={{ marginTop: theme.spacing.md, color: theme.colors.ctaGreen }}>
          {`Thanks, ${submittedName}! We'll reach out within 24 hours.`}
        </p>
      )}
      {status === 'error' && (
        <p style={{ marginTop: theme.spacing.md, color: theme.colors.urgent }}>
          {errorMsg}
        </p>
      )}
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </section>
  );
}
