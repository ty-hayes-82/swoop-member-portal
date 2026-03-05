// pipelineService.js
import { warmLeads, memberWaitlistEntries } from '@/data/pipeline';

export const getWarmLeads = () => warmLeads;
export const getPipelineSummary = () => ({
  hot:  warmLeads.filter(l => l.tier === 'hot').length,
  warm: warmLeads.filter(l => l.tier === 'warm').length,
  cool: warmLeads.filter(l => l.tier === 'cool').length,
  cold: warmLeads.filter(l => l.tier === 'cold').length,
  totalGuests: warmLeads.length,
  hotRevenuePotential: warmLeads.filter(l => l.tier === 'hot').reduce((s, l) => s + l.potentialDues, 0),
  totalRevenuePotential: warmLeads.reduce((s, l) => s + l.potentialDues, 0),
});

// Waitlist sorted by retention priority (HIGH first), then health score ascending (most at-risk first)
export const getWaitlistWithRiskScoring = () =>
  [...memberWaitlistEntries].sort((a, b) => {
    if (a.retentionPriority !== b.retentionPriority)
      return a.retentionPriority === 'HIGH' ? -1 : 1;
    return a.healthScore - b.healthScore;
  });

export const getWaitlistSummary = () => {
  const entries = memberWaitlistEntries;
  const highPriority = entries.filter(e => e.retentionPriority === 'HIGH');
  const atRisk = entries.filter(e => e.riskLevel === 'At Risk' || e.riskLevel === 'Critical');
  const avgDaysWaiting = Math.round(entries.reduce((s, e) => s + e.daysWaiting, 0) / entries.length);
  return {
    total: entries.length,
    highPriority: highPriority.length,
    atRisk: atRisk.length,
    avgDaysWaiting,
  };
};

// Data provenance — which vendor systems this service simulates
export const sourceSystems = ["ForeTees", "Club Prophet"];
