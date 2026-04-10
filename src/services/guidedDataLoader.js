/**
 * guidedDataLoader.js — Phase 1 foundation for data-driven guided demo.
 *
 * Services register themselves via registerService(). When a gate opens,
 * mergeGateData() pushes the relevant static data slice into each service.
 * unmergeGateData() and rebuildAllData() re-derive from the currently open gates.
 *
 * Phase 2 will migrate services to start EMPTY in guided mode and rely on
 * this loader exclusively. Phase 1 is purely additive — no existing logic changes.
 */

import { getLoadedGates } from './demoGate';

// ── Static data imports (grouped by gate) ────────────────────────────────

import {
  memberArchetypes,
  healthDistribution,
  atRiskMembers,
  watchMembers,
  resignationScenarios,
  memberProfiles,
  memberSummary,
} from '@/data/members';
import { emailHeatmap, decayingMembers } from '@/data/email';
import { todayTeeSheet, teeSheetSummary } from '@/data/teeSheet';
import { dailyRevenue, revenuePerSlot } from '@/data/revenue';
import { paceDistribution, slowRoundStats, bottleneckHoles, paceFBImpact } from '@/data/pace';
import { understaffedDays, feedbackRecords, feedbackSummary, shiftCoverage } from '@/data/staffing';
import {
  warmLeads,
  memberWaitlistEntries,
  cancellationProbabilities,
  demandHeatmap,
  waitlistEntries,
} from '@/data/pipeline';
import { agentDefinitions, agentActions, agentThoughtLogs } from '@/data/agents';
import { cockpitItems, sinceLastLogin } from '@/data/cockpit';
import { kpis, memberSaves, operationalSaves, monthlyTrends, duesAtRiskNote } from '@/data/boardReport';
import { SYSTEMS } from '@/data/integrations';
import { locationMembers, staffOnDuty, zoneAnalytics, alertsFeed } from '@/data/location';
import { weatherDaily } from '@/data/weather';
import { trends, MONTHS, outletTrends } from '@/data/trends';

// ── Service Registry ─────────────────────────────────────────────────────

const SERVICE_REGISTRY = {};

/**
 * Called by each service at module load time to make itself available
 * for data merging. Services provide two callbacks:
 *   mergeData(partial)  — shallow-merge partial into _d
 *   resetData()         — reset _d to the empty shape
 */
export function registerService(name, { mergeData, resetData }) {
  SERVICE_REGISTRY[name] = { mergeData, resetData };
}

// ── Gate → Data Map ──────────────────────────────────────────────────────
// Each gate maps to an array of { serviceName, merges } objects.
// `merges` is the key/value dict that gets passed to service._mergeData().

const GATE_DATA_MAP = {
  members: [
    {
      serviceName: 'memberService',
      merges: {
        memberArchetypes,
        healthDistribution,
        atRiskMembers,
        membersAtRisk: atRiskMembers,
        watchMembers,
        resignationScenarios,
        memberProfiles,
        memberSummary,
      },
    },
    {
      serviceName: 'locationService',
      merges: {
        members: locationMembers,
        staff: staffOnDuty,
        zones: zoneAnalytics,
        alerts: alertsFeed,
      },
    },
  ],

  'tee-sheet': [
    {
      serviceName: 'operationsService',
      merges: {
        todayTeeSheet,
        teeSheetSummary,
        revenueByDay: dailyRevenue.map(r => ({ ...r, fb: 0 })),
      },
    },
    {
      serviceName: 'teeSheetOpsService',
      merges: {
        teeSheet: todayTeeSheet,
      },
    },
  ],

  fb: [
    {
      serviceName: 'operationsService',
      merges: {
        revenueByDay: dailyRevenue,
      },
    },
    {
      serviceName: 'revenueService',
      merges: {
        dailyRevenue,
        revenuePerSlot,
      },
    },
  ],

  pace: [
    {
      serviceName: 'operationsService',
      merges: {
        paceDistribution,
        slowRoundStats,
        bottleneckHoles,
        paceFBImpact,
      },
    },
  ],

  complaints: [
    {
      serviceName: 'staffingService',
      merges: {
        understaffedDays,
        feedbackRecords,
        feedbackSummary,
        shiftCoverage,
      },
    },
  ],

  email: [
    {
      serviceName: 'memberService',
      merges: {
        emailHeatmap,
        decayingMembers,
      },
    },
  ],

  pipeline: [
    {
      serviceName: 'pipelineService',
      merges: {
        warmLeads,
      },
    },
    {
      serviceName: 'waitlistService',
      merges: {
        queue: memberWaitlistEntries,
        cancellationPredictions: cancellationProbabilities,
        demandHeatmap,
      },
    },
    {
      serviceName: 'boardReportService',
      merges: {
        kpis,
        memberSaves,
        operationalSaves,
        monthlyTrends,
        duesAtRiskNote,
      },
    },
    {
      serviceName: 'trendsService',
      merges: {
        trends,
        months: MONTHS,
        outletTrends,
      },
    },
  ],

  agents: [
    {
      serviceName: 'agentService',
      merges: {
        agents: agentDefinitions,
        actions: agentActions,
        thoughtLogs: agentThoughtLogs,
      },
    },
    {
      serviceName: 'cockpitService',
      merges: {
        priorities: cockpitItems,
        sinceLastLogin,
      },
    },
  ],

  weather: [
    {
      serviceName: 'weatherService',
      merges: {
        weatherDaily,
      },
    },
  ],

  integrations: [
    {
      serviceName: 'integrationsService',
      merges: {
        systems: SYSTEMS,
      },
    },
  ],
};

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Push data for a single gate into the registered services.
 */
export function mergeGateData(gateId) {
  const entries = GATE_DATA_MAP[gateId];
  if (!entries) return;
  for (const entry of entries) {
    const svc = SERVICE_REGISTRY[entry.serviceName];
    if (svc) {
      svc.mergeData(entry.merges);
    }
  }
}

/**
 * Re-derive all service data from scratch using currently open gates.
 * Resets every registered service, then re-merges for each open gate.
 */
export function rebuildAllData() {
  // Reset all registered services to empty
  for (const name of Object.keys(SERVICE_REGISTRY)) {
    const svc = SERVICE_REGISTRY[name];
    if (svc.resetData) svc.resetData();
  }
  // Re-merge for each currently open gate
  const openGates = getLoadedGates();
  for (const gateId of openGates) {
    mergeGateData(gateId);
  }
}

/**
 * Handle a gate being removed — rebuild from remaining open gates.
 */
export function unmergeGateData(_gateId) {
  rebuildAllData();
}

/**
 * Get the count of gate entries (for diagnostics).
 */
export function getGateCount() {
  return Object.keys(GATE_DATA_MAP).length;
}
