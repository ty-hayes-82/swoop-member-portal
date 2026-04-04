/**
 * Login Page — shown when user is not authenticated
 * Uses api/auth.js for token-based login
 */
import { useState } from 'react';
import NewClubSetup from './NewClubSetup';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
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

      // Store session
      localStorage.setItem('swoop_auth_token', data.token);
      localStorage.setItem('swoop_auth_user', JSON.stringify(data.user));
      localStorage.setItem('swoop_club_id', data.user.clubId);

      onLogin?.(data.user);
    } catch (err) {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  };

  // New club setup mode
  const [showNewClub, setShowNewClub] = useState(false);

  // Demo mode state
  const [showDemoSetup, setShowDemoSetup] = useState(false);
  const [demoEmail, setDemoEmail] = useState('');
  const [demoPhone, setDemoPhone] = useState('');

  const handleDemoLogin = () => {
    if (!showDemoSetup) {
      setShowDemoSetup(true);
      return;
    }
    const demoUser = {
      userId: 'demo', clubId: 'demo', name: 'Demo User',
      email: demoEmail || 'demo@swoopgolf.com',
      phone: demoPhone || '',
      role: 'gm', title: 'General Manager',
    };
    localStorage.setItem('swoop_auth_user', JSON.stringify(demoUser));
    if (demoEmail) localStorage.setItem('swoop_demo_email', demoEmail);
    if (demoPhone) localStorage.setItem('swoop_demo_phone', demoPhone);
    localStorage.removeItem('swoop_club_id');
    onLogin?.(demoUser);
  };

  if (showNewClub) {
    return <NewClubSetup onComplete={(user) => onLogin?.(user)} onBack={() => setShowNewClub(false)} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
      <div className="w-full max-w-[400px] rounded-2xl border border-gray-200 bg-white p-10 shadow-theme-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-[28px] font-extrabold text-gray-900">Swoop Golf</div>
          <div className="text-sm text-gray-500 mt-1">Club Intelligence for General Managers</div>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="sarah@oakmonthills.com"
              required
              className="w-full h-11 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none box-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="w-full h-11 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none box-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {error && (
            <div className="px-3.5 py-2.5 rounded-lg bg-error-50 text-error-700 text-[13px] font-medium">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg border-none bg-brand-500 text-white text-sm font-bold ${
              loading ? 'cursor-wait opacity-70' : 'cursor-pointer opacity-100'
            }`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Demo mode */}
        {showDemoSetup && (
          <div className="flex flex-col gap-3 mb-3">
            <div className="text-[13px] font-semibold text-gray-700">
              Enter your contact info to receive test emails and SMS during demo:
            </div>
            <input
              type="email"
              value={demoEmail}
              onChange={e => setDemoEmail(e.target.value)}
              placeholder="Your email (for test emails)"
              className="w-full h-11 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none box-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            <input
              type="tel"
              value={demoPhone}
              onChange={e => setDemoPhone(e.target.value)}
              placeholder="Your phone +1XXXXXXXXXX (for test SMS)"
              className="w-full h-11 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none box-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        )}

        <button
          onClick={handleDemoLogin}
          className="w-full py-3 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-semibold cursor-pointer"
        >
          {showDemoSetup ? 'Start Demo' : 'Enter Demo Mode (Oakmont Hills CC)'}
        </button>

        {/* Set up new club */}
        <button
          onClick={() => setShowNewClub(true)}
          className="w-full py-3 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-semibold cursor-pointer mt-2"
        >
          Set Up New Club
        </button>

        {/* Test account hint */}
        <div className="mt-5 px-3.5 py-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700 leading-relaxed">
          <strong>Test account:</strong> sarah@oakmonthills.com / any password
          <br />
          <strong>Demo mode:</strong> Uses static sample data — enter your email/phone to receive test notifications
        </div>
      </div>
    </div>
  );
}
