/**
 * useCurrentClub — single source of truth for current club ID in React components.
 *
 * Returns the clubId string, or null when:
 *   - called outside AuthProvider (e.g. LandingPage, public routes)
 *   - the auth session has loaded but the user has no club assigned yet
 *
 * Replaces ad-hoc `localStorage.getItem('swoop_club_id')` reads in components.
 * For non-React modules (services, utils) use `getClubId` from `@/services/apiClient`.
 */
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

export function useCurrentClub() {
  const ctx = useContext(AuthContext);
  return ctx?.clubId ?? null;
}
