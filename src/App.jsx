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
import { DataProvider } from '@/context/DataProvider';
import { DemoWizardProvider, useDemoWizard } from '@/context/DemoWizardContext';
import DemoWizard from '@/components/ui/DemoWizard';
import { MobileConversionBar } from '@/components/layout';
import ActionsDrawer from '@/components/layout/ActionsDrawer';
import SwoopLayout from '@/components/layout/SwoopLayout';

// V3: Active features only — deleted features removed in Phase 5 cleanup
// Lazy-load all pages except Today (initial view) for code-splitting
import { TodayView } from '@/features/today';
const ServiceView = lazy(() => import('@/features/service/ServiceView'));
const MembersView = lazy(() => import('@/features/members/MembersView'));
const BoardReport = lazy(() => import("@/features/board-report/BoardReport.jsx"));
const AdminHub = lazy(() => import('@/features/admin/AdminHub'));
const MemberProfilePage = lazy(() => import('@/features/member-profile/MemberProfilePage.jsx'));
import MemberProfileDrawer from '@/features/member-profile/MemberProfileDrawer.jsx';
const IntegrationsPage = lazy(() => import('@/features/integrations/IntegrationsPage'));
const CsvImportPage = lazy(() => import('@/features/integrations/CsvImportPage'));
const PlaybooksPage = lazy(() => import('@/features/playbooks/PlaybooksPage'));
const AutomationsHub = lazy(() => import('@/features/automations/AutomationsHub'));
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
      try {
        const user = JSON.parse(localStorage.getItem('swoop_auth_user') || '{}');
        const clubId = localStorage.getItem('swoop_club_id');
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
    try {
      const user = JSON.parse(localStorage.getItem('swoop_auth_user') || '{}');
      const clubId = localStorage.getItem('swoop_club_id');
      // Clean up demo data from DB
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
          const clubId = localStorage.getItem('swoop_club_id');
          const isDemoSession = user?.isDemoSession || clubId === 'demo';
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
          <MemberProfileDrawer />
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
