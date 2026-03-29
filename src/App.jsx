import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { NavigationProvider, useNavigationContext } from '@/context/NavigationContext';
import { MemberProfileProvider, useMemberProfile } from '@/context/MemberProfileContext';

// Mobile app — lazy loaded, zero bundle impact on desktop
const MobileApp = lazy(() => import('@/mobile/MobileApp'));
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
import { DataModelPage } from '@/features/data-model';
import MemberProfileDrawer from '@/features/member-profile/MemberProfileDrawer.jsx';
import LocationIntelligence from '@/features/location-intelligence/LocationIntelligence.jsx';
import { CsvImportHub } from '@/features/csv-import';
import MemberProfilePage from '@/features/member-profile/MemberProfilePage.jsx';
import LandingRedirect from '@/features/landing-redirect/LandingRedirect.jsx';
import BoardReport from "@/features/board-report/BoardReport.jsx";
import ExperienceInsights from '@/features/experience-insights/ExperienceInsights.jsx';
import { OutreachPlaybooks } from '@/features/outreach-playbooks';
import PlaybooksPage from '@/features/playbooks/PlaybooksPage';
import { StoryboardFlows } from '@/features/storyboard-flows';
import { ActionsPage } from '@/features/actions';
import { TodayView } from '@/features/today';
import { MembersView } from '@/features/members';
import { RevenueView } from '@/features/revenue';
import ActivityHistoryPage from '@/features/activity-history/ActivityHistoryPage';
import AutomationDashboard from '@/features/automation-dashboard/AutomationDashboard';
import DataHealthDashboard from '@/features/data-health/DataHealthDashboard';
import { AdminDashboard } from '@/features/admin';
import AdminHub from '@/features/admin/AdminHub';
import LoginPage from '@/features/login/LoginPage';
import { theme } from '@/config/theme';

const ROUTES = {
  // MVP Primary views (7 nav items)
  'today': TodayView,
  'members': MembersView,
  'revenue': RevenueView,
  'insights': ExperienceInsights,  // Sprint 5: replace with dedicated InsightsPage
  'actions': ActionsPage,
  'board-report': BoardReport,
  'admin': AdminHub,
  // Accessible via direct navigation
  'member-profile': MemberProfilePage,
  'integrations': IntegrationsPage,
  // Legacy routes (most traffic redirected via NavigationContext ROUTE_REDIRECTS)
  'playbooks-automation': ActionsPage,
  'automation-dashboard': AutomationDashboard,
  'data-health': DataHealthDashboard,
  'activity-history': ActivityHistoryPage,
  'daily-briefing': DailyBriefing,
  'operations': OperationsDashboard,
  'waitlist-demand': WaitlistDemand,
  'fb-performance': FBPerformance,
  'member-health': MemberHealth,
  'revenue-leakage': RevenueLeakage,
  'staffing-service': StaffingService,
  'growth-pipeline': GrowthPipeline,
  'agent-command': AgentCommand,
  'location-intelligence': LocationIntelligence,
  'demo-mode': DemoMode,
  'integrations/csv-import': CsvImportHub,
  'csv-import': CsvImportHub,
  'experience-insights': ExperienceInsights,
  'outreach-playbooks': OutreachPlaybooks,
  'playbooks': PlaybooksPage,
  'storyboard-flows': StoryboardFlows,
  'data-model': DataModelPage,
  'admin-legacy': AdminDashboard,
  'landing': LandingRedirect,
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
            Swoop Golf · Integrated Intelligence for Private Clubs
            {(() => {
              try {
                const user = JSON.parse(localStorage.getItem('swoop_auth_user') || '{}');
                const clubId = localStorage.getItem('swoop_club_id');
                return (
                  <span>
                    {user.name ? ` · ${user.name}` : ''}
                    {clubId && clubId !== 'demo' ? ` · ${clubId}` : ' · Demo Environment'}
                    <button
                      onClick={() => { localStorage.removeItem('swoop_auth_user'); localStorage.removeItem('swoop_auth_token'); localStorage.removeItem('swoop_club_id'); window.location.reload(); }}
                      style={{ marginLeft: 12, background: 'none', border: 'none', color: theme.colors.accent, cursor: 'pointer', fontSize: theme.fontSize.xs, fontWeight: 600 }}
                    >Sign Out</button>
                  </span>
                );
              } catch { return ' · Demo Environment'; }
            })()}
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
  const isMobileRoute = window.location.hash.startsWith('#/m');

  if (isMobileRoute) {
    return (
      <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui', color: '#6B7280' }}>Loading Swoop Mobile...</div>}>
        <MobileApp />
      </Suspense>
    );
  }

  return (
    <Routes>
      <Route path="*" element={<PortalApplication />} />
    </Routes>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(() => {
    try { return !!localStorage.getItem('swoop_auth_user'); } catch { return false; }
  });

  if (!authed) {
    return <LoginPage onLogin={() => { setAuthed(true); window.location.reload(); }} />;
  }

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
