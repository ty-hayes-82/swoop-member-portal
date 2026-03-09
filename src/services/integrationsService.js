import { COMBOS, SYSTEMS, INTEGRATION_CATEGORY_SECTIONS, VENDOR_INTELLIGENCE_DETAILS } from '@/data/integrations';

export function getConnectedSystems() {
  return SYSTEMS;
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
