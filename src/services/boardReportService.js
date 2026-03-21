import {
  kpis as staticKpis,
  memberSaves as staticMemberSaves,
  operationalSaves as staticOperationalSaves,
  monthlyTrends as staticMonthlyTrends,
} from '@/data/boardReport';

let _liveKpis = null;
let _liveBenchmarks = null;

export const _init = async () => {
  const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;
  if (!clubId) return;

  // Fetch live outcomes from track-outcomes
  try {
    const res = await fetch(`/api/dashboard-live?clubId=${clubId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.boardReportSummary) {
        _liveKpis = {
          membersSaved: data.boardReportSummary.membersSaved,
          duesProtected: data.boardReportSummary.duesProtected,
        };
      }
    }
  } catch {}

  // Fetch live benchmarks
  try {
    const res = await fetch(`/api/benchmarks-live?clubId=${clubId}`);
    if (res.ok) {
      _liveBenchmarks = await res.json();
    }
  } catch {}
};

export const getKPIs = () => {
  if (!_liveKpis) return staticKpis;
  // Merge live data into static structure
  return staticKpis.map(kpi => {
    if (kpi.label === 'Members Saved' && _liveKpis.membersSaved > 0) {
      return { ...kpi, value: _liveKpis.membersSaved };
    }
    if (kpi.label === 'Dues Protected' && _liveKpis.duesProtected > 0) {
      return { ...kpi, value: `$${Number(_liveKpis.duesProtected).toLocaleString()}` };
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
