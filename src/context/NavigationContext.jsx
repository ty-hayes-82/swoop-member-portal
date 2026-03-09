import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { navItems } from '@/config/navigation';

const NavigationContext = createContext(null);

// Valid route keys for hash routing
const VALID_ROUTES = new Set([
  'daily-briefing', 'operations', 'waitlist-demand', 'fb-performance',
  'member-health', 'staffing-service', 'growth-pipeline', 'agent-command',
  'location-intelligence', 'integrations', 'demo-mode', 'member-profile',
]);

function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  if (!raw) return { route: 'daily-briefing', memberId: null };
  if (raw.startsWith('members/')) {
    const [, memberId] = raw.split('/');
    return { route: 'member-profile', memberId: memberId || null };
  }
  return { route: VALID_ROUTES.has(raw) ? raw : 'daily-briefing', memberId: null };
}

function setHashPath(path) {
  const normalized = path ? `#/${path}` : '#/';
  if (window.location.hash !== normalized) {
    window.history.pushState(null, '', normalized);
  }
}

export function NavigationProvider({ children }) {
  const [{ route, memberId }, setRouteState] = useState(parseHash);
  const [routeIntent, setRouteIntent] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // 'today' = simplified 3-item briefing | 'deep-dive' = full analytics
  const [viewMode, setViewMode] = useState('today');

  const currentRoute = route;
  const memberRouteId = memberId;

  const navigate = useCallback((routeKey, intent = null) => {
    if (routeKey === 'member-profile') {
      const targetMemberId = intent?.memberId ?? intent?.member ?? null;
      if (!targetMemberId) {
        console.warn('navigate(member-profile) requires memberId');
        return;
      }
      setRouteState({ route: 'member-profile', memberId: targetMemberId });
      setRouteIntent({ ...intent, memberId: targetMemberId });
      setHashPath(`members/${targetMemberId}`);
      return;
    }
    const safeRoute = VALID_ROUTES.has(routeKey) ? routeKey : 'daily-briefing';
    setRouteState({ route: safeRoute, memberId: null });
    setRouteIntent(intent);
    setHashPath(safeRoute);
  }, []);

  // Listen for browser back/forward
  useEffect(() => {
    function onPopState() {
      setRouteState(parseHash());
      setRouteIntent(null);
    }
    window.addEventListener('popstate', onPopState);
    // Set initial hash if none present
    if (!window.location.hash) setHashPath('daily-briefing');
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const toggleSidebar = () => setSidebarCollapsed((c) => !c);
  const clearRouteIntent = () => setRouteIntent(null);

  const allItems = navItems.flatMap((item) =>
    item.children ? [item, ...item.children] : [item]
  );
  const currentPageMeta = allItems.find((i) => i.key === currentRoute) ?? navItems[0];

  return (
    <NavigationContext.Provider
      value={{
        currentRoute,
        navigate,
        routeIntent,
        clearRouteIntent,
        sidebarCollapsed,
        toggleSidebar,
        viewMode,
        setViewMode,
        currentPageMeta,
        memberRouteId,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export const useNavigationContext = () => {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigationContext must be used within NavigationProvider');
  return ctx;
};

export { useNavigationContext as useNavigation };
