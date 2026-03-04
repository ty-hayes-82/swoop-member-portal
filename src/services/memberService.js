// memberService.js — Phase 1 data access layer

import { memberArchetypes, healthDistribution, atRiskMembers, resignationScenarios } from '@/data/members';
import { emailHeatmap, decayingMembers } from '@/data/email';

export const getHealthDistribution = () => healthDistribution;

export const getAtRiskMembers = () => atRiskMembers;

export const getArchetypeProfiles = () => memberArchetypes;

export const getResignationScenarios = () => resignationScenarios;

export const getEmailHeatmap = () => emailHeatmap;

export const getDecayingMembers = () => decayingMembers;

export const getMemberSummary = () => {
  const total = memberArchetypes.reduce((s, a) => s + a.count, 0);
  const atRisk = healthDistribution.find(h => h.level === 'At Risk')?.count ?? 0;
  const critical = healthDistribution.find(h => h.level === 'Critical')?.count ?? 0;
  const healthy = healthDistribution.find(h => h.level === 'Healthy')?.count ?? 0;
  return {
    total,
    healthy,
    atRisk,
    critical,
    riskCount: atRisk + critical,
    avgHealthScore: 62,
    potentialDuesAtRisk: (atRisk + critical) * 18000,
  };
};
