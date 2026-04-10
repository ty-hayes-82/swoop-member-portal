// pipelineService.js — live data via /api/pipeline with static Pinetree fallback

import { apiFetch } from './apiClient';
import { shouldUseStatic, getDataMode } from './demoGate';
import { warmLeads, memberWaitlistEntries } from '@/data/pipeline';
import { normalizeWaitlistEntry, summarizeWaitlistEntries } from './waitlistMetrics';

let _d = null;

// ── Guided data loader integration (Phase 1 — additive only) ──
import { registerService } from './guidedDataLoader';
export function _mergeData(partial) { _d = { ...(_d || {}), ...partial }; }
export function _resetData() { _d = null; }
registerService('pipelineService', { mergeData: _mergeData, resetData: _resetData });

const tierRank = { hot: 0, warm: 1, cold: 2 };

const toNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const clampScore = (value) => {
  const numeric = toNumber(value, 0);
  if (numeric <= 1) return Math.round(numeric * 100);
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

const inferPotentialDues = (visits, totalSpend) => {
  const visitCount = toNumber(visits, 0);
  const spend = toNumber(totalSpend, 0);
  if (visitCount >= 4 || spend >= 3000) return 36000;
  if (visitCount >= 3 || spend >= 1500) return 24000;
  if (visitCount >= 2 || spend >= 600) return 18000;
  return 12000;
};

const TIER_LABELS = {
  starter: { label: '$12K Starter', min: 12000 },
  core: { label: '$18K Core', min: 18000 },
  high: { label: '$24K High', min: 24000 },
  premium: { label: '$36K Premium', min: 36000 },
};

const getTierKeyForAmount = (amount) => {
  const value = toNumber(amount, 0);
  if (value >= TIER_LABELS.premium.min) return 'premium';
  if (value >= TIER_LABELS.high.min) return 'high';
  if (value >= TIER_LABELS.core.min) return 'core';
  return 'starter';
};

const normalizeTier = (value) => {
  const tier = String(value || '').toLowerCase();
  // ON-42 data model note: normalize to a single Hot/Warm/Cold taxonomy.
  if (tier === 'cool') return 'cold';
  if (['hot', 'warm', 'cold'].includes(tier)) return tier;
  return 'warm';
};

const ensureDate = (value) => {
  if (!value) return null;
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const sanitizeLead = (lead = {}) => {
  const guestName = (lead.guestName || lead.name || lead.prospectName || '').trim();
  const visits = toNumber(lead.visits ?? lead.visitCount, 0);
  const totalSpend = toNumber(lead.totalSpend ?? lead.totalSpendUsd ?? lead.spend, 0);
  const tier = normalizeTier(lead.tier ?? (visits >= 3 || totalSpend > 400 ? 'hot' : 'warm'));
  const inferredDues = inferPotentialDues(visits, totalSpend);
  const potentialDues = toNumber(lead.potentialDues ?? lead.projectedDues, inferredDues);
  const potentialTier = getTierKeyForAmount(potentialDues);
  const rounds = toNumber(lead.rounds ?? lead.golfRounds, visits);
  const dining = toNumber(lead.dining ?? lead.diningVisits, Math.max(0, Math.floor(visits * 0.6)));
  const events = toNumber(lead.events ?? lead.eventCount, Math.max(0, Math.floor(visits * 0.25)));
  const lastVisit = lead.lastVisit || lead.lastTouchedAt || lead.lastActivityAt || null;
  const sponsorName = lead.sponsorName || lead.sponsoredBy || null;

  return {
    guestName,
    memberId: lead.memberId ?? null,
    sponsor: lead.sponsor ?? lead.sponsorId ?? sponsorName ?? 'Sponsor unknown',
    sponsorName,
    visits,
    visitCount: visits,
    totalSpend,
    score: clampScore(lead.score ?? lead.conversionScore ?? (visits * 12) + (totalSpend / 20)),
    tier,
    rounds,
    dining,
    events,
    potentialDues,
    potentialTier,
    potentialTierLabel: TIER_LABELS[potentialTier]?.label ?? TIER_LABELS.core.label,
    likelyArchetype: lead.likelyArchetype ?? lead.archetype ?? null,
    lastVisit,
  };
};

const dedupeLeads = (leads = []) => {
  const map = new Map();
  leads.forEach((rawLead, index) => {
    const sanitized = sanitizeLead(rawLead);
    if (!sanitized.guestName && !sanitized.memberId) return;
    const key = (sanitized.guestName || sanitized.memberId || `prospect-${index}`).toLowerCase();
    if (!map.has(key)) {
      map.set(key, sanitized);
    } else {
      const existing = map.get(key);
      map.set(key, {
        ...existing,
        visits: Math.max(existing.visits, sanitized.visits),
        visitCount: Math.max(existing.visitCount, sanitized.visitCount),
        totalSpend: Math.max(existing.totalSpend, sanitized.totalSpend),
        score: Math.max(existing.score, sanitized.score),
        potentialDues: Math.max(existing.potentialDues, sanitized.potentialDues),
        rounds: Math.max(existing.rounds, sanitized.rounds),
        dining: Math.max(existing.dining, sanitized.dining),
        events: Math.max(existing.events, sanitized.events),
        lastVisit: sanitized.lastVisit || existing.lastVisit,
        sponsorName: sanitized.sponsorName || existing.sponsorName,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    const tierDiff = (tierRank[a.tier] ?? 9) - (tierRank[b.tier] ?? 9);
    if (tierDiff !== 0) return tierDiff;
    return b.score - a.score;
  });
};

const buildPipelineSummary = (leads) => {
  if (!Array.isArray(leads) || leads.length === 0) {
    const emptyBreakdown = Object.keys(TIER_LABELS).reduce((acc, key) => {
      acc[key] = { label: TIER_LABELS[key].label, count: 0, revenue: 0 };
      return acc;
    }, {});
    return {
      hot: 0,
      warm: 0,
      cold: 0,
      totalGuests: 0,
      hotRevenuePotential: 0,
      totalRevenuePotential: 0,
      avgFrequentGuestSpend: 0,
      tierBreakdown: emptyBreakdown,
    };
  }

  const tierCounts = leads.reduce((acc, lead) => {
    const tier = normalizeTier(lead.tier);
    if (acc[tier] === undefined) {
      acc.cold += 1;
    } else {
      acc[tier] += 1;
    }
    return acc;
  }, { hot: 0, warm: 0, cold: 0 });

  const frequentGuests = leads.filter((lead) => toNumber(lead.visitCount ?? lead.visits, 0) >= 3);
  const avgFrequentGuestSpend = frequentGuests.length
    ? Math.round(frequentGuests.reduce((sum, lead) => sum + toNumber(lead.totalSpend), 0) / frequentGuests.length)
    : 0;

  const totalRevenuePotential = leads.reduce((sum, lead) => sum + toNumber(lead?.potentialDues), 0);
  const hotRevenuePotential = leads
    .filter((lead) => (lead?.tier ?? '').toLowerCase() === 'hot')
    .reduce((sum, lead) => sum + toNumber(lead?.potentialDues), 0);

  const tierBreakdown = Object.keys(TIER_LABELS).reduce((acc, key) => {
    acc[key] = { label: TIER_LABELS[key].label, count: 0, revenue: 0 };
    return acc;
  }, {});

  leads.forEach((lead) => {
    const key = lead?.potentialTier ?? getTierKeyForAmount(lead?.potentialDues);
    const bucket = tierBreakdown[key] ?? tierBreakdown.core;
    bucket.count += 1;
    bucket.revenue += toNumber(lead?.potentialDues);
  });

  return {
    hot: tierCounts.hot,
    warm: tierCounts.warm,
    cold: tierCounts.cold,
    totalGuests: leads.length,
    hotRevenuePotential,
    totalRevenuePotential,
    avgFrequentGuestSpend,
    tierBreakdown,
  };
};

const normalizeWaitlistEntries = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  return entries.map((entry) => normalizeWaitlistEntry(entry));
};

const getStaticWaitlistEntries = () => normalizeWaitlistEntries(memberWaitlistEntries);

const getSanitizedLeads = () => {
  const source = Array.isArray(_d?.warmLeads) && _d.warmLeads.length ? _d.warmLeads : (getDataMode() === 'guided' ? [] : warmLeads);
  const leads = dedupeLeads(source);
  // In guided mode, suppress fields that depend on gates not yet opened
  const hasTeeSheet = shouldUseStatic('tee-sheet');
  const hasFb = shouldUseStatic('fb');
  if (!hasTeeSheet || !hasFb) {
    return leads.map((lead) => ({
      ...lead,
      rounds: hasTeeSheet ? lead.rounds : 0,
      dining: hasFb ? lead.dining : 0,
    }));
  }
  return leads;
};

const getPipelineSnapshot = () => {
  const leads = getSanitizedLeads();
  const summary = buildPipelineSummary(leads);
  return { leads, summary };
};

export const _init = async () => {
  try {
    const data = await apiFetch('/api/pipeline');
    if (data) _d = data;
  } catch {
    // keep static fallback
  }
};

export const getPipelineSummary = () => {
  return getPipelineSnapshot().summary;
};

export const sourceSystems = ['Tee Sheet', 'Analytics'];
