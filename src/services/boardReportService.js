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
  // In guided mode, pipeline+members gets full static KPIs; members alone gets computed KPIs
  const mode = getDataMode();
  if (mode === 'guided') {
    if (shouldUseStatic('pipeline') && shouldUseStatic('members')) return staticKpis;
    // Fall through to build KPIs from member data if members gate is open
  }
  // Build KPIs from member health data (works for guided with members, demo, and real clubs)
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
  // Static KPIs require both pipeline AND members gates (need actual member data to be meaningful)
  if (!shouldUseStatic('pipeline') || !shouldUseStatic('members')) return EMPTY_KPIS;
  return staticKpis;
};

// Board report details — member saves need members, operational saves need complaints
// V20: filter saves by domain — dining/F&B saves require fb gate, complaint saves require complaints gate
const DINING_RE = /dining|grill room|f&b|food|beverage|chef|restaurant|kitchen|menu/i;
const COMPLAINT_RE = /complaint|dispute|unresolved|service request/i;
export const getMemberSaves = () => {
  if (!shouldUseStatic('members')) return [];
  if (getDataMode() !== 'guided') return staticMemberSaves;
  return staticMemberSaves.filter(s => {
    const text = `${s.trigger || ''} ${s.action || ''} ${s.outcome || ''}`;
    if (DINING_RE.test(text) && !shouldUseStatic('fb')) return false;
    if (COMPLAINT_RE.test(text) && !shouldUseStatic('complaints')) return false;
    return true;
  });
};
export const getOperationalSaves = () => (shouldUseStatic('members') && shouldUseStatic('complaints')) ? staticOperationalSaves : [];
export const getMonthlyTrends = () => shouldUseStatic('members') ? staticMonthlyTrends : [];
export const getDuesAtRiskNote = () => shouldUseStatic('members') ? staticDuesAtRiskNote : null;
export const sourceSystems = ['Member CRM', 'POS', 'Tee Sheet', 'Complaints'];

export const getLiveBenchmarks = () => _liveBenchmarks;
export const getLiveROI = () => _liveBenchmarks?.roi || null;
