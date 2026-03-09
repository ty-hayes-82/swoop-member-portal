import { useState, useEffect } from 'react';
import { AppProvider } from '@/context/AppContext';
import { NavigationProvider, useNavigationContext } from '@/context/NavigationContext';
import { DataProvider } from '@/context/DataProvider';
import { Sidebar } from '@/components/layout';
import { Header } from '@/components/layout';
import { DailyBriefing } from '@/features/daily-briefing';
import { OperationsDashboard } from '@/features/operations';
import { WaitlistDemand } from '@/features/waitlist-demand';
import { FBPerformance } from '@/features/fb-performance';
import { MemberHealth } from '@/features/member-health';
import { StaffingService } from '@/features/staffing-service';
import { GrowthPipeline } from '@/features/growth-pipeline';
import { AgentCommand }    from '@/features/agent-command';
import { DemoMode } from '@/features/demo-mode';
import { IntegrationsPage } from '@/features/integrations';
import { theme } from '@/config/theme';

const ROUTES = {
  'daily-briefing':   DailyBriefing,
  'operations':       OperationsDashboard,
  'waitlist-demand':  WaitlistDemand,
  'fb-performance':   FBPerformance,
  'member-health':    MemberHealth,
  'staffing-service': StaffingService,
  'growth-pipeline':  GrowthPipeline,
  'agent-command':    AgentCommand,
  'integrations':     IntegrationsPage,
  'demo-mode':        DemoMode,
};

function AppShell() {
  const { currentRoute, sidebarCollapsed } = useNavigationContext();
  const PageComponent = ROUTES[currentRoute] ?? DailyBriefing;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [currentRoute]);

  const sidebarWidth = isMobile ? 0 : (sidebarCollapsed ? 52 : 230);

  return (
    <div style={{
      background: theme.colors.bg, color: theme.colors.textPrimary,
      fontFamily: theme.fonts.sans,
    }}>
      {/* Mobile overlay */}
      {isMobile && mobileMenuOpen && (
        <div onClick={() => setMobileMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />
      )}
      {/* Sidebar: hidden on mobile unless menu is open */}
      {(!isMobile || mobileMenuOpen) && <Sidebar />}
      <div style={{
        marginLeft: sidebarWidth,
        transition: 'margin-left 0.2s ease',
        display: 'flex', flexDirection: 'column',
        minHeight: '100vh',
      }}>
        <Header onMobileMenuToggle={isMobile ? () => setMobileMenuOpen(v => !v) : undefined} />
        <main style={{
          flex: 1,
          padding: isMobile ? '16px' : theme.spacing.xl,
          maxWidth: 1200,
          width: '100%',
          margin: '0 auto',
        }}>
          <PageComponent />
        </main>
        <footer style={{
          padding: `${theme.spacing.md} ${isMobile ? '16px' : theme.spacing.xl}`,
          borderTop: `1px solid ${theme.colors.border}`,
          fontSize: theme.fontSize.xs,
          color: theme.colors.textMuted,
          textAlign: 'center',
        }}>
          Swoop Golf · Integrated Intelligence for Private Clubs ·
          Demo Environment · Oakmont Hills CC · January 2026
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppProvider>
        <NavigationProvider>
          <AppShell />
        </NavigationProvider>
      </AppProvider>
    </DataProvider>
  );
}
