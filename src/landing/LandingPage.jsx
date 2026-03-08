import { theme } from '@/config/theme';
import HeroSection from '@/landing/components/HeroSection';
import ProblemSection from '@/landing/components/ProblemSection';
import InlineCta from '@/landing/components/InlineCta';
import CoreCapabilitiesSection from '@/landing/components/CoreCapabilitiesSection';
import ComparisonSection from '@/landing/components/ComparisonSection';
import AgentsSection from '@/landing/components/AgentsSection';
import IntegrationsSection from '@/landing/components/IntegrationsSection';
import PricingSection from '@/landing/components/PricingSection';
import SocialProofSection from '@/landing/components/SocialProofSection';
import FaqSection from '@/landing/components/FaqSection';
import DemoCtaSection from '@/landing/components/DemoCtaSection';
import '@/landing/landing.css';

const pageWrap = {
  background: theme.colors.bg,
  color: theme.colors.textPrimary,
  fontFamily: theme.fonts.sans,
};

const container = {
  width: '100%',
  maxWidth: 1180,
  margin: '0 auto',
  padding: '0 24px',
};

const fullWidth = {
  width: '100vw',
  marginLeft: 'calc(50% - 50vw)',
  marginRight: 'calc(50% - 50vw)',
  padding: '0 24px',
};

export default function LandingPage() {
  return (
    <div className="landing-page" style={pageWrap}>
      <main style={container}>
        <HeroSection />
        <ProblemSection />
        <InlineCta />
        <CoreCapabilitiesSection />
        <InlineCta />
        <ComparisonSection />
        <AgentsSection />
        <IntegrationsSection />
        <PricingSection />
        <SocialProofSection />
        <FaqSection />
      </main>
      <div style={fullWidth}>
        <div style={{ ...container, maxWidth: 1300 }}>
          <DemoCtaSection />
        </div>
      </div>
    </div>
  );
}
