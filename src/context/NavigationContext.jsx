import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { navItems } from '@/config/navigation';

const NavigationContext = createContext(null);

// Valid route keys for hash routing
const VALID_ROUTES = new Set([
  // New primary views
  'today', 'members', 'revenue', 'playbooks-automation', 'activity-history',
  // Legacy routes (still valid, redirect to new views)
  'daily-briefing', 'operations', 'waitlist-demand', 'fb-performance',
  'member-health', 'revenue-leakage', 'outreach-playbooks', 'staffing-service', 'growth-pipeline',
  'agent-command', 'location-intelligence', 'integrations', 'demo-mode',
  'board-report', 'member-profile', 'integrations/csv-import', 'csv-import',
  'data-model',
  'experience-insights',
  'playbooks',
  'storyboard-flows',
  'actions',
]);

// Redirect map: old route → new route
const ROUTE_REDIRECTS = {
  'daily-briefing': 'today',
  'member-health': 'members',
  'revenue-leakage': 'revenue',
  'experience-insights': 'members',
  'waitlist-demand': 'members',
  'actions': 'playbooks-automation',
  'landing': 'today',
};

const DEFAULT_ROUTE = 'today';

function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  if (!raw) return { route: DEFAULT_ROUTE, memberId: null };
  if (raw.startsWith('members/')) {
    const [, memberId] = raw.split('/');
    return { route: 'member-profile', memberId: memberId || null };
  }
  const normalized = raw.replace(/\/+$/, '');
  // Apply redirects
  if (ROUTE_REDIRECTS[normalized]) {
    const newRoute = ROUTE_REDIRECTS[normalized];
    window.history.replaceState(null, '', `#/${newRoute}`);
    return { route: newRoute, memberId: null };
  }
  const safeRoute = normalized || DEFAULT_ROUTE;
  return { route: VALID_ROUTES.has(safeRoute) ? safeRoute : DEFAULT_ROUTE, memberId: null };
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
  // 'today' = simplified 3-item briefing | 'analytics' = trend & deep-dive modules
  const [viewMode, setViewMode] = useState('today');

  const currentRoute = route;
  const memberRouteId = memberId;

  const navigate = useCallback((routeKey, intent = null) => {
    if (routeKey === 'member-profile') {
      const targetMemberId = intent?.memberId ?? intent?.member ?? null;
      if (!targetMemberId) {
        setRouteState({ route: 'member-profile', memberId: null });
        setRouteIntent(null);
        setHashPath('member-profile');
        return;
      }
      setRouteState({ route: 'member-profile', memberId: targetMemberId });
      setRouteIntent({ ...intent, memberId: targetMemberId });
      setHashPath(`members/${targetMemberId}`);
      return;
    }
    // Apply redirects for navigate() calls too
    const redirected = ROUTE_REDIRECTS[routeKey] ?? routeKey;
    const safeRoute = VALID_ROUTES.has(redirected) ? redirected : DEFAULT_ROUTE;
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
    if (!window.location.hash) setHashPath(DEFAULT_ROUTE);
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
