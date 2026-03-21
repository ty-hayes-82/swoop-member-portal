import { useApp } from '@/context/AppContext';
import { useMobileNav } from '../context/MobileNavContext';

export default function MobileHeader() {
  const { pendingAgentCount } = useApp();
  const { navigateTab } = useMobileNav();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning, Sarah' : hour < 17 ? 'Good afternoon, Sarah' : 'Good evening, Sarah';

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      padding: '12px 16px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
      background: '#FFFFFF', borderBottom: '1px solid #E5E7EB',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F0F0F' }}>Swoop Golf</div>
        <div style={{ fontSize: '13px', color: '#6B7280' }}>{greeting}</div>
      </div>
      <button
        onClick={() => navigateTab('inbox')}
        style={{
          position: 'relative', background: 'none', border: 'none',
          cursor: 'pointer', padding: '8px', borderRadius: '50%',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span style={{ fontSize: '24px' }}>🔔</span>
        {pendingAgentCount > 0 && (
          <span style={{
            position: 'absolute', top: '2px', right: '0px',
            background: '#EF4444', color: '#fff', fontSize: '11px', fontWeight: 700,
            minWidth: '18px', height: '18px', borderRadius: '9px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
          }}>{pendingAgentCount}</span>
        )}
      </button>
    </header>
  );
}
