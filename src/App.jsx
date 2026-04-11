import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { NavigationProvider, useNavigationContext } from '@/context/NavigationContext';
import { MemberProfileProvider, useMemberProfile } from '@/context/MemberProfileContext';

// Mobile app — lazy loaded, zero bundle impact on desktop
const MobileApp = lazy(() => import('@/mobile/MobileApp'));
// Conference-floor demo shell — sub-route #/m/conference. Lazy for the
// same reason: it ships alongside MobileApp but shouldn't inflate desktop.
const ConferenceShell = lazy(() => import('@/mobile/conference/ConferenceShell'));
const ConciergeChatPage = lazy(() => import('@/features/concierge/ConciergeChatPage'));
const InvestorSite = lazy(() => import('@/features/invest/InvestorSite'));
const LandingPage = lazy(() => import('@/landing/LandingPage.jsx'));
const WeatherCascade = lazy(() => import('@/features/demo/WeatherCascade'));
const GamePlanDemo = lazy(() => import('@/features/demo/GamePlanDemo'));
const BoardReportDemo = lazy(() => import('@/features/demo/BoardReportDemo'));
const ArchetypeCompare = lazy(() => import('@/features/demo/ArchetypeCompare'));
const ROISlide = lazy(() => import('@/features/demo/ROISlide'));
const SplitScreenDemo = lazy(() => import('@/features/demo/SplitScreenDemo'));
const SaveTimeline = lazy(() => import('@/features/demo/SaveTimeline'));
const PilotResults = lazy(() => import('@/features/demo/PilotResults'));
const LOITracker = lazy(() => import('@/features/demo/LOITracker'));
const ArchitectureMoat = lazy(() => import('@/features/demo/ArchitectureMoat'));
const TechnicalDeepDive = lazy(() => import('@/features/demo/TechnicalDeepDive'));
const MobileShowcase = lazy(() => import('@/features/demo/MobileShowcase'));
const AgentsLanding = lazy(() => import('@/features/demo/AgentsLanding'));
import { DataProvider } from '@/context/DataProvider';
import { DemoWizardProvider, useDemoWizard } from '@/context/DemoWizardContext';
import DemoWizard from '@/components/ui/DemoWizard';
import { MobileConversionBar } from '@/components/layout';
import ActionsDrawer from '@/components/layout/ActionsDrawer';
import DataImportBanner from '@/components/ui/DataImportBanner';
import SwoopLayout from '@/components/layout/SwoopLayout';
import { getClubId as getClientClubId } from '@/services/apiClient';
import { getDataMode } from '@/services/demoGate';

// V3: Active features only — deleted features removed in Phase 5 cleanup
// Lazy-load all pages except Today (initial view) for code-splitting
import { TodayView } from '@/features/today';
const ServiceView = lazy(() => import('@/features/service/ServiceView'));
const MembersView = lazy(() => import('@/features/members/MembersView'));
const BoardReport = lazy(() => import("@/features/board-report/BoardReport.jsx"));
const AdminHub = lazy(() => import('@/features/admin/AdminHub'));
const MemberProfilePage = lazy(() => import('@/features/member-profile/MemberProfilePage.jsx'));
const MemberProfileDrawer = lazy(() => import('@/features/member-profile/MemberProfileDrawer.jsx'));
const IntegrationsPage = lazy(() => import('@/features/integrations/IntegrationsPage'));
const CsvImportPage = lazy(() => import('@/features/integrations/CsvImportPage'));
const PlaybooksPage = lazy(() => import('@/features/playbooks/PlaybooksPage'));
const AutomationsHub = lazy(() => import('@/features/automations/AutomationsHub'));
const AgentActivityPage = lazy(() => import('@/features/agents/AgentActivityPage'));
const TeeSheetView = lazy(() => import('@/features/tee-sheet/TeeSheetView'));
const RevenuePage = lazy(() => import('@/features/revenue/RevenuePage'));
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage'));
import LoginPage from '@/features/login/LoginPage';
const ResetPasswordPage = lazy(() => import('@/features/login/ResetPasswordPage'));

// V3 Phase 5: Clean route map — only active pages.
// All legacy routes handled by ROUTE_REDIRECTS in NavigationContext.
const ROUTES = {
  'today': TodayView,
  'tee-sheet': TeeSheetView,
  'service': ServiceView,
  'revenue': RevenuePage,
  'members': MembersView,
  'board-report': BoardReport,
  'admin': AdminHub,
  'member-profile': MemberProfilePage,
  'integrations': IntegrationsPage,
  'integrations/csv-import': CsvImportPage,
  'csv-import': CsvImportPage,
  'playbooks': PlaybooksPage,
  'automations': AutomationsHub,
  'agent-activity': AgentActivityPage,
  'profile': ProfilePage,
};

function AppShell() {
  const { currentRoute } = useNavigationContext();
  const PageComponent = ROUTES[currentRoute] ?? TodayView;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [actionsDrawerOpen, setActionsDrawerOpen] = useState(false);
  const demoWizard = useDemoWizard();
  const demoRenderKey = demoWizard?.renderKey ?? 0;

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Listen for custom event to open actions drawer from any component
  useEffect(() => {
    const handler = () => setActionsDrawerOpen(true);
    window.addEventListener('swoop:open-actions', handler);
    return () => window.removeEventListener('swoop:open-actions', handler);
  }, []);

  // Guided demo session expiry: if the tab was closed and reopened, log out
  useEffect(() => {
    if (localStorage.getItem('swoop_was_guided') === 'true' && sessionStorage.getItem('swoop_demo_guided') !== 'true') {
      localStorage.removeItem('swoop_was_guided');
      localStorage.removeItem('swoop_auth_user');
      localStorage.removeItem('swoop_auth_token');
      localStorage.removeItem('swoop_club_id');
      localStorage.removeItem('swoop_club_name');
      localStorage.removeItem('swoop_agent_inbox');
      window.location.reload();
    }
  }, []);

  // Demo session cleanup: delete demo club data from DB on sign-out or page close
  useEffect(() => {
    const cleanupDemo = () => {
      // Specific check (not getDataMode): only DB-backed ephemeral demo clubs
      // (clubId prefix demo_*) need server-side cleanup on unload.
      try {
        const user = JSON.parse(localStorage.getItem('swoop_auth_user') || '{}');
        const clubId = getClientClubId();
        if (user?.isDemoSession && clubId?.startsWith('demo_')) {
          // Use sendBeacon for reliability during page unload
          navigator.sendBeacon(`/api/club?clubId=${clubId}&cleanup=true`, '');
        }
      } catch {}
    };
    window.addEventListener('beforeunload', cleanupDemo);
    return () => window.removeEventListener('beforeunload', cleanupDemo);
  }, []);

  const handleSignOut = () => {
    // Specific check (not getDataMode): only DB-backed ephemeral demo clubs
    // (clubId prefix demo_*) need server-side cleanup; static 'demo' id does not.
    try {
      const user = JSON.parse(localStorage.getItem('swoop_auth_user') || '{}');
      const clubId = getClientClubId();
      if (user?.isDemoSession && clubId?.startsWith('demo_')) {
        fetch(`/api/club?clubId=${clubId}`, { method: 'DELETE', headers: { 'X-Demo-Club': clubId } }).catch(() => {});
      }
    } catch {}
    localStorage.removeItem('swoop_auth_user');
    localStorage.removeItem('swoop_auth_token');
    localStorage.removeItem('swoop_club_id');
    localStorage.removeItem('swoop_club_name');
    localStorage.removeItem('swoop_demo_email');
    localStorage.removeItem('swoop_demo_phone');
    localStorage.removeItem('swoop_was_guided');
    sessionStorage.clear();
    window.location.reload();
  };

  const footerContent = (
    <>
      Swoop Golf &middot; Integrated Intelligence for Private Clubs
      {(() => {
        try {
          const user = JSON.parse(localStorage.getItem('swoop_auth_user') || '{}');
          const clubId = getClientClubId();
          const isDemoSession = getDataMode() !== 'live';
          return (
            <span>
              {user.name ? ` · ${user.name}` : ''}
              {!isDemoSession && clubId ? ` · ${user.clubName || localStorage.getItem('swoop_club_name') || 'Connected Club'}` : ' · Demo Environment'}
              <button
                onClick={handleSignOut}
                className="ml-3 text-brand-500 hover:text-brand-600 font-semibold"
              >Sign Out</button>
            </span>
          );
        } catch { return ' · Demo Environment'; }
      })()}
    </>
  );

  return (
    <SwoopLayout
      footer={footerContent}
      actionsDrawer={
        <ActionsDrawer isOpen={actionsDrawerOpen} onClose={() => setActionsDrawerOpen(false)} />
      }
      mobileBar={isMobile ? <MobileConversionBar /> : null}
    >
      <DataImportBanner />
      <Suspense fallback={null}>
        <PageComponent key={`${currentRoute}-${demoRenderKey}`} />
      </Suspense>
    </SwoopLayout>
  );
}

function PortalApplication() {
  return (
    <DemoWizardProvider>
      <NavigationProvider>
        <MemberProfileProvider>
          <AppShell />
          <Suspense fallback={null}>
            <MemberProfileDrawer />
          </Suspense>
          <DemoWizard />
        </MemberProfileProvider>
      </NavigationProvider>
    </DemoWizardProvider>
  );
}

function RouterViews() {
  // Mobile routes: exactly #/m or #/m/... — NOT #/members, #/member-profile, etc.
  const hash = window.location.hash;
  const isMobileRoute = hash === '#/m' || hash.startsWith('#/m/');
  const isConferenceRoute = hash.startsWith('#/m/conference');
  const isConciergeRoute = hash === '#/concierge' || hash.startsWith('#/concierge?');
  const isDemoWeatherCascade = hash === '#/demo/weather-cascade';
  const isDemoGameplan = hash === '#/demo/gameplan';
  const isDemoBoardReport = hash === '#/demo/board-report';
  const isDemoArchetype = hash === '#/demo/archetype-compare';
  const isDemoROI = hash === '#/demo/roi';
  const isDemoSplitScreen = hash === '#/demo/split-screen';
  const isDemoSaveTimeline = hash === '#/demo/save-timeline';
  const isDemoPilotResults = hash === '#/demo/pilot-results';
  const isDemoLOITracker = hash === '#/demo/loi-tracker';
  const isDemoArchitecture = hash === '#/demo/architecture';
  const isDemoTechnicalDeepDive = hash === '#/demo/technical-deep-dive';
  const isDemoMobileShowcase = hash === '#/demo/mobile-showcase';
  const isDemoAgentsLanding = hash === '#/demo/agents-landing';

  if (isDemoPilotResults) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-sans">Loading Demo...</div>}>
        <PilotResults />
      </Suspense>
    );
  }

  if (isDemoLOITracker) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-sans">Loading Demo...</div>}>
        <LOITracker />
      </Suspense>
    );
  }

  if (isDemoArchitecture) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-sans">Loading Demo...</div>}>
        <ArchitectureMoat />
      </Suspense>
    );
  }

  if (isDemoTechnicalDeepDive) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-sans">Loading Demo...</div>}>
        <TechnicalDeepDive />
      </Suspense>
    );
  }

  if (isDemoMobileShowcase) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-sans">Loading Demo...</div>}>
        <MobileShowcase />
      </Suspense>
    );
  }

  if (isDemoAgentsLanding) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-sans">Loading Demo...</div>}>
        <AgentsLanding />
      </Suspense>
    );
  }

  if (isDemoSplitScreen) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-sans">Loading Demo...</div>}>
        <SplitScreenDemo />
      </Suspense>
    );
  }

  if (isDemoSaveTimeline) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-sans">Loading Demo...</div>}>
        <SaveTimeline />
      </Suspense>
    );
  }

  if (isDemoWeatherCascade) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-sans">Loading Demo...</div>}>
        <WeatherCascade />
      </Suspense>
    );
  }

  if (isDemoGameplan) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-sans">Loading Demo...</div>}>
        <GamePlanDemo />
      </Suspense>
    );
  }

  if (isDemoBoardReport) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-sans">Loading Demo...</div>}>
        <BoardReportDemo />
      </Suspense>
    );
  }

  if (isDemoArchetype) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-sans">Loading Demo...</div>}>
        <ArchetypeCompare />
      </Suspense>
    );
  }

  if (isDemoROI) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-sans">Loading Demo...</div>}>
        <ROISlide />
      </Suspense>
    );
  }

  if (isConciergeRoute) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-sans">Loading Concierge...</div>}>
        <ConciergeChatPage />
      </Suspense>
    );
  }

  if (isConferenceRoute) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-sans">Loading Swoop Conference Demo...</div>}>
        <ConferenceShell />
      </Suspense>
    );
  }

  if (isMobileRoute) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-sans">Loading Swoop Mobile...</div>}>
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

// Process Google OAuth callback synchronously before first render
function processGoogleAuthCallback() {
  const hash = window.location.hash;
  if (!hash.startsWith('#/google-auth')) return false;
  try {
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const token = params.get('token');
    const user = JSON.parse(decodeURIComponent(params.get('user') || '{}'));
    if (token && user.userId) {
      localStorage.setItem('swoop_auth_token', token);
      localStorage.setItem('swoop_auth_user', JSON.stringify(user));
      localStorage.setItem('swoop_club_id', user.clubId);
      if (user.clubName) localStorage.setItem('swoop_club_name', user.clubName);
      window.location.hash = '#/today';
      return true;
    }
  } catch (e) {
    console.error('Google auth callback error:', e);
    window.location.hash = '#/';
  }
  return false;
}

export default function App() {
  const [authed, setAuthed] = useState(() => {
    // Handle Google OAuth redirect before checking auth state
    if (window.location.hash.startsWith('#/google-auth')) {
      processGoogleAuthCallback();
    }
    try { return !!(localStorage.getItem('swoop_auth_user') && localStorage.getItem('swoop_auth_token')); } catch { return false; }
  });

  // Track hash changes so reset-password → login transitions work
  const [currentHash, setCurrentHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Concierge chat — accessible without auth (demo/testing mode)
  if (currentHash === '#/concierge' || currentHash.startsWith('#/concierge?')) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-sans">Loading Concierge...</div>}>
        <ConciergeChatPage />
      </Suspense>
    );
  }

  // Landing page — accessible without auth via hash route
  if (currentHash === '#/landing') {
    return (
      <Suspense fallback={null}>
        <LandingPage />
      </Suspense>
    );
  }

  // Investor site — accessible without auth
  if (currentHash === '#/invest') {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-sans">Loading...</div>}>
        <InvestorSite />
      </Suspense>
    );
  }

  // Demo routes — accessible without auth for conference demos
  if (currentHash.startsWith('#/demo/')) {
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

  // Password reset page — accessible without auth
  if (currentHash.startsWith('#/reset-password')) {
    return (
      <Suspense fallback={null}>
        <ResetPasswordPage />
      </Suspense>
    );
  }

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />;
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
