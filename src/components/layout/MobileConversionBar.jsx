import { theme } from '@/config/theme';

const CTA_URL = 'https://swoop-member-intelligence-website.vercel.app/book-demo';

export default function MobileConversionBar() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: theme.colors.bgDeep,
        borderTop: `1px solid ${theme.colors.border}`,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        boxShadow: '0 -10px 30px rgba(0,0,0,0.45)',
      }}
    >
      <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 1.3 }}>
        Ready to see Swoop on your club?
      </div>
      <a
        href={CTA_URL}
        target="_blank"
        rel="noreferrer"
        style={{
          background: theme.colors.accent,
          color: theme.colors.panel,
          borderRadius: 999,
          padding: '10px 18px',
          fontSize: theme.fontSize.sm,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          textDecoration: 'none',
          boxShadow: '0 6px 16px rgba(5,5,5,0.35)',
        }}
      >
        Book a demo
      </a>
    </div>
  );
}
