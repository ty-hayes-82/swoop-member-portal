// Header — light bar above the main content
import { useNavigation } from '@/context/NavigationContext.jsx';
import { NAV_ITEMS } from '@/config/navigation.js';
import { CLUB_NAME, DEMO_MONTH } from '@/config/constants.js';
import { theme } from '@/config/theme';

// Greeting changes by time of day (simulated — based on 7am for demo morning mode)
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function Header({ onMobileMenuToggle }) {
  const { currentRoute, toggleSidebar } = useNavigation();
  const page = NAV_ITEMS.find(n => n.key === currentRoute) || NAV_ITEMS[0];
  const handleMenuClick = onMobileMenuToggle || toggleSidebar;

  return (
    <header style={{
      height: '60px', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: '16px',
      background: 'var(--bg-card)', flexShrink: 0,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <button onClick={handleMenuClick} style={{
        minWidth: '44px', minHeight: '44px', borderRadius: '6px',
        background: 'var(--bg-deep)', border: '1px solid var(--border)',
        color: 'var(--text-muted)', fontSize: '16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
      }}>☰</button>

      {/* Accent line */}
      <div style={{ width: 3, height: 28, borderRadius: 2, background: page.color, flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1 }}>
          {page.label}
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1, marginTop: '2px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {page.subtitle}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {getGreeting()} — {CLUB_NAME} · {DEMO_MONTH}
        </span>
        {/* Data freshness indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px',
          padding: '3px 10px', borderRadius: '12px',
          background: `${theme.colors.accent}12`, border: `1px solid ${theme.colors.accent}30` }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: theme.colors.accent,
            animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '10px', color: theme.colors.accent, fontWeight: 600, letterSpacing: '0.04em' }}>LIVE</span>
          <span style={{ fontSize: '10px', color: theme.colors.textMuted }}>· Demo data: Jan 17, 2026 7:00 AM</span>
        </div>
      </div>
    </header>
  );
}
