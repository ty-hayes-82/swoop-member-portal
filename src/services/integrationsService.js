// services/integrationsService.js — Phase 1 static | Phase 2 swap: fetch('/api/integrations')
// Data flow: data/integrations.js → this service → Integrations.jsx

import { SYSTEMS, COMBOS } from '@/data/integrations';
import { trends } from '@/data/trends';

/** All 8 integration systems with status and metadata */
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

/** Single system by id */
export function getSystemById(id) {
  return SYSTEMS.find(s => s.id === id) ?? null;
}
