// api/health.js — public health probe.
//
// Always returns HTTP 200 so load balancers and uptime monitors get a stable
// response. The body reports DB connectivity, version, uptime, AND per-integration
// sync freshness so operators can distinguish "healthy" from "running but a
// downstream sync is stale".
//
// Schema:
//   {
//     status: 'ok'|'degraded',
//     timestamp, version, db: 'ok'|'fail', uptimeSec, node,
//     integrations: {
//       weather:    { status: 'ok'|'stale'|'unknown', lastSync: ISO|null, ageMin: number|null },
//       audit:      { status: 'ok'|'stale'|'unknown', rows: number|null, oldestRow: ISO|null },
//     }
//   }
//
// 'ok'       — every check passed
// 'degraded' — service is reachable but a downstream dependency failed
//
// No auth. No PII. No secrets. Safe to expose publicly.
// PRODUCT-FINALIZATION criterion 7 (Phase F2): per-integration sync status.

import { sql } from '@vercel/postgres';
import { cors } from './lib/cors.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cache version + start time per cold-start.
let CACHED_VERSION = null;
const START_TIME = Date.now();

function readVersion() {
  if (CACHED_VERSION) return CACHED_VERSION;
  try {
    const pkgPath = resolve(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    CACHED_VERSION = pkg.version || 'unknown';
  } catch {
    CACHED_VERSION = 'unknown';
  }
  return CACHED_VERSION;
}

// Per-integration freshness budgets. Tighten as SLAs harden.
const WEATHER_FRESH_MAX_HOURS = 36; // weather-daily runs every 24h; 36h = one missed tick
const AUDIT_RETENTION_DAYS = 90;    // SEC-2a purge cron retains 90 days

async function checkWeatherFreshness() {
  // weather-daily cron writes to weather_daily_log. Read the most recent row
  // across all clubs. If the freshest row is older than the budget, the sync
  // is stale (cron failure or no clubs configured).
  try {
    const { rows } = await sql`
      SELECT MAX(created_at) AS last_sync
      FROM weather_daily_log
    `;
    const lastSync = rows?.[0]?.last_sync || null;
    if (!lastSync) return { status: 'unknown', lastSync: null, ageMin: null };
    const ageMin = Math.round((Date.now() - new Date(lastSync).getTime()) / 60000);
    const status = ageMin <= WEATHER_FRESH_MAX_HOURS * 60 ? 'ok' : 'stale';
    return { status, lastSync: new Date(lastSync).toISOString(), ageMin };
  } catch {
    return { status: 'unknown', lastSync: null, ageMin: null };
  }
}

async function checkAuditPurge() {
  // The cross_club_audit purge cron (SEC-2a) keeps the table bounded to
  // AUDIT_RETENTION_DAYS. If the oldest row is much older than that budget,
  // the purge job is failing.
  try {
    const { rows } = await sql`
      SELECT COUNT(*)::int AS rows, MIN(occurred_at) AS oldest
      FROM cross_club_audit
    `;
    const r = rows?.[0] || {};
    const oldest = r.oldest ? new Date(r.oldest) : null;
    if (!oldest) return { status: 'ok', rows: r.rows ?? 0, oldestRow: null };
    const ageDays = Math.round((Date.now() - oldest.getTime()) / 86_400_000);
    // Allow a 10-day grace window past the retention budget
    const status = ageDays <= AUDIT_RETENTION_DAYS + 10 ? 'ok' : 'stale';
    return { status, rows: r.rows ?? 0, oldestRow: oldest.toISOString() };
  } catch {
    return { status: 'unknown', rows: null, oldestRow: null };
  }
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const startedAt = Date.now();
  let dbStatus = 'fail';
  let dbLatencyMs = null;
  try {
    const t0 = Date.now();
    await sql`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
    dbStatus = 'ok';
  } catch {
    // Health endpoint must never throw — degraded is a valid state.
    dbStatus = 'fail';
  }

  // Per-integration sync checks. Run in parallel; never throw.
  // Only attempt if DB is reachable — otherwise mark them all unknown.
  let integrations = {
    weather: { status: 'unknown', lastSync: null, ageMin: null },
    audit:   { status: 'unknown', rows: null, oldestRow: null },
  };
  if (dbStatus === 'ok') {
    try {
      const [weather, audit] = await Promise.all([
        checkWeatherFreshness(),
        checkAuditPurge(),
      ]);
      integrations = { weather, audit };
    } catch {
      // Defense in depth — already individually try/catch'd, but never let
      // the health endpoint throw under any circumstance.
    }
  }

  const anyStale = Object.values(integrations).some(i => i.status === 'stale');
  const status = dbStatus !== 'ok' || anyStale ? 'degraded' : 'ok';

  const body = {
    status,
    timestamp: new Date().toISOString(),
    version: readVersion(),
    db: dbStatus,
    dbLatencyMs,
    uptimeSec: Math.round((Date.now() - START_TIME) / 1000),
    node: process.version,
    responseTimeMs: Date.now() - startedAt,
    integrations,
  };

  // Always 200 — load balancers want a body even when degraded.
  res.status(200).json(body);
}
