import { useState, useEffect } from 'react';
import { theme } from '@/config/theme';
import { Button } from '@/landing/ui';

const NAV_LINKS = [
  { label: 'Home',     href: '#/landing' },
  { label: 'Platform', href: '#/platform' },
  { label: 'Pricing',  href: '#/pricing' },
  { label: 'About',    href: '#/about' },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [activeHash, setActiveHash] = useState(window.location.hash);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onHashChange = () => setActiveHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
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
          onClick={() => { window.location.hash = '#/landing'; }}
        >
          swoop<span style={{ color: theme.colors.accent }}>.</span>
        </span>

        <div className="landing-nav-links" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = activeHash === href;
            return (
              <a
                key={href}
                href={href}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? theme.colors.accent : theme.colors.textSecondary,
                  padding: 0,
                  fontFamily: 'inherit',
                  textDecoration: 'none',
                  transition: 'color 150ms',
                }}
              >
                {label}
              </a>
            );
          })}
          <Button size="md" onClick={() => { window.location.hash = '#/contact'; }}>
            Book a Demo
          </Button>
        </div>
      </div>
    </nav>
  );
}
