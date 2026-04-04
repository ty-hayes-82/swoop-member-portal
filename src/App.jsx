import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { NavigationProvider, useNavigationContext } from '@/context/NavigationContext';
import { MemberProfileProvider, useMemberProfile } from '@/context/MemberProfileContext';

// Mobile app — lazy loaded, zero bundle impact on desktop
const MobileApp = lazy(() => import('@/mobile/MobileApp'));
import { DataProvider } from '@/context/DataProvider';
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
const PlaybooksPage = lazy(() => import('@/features/playbooks/PlaybooksPage'));
import LoginPage from '@/features/login/LoginPage';

// V3 Phase 5: Clean route map — only active pages.
// All legacy routes handled by ROUTE_REDIRECTS in NavigationContext.
const ROUTES = {
  'today': TodayView,
  'service': ServiceView,
  'members': MembersView,
  'board-report': BoardReport,
  'admin': AdminHub,
  'member-profile': MemberProfilePage,
  'integrations': IntegrationsPage,
  'playbooks': PlaybooksPage,
};

function AppShell() {
  const { currentRoute } = useNavigationContext();
  const PageComponent = ROUTES[currentRoute] ?? TodayView;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [actionsDrawerOpen, setActionsDrawerOpen] = useState(false);

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

  const footerContent = (
    <>
      Swoop Golf &middot; Integrated Intelligence for Private Clubs
      {(() => {
        try {
          const user = JSON.parse(localStorage.getItem('swoop_auth_user') || '{}');
          const clubId = localStorage.getItem('swoop_club_id');
          return (
            <span>
              {user.name ? ` · ${user.name}` : ''}
              {clubId && clubId !== 'demo' ? ` · ${user.clubName || 'Connected Club'}` : ' · Demo Environment'}
              <button
                onClick={() => { localStorage.removeItem('swoop_auth_user'); localStorage.removeItem('swoop_auth_token'); localStorage.removeItem('swoop_club_id'); window.location.reload(); }}
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
      <PageComponent />
    </SwoopLayout>
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
  // Mobile routes: exactly #/m or #/m/... — NOT #/members, #/member-profile, etc.
  const hash = window.location.hash;
  const isMobileRoute = hash === '#/m' || hash.startsWith('#/m/');

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
