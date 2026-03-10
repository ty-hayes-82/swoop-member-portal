// Pipeline test — verified 2026-03-07T23:02:54Z.
// waitlistService.js — Phase 1 static · Phase 2 /api/waitlist

import {
  waitlistEntries,
  memberWaitlistEntries,
  cancellationProbabilities,
  demandHeatmap,
} from '@/data/pipeline';
import { revenuePerSlot } from '@/data/revenue';
import { normalizeWaitlistEntry, summarizeWaitlistEntries } from './waitlistMetrics';

let _d = null;

export const _init = async () => {
  try {
    const res = await fetch('/api/waitlist');
    if (res.ok) _d = await res.json();
  } catch {
    // Keep static fallback in demo mode.
  }
};

export const getWaitlistQueue = () => {
  const entries = _d ? _d.queue : memberWaitlistEntries;
  const normalized = Array.isArray(entries) ? entries.map((entry) => normalizeWaitlistEntry(entry)) : [];
  return normalized.sort((a, b) => {
    if (a.retentionPriority !== b.retentionPriority) {
      return a.retentionPriority === 'HIGH' ? -1 : 1;
    }
    return a.healthScore - b.healthScore;
  });
};

export const getWaitlistSummary = () => {
  if (_d?.queue) return summarizeWaitlistEntries(_d.queue);
  return summarizeWaitlistEntries(memberWaitlistEntries);
};

export const getCancellationPredictions = () => {
  const src = _d ? _d.cancellationPredictions : cancellationProbabilities;
  return [...src].sort((a, b) => b.cancelProbability - a.cancelProbability);
};

export const getCancellationSummary = () => {
  if (_d) return _d.cancellationSummary;
  const preds = cancellationProbabilities;
  const highRisk = preds.filter((p) => p.cancelProbability >= 0.6);
  return {
    total: preds.length,
    highRisk: highRisk.length,
    totalRevAtRisk: highRisk.reduce((s, p) => s + p.estimatedRevenueLost, 0),
    topDriver: 'Wind advisory + low-engagement members',
  };
};

export const getDemandHeatmap = () => (_d ? _d.demandHeatmap : demandHeatmap);
export const getRevenuePerSlot = () => (_d ? _d.revenueAttribution : revenuePerSlot);

export const getWaitlistDemandSparkline = () => {
  const entries = _d ? _d.waitlistEntries ?? [] : waitlistEntries;
  return entries.map((e) => e.count);
};

export const getCancellationRiskSparkline = () =>
  getCancellationPredictions()
    .slice(0, 6)
    .map((p) => Math.round(p.cancelProbability * 100))
    .reverse();

export const getDemandInsight = () =>
  'Saturday 7–9 AM has been oversubscribed every week in January — 13 unmet rounds. ' +
  'Tue–Thu 7–9 AM runs at 52–65% fill rate. The same member pool, redistributed.';

export const getWaitlistInsight = () => {
  const s = getWaitlistSummary();
  return `${s.highPriority} at-risk members are waiting for Saturday morning slots. ` +
    `Standalone waitlist tools would notify all ${s.total} equally. ` +
    'Swoop fills slots with the right members first — and proves the retention impact of every slot.';
};

export const sourceSystems = ['Tee Sheet', 'Member CRM', 'POS', 'Weather API'];
