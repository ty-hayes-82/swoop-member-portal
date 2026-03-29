import { useState } from 'react';
import { useMobileNav } from '../context/MobileNavContext';
import { useApp } from '@/context/AppContext';

const PRIMARY_TABS = [
  { key: 'cockpit', label: 'Today', icon: '\uD83C\uDFAF' },
  { key: 'members', label: 'Members', icon: '\uD83D\uDC65' },
  { key: 'revenue', label: 'Revenue', icon: '\uD83D\uDCB0' },
  { key: 'inbox', label: 'Actions', icon: '\u26A1' },
  { key: 'more', label: 'More', icon: '\u2022\u2022\u2022' },
];

const MORE_ITEMS = [
  { key: 'insights', label: 'Insights', icon: '\uD83D\uDD17' },
  { key: 'board-report', label: 'Board Report', icon: '\uD83D\uDCCA' },
  { key: 'settings', label: 'Admin', icon: '\u2699\uFE0F' },
];

export default function BottomTabBar() {
  const { activeTab, navigateTab } = useMobileNav();
  const { pendingAgentCount } = useApp();
  const [showMore, setShowMore] = useState(false);

  const handleTabClick = (key) => {
    if (key === 'more') {
      setShowMore(v => !v);
    } else {
      setShowMore(false);
      navigateTab(key);
    }
  };

  return (
    <>
      {/* More sheet overlay */}
      {showMore && (
        <>
          <div
            onClick={() => setShowMore(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 199,
              background: 'rgba(0,0,0,0.3)',
            }}
          />
          <div style={{
            position: 'fixed', bottom: '64px', left: 0, right: 0, zIndex: 200,
            background: '#fff', borderTop: '1px solid #E5E7EB',
            borderRadius: '16px 16px 0 0',
            padding: '16px', paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          }}>
            {MORE_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => handleTabClick(item.key)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 16px', border: 'none', background: 'none',
                  cursor: 'pointer', fontSize: '15px', fontWeight: 600,
                  color: activeTab === item.key ? '#F3922D' : '#374151',
                  borderRadius: '10px',
                }}
              >
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Bottom tab bar */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        height: '64px', paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: '#FFFFFF', borderTop: '1px solid #E5E7EB',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      }}>
        {PRIMARY_TABS.map(tab => {
          const isActive = tab.key === 'more' ? showMore : activeTab === tab.key;
          const badge = tab.key === 'inbox' && pendingAgentCount > 0 ? pendingAgentCount : null;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                padding: '8px 0', border: 'none', background: 'none', cursor: 'pointer',
                color: isActive ? '#F3922D' : '#6B7280', transition: 'color 0.15s',
                position: 'relative', minHeight: '44px',
              }}
            >
              <span style={{ fontSize: '22px', lineHeight: 1 }}>{tab.icon}</span>
              <span style={{ fontSize: '11px', fontWeight: isActive ? 700 : 500, letterSpacing: '0.02em' }}>{tab.label}</span>
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
    </>
  );
}
