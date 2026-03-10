// pipelineService.js — live data via /api/pipeline with static Oakmont fallback

import { warmLeads, memberWaitlistEntries } from '@/data/pipeline';

let _d = null;

const toNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const buildPipelineSummary = (leads) => {
  if (!Array.isArray(leads) || leads.length === 0) {
    return {
      hot: 0,
      warm: 0,
      cool: 0,
      cold: 0,
      totalGuests: 0,
      hotRevenuePotential: 0,
      totalRevenuePotential: 0,
    };
  }

  const tierCounts = leads.reduce((acc, lead) => {
    const tier = (lead?.tier ?? 'cool').toLowerCase();
    if (acc[tier] === undefined) {
      acc.cool += 1;
    } else {
      acc[tier] += 1;
    }
    return acc;
  }, { hot: 0, warm: 0, cool: 0, cold: 0 });

  const totalRevenuePotential = leads.reduce((sum, lead) => sum + toNumber(lead?.potentialDues), 0);
  const hotRevenuePotential = leads
    .filter((lead) => (lead?.tier ?? '').toLowerCase() === 'hot')
    .reduce((sum, lead) => sum + toNumber(lead?.potentialDues), 0);

  return {
    hot: tierCounts.hot,
    warm: tierCounts.warm,
    cool: tierCounts.cool,
    cold: tierCounts.cold,
    totalGuests: leads.length,
    hotRevenuePotential,
    totalRevenuePotential,
  };
};

const normalizeWaitlistEntries = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  return entries.map((entry) => ({
    ...entry,
    healthScore: toNumber(entry?.healthScore),
    daysWaiting: toNumber(entry?.daysWaiting),
    memberValueAnnual: toNumber(entry?.memberValueAnnual),
    retentionPriority: entry?.retentionPriority ?? 'NORMAL',
    riskLevel: entry?.riskLevel ?? 'Healthy',
  }));
};

const buildWaitlistSummary = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { total: 0, highPriority: 0, atRisk: 0, avgDaysWaiting: 0 };
  }

  const total = entries.length;
  const highPriority = entries.filter((entry) => entry.retentionPriority === 'HIGH').length;
  const atRisk = entries.filter((entry) => ['At Risk', 'Critical'].includes(entry.riskLevel)).length;
  const avgDaysWaiting = Math.round(
    entries.reduce((sum, entry) => sum + toNumber(entry.daysWaiting), 0) / Math.max(total, 1),
  );

  return { total, highPriority, atRisk, avgDaysWaiting };
};

const getStaticWaitlistEntries = () => normalizeWaitlistEntries(memberWaitlistEntries);

export const _init = async () => {
  try {
    const res = await fetch('/api/pipeline');
    if (res.ok) _d = await res.json();
  } catch {
    // keep static fallback
  }
};

export const getWarmLeads = () => {
  if (Array.isArray(_d?.warmLeads) && _d.warmLeads.length) return _d.warmLeads;
  return warmLeads;
};

export const getPipelineSummary = () => {
  if (_d?.pipelineSummary) return _d.pipelineSummary;
  return buildPipelineSummary(getWarmLeads());
};

export const getWaitlistWithRiskScoring = () => {
  const source = Array.isArray(_d?.waitlistEntries) && _d.waitlistEntries.length
    ? _d.waitlistEntries
    : getStaticWaitlistEntries();
  return [...normalizeWaitlistEntries(source)].sort((a, b) => {
    if (a.retentionPriority !== b.retentionPriority) {
      return a.retentionPriority === 'HIGH' ? -1 : 1;
    }
    return a.healthScore - b.healthScore;
  });
};

export const getWaitlistSummary = () => {
  if (_d?.waitlistSummary) return _d.waitlistSummary;
  const source = Array.isArray(_d?.waitlistEntries) && _d.waitlistEntries.length
    ? _d.waitlistEntries
    : getStaticWaitlistEntries();
  return buildWaitlistSummary(source);
};

export const sourceSystems = ['Tee Sheet', 'Analytics'];
