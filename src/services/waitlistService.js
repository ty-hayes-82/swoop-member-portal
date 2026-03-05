// waitlistService.js — Phase 2 swap point → /api/waitlist
import { memberWaitlistEntries, cancellationProbabilities, demandHeatmap } from '@/data/pipeline';
import { revenuePerSlot } from '@/data/revenue';

// Queue sorted retention-priority first, then health score ascending (most at-risk first)
export const getWaitlistQueue = () =>
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

// Cancellations sorted by probability descending
export const getCancellationPredictions = () =>
  [...cancellationProbabilities].sort((a, b) => b.cancelProbability - a.cancelProbability);

export const getCancellationSummary = () => {
  const preds = cancellationProbabilities;
  const highRisk = preds.filter(p => p.cancelProbability >= 0.60);
  const totalRevAtRisk = highRisk.reduce((s, p) => s + p.estimatedRevenueLost, 0);
  return {
    total: preds.length,
    highRisk: highRisk.length,
    totalRevAtRisk,
    topDriver: 'Wind advisory + low-engagement members',
  };
};

export const getDemandHeatmap = () => demandHeatmap;

export const getRevenuePerSlot = () => revenuePerSlot;

export const getDemandInsight = () =>
  `Saturday 7–9 AM has been oversubscribed every week in January — 13 unmet rounds. ` +
  `Tue–Thu 7–9 AM runs at 52–65% fill rate. The same member pool, redistributed.`;

export const getWaitlistInsight = () =>
  `${memberWaitlistEntries.filter(e => e.retentionPriority === 'HIGH').length} at-risk members ` +
  `are waiting for Saturday morning slots. Noteefy would notify all ${memberWaitlistEntries.length} equally. ` +
  `Swoop fills slots with the right members first — and proves the retention impact of every slot.`;

export const sourceSystems = ['ForeTees', 'Northstar', 'Jonas POS', 'Weather API'];
