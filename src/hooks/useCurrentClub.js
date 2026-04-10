/**
 * useCurrentClub — single source of truth for current club ID in React components.
 *
 * Reads from AuthContext. Throws if called outside an authenticated route
 * (i.e. outside an AuthProvider). Returns the clubId string, or null if the
 * auth session has loaded but the user has no club assigned yet.
 *
 * Replaces ad-hoc `localStorage.getItem('swoop_club_id')` reads in components.
 * For non-React modules (services, utils) use `getClubId` from `@/services/apiClient`.
 */
import { useAuth } from '@/context/AuthContext';

export function useCurrentClub() {
  // useAuth already throws 'useAuth must be used within AuthProvider'
  // when called outside the provider, which satisfies the
  // "throws if called outside an authenticated route" requirement.
  const { clubId } = useAuth();
  return clubId;
}
