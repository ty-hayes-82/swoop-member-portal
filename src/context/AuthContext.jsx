/**
 * Auth Context — Track 3, Item 12
 * Provides login/logout/session management across the app.
 * Consumes api/auth.js endpoints.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext(null);

const TOKEN_KEY = 'swoop_auth_token';
const USER_KEY = 'swoop_auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validate existing session on mount, and re-read on swoop:auth-changed so
  // the new-club wizard (which stores the post-signup user in localStorage
  // directly, without going through login()) flows through to the header and
  // anywhere else that consumes useCurrentClub / useAuth.
  useEffect(() => {
    let cancelled = false;
    const rehydrate = () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        if (!cancelled) { setUser(null); setLoading(false); }
        return;
      }
      // Fast path: if localStorage has a stored user, reflect it immediately
      // so the header updates without waiting for /api/auth to round-trip.
      try {
        const stored = localStorage.getItem(USER_KEY);
        if (stored && !cancelled) setUser(JSON.parse(stored));
      } catch { /* ignore */ }

      fetch('/api/auth', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => {
        if (res.ok) return res.json();
        throw new Error('Session expired');
      }).then(data => {
        if (cancelled) return;
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        if (data.user.clubId) localStorage.setItem('swoop_club_id', data.user.clubId);
        if (data.user.clubName) localStorage.setItem('swoop_club_name', data.user.clubName);
      }).catch(() => {
        if (cancelled) return;
        // Keep the locally-stored user if the auth endpoint is unavailable
        // (e.g. vercel dev cold-start) — only clear on explicit 401/expired.
      }).finally(() => { if (!cancelled) setLoading(false); });
    };
    rehydrate();
    window.addEventListener('swoop:auth-changed', rehydrate);
    return () => { cancelled = true; window.removeEventListener('swoop:auth-changed', rehydrate); };
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return false; }
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      if (data.user.clubId) localStorage.setItem('swoop_club_id', data.user.clubId);
      if (data.user.clubName) localStorage.setItem('swoop_club_name', data.user.clubName);
      setUser(data.user);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      fetch('/api/auth', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const isAuthenticated = !!user;
  const isGM = user?.role === 'gm';
  const clubId = user?.clubId || null;

  return (
    <AuthContext.Provider value={{ user, loading, error, isAuthenticated, isGM, clubId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Fallback: read user from localStorage when AuthProvider is not in the tree.
    // This keeps CsvImportPage and other consumers from crashing.
    try {
      const stored = localStorage.getItem('swoop_auth_user');
      const user = stored ? JSON.parse(stored) : null;
      return {
        user,
        loading: false,
        error: null,
        isAuthenticated: !!user,
        isGM: user?.role === 'gm',
        clubId: user?.clubId || null,
        login: async () => false,
        logout: async () => {},
      };
    } catch {
      return { user: null, loading: false, error: null, isAuthenticated: false, isGM: false, clubId: null, login: async () => false, logout: async () => {} };
    }
  }
  return ctx;
};
