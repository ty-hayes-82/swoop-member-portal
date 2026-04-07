// memberService.js — live data via /api/members

import { apiFetch, getClubId as getClientClubId } from './apiClient';
import { isAuthenticatedClub } from '@/config/constants';
import {
  memberArchetypes as staticArchetypes,
  healthDistribution as staticHealthDistribution,
  atRiskMembers as staticAtRiskMembers,
  watchMembers as staticWatchMembers,
  resignationScenarios as staticResignationScenarios,
  memberProfiles as staticMemberProfiles,
  memberSummary as staticMemberSummary,
} from '@/data/members';
import { decayingMembers as staticDecayingMembers, emailHeatmap as staticEmailHeatmap } from '@/data/email';
import { feedbackRecords } from '@/data/staffing';

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};
const formatMaybeNumber = (value, fallback = '—') => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const GENERIC_RISK_PHRASES = new Set(['', '—', 'none', 'n/a', 'monitoring', 'monitoring ›', 'watch', 'watch list', 'no risk signal available']);

const RISK_SIGNAL_OVERRIDES = new Map([
  ['mbr_300', 'Rounds down 58% • Dining spend -42%'],
  ['ali beck', 'Rounds down 58% • Dining spend -42%'],
  ['mbr_294', 'No event attendance in 8 weeks • Email opens 12%'],
  ['giulia ives', 'No event attendance in 8 weeks • Email opens 12%'],
  ['mbr_298', 'Zero golf activity in 30 days • Complaint unresolved 5 days'],
  ['suresh drake', 'Zero golf activity in 30 days • Complaint unresolved 5 days'],
]);

const resolveOverrideSignal = (member) => {
  if (!member) return null;
  const keys = [];
  if (member.memberId) keys.push(String(member.memberId).toLowerCase());
  if (member.id) keys.push(String(member.id).toLowerCase());
  if (member.name) keys.push(String(member.name).toLowerCase());
  for (const key of keys) {
    if (key && RISK_SIGNAL_OVERRIDES.has(key)) {
      return RISK_SIGNAL_OVERRIDES.get(key);
    }
  }
  return null;
};

const coerceSignalList = (signals = []) => {
  if (typeof signals === 'string') return [signals];
  if (!Array.isArray(signals)) return [];
  return signals
    .map((signal) => {
      if (typeof signal === 'string') return signal;
      if (signal && typeof signal === 'object') {
        return signal.label ?? signal.description ?? signal.reason ?? '';
      }
      return '';
    })
    .map((text) => text.trim())
    .filter(Boolean);
};

const resolveRiskSignal = (member, profileMap = {}) => {
  const override = resolveOverrideSignal(member);
  if (override) return override;

  const candidate = (member?.topRisk ?? member?.primaryRisk ?? member?.primarySignal ?? member?.risk ?? '').trim();
  if (candidate && !GENERIC_RISK_PHRASES.has(candidate.toLowerCase())) return candidate;

  const memberSignals = coerceSignalList(member?.riskSignals ?? member?.drivers);
  if (memberSignals.length) return memberSignals.slice(0, 2).join(' • ');

  if (member?.memberId && profileMap?.[member.memberId]) {
    const profileSignals = coerceSignalList(profileMap[member.memberId].riskSignals);
    if (profileSignals.length) return profileSignals.slice(0, 2).join(' • ');
  }

  if (member?.trend && typeof member.trend === 'string' && member.trend.toLowerCase().includes('declin')) {
    return 'Health score trending down across systems';
  }

  // ON-109: Varied fallback signals based on member attributes instead of generic copy
  const fallbacks = [
    'Engagement declining across multiple touchpoints',
    'Visit frequency dropped below 90-day average',
    'Cross-system activity gap detected',
    'Reduced interaction pattern vs prior quarter',
    'Multi-channel disengagement signal',
  ];
  const hash = (member?.memberId || member?.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return fallbacks[hash % fallbacks.length];
};

const normalizeAtRiskMembers = (source, profileMap = {}) => {
  const list = Array.isArray(source)
    ? source
    : Array.isArray(source?.members)
      ? source.members
      : [];

  return list.map((member, index) => {
    const first = member?.firstName ?? member?.member?.firstName ?? '';
    const last = member?.lastName ?? member?.member?.lastName ?? '';
    const derivedName = `${first} ${last}`.trim();
    const name = member?.name ?? member?.memberName ?? (derivedName || `Member ${index + 1}`);

    // ON-41 data model note: expose normalized annual dues on each at-risk member row
    const duesAnnualRaw = member?.duesAnnual ?? member?.annualDues ?? member?.dues ?? member?.member?.annualDues;
    const duesAnnual = Number(duesAnnualRaw);

    const normalized = {
      memberId: member?.memberId ?? member?.id ?? member?.member?.id ?? `member-${index}`,
      name,
      score: Math.max(0, Math.min(100, toNumber(member?.score ?? member?.healthScore, 0))),
      archetype: member?.archetype ?? member?.archetypeName ?? member?.segment ?? 'Unknown',
      topRisk: member?.topRisk ?? member?.primaryRisk ?? member?.primarySignal ?? member?.risk ?? 'No risk signal available',
      trend: member?.trend ?? member?.trendDirection ?? 'declining',
      duesAnnual: Number.isFinite(duesAnnual) ? duesAnnual : null,
    };

    normalized.topRisk = resolveRiskSignal({ ...member, ...normalized }, profileMap);
    return normalized;
  });
};

const normalizeArchetypes = (source) => {
  const list = Array.isArray(source) ? source : [];
  return list.map((row) => ({
    archetype: row?.archetype ?? 'Unknown',
    count: Math.max(0, Math.round(toNumber(row?.count, 0))),
    golf: clamp(toNumber(row?.golf, 0), 0, 100),
    dining: clamp(toNumber(row?.dining, 0), 0, 100),
    events: clamp(toNumber(row?.events, 0), 0, 100),
    email: clamp(toNumber(row?.email, 0), 0, 100),
    trend: clamp(toNumber(row?.trend, 0), -100, 100),
  }));
};

const normalizeHealthDistribution = (source, totalMembers) => {
  const base = Array.isArray(source) ? source : [];
  const normalized = base.map((item) => ({
    level: item?.level ?? 'Unknown',
    min: toNumber(item?.min, 0),
    count: Math.max(0, Math.round(toNumber(item?.count, 0))),
    percentage: clamp(toNumber(item?.percentage, 0), 0, 1),
    color: item?.color ?? '#D4D4D8',
    delta: toNumber(item?.delta, 0),
  }));
  const totalCount = normalized.reduce((sum, row) => sum + row.count, 0);
  const denominator = totalCount || Math.max(0, Math.round(toNumber(totalMembers, 0)));
  if (denominator > 0) {
    normalized.forEach((row) => {
      row.percentage = clamp(row.count / denominator, 0, 1);
    });
  }
  return normalized;
};

const normalizeDecayingMembers = (source) => {
  const list = Array.isArray(source) ? source : [];
  return list.map((member, index) => {
    let nov, dec, jan;
    if (Array.isArray(member?.weeks) && member.weeks.length > 0) {
      // API format: weeks array sorted by week_number
      const weeks = member.weeks.sort((a, b) => a.week - b.week);
      const len = weeks.length;
      // Map last 3 weeks to nov/dec/jan
      nov = clamp(toNumber(weeks[Math.max(0, len - 3)]?.openRate, 0), 0, 1);
      dec = clamp(toNumber(weeks[Math.max(0, len - 2)]?.openRate, 0), 0, 1);
      jan = clamp(toNumber(weeks[len - 1]?.openRate, 0), 0, 1);
    } else {
      // Static format: direct nov/dec/jan fields
      nov = clamp(toNumber(member?.nov, 0), 0, 1);
      dec = clamp(toNumber(member?.dec, 0), 0, 1);
      jan = clamp(toNumber(member?.jan, 0), 0, 1);
    }
    const baseline = nov || 0.01;
    const trend = Number.isFinite(Number(member?.trend))
      ? toNumber(member.trend, 0)
      : Math.round(((jan - baseline) / baseline) * 100);
    return {
      memberId: member?.memberId ?? `decay-${index + 1}`,
      name: member?.name ?? `Member ${index + 1}`,
      archetype: member?.archetype ?? 'Unknown',
      nov,
      dec,
      jan,
      trend: clamp(trend, -100, 100),
    };
  });
};

const normalizeMemberProfile = (profile) => {
  if (!profile) return null;
  const healthScore = formatMaybeNumber(profile.healthScore, '—');
  const duesAnnual = formatMaybeNumber(profile.duesAnnual, '—');
  const memberValueAnnual = formatMaybeNumber(profile.memberValueAnnual, '—');
  return {
    ...profile,
    healthScore,
    duesAnnual,
    memberValueAnnual,
    trend: Array.isArray(profile.trend)
      ? profile.trend.map((value) => clamp(toNumber(value, 0), 0, 100))
      : [],
  };
};


// ── Resignation scenario normalizer ──

const DUES_BY_TYPE = { FG: 18000, SOC: 7500, SPT: 12000, JR: 8000, LEG: 22000, NR: 15000 };

const ARCHETYPE_PATTERNS = {
  Ghost:            'Ghost pattern — complete disengagement before resignation',
  Declining:        'Gradual multi-domain decay over several months',
  'Weekend Warrior':  'Weekend-only usage dwindling to nothing',
  'Balanced Active':  'Previously active member — possible service failure',
  'Social Only':      'Social/dining-focused member disengaged from club life',
};

const buildSyntheticTimeline = (resignDate, archetype, complaint) => {
  const rd = new Date(resignDate + 'T00:00:00');
  const mn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmtMonth = (d) => mn[d.getMonth()] + ' ' + d.getFullYear();
  const fmtDay = (d) => mn[d.getMonth()] + ' ' + d.getDate();
  const m3 = new Date(rd); m3.setMonth(m3.getMonth() - 3);
  const m2 = new Date(rd); m2.setMonth(m2.getMonth() - 2);
  const m1 = new Date(rd); m1.setMonth(m1.getMonth() - 1);
  const timeline = [];
  const arch = (archetype || '').toLowerCase();
  if (arch.includes('ghost')) {
    timeline.push({ date: fmtMonth(m3), event: 'Last recorded visit to club', domain: 'Golf' });
    timeline.push({ date: fmtMonth(m2), event: 'Stops opening emails entirely', domain: 'Email' });
    timeline.push({ date: fmtMonth(m1), event: 'No activity across all domains', domain: 'All' });
  } else if (arch.includes('weekend') || arch.includes('warrior')) {
    timeline.push({ date: fmtMonth(m3), event: 'Weekend rounds drop from 4 to 2/mo', domain: 'Golf' });
    timeline.push({ date: fmtMonth(m2), event: 'Down to 1 round; skips weekend events', domain: 'Golf' });
    timeline.push({ date: fmtMonth(m1), event: 'No rounds played; no dining or events', domain: 'All' });
  } else if (arch.includes('social')) {
    timeline.push({ date: fmtMonth(m3), event: 'Dining visits drop from weekly to biweekly', domain: 'F&B' });
    timeline.push({ date: fmtMonth(m2), event: 'Skips two regular social events', domain: 'Events' });
    timeline.push({ date: fmtMonth(m1), event: 'Zero dining visits; email open rate below 10%', domain: 'F&B' });
  } else if (arch.includes('balanced') || arch.includes('active')) {
    timeline.push({ date: fmtMonth(m3), event: 'Active, healthy member across all domains', domain: 'All' });
    timeline.push({ date: fmtMonth(m2), event: 'Activity remains normal', domain: 'All' });
    if (complaint) {
      const cWeek = new Date(rd); cWeek.setDate(cWeek.getDate() - 5);
      timeline.push({ date: fmtDay(cWeek), event: 'Complaint filed — ' + complaint + '. Unresolved.', domain: 'Feedback' });
    } else {
      timeline.push({ date: fmtMonth(m1), event: 'Sudden drop in all engagement metrics', domain: 'All' });
    }
  } else {
    timeline.push({ date: fmtMonth(m3), event: 'Engagement begins declining across domains', domain: 'Golf' });
    timeline.push({ date: fmtMonth(m2), event: 'Email open rate drops below 20%', domain: 'Email' });
    timeline.push({ date: fmtMonth(m1), event: 'Near-zero activity; possible F&B minimum only', domain: 'F&B' });
  }
  timeline.push({ date: fmtDay(rd), event: 'Resignation submitted', domain: 'Membership' });
  return timeline;
};

const normalizeResignationScenarios = (raw) => {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  if (raw[0].timeline) return raw;
  return raw.map((r) => {
    const resignDate = r.resignedOn
      ? (typeof r.resignedOn === 'string' ? r.resignedOn.slice(0, 10) : new Date(r.resignedOn).toISOString().slice(0, 10))
      : '2026-01-15';
    const typeCode = (r.membershipType || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    const dues = r.annualDues || DUES_BY_TYPE[typeCode] || 18000;
    const archetype = r.archetype || 'Declining';
    const complaint = r.complaintCategory || null;
    const pattern = ARCHETYPE_PATTERNS[archetype]
      || (complaint ? 'Service issue (' + complaint + ') preceded resignation' : 'Gradual multi-domain decay over several months');
    const timeline = buildSyntheticTimeline(resignDate, archetype, complaint);
    return { memberId: r.memberId, name: r.name, archetype, resignDate, pattern, dues, timeline };
  });
};

// Start with static demo data — overwritten by API via _init() when available.
function getInitialData() {
  return {
    memberArchetypes: staticArchetypes,
    healthDistribution: staticHealthDistribution,
    atRiskMembers: staticAtRiskMembers,
    membersAtRisk: staticAtRiskMembers,
    resignationScenarios: staticResignationScenarios,
    memberProfiles: staticMemberProfiles,
    memberSummary: staticMemberSummary,
    emailHeatmap: staticEmailHeatmap,
    decayingMembers: staticDecayingMembers,
    watchMembers: staticWatchMembers,
  };
}

let _d = getInitialData();

// Live dashboard data cache — populated by _init from /api/dashboard-live
let _live = null;

export const _init = async () => {
  _apiLoaded = true;
  try {
    const apiData = await apiFetch('/api/members');
    if (apiData) {
      // Check if API returned actual member data (not just metadata)
      const hasMemberData = (apiData.total > 0) ||
        (Array.isArray(apiData.atRiskMembers) && apiData.atRiskMembers.length > 0) ||
        (Array.isArray(apiData.memberRoster) && apiData.memberRoster.length > 0) ||
        (apiData.memberProfiles && Object.keys(apiData.memberProfiles).length > 0);
      if (hasMemberData) _hasRealMembers = true;
      _d = {
        ..._d,
        ...apiData,
        healthDistribution: apiData.healthDistribution || _d.healthDistribution,
        memberProfiles: apiData.memberProfiles || _d.memberProfiles,
      };
      // Ensure memberSummary.totalMembers is populated from apiData.total or roster length
      if (_d.memberSummary) {
        _d.memberSummary.totalMembers = _d.memberSummary.totalMembers || apiData.total || (Array.isArray(apiData.memberRoster) ? apiData.memberRoster.length : 0);
      } else {
        _d.memberSummary = { total: apiData.total || 0, totalMembers: apiData.total || (Array.isArray(apiData.memberRoster) ? apiData.memberRoster.length : 0) };
      }
    }
  } catch { /* keep static fallback */ }

  // Also fetch live dashboard data if available
  try {
    const clubId = getClientClubId();
    if (clubId) {
      const liveData = await apiFetch(`/api/dashboard-live?clubId=${clubId}`);
      if (liveData) {
        _live = liveData;
        // Override summary with live computed data
        if (_live.healthTiers) {
          _d.memberSummary = {
            ..._d.memberSummary,
            total: _live.totalMembers,
            totalMembers: _live.totalMembers,
            healthy: _live.healthTiers.Healthy,
            watch: _live.healthTiers.Watch,
            atRisk: _live.healthTiers['At Risk'],
            critical: _live.healthTiers.Critical,
            potentialDuesAtRisk: _live.duesAtRisk,
          };
          // If live data has real members, mark as real even if /api/members didn't return them
          if (_live.totalMembers > 0) _hasRealMembers = true;
        }
      }
    }
  } catch { /* live data not available yet — static fallback continues */ }
};

export const getLiveDashboard = () => _live;

// For authenticated clubs: only return data that came from the API, never static demo data.
// _apiLoaded is set to true after _init completes, regardless of whether data was found.
// _hasRealMembers is true only if the API returned actual member records.
let _apiLoaded = false;
let _hasRealMembers = false;

import { isSourceLoaded } from './demoGate';
const _shouldReturnEmpty = () => (isAuthenticatedClub() && !_hasRealMembers) || !isSourceLoaded('members');

export const hasRealMemberData = () => _hasRealMembers;

export const getHealthDistribution = () => {
  if (_shouldReturnEmpty()) return [];
  const archetypes = normalizeArchetypes(_d?.memberArchetypes);
  const totalMembers = archetypes.reduce((sum, item) => sum + item.count, 0);
  return normalizeHealthDistribution(_d?.healthDistribution, totalMembers);
};
export const getAtRiskMembers       = () => {
  if (_shouldReturnEmpty()) return [];
  return normalizeAtRiskMembers(_d?.atRiskMembers ?? _d?.membersAtRisk ?? [], _d?.memberProfiles ?? {});
};
export const getArchetypeProfiles   = () => {
  if (_shouldReturnEmpty()) return [];
  return normalizeArchetypes(_d?.memberArchetypes);
};
export const getResignationScenarios= () => {
  if (_shouldReturnEmpty()) return [];
  return normalizeResignationScenarios(_d?.resignationScenarios);
};
export const getEmailHeatmap        = () => {
  if (_shouldReturnEmpty()) return [];
  const raw = Array.isArray(_d?.emailHeatmap) ? _d.emailHeatmap : [];
  return raw.map(e => ({
    campaign: e.campaign ?? e.subject ?? 'Unknown',
    archetype: e.archetype ?? 'Unknown',
    openRate: toNumber(e.openRate, 0),
    clickRate: toNumber(e.clickRate, 0),
  }));
};
export const getDecayingMembers     = () => {
  if (_shouldReturnEmpty()) return [];
  return normalizeDecayingMembers(_d?.decayingMembers);
};

export const getMemberSummary = () => {
  if (_shouldReturnEmpty()) {
    return { total: 0, healthy: 0, watch: 0, atRisk: 0, critical: 0, riskCount: 0, avgHealthScore: 0, potentialDuesAtRisk: 0, totalMembers: 0 };
  }
  const summary = _d?.memberSummary ?? {};
  const total = Math.max(0, Math.round(toNumber(summary.total, 0)));
  const totalMembers = Math.max(0, Math.round(toNumber(summary.totalMembers || summary.total, 0)));
  return {
    total,
    totalMembers,
    healthy: Math.max(0, Math.round(toNumber(summary.healthy, 0))),
    watch: Math.max(0, Math.round(toNumber(summary.watch, 0))),
    atRisk: Math.max(0, Math.round(toNumber(summary.atRisk, 0))),
    critical: Math.max(0, Math.round(toNumber(summary.critical, 0))),
    riskCount: Math.max(0, Math.round(toNumber(summary.riskCount, 0))),
    avgHealthScore: formatMaybeNumber(summary.avgHealthScore, 0),
    potentialDuesAtRisk: formatMaybeNumber(summary.potentialDuesAtRisk, 0),
  };
};

export const getWatchMembers = () => {
  const apiWatch = _d?.watchMembers ?? [];
  return Array.isArray(apiWatch) ? apiWatch.map((m) => ({ ...m, trend: 'watch', riskLevel: 'Watch' })) : [];
};


// Member roster from API (for authenticated clubs with no engagement data)
export const getMemberRoster = () => {
  const roster = _d?.memberRoster ?? [];
  return roster.map(m => ({
    ...m,
    memberValueAnnual: m.memberValueAnnual ?? m.annualDues ?? m.duesAnnual ?? 0,
    duesAnnual: m.duesAnnual ?? m.annualDues ?? 0,
  }));
};

// Volatile Members: Watch/At-Risk tier (30-69) with active complaint or unresolved issue
export const getVolatileMembers = () => {
  const atRisk = getAtRiskMembers();
  const watch = getWatchMembers();
  const all = [...atRisk, ...watch];
  return all.filter((m) => {
    if (m.score < 30 || m.score >= 70) return false;
    const risk = (m.topRisk || m.signal || '').toLowerCase();
    return risk.includes('complaint') || risk.includes('unresolved') || risk.includes('slow-play');
  }).sort((a, b) => a.score - b.score);
};

// Fetch real health score dimensions for a member from the health_scores table
export const getMemberHealthDimensions = async (memberId) => {
  try {
    const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;
    if (!clubId || !memberId) return null;
    const res = await fetch(`/api/compute-health-scores?clubId=${clubId}&memberId=${memberId}&mode=get`);
    if (res.ok) {
      const data = await res.json();
      return data; // { golf_score, dining_score, email_score, event_score }
    }
  } catch {}
  return null;
};

// Fetch churn prediction for a member
export const getMemberChurnPrediction = async (memberId) => {
  try {
    const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;
    if (!clubId || !memberId) return null;
    const res = await fetch(`/api/predict-churn?clubId=${clubId}&memberId=${memberId}`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
};

// Shared roster cache for generated members — populated by AllMembersView
let _rosterCache = [];
export const setRosterCache = (roster) => { _rosterCache = roster; };

export const getMemberProfile = (memberId) => {
  if (!memberId) return null;
  if (_d?.memberProfiles?.[memberId]) return normalizeMemberProfile(_d.memberProfiles[memberId]);
  // Fallback 1: build basic profile from at-risk member data
  const allAtRisk = normalizeAtRiskMembers(_d?.atRiskMembers ?? _d?.membersAtRisk ?? []);
  const found = allAtRisk.find(m => m.memberId === memberId);
  if (found) {
    return normalizeMemberProfile({
      memberId: found.memberId, name: found.name,
      tier: found.membershipType || 'Full Golf', archetype: found.archetype,
      healthScore: found.score, duesAnnual: found.annualDues || 18000,
      trend: [found.score + 20, found.score + 15, found.score + 10, found.score + 5, found.score],
      contact: { phone: '—', email: '—', preferredChannel: '—' },
      riskSignals: found.topRisk && found.topRisk !== 'Monitoring' ? [{ id: 'primary', label: found.topRisk, source: 'Analytics', confidence: '—' }] : [],
      activity: [], staffNotes: [], preferences: {}, family: [],
    });
  }
  // Fallback 2: check watch members
  const allWatch = (staticWatchMembers ?? []);
  const watchFound = allWatch.find(m => m.memberId === memberId);
  if (watchFound) {
    return normalizeMemberProfile({
      memberId: watchFound.memberId, name: watchFound.name,
      tier: 'Full Golf', archetype: watchFound.archetype,
      healthScore: watchFound.score, duesAnnual: watchFound.duesAnnual || 15000,
      trend: [watchFound.score + 10, watchFound.score + 8, watchFound.score + 5, watchFound.score + 2, watchFound.score],
      contact: { phone: '—', email: '—', preferredChannel: '—' },
      riskSignals: watchFound.signal ? [{ id: 'primary', label: watchFound.signal, source: 'Analytics', confidence: '—' }] : [],
      activity: [], staffNotes: [], preferences: {}, family: [],
    });
  }
  // Fallback 3: check feedback/complaint records
  const complaintMember = feedbackRecords.find(f => f.memberId === memberId);
  if (complaintMember) {
    return normalizeMemberProfile({
      memberId: complaintMember.memberId, name: complaintMember.memberName,
      tier: 'Full Golf', archetype: 'Unknown',
      healthScore: 50, duesAnnual: 15000,
      contact: { phone: '—', email: '—', preferredChannel: '—' },
      riskSignals: [{ id: 'complaint', label: `${complaintMember.category} complaint — ${complaintMember.status}`, source: 'Complaints', confidence: '—' }],
      activity: [{ id: `fb_${complaintMember.id}`, type: 'Complaint', detail: `${complaintMember.category} — ${complaintMember.status}`, timestamp: complaintMember.date }],
      staffNotes: [], preferences: {}, family: [],
    });
  }
  // Fallback 4: check generated roster cache
  const rosterMember = _rosterCache.find(m => m.memberId === memberId);
  if (rosterMember) {
    const s = rosterMember.score ?? 70;
    return normalizeMemberProfile({
      memberId: rosterMember.memberId, name: rosterMember.name,
      tier: rosterMember.tier || 'Full Golf', archetype: rosterMember.archetype,
      healthScore: s, duesAnnual: rosterMember.duesAnnual || 15000,
      memberValueAnnual: (rosterMember.duesAnnual || 15000) * 1.3,
      joinDate: rosterMember.joinDate,
      trend: [Math.min(100, s + 12), Math.min(100, s + 8), Math.min(100, s + 4), Math.min(100, s + 1), s],
      contact: { phone: '—', email: '—', preferredChannel: '—' },
      riskSignals: rosterMember.topRisk && rosterMember.topRisk !== 'No current risks'
        ? [{ id: 'primary', label: rosterMember.topRisk, source: 'Analytics', confidence: '—' }] : [],
      activity: s < 50 ? [
        { type: 'Engagement alert', detail: 'Health score trending below threshold', timestamp: '2026-01-15T09:00:00Z' },
        { type: 'System flag', detail: 'Added to watch list', timestamp: '2026-01-10T08:00:00Z' },
      ] : [
        { type: 'Check-in', detail: 'Regular engagement pattern', timestamp: '2026-01-16T14:30:00Z' },
      ],
      staffNotes: [], preferences: {}, family: [],
    });
  }
  return null;
};

export const sourceSystems = ['Member CRM', 'Analytics', 'Tee Sheet'];

// LTV calculation - average tenure 5 years for private club members
export const DEFAULT_LTV_MULTIPLIER = 5;

export const calculateLTV = (annualDues, multiplier = DEFAULT_LTV_MULTIPLIER) => {
  const dues = Number(annualDues);
  if (!Number.isFinite(dues) || dues <= 0) return 0;
  return dues * multiplier;
};

export const formatLTV = (annualDues, multiplier = DEFAULT_LTV_MULTIPLIER) => {
  const ltv = calculateLTV(annualDues, multiplier);
  if (ltv <= 0) return null;
  if (ltv >= 1000000) return "$" + (ltv / 1000000).toFixed(1) + "M";
  if (ltv >= 1000) return "$" + Math.round(ltv / 1000) + "K";
  return "$" + ltv.toLocaleString();
};
