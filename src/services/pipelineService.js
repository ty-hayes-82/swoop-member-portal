// pipelineService.js — live data via /api/pipeline

let _d = null;

export const _init = async () => {
  try {
    const res = await fetch('/api/pipeline');
    if (res.ok) _d = await res.json();
  } catch { /* keep static fallback */ }
};

export const getWarmLeads = () => Array.isArray(_d?.warmLeads) ? _d.warmLeads : [];

export const getPipelineSummary = () => {
  if (_d?.pipelineSummary) return _d.pipelineSummary;
  return { hot: 0, warm: 0, cool: 0, cold: 0, totalGuests: 0, hotRevenuePotential: 0, totalRevenuePotential: 0 };
};

export const getWaitlistWithRiskScoring = () => {
  const entries = Array.isArray(_d?.waitlistEntries) ? _d.waitlistEntries : [];
  return [...entries].sort((a, b) => {
    if (a.retentionPriority !== b.retentionPriority)
      return a.retentionPriority === 'HIGH' ? -1 : 1;
    return a.healthScore - b.healthScore;
  });
};

export const getWaitlistSummary = () => {
  if (_d?.waitlistSummary) return _d.waitlistSummary;
  return { total: 0, highPriority: 0, atRisk: 0, avgDaysWaiting: 0 };
};

export const sourceSystems = ['Tee Sheet', 'Analytics'];
