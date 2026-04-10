import { apiFetch } from './apiClient';
import { isGateOpen } from './demoGate';
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
  if (_d?.queue) {
    const normalized = Array.isArray(_d.queue) ? _d.queue.map((entry) => normalizeWaitlistEntry(entry)) : [];
    return normalized.sort((a, b) => {
      if (a.retentionPriority !== b.retentionPriority) {
        return a.retentionPriority === 'HIGH' ? -1 : 1;
      }
      return a.healthScore - b.healthScore;
    });
  }
  if (!isGateOpen('pipeline')) return [];
  const normalized = Array.isArray(memberWaitlistEntries) ? memberWaitlistEntries.map((entry) => normalizeWaitlistEntry(entry)) : [];
  return normalized.sort((a, b) => {
    if (a.retentionPriority !== b.retentionPriority) {
      return a.retentionPriority === 'HIGH' ? -1 : 1;
    }
    return a.healthScore - b.healthScore;
  });
};

export const getWaitlistSummary = () => {
  if (_d?.queue) return summarizeWaitlistEntries(_d.queue);
  if (!isGateOpen('pipeline')) return { total: 0, highPriority: 0, normalPriority: 0, avgHealthScore: 0 };
  return summarizeWaitlistEntries(memberWaitlistEntries);
};

export const getCancellationPredictions = () => {
  if (_d?.cancellationPredictions) return [..._d.cancellationPredictions].sort((a, b) => b.cancelProbability - a.cancelProbability);
  if (!isGateOpen('pipeline')) return [];
  return [...cancellationProbabilities].sort((a, b) => b.cancelProbability - a.cancelProbability);
};

export const getCancellationSummary = () => {
  if (_d?.cancellationSummary) return _d.cancellationSummary;
  if (!isGateOpen('pipeline')) return { total: 0, highRisk: 0, totalRevAtRisk: 0, topDriver: '' };
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
  if (_d?.demandHeatmap) return _d.demandHeatmap;
  if (!isGateOpen('pipeline')) return [];
  return demandHeatmap;
};

export const sourceSystems = ['Tee Sheet', 'Member CRM', 'POS', 'Weather API'];
