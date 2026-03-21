import { useMobileNav } from '../context/MobileNavContext';
import { useApp } from '@/context/AppContext';
import { mobileColors } from '../mobile-tokens';

const TABS = [
  { key: 'cockpit', label: 'Today', icon: '🎯' },
  { key: 'inbox', label: 'Actions', icon: '⚡' },
  { key: 'members', label: 'Members', icon: '👥' },
  { key: 'settings', label: 'More', icon: '⚙️' },
];

export default function BottomTabBar() {
  const { activeTab, navigateTab } = useMobileNav();
  const { pendingAgentCount } = useApp();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      height: '64px', paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      background: '#FFFFFF', borderTop: '1px solid #E5E7EB',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
    }}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.key;
        const badge = tab.key === 'inbox' && pendingAgentCount > 0 ? pendingAgentCount : null;
        return (
          <button
            key={tab.key}
            onClick={() => navigateTab(tab.key)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              padding: '8px 0', border: 'none', background: 'none', cursor: 'pointer',
              color: isActive ? '#F3922D' : '#6B7280', transition: 'color 0.15s',
              position: 'relative',
            }}
          >
            <span style={{ fontSize: '22px', lineHeight: 1 }}>{tab.icon}</span>
            <span style={{ fontSize: '12px', fontWeight: isActive ? 700 : 500, letterSpacing: '0.02em' }}>{tab.label}</span>
            {badge && (
              <span style={{
                position: 'absolute', top: '4px', right: 'calc(50% - 18px)',
                background: '#EF4444', color: '#fff', fontSize: '11px', fontWeight: 700,
                minWidth: '18px', height: '18px', borderRadius: '9px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px',
              }}>{badge}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
