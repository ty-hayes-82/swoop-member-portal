import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { navItems } from '@/config/navigation';

const NavigationContext = createContext(null);

// Valid route keys for hash routing
const VALID_ROUTES = new Set([
  'daily-briefing', 'operations', 'waitlist-demand', 'fb-performance',
  'member-health', 'staffing-service', 'growth-pipeline', 'agent-command',
  'integrations', 'demo-mode',
]);

function getRouteFromHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return VALID_ROUTES.has(hash) ? hash : 'daily-briefing';
}

function setHash(routeKey) {
  const newHash = `#/${routeKey}`;
  if (window.location.hash !== newHash) {
    window.history.pushState(null, '', newHash);
  }
}

export function NavigationProvider({ children }) {
  const [currentRoute, setCurrentRoute]   = useState(getRouteFromHash);
  const [routeIntent, setRouteIntent] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // 'today' = simplified 3-item briefing | 'deep-dive' = full analytics
  const [viewMode, setViewMode] = useState('today');

  const navigate = useCallback((routeKey, intent = null) => {
    const safeRoute = VALID_ROUTES.has(routeKey) ? routeKey : 'daily-briefing';
    setCurrentRoute(safeRoute);
    setRouteIntent(intent);
    setHash(safeRoute);
  }, []);

  // Listen for browser back/forward
  useEffect(() => {
    function onPopState() {
      setCurrentRoute(getRouteFromHash());
      setRouteIntent(null);
    }
    window.addEventListener('popstate', onPopState);
    // Set initial hash if none present
    if (!window.location.hash) setHash('daily-briefing');
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const toggleSidebar = () => setSidebarCollapsed(c => !c);
  const clearRouteIntent = () => setRouteIntent(null);

  const allItems = navItems.flatMap(item =>
    item.children ? [item, ...item.children] : [item]
  );
  const currentPageMeta = allItems.find(i => i.key === currentRoute) ?? navItems[0];

  return (
    <NavigationContext.Provider value={{
      currentRoute, navigate,
      routeIntent, clearRouteIntent,
      sidebarCollapsed, toggleSidebar,
      viewMode, setViewMode,
      currentPageMeta,
    }}>
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
