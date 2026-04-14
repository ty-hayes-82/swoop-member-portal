import { useState } from 'react';
import { theme } from '@/config/theme';
import { Button, Input, Eyebrow } from '@/landing/ui';
import { photoUrl, photoAlt } from '@/landing/assets/photos';

const DEMO_ENDPOINT = import.meta.env.VITE_DEMO_ENDPOINT || 'https://swoopgolf.com/api/demo-request';

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
    <section
      id="demo-form"
      className="landing-band landing-band-dark landing-section"
      style={{
        backgroundImage: `
          linear-gradient(180deg, rgba(15,15,15,0.88) 0%, rgba(15,15,15,0.94) 100%),
          radial-gradient(ellipse at top right, rgba(243,146,45,0.35), transparent 60%),
          url(${photoUrl('clubhouse', 1200)})
        `,
        backgroundSize: 'cover, cover, cover',
        backgroundPosition: 'center, center, center',
        backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
      }}
      aria-label={`Demo section. Background: ${photoAlt('clubhouse')}`}
    >
      <div className="landing-container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: 'clamp(32px, 5vw, 72px)',
            alignItems: 'center',
          }}
          className="landing-demo-hero"
        >
          <div>
            <Eyebrow>Book a demo</Eyebrow>
            <h2
              style={{
                fontSize: 'clamp(34px, 4.5vw, 56px)',
                fontWeight: 700,
                color: '#FFFFFF',
                margin: '0 0 20px',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                textWrap: 'balance',
              }}
            >
              See what your club misses today and can recover tomorrow.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 18, lineHeight: 1.55, margin: '0 0 16px', maxWidth: 520 }}>
              Book a live walkthrough with your own operating scenarios: tee sheet leakage, at-risk
              members, F&amp;B staffing pressure, and revenue pipeline blind spots.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, margin: '0 0 32px' }}>
              Limited founding partner slots available — early clubs get hands-on onboarding and direct
              input on the roadmap.
            </p>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20,
              padding: 'clamp(24px, 3vw, 36px)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="landing-demo-form-row">
                <Input tone="dark" name="name" label="Name" autoComplete="name" required />
                <Input tone="dark" name="club" label="Club" autoComplete="organization" required />
              </div>
              <Input tone="dark" name="email" type="email" label="Email" autoComplete="email" required />
              <Input tone="dark" name="phone" type="tel" label="Phone (optional)" autoComplete="tel" />
              <Button
                type="submit"
                size="lg"
                block
                disabled={status === 'submitting'}
                style={{ marginTop: 6, opacity: status === 'submitting' ? 0.7 : 1, cursor: status === 'submitting' ? 'wait' : 'pointer' }}
              >
                {status === 'submitting' ? 'Submitting…' : 'Book Your Demo'}
              </Button>
            </form>
            {(status === 'success' || status === 'error') && feedback && (
              <p
                role="status"
                style={{
                  marginTop: 14,
                  fontSize: 14,
                  color: status === 'success' ? theme.colors.accent : '#ef4444',
                }}
              >
                {feedback}
              </p>
            )}
            <p style={{ marginTop: 18, color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
              No credit card · 30 minutes · Your club's own data · We'll confirm your slot within 1 business day.
            </p>
            <p style={{ marginTop: 10, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              Or email us at{' '}
              <a href="mailto:demo@swoopgolf.com" style={{ color: theme.colors.accent, textDecoration: 'underline' }}>
                demo@swoopgolf.com
              </a>
              {' · '}
              <a href="tel:+14802259702" style={{ color: theme.colors.accent, textDecoration: 'underline' }}>
                (480) 225-9702
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
