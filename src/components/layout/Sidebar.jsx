// Sidebar — dark sidebar, light body. Classic club aesthetic.
import { useNavigation } from '@/context/NavigationContext.jsx';
import { useApp } from '@/context/AppContext.jsx';
import { NAV_ITEMS } from '@/config/navigation.js';
import { theme } from '@/config/theme.js';

const SIDEBAR_BG    = '#1F2F24';
const SIDEBAR_CARD  = '#263B2C';
const SIDEBAR_HOVER = '#2E4835';
const SIDEBAR_BORDER= '#375040';
const TEXT_LIGHT    = '#F0F0F0';
const TEXT_DIM      = 'rgba(255,255,255,0.42)';
const TEXT_MUTED    = 'rgba(255,255,255,0.28)';

const TODAY_ITEMS = ['daily-briefing', 'operations', 'member-health', 'staffing-service'];

export default function Sidebar() {
  const { currentRoute, navigate, sidebarCollapsed, toggleSidebar, viewMode, setViewMode } = useNavigation();
  const { activeCount, totalRevenueImpact } = useApp();
  const w = sidebarCollapsed ? '52px' : '240px';

  const ALWAYS_VISIBLE = ['agent-command', 'demo-mode', 'integrations'];
  const visibleItems = viewMode === 'today'
    ? NAV_ITEMS.filter(n => TODAY_ITEMS.includes(n.key) || ALWAYS_VISIBLE.includes(n.key))
    : NAV_ITEMS;

  return (
    <aside style={{
      width: w, height: '100vh',
      background: SIDEBAR_BG,
      borderRight: `1px solid ${SIDEBAR_BORDER}`,
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.2s ease',
      overflow: 'hidden', flexShrink: 0,
      position: 'fixed', top: 0, left: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{
        padding: sidebarCollapsed ? '16px 0' : '20px 18px',
        borderBottom: `1px solid ${SIDEBAR_BORDER}`,
        display: 'flex', alignItems: 'center', gap: '10px',
        minHeight: '60px', justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '6px', flexShrink: 0,
          background: `linear-gradient(135deg, ${theme.colors.accent}, #1A7A3C)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px',
        }}>S</div>
        {!sidebarCollapsed && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT_LIGHT, letterSpacing: '0.08em' }}>SWOOP</div>
            <div style={{ fontSize: '10px', color: TEXT_MUTED, letterSpacing: '0.04em' }}>Club Intelligence</div>
          </div>
        )}
      </div>

      {/* Today / Deep Dive toggle */}
      {!sidebarCollapsed && (
        <div style={{ margin: '12px', display: 'flex', borderRadius: '8px', background: '#0F1F14', padding: '2px' }}>
          {[['today', 'Today'], ['deep-dive', 'Deep Dive']].map(([mode, label]) => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              flex: 1, padding: '6px 0', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
              letterSpacing: '0.04em', cursor: 'pointer', border: 'none',
              background: viewMode === mode ? theme.colors.accent : 'transparent',
              color: viewMode === mode ? '#fff' : TEXT_MUTED,
              transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>
      )}

      {/* Revenue impact */}
      {!sidebarCollapsed && activeCount > 0 && (
        <div style={{ margin: '0 12px 8px', padding: '10px 12px', background: '#1A3A22', border: `1px solid #2A5A32`, borderRadius: '8px' }}>
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
              title={sidebarCollapsed ? item.label : undefined}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: sidebarCollapsed ? '10px 0' : '9px 14px',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                background: active ? SIDEBAR_HOVER : 'none',
                borderLeft: active ? `3px solid ${item.color}` : '3px solid transparent',
                color: active ? TEXT_LIGHT : TEXT_DIM,
                fontSize: '13px', fontWeight: active ? 600 : 400,
                transition: 'all 0.12s', cursor: 'pointer',
                borderRight: 'none', borderTop: 'none', borderBottom: 'none',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#0F1F14'; e.currentTarget.style.color = TEXT_LIGHT; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = TEXT_DIM; } }}
            >
              <span style={{ fontSize: '14px', flexShrink: 0, opacity: active ? 1 : 0.6 }}>{item.icon}</span>
              {!sidebarCollapsed && (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Demo Environment badge */}
      {!sidebarCollapsed && (
        <div style={{ margin: '0 12px 8px', padding: '7px 10px', background: '#0F1F14',
          border: `1px solid ${SIDEBAR_BORDER}`, borderRadius: '6px',
          display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.colors.accent, opacity: 0.6, flexShrink: 0 }} />
          <span style={{ fontSize: '10px', color: TEXT_MUTED, letterSpacing: '0.04em' }}>
            Demo Environment · Oakmont Hills CC
          </span>
        </div>
      )}

      {/* Toggle */}
      <div style={{ borderTop: `1px solid ${SIDEBAR_BORDER}`, padding: '12px', display: 'flex', justifyContent: sidebarCollapsed ? 'center' : 'flex-end' }}>
        <button onClick={toggleSidebar} style={{
          width: 28, height: 28, borderRadius: '6px',
          background: SIDEBAR_CARD, border: `1px solid ${SIDEBAR_BORDER}`,
          color: TEXT_MUTED, fontSize: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          {sidebarCollapsed ? '›' : '‹'}
        </button>
      </div>
    </aside>
  );
}
