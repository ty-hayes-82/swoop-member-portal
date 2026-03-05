// pipelineService.js — Phase 1 static · Phase 2 /api/pipeline

import { warmLeads, memberWaitlistEntries } from '@/data/pipeline';

let _d = null;

export const _init = async () => {
  try {
    const res = await fetch('/api/pipeline');
    if (res.ok) _d = await res.json();
  } catch { /* keep static fallback */ }
};

export const getWarmLeads = () => _d ? _d.warmLeads : warmLeads;

export const getPipelineSummary = () => {
  if (_d) return _d.pipelineSummary;
  return {
    hot:  warmLeads.filter(l => l.tier === 'hot').length,
    warm: warmLeads.filter(l => l.tier === 'warm').length,
    cool: warmLeads.filter(l => l.tier === 'cool').length,
    cold: warmLeads.filter(l => l.tier === 'cold').length,
    totalGuests:           warmLeads.length,
    hotRevenuePotential:   warmLeads.filter(l => l.tier === 'hot').reduce((s, l) => s + l.potentialDues, 0),
    totalRevenuePotential: warmLeads.reduce((s, l) => s + l.potentialDues, 0),
  };
};

export const getWaitlistWithRiskScoring = () => {
  const entries = _d ? _d.waitlistEntries : memberWaitlistEntries;
  return [...entries].sort((a, b) => {
    if (a.retentionPriority !== b.retentionPriority)
      return a.retentionPriority === 'HIGH' ? -1 : 1;
    return a.healthScore - b.healthScore;
  });
};

export const getWaitlistSummary = () => {
  if (_d) return _d.waitlistSummary;
  const entries = memberWaitlistEntries;
  const highPriority = entries.filter(e => e.retentionPriority === 'HIGH');
  const atRisk = entries.filter(e => ['At Risk','Critical'].includes(e.riskLevel));
  const avgDaysWaiting = Math.round(entries.reduce((s, e) => s + e.daysWaiting, 0) / entries.length);
  return { total: entries.length, highPriority: highPriority.length, atRisk: atRisk.length, avgDaysWaiting };
};

export const sourceSystems = ['ForeTees', 'Club Prophet'];
