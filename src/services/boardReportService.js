import {
  kpis as staticKpis,
  memberSaves as staticMemberSaves,
  operationalSaves as staticOperationalSaves,
  monthlyTrends as staticMonthlyTrends,
} from '@/data/boardReport';

let _d = null;

export const _init = async () => {
  try {
    const res = await fetch('/api/board-report');
    if (res.ok) _d = await res.json();
  } catch {
    /* keep static fallback */
  }
};

export const getKPIs = () => _d?.kpis ?? staticKpis;
export const getMemberSaves = () => _d?.memberSaves ?? staticMemberSaves;
export const getOperationalSaves = () => _d?.operationalSaves ?? staticOperationalSaves;
export const getMonthlyTrends = () => _d?.monthlyTrends ?? staticMonthlyTrends;
export const sourceSystems = ['Member CRM', 'POS', 'Tee Sheet', 'Complaints'];
