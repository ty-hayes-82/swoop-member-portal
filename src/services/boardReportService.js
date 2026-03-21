import {
  kpis as staticKpis,
  memberSaves as staticMemberSaves,
  operationalSaves as staticOperationalSaves,
  monthlyTrends as staticMonthlyTrends,
} from '@/data/boardReport';

let _d = null;

export const _init = async () => {
  // Board report uses static data exclusively — DB records have name mismatches
  // that break the demo narrative (e.g., "Darryl Harrington" instead of "James Whitfield")
};

export const getKPIs = () => staticKpis;
export const getMemberSaves = () => staticMemberSaves;
export const getOperationalSaves = () => staticOperationalSaves;
export const getMonthlyTrends = () => staticMonthlyTrends;
export const sourceSystems = ['Member CRM', 'POS', 'Tee Sheet', 'Complaints'];
