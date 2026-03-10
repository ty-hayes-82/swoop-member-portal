import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { NavigationProvider, useNavigationContext } from '@/context/NavigationContext';
import { MemberProfileProvider } from '@/context/MemberProfileContext';
import { DataProvider } from '@/context/DataProvider';
import { Sidebar, Header, MobileConversionBar } from '@/components/layout';
import { DailyBriefing } from '@/features/daily-briefing';
import { OperationsDashboard } from '@/features/operations';
import { WaitlistDemand } from '@/features/waitlist-demand';
import { FBPerformance } from '@/features/fb-performance';
import { MemberHealth } from '@/features/member-health';
import { StaffingService } from '@/features/staffing-service';
import { GrowthPipeline } from '@/features/growth-pipeline';
import { AgentCommand } from '@/features/agent-command';
import { DemoMode } from '@/features/demo-mode';
import { IntegrationsPage } from '@/features/integrations';
import MemberProfileDrawer from '@/features/member-profile/MemberProfileDrawer.jsx';
import LocationIntelligence from '@/features/location-intelligence/LocationIntelligence.jsx';
import { CsvImportHub } from '@/features/csv-import';
import MemberProfilePage from '@/features/member-profile/MemberProfilePage.jsx';
import PortalLanding from '@/features/landing/PortalLanding.jsx';
import OnlySwoopModule from '@/components/ui/OnlySwoopModule.jsx';
import { onlySwoopModules } from '@/config/onlySwoopModules.js';
import { theme } from '@/config/theme';

const ROUTES = {
  'daily-briefing': DailyBriefing,
  operations: OperationsDashboard,
  'waitlist-demand': WaitlistDemand,
  'fb-performance': FBPerformance,
  'member-health': MemberHealth,
  'staffing-service': StaffingService,
  'growth-pipeline': GrowthPipeline,
  'agent-command': AgentCommand,
  integrations: IntegrationsPage,
  'location-intelligence': LocationIntelligence,
  'demo-mode': DemoMode,
  'integrations/csv-import': CsvImportHub,
  'csv-import': CsvImportHub,
  'member-profile': MemberProfilePage,
  landing: PortalLanding,
};

function AppShell() {
  const { currentRoute } = useNavigationContext();
  const PageComponent = ROUTES[currentRoute] ?? DailyBriefing;
  const moduleConfig = onlySwoopModules[currentRoute];
  const isLandingExperience = currentRoute === 'landing';
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentRoute]);

  if (isLandingExperience) {
    return (
      <div
        style={{
          background: theme.colors.bg,
          color: theme.colors.textPrimary,
          fontFamily: theme.fonts.sans,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <main
          style={{
            flex: 1,
            width: '100%',
            padding: isMobile ? '24px 16px 48px' : theme.spacing.xl,
          }}
        >
          <PortalLanding />
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
          Demo environment · Oakmont Hills CC · January 2026
        </footer>
      </div>
    );
  }

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
      <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
        {(!isMobile || mobileMenuOpen) && (
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
            {moduleConfig && <OnlySwoopModule {...moduleConfig} />}
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
