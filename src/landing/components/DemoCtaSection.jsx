import { useState } from 'react';
import { theme } from '@/config/theme';
import { Button, Input } from '@/landing/ui';
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
              6 founding-club slots. You get a named engineer for 90 days and a vote on next quarter&apos;s build list.
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
                <Input tone="dark" name="name" label="Name" type="text" autoComplete="name" required style={{ fontSize: 16, minHeight: 48 }} />
                <Input tone="dark" name="club" label="Club" type="text" autoComplete="organization" placeholder="e.g., Pine Valley Golf Club" required style={{ fontSize: 16, minHeight: 48 }} />
              </div>
              <Input tone="dark" name="email" type="email" inputMode="email" label="Email" autoComplete="email" required style={{ fontSize: 16, minHeight: 48 }} />
              <Input
                tone="dark"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                style={{ fontSize: 16, minHeight: 48 }}
                label={<>Phone <span style={{ color: '#888', fontWeight: 400 }}>(optional — we won&apos;t call unless you ask)</span></>}
              />
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>
                  Club size (optional)
                </label>
                <select name="clubSize" style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 16 }}>
                  <option value="">Select club size</option>
                  <option>Under 200 members</option>
                  <option>200–400 members</option>
                  <option>400–700 members</option>
                  <option>700+ members</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>
                  Your role (optional)
                </label>
                <select name="role" style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 16 }}>
                  <option value="">Select your role</option>
                  <option>General Manager</option>
                  <option>Assistant GM / AGM</option>
                  <option>Director of Operations</option>
                  <option>F&amp;B Director</option>
                  <option>Board member</option>
                  <option>Other</option>
                </select>
              </div>
              <Button
                type="submit"
                size="lg"
                block
                disabled={status === 'submitting'}
                style={{ marginTop: 6, opacity: status === 'submitting' ? 0.7 : 1, cursor: status === 'submitting' ? 'wait' : 'pointer' }}
              >
                {status === 'submitting' ? 'Submitting…' : 'Show me my club\'s leaks'}
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
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 12, textAlign: 'center' }}>
              Tyler Hayes (co-founder) personally replies to every form within one business day.
            </p>
            <div style={{ marginTop: 32, padding: 20, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}>
              <p style={{ fontSize: 15, fontStyle: 'italic', lineHeight: 1.65, margin: 0 }}>
                &ldquo;Swoop found $47k in lapsed dues in week one.&rdquo;
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>
                General Manager &middot; Top-100 private club &middot; Southwest
              </p>
            </div>
            <div style={{ marginTop: 24, padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: 8, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
              <strong style={{ fontSize: 14 }}>What happens next:</strong>
              <ol style={{ margin: '8px 0 0 20px', lineHeight: 2 }}>
                <li>Tyler (co-founder) replies within 1 business day</li>
                <li>We pull a sample brief from your tee sheet and POS</li>
                <li>30-min call — you keep the action list regardless</li>
              </ol>
            </div>
            <p style={{ marginTop: 18, color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
              No credit card · 30 minutes · Your club's own data · We'll confirm your slot within 1 business day.
            </p>
            <p style={{ marginTop: 10, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              Or email us at{' '}
              <a href="mailto:demo@swoopgolf.com" style={{ color: theme.colors.accent, textDecoration: 'underline' }}>
                demo@swoopgolf.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
