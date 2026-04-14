import { theme } from '@/config/theme';

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
            href="#/contact"
            style={{ color: theme.colors.accent, fontWeight: 700, textDecoration: 'none' }}
          >
            Book a Demo
          </a>
          <span style={{ color: theme.colors.textMuted }}>
            © {new Date().getFullYear()} Swoop Golf
          </span>
        </div>
      </div>
    </footer>
  );
}
