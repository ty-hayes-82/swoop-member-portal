import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { NavigationProvider, useNavigationContext } from '@/context/NavigationContext';
import { MemberProfileProvider, useMemberProfile } from '@/context/MemberProfileContext';
import { DataProvider } from '@/context/DataProvider';
import { Sidebar, Header, MobileConversionBar } from '@/components/layout';
import { DailyBriefing } from '@/features/daily-briefing';
import { OperationsDashboard } from '@/features/operations';
import { WaitlistDemand } from '@/features/waitlist-demand';
import { FBPerformance } from '@/features/fb-performance';
import { MemberHealth } from '@/features/member-health';
import { RevenueLeakage } from '@/features/revenue-leakage';
import { StaffingService } from '@/features/staffing-service';
import { GrowthPipeline } from '@/features/growth-pipeline';
import { AgentCommand } from '@/features/agent-command';
import { DemoMode } from '@/features/demo-mode';
import { IntegrationsPage } from '@/features/integrations';
import MemberProfileDrawer from '@/features/member-profile/MemberProfileDrawer.jsx';
import LocationIntelligence from '@/features/location-intelligence/LocationIntelligence.jsx';
import { CsvImportHub } from '@/features/csv-import';
import MemberProfilePage from '@/features/member-profile/MemberProfilePage.jsx';
import LandingRedirect from '@/features/landing-redirect/LandingRedirect.jsx';
import BoardReport from "@/features/board-report/BoardReport.jsx";
import { theme } from '@/config/theme';

const ROUTES = {
  'daily-briefing': DailyBriefing,
  operations: OperationsDashboard,
  'waitlist-demand': WaitlistDemand,
  'fb-performance': FBPerformance,
  'member-health': MemberHealth,
  'revenue-leakage': RevenueLeakage,
  'staffing-service': StaffingService,
  'growth-pipeline': GrowthPipeline,
  'agent-command': AgentCommand,
  integrations: IntegrationsPage,
  'location-intelligence': LocationIntelligence,
  'demo-mode': DemoMode,
  'board-report': BoardReport,
  'integrations/csv-import': CsvImportHub,
  'csv-import': CsvImportHub,
  'member-profile': MemberProfilePage,
  landing: LandingRedirect,
};

function AppShell() {
  const { currentRoute } = useNavigationContext();
  const { isDrawerOpen } = useMemberProfile();
  const PageComponent = ROUTES[currentRoute] ?? DailyBriefing;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const drawerOffset = !isMobile && isDrawerOpen ? 700 : 0;

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentRoute]);

  return (
    <div
      style={{
        background: theme.colors.bg,
        color: theme.colors.textPrimary,
        fontFamily: theme.fonts.sans,
        minHeight: '100vh',
      }}
    >
      {isMobile && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 110 }}
        />
      )}
      <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', paddingRight: drawerOffset ? `${drawerOffset}px` : 0, transition: 'padding 0.25s ease' }}>        {(!isMobile || mobileMenuOpen) && (
          <Sidebar isMobile={isMobile} mobileMenuOpen={mobileMenuOpen} />
        )}
        <div
          style={{
            flex: 1,
            marginLeft: isMobile ? 0 : 0,
            transition: 'margin 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            width: '100%',
            paddingLeft: isMobile ? 0 : 0,
            paddingRight: drawerOffset ? `${Math.max(drawerOffset - 24, 0)}px` : 0,
          }}
        >
          <Header
            isMobile={isMobile}
            onMobileMenuToggle={isMobile ? () => setMobileMenuOpen((v) => !v) : undefined}
          />
          <main
            style={{
              flex: 1,
              padding: isMobile ? '16px 16px 96px' : theme.spacing.xl,
              width: '100%',
              minHeight: 0,
            }}
          >
            <PageComponent />
          </main>
          <footer
            style={{
              padding: `${theme.spacing.md} ${isMobile ? '16px' : theme.spacing.xl}`,
              borderTop: `1px solid ${theme.colors.border}`,
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              textAlign: 'center',
            }}
          >
            Swoop Golf · Integrated Intelligence for Private Clubs · Demo Environment · Oakmont Hills CC · January 2026
          </footer>
        </div>
      </div>
      {isMobile && <MobileConversionBar />}
    </div>
  );
}

function PortalApplication() {
  return (
    <NavigationProvider>
      <MemberProfileProvider>
        <AppShell />
        <MemberProfileDrawer />
      </MemberProfileProvider>
    </NavigationProvider>
  );
}

function RouterViews() {
  return (
    <Routes>
      <Route path="*" element={<PortalApplication />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <AppProvider>
          <RouterViews />
        </AppProvider>
      </DataProvider>
    </BrowserRouter>
  );
}
