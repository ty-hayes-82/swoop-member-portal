import { theme } from '@/config/theme';

const footerLinks = [
  { label: 'Platform', href: '#/platform' },
  { label: 'Pricing',  href: '#/pricing' },
  { label: 'About',    href: '#/about' },
  { label: 'Contact',  href: '#/contact' },
];

export default function LandingFooter() {
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
          alignItems: 'flex-start',
          gap: 32,
        }}
      >
        {/* Brand */}
        <div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 20,
              color: theme.neutrals.ink,
              letterSpacing: '-0.03em',
              marginBottom: 6,
              cursor: 'pointer',
            }}
            onClick={() => { window.location.hash = '#/landing'; }}
          >
            swoop<span style={{ color: theme.colors.accent }}>.</span>
          </div>
          <p style={{ color: theme.colors.textMuted, fontSize: 13, margin: '0 0 4px' }}>
            Member retention software for private clubs.
          </p>
          <p style={{ color: theme.colors.textMuted, fontSize: 12, margin: 0 }}>
            demo@swoopgolf.com
          </p>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          {footerLinks.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              style={{ color: theme.colors.textSecondary, fontSize: 14, textDecoration: 'none', fontWeight: 500 }}
            >
              {label}
            </a>
          ))}
          <a
            href="#/contact"
            style={{ color: theme.colors.accent, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}
          >
            Book a Demo
          </a>
        </div>

        {/* Legal */}
        <div style={{ width: '100%', borderTop: '1px solid rgba(17,17,17,0.06)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>
            © {new Date().getFullYear()} Swoop Golf, Inc. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: 20 }}>
            <a href="#/contact" style={{ color: theme.colors.textMuted, fontSize: 12, textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#/contact" style={{ color: theme.colors.textMuted, fontSize: 12, textDecoration: 'none' }}>Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
