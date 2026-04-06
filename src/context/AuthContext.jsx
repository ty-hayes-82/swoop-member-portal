/**
 * Auth Context — Track 3, Item 12
 * Provides login/logout/session management across the app.
 * Consumes api/auth.js endpoints.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

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

  // Validate existing session on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    fetch('/api/auth', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      if (res.ok) return res.json();
      throw new Error('Session expired');
    }).then(data => {
      setUser(data.user);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      if (data.user.clubId) localStorage.setItem('swoop_club_id', data.user.clubId);
      if (data.user.clubName) localStorage.setItem('swoop_club_name', data.user.clubName);
    }).catch(() => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
    }).finally(() => setLoading(false));
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
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
