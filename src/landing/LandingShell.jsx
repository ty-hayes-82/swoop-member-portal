import { useEffect } from 'react';
import { theme } from '@/config/theme';
import LandingNav from '@/landing/components/LandingNav';
import LandingFooter from '@/landing/components/LandingFooter';
import MobileStickyCta from '@/landing/components/MobileStickyCta';
import ErrorBoundary from '@/landing/components/ErrorBoundary';
import '@/landing/landing.css';

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
      <main>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <LandingFooter />
      <MobileStickyCta />
    </div>
  );
}
