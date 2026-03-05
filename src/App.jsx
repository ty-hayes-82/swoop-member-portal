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
import { IntegrationsPage } from '@/features/integrations';
import { DemoMode } from '@/features/demo-mode';
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

  return (
    <div style={{
      background: theme.colors.bg, color: theme.colors.textPrimary,
      fontFamily: theme.fonts.sans,
    }}>
      <Sidebar />
      <div style={{
        marginLeft: sidebarCollapsed ? 52 : 230,
        transition: 'margin-left 0.2s ease',
        display: 'flex', flexDirection: 'column',
        minHeight: '100vh',
      }}>
        <Header />
        <main style={{
          flex: 1,
          padding: theme.spacing.xl,
          maxWidth: 1200,
          width: '100%',
          margin: '0 auto',
        }}>
          <PageComponent />
        </main>
        <footer style={{
          padding: `${theme.spacing.md} ${theme.spacing.xl}`,
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
