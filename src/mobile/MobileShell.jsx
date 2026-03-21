import { useCallback, useState } from 'react';
import { useMobileNav } from './context/MobileNavContext';
import MobileHeader from './components/MobileHeader';
import BottomTabBar from './components/BottomTabBar';
import CockpitScreen from './screens/CockpitScreen';
import ActionInboxScreen from './screens/ActionInboxScreen';
import MemberLookupScreen from './screens/MemberLookupScreen';
import SettingsScreen from './screens/SettingsScreen';
import usePullToRefresh from './hooks/usePullToRefresh';

const SCREENS = {
  cockpit: CockpitScreen,
  inbox: ActionInboxScreen,
  members: MemberLookupScreen,
  settings: SettingsScreen,
};

export default function MobileShell() {
  const { activeTab } = useMobileNav();
  const Screen = SCREENS[activeTab] || CockpitScreen;
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    return new Promise(resolve => {
      setRefreshKey(k => k + 1);
      setTimeout(resolve, 600);
    });
  }, []);

  const { pulling, refreshing, pullDistance, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8F9FA',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      color: '#0F0F0F',
      maxWidth: '428px',
      margin: '0 auto',
    }}>
      <MobileHeader />

      {/* Pull-to-refresh indicator */}
      {(pulling || refreshing) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: `${pullDistance}px`, overflow: 'hidden',
          transition: refreshing ? 'none' : 'height 0.15s ease',
        }}>
          <span style={{
            fontSize: '18px',
            opacity: Math.min(pullDistance / 60, 1),
            transform: refreshing ? 'none' : `rotate(${pullDistance * 4}deg)`,
            animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
          }}>↻</span>
        </div>
      )}

      <main
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 16px)',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Screen key={refreshKey} />
      </main>
      <BottomTabBar />

      {/* Inject spin keyframe for pull-to-refresh */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
