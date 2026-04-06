import { apiFetch } from './apiClient';
import { COMBOS, SYSTEMS, INTEGRATION_CATEGORY_SECTIONS, VENDOR_INTELLIGENCE_DETAILS } from '@/data/integrations';
import { CATEGORY_TEMPLATE_MAP } from '@/services/csvImportService';
import { isAuthenticatedClub } from '@/config/constants';

let _d = null;

export const _init = async () => {
  try {
    const data = await apiFetch('/api/integrations');
    if (data) _d = data;
  } catch { /* keep static fallback */ }
};

export function getConnectedSystems() {
  if (isAuthenticatedClub()) {
    if (!_d?.systems || _d.systems.length === 0) {
      // No live data from API — show all as available for real clubs
      return SYSTEMS.map(s => ({ ...s, status: 'available', lastSync: null }));
    }
    // Merge live API data with static system list
    return SYSTEMS.map(s => {
      const live = _d.systems.find(ls => ls.id === s.id);
      return live ? { ...s, status: live.status, lastSync: live.lastSync } : { ...s, status: 'available', lastSync: null };
    });
  }
  // Demo mode — show hardcoded statuses from SYSTEMS array
  if (!_d?.systems) return SYSTEMS;
  return SYSTEMS.map(s => {
    const live = _d.systems.find(ls => ls.id === s.id);
    return live ? { ...s, status: live.status, lastSync: live.lastSync } : s;
  });
}

export function getSystemById(id) {
  return SYSTEMS.find((system) => system.id === id) ?? null;
}

export function getCombinations() {
  return COMBOS;
}

export function getCombinationById(id) {
  return COMBOS.find((combo) => combo.id === id) ?? null;
}

export function getIntegrationHealth() {
  const connectedSystems = SYSTEMS.filter((system) => system.status === 'connected');
  const freshest = connectedSystems.reduce((min, system) => {
    if (!system.lastSync) return min;
    const minutes = Number.parseInt(system.lastSync, 10);
    return Number.isNaN(minutes) ? min : Math.min(min, minutes);
  }, Number.POSITIVE_INFINITY);

  return {
    connected: connectedSystems.length,
    total: SYSTEMS.length,
    dataFreshness: Number.isFinite(freshest) ? `${freshest}m` : 'n/a',
    syncStatus: connectedSystems.length === SYSTEMS.length ? 'Healthy' : 'Monitoring',
  };
}

// Backward-compatible aliases used in other modules.
export function getSystems() {
  return getConnectedSystems();
}

export function getIntegrationCategorySections() {
  return INTEGRATION_CATEGORY_SECTIONS;
}

export function getVendorIntelligenceDetails(vendorId) {
  return VENDOR_INTELLIGENCE_DETAILS[vendorId] ?? null;
}

export function getCombos() {
  return getCombinations();
}

export function resolveSparklineData() {
  return [];
}

export function getCategoryStats() {
  const counts = SYSTEMS.reduce((acc, system) => {
    acc[system.category] = (acc[system.category] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([id, count]) => ({ id, label: id, count }));
}

export function getVendorsByCategory(categoryId = null) {
  if (!categoryId) return SYSTEMS;
  return SYSTEMS.filter((system) => system.category === categoryId);
}

export function getVendorById(id) {
  return getSystemById(id);
}

export function getCombosForVendor(vendorId) {
  return COMBOS.filter((combo) => combo.systems.includes(vendorId));
}

export function getIntegrationSummary() {
  const health = getIntegrationHealth();
  return { ...health, combosActive: COMBOS.length, totalCombos: COMBOS.length };
}

export function getQuestionCategories() {
  return [];
}

export function getCombosByQuestion() {
  return [];
}

export function getQuestionReadiness() {
  return { connected: 0, required: 0, ready: false };
}

export const CATEGORY_UNLOCKS = {
  'tee-sheet': 'Booking patterns, cancellation risk, pace-of-play impact',
  'pos': 'Revenue leakage, post-round dining conversion, spend gaps',
  'crm': 'Member health scores, resignation prediction, archetype assignment',
  'staffing': 'Labor optimization alerts, understaffing-complaint correlation',
  'email': 'Email decay detection, engagement-based disengagement signals',
  'events': 'Event ROI analysis, attendance-retention correlation',
  'feedback': 'Complaint resolution tracking, service recovery workflows',
  'fitness': 'Facility utilization, cross-amenity engagement',
  'waitlist': 'Demand signals, fill-rate optimization, member prioritization',
  'analytics': 'Benchmarking, forecast accuracy, performance alerts',
};

const CATEGORY_LABELS = {
  'tee-sheet': 'Tee Sheet',
  'pos': 'POS / F&B',
  'crm': 'CRM & Membership',
  'staffing': 'Staffing / HR',
  'email': 'Email Marketing',
  'events': 'Events',
  'feedback': 'Complaints & Feedback',
  'fitness': 'Fitness & Pool',
  'waitlist': 'Waitlist & Reservations',
  'analytics': 'Analytics',
};

const CATEGORY_ICONS = {
  'tee-sheet': '\u26F3',
  'pos': '\uD83E\uDDFE',
  'crm': '\uD83D\uDC65',
  'staffing': '\uD83D\uDCC5',
  'email': '\u2709\uFE0F',
  'events': '\uD83C\uDF9F',
  'feedback': '\uD83D\uDECE',
  'fitness': '\uD83C\uDFCA',
  'waitlist': '\uD83D\uDCCB',
  'analytics': '\uD83D\uDCCA',
};

export function getDataGaps() {
  const systems = getConnectedSystems();
  const connectedCategories = new Set(
    systems.filter(s => s.status === 'connected').map(s => s.category)
  );
  const gaps = [];
  for (const [category, templates] of Object.entries(CATEGORY_TEMPLATE_MAP)) {
    if (!connectedCategories.has(category)) {
      const categoryVendors = systems.filter(s => s.category === category);
      gaps.push({
        category,
        label: CATEGORY_LABELS[category] || category,
        icon: CATEGORY_ICONS[category] || '\uD83D\uDCCA',
        templates,
        vendors: categoryVendors,
        unlocks: CATEGORY_UNLOCKS[category] || '',
      });
    }
  }
  return gaps;
}

export function getLiveProgress() {
  const systems = getConnectedSystems();
  const total = systems.length;
  const connected = systems.filter(s => s.status === 'connected').length;
  const pct = total > 0 ? Math.round((connected / total) * 100) : 0;
  return { connected, total, pct };
}
