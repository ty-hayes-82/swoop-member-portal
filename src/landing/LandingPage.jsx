import { useState, useEffect } from 'react';
import { theme } from '@/config/theme';
import HeroSection from '@/landing/components/HeroSection';
import ProblemSection from '@/landing/components/ProblemSection';
import InlineCta from '@/landing/components/InlineCta';
import CoreCapabilitiesSection from '@/landing/components/CoreCapabilitiesSection';
import ComparisonSection from '@/landing/components/ComparisonSection';
import AgentsSection from '@/landing/components/AgentsSection';
import IntegrationsSection from '@/landing/components/IntegrationsSection';
import PricingSection from '@/landing/components/PricingSection';
import RoiCalculatorSection from '@/landing/components/RoiCalculatorSection';
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
  padding: '0 clamp(16px, 4vw, 32px)',
  boxSizing: 'border-box',
};

const fullWidth = {
  width: '100%',
  margin: '0 auto',
  padding: '0 clamp(16px, 4vw, 32px)',
  boxSizing: 'border-box',
};

const NAV_LINKS = [
  { label: 'Platform', target: 'platform' },
  { label: 'Agents', target: 'agents' },
  { label: 'Pricing', target: 'pricing' },
  { label: 'Demo', target: 'demo-form' },
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px clamp(16px, 4vw, 32px)',
        background: scrolled ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid #e4e4e7' : '1px solid transparent',
        transition: 'background 200ms, border-color 200ms',
        maxWidth: 1180,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Logo */}
      <span
        style={{
          fontWeight: 800,
          fontSize: '1.4rem',
          color: '#0F0F0F',
          letterSpacing: '-0.02em',
          cursor: 'pointer',
        }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        swoop.
      </span>

      {/* Nav links */}
      <div className="landing-nav-links" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
        {NAV_LINKS.map(({ label, target }) => (
          <button
            key={target}
            onClick={() => scrollToSection(target)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: '#3F3F46',
              padding: 0,
              fontFamily: 'inherit',
            }}
          >
            {label}
          </button>
        ))}

        {/* Book a Demo CTA */}
        <button
          onClick={() => scrollToSection('demo-form')}
          style={{
            background: '#F3922D',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 20px',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          Book a Demo
        </button>
      </div>
    </nav>
  );
}

export default function LandingPage() {
  return (
    <div className="landing-page" style={pageWrap}>
      <LandingNav />
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
        <RoiCalculatorSection />
        <SocialProofSection />
        <FaqSection />
      </main>
      <div style={fullWidth}>
        <div style={{ ...container, maxWidth: 1300 }}>
          <DemoCtaSection />
        </div>
      </div>
      {/* Footer with investor link */}
      <footer style={{
        borderTop: '1px solid #e4e4e7',
        padding: '32px clamp(16px, 4vw, 32px)',
        textAlign: 'center',
        color: '#6B7280',
        fontSize: '0.85rem',
        maxWidth: 1180,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <div style={{ marginBottom: 8 }}>
          Swoop Golf &middot; Integrated Intelligence for Private Clubs
        </div>
        <a
          href="#/invest"
          style={{
            color: '#F3922D',
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: '0.85rem',
          }}
        >
          Investor Information
        </a>
      </footer>
    </div>
  );
}
