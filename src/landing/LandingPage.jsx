import { theme } from '@/config/theme';
import HeroSection from '@/landing/components/HeroSection';
import TrustStrip from '@/landing/components/TrustStrip';
import ProblemSection from '@/landing/components/ProblemSection';
import InlineCta from '@/landing/components/InlineCta';
import LensesSection from '@/landing/components/LensesSection';
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
  '--landing-sticky-bg': `${theme.colors.bgSidebar}F2`,
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
        <TrustStrip />
        <ProblemSection />
        <InlineCta />
        <LensesSection />
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
      <div className="landing-sticky-cta">
        <a
          href="#demo-form"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 20px',
            borderRadius: theme.radius.md,
            background: theme.colors.ctaGreen,
            color: theme.colors.ctaGreenText,
            fontWeight: 700,
            textDecoration: 'none',
            minWidth: 180,
          }}
        >
          Book a Demo
        </a>
      </div>
    </div>
  );
}
