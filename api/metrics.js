// api/metrics.js — operational metrics scrape target.
//
// Intended for external uptime/scraper services (Better Stack, Pingdom, etc.)
// that poll at a fixed interval and build their own histograms/alerting.
//
// Not to be confused with /api/health — health is a public, always-200 probe
// for load balancers; metrics is a protected, structured operational readout.
//
// Auth: shared-secret header `x-metrics-token` matched against METRICS_TOKEN.
// No withAuth / no user session — scrapers don't log in.
//
// Shape:
//   {
//     timestamp, responseTimeMs,
//     db: { ok, latency_ms },           // single SELECT 1 round-trip; p95 is
//                                       //   computed by the external scraper
//                                       //   from its own history, not in-process
//     integrations: {
//       weather: { lastSync, ageSeconds, status },
//       audit:   { lastSync, ageSeconds, status },
//     },
//     sessions: { active_24h, active_7d }
//   }

import { sql } from '@vercel/postgres';
import { cors } from './lib/cors.js';

// Freshness budgets — kept in sync with api/health.js deliberately; the two
// endpoints serve different consumers and we do not want health to break if
// metrics evolves (or vice versa).
const WEATHER_FRESH_MAX_HOURS = 36;
const AUDIT_RETENTION_DAYS = 90;

function ageSeconds(ts) {
  return Math.round((Date.now() - new Date(ts).getTime()) / 1000);
}

async function weatherLastSync() {
  try {
    const { rows } = await sql`
      SELECT MAX(created_at) AS last_sync FROM weather_daily_log
    `;
    const lastSync = rows?.[0]?.last_sync || null;
    if (!lastSync) return { lastSync: null, ageSeconds: null, status: 'unknown' };
    const age = ageSeconds(lastSync);
    const status = age <= WEATHER_FRESH_MAX_HOURS * 3600 ? 'ok' : 'stale';
    return { lastSync: new Date(lastSync).toISOString(), ageSeconds: age, status };
  } catch {
    return { lastSync: null, ageSeconds: null, status: 'unknown' };
  }
}

async function auditLastSync() {
  // cross_club_audit has no "last sync" — it's append-on-event. Report the
  // most recent row as "lastSync" and derive staleness from the purge budget
  // (oldest row should never exceed retention + grace).
  try {
    const { rows } = await sql`
      SELECT MAX(occurred_at) AS last_row, MIN(occurred_at) AS oldest
      FROM cross_club_audit
    `;
    const r = rows?.[0] || {};
    const lastSync = r.last_row ? new Date(r.last_row).toISOString() : null;
    const age = lastSync ? ageSeconds(lastSync) : null;
    let status = 'unknown';
    if (r.oldest) {
      const oldestAgeDays = Math.round(
        (Date.now() - new Date(r.oldest).getTime()) / 86_400_000
      );
      status = oldestAgeDays <= AUDIT_RETENTION_DAYS + 10 ? 'ok' : 'stale';
    } else if (lastSync) {
      status = 'ok';
    }
    return { lastSync, ageSeconds: age, status };
  } catch {
    return { lastSync: null, ageSeconds: null, status: 'unknown' };
  }
}

async function sessionCounts() {
  // `sessions` table stores auth tokens with created_at + expires_at. We count
  // rows whose created_at falls inside the window — a better proxy for "active
  // logins" than expires_at (which can be weeks in the future).
  try {
    const { rows } = await sql`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::int AS active_24h,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int  AS active_7d
      FROM sessions
    `;
    return {
      active_24h: rows?.[0]?.active_24h ?? 0,
      active_7d: rows?.[0]?.active_7d ?? 0,
    };
  } catch {
    return { active_24h: null, active_7d: null };
  }
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const expected = process.env.METRICS_TOKEN;
  if (!expected || req.headers['x-metrics-token'] !== expected) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const startedAt = Date.now();

  // db.latency_ms — single round-trip. Historical p95 is the scraper's job.
  let dbOk = false;
  let dbLatencyMs = null;
  try {
    const t0 = Date.now();
    await sql`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  let integrations = {
    weather: { lastSync: null, ageSeconds: null, status: 'unknown' },
    audit:   { lastSync: null, ageSeconds: null, status: 'unknown' },
  };
  let sessions = { active_24h: null, active_7d: null };

  if (dbOk) {
    const [weather, audit, sess] = await Promise.all([
      weatherLastSync(),
      auditLastSync(),
      sessionCounts(),
    ]);
    integrations = { weather, audit };
    sessions = sess;
  }

  res.status(200).json({
    timestamp: new Date().toISOString(),
    responseTimeMs: Date.now() - startedAt,
    db: { ok: dbOk, latency_ms: dbLatencyMs },
    integrations,
    sessions,
  });
}
