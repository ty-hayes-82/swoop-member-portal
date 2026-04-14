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
let _liveMemberSaves = null;

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
    // Map recentInterventions → memberSaves shape for BoardReport
    if (data?.recentInterventions?.length > 0) {
      _liveMemberSaves = data.recentInterventions
        .filter(i => i.isSave || i.outcome === 'saved')
        .map(i => ({
          memberId: i.memberId,
          name: i.memberName,
          scoreBefore: i.scoreBefore,
          scoreAfter: i.scoreAfter,
          trigger: i.description,
          action: i.type,
          outcome: i.outcome === 'saved' ? 'Member retained after intervention' : i.outcome,
          duesAtRisk: i.duesProtected || 0,
        }));
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
  // Guided/demo mode uses the hand-authored static KPIs for storytelling.
  // Every other mode computes from real member data or shows empty state —
  // never spreads staticKpis (which contains hardcoded 87% / $375K fallbacks).
  if (getDataMode() === 'demo') {
    return _d?.kpis || staticKpis;
  }

  // Data-driven: if _d has KPIs from a live endpoint, use them directly.
  if (_d?.kpis) return _d.kpis;

  // Derive from member health data — honest live numbers.
  const summary = _getMemberSummary();
  if (summary.totalMembers > 0 || summary.total > 0) {
    const total = summary.totalMembers || summary.total;
    const healthy = summary.healthy || 0;
    const retentionPct = total > 0 ? Math.round((healthy / total) * 100) : 0;
    const liveRetained = _liveKpis?.membersSaved > 0 ? _liveKpis.membersSaved : healthy;
    return [
      { label: 'Members Retained', value: liveRetained, unit: 'members', prefix: '', suffix: '', color: 'success', description: `${total} total members tracked` },
      { label: 'Dues at Risk', value: Math.round((summary.potentialDuesAtRisk || 0) / 1000), unit: '$K', prefix: '$', suffix: 'K', color: 'warning', description: 'Annual dues from at-risk + critical members' },
      { label: 'Retention Rate', value: retentionPct, unit: '%', prefix: '', suffix: '%', color: retentionPct >= 80 ? 'success' : 'warning', description: 'Healthy members as % of total' },
      { label: 'At Risk', value: (summary.atRisk || 0) + (summary.critical || 0), unit: 'members', prefix: '', suffix: '', color: 'error', description: 'Members needing attention' },
    ];
  }

  // Brand-new authenticated club with no data yet — show "Awaiting data".
  return EMPTY_KPIS;
};

export const getMemberSaves = () => {
  if (_d?.memberSaves) return _d.memberSaves;
  if (_liveMemberSaves?.length > 0) return _liveMemberSaves;
  return isGateOpen() ? staticMemberSaves : [];
};
export const getOperationalSaves = () => {
  if (_d?.operationalSaves) return _d.operationalSaves;
  return isGateOpen() ? staticOperationalSaves : [];
};
export const getMonthlyTrends = () => {
  if (_d?.monthlyTrends) return _d.monthlyTrends;
  return isGateOpen() ? staticMonthlyTrends : [];
};
export const getDuesAtRiskNote = () => {
  if (_d?.duesAtRiskNote) return _d.duesAtRiskNote;
  return isGateOpen() ? staticDuesAtRiskNote : '';
};
export const sourceSystems = ['Member CRM', 'POS', 'Tee Sheet', 'Complaints'];

export const getLiveBenchmarks = () => _liveBenchmarks;
export const getLiveROI = () => _liveBenchmarks?.roi || null;
