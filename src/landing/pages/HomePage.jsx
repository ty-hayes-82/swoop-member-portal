import LandingShell from '@/landing/LandingShell';
import HeroSection from '@/landing/components/HeroSection';
import ProblemSection from '@/landing/components/ProblemSection';
import { theme } from '@/config/theme';
import { coreCapabilities } from '@/landing/data';
import { SectionShell, Card, IconBadge, Button } from '@/landing/ui';

const toDemoPage = () => { window.location.hash = '#/contact'; };
const toPlatform = () => { window.location.hash = '#/platform'; };

const iconMap = {
  Users: 'Users', Calendar: 'Calendar', Utensils: 'Utensils',
  UsersRound: 'UsersRound', DollarSign: 'DollarSign', Send: 'Send', Mail: 'Mail',
};

function CapabilitiesTeaser() {
  const first3 = coreCapabilities.slice(0, 3);
  return (
    <SectionShell band="cream" eyebrow="THE PLATFORM" title="Six jobs Swoop does before your GM finishes coffee.">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          marginBottom: 28,
        }}
      >
        {first3.map((capability) => (
          <Card key={capability.title} interactive>
            <IconBadge name={iconMap[capability.icon] || 'Circle'} tone="neutral" />
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '8px 0 4px', color: theme.neutrals.ink }}>
              {capability.title}
            </h3>
            <p style={{ fontSize: 13, color: theme.colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
              {capability.summary}
            </p>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: theme.colors.textMuted, margin: '12px 0 0' }}>
              READS FROM: {capability.source}
            </p>
          </Card>
        ))}
      </div>
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={toPlatform}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, color: theme.colors.accent,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          See all six capabilities <span style={{ fontSize: 16 }}>›</span>
        </button>
      </div>
    </SectionShell>
  );
}

function HomeCtaStrip() {
  return (
    <SectionShell band="sand">
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
              fontFamily: theme.fonts.serif,
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
          <Button variant="light" size="md" onClick={toPlatform}>
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
      <ProblemSection />
      <CapabilitiesTeaser />
      <HomeCtaStrip />
    </LandingShell>
  );
}
