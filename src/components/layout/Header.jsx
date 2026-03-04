import { useNavigation } from '@/context/NavigationContext.jsx';
import { NAV_ITEMS } from '@/config/navigation.js';
import { CLUB_NAME, DEMO_MONTH } from '@/config/constants.js';

export default function Header() {
  const { currentRoute, toggleSidebar } = useNavigation();
  const page = NAV_ITEMS.find(n => n.key === currentRoute) || NAV_ITEMS[0];

  return (
    <header style={{
      height: '60px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: '16px',
      background: '#0A1C12',
      flexShrink: 0,
    }}>
      <button
        onClick={toggleSidebar}
        style={{
          width: 28, height: 28,
          borderRadius: '6px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          fontSize: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        ☰
      </button>

      {/* Accent line */}
      <div style={{ width: 3, height: 28, borderRadius: 2, background: page.color, flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1 }}>
          {page.label}
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {page.subtitle}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          {CLUB_NAME} · {DEMO_MONTH}
        </span>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
      </div>
    </header>
  );
}
