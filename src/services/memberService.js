// memberService.js — live data via /api/members

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};
const formatMaybeNumber = (value, fallback = '—') => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
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
  const archetypes = normalizeArchetypes(_d?.memberArchetypes);
  const totalMembers = archetypes.reduce((sum, item) => sum + item.count, 0);
  return normalizeHealthDistribution(_d?.healthDistribution, totalMembers);
};
export const getAtRiskMembers       = () => normalizeAtRiskMembers(_d?.atRiskMembers ?? _d?.membersAtRisk ?? []);
export const getArchetypeProfiles   = () => normalizeArchetypes(_d?.memberArchetypes);
export const getResignationScenarios= () => Array.isArray(_d?.resignationScenarios) ? _d.resignationScenarios : [];
export const getEmailHeatmap        = () => Array.isArray(_d?.emailHeatmap) ? _d.emailHeatmap : [];
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
  return null;
};

export const sourceSystems = ['Member CRM', 'Analytics', 'Tee Sheet'];
