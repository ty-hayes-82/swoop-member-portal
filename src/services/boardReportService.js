import { apiFetch, getClubId } from './apiClient';
import { isGateOpen, getDataMode } from './demoGate';
import { getMemberSummary as _getMemberSummary } from '@/services/memberService';
import {
  kpis as staticKpis,
  memberSaves as staticMemberSaves,
  operationalSaves as staticOperationalSaves,
  monthlyTrends as staticMonthlyTrends,
  duesAtRiskNote as staticDuesAtRiskNote,
} from '@/data/boardReport';

let _liveKpis = null;
let _liveBenchmarks = null;

let _d = null;

export const _init = async () => {
  const clubId = getClubId();
  if (!clubId) return;

  // Fetch live outcomes from track-outcomes
  try {
    const data = await apiFetch(`/api/dashboard-live?clubId=${clubId}`);
    if (data?.boardReportSummary && (data.boardReportSummary.membersSaved > 0 || data.boardReportSummary.duesProtected > 0)) {
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

const EMPTY_KPIS = [
  { label: 'Members Retained', value: 0, unit: 'members', description: 'Awaiting data' },
  { label: 'Dues Protected', value: 0, unit: '$', description: 'Awaiting data' },
  { label: 'Service Consistency', value: 0, unit: '%', description: 'Awaiting data' },
  { label: 'Operational Response', value: 0, unit: '%', description: 'Awaiting data' },
];

export const getKPIs = () => {
  if (_liveKpis) {
    if (_liveKpis.membersSaved > 0) {
      return staticKpis.map(kpi => {
        if (kpi.label === 'Members Retained') {
          return { ...kpi, value: _liveKpis.membersSaved };
        }
        return kpi;
      });
    }
    // Live mode with zero saves — show empty state, not fake demo KPIs
    return EMPTY_KPIS;
  }
  // Data-driven: if _d has KPIs, use them
  if (_d?.kpis) return _d.kpis;
  // Build KPIs from member health data (works for guided, demo, and real clubs)
  const summary = _getMemberSummary();
  if (summary.totalMembers > 0 || summary.total > 0) {
    const total = summary.totalMembers || summary.total;
    const healthy = summary.healthy || 0;
    const retentionPct = total > 0 ? Math.round((healthy / total) * 100) : 0;
    return [
      { label: 'Members Retained', value: healthy, unit: 'members', prefix: '', suffix: '', color: 'success', description: `${total} total members tracked` },
      { label: 'Dues at Risk', value: Math.round((summary.potentialDuesAtRisk || 0) / 1000), unit: '$K', prefix: '$', suffix: 'K', color: 'warning', description: 'Annual dues from at-risk + critical members' },
      { label: 'Retention Rate', value: retentionPct, unit: '%', prefix: '', suffix: '%', color: retentionPct >= 80 ? 'success' : 'warning', description: 'Healthy members as % of total' },
      { label: 'At Risk', value: (summary.atRisk || 0) + (summary.critical || 0), unit: 'members', prefix: '', suffix: '', color: 'error', description: 'Members needing attention' },
    ];
  }
  // No data available
  return EMPTY_KPIS;
};

const _isGuidedMode = () => getDataMode() === 'guided';
export const getMemberSaves = () => {
  if (_d?.memberSaves) return _d.memberSaves;
  // In guided mode, show static data when the pipeline gate is open
  return isGateOpen('pipeline') ? staticMemberSaves : [];
};
export const getOperationalSaves = () => {
  if (_d?.operationalSaves) return _d.operationalSaves;
  return isGateOpen('pipeline') ? staticOperationalSaves : [];
};
export const getMonthlyTrends = () => {
  if (_d?.monthlyTrends) return _d.monthlyTrends;
  return isGateOpen('pipeline') ? staticMonthlyTrends : [];
};
export const getDuesAtRiskNote = () => {
  if (_d?.duesAtRiskNote) return _d.duesAtRiskNote;
  return isGateOpen('pipeline') ? staticDuesAtRiskNote : '';
};
export const sourceSystems = ['Member CRM', 'POS', 'Tee Sheet', 'Complaints'];

export const getLiveBenchmarks = () => _liveBenchmarks;
export const getLiveROI = () => _liveBenchmarks?.roi || null;
