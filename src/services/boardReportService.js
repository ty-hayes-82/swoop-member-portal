import { apiFetch, getClubId } from './apiClient';
import {
  kpis as staticKpis,
  memberSaves as staticMemberSaves,
  operationalSaves as staticOperationalSaves,
  monthlyTrends as staticMonthlyTrends,
} from '@/data/boardReport';

let _liveKpis = null;
let _liveBenchmarks = null;

export const _init = async () => {
  const clubId = getClubId();
  if (!clubId) return;

  // Fetch live outcomes from track-outcomes
  try {
    const data = await apiFetch(`/api/dashboard-live?clubId=${clubId}`);
    if (data?.boardReportSummary) {
      _liveKpis = {
        membersSaved: data.boardReportSummary.membersSaved,
        duesProtected: data.boardReportSummary.duesProtected,
      };
    }
  } catch {}

  // Fetch live benchmarks
  try {
    const data = await apiFetch(`/api/benchmarks-live?clubId=${clubId}`);
    if (data) _liveBenchmarks = data;
  } catch {}
};

export const getKPIs = () => {
  if (!_liveKpis) return staticKpis;
  // Merge live data into static structure
  return staticKpis.map(kpi => {
    if (kpi.label === 'Members Retained' && _liveKpis.membersSaved > 0) {
      return { ...kpi, value: _liveKpis.membersSaved };
    }
    return kpi;
  });
};

export const getMemberSaves = () => staticMemberSaves;
export const getOperationalSaves = () => staticOperationalSaves;
export const getMonthlyTrends = () => staticMonthlyTrends;
export const sourceSystems = ['Member CRM', 'POS', 'Tee Sheet', 'Complaints'];

export const getLiveBenchmarks = () => _liveBenchmarks;
export const getLiveROI = () => _liveBenchmarks?.roi || null;
