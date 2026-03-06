// services/integrationsService.js — Phase 1 static | Phase 2 swap: fetch('/api/integrations')
// Data flow: data/integrations.js -> this service -> Integrations.jsx
// Hard ceiling: 150 lines

import { CATEGORIES, VENDORS, SYSTEMS, COMBOS, VENDOR_LANDSCAPE, QUESTION_CATEGORIES } from '@/data/integrations';
import { trends } from '@/data/trends';

// ── Vendor catalog functions (new in Sprint 1) ────────────────────────────────

/** All 10 categories */
export function getCategories() {
  return CATEGORIES;
}

/** Categories with vendor counts injected */
export function getCategoryStats() {
  return CATEGORIES.map(cat => ({
    ...cat,
    count: VENDORS.filter(v => v.categoryId === cat.id).length,
  }));
}

/** All vendors, optionally filtered by categoryId (null = all) */
export function getVendorsByCategory(categoryId = null) {
  if (!categoryId) return VENDORS;
  return VENDORS.filter(v => v.categoryId === categoryId);
}

/** Single vendor by id */
export function getVendorById(id) {
  return VENDORS.find(v => v.id === id) ?? null;
}

/** All combos that involve a given vendor id */
export function getCombosForVendor(vendorId) {
  return COMBOS.filter(c => c.systems.includes(vendorId));
}

/** Summary counts for the health strip */
export function getIntegrationSummary() {
  const connected = VENDORS.filter(v => v.status === 'connected').length;
  const combosActive = COMBOS.filter(c =>
    c.systems.every(id => VENDORS.find(v => v.id === id)?.status === 'connected')
  ).length;
  return {
    connected,
    total: VENDORS.length,
    combosActive,
    totalCombos: COMBOS.length,
  };
}

// ── Backward-compat functions (unchanged — used by current Integrations.jsx) ──

/** Original 8 systems for IntegrationCard / IntegrationMap */
export function getSystems() {
  return SYSTEMS;
}

/** Health summary: connected count, total, combos active */
export function getIntegrationHealth() {
  const connected = SYSTEMS.filter(s => s.status === 'connected').length;
  const combosActive = COMBOS.filter(c =>
    c.systems.every(id => SYSTEMS.find(s => s.id === id)?.status === 'connected')
  ).length;
  return {
    connected,
    total: SYSTEMS.length,
    combosActive,
    totalCombos: COMBOS.length,
  };
}

/** All combos, optionally filtered by selected system IDs */
export function getCombos(selectedIds = []) {
  if (selectedIds.length < 2) return COMBOS;
  return COMBOS.filter(c => selectedIds.every(id => c.systems.includes(id)));
}

/** Resolve sparkline data for combo previews that use type:'sparkline' */
export function resolveSparklineData(sparklineKey) {
  return trends[sparklineKey] ?? [];
}

/** Single system by id (backward compat) */
export function getSystemById(id) {
  return SYSTEMS.find(s => s.id === id) ?? null;
}

/** Full vendor landscape organized by category (for VendorLandscapeSection) */
export function getVendorLandscape() {
  return VENDOR_LANDSCAPE;
}

/** Total vendor count across all categories */
export function getVendorCount() {
  return VENDORS.length;
}

// ── Question Category functions ───────────────────────────────────────────────

export function getQuestionCategories() {
  return QUESTION_CATEGORIES;
}

export function getCombosByQuestion(questionCategoryId) {
  return COMBOS.filter(c => c.questionCategory === questionCategoryId);
}

/** How many required category IDs are currently connected for a question */
export function getQuestionReadiness(questionCategoryId) {
  const q = QUESTION_CATEGORIES.find(q => q.id === questionCategoryId);
  if (!q) return { connected: 0, required: 0, ready: false };
  const required = q.requiredCategories.length;
  const connected = q.requiredCategories.filter(catId =>
    VENDORS.some(v => v.categoryId === catId && v.status === 'connected')
  ).length;
  return { connected, required, ready: connected === required };
}
