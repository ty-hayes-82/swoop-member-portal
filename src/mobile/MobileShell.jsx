import { useMobileNav } from './context/MobileNavContext';
import MobileHeader from './components/MobileHeader';
import BottomTabBar from './components/BottomTabBar';
import CockpitScreen from './screens/CockpitScreen';
import ActionInboxScreen from './screens/ActionInboxScreen';
import MemberLookupScreen from './screens/MemberLookupScreen';
import SettingsScreen from './screens/SettingsScreen';

const SCREENS = {
  cockpit: CockpitScreen,
  inbox: ActionInboxScreen,
  members: MemberLookupScreen,
  settings: SettingsScreen,
};

export default function MobileShell() {
  const { activeTab } = useMobileNav();
  const Screen = SCREENS[activeTab] || CockpitScreen;

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
      <main style={{
        paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 16px)',
        minHeight: 'calc(100vh - 64px)',
      }}>
        <Screen />
      </main>
      <BottomTabBar />
    </div>
  );
}
