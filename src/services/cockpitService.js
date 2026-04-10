import { apiFetch } from './apiClient';
import { shouldUseStatic } from './demoGate';
import { cockpitItems, sinceLastLogin as staticSinceLastLogin } from '@/data/cockpit';
import { useServiceCache } from '@/hooks/useServiceCache';

/**
 * @typedef {Object} CockpitPriorityItem
 * @property {number} priority
 * @property {string} urgency                  'urgent' | 'high' | 'medium' | ...
 * @property {string} questionDomain
 * @property {string} questionLabel
 * @property {string} icon
 * @property {string} headline
 * @property {string} recommendation
 * @property {Array<{source:string,detail:string}>} evidenceSignals
 * @property {string[]} bullets
 * @property {string} stakes
 * @property {string} [memberName]
 * @property {string} [memberId]
 * @property {string} [context]
 * @property {string} [linkLabel]
 * @property {string} [linkKey]
 * @property {Object} [meta]
 */

/**
 * @typedef {Object} SinceLastLoginItem
 * @property {string} [icon]
 * @property {string} [label]
 * @property {string} [detail]
 */

let _d = null;

export const _init = async () => {
  try {
    const data = await apiFetch('/api/cockpit');
    if (data) _d = data;
  } catch {
    /* keep static fallback */
  }
};

// Priority items reference members — require both agents AND members gates
/** @returns {CockpitPriorityItem[]} */
export const getPriorityItems = () => _d?.priorities ?? (shouldUseStatic('agents') && shouldUseStatic('members') ? cockpitItems : []);
/** @returns {SinceLastLoginItem[]} */
export const getSinceLastLogin = () => _d?.sinceLastLogin ?? (shouldUseStatic('agents') && shouldUseStatic('members') ? staticSinceLastLogin : []);
export const sourceSystems = ['CRM', 'POS', 'Weather', 'Tee Sheet', 'Complaints'];

// ─── React hook (useServiceCache migration — SHIP_PLAN §2.3) ────────────

/**
 * useCockpitData — React hook wrapping /api/cockpit via useServiceCache.
 * Returns {data, isLoading, error, refetch} where `data` is
 * { priorities: CockpitPriorityItem[], sinceLastLogin: SinceLastLoginItem[] }.
 * Scoped by clubId so switching tenants invalidates the cache automatically.
 */
export function useCockpitData() {
  const { data, isLoading, error, refetch } = useServiceCache(
    'cockpit',
    () => apiFetch('/api/cockpit'),
    { clubIdScoped: true },
  );
  return {
    data: data
      ? {
          priorities: data.priorities ?? [],
          sinceLastLogin: data.sinceLastLogin ?? [],
        }
      : null,
    isLoading,
    error,
    refetch,
  };
}
