// memberService.js — Phase 1 static · Phase 2 /api/members

import { memberArchetypes, healthDistribution, atRiskMembers, resignationScenarios } from '@/data/members';
import { emailHeatmap, decayingMembers } from '@/data/email';

let _d = null;

export const _init = async () => {
  try {
    const res = await fetch('/api/members');
    if (res.ok) _d = await res.json();
  } catch { /* keep static fallback */ }
};

export const getHealthDistribution  = () => _d ? _d.healthDistribution  : healthDistribution;
export const getAtRiskMembers       = () => _d ? _d.atRiskMembers        : atRiskMembers;
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
