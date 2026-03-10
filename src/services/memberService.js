// memberService.js — live data via /api/members

import {
  memberArchetypes as staticArchetypes,
  healthDistribution as staticHealthDistribution,
  atRiskMembers as staticAtRiskMembers,
  resignationScenarios as staticResignationScenarios,
  memberProfiles as staticMemberProfiles,
  memberSummary as staticMemberSummary,
} from '@/data/members';
import { decayingMembers as staticDecayingMembers, emailHeatmap as staticEmailHeatmap } from '@/data/email';

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

  return 'Behavioral decay detected across systems';
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

let _d = {
  memberArchetypes: staticArchetypes,
  healthDistribution: staticHealthDistribution,
  atRiskMembers: staticAtRiskMembers,
  membersAtRisk: staticAtRiskMembers,
  resignationScenarios: staticResignationScenarios,
  memberProfiles: staticMemberProfiles,
  memberSummary: staticMemberSummary,
  emailHeatmap: staticEmailHeatmap,
  decayingMembers: staticDecayingMembers,
};

export const _init = async () => {
  try {
    const res = await fetch('/api/members');
    if (res.ok) _d = await res.json();
  } catch { /* keep static fallback */ }
};

export const getHealthDistribution = () => {
  const archetypes = normalizeArchetypes(_d?.memberArchetypes);
  const totalMembers = archetypes.reduce((sum, item) => sum + item.count, 0);
  return normalizeHealthDistribution(_d?.healthDistribution, totalMembers);
};
export const getAtRiskMembers       = () => normalizeAtRiskMembers(_d?.atRiskMembers ?? _d?.membersAtRisk ?? [], _d?.memberProfiles ?? {});
export const getArchetypeProfiles   = () => normalizeArchetypes(_d?.memberArchetypes);
export const getResignationScenarios= () => Array.isArray(_d?.resignationScenarios) ? _d.resignationScenarios : [];
export const getEmailHeatmap        = () => {
  const raw = Array.isArray(_d?.emailHeatmap) ? _d.emailHeatmap : [];
  return raw.map(e => ({
    campaign: e.campaign ?? e.subject ?? 'Unknown',
    archetype: e.archetype ?? 'Unknown',
    openRate: toNumber(e.openRate, 0),
    clickRate: toNumber(e.clickRate, 0),
  }));
};
export const getDecayingMembers     = () => normalizeDecayingMembers(_d?.decayingMembers);

export const getMemberSummary = () => {
  const summary = _d?.memberSummary ?? {};
  return {
    total: Math.max(0, Math.round(toNumber(summary.total, 0))),
    healthy: Math.max(0, Math.round(toNumber(summary.healthy, 0))),
    atRisk: Math.max(0, Math.round(toNumber(summary.atRisk, 0))),
    critical: Math.max(0, Math.round(toNumber(summary.critical, 0))),
    riskCount: Math.max(0, Math.round(toNumber(summary.riskCount, 0))),
    avgHealthScore: formatMaybeNumber(summary.avgHealthScore, 0),
    potentialDuesAtRisk: formatMaybeNumber(summary.potentialDuesAtRisk, 0),
  };
};


export const getMemberProfile = (memberId) => {
  if (!memberId) return null;
  if (_d?.memberProfiles?.[memberId]) return normalizeMemberProfile(_d.memberProfiles[memberId]);
  // Fallback: build basic profile from at-risk member data
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
  return null;
};

export const sourceSystems = ['Member CRM', 'Analytics', 'Tee Sheet'];
