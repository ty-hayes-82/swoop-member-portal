import LandingShell from '@/landing/LandingShell';
import HeroSection from '@/landing/components/HeroSection';
import TrustStrip from '@/landing/components/TrustStrip';
import HowItWorksSection from '@/landing/components/HowItWorksSection';
import { theme } from '@/config/theme';
import { SectionShell, Button } from '@/landing/ui';

const toDemoPage = () => { window.location.hash = '#/contact'; };

function HomeCtaStrip() {
  return (
    <SectionShell band="cream">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24,
          alignItems: 'center',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 'clamp(24px, 3vw, 36px)',
              fontWeight: 700,
              color: theme.neutrals.ink,
              margin: '0 0 10px',
              letterSpacing: '-0.02em',
            }}
          >
            See what your club misses today.
          </h2>
          <p style={{ color: theme.colors.textSecondary, fontSize: 16, margin: 0 }}>
            Explore the platform, see pricing, or book a 30-minute live walkthrough on your data.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Button variant="light" size="md" onClick={() => { window.location.hash = '#/platform'; }}>
            See the Platform
          </Button>
          <Button size="md" onClick={toDemoPage}>
            Book the Walkthrough
          </Button>
        </div>
      </div>
    </SectionShell>
  );
}

export default function HomePage() {
  return (
    <LandingShell>
      <HeroSection onDemoClick={toDemoPage} />
      <TrustStrip />
      <HowItWorksSection />
      <HomeCtaStrip />
    </LandingShell>
  );
}
