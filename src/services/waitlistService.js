// Pipeline test — verified 2026-03-07T23:02:54Z.
// waitlistService.js — Phase 1 static · Phase 2 /api/waitlist

import { apiFetch } from './apiClient';
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
    const data = await apiFetch('/api/waitlist');
    if (data) _d = data;
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

export const getConfirmationCandidates = () => {
  const preds = getCancellationPredictions();
  return preds
    .filter((p) => p.cancelProbability >= 0.4)
    .map((p) => ({
      ...p,
      outreachWindow: p.cancelProbability >= 0.7 ? '24h' : p.cancelProbability >= 0.55 ? '48h' : '72h',
      urgency: p.cancelProbability >= 0.7 ? 'high' : p.cancelProbability >= 0.55 ? 'medium' : 'low',
    }));
};

export const getMembersForSlot = (slotPattern) => {
  const queue = getWaitlistQueue();
  if (!slotPattern) return queue;
  const pattern = slotPattern.toLowerCase();
  return queue.filter((m) => {
    const requested = (m.requestedSlot ?? '').toLowerCase();
    const alts = (m.alternatesAccepted ?? []).map((a) => a.toLowerCase());
    return requested.includes(pattern) || alts.some((a) => a.includes(pattern));
  });
};

export const sourceSystems = ['Tee Sheet', 'Member CRM', 'POS', 'Weather API'];
