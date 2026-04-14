import { useState, useEffect } from 'react';
import { theme } from '@/config/theme';
import LandingNav from '@/landing/components/LandingNav';
import LandingFooter from '@/landing/components/LandingFooter';
import '@/landing/landing.css';

function StickyMobileCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
        @media (min-width: 769px) {
          .landing-mobile-bottom-cta { display: none !important; }
        }
      `}</style>
      <a
        href="#/contact"
        className="landing-mobile-bottom-cta"
        style={{
          display: visible ? 'flex' : 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          background: '#F3922D',
          color: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 16,
          textDecoration: 'none',
          zIndex: 300,
          letterSpacing: '-0.01em',
        }}
      >
        Book a 30-Minute Demo →
      </a>
    </>
  );
}

export default function LandingShell({ children }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div
      className="landing-page"
      style={{
        color: theme.neutrals.ink,
        fontFamily: theme.fonts.sans,
      }}
    >
      <LandingNav />
      <main>{children}</main>
      <LandingFooter />
      <StickyMobileCta />
    </div>
  );
}
