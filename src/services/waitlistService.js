import { apiFetch } from './apiClient';
import { shouldUseStatic } from './demoGate';
import {
  memberWaitlistEntries,
  cancellationProbabilities,
  demandHeatmap,
} from '@/data/pipeline';
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
  if (!shouldUseStatic('pipeline') && !_d) return [];
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
  if (!shouldUseStatic('pipeline') && !_d) return { total: 0, highPriority: 0, normalPriority: 0, avgHealthScore: 0 };
  if (_d?.queue) return summarizeWaitlistEntries(_d.queue);
  return summarizeWaitlistEntries(memberWaitlistEntries);
};

export const getCancellationPredictions = () => {
  if (!shouldUseStatic('pipeline') && !_d) return [];
  const src = _d ? _d.cancellationPredictions : cancellationProbabilities;
  return [...src].sort((a, b) => b.cancelProbability - a.cancelProbability);
};

export const getCancellationSummary = () => {
  if (!shouldUseStatic('pipeline') && !_d) return { total: 0, highRisk: 0, totalRevAtRisk: 0, topDriver: '' };
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

export const getDemandHeatmap = () => {
  if (!shouldUseStatic('pipeline') && !_d) return [];
  return _d ? _d.demandHeatmap : demandHeatmap;
};

export const sourceSystems = ['Tee Sheet', 'Member CRM', 'POS', 'Weather API'];
