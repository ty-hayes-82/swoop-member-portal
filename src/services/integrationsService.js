import { apiFetch } from './apiClient';
import { SYSTEMS } from '@/data/integrations';

let _d = null;

export const _init = async () => {
  try {
    const data = await apiFetch('/api/integrations');
    if (data) _d = data;
  } catch { /* keep static fallback */ }
};

export function getConnectedSystems() {
  if (!_d?.systems || _d.systems.length === 0) {
    return SYSTEMS.map(s => ({ ...s, status: 'available', lastSync: null }));
  }
  return SYSTEMS.map(s => {
    const live = _d.systems.find(ls => ls.id === s.id);
    return live ? { ...s, status: live.status, lastSync: live.lastSync } : { ...s, status: 'available', lastSync: null };
  });
}
