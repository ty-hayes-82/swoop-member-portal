import { theme } from '@/config/theme';
import LandingShell from '@/landing/LandingShell';
import HeroSection from '@/landing/components/HeroSection';
import TrustStrip from '@/landing/components/TrustStrip';
import ProblemSection from '@/landing/components/ProblemSection';
import { coreCapabilities } from '@/landing/data';
import { SectionShell, Card, Icon, Button } from '@/landing/ui';

const toDemoPage = () => { window.location.hash = '#/contact'; };

function CapabilitiesTeaser() {
  const preview = coreCapabilities.slice(0, 3);
  return (
    <SectionShell
      band="paper"
      eyebrow="Platform"
      title="Built for how clubs actually operate."
      subtitle="Five intelligence lenses — unified from your existing systems."
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
          marginBottom: 40,
        }}
      >
        {preview.map((cap) => (
          <Card key={cap.title} interactive style={{ gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: cap.color + '1a',
                  flexShrink: 0,
                }}
              >
                <Icon name={cap.icon} size={20} color={cap.color} />
              </span>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: theme.neutrals.ink }}>
                {cap.title}
              </h3>
            </div>
            <p style={{ fontSize: 14, color: theme.colors.textSecondary, lineHeight: 1.6, margin: 0 }}>
              {cap.summary}
            </p>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                fontFamily: theme.fonts.mono,
                color: cap.color,
                lineHeight: 1,
              }}
            >
              {cap.metric.value}
              <span style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textMuted, marginLeft: 6 }}>
                {cap.metric.label}
              </span>
            </div>
          </Card>
        ))}
      </div>
      <div style={{ textAlign: 'center' }}>
        <a
          href="#/platform"
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: theme.colors.accent,
            textDecoration: 'none',
          }}
        >
          See the full platform →
        </a>
      </div>
    </SectionShell>
  );
}

function TestimonialPullQuote() {
  return (
    <SectionShell band="sand" eyebrow="In their words" title="Built with the GMs who live it.">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Card style={{ padding: 40, gap: 20 }}>
          <span className="landing-quote-mark" aria-hidden="true">&ldquo;</span>
          <p
            className="landing-quote-text"
            style={{ fontSize: 'clamp(20px, 2vw, 26px)', marginTop: -12 }}
          >
            Swoop called out a member we were about to lose six days before we would have spotted
            it ourselves. Saved a 22-year family membership.
          </p>
          <div
            style={{
              paddingTop: 18,
              borderTop: '1px solid rgba(17,17,17,0.08)',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: theme.colors.accent,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 4,
              }}
            >
              Member Retention
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>
              GM, 300-member private club · founding partner (pending)
            </div>
          </div>
        </Card>
      </div>
    </SectionShell>
  );
}

function MiniCta() {
  return (
    <SectionShell band="cream">
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <h2
          style={{
            fontSize: 'clamp(28px, 3.5vw, 42px)',
            fontWeight: 700,
            color: theme.neutrals.ink,
            margin: '0 0 16px',
            letterSpacing: '-0.02em',
          }}
        >
          Ready to see your club's intelligence?
        </h2>
        <p style={{ color: theme.colors.textSecondary, fontSize: 17, margin: '0 0 32px' }}>
          30-minute walkthrough. No commitment. Live with your data in 2 weeks.
        </p>
        <Button size="lg" onClick={toDemoPage}>
          Book a 30-Minute Demo
        </Button>
      </div>
    </SectionShell>
  );
}

export default function HomePage() {
  return (
    <LandingShell>
      <HeroSection onDemoClick={toDemoPage} />
      <TrustStrip />
      <ProblemSection />
      <CapabilitiesTeaser />
      <TestimonialPullQuote />
      <MiniCta />
    </LandingShell>
  );
}
