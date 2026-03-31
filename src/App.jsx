import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { NavigationProvider, useNavigationContext } from '@/context/NavigationContext';
import { MemberProfileProvider, useMemberProfile } from '@/context/MemberProfileContext';

// Mobile app — lazy loaded, zero bundle impact on desktop
const MobileApp = lazy(() => import('@/mobile/MobileApp'));
import { DataProvider } from '@/context/DataProvider';
import { Sidebar, Header, MobileConversionBar } from '@/components/layout';
import ActionsDrawer from '@/components/layout/ActionsDrawer';

// V3: Active features only — deleted features removed in Phase 5 cleanup
import { TodayView } from '@/features/today';
import { ServiceView } from '@/features/service';
import { MembersView } from '@/features/members';
const BoardReport = lazy(() => import("@/features/board-report/BoardReport.jsx"));
import AdminHub from '@/features/admin/AdminHub';
import MemberProfilePage from '@/features/member-profile/MemberProfilePage.jsx';
import MemberProfileDrawer from '@/features/member-profile/MemberProfileDrawer.jsx';
import { IntegrationsPage } from '@/features/integrations';
import LoginPage from '@/features/login/LoginPage';
import { theme } from '@/config/theme';

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
};

function AppShell() {
  const { currentRoute } = useNavigationContext();
  const { isDrawerOpen } = useMemberProfile();
  const PageComponent = ROUTES[currentRoute] ?? TodayView;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [actionsDrawerOpen, setActionsDrawerOpen] = useState(false);
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
      <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>        {(!isMobile || mobileMenuOpen) && (
          <Sidebar isMobile={isMobile} mobileMenuOpen={mobileMenuOpen} onOpenActions={() => setActionsDrawerOpen(true)} />
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
            paddingRight: 0,
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
            <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: theme.colors.textMuted }}>Loading...</div>}>
              <PageComponent />
            </Suspense>
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
      <ActionsDrawer isOpen={actionsDrawerOpen} onClose={() => setActionsDrawerOpen(false)} />
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
  // Mobile routes: exactly #/m or #/m/... — NOT #/members, #/member-profile, etc.
  const hash = window.location.hash;
  const isMobileRoute = hash === '#/m' || hash.startsWith('#/m/');

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
