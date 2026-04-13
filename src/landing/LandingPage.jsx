import { useState, useEffect } from 'react';
import { theme } from '@/config/theme';
import HeroSection from '@/landing/components/HeroSection';
import TrustStrip from '@/landing/components/TrustStrip';
import ProblemSection from '@/landing/components/ProblemSection';
import CoreCapabilitiesSection from '@/landing/components/CoreCapabilitiesSection';
import ComparisonSection from '@/landing/components/ComparisonSection';
import AgentsSection from '@/landing/components/AgentsSection';
import IntegrationsSection from '@/landing/components/IntegrationsSection';
import PricingSection from '@/landing/components/PricingSection';
import RoiCalculatorSection from '@/landing/components/RoiCalculatorSection';
import SocialProofSection from '@/landing/components/SocialProofSection';
import TestimonialsSection from '@/landing/components/TestimonialsSection';
import PhotoBand from '@/landing/components/PhotoBand';
import FaqSection from '@/landing/components/FaqSection';
import DemoCtaSection from '@/landing/components/DemoCtaSection';
import { Button } from '@/landing/ui';
import '@/landing/landing.css';

const NAV_LINKS = [
  { label: 'Platform', target: 'platform' },
  { label: 'Agents', target: 'agents' },
  { label: 'Pricing', target: 'pricing' },
];

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className="landing-nav"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 200,
        background: scrolled ? 'rgba(250,247,242,0.85)' : 'rgba(250,247,242,0)',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(17,17,17,0.08)' : '1px solid transparent',
        transition: 'background 220ms, border-color 220ms',
      }}
    >
      <div
        className="landing-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px clamp(20px, 4vw, 40px)',
        }}
      >
        <span
          style={{
            fontWeight: 800,
            fontSize: 22,
            color: theme.neutrals.ink,
            letterSpacing: '-0.03em',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 2,
          }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          swoop<span style={{ color: theme.colors.accent }}>.</span>
        </span>

        <div className="landing-nav-links" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {NAV_LINKS.map(({ label, target }) => (
            <button
              key={target}
              onClick={() => scrollToSection(target)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                color: theme.colors.textSecondary,
                padding: 0,
                fontFamily: 'inherit',
              }}
            >
              {label}
            </button>
          ))}
          <Button size="md" onClick={() => scrollToSection('demo-form')}>
            Book a Demo
          </Button>
        </div>
      </div>
    </nav>
  );
}

function LandingFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(17,17,17,0.08)',
        background: theme.neutrals.paper,
        padding: '48px 0 40px',
      }}
    >
      <div
        className="landing-container"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 20,
              color: theme.neutrals.ink,
              letterSpacing: '-0.03em',
              marginBottom: 6,
            }}
          >
            swoop<span style={{ color: theme.colors.accent }}>.</span>
          </div>
          <p style={{ color: theme.colors.textMuted, fontSize: 13, margin: 0 }}>
            Integrated Intelligence for Private Clubs
          </p>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', fontSize: 13 }}>
          <a
            href="#/invest"
            style={{ color: theme.colors.accent, fontWeight: 700, textDecoration: 'none' }}
          >
            Investor Information
          </a>
          <span style={{ color: theme.colors.textMuted }}>
            © {new Date().getFullYear()} Swoop Golf
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div
      className="landing-page"
      style={{
        color: theme.neutrals.ink,
        fontFamily: theme.fonts.sans,
      }}
    >
      <LandingNav />
      <main>
        <HeroSection />
        <TrustStrip />
        <ProblemSection />
        <CoreCapabilitiesSection />
        <ComparisonSection />
        <AgentsSection />
        <PhotoBand
          photoKey="fairwayGreen"
          kicker="One operating view"
          headline="Every signal. Every system. One clubhouse of intelligence."
        />
        <IntegrationsSection />
        <PricingSection />
        <RoiCalculatorSection />
        <SocialProofSection />
        <TestimonialsSection />
        <FaqSection />
        <DemoCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
