import { apiFetch } from './apiClient';
import { shouldUseStatic } from './demoGate';
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

// Priority items reference members — require both agents AND members gates
export const getPriorityItems = () => _d?.priorities ?? (shouldUseStatic('agents') && shouldUseStatic('members') ? cockpitItems : []);
export const getSinceLastLogin = () => _d?.sinceLastLogin ?? (shouldUseStatic('agents') && shouldUseStatic('members') ? staticSinceLastLogin : []);
export const sourceSystems = ['CRM', 'POS', 'Weather', 'Tee Sheet', 'Complaints'];
