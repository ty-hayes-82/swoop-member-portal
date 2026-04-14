import { theme } from '@/config/theme';

const footerColumns = [
  {
    heading: 'Product',
    links: [
      { label: 'Platform',     href: '#/platform' },
      { label: 'Pricing',      href: '#/pricing' },
      { label: 'Integrations', href: '#/platform' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About',    href: '#/about' },
      { label: 'Contact',  href: '#/contact' },
      { label: 'Careers',  href: '#/contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy',    href: '#/privacy' },
      { label: 'Terms of Service',  href: '#/terms' },
    ],
  },
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
        <div style={{ minWidth: 180 }}>
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

        {/* 3-column link grid */}
        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
          {footerColumns.map((col) => (
            <div key={col.heading}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.colors.textMuted, margin: '0 0 12px' }}>
                {col.heading}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.links.map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    style={{ color: theme.colors.textSecondary, fontSize: 14, textDecoration: 'none', fontWeight: 500, minHeight: 44, display: 'inline-flex', alignItems: 'center' }}
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Security strip */}
        <p style={{ fontSize: 11, color: theme.colors.textMuted, textAlign: 'center', marginTop: 20, borderTop: '1px solid rgba(17,17,17,0.08)', paddingTop: 16, width: '100%' }}>
          Your club&apos;s data stays yours. Mutual NDA on every pilot. AES-256 at rest, TLS 1.3 in transit. SOC 2 Type II in progress (Q3 2026).
        </p>

        {/* Copyright */}
        <div style={{ width: '100%', borderTop: '1px solid rgba(17,17,17,0.06)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>
            © {new Date().getFullYear()} Swoop Golf, Inc. All rights reserved.
          </span>
          <a
            href="#/contact"
            style={{ color: theme.colors.accent, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}
          >
            Book a Demo
          </a>
        </div>
      </div>
    </footer>
  );
}
