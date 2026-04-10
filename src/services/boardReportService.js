import { apiFetch, getClubId } from './apiClient';
import { shouldUseStatic, getDataMode } from './demoGate';
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

// ── Guided data loader integration (Phase 1 — additive only) ──
// boardReportService doesn't use _d for static data, but we add merge/reset
// so the guided data loader can push board report data in Phase 2.
let _d = null;
import { registerService } from './guidedDataLoader';
export function _mergeData(partial) { _d = { ...(_d || {}), ...partial }; }
export function _resetData() { _d = null; }
registerService('boardReportService', { mergeData: _mergeData, resetData: _resetData });

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
    return staticKpis.map(kpi => {
      if (kpi.label === 'Members Retained' && _liveKpis.membersSaved > 0) {
        return { ...kpi, value: _liveKpis.membersSaved };
      }
      return kpi;
    });
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

// Board report details — data-driven from _d, with keyword filtering kept for guided mode
// (boardReport data merges as one blob under 'pipeline' gate, so we can't split saves by domain at the data layer)
const DINING_RE = /dining|grill room|f&b|food|beverage|chef|restaurant|kitchen|menu/i;
const COMPLAINT_RE = /complaint|dispute|unresolved|service request/i;
export const getMemberSaves = () => {
  const saves = _d?.memberSaves ?? (getDataMode() === 'guided' ? [] : staticMemberSaves);
  if (saves.length === 0) return [];
  // Behavioral filter: in guided mode, filter saves by domain keyword
  if (getDataMode() === 'guided') {
    return saves.filter(s => {
      const text = `${s.trigger || ''} ${s.action || ''} ${s.outcome || ''}`;
      if (DINING_RE.test(text) && !shouldUseStatic('fb')) return false;
      if (COMPLAINT_RE.test(text) && !shouldUseStatic('complaints')) return false;
      return true;
    });
  }
  return saves;
};
export const getOperationalSaves = () => _d?.operationalSaves ?? (getDataMode() === 'guided' ? [] : staticOperationalSaves);
export const getMonthlyTrends = () => _d?.monthlyTrends ?? (getDataMode() === 'guided' ? [] : staticMonthlyTrends);
export const getDuesAtRiskNote = () => _d?.duesAtRiskNote ?? (getDataMode() === 'guided' ? '' : staticDuesAtRiskNote);
export const sourceSystems = ['Member CRM', 'POS', 'Tee Sheet', 'Complaints'];

export const getLiveBenchmarks = () => _liveBenchmarks;
export const getLiveROI = () => _liveBenchmarks?.roi || null;
