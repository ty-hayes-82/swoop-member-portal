import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { navItems } from '@/config/navigation';

const NavigationContext = createContext(null);

// Valid route keys for hash routing — MVP 5-item navigation (V3 realignment)
const VALID_ROUTES = new Set([
  // Primary MVP views (V3)
  'today', 'service', 'members', 'board-report', 'admin',
  // V3 hidden but still routable for backward compat
  'revenue', 'insights', 'actions',
  // Accessible via direct navigation (not in nav)
  'member-profile', 'integrations', 'profile',
  // Legacy routes (redirect via ROUTE_REDIRECTS below)
  'daily-briefing', 'operations', 'waitlist-demand', 'fb-performance',
  'member-health', 'revenue-leakage', 'outreach-playbooks', 'staffing-service', 'growth-pipeline',
  'agent-command', 'location-intelligence', 'demo-mode',
  'experience-insights', 'playbooks', 'storyboard-flows',
  'playbooks-automation', 'automation-dashboard', 'activity-history',
  'data-health', 'data-model', 'integrations/csv-import', 'csv-import',
  'attribution', 'historical-trends', 'intervention-queue',
]);

// Redirect map: old/hidden route → MVP route
const ROUTE_REDIRECTS = {
  // Legacy view redirects
  'daily-briefing': 'today',
  'landing': 'today',
  // Decommissioned features → Today (V3: actions is no longer standalone)
  'actions': 'today',
  'playbooks-automation': 'today',
  'automation-dashboard': 'today',
  'agent-command': 'today',
  'outreach-playbooks': 'today',
  'playbooks': 'today',
  'intervention-queue': 'today',
  // Members-related
  'member-health': 'members',
  'waitlist-demand': 'members',
  'location-intelligence': 'members',
  // Revenue-related → Service (V3)
  'revenue': 'service',
  'revenue-leakage': 'service',
  'fb-performance': 'service',
  'operations': 'service',
  'staffing-service': 'service',
  // Insights-related → Service (V3)
  'insights': 'service',
  'experience-insights': 'service',
  // Board Report-related
  'growth-pipeline': 'board-report',
  'attribution': 'board-report',
  'historical-trends': 'board-report',
  // Admin-related
  'data-health': 'admin',
  'activity-history': 'admin',
  'data-model': 'admin',
  'integrations/csv-import': 'csv-import',
  // Hidden features
  'storyboard-flows': 'today',
  'demo-mode': 'today',
};

const DEFAULT_ROUTE = 'today';

function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  if (!raw) return { route: DEFAULT_ROUTE, memberId: null };
  if (raw.startsWith('members/')) {
    const [, subpath] = raw.split('/');
    // Known sub-views route to members page with mode intent
    const MEMBER_MODES = { 'at-risk': 'at-risk', 'first-90-days': 'cohorts', 'all-members': 'search', 'all': 'search' };
    if (MEMBER_MODES[subpath]) {
      return { route: 'members', memberId: null, mode: MEMBER_MODES[subpath] };
    }
    return { route: 'member-profile', memberId: subpath || null };
  }
  const normalized = raw.replace(/\/+$/, '');
  // Apply redirects
  if (ROUTE_REDIRECTS[normalized]) {
    const newRoute = ROUTE_REDIRECTS[normalized];
    window.history.replaceState(null, '', `#/${newRoute}`);
    return { route: newRoute, memberId: null };
  }
  const safeRoute = normalized || DEFAULT_ROUTE;
  if (!VALID_ROUTES.has(safeRoute)) {
    window.history.replaceState(null, '', `#/${DEFAULT_ROUTE}`);
    return { route: DEFAULT_ROUTE, memberId: null };
  }
  return { route: safeRoute, memberId: null };
}

function setHashPath(path) {
  const normalized = path ? `#/${path}` : '#/';
  if (window.location.hash !== normalized) {
    window.history.pushState(null, '', normalized);
  }
}

export function NavigationProvider({ children }) {
  const initialParsed = typeof parseHash === 'function' ? parseHash() : parseHash;
  const [{ route, memberId }, setRouteState] = useState(initialParsed);
  const [routeIntent, setRouteIntent] = useState(initialParsed.mode ? { mode: initialParsed.mode } : null);
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
      const parsed = parseHash();
      setRouteState(parsed);
      setRouteIntent(parsed.mode ? { mode: parsed.mode } : null);
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
