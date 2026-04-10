import { apiFetch } from './apiClient';
import { SYSTEMS } from '@/data/integrations';
import { getDataMode, shouldUseStatic } from './demoGate';
import { useServiceCache } from '@/hooks/useServiceCache';

/**
 * @typedef {Object} IntegrationSystem
 * @property {string} id
 * @property {string} [name]
 * @property {string} [category]
 * @property {'connected'|'available'|'error'|string} status
 * @property {string|null} lastSync            ISO timestamp or null
 */

let _d = null;

export const _init = async () => {
  try {
    const data = await apiFetch('/api/integrations');
    if (data) _d = data;
  } catch { /* keep static fallback */ }
};

// Map system category to the demo gate that controls it
const CATEGORY_GATE = {
  'tee-sheet': 'tee-sheet',
  'pos': 'fb',
  'crm': 'members',
  'staffing': 'weather',
  'waitlist': 'tee-sheet',
  'analytics': null, // no gate — always shown
};

/** @returns {IntegrationSystem[]} */
export function getConnectedSystems() {
  let systems;
  if (!_d?.systems || _d.systems.length === 0) {
    systems = SYSTEMS.map(s => ({ ...s, status: 'available', lastSync: null }));
  } else {
    systems = SYSTEMS.map(s => {
      const live = _d.systems.find(ls => ls.id === s.id);
      return live ? { ...s, status: live.status, lastSync: live.lastSync } : { ...s, status: 'available', lastSync: null };
    });
  }
  // In guided mode, override status based on whether the gate is open
  if (getDataMode() === 'guided') {
    systems = systems.map(s => {
      const gateId = CATEGORY_GATE[s.category];
      if (gateId && !shouldUseStatic(gateId)) {
        return { ...s, status: 'available', lastSync: null };
      }
      return s;
    });
  }
  return systems;
}

/**
 * Merge raw /api/integrations response into the SYSTEMS catalog. Pulled out
 * so both the legacy getConnectedSystems() and the new hook can share logic.
 */
function mergeSystems(raw) {
  if (!raw?.systems || raw.systems.length === 0) {
    return SYSTEMS.map(s => ({ ...s, status: 'available', lastSync: null }));
  }
  return SYSTEMS.map(s => {
    const live = raw.systems.find(ls => ls.id === s.id);
    return live ? { ...s, status: live.status, lastSync: live.lastSync } : { ...s, status: 'available', lastSync: null };
  });
}

/**
 * useIntegrationsData — React hook wrapping /api/integrations via useServiceCache.
 * Returns {data, isLoading, error, refetch} where `data` is the merged
 * IntegrationSystem[] list. Scoped by clubId so switching tenants invalidates
 * the cache automatically. Unlike getConnectedSystems(), consumers get a real
 * isLoading flag during the fetch instead of the static SYSTEMS fallback.
 */
export function useIntegrationsData() {
  const { data, isLoading, error, refetch } = useServiceCache(
    'integrations',
    () => apiFetch('/api/integrations'),
    { clubIdScoped: true },
  );
  return {
    data: data ? mergeSystems(data) : null,
    isLoading,
    error,
    refetch,
  };
}

