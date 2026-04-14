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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onHashChange = () => { setActiveHash(window.location.hash); setMenuOpen(false); };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const linkStyle = (isActive) => ({
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 14, fontWeight: isActive ? 700 : 600,
    color: isActive ? theme.colors.accent : theme.colors.textSecondary,
    padding: 0, fontFamily: 'inherit', textDecoration: 'none',
    transition: 'color 150ms',
  });

  return (
    <>
      <nav
        className="landing-nav"
        style={{
          position: 'sticky', top: 0, zIndex: 200,
          background: 'rgba(250,247,242,0.96)',
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          borderBottom: scrolled ? '1px solid rgba(17,17,17,0.10)' : '1px solid rgba(17,17,17,0.06)',
          boxShadow: scrolled ? '0 2px 16px rgba(17,17,17,0.06)' : 'none',
          transition: 'border-color 220ms, box-shadow 220ms',
        }}
      >
        <div
          className="landing-container"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px clamp(20px, 4vw, 40px)' }}
        >
          {/* Logo */}
          <span
            style={{ fontWeight: 800, fontSize: 22, color: theme.neutrals.ink, letterSpacing: '-0.03em', cursor: 'pointer', display: 'inline-flex', alignItems: 'baseline', gap: 2 }}
            onClick={() => { window.location.hash = '#/landing'; }}
          >
            swoop<span style={{ color: theme.colors.accent }}>.</span>
          </span>

          {/* Desktop nav */}
          <div className="landing-nav-links landing-nav-desktop" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            {NAV_LINKS.map(({ label, href }) => (
              <a key={href} href={href} style={linkStyle(activeHash === href)}>{label}</a>
            ))}
            <Button size="md" onClick={() => { window.location.hash = '#/contact'; }}>Book a Demo</Button>
          </div>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            className="landing-nav-hamburger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen(o => !o)}
            style={{
              display: 'none', background: 'none', border: 'none',
              cursor: 'pointer', padding: 4, color: theme.neutrals.ink,
            }}
          >
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div style={{
            borderTop: '1px solid rgba(17,17,17,0.08)',
            background: 'rgba(250,247,242,0.98)',
            padding: '16px clamp(20px, 4vw, 40px) 24px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            {NAV_LINKS.map(({ label, href }) => (
              <a key={href} href={href} style={{ ...linkStyle(activeHash === href), fontSize: 16 }}>{label}</a>
            ))}
            <div style={{ marginTop: 4 }}>
              <Button size="md" onClick={() => { window.location.hash = '#/contact'; setMenuOpen(false); }}>
                Book a Demo
              </Button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
