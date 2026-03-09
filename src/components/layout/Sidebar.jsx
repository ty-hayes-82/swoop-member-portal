// Sidebar — dark sidebar, light body. Classic club aesthetic.
import { useNavigation } from '@/context/NavigationContext.jsx';
import { useApp } from '@/context/AppContext.jsx';
import { NAV_ITEMS } from '@/config/navigation.js';
import { theme } from '@/config/theme.js';

const SIDEBAR_BG    = theme.colors.bgSidebar;
const SIDEBAR_CARD  = theme.colors.sidebarCard;
const SIDEBAR_HOVER = theme.colors.sidebarHover;
const SIDEBAR_BORDER= theme.colors.sidebarBorder;
const TEXT_LIGHT    = theme.colors.textOnDark;
const TEXT_DIM      = 'rgba(255,255,255,0.42)';
const TEXT_MUTED    = 'rgba(255,255,255,0.28)';

const TODAY_ITEMS = ['daily-briefing', 'operations', 'waitlist-demand', 'member-health', 'staffing-service'];

export default function Sidebar({ isMobile = false, mobileMenuOpen = false }) {
  const { currentRoute, navigate, sidebarCollapsed, toggleSidebar, viewMode, setViewMode } = useNavigation();
  const { activeCount, totalRevenueImpact } = useApp();
  const w = isMobile ? 280 : sidebarCollapsed ? 52 : 240;

  const ALWAYS_VISIBLE = ['agent-command', 'integrations', 'integrations/csv-import'];
  const allVisible = NAV_ITEMS.filter(n => !n.hidden);
  const visibleItems = viewMode === 'today'
    ? allVisible.filter(n => TODAY_ITEMS.includes(n.key) || ALWAYS_VISIBLE.includes(n.key))
    : allVisible;

  const basePosition = isMobile
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-110%)',
        transition: 'transform 0.25s ease',
        boxShadow: mobileMenuOpen ? '0 20px 80px rgba(0,0,0,0.45)' : 'none',
        zIndex: 120,
      }
    : {
        position: 'sticky',
        top: 0,
        zIndex: 10,
      };

  return (
    <aside style={{
      width: w,
      height: '100vh',
      background: SIDEBAR_BG,
      borderRight: `1px solid ${SIDEBAR_BORDER}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      overflow: 'hidden',
      flexShrink: 0,
      ...basePosition,
    }}>
      {/* Logo */}
      <div style={{
        padding: sidebarCollapsed && !isMobile ? '16px 0' : '20px 18px',
        borderBottom: `1px solid ${SIDEBAR_BORDER}`,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minHeight: '60px',
        justifyContent: sidebarCollapsed && !isMobile ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '6px',
          flexShrink: 0,
          background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.operations})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: 800,
          color: theme.colors.white,
          letterSpacing: '-0.5px',
        }}>S</div>
        {(!sidebarCollapsed || isMobile) && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT_LIGHT, letterSpacing: '0.08em' }}>SWOOP</div>
            <div style={{ fontSize: '10px', color: TEXT_MUTED, letterSpacing: '0.04em' }}>Club Intelligence</div>
          </div>
        )}
      </div>

      {/* Today / Deep Dive toggle */}
      {(!sidebarCollapsed || isMobile) && (
        <div style={{ margin: '12px', display: 'flex', borderRadius: '8px', background: theme.colors.sidebarTint, padding: '2px' }}>
          {[['today', 'Today'], ['deep-dive', 'Deep Dive']].map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                flex: 1,
                padding: '10px 0',
                minHeight: '44px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                border: 'none',
                background: viewMode === mode ? theme.colors.accent : 'transparent',
                color: viewMode === mode ? theme.colors.white : TEXT_MUTED,
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Revenue impact */}
      {(!sidebarCollapsed || isMobile) && activeCount > 0 && (
        <div style={{ margin: '0 12px 8px', padding: '10px 12px', background: theme.colors.sidebarAccent, border: `1px solid ${theme.colors.sidebarAccentBorder}`, borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: TEXT_MUTED, letterSpacing: '0.05em', marginBottom: '3px' }}>
            {activeCount} PLAN{activeCount > 1 ? 'S' : ''} ACTIVE
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600, color: theme.colors.accent }}>
            +${(totalRevenueImpact.annual / 1000).toFixed(0)}K/yr
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {visibleItems.map(item => {
          const active = currentRoute === item.key;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              title={sidebarCollapsed && !isMobile ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: sidebarCollapsed && !isMobile ? '15px 0' : '12px 14px',
                minHeight: '44px',
                justifyContent: sidebarCollapsed && !isMobile ? 'center' : 'flex-start',
                background: active ? SIDEBAR_HOVER : 'none',
                borderLeft: active ? `3px solid ${item.color}` : '3px solid transparent',
                color: active ? TEXT_LIGHT : TEXT_DIM,
                fontSize: '13px',
                fontWeight: active ? 600 : 400,
                transition: 'all 0.12s',
                cursor: 'pointer',
                borderRight: 'none',
                borderTop: 'none',
                borderBottom: 'none',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = theme.colors.sidebarTint;
                  e.currentTarget.style.color = TEXT_LIGHT;
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = TEXT_DIM;
                }
              }}
            >
              <span style={{ fontSize: '14px', flexShrink: 0, opacity: active ? 1 : 0.6 }}>{item.icon}</span>
              {(!sidebarCollapsed || isMobile) && (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Demo Environment badge */}
      {(!sidebarCollapsed || isMobile) && (
        <div
          style={{
            margin: '0 12px 8px',
            padding: '7px 10px',
            background: theme.colors.sidebarTint,
            border: `1px solid ${SIDEBAR_BORDER}`,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.colors.accent, opacity: 0.6, flexShrink: 0 }} />
          <span style={{ fontSize: '10px', color: TEXT_MUTED, letterSpacing: '0.04em' }}>
            Demo Environment · Oakmont Hills CC
          </span>
        </div>
      )}

      {/* Toggle */}
      <div style={{ borderTop: `1px solid ${SIDEBAR_BORDER}`, padding: '12px', display: 'flex', justifyContent: sidebarCollapsed && !isMobile ? 'center' : 'flex-end' }}>
        <button
          onClick={toggleSidebar}
          style={{
            minWidth: '44px',
            minHeight: '44px',
            borderRadius: '6px',
            background: SIDEBAR_CARD,
            border: `1px solid ${SIDEBAR_BORDER}`,
            color: TEXT_MUTED,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {sidebarCollapsed ? '›' : '‹'}
        </button>
      </div>
    </aside>
  );
}
