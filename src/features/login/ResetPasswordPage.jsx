/**
 * Reset Password Page — shown when user clicks the reset link from email.
 * Reads token from URL hash: /#/reset-password?token=xxx
 *
 * Uses TailAdmin-style centered layout: max-w-md mx-auto
 */
import { useState, useEffect } from 'react';

const inputClasses = 'h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:border-gray-700 dark:focus:border-brand-800';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(null);

  const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const token = hashParams.get('token');

  useEffect(() => {
    if (!token) { setValidating(false); return; }
    fetch(`/api/reset-password?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => setTokenValid(data.valid === true))
      .catch(() => setTokenValid(false))
      .finally(() => setValidating(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Reset failed'); setLoading(false); return; }
      setSuccess(true);
    } catch {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  };

  // ─── Loading state ───
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 font-sans">
        <div className="w-9 h-9 rounded-full border-[3px] border-gray-200 border-t-brand-500 animate-spin" />
      </div>
    );
  }

  // ─── Invalid token ───
  if (!token || tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 font-sans px-6">
        <div className="w-full max-w-md mx-auto text-center">
          <div className="text-2xl font-extrabold text-gray-800 dark:text-white/90 mb-2">Invalid Link</div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">This password reset link is invalid or has expired.</p>
          <a href="#/login" className="text-sm font-semibold text-brand-500 hover:text-brand-600 dark:text-brand-400">Back to Sign In</a>
        </div>
      </div>
    );
  }

  // ─── Success ───
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 font-sans px-6">
        <div className="w-full max-w-md mx-auto text-center">
          <div className="text-3xl mb-3">&#x2705;</div>
          <div className="text-2xl font-extrabold text-gray-800 dark:text-white/90 mb-2">Password Reset</div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Your password has been updated. You can now sign in with your new password.</p>
          <a
            href="#/login"
            onClick={() => {
              localStorage.removeItem('swoop_auth_user');
              localStorage.removeItem('swoop_auth_token');
              localStorage.removeItem('swoop_club_id');
            }}
            className="inline-block px-6 py-3 rounded-lg bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // ─── Reset form ───
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 font-sans px-6">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-3">
            <img src="/favicon.svg" alt="Swoop Golf" className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-white/90">Set New Password</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="new-password" className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">New Password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
              aria-required="true"
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              aria-required="true"
              className={inputClasses}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-error-50 border border-error-500/30 px-3.5 py-2.5 text-sm font-medium text-error-600 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-brand-500 text-white text-sm font-bold shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="text-center mt-5">
          <a href="#/login" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">Back to Sign In</a>
        </div>
      </div>
    </div>
  );
}
