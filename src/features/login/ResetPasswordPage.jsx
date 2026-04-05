/**
 * Reset Password Page — shown when user clicks the reset link from email.
 * Reads token from URL hash: /#/reset-password?token=xxx
 */
import { useState } from 'react';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Extract token from hash: /#/reset-password?token=xxx
  const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const token = hashParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Reset failed');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  };

  const inputClasses = "w-full h-11 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10";

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="w-full max-w-[400px] rounded-2xl border border-gray-200 bg-white p-10 shadow-theme-lg text-center">
          <div className="text-2xl font-extrabold text-gray-800 mb-2">Invalid Link</div>
          <p className="text-sm text-gray-500 mb-6">This password reset link is missing or invalid.</p>
          <a href="/#/login" className="text-sm font-semibold text-brand-500 hover:text-brand-600">Back to Sign In</a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="w-full max-w-[400px] rounded-2xl border border-gray-200 bg-white p-10 shadow-theme-lg text-center">
          <div className="text-3xl mb-3">&#x2705;</div>
          <div className="text-2xl font-extrabold text-gray-800 mb-2">Password Reset</div>
          <p className="text-sm text-gray-500 mb-6">Your password has been updated. You can now sign in with your new password.</p>
          <a
            href="/#/login"
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
      <div className="w-full max-w-[400px] rounded-2xl border border-gray-200 bg-white p-10 shadow-theme-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-500">
              <span className="text-xl font-bold text-white">S</span>
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-800">Set New Password</div>
          <div className="text-sm text-gray-500 mt-1">Enter your new password below.</div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
              className={inputClasses}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              className={inputClasses}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-error-50 border border-error-500/30 px-3.5 py-2.5 text-sm font-medium text-error-600">
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

        <div className="text-center mt-4">
          <a href="/#/login" className="text-sm text-gray-500 hover:text-gray-700">Back to Sign In</a>
        </div>
      </div>
    </div>
  );
}
