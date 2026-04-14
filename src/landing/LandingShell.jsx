import { useEffect } from 'react';
import { theme } from '@/config/theme';
import LandingNav from '@/landing/components/LandingNav';
import LandingFooter from '@/landing/components/LandingFooter';
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
      <main>{children}</main>
      <LandingFooter />
    </div>
  );
}
