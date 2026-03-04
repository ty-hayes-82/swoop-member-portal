import { useNavigationContext } from '@/context/NavigationContext';

/**
 * useNavigation — current route, navigate fn, sidebar state, page meta
 */
export function useNavigation() {
  return useNavigationContext();
}
