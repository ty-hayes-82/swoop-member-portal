import {
  cockpitItems as staticItems,
  sinceLastLogin as staticSinceLastLogin,
} from '@/data/cockpit';

let _d = null;

export const _init = async () => {
  try {
    const res = await fetch('/api/cockpit');
    if (res.ok) _d = await res.json();
  } catch {
    /* keep static fallback */
  }
};

export const getPriorityItems = () => _d?.priorities ?? staticItems;
export const getSinceLastLogin = () => _d?.sinceLastLogin ?? staticSinceLastLogin;
export const sourceSystems = ['CRM', 'POS', 'Weather', 'Tee Sheet', 'Complaints'];
