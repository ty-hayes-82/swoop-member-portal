/**
 * Login Page — shown when user is not authenticated
 * Uses api/auth.js for token-based login
 */
import { useState } from 'react';
import { theme } from '@/config/theme';

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

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F8F9FA', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      <div style={{
        width: '100%', maxWidth: 400, padding: '40px',
        background: '#fff', borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid #E5E7EB',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F0F0F' }}>Swoop Golf</div>
          <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>Club Intelligence for General Managers</div>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="sarah@oakmonthills.com"
              required
              style={{
                width: '100%', padding: '10px 14px', fontSize: '14px',
                border: '1px solid #E5E7EB', borderRadius: '10px',
                outline: 'none', boxSizing: 'border-box',
                background: '#F9FAFB',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              style={{
                width: '100%', padding: '10px 14px', fontSize: '14px',
                border: '1px solid #E5E7EB', borderRadius: '10px',
                outline: 'none', boxSizing: 'border-box',
                background: '#F9FAFB',
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: '10px',
              background: '#FEE2E2', color: '#991B1B',
              fontSize: '13px', fontWeight: 500,
            }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px', borderRadius: '10px', border: 'none',
              background: '#F3922D', color: '#fff', fontSize: '14px',
              fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
        </div>

        {/* Demo mode */}
        {showDemoSetup && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
              Enter your contact info to receive test emails and SMS during demo:
            </div>
            <input
              type="email"
              value={demoEmail}
              onChange={e => setDemoEmail(e.target.value)}
              placeholder="Your email (for test emails)"
              style={{
                width: '100%', padding: '10px 14px', fontSize: '14px',
                border: '1px solid #E5E7EB', borderRadius: '10px',
                outline: 'none', boxSizing: 'border-box', background: '#F9FAFB',
              }}
            />
            <input
              type="tel"
              value={demoPhone}
              onChange={e => setDemoPhone(e.target.value)}
              placeholder="Your phone +1XXXXXXXXXX (for test SMS)"
              style={{
                width: '100%', padding: '10px 14px', fontSize: '14px',
                border: '1px solid #E5E7EB', borderRadius: '10px',
                outline: 'none', boxSizing: 'border-box', background: '#F9FAFB',
              }}
            />
          </div>
        )}

        <button
          onClick={handleDemoLogin}
          style={{
            width: '100%', padding: '12px', borderRadius: '10px',
            border: '1px solid #E5E7EB', background: '#fff',
            color: '#374151', fontSize: '14px', fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {showDemoSetup ? 'Start Demo' : 'Enter Demo Mode (Oakmont Hills CC)'}
        </button>

        {/* Test account hint */}
        <div style={{
          marginTop: '20px', padding: '12px 14px', borderRadius: '10px',
          background: '#F0F9FF', border: '1px solid #BAE6FD',
          fontSize: '12px', color: '#0369A1', lineHeight: 1.5,
        }}>
          <strong>Test account:</strong> sarah@oakmonthills.com / any password
          <br />
          <strong>Demo mode:</strong> Uses static sample data — enter your email/phone to receive test notifications
        </div>
      </div>
    </div>
  );
}
