import { useApp } from '@/context/AppContext';

export default function MobileHeader() {
  const { pendingAgentCount } = useApp();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

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
      <div style={{ position: 'relative' }}>
        <span style={{ fontSize: '24px' }}>🔔</span>
        {pendingAgentCount > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-6px',
            background: '#EF4444', color: '#fff', fontSize: '9px', fontWeight: 700,
            minWidth: '16px', height: '16px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
          }}>{pendingAgentCount}</span>
        )}
      </div>
    </header>
  );
}
