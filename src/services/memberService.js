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

/**
 * @typedef {Object} AtRiskMember
 * @property {string} memberId
 * @property {string} name
 * @property {number} score                   0-100 health score
 * @property {string} archetype
 * @property {string} topRisk                 Resolved risk signal (never generic)
 * @property {string} trend                   'declining' | 'stable' | 'improving' | ...
 * @property {number|null} duesAnnual         Normalized annual dues ($)
 */

/**
 * @typedef {Object} ArchetypeRow
 * @property {string} archetype
 * @property {number} count
 * @property {number} golf                    0-100
 * @property {number} dining                  0-100
 * @property {number} events                  0-100
 * @property {number} email                   0-100
 * @property {number} trend                   -100..100 delta
 */

/**
 * @typedef {Object} HealthDistributionRow
 * @property {string} level                   'Healthy' | 'Watch' | 'At Risk' | 'Critical' | ...
 * @property {number} min                     Minimum score for bucket
 * @property {number} count
 * @property {number} percentage              0-1
 * @property {string} color                   Hex color
 * @property {number} delta                   Period-over-period count delta
 */

/**
 * @typedef {Object} DecayingMemberRow
 * @property {string} memberId
 * @property {string} name
 * @property {string} archetype
 * @property {number} nov                     Open rate 0-1
 * @property {number} dec                     Open rate 0-1
 * @property {number} jan                     Open rate 0-1
 * @property {number} trend                   Percent change -100..100
 */

/**
 * @typedef {Object} EmailHeatmapRow
 * @property {string} campaign
 * @property {string} archetype
 * @property {number} openRate
 * @property {number} clickRate
 */

/**
 * @typedef {Object} MemberSummary
 * @property {number} total
 * @property {number} totalMembers
 * @property {number} healthy
 * @property {number} watch
 * @property {number} atRisk
 * @property {number} critical
 * @property {number} riskCount
 * @property {number} avgHealthScore             Raw number (0 when unknown). Consumers format for display.
 * @property {number} potentialDuesAtRisk        Raw number (0 when unknown). Consumers format for display.
 */

/**
 * @typedef {Object} RiskSignal
 * @property {string} id
 * @property {string} label
 * @property {string} source
 * @property {string} confidence
 */

/**
 * @typedef {Object} MemberProfile
 * @property {string} memberId
 * @property {string} name
 * @property {string} [tier]
 * @property {string} [archetype]
 * @property {number|string} healthScore       string '—' when unknown
 * @property {number|string} duesAnnual        string '—' when unknown
 * @property {number|string} memberValueAnnual string '—' when unknown
 * @property {number[]} trend                  5-point sparkline, each 0-100
 * @property {{phone:string,email:string,preferredChannel:string}} [contact]
 * @property {RiskSignal[]} [riskSignals]
 * @property {Array<Object>} [activity]
 * @property {Array<Object>} [staffNotes]
 * @property {Object} [preferences]
 * @property {Array<Object>} [family]
 */

/**
 * @typedef {Object} ResignationScenario
 * @property {string} memberId
 * @property {string} name
 * @property {string} archetype
 * @property {string} resignDate               YYYY-MM-DD
 * @property {string} pattern
 * @property {number} dues
 * @property {Array<{date:string,event:string,domain:string}>} timeline
 */

/**
 * @typedef {Object} RosterMember
 * @property {string} memberId
 * @property {string} name
 * @property {number} score
 * @property {string} archetype
 * @property {number} duesAnnual
 * @property {number} [memberValueAnnual]
 * @property {string} [tier]
 * @property {string} [joinDate]
 * @property {string} [trend]
 * @property {string} [topRisk]
 * @property {string|null} [lastSeenLocation]
 */

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
      let signal = RISK_SIGNAL_OVERRIDES.get(key);
      // Filter signal parts based on open gates
      const parts = signal.split(' • ').filter(part => {
        if (!shouldUseStatic('tee-sheet') && /round|golf/i.test(part)) return false;
        if (!shouldUseStatic('fb') && /dining|F&B|spend/i.test(part)) return false;
        if (!shouldUseStatic('complaints') && /complaint/i.test(part)) return false;
        if (!shouldUseStatic('email') && /email|open/i.test(part)) return false;
        return true;
      });
      return parts.length > 0 ? parts.join(' • ') : null;
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
        // Merge (not replace) memberSummary so partial API payloads like
        // { memberSummary: { total: 50 } } don't wipe healthy/watch/atRisk/etc.
        memberSummary: { ..._d.memberSummary, ...(apiData.memberSummary || {}) },
      };
      // Patch memberSummary.total + .totalMembers from apiData (both fields, since
      // some consumers read .total and some read .totalMembers — the previous code
      // only patched .totalMembers, leaving .total at the static seed value).
      const apiTotal = apiData.total || (Array.isArray(apiData.memberRoster) ? apiData.memberRoster.length : 0);
      if (_d.memberSummary) {
        if (apiTotal) {
          _d.memberSummary.total = apiTotal;
          _d.memberSummary.totalMembers = apiTotal;
        }
      } else {
        _d.memberSummary = { ..._d.memberSummary, total: apiTotal, totalMembers: apiTotal };
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

import { shouldUseStatic, getDataMode } from './demoGate';
import {
  hasEngagementGates,
  getOpenGatesForScoring,
  getMemberDimensions,
  computeScore,
  classifyArchetype,
  scoreMember,
  computeHealthDistribution as computeGuidedHealthDist,
  computeArchetypeDistribution as computeGuidedArchetypes,
} from './guidedScoring';
const _shouldReturnEmpty = () => !shouldUseStatic('members') && !_hasRealMembers;

export const hasRealMemberData = () => _hasRealMembers;

/** @returns {HealthDistributionRow[]} */
export const getHealthDistribution = () => {
  if (_shouldReturnEmpty()) return [];
  if (getDataMode() === 'guided' && !hasEngagementGates()) return [];
  // Compute distribution from the full roster so both pages agree
  const roster = getFullRoster();
  if (roster.length > 0) {
    const counts = { Healthy: 0, Watch: 0, 'At Risk': 0, Critical: 0 };
    roster.forEach(m => {
      const s = m.score ?? 0;
      if (s >= 70) counts.Healthy++;
      else if (s >= 50) counts.Watch++;
      else if (s >= 30) counts['At Risk']++;
      else counts.Critical++;
    });
    const total = roster.length || 1;
    return [
      { level: 'Healthy',  min: 70, count: counts.Healthy,      percentage: counts.Healthy / total,      color: '#12b76a', delta: -4 },
      { level: 'Watch',    min: 50, count: counts.Watch,         percentage: counts.Watch / total,         color: '#f59e0b', delta: 5  },
      { level: 'At Risk',  min: 30, count: counts['At Risk'],    percentage: counts['At Risk'] / total,    color: '#ea580c', delta: 6  },
      { level: 'Critical', min: 0,  count: counts.Critical,      percentage: counts.Critical / total,      color: '#ef4444', delta: 3  },
    ];
  }
  const archetypes = normalizeArchetypes(_d?.memberArchetypes);
  const totalMembers = archetypes.reduce((sum, item) => sum + item.count, 0);
  return normalizeHealthDistribution(_d?.healthDistribution, totalMembers);
};
/** @returns {AtRiskMember[]} */
export const getAtRiskMembers       = () => {
  if (_shouldReturnEmpty()) return [];
  const raw = normalizeAtRiskMembers(_d?.atRiskMembers ?? _d?.membersAtRisk ?? [], _d?.memberProfiles ?? {});
  // In guided mode, recalculate scores from available dimensions
  if (getDataMode() === 'guided') {
    if (!hasEngagementGates()) return [];
    const gates = getOpenGatesForScoring();
    return raw.map(m => {
      const dims = getMemberDimensions(m.memberId, m.archetype);
      const score = computeScore(dims, gates);
      return score != null ? { ...m, score } : null;
    }).filter(Boolean).filter(m => m.score < 45); // only at-risk + critical
  }
  return raw;
};
/** @returns {ArchetypeRow[]} */
export const getArchetypeProfiles   = () => {
  if (_shouldReturnEmpty()) return [];
  if (getDataMode() === 'guided' && !hasEngagementGates()) return [];
  return normalizeArchetypes(_d?.memberArchetypes);
};
/** @returns {Record<string, MemberProfile>} */
export const getAllMemberProfiles   = () => {
  if (_shouldReturnEmpty()) return {};
  return _d?.memberProfiles ?? {};
};
/** @returns {ResignationScenario[]} */
export const getResignationScenarios= () => {
  if (_shouldReturnEmpty()) return [];
  return normalizeResignationScenarios(_d?.resignationScenarios);
};
/** @returns {EmailHeatmapRow[]} */
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
/** @returns {DecayingMemberRow[]} */
export const getDecayingMembers     = () => {
  if (_shouldReturnEmpty()) return [];
  return normalizeDecayingMembers(_d?.decayingMembers);
};

/** @returns {MemberSummary} */
export const getMemberSummary = () => {
  if (_shouldReturnEmpty()) {
    return { total: 0, healthy: 0, watch: 0, atRisk: 0, critical: 0, riskCount: 0, avgHealthScore: 0, potentialDuesAtRisk: 0, totalMembers: 0 };
  }
  // In guided mode without engagement data, return member count only (roster mode)
  if (getDataMode() === 'guided' && !hasEngagementGates()) {
    const rosterFallback = (_d?.memberRoster ?? []).length || 0;
    const total = toNumber(_d?.memberSummary?.total ?? _d?.memberSummary?.totalMembers, rosterFallback);
    return { total, totalMembers: total, healthy: 0, watch: 0, atRisk: 0, critical: 0, riskCount: 0, avgHealthScore: 0, potentialDuesAtRisk: 0 };
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
    avgHealthScore: toNumber(summary.avgHealthScore, 0),
    potentialDuesAtRisk: toNumber(summary.potentialDuesAtRisk, 0),
  };
};

/** @returns {AtRiskMember[]} */
export const getWatchMembers = () => {
  if (_shouldReturnEmpty()) return [];
  if (getDataMode() === 'guided' && !hasEngagementGates()) return [];
  const apiWatch = _d?.watchMembers ?? [];
  if (getDataMode() === 'guided') {
    const gates = getOpenGatesForScoring();
    return (Array.isArray(apiWatch) ? apiWatch : []).map(m => {
      const dims = getMemberDimensions(m.memberId, m.archetype);
      const score = computeScore(dims, gates);
      return score != null ? { ...m, score, trend: 'watch', riskLevel: 'Watch' } : null;
    }).filter(Boolean).filter(m => m.score >= 45 && m.score < 67);
  }
  return Array.isArray(apiWatch) ? apiWatch.map((m) => ({ ...m, trend: 'watch', riskLevel: 'Watch' })) : [];
};


// Member roster from API (for authenticated clubs with no engagement data)
/** @returns {RosterMember[]} */
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

// Fetch churn prediction for a member
export const getMemberChurnPrediction = async (memberId) => {
  try {
    const clubId = getClientClubId();
    if (!clubId || !memberId) return null;
    const res = await fetch(`/api/predict-churn?clubId=${clubId}&memberId=${memberId}`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
};

// Shared roster cache — lazily generated, used by both HealthOverview and AllMembersView
let _rosterCache = [];
export const setRosterCache = (roster) => { _rosterCache = roster; };

const _FIRST_NAMES = ['James','Robert','John','Michael','David','William','Richard','Joseph','Thomas','Christopher','Charles','Daniel','Matthew','Anthony','Mark','Steven','Paul','Andrew','Joshua','Kenneth','Kevin','Brian','George','Timothy','Ronald','Edward','Jason','Jeffrey','Ryan','Jacob','Gary','Nicholas','Eric','Jonathan','Stephen','Larry','Justin','Scott','Brandon','Benjamin','Samuel','Patrick','Alexander','Frank','Raymond','Jack','Dennis','Jerry','Tyler','Aaron','Jose','Nathan','Henry','Douglas','Peter','Zachary','Kyle','Noah','Ethan','Jeremy','Walter','Christian','Keith','Roger','Terry','Harry','Ralph','Sean','Jesse','Roy','Louis','Alan','Eugene','Russell','Randy','Philip','Howard','Vincent','Bobby','Dylan','Johnny','Phillip','Victor','Clarence','Travis','Austin','Martha','Donna','Sandra','Gloria','Teresa','Sara','Debra','Alice','Rachel','Emma','Lisa','Nancy','Betty','Margaret','Dorothy','Kimberly','Emily','Donna','Michelle','Carol','Amanda','Melissa','Deborah','Stephanie','Rebecca','Sharon','Laura','Cynthia','Kathleen','Amy','Angela','Shirley','Anna','Brenda','Pamela','Nicole','Samantha','Katherine','Christine','Helen','Debbie','Janet','Catherine','Maria','Heather','Diane','Olivia','Julie','Joyce','Virginia','Victoria','Kelly','Lauren','Christina','Joan','Evelyn','Judith','Andrea','Hannah','Megan','Cheryl','Jacqueline','Martha','Gloria','Teresa','Ann','Sara','Madison','Frances','Kathryn','Janice','Jean','Abigail','Julia','Grace','Judy'];
const _LAST_NAMES = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson','Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores','Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts','Gomez','Phillips','Evans','Turner','Diaz','Parker','Cruz','Edwards','Collins','Reyes','Stewart','Morris','Morales','Murphy','Cook','Rogers','Gutierrez','Ortiz','Morgan','Cooper','Peterson','Bailey','Reed','Kelly','Howard','Ramos','Kim','Cox','Ward','Richardson','Watson','Brooks','Chavez','Wood','James','Bennett','Gray','Mendoza','Ruiz','Hughes','Price','Alvarez','Castillo','Sanders','Patel','Myers','Long','Ross','Foster','Jimenez','Powell','Jenkins','Perry','Russell','Sullivan','Bell','Coleman','Butler','Henderson','Barnes','Gonzales','Fisher','Vasquez','Simmons','Marks','Fox','Dean','Walsh','Burke'];
const _ARCHETYPES = ['Die-Hard Golfer','Social Butterfly','Balanced Active','Weekend Warrior','Declining','New Member','Ghost','Snowbird'];
const _MEMBERSHIP_TIERS = ['Full Golf','Social','Sports','Junior','Legacy','Non-Resident','Corporate','Full Golf','Social','Full Golf'];
const _LOCATIONS = ['Clubhouse','Golf Course','Practice Range','Pool Area','Dining Room','Pro Shop','Fitness Center','Tennis Courts',null,null];

function _generateRoster() {
  if (!shouldUseStatic('members')) return [];
  const roster = [];
  const atRisk = getAtRiskMembers();
  const watch = getWatchMembers();
  const profiles = getAllMemberProfiles();
  Object.values(profiles).forEach(p => {
    roster.push({ memberId: p.memberId, name: p.name, score: p.healthScore, archetype: p.archetype, duesAnnual: p.duesAnnual, memberValueAnnual: p.memberValueAnnual, tier: p.tier, joinDate: p.joinDate, trend: p.trend, topRisk: p.riskSignals?.[0]?.label || 'No current risks', lastSeenLocation: p.lastSeenLocation });
  });
  (atRisk || []).forEach(m => {
    if (!roster.find(r => r.memberId === m.memberId)) {
      roster.push({ memberId: m.memberId, name: m.name, score: m.score, archetype: m.archetype, duesAnnual: m.duesAnnual || 15000, tier: profiles[m.memberId]?.tier || 'Full Golf', joinDate: '2020-03-15', trend: 'down', topRisk: m.signal || m.action || 'Engagement declining' });
    }
  });
  (watch || []).forEach(m => {
    if (!roster.find(r => r.memberId === m.memberId)) {
      roster.push({ memberId: m.memberId, name: m.name, score: m.score, archetype: m.archetype, duesAnnual: m.duesAnnual || 15000, tier: profiles[m.memberId]?.tier || 'Full Golf', joinDate: '2021-06-01', trend: 'stable', topRisk: m.signal || 'Minor engagement shift' });
    }
  });
  const currentCounts = { Healthy: 0, Watch: 0, 'At Risk': 0, Critical: 0 };
  roster.forEach(m => {
    const lvl = (m.score ?? m.healthScore ?? 70) >= 70 ? 'Healthy' : (m.score ?? 70) >= 50 ? 'Watch' : (m.score ?? 70) >= 30 ? 'At Risk' : 'Critical';
    currentCounts[lvl] = (currentCounts[lvl] || 0) + 1;
  });
  const targets = { Healthy: 200, Watch: 35, 'At Risk': 39, Critical: 26 };
  const needed = {
    Healthy: Math.max(0, targets.Healthy - currentCounts.Healthy),
    Watch: Math.max(0, targets.Watch - currentCounts.Watch),
    'At Risk': Math.max(0, targets['At Risk'] - currentCounts['At Risk']),
    Critical: Math.max(0, targets.Critical - currentCounts.Critical),
  };
  let id = 400;
  const scoreRanges = { Healthy: [70, 98], Watch: [50, 69], 'At Risk': [30, 49], Critical: [5, 29] };
  for (const level of ['Healthy', 'Watch', 'At Risk', 'Critical']) {
    for (let i = 0; i < needed[level]; i++) {
      const idx = id - 400;
      const [lo, hi] = scoreRanges[level];
      const score = lo + (((idx * 7 + 13) % (hi - lo + 1)));
      const archIdx = ((idx * 3 + 5) % _ARCHETYPES.length);
      const fn = _FIRST_NAMES[((idx * 11 + 3) % _FIRST_NAMES.length)];
      const ln = _LAST_NAMES[((idx * 7 + 1) % _LAST_NAMES.length)];
      const dues = [12000, 14000, 15000, 16000, 18000, 20000, 22000, 25000, 28000, 31000][idx % 10];
      const yr = 2015 + (idx % 10);
      const mo = String(1 + (idx % 12)).padStart(2, '0');
      roster.push({
        memberId: `mbr_${id++}`, name: `${fn} ${ln}`, score,
        archetype: _ARCHETYPES[archIdx], duesAnnual: dues,
        tier: _MEMBERSHIP_TIERS[idx % _MEMBERSHIP_TIERS.length],
        joinDate: `${yr}-${mo}-01`,
        trend: level === 'Healthy' ? 'stable' : level === 'Watch' ? 'stable' : 'down',
        topRisk: level === 'Healthy' ? 'No current risks' : level === 'Watch' ? 'Minor engagement shift' : 'Engagement declining',
        lastSeenLocation: _LOCATIONS[idx % _LOCATIONS.length],
      });
    }
  }
  if (getDataMode() === 'guided') {
    const gates = getOpenGatesForScoring();
    return roster.map(m => scoreMember(m, gates));
  }
  return roster;
}

/** Lazily generate and cache the full member roster. Both pages use this. */
/** @returns {RosterMember[]} */
export function getFullRoster() {
  if (_rosterCache.length > 0) return _rosterCache;
  const apiRoster = getMemberRoster();
  _rosterCache = apiRoster.length > 0 ? apiRoster : _generateRoster();
  return _rosterCache;
}

/**
 * @param {string} memberId
 * @returns {MemberProfile|null}
 */
export const getMemberProfile = (memberId) => {
  if (!memberId) return null;
  if (_d?.memberProfiles?.[memberId]) {
    const profile = normalizeMemberProfile(_d.memberProfiles[memberId]);
    // In guided mode, recalculate the health score from available dimensions
    if (getDataMode() === 'guided' && profile) {
      if (!hasEngagementGates()) {
        return { ...profile, healthScore: '—', trend: [] };
      }
      const dims = getMemberDimensions(memberId, _d.memberProfiles[memberId].archetype);
      const score = computeScore(dims, getOpenGatesForScoring());
      if (score != null) {
        return { ...profile, healthScore: score };
      }
    }
    return profile;
  }
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

