/**
 * Assertion oracle for the permutation-hardening loop.
 *
 * Single source of truth mapping every visible GM-facing surface (stage
 * insights, deep-insights kinds, agent triggers) to the set of DB tables
 * and DOMAIN flags it depends on. The loop asserts that the API's
 * "available/unlocked" state exactly matches what this file says should
 * be visible given the currently-loaded stages.
 *
 * Any drift between api/stage-insights.js, api/deep-insights.js, or
 * api/agents/data-availability-check.js and the maps below is a bug —
 * either in the API (showing data it shouldn't) or in this spec (out of
 * date). The loop fails loudly and you fix one side or the other.
 */

// ---------------------------------------------------------------------------
// STAGE_ORDER — canonical list of import types, matching the order used by
// the seed path in scripts/e2e-full-cycle.mjs. Members is always first;
// the hardening loop shuffles the remaining 21 entries.
// ---------------------------------------------------------------------------

export const STAGE_ORDER = [
  { key: 'members',             csv: 'tests/fixtures/small/JCM_Members_F9.csv' },
  { key: 'tee_times',           csv: 'tests/fixtures/small/TTM_Tee_Sheet_SV.csv' },
  { key: 'transactions',        csv: 'tests/fixtures/small/POS_Sales_Detail_SV.csv' },
  { key: 'complaints',          csv: 'tests/fixtures/small/JCM_Communications_RG.csv' },
  { key: 'booking_players',     csv: 'tests/fixtures/small/TTM_Tee_Sheet_Players_SV.csv' },
  { key: 'courses',             csv: 'docs/jonas-exports/TTM_Course_Setup_F9.csv' },
  { key: 'pos_checks',          csv: 'docs/jonas-exports/POS_Sales_Detail_SV.csv' },
  { key: 'line_items',          csv: 'docs/jonas-exports/POS_Line_Items_SV.csv' },
  { key: 'payments',            csv: 'docs/jonas-exports/POS_Payments_SV.csv' },
  { key: 'daily_close',         csv: 'docs/jonas-exports/POS_Daily_Close_SV.csv' },
  { key: 'sales_areas',         csv: 'docs/jonas-exports/POS_Sales_Areas_F9.csv' },
  { key: 'shifts',              csv: 'docs/jonas-exports/7shifts_Staff_Shifts.csv' },
  { key: 'staff',               csv: 'docs/jonas-exports/ADP_Staff_Roster.csv' },
  { key: 'events',              csv: 'docs/jonas-exports/JAM_Event_List_SV.csv' },
  { key: 'event_registrations', csv: 'docs/jonas-exports/JAM_Registrations_SV.csv' },
  { key: 'email_campaigns',     csv: 'docs/jonas-exports/CHO_Campaigns_SV.csv' },
  { key: 'email_events',        csv: 'docs/jonas-exports/CHO_Email_Events_SV.csv' },
  { key: 'invoices',            csv: 'docs/jonas-exports/JCM_Aged_Receivables_SV.csv' },
  { key: 'households',          csv: 'docs/jonas-exports/JCM_Dependents_F9.csv' },
  { key: 'membership_types',    csv: 'docs/jonas-exports/JCM_Membership_Types_F9.csv' },
  { key: 'service_requests',    csv: 'docs/jonas-exports/JCM_Service_Requests_RG.csv' },
  { key: 'club_profile',        csv: 'docs/jonas-exports/JCM_Club_Profile.csv' },
];

// ---------------------------------------------------------------------------
// STAGE_KEY_TO_TABLES — which DB tables an import type populates. Join-
// scoped tables (booking_players, pos_line_items, pos_payments) get entries
// but they only join cleanly if the parent table is also loaded.
// ---------------------------------------------------------------------------

export const STAGE_KEY_TO_TABLES = {
  members:             ['members'],
  tee_times:           ['bookings'],
  transactions:        ['transactions'],
  complaints:          ['complaints'],
  booking_players:     ['booking_players'],
  courses:             ['courses'],
  pos_checks:          ['pos_checks'],
  line_items:          ['pos_line_items'],
  payments:            ['pos_payments'],
  daily_close:         ['close_outs'],
  sales_areas:         ['dining_outlets'],
  shifts:              ['staff_shifts'],
  staff:               ['staff'],
  events:              ['event_definitions'],
  event_registrations: ['event_registrations'],
  email_campaigns:     ['email_campaigns'],
  email_events:        ['email_events'],
  invoices:            ['member_invoices'],
  households:          ['households'],
  membership_types:    ['membership_types'],
  service_requests:    ['service_requests'],
  club_profile:        ['club'],
};

// ---------------------------------------------------------------------------
// STAGE_INSIGHT_DEPS — each stage insight's minimum required table set.
// Keyed by the `stage` field in the /api/stage-insights response.
// ---------------------------------------------------------------------------

export const STAGE_INSIGHT_DEPS = {
  members:             { requires: ['members'] },
  bookings:             { requires: ['bookings'] },
  booking_players:      { requires: ['booking_players', 'bookings', 'members'] },
  transactions:         { requires: ['transactions'] },
  pos_line_items:       { requires: ['pos_line_items', 'pos_checks'] },
  pos_payments:         { requires: ['pos_payments', 'pos_checks'] },
  close_outs:           { requires: ['close_outs'] },
  dining_outlets:       { requires: ['dining_outlets'] },
  staff:                { requires: ['staff'] },
  staff_shifts:         { requires: ['staff_shifts'] },
  event_definitions:    { requires: ['event_definitions'] },
  event_registrations:  { requires: ['event_registrations', 'members'] },
  email_campaigns:      { requires: ['email_campaigns'] },
  email_events:         { requires: ['email_events'] },
  member_invoices:      { requires: ['member_invoices', 'members'] },
  membership_types:     { requires: ['membership_types'] },
  complaints:           { requires: ['complaints'] },
  service_requests:     { requires: ['service_requests'] },
  club_profile:         { requires: ['club'] },
};

// ---------------------------------------------------------------------------
// DEEP_INSIGHT_DEPS — each deep-insights kind's minimum required tables.
// Keyed by the `kind` query param. Some kinds have soft fallbacks
// (e.g. tier-revenue groups by members.membership_type even without the
// catalog table) — those are marked with `softFallback: true` so the
// assertion treats both states as acceptable.
// ---------------------------------------------------------------------------

export const DEEP_INSIGHT_DEPS = {
  payments:             { requires: ['pos_payments', 'pos_checks'] },
  'ar-aging':           { requires: ['member_invoices', 'members'] },
  courses:              { requires: ['courses'] }, // queries bookings but courses table alone is the gate
  'tier-revenue':       { requires: ['members'], softFallback: 'membership_types' },
  households:           { requires: ['households'] },
  'service-tickets':    { requires: ['service_requests', 'members'] },
  'member-engagement':  { requires: ['members'] }, // per-member; dimensions (rounds/rsvps/opens/complaints) are all optional
};

// ---------------------------------------------------------------------------
// DOMAIN_TO_TABLES — which table must have rows for each data-availability
// DOMAIN to flip to "satisfied". Mirrors api/agents/data-availability-check.js
// domainHasRows logic.
// ---------------------------------------------------------------------------

export const DOMAINS = {
  CRM: 'CRM',
  TEE_SHEET: 'TEE_SHEET',
  POS: 'POS',
  EMAIL: 'EMAIL',
  LABOR: 'LABOR',
};

export const DOMAIN_TO_TABLES = {
  CRM:       ['members'],
  TEE_SHEET: ['bookings'],
  POS:       ['transactions'],
  EMAIL:     ['email_campaigns'],
  LABOR:     ['staff', 'staff_shifts'], // either satisfies
};

// ---------------------------------------------------------------------------
// AGENT_TRIGGER_DEPS — each trigger's DOMAIN requirements, mirroring
// TRIGGER_REQUIREMENTS in api/agents/data-availability-check.js.
// ---------------------------------------------------------------------------

export const AGENT_TRIGGER_DEPS = {
  'risk-trigger':         { requires: [DOMAINS.CRM] },
  'arrival-trigger':      { requires: [DOMAINS.CRM, DOMAINS.TEE_SHEET] },
  'complaint-trigger':    { requires: [DOMAINS.CRM] },
  'service-save-trigger': { requires: [DOMAINS.CRM] },
  'fb-trigger':           { requires: [DOMAINS.CRM, DOMAINS.POS] },
  'gameplan-trigger':     { requires: [DOMAINS.CRM, DOMAINS.TEE_SHEET] },
  'staffing-trigger':     { requires: [DOMAINS.LABOR] },
  'board-report-trigger': { requires: [DOMAINS.CRM] },
  'cos-trigger':          { requires: [DOMAINS.CRM] },
};

// ---------------------------------------------------------------------------
// TRIGGER_TO_AGENT_ID — which agent_id each trigger writes to agent_actions
// under. Needed so the loop can look up live_* rows and attribute them back
// to the trigger that fired them.
// ---------------------------------------------------------------------------

export const TRIGGER_TO_AGENT_ID = {
  'risk-trigger':         'member-pulse',
  'arrival-trigger':      'arrival-anticipation',
  'complaint-trigger':    'service-recovery',
  'service-save-trigger': 'member-service-recovery',
  'fb-trigger':           'fb-intelligence',
  'gameplan-trigger':     'tomorrows-game-plan',
  'staffing-trigger':     'staffing-demand',
  'board-report-trigger': 'board-report-compiler',
  'cos-trigger':          'chief-of-staff',
};

// ---------------------------------------------------------------------------
// Helpers — resolve a set of loaded stage keys into the set of tables that
// are loaded and the set of DOMAINS that are satisfied.
// ---------------------------------------------------------------------------

/**
 * Given a Set of stage keys that have been imported, return a Set of DB
 * tables that currently have rows for the test club.
 */
export function loadedTables(loadedStages) {
  const tables = new Set();
  for (const stage of loadedStages) {
    const mapped = STAGE_KEY_TO_TABLES[stage] || [];
    for (const t of mapped) tables.add(t);
  }
  return tables;
}

/**
 * Given a Set of stage keys, return the Set of DOMAIN flags that
 * data-availability-check would consider "satisfied".
 */
export function satisfiedDomains(loadedStages) {
  const tables = loadedTables(loadedStages);
  const domains = new Set();
  for (const [domain, requiredTables] of Object.entries(DOMAIN_TO_TABLES)) {
    if (requiredTables.some(t => tables.has(t))) {
      domains.add(domain);
    }
  }
  return domains;
}

/**
 * Returns true iff every table in `needed` is in the loaded set.
 * Used for insight-diff assertions.
 */
export function allTablesLoaded(needed, loadedStages) {
  const tables = loadedTables(loadedStages);
  return needed.every(t => tables.has(t));
}

/**
 * Returns true iff every domain in `needed` is in the satisfied set.
 * Used for agent-eligibility assertions.
 */
export function allDomainsSatisfied(needed, loadedStages) {
  const domains = satisfiedDomains(loadedStages);
  return needed.every(d => domains.has(d));
}
