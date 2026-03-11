import { useEffect } from 'react';
import { theme } from '@/config/theme';

export default function LandingRedirect() {
  useEffect(() => {
    // Redirect to standalone landing page after brief message
    const timer = setTimeout(() => {
      window.location.href = '/landing';
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: theme.fonts.sans,
        color: theme.colors.textPrimary,
      }}
    >
      <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '1rem' }}>
        Redirecting to Landing Page...
      </h1>
      <p style={{ fontSize: '1rem', color: theme.colors.textSecondary, marginBottom: '2rem' }}>
        The full landing page is available at{' '}
        <a
          href="/landing"
          style={{ color: theme.colors.accent, textDecoration: 'underline' }}
        >
          /landing
        </a>
      </p>
      <div
        style={{
          width: '40px',
          height: '40px',
          border: `3px solid ${theme.colors.accent}`,
          borderTop: '3px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
