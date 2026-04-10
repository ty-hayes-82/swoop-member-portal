// teeSheetOpsService.js — Tee Sheet Operations service layer
// Manages confirmation workflow, re-assignment pipeline, fill reporting, and waitlist config
// Pattern: in-memory mutable store (same as agentService.js)

import { apiFetch } from './apiClient';
import { shouldUseStatic, getDataMode } from './demoGate';
import {
  confirmationSeeds,
  reassignmentSeeds,
  defaultWaitlistConfig,
  historicalPatterns,
  weeklyQueuePressure,
  demandSteeringSeeds,
} from '@/data/teeSheetOps';
import { revenuePerSlot } from '@/data/revenue';

let _d = null;

// ── Guided data loader integration (Phase 1 — additive only) ──
import { registerService } from './guidedDataLoader';
export function _mergeData(partial) { _d = { ...(_d || {}), ...partial }; }
export function _resetData() { _d = null; }
registerService('teeSheetOpsService', { mergeData: _mergeData, resetData: _resetData });

export const _init = async () => {
  if (getDataMode() === 'guided') return; // guided mode — _mergeData populates _d
  try {
    const data = await apiFetch('/api/tee-sheet-ops');
    if (!data) return;
    _d = data;
    if (Array.isArray(_d.confirmations)) {
      confirmationStore = _d.confirmations.map((c) => ({ ...c }));
    }
    if (Array.isArray(_d.reassignments)) {
      reassignmentStore = _d.reassignments.map((r) => ({ ...r, auditTrail: [...(r.auditTrail || [])] }));
    }
    if (_d.config) {
      Object.assign(waitlistConfig, _d.config);
    }
  } catch { /* keep static fallback */ }
};

let confirmationStore = confirmationSeeds.map((c) => ({ ...c }));
let reassignmentStore = reassignmentSeeds.map((r) => ({ ...r, auditTrail: [...r.auditTrail] }));
let waitlistConfig = { ...defaultWaitlistConfig };
let steeringData = { ...demandSteeringSeeds };

// ── Confirmations ──────────────────────────────────────────────

export function getConfirmations() {
  if (_d?.confirmations) return [..._d.confirmations].sort((a, b) => b.cancelProbability - a.cancelProbability);
  if (!shouldUseStatic('tee-sheet')) return [];
  return [...confirmationStore].sort((a, b) => b.cancelProbability - a.cancelProbability);
}

export function getConfirmationById(id) {
  return confirmationStore.find((c) => c.id === id) ?? null;
}

export function updateConfirmation(id, updates) {
  const now = new Date().toISOString();
  confirmationStore = confirmationStore.map((c) =>
    c.id === id
      ? {
          ...c,
          ...updates,
          ...(updates.outreachStatus === 'contacted' && !c.contactedAt ? { contactedAt: now } : {}),
          ...((['confirmed', 'cancelled', 'no_response'].includes(updates.outreachStatus)) ? { respondedAt: now } : {}),
        }
      : c,
  );
  return confirmationStore.find((c) => c.id === id) ?? null;
}

export function getConfirmationSummary() {
  const all = confirmationStore;
  return {
    total: all.length,
    pending: all.filter((c) => c.outreachStatus === 'pending').length,
    contacted: all.filter((c) => c.outreachStatus === 'contacted').length,
    confirmed: all.filter((c) => c.outreachStatus === 'confirmed').length,
    cancelled: all.filter((c) => c.outreachStatus === 'cancelled').length,
    noResponse: all.filter((c) => c.outreachStatus === 'no_response').length,
    slotsForReassignment: all.filter((c) => ['cancelled', 'no_response'].includes(c.outreachStatus)).length,
  };
}

// ── Re-Assignment Pipeline ─────────────────────────────────────

export function getReassignments() {
  if (_d?.reassignments) {
    return [..._d.reassignments].sort((a, b) => {
      const statusOrder = { pending: 0, approved: 1, completed: 2, overridden: 3, skipped: 4 };
      return (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
    });
  }
  if (!shouldUseStatic('tee-sheet')) return [];
  return [...reassignmentStore].sort((a, b) => {
    const statusOrder = { pending: 0, approved: 1, completed: 2, overridden: 3, skipped: 4 };
    return (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
  });
}

export function getReassignmentById(id) {
  return reassignmentStore.find((r) => r.id === id) ?? null;
}

export function getReassignmentForBooking(bookingId) {
  return reassignmentStore.find((r) => r.sourceBookingId === bookingId) ?? null;
}

export function createReassignment(data) {
  const now = new Date().toISOString();
  const id = `ra_${String(reassignmentStore.length + 1).padStart(3, '0')}`;
  const entry = {
    id,
    sourceBookingId: data.sourceBookingId,
    sourceSlot: data.sourceSlot,
    sourceMemberId: data.sourceMemberId,
    sourceMemberName: data.sourceMemberName,
    cancelReason: data.cancelReason ?? 'Cancellation confirmed via outreach',
    recommendedFillMemberId: data.recommendedFillMemberId,
    recommendedFillMemberName: data.recommendedFillMemberName,
    recommendedFillHealthScore: data.recommendedFillHealthScore ?? 0,
    recommendedFillRiskLevel: data.recommendedFillRiskLevel ?? 'Watch',
    recommendedFillDuesAtRisk: data.recommendedFillDuesAtRisk ?? 0,
    recommendedFillDaysWaiting: data.recommendedFillDaysWaiting ?? 0,
    retentionRationale: data.retentionRationale ?? '',
    status: 'pending',
    overrideMemberId: null,
    overrideMemberName: null,
    staffDecision: null,
    decidedAt: null,
    outcome: 'pending',
    outcomeAt: null,
    revenueRecovered: data.estimatedRevenue ?? revenuePerSlot.retentionPriority,
    healthScoreBefore: data.recommendedFillHealthScore ?? 0,
    healthScoreAfter: null,
    auditTrail: [
      { action: `Slot opened — ${data.sourceMemberName} ${data.cancelReason ? 'cancelled' : 'released'}`, by: 'system', at: now },
      { action: `Recommended ${data.recommendedFillMemberName} (retention priority)`, by: 'system', at: now },
    ],
  };
  reassignmentStore = [...reassignmentStore, entry];
  return entry;
}

export function updateReassignment(id, updates) {
  const now = new Date().toISOString();
  reassignmentStore = reassignmentStore.map((r) => {
    if (r.id !== id) return r;
    const trail = [...r.auditTrail];
    if (updates.status === 'approved') {
      trail.push({ action: 'Approved fill recommendation', by: updates.staffId ?? 'staff', at: now });
    } else if (updates.status === 'overridden') {
      trail.push({ action: `Overridden — chose ${updates.overrideMemberName ?? 'alternate member'}`, by: updates.staffId ?? 'staff', at: now });
    } else if (updates.status === 'skipped') {
      trail.push({ action: `Skipped — ${updates.staffDecision ?? 'no reason given'}`, by: updates.staffId ?? 'staff', at: now });
    } else if (updates.status === 'completed') {
      trail.push({ action: `Slot filled — outcome: ${updates.outcome ?? 'filled'}`, by: 'system', at: now });
    }
    return {
      ...r,
      ...updates,
      decidedAt: updates.status && !r.decidedAt ? now : r.decidedAt,
      auditTrail: trail,
    };
  });
  return reassignmentStore.find((r) => r.id === id) ?? null;
}

// ── Waitlist Configuration ─────────────────────────────────────

export function getWaitlistConfig() {
  return { ...waitlistConfig };
}

export function updateWaitlistConfig(updates) {
  waitlistConfig = { ...waitlistConfig, ...updates };
  return { ...waitlistConfig };
}

// ── Historical & Steering Data ─────────────────────────────────

export function getHistoricalPatterns() {
  if (_d?.historicalPatterns) return _d.historicalPatterns;
  if (!shouldUseStatic('tee-sheet')) return [];
  return historicalPatterns;
}

export function getWeeklyQueuePressure() {
  if (_d?.weeklyQueuePressure) return _d.weeklyQueuePressure;
  if (!shouldUseStatic('tee-sheet')) return [];
  return weeklyQueuePressure;
}

export function getDemandSteeringStats() {
  if (_d?.demandSteeringStats) return { ...(_d.demandSteeringStats) };
  if (!shouldUseStatic('tee-sheet')) return { redirectionsSent: 0, acceptanceRate: 0, revenueSaved: 0, avgResponseTime: 0 };
  return { ...steeringData };
}

export function recordRedirection() {
  steeringData = {
    ...steeringData,
    redirectionsSent: steeringData.redirectionsSent + 1,
  };
  return { ...steeringData };
}

export function recordRedirectionConversion() {
  steeringData = {
    ...steeringData,
    redirectionsConverted: steeringData.redirectionsConverted + 1,
    conversionRate: Math.round(((steeringData.redirectionsConverted + 1) / Math.max(steeringData.redirectionsSent, 1)) * 100) / 100,
    revenueFromRedirections: steeringData.revenueFromRedirections + revenuePerSlot.upliftDollars,
  };
  return { ...steeringData };
}
