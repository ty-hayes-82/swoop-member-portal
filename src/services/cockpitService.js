import { apiFetch } from './apiClient';

let _d = null;

export const _init = async () => {
  try {
    const data = await apiFetch('/api/cockpit');
    if (data) _d = data;
  } catch {
    /* keep empty fallback */
  }
};

export const getPriorityItems = () => _d?.priorities ?? [];
export const getSinceLastLogin = () => _d?.sinceLastLogin ?? {};
export const sourceSystems = ['CRM', 'POS', 'Weather', 'Tee Sheet', 'Complaints'];
