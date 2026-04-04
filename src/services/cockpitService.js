import { apiFetch } from './apiClient';
import {
  cockpitItems as staticItems,
  sinceLastLogin as staticSinceLastLogin,
} from '@/data/cockpit';
import { useStaticData } from '@/config/constants';

let _d = null;

export const _init = async () => {
  try {
    const data = await apiFetch('/api/cockpit');
    if (data) _d = data;
  } catch {
    /* keep static fallback */
  }
};

export const getPriorityItems = () => _d?.priorities ?? (useStaticData() ? staticItems : []);
export const getSinceLastLogin = () => _d?.sinceLastLogin ?? (useStaticData() ? staticSinceLastLogin : {});
export const sourceSystems = ['CRM', 'POS', 'Weather', 'Tee Sheet', 'Complaints'];
