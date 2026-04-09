/**
 * Login Page — shown when user is not authenticated
 * Screen 1: Sign in (email/password + Google)
 * Screen 2: Demo / Guided Demo / New Club setup
 */
import { useState } from 'react';
import NewClubSetup from './NewClubSetup';

export default function LoginPage({ onLogin }) {
  const [screen, setScreen] = useState('signin'); // 'signin' | 'explore'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(() => {
    // Show Google OAuth errors from redirect
    const hash = window.location.hash || '';
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const googleError = params.get('error');
    return googleError ? `Google sign-in error: ${googleError}` : null;
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      localStorage.setItem('swoop_auth_token', data.token);
      localStorage.setItem('swoop_auth_user', JSON.stringify(data.user));
      localStorage.setItem('swoop_club_id', data.user.clubId);
      if (data.user.clubName) localStorage.setItem('swoop_club_name', data.user.clubName);

      onLogin?.(data.user);
    } catch (err) {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  };

  // New club setup mode
  const [showNewClub, setShowNewClub] = useState(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  const handleForgotPassword = async () => {
    if (!forgotEmail) { setForgotMessage('Please enter your email'); return; }
    setForgotLoading(true);
    setForgotMessage('');
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      setForgotMessage(data.message || 'Reset link sent. Check your email.');
    } catch {
      setForgotMessage('Connection error. Please try again.');
    }
    setForgotLoading(false);
  };

  // Demo mode state
  const [demoEmail, setDemoEmail] = useState('');
  const [demoPhone, setDemoPhone] = useState('');

  const startDemo = (guided = false) => {
    const demoClubId = `demo_${Date.now()}`;
    const demoUser = {
      userId: 'demo', clubId: demoClubId, name: 'Demo User',
      email: demoEmail || 'demo@swoopgolf.com',
      phone: demoPhone || '',
      role: 'gm', title: 'General Manager',
      isDemoSession: true,
    };
    localStorage.setItem('swoop_auth_user', JSON.stringify(demoUser));
    localStorage.setItem('swoop_auth_token', 'demo');
    localStorage.setItem('swoop_club_id', demoClubId);
    localStorage.setItem('swoop_club_name', 'Pinetree Country Club');
    if (demoEmail) localStorage.setItem('swoop_demo_email', demoEmail);
    if (demoPhone) localStorage.setItem('swoop_demo_phone', demoPhone);
    if (guided) {
      sessionStorage.setItem('swoop_demo_guided', 'true');
      sessionStorage.removeItem('swoop_demo_sources');
      sessionStorage.removeItem('swoop_demo_files');
      sessionStorage.removeItem('swoop_demo_gates');
      localStorage.setItem('swoop_was_guided', 'true');
      // Clear any stale persisted inbox from a prior 'demo' mode AppContext mount
      // on this same page load. Without this, the in-memory inbox keeps the
      // 15 demo actions that were preloaded before the user chose Guided Demo.
      localStorage.removeItem('swoop_agent_inbox');
    } else {
      sessionStorage.removeItem('swoop_demo_guided');
      localStorage.removeItem('swoop_was_guided');
    }
    // Notify AppContext (and any other listeners) that the data mode just
    // changed so they can re-evaluate the inbox / agents under the new gates.
    // For guided mode this CLEARS the inbox; for full demo it's a no-op refresh.
    try {
      window.dispatchEvent(new CustomEvent('swoop:demo-sources-changed', { detail: { action: 'mode-change', guided } }));
    } catch {}
    onLogin?.(demoUser);
  };

  if (showNewClub) {
    return <NewClubSetup onComplete={(user) => onLogin?.(user)} onBack={() => setShowNewClub(false)} />;
  }

  // ── Left brand panel (shared between both screens) ──
  const brandPanel = (
    <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #ff8b00 0%, #e67a00 50%, #cc6d00 100%)' }}
    >
      <div className="relative z-10 max-w-md px-12 text-white">
        <img src="/favicon.svg" alt="Swoop Golf" className="w-16 h-16 mb-6 brightness-0 invert" />
        <h1 className="text-4xl font-extrabold leading-tight mb-4">
          Club Intelligence<br />for General Managers
        </h1>
        <p className="text-lg text-white/80 leading-relaxed mb-8">
          Member health scores, staffing intelligence, and AI-powered playbooks — all from your existing club data.
        </p>
        <div className="flex flex-col gap-3 text-sm text-white/70">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">1</span>
            <span>Import your member roster in under 2 minutes</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">2</span>
            <span>See at-risk members and health scores instantly</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">3</span>
            <span>Connect more data sources to unlock full intelligence</span>
          </div>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />
    </div>
  );

  // ── Screen 1: Sign In ──
  if (screen === 'signin') {
    return (
      <div className="min-h-screen flex font-sans">
        {brandPanel}

        <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6 py-12">
          <div className="w-full max-w-[420px]">
            {/* Mobile-only logo */}
            <div className="text-center mb-8 lg:mb-10">
              <div className="flex items-center justify-center mb-3 lg:hidden">
                <img src="/favicon.svg" alt="Swoop Golf" className="w-12 h-12" />
              </div>
              <div className="text-[28px] font-extrabold text-gray-900">
                <span className="lg:hidden">Swoop Golf</span>
                <span className="hidden lg:inline">Welcome back</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                <span className="lg:hidden">Club Intelligence for General Managers</span>
                <span className="hidden lg:inline">Sign in to your club dashboard</span>
              </div>
            </div>

            {/* Google Sign-In — primary CTA */}
            <button
              onClick={() => { window.location.href = '/api/google/signin'; }}
              className="w-full py-3.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 000 24c0 3.77.9 7.35 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Sign in with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or sign in with email</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Email/password form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="login-email" className="text-[13px] font-semibold text-gray-700 block mb-1.5">Email</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@yourclub.com"
                  required
                  aria-required="true"
                  className="w-full h-12 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none box-border focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="text-[13px] font-semibold text-gray-700 block mb-1.5">Password</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  aria-required="true"
                  className="w-full h-12 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none box-border focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>

              {error && (
                <div className="px-3.5 py-2.5 rounded-lg bg-error-50 text-error-700 text-[13px] font-medium">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl border-none bg-brand-500 text-white text-sm font-bold transition-all hover:bg-brand-600 ${
                  loading ? 'cursor-wait opacity-70' : 'cursor-pointer opacity-100'
                }`}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Forgot password */}
            <div className="text-center mt-3">
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-brand-500 hover:text-brand-600 font-medium bg-transparent border-none cursor-pointer"
              >
                Forgot your password?
              </button>
            </div>

            {/* Forgot password form */}
            {showForgotPassword && (
              <div className="mt-4 p-4 rounded-xl border border-gray-200 bg-gray-50">
                <div className="text-sm font-semibold text-gray-700 mb-2">Reset your password</div>
                <p className="text-xs text-gray-500 mb-3">Enter your email and we'll send you a reset link.</p>
                <label htmlFor="forgot-email" className="sr-only">Account email</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="Your account email"
                  aria-required="true"
                  className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none box-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
                {forgotMessage && (
                  <div className={`mt-2 text-xs font-medium ${forgotMessage.includes('error') ? 'text-error-500' : 'text-success-600'}`}>
                    {forgotMessage}
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleForgotPassword}
                    disabled={forgotLoading}
                    className="px-4 py-2 rounded-lg bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 disabled:opacity-50 transition-colors"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <button
                    onClick={() => { setShowForgotPassword(false); setForgotMessage(''); }}
                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Explore without account */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              onClick={() => setScreen('explore')}
              className="w-full py-3 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-colors"
            >
              Explore without an account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Screen 2: Explore (Demo / Guided / New Club) ──
  return (
    <div className="min-h-screen flex font-sans">
      {brandPanel}

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-[420px]">
          {/* Mobile-only logo */}
          <div className="text-center mb-8 lg:mb-10">
            <div className="flex items-center justify-center mb-3 lg:hidden">
              <img src="/favicon.svg" alt="Swoop Golf" className="w-12 h-12" />
            </div>
            <div className="text-[28px] font-extrabold text-gray-900">
              Explore Swoop
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Try a demo or set up your club
            </div>
          </div>

          {/* Demo contact info */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="text-[13px] font-semibold text-gray-700">
              Enter your contact info to receive test emails and SMS:
            </div>
            <label htmlFor="demo-email" className="sr-only">Demo email</label>
            <input
              id="demo-email"
              type="email"
              value={demoEmail}
              onChange={e => setDemoEmail(e.target.value)}
              placeholder="Your email (for test emails)"
              className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none box-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            <label htmlFor="demo-phone" className="sr-only">Demo phone</label>
            <input
              id="demo-phone"
              type="tel"
              value={demoPhone}
              onChange={e => setDemoPhone(e.target.value)}
              placeholder="Your phone +1XXXXXXXXXX (for test SMS)"
              className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none box-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Demo options */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => startDemo(true)}
              className="w-full py-3.5 rounded-xl border-none bg-brand-500 text-white text-sm font-bold cursor-pointer hover:bg-brand-600 transition-colors"
            >
              Guided Demo
              <span className="block text-xs font-normal text-white/70 mt-0.5">Load data one source at a time</span>
            </button>

            <button
              onClick={() => startDemo(false)}
              className="w-full py-3 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-colors"
            >
              Full Demo (Pinetree CC)
              <span className="block text-xs font-normal text-gray-400 mt-0.5">All sample data pre-loaded</span>
            </button>

            <button
              onClick={() => setShowNewClub(true)}
              className="w-full py-3 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-colors"
            >
              Set Up New Club
              <span className="block text-xs font-normal text-gray-400 mt-0.5">Import your own member data</span>
            </button>

            {/* Conference Demo — phone-optimized scene navigator built on the
                existing mobile shell. Tap-to-enter, no login. Loads the
                full-demo dataset so the storyboard scenes have data.
                2026-04-09 wave 10. */}
            <button
              onClick={() => {
                // 2026-04-09 wave 12 fix: previous version called startDemo(false)
                // then setTimeout(() => set hash). That created a race where the
                // auth re-render routed to #/today FIRST and RouterViews (which
                // reads window.location.hash without subscribing to hashchange)
                // never re-evaluated for the deferred hash write.
                //
                // Fix: write the hash BEFORE startDemo so the mount of
                // RouterViews after the auth state change reads the correct
                // hash on its very first render. The Conference shell route
                // check (`#/m/conference`) is the first branch in RouterViews,
                // so as long as the hash is right at mount time, we land cleanly.
                if (typeof window !== 'undefined') {
                  window.location.hash = '#/m/conference';
                }
                startDemo(false);
              }}
              className="w-full py-3 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 text-sm font-semibold cursor-pointer hover:bg-purple-100 transition-colors"
              style={{ borderColor: '#c4b5fd', background: '#f5f3ff', color: '#6d28d9' }}
            >
              📱 Conference Demo (mobile)
              <span className="block text-xs font-normal mt-0.5" style={{ color: '#8b5cf6' }}>Phone-optimized · 3 storyboard scenes · best on a phone</span>
            </button>
          </div>

          {/* Back to sign in */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            onClick={() => setScreen('signin')}
            className="w-full py-2.5 rounded-xl border-none bg-transparent text-brand-500 text-sm font-semibold cursor-pointer hover:text-brand-600 transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
