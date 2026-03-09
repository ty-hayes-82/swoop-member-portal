// memberService.js — Phase 1 static · Phase 2 /api/members

import { memberArchetypes, healthDistribution, atRiskMembers, resignationScenarios } from '@/data/members';
import { emailHeatmap, decayingMembers } from '@/data/email';

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
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

let _d = null;

export const _init = async () => {
  try {
    const res = await fetch('/api/members');
    if (res.ok) _d = await res.json();
  } catch { /* keep static fallback */ }
};

export const getHealthDistribution  = () => _d ? _d.healthDistribution  : healthDistribution;
export const getAtRiskMembers       = () => normalizeAtRiskMembers(_d?.atRiskMembers ?? _d?.membersAtRisk ?? _d?.atRisk ?? atRiskMembers);
export const getArchetypeProfiles   = () => _d ? _d.memberArchetypes     : memberArchetypes;
export const getResignationScenarios= () => _d ? _d.resignationScenarios : resignationScenarios;
export const getEmailHeatmap        = () => _d ? _d.emailHeatmap         : emailHeatmap;
export const getDecayingMembers     = () => _d ? _d.decayingMembers      : decayingMembers;

export const getMemberSummary = () => {
  if (_d) return _d.memberSummary;
  const total    = memberArchetypes.reduce((s, a) => s + a.count, 0);
  const atRisk   = healthDistribution.find(h => h.level === 'At Risk')?.count  ?? 0;
  const critical = healthDistribution.find(h => h.level === 'Critical')?.count ?? 0;
  const healthy  = healthDistribution.find(h => h.level === 'Healthy')?.count  ?? 0;
  return {
    total, healthy, atRisk, critical,
    riskCount:           atRisk + critical,
    avgHealthScore:      62,
    // Weighted avg: critical members avg $12K, at-risk avg $8.5K
    potentialDuesAtRisk: (critical * 12000) + (atRisk * 8500),
  };
};

export const sourceSystems = ['Member CRM', 'Analytics', 'Tee Sheet'];
