/**
 * Guided Demo Scoring Engine
 *
 * Calculates member health scores dynamically based on which data sources
 * have been imported. Mirrors the backend compute-health-scores.js logic:
 *
 *   Composite = golf(0.30) + dining(0.25) + email(0.25) + events(0.20)
 *
 * In guided mode, only dimensions whose gates are open contribute.
 * Weights are re-normalized across available dimensions.
 *
 * Tier thresholds: Healthy 67+, Watch 45-66, At Risk 25-44, Critical 0-24
 */

import { isGateOpen, getDataMode, getLoadedGates } from './demoGate';

// ── Weights (match backend compute-health-scores.js) ──
const WEIGHTS = { golf: 0.30, dining: 0.25, email: 0.25, events: 0.20 };

// Gate → dimension mapping
const GATE_TO_DIM = {
  'tee-sheet': 'golf',
  'fb':        'dining',
  'email':     'email',
  // events piggyback on email gate (email campaigns promote events)
};

// ── Archetype average dimensions (from src/data/members.js) ──
const ARCHETYPE_DIMS = {
  'Die-Hard Golfer':  { golf: 88, dining: 42, events: 28, email: 32 },
  'Social Butterfly': { golf: 18, dining: 82, events: 78, email: 72 },
  'Balanced Active':  { golf: 68, dining: 62, events: 54, email: 55 },
  'Weekend Warrior':  { golf: 52, dining: 44, events: 32, email: 28 },
  'Declining':        { golf: 24, dining: 18, events:  8, email: 22 },
  'New Member':       { golf: 42, dining: 48, events: 38, email: 68 },
  'Ghost':            { golf:  4, dining:  6, events:  2, email:  8 },
  'Snowbird':         { golf: 62, dining: 52, events: 34, email: 44 },
};

// Fallback for unknown archetypes
const DEFAULT_DIMS = { golf: 50, dining: 50, events: 50, email: 50 };

// ── Tier assignment (match backend) ──
function getTier(score) {
  if (score == null) return null;
  if (score >= 70) return 'Healthy';
  if (score >= 50) return 'Watch';
  if (score >= 30) return 'At Risk';
  return 'Critical';
}

// ── Archetype classification (match backend decision tree) ──
export function classifyArchetype(dims, joinDate) {
  const { golf, dining, email, events } = dims;
  const joinDaysAgo = joinDate
    ? Math.floor((Date.now() - new Date(joinDate).getTime()) / 86400000)
    : 9999;

  if (joinDaysAgo < 120)                                        return 'New Member';
  if (golf < 10 && dining < 10 && events < 10 && email < 15)   return 'Ghost';
  if (golf < 35 && dining < 35 && events < 35 && email < 35)   return 'Declining';
  if (golf > 70 && dining < 45 && events < 40)                  return 'Die-Hard Golfer';
  if (events > 60 && dining > 60 && golf < 40)                  return 'Social Butterfly';
  if (golf > 40 && golf < 75 && dining < 50)                    return 'Weekend Warrior';
  return 'Balanced Active';
}

// ── Deterministic hash for per-member variation ──
function memberHash(memberId) {
  let h = 0;
  const s = String(memberId);
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

/**
 * Get per-member dimension scores.
 * Uses archetype averages as base, adds deterministic per-member variation.
 */
export function getMemberDimensions(memberId, archetype) {
  const base = ARCHETYPE_DIMS[archetype] || DEFAULT_DIMS;
  const h = memberHash(memberId);

  // Deterministic variation: ±18 points per dimension, different offset per dim
  const vary = (base_val, seed) => {
    const v = ((h * seed + 7919) % 37) - 18; // range: -18 to +18
    return Math.max(0, Math.min(100, base_val + v));
  };

  return {
    golf:   vary(base.golf,   3),
    dining: vary(base.dining, 7),
    email:  vary(base.email,  13),
    events: vary(base.events, 17),
  };
}

/**
 * Compute a member's health score based on currently open gates.
 * Returns null if no engagement data sources are available.
 */
export function computeScore(dims, openGates) {
  const available = [];
  for (const [gate, field] of Object.entries(GATE_TO_DIM)) {
    if (openGates.has(gate) || openGates.includes?.(gate)) {
      available.push({ score: dims[field], weight: WEIGHTS[field] });
    }
  }

  if (available.length === 0) return null;

  // Re-normalize weights so they sum to 1
  const totalWeight = available.reduce((s, d) => s + d.weight, 0);
  if (totalWeight === 0) return 0;
  return Math.round(available.reduce((s, d) => s + (d.score * d.weight / totalWeight), 0));
}

/**
 * Compute a full scored member record for guided mode.
 * Returns the member with computed score, tier, and archetype.
 */
export function scoreMember(member, openGates) {
  const dims = getMemberDimensions(member.memberId, member.archetype);
  const score = computeScore(dims, openGates);
  if (score == null) return { ...member, score: null, tier: null, archetype: null };

  const computedArchetype = classifyArchetype(dims, member.joinDate);
  return {
    ...member,
    score,
    tier: getTier(score),
    archetype: computedArchetype,
    _dims: dims, // internal: available for member drawer breakdown
  };
}

/**
 * Check if any engagement gates are open (tee-sheet, fb, email).
 */
export function hasEngagementGates() {
  return isGateOpen('tee-sheet') || isGateOpen('fb') || isGateOpen('email');
}

/**
 * Get the set of currently open gates for scoring.
 */
export function getOpenGatesForScoring() {
  const mode = getDataMode();
  if (mode !== 'guided') return new Set(Object.keys(GATE_TO_DIM)); // demo: all open
  return new Set(getLoadedGates());
}

/**
 * Compute health distribution from an array of scored members.
 */
export function computeHealthDistribution(members) {
  const counts = { Healthy: 0, Watch: 0, 'At Risk': 0, Critical: 0 };
  const deltas = { Healthy: 0, Watch: 0, 'At Risk': 0, Critical: 0 };
  members.forEach(m => {
    const t = getTier(m.score);
    if (t) counts[t]++;
  });
  const total = members.length || 1;
  return [
    { level: 'Healthy',  min: 67, count: counts.Healthy,    percentage: counts.Healthy / total,    color: '#12b76a', delta: deltas.Healthy },
    { level: 'Watch',    min: 45, count: counts.Watch,      percentage: counts.Watch / total,      color: '#f59e0b', delta: deltas.Watch },
    { level: 'At Risk',  min: 25, count: counts['At Risk'], percentage: counts['At Risk'] / total, color: '#ea580c', delta: deltas['At Risk'] },
    { level: 'Critical', min: 0,  count: counts.Critical,   percentage: counts.Critical / total,   color: '#ef4444', delta: deltas.Critical },
  ];
}

/**
 * Compute archetype distribution from an array of scored members.
 */
export function computeArchetypeDistribution(members) {
  const buckets = {};
  members.forEach(m => {
    if (!m.archetype) return;
    if (!buckets[m.archetype]) {
      buckets[m.archetype] = { archetype: m.archetype, count: 0, golfSum: 0, diningSum: 0, eventsSum: 0, emailSum: 0, trendSum: 0 };
    }
    const b = buckets[m.archetype];
    b.count++;
    if (m._dims) {
      b.golfSum += m._dims.golf;
      b.diningSum += m._dims.dining;
      b.eventsSum += m._dims.events;
      b.emailSum += m._dims.email;
    }
  });
  return Object.values(buckets).map(b => ({
    archetype: b.archetype,
    count: b.count,
    golf:   b.count ? Math.round(b.golfSum / b.count) : 0,
    dining: b.count ? Math.round(b.diningSum / b.count) : 0,
    events: b.count ? Math.round(b.eventsSum / b.count) : 0,
    email:  b.count ? Math.round(b.emailSum / b.count) : 0,
    trend:  0,
  }));
}

// ── Guided scoring cache ──
let _scoredMembers = null;
let _lastGateSignature = '';

/**
 * Get or compute scored member list for guided mode.
 * Cached until gates change.
 */
export function getScoredMembers(rawMembers) {
  const gates = getOpenGatesForScoring();
  const sig = [...gates].sort().join(',');
  if (_scoredMembers && _lastGateSignature === sig) return _scoredMembers;

  _scoredMembers = rawMembers.map(m => scoreMember(m, gates));
  _lastGateSignature = sig;
  return _scoredMembers;
}

/**
 * Invalidate the guided scoring cache (call on import).
 */
export function invalidateGuidedScores() {
  _scoredMembers = null;
  _lastGateSignature = '';
}
