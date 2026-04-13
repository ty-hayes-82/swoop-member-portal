import { apiFetch } from './apiClient';
import { isGateOpen, getDataMode } from './demoGate';
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
let _apiLoaded = false;
export const _init = async () => {
  _apiLoaded = true;
  try {
    const data = await apiFetch('/api/cockpit');
    if (data) _d = data;
  } catch {
    /* keep static fallback */
  }
};

// Keyword patterns for domain-specific gate filtering
const FB_PATTERN = /dining|F&B|Grill Room|POS|food|beverage/i;
const COMPLAINT_PATTERN = /complaint/i;

/**
 * Filter domain-specific signals/bullets from a cockpit item based on gate state.
 * Mutates nothing — returns a new item with filtered arrays.
 */
function gateFilterItem(item) {
  const hasFb = isGateOpen();
  const hasComplaints = isGateOpen();
  if (hasFb && hasComplaints) return item;

  const filterText = (text) => {
    if (!hasFb && FB_PATTERN.test(text)) return false;
    if (!hasComplaints && COMPLAINT_PATTERN.test(text)) return false;
    return true;
  };

  return {
    ...item,
    evidenceSignals: item.evidenceSignals?.filter(s => filterText(s.detail) && filterText(s.source)) ?? [],
    bullets: item.bullets?.filter(filterText) ?? [],
    stakes: filterText(item.stakes) ? item.stakes : item.stakes?.replace(FB_PATTERN, '').replace(/\s*\+\s*$/, '').replace(/^\s*\+\s*/, '').trim() || item.stakes,
  };
}

/** @returns {CockpitPriorityItem[]} */
export const getPriorityItems = () => {
  const raw = _d?.priorities ?? (isGateOpen() ? cockpitItems : []);
  return raw.map(gateFilterItem);
};
/** @returns {SinceLastLoginItem[]} */
export const getSinceLastLogin = () => {
  return _d?.sinceLastLogin ?? (isGateOpen() ? staticSinceLastLogin : []);
};
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
