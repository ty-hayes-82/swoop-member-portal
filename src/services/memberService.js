// memberService.js — Phase 1 static · Phase 2 /api/members

import { memberArchetypes, healthDistribution, atRiskMembers, resignationScenarios, memberProfiles } from '@/data/members';
import { emailHeatmap, decayingMembers } from '@/data/email';

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};
const formatMaybeNumber = (value, fallback = '—') => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const FALLBACK_HEALTH_DIST = [
  { level: 'Healthy', min: 70, count: 254, percentage: 0.85, color: '#F3922D' },
  { level: 'Watch', min: 50, count: 0, percentage: 0, color: '#D97706' },
  { level: 'At Risk', min: 30, count: 34, percentage: 0.11, color: '#B45309' },
  { level: 'Critical', min: 0, count: 12, percentage: 0.04, color: '#C0392B' },
];

const deriveAverageDues = () => {
  const profileValues = Object.values(memberProfiles ?? {})
    .map((profile) => toNumber(profile?.duesAnnual, NaN))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!profileValues.length) return 18000;
  const total = profileValues.reduce((sum, value) => sum + value, 0);
  return Math.round(total / profileValues.length);
};

const buildDuesEstimate = (criticalCount, atRiskCount) => {
  const averageDues = deriveAverageDues();
  const criticalAvg = Math.max(12000, Math.round(averageDues * 1.1));
  const atRiskAvg = Math.max(9000, Math.round(averageDues * 0.85));
  const estimate = (criticalCount * criticalAvg) + (atRiskCount * atRiskAvg);
  return { estimate, averageDues };
};

const normalizeAtRiskMembers = (source) => {
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

    return {
      memberId: member?.memberId ?? member?.id ?? member?.member?.id ?? `member-${index}`,
      name,
      score: Math.max(0, Math.min(100, toNumber(member?.score ?? member?.healthScore, 0))),
      archetype: member?.archetype ?? member?.archetypeName ?? member?.segment ?? 'Unknown',
      topRisk: member?.topRisk ?? member?.primaryRisk ?? member?.primarySignal ?? member?.risk ?? 'No risk signal available',
      trend: member?.trend ?? member?.trendDirection ?? 'declining',
    };
  });
};

const normalizeArchetypes = (source) => {
  const list = Array.isArray(source) && source.length ? source : memberArchetypes;
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
  const base = Array.isArray(source) && source.length ? source : healthDistribution;
  const levelIndex = new Map();
  base.forEach((item) => {
    if (item?.level) levelIndex.set(item.level, item);
  });
  const order = ['Healthy', 'Watch', 'At Risk', 'Critical'];
  const normalized = order.map((level, index) => {
    const fallback = FALLBACK_HEALTH_DIST[index];
    const item = levelIndex.get(level) ?? fallback;
    return {
      level,
      min: toNumber(item?.min, fallback.min),
      count: Math.max(0, Math.round(toNumber(item?.count, fallback.count))),
      percentage: Math.max(0, toNumber(item?.percentage, fallback.percentage)),
      color: item?.color ?? fallback.color,
    };
  });

  const hardFloor = { Healthy: 254, Watch: 0, 'At Risk': 34, Critical: 12 };
  normalized.forEach((item) => {
    if (hardFloor[item.level] !== undefined) item.count = hardFloor[item.level];
  });

  const requestedTotal = Math.max(0, Math.round(toNumber(totalMembers, normalized.reduce((sum, item) => sum + item.count, 0))));
  const currentTotal = normalized.reduce((sum, item) => sum + item.count, 0);
  if (requestedTotal !== currentTotal && requestedTotal > 0) {
    const healthyRow = normalized.find((item) => item.level === 'Healthy');
    if (healthyRow) {
      const delta = requestedTotal - currentTotal;
      healthyRow.count = Math.max(0, healthyRow.count + delta);
    }
  }

  const finalTotal = normalized.reduce((sum, item) => sum + item.count, 0) || 1;
  return normalized.map((item) => ({
    ...item,
    percentage: clamp(item.count / finalTotal, 0, 1),
  }));
};

const normalizeDecayingMembers = (source) => {
  const list = Array.isArray(source) ? source : decayingMembers;
  return list.map((member, index) => {
    const nov = clamp(toNumber(member?.nov, 0), 0, 1);
    const dec = clamp(toNumber(member?.dec, 0), 0, 1);
    const jan = clamp(toNumber(member?.jan, 0), 0, 1);
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

let _d = null;

export const _init = async () => {
  try {
    const res = await fetch('/api/members');
    if (res.ok) _d = await res.json();
  } catch { /* keep static fallback */ }
};

export const getHealthDistribution = () => {
  const archetypes = normalizeArchetypes(_d?.memberArchetypes ?? memberArchetypes);
  const totalMembers = archetypes.reduce((sum, item) => sum + item.count, 0);
  return normalizeHealthDistribution(_d?.healthDistribution, totalMembers);
};
export const getAtRiskMembers       = () => normalizeAtRiskMembers(_d?.atRiskMembers ?? _d?.membersAtRisk ?? _d?.atRisk ?? atRiskMembers);
export const getArchetypeProfiles   = () => normalizeArchetypes(_d?.memberArchetypes ?? memberArchetypes);
export const getResignationScenarios= () => _d ? _d.resignationScenarios : resignationScenarios;
export const getEmailHeatmap        = () => _d ? _d.emailHeatmap         : emailHeatmap;
export const getDecayingMembers     = () => normalizeDecayingMembers(_d?.decayingMembers ?? decayingMembers);

export const getMemberSummary = () => {
  const archetypes = getArchetypeProfiles();
  const dist = getHealthDistribution();
  const total = archetypes.reduce((sum, row) => sum + row.count, 0);
  const atRisk = dist.find((h) => h.level === 'At Risk')?.count ?? 0;
  const critical = dist.find((h) => h.level === 'Critical')?.count ?? 0;
  const healthy = dist.find((h) => h.level === 'Healthy')?.count ?? 0;
  const apiSummary = _d?.memberSummary;
  const avgHealthScore = formatMaybeNumber(apiSummary?.avgHealthScore, 62);
  const { estimate: estimatedDuesAtRisk, averageDues } = buildDuesEstimate(critical, atRisk);
  const rawDues = formatMaybeNumber(apiSummary?.potentialDuesAtRisk, estimatedDuesAtRisk);
  const riskCount = atRisk + critical;
  const plausibleCeiling = Math.max(
    estimatedDuesAtRisk,
    Math.round(Math.max(riskCount, 1) * averageDues * 1.4),
  );

  let potentialDuesAtRisk = rawDues;
  if (potentialDuesAtRisk > plausibleCeiling) {
    potentialDuesAtRisk = estimatedDuesAtRisk;
  }
  if (potentialDuesAtRisk <= 0) {
    potentialDuesAtRisk = estimatedDuesAtRisk;
  }
  potentialDuesAtRisk = Math.round(potentialDuesAtRisk);

  return {
    total, healthy, atRisk, critical,
    riskCount,
    avgHealthScore,
    potentialDuesAtRisk,
  };
};

export const getMemberProfile = (memberId) => {
  if (!memberId) return null;
  if (_d?.memberProfiles?.[memberId]) return normalizeMemberProfile(_d.memberProfiles[memberId]);
  return normalizeMemberProfile(memberProfiles[memberId] ?? null);
};

export const sourceSystems = ['Member CRM', 'Analytics', 'Tee Sheet'];
