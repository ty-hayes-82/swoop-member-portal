import { useNavigation } from '@/context/NavigationContext.jsx';
import { useApp } from '@/context/AppContext.jsx';
import { NAV_ITEMS } from '@/config/navigation.js';

export default function Sidebar() {
  const { currentRoute, navigate, sidebarCollapsed, toggleSidebar } = useNavigation();
  const { activeCount, totalAnnual } = useApp();

  const w = sidebarCollapsed ? '52px' : '230px';

  return (
    <aside style={{
      width: w, minWidth: w, height: '100vh',
      background: '#081410',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.2s ease, min-width 0.2s ease',
      overflow: 'hidden', flexShrink: 0, position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: sidebarCollapsed ? '16px 0' : '20px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        gap: '10px', minHeight: '60px',
        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '6px', flexShrink: 0,
          background: 'linear-gradient(135deg, #4ADE80, #22C55E)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 700, color: '#081410',
        }}>S</div>
        {!sidebarCollapsed && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
              SWOOP
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Five Lenses
            </div>
          </div>
        )}
      </div>

      {/* Revenue impact pill */}
      {!sidebarCollapsed && activeCount > 0 && (
        <div style={{
          margin: '12px 12px 0',
          padding: '10px 12px',
          background: '#4ADE8012',
          border: '1px solid #4ADE8030',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '4px' }}>
            {activeCount} PLAYBOOK{activeCount > 1 ? 'S' : ''} ACTIVE
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600, color: '#4ADE80' }}>
            +${(totalAnnual / 1000).toFixed(0)}K/yr
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {NAV_ITEMS.map(item => {
          const active = currentRoute === item.key;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              title={sidebarCollapsed ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: sidebarCollapsed ? '10px 0' : '10px 14px',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                background: active ? `${item.color}14` : 'none',
                borderLeft: active ? `2px solid ${item.color}` : '2px solid transparent',
                color: active ? item.color : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: active ? 600 : 400,
                transition: 'all 0.15s ease',
                cursor: 'pointer',
                borderRight: 'none', borderTop: 'none', borderBottom: 'none',
              }}
            >
              <span style={{ fontSize: '15px', flexShrink: 0 }}>{item.icon}</span>
              {!sidebarCollapsed && (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Toggle */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px', display: 'flex', justifyContent: sidebarCollapsed ? 'center' : 'flex-end' }}>
        <button
          onClick={toggleSidebar}
          style={{
            width: 28, height: 28, borderRadius: '6px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', fontSize: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {sidebarCollapsed ? '›' : '‹'}
        </button>
      </div>
    </aside>
  );
}
