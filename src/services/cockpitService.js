import { apiFetch } from './apiClient';
import { isSourceLoaded } from './demoGate';
import { cockpitItems, sinceLastLogin as staticSinceLastLogin } from '@/data/cockpit';

let _d = null;

export const _init = async () => {
  try {
    const data = await apiFetch('/api/cockpit');
    if (data) _d = data;
  } catch {
    /* keep static fallback */
  }
};

export const getPriorityItems = () => !isSourceLoaded('agents') ? [] : (_d?.priorities ?? cockpitItems);
export const getSinceLastLogin = () => !isSourceLoaded('agents') ? [] : (_d?.sinceLastLogin ?? staticSinceLastLogin);
export const sourceSystems = ['CRM', 'POS', 'Weather', 'Tee Sheet', 'Complaints'];
