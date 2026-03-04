import { AppProvider } from '@/context/AppContext';
import { NavigationProvider, useNavigationContext } from '@/context/NavigationContext';
import { Sidebar } from '@/components/layout';
import { Header } from '@/components/layout';
import { DailyBriefing } from '@/features/daily-briefing';
import { OperationsDashboard } from '@/features/operations';
import { FBPerformance } from '@/features/fb-performance';
import { MemberHealth } from '@/features/member-health';
import { StaffingService } from '@/features/staffing-service';
import { GrowthPipeline } from '@/features/growth-pipeline';
import { DemoMode } from '@/features/demo-mode';
import { theme } from '@/config/theme';

const ROUTES = {
  'daily-briefing':  DailyBriefing,
  'operations':      OperationsDashboard,
  'fb-performance':  FBPerformance,
  'member-health':   MemberHealth,
  'staffing-service': StaffingService,
  'growth-pipeline': GrowthPipeline,
  'demo-mode':       DemoMode,
};

function AppShell() {
  const { currentRoute, sidebarCollapsed } = useNavigationContext();
  const PageComponent = ROUTES[currentRoute] ?? DailyBriefing;

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: theme.colors.bg, color: theme.colors.textPrimary,
      fontFamily: theme.fonts.sans,
    }}>
      <Sidebar />
      <div style={{
        flex: 1,
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
          Simulated Data · Oakmont Hills CC · January 2026
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <NavigationProvider>
        <AppShell />
      </NavigationProvider>
    </AppProvider>
  );
}
