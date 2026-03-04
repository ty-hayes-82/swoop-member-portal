import { createContext, useContext, useState } from 'react';
import { navItems } from '@/config/navigation';

const NavigationContext = createContext(null);

export function NavigationProvider({ children }) {
  const [currentRoute, setCurrentRoute] = useState('daily-briefing');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigate = (routeKey) => setCurrentRoute(routeKey);
  const toggleSidebar = () => setSidebarCollapsed(c => !c);

  const allItems = navItems.flatMap(item =>
    item.children ? [item, ...item.children] : [item]
  );
  const currentPageMeta = allItems.find(i => i.key === currentRoute) ?? navItems[0];

  return (
    <NavigationContext.Provider value={{
      currentRoute,
      navigate,
      sidebarCollapsed,
      toggleSidebar,
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
