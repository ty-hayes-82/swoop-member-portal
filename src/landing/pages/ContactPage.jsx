import { theme } from '@/config/theme';
import LandingShell from '@/landing/LandingShell';
import DemoCtaSection from '@/landing/components/DemoCtaSection';

const leaveWithItems = [
  'A ranked list of your top 5 revenue and retention gaps',
  'Benchmarks vs. the 7 founding-partner clubs (anonymized, your club not identified)',
  'A draft 90-day action plan — yours to keep, no strings attached',
  'Your data under mutual NDA. We never share club data across pilots. Deleted within 30 days if you don\u2019t move forward.',
];

function ContactHeroPanel() {
  return (
    <section
      className="landing-section-sm"
      style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(17,17,17,0.07)' }}
    >
      <div className="landing-container" style={{ maxWidth: 720 }}>
        <p
          style={{
            fontSize: 'clamp(17px, 1.6vw, 20px)',
            lineHeight: 1.6,
            color: theme.colors.textSecondary,
            margin: '0 0 28px',
          }}
        >
          In 30 minutes, we load your tee-sheet data into Swoop and show you exactly where revenue is
          leaking and which members are quietly disengaging. You leave with a prioritized action list
          — not a pitch deck.
        </p>
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: theme.colors.accent,
            margin: '0 0 14px',
          }}
        >
          What you'll leave with
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {leaveWithItems.map((item) => (
            <li
              key={item}
              style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 15, color: theme.neutrals.ink, lineHeight: 1.5 }}
            >
              <span style={{ color: theme.colors.accent, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function TechDisclosurePanel() {
  return (
    <section className="landing-section-sm" style={{ background: '#FFFFFF', borderTop: '1px solid rgba(17,17,17,0.07)' }}>
      <div className="landing-container" style={{ maxWidth: 640 }}>
        <details style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: '16px 20px', maxWidth: 640, marginInline: 'auto' }}>
          <summary style={{ fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>Data handling &amp; security details</summary>
          <div style={{ marginTop: 16, fontSize: 14, lineHeight: 1.8 }}>
            <p><strong>Your data stays yours.</strong> Mutual NDA on every pilot. We are a data processor, not a controller.</p>
            <p><strong>Systems we read from:</strong> Jonas, Club Essentials, Northstar, ClubReady, Lightspeed, foreUP, Club Prophet, Stripe.</p>
            <p><strong>Write-back scope:</strong> Only tee-sheet notes, CRM tasks, and GM-approved messages. We never modify financial records.</p>
            <p><strong>Security:</strong> AES-256 at rest, TLS 1.3 in transit, RBAC, 90-day audit log. SOC 2 Type II in progress (Q3 2026).</p>
            <p><strong>AI:</strong> Anthropic Claude API with zero-retention agreement. Member PII never trains any model. Every action is logged and reversible.</p>
            <p><strong>Cancellation:</strong> Data export within 5 business days. All club data deleted within 30 days on request.</p>
          </div>
        </details>
      </div>
    </section>
  );
}

export default function ContactPage() {
  return (
    <LandingShell>
      <ContactHeroPanel />
      <DemoCtaSection />
      <TechDisclosurePanel />
    </LandingShell>
  );
}
