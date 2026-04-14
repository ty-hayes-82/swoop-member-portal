import LandingShell from '@/landing/LandingShell';
import HeroSection from '@/landing/components/HeroSection';
import SeeItFixItProveItSection from '@/landing/components/SeeItFixItProveItSection';
import AgentRevealSection from '@/landing/components/AgentRevealSection';
import MemberExperienceSection from '@/landing/components/MemberExperienceSection';
import IntegrationsSection from '@/landing/components/IntegrationsSection';
import PricingSection from '@/landing/components/PricingSection';
import AgentsLiveDemo from '@/landing/components/AgentsLiveDemo';
import { theme } from '@/config/theme';
import { SectionShell, Button } from '@/landing/ui';

const toDemoPage = () => { window.location.hash = '#/contact'; };

function MorningBriefingSection() {
  return (
    <SectionShell
      id="morning-brief"
      band="cream"
      eyebrow="THE MORNING BRIEF"
      title="What your GM sees at 6:15 AM."
      subtitle="Every signal from every system — assembled overnight and delivered before the first tee time. Watch it build in real time."
    >
      <AgentsLiveDemo />
    </SectionShell>
  );
}

function HomeCtaStrip() {
  return (
    <SectionShell band="dark" size="sm">
      <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        <h2
          style={{
            fontFamily: theme.fonts.serif,
            fontSize: 'clamp(26px, 3.5vw, 40px)',
            fontWeight: 800,
            color: '#FFFFFF',
            margin: '0 0 12px',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          See what your club misses today.
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, margin: '0 0 36px', lineHeight: 1.6 }}>
          30 minutes. Your real questions. We'll show you exactly what Swoop surfaces for a club like yours.
        </p>

        {/* Primary CTA */}
        <div style={{ marginBottom: 16 }}>
          <Button
            size="lg"
            onClick={toDemoPage}
            style={{ background: theme.colors.accent, color: '#FFFFFF', border: 'none' }}
          >
            See your club's data connected →
          </Button>
        </div>

        {/* Secondary + Tertiary */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
          <button
            onClick={toDemoPage}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,0.55)', padding: 0 }}
          >
            Talk to a GM who's using it →
          </button>
          <button
            onClick={toDemoPage}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,0.55)', padding: 0 }}
          >
            Get a sample morning briefing →
          </button>
        </div>
      </div>
    </SectionShell>
  );
}

export default function HomePage() {
  return (
    <LandingShell>
      <HeroSection onDemoClick={toDemoPage} />
      <SeeItFixItProveItSection />
      <div className="hidden-mobile-section"><AgentRevealSection /></div>
      <MorningBriefingSection />
      <div className="hidden-mobile-section"><MemberExperienceSection /></div>
      <IntegrationsSection />
      <PricingSection onCtaClick={toDemoPage} />
      <HomeCtaStrip />
    </LandingShell>
  );
}
