/**
 * Single source of truth for entering the prefilled static demo.
 *
 * The demo is entirely frontend-fixture-driven — clubId is timestamped
 * only so localStorage scoping is unique per session; the UI reads from
 * static fixtures regardless of the DB backend. Callers get the same
 * demo experience whether they enter from the login screen, the
 * top-right user menu, or a direct link.
 */
const DEMO_CLUB_NAME = 'Pinetree Country Club';

export function loadStaticDemo({ email = '', phone = '' } = {}) {
  const demoClubId = `demo_${Date.now()}`;
  const demoUser = {
    userId: 'demo',
    clubId: demoClubId,
    name: 'Demo User',
    email: email || 'demo@swoopgolf.com',
    phone: phone || '',
    role: 'gm',
    title: 'General Manager',
    isDemoSession: true,
  };
  localStorage.setItem('swoop_auth_user', JSON.stringify(demoUser));
  localStorage.setItem('swoop_auth_token', 'demo');
  localStorage.setItem('swoop_club_id', demoClubId);
  localStorage.setItem('swoop_club_name', DEMO_CLUB_NAME);
  if (email) localStorage.setItem('swoop_demo_email', email);
  if (phone) localStorage.setItem('swoop_demo_phone', phone);

  // Guided mode is NOT the default demo — reset any stale guided flags so
  // entering the static demo always shows the prefilled experience.
  sessionStorage.removeItem('swoop_demo_guided');
  sessionStorage.removeItem('swoop_demo_sources');
  sessionStorage.removeItem('swoop_demo_files');
  sessionStorage.removeItem('swoop_demo_gates');
  localStorage.removeItem('swoop_was_guided');

  try {
    window.dispatchEvent(new CustomEvent('swoop:demo-sources-changed', {
      detail: { action: 'mode-change', guided: false },
    }));
  } catch { /* event dispatch is best-effort */ }

  return demoUser;
}

/**
 * Return true iff the current session has a real (non-demo) club selected.
 * Used to decide whether to offer "Create New Club" in the user menu.
 */
export function hasRealClub() {
  try {
    const clubId = localStorage.getItem('swoop_club_id') || '';
    const user = JSON.parse(localStorage.getItem('swoop_auth_user') || '{}');
    if (!clubId) return false;
    if (clubId === 'demo' || clubId.startsWith('demo_')) return false;
    if (user.isDemoSession) return false;
    return true;
  } catch {
    return false;
  }
}
