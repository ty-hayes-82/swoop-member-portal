// api/health.js — public health probe.
//
// Always returns HTTP 200 so load balancers and uptime monitors get a stable
// response. The body reports DB connectivity, version, and uptime so operators
// can distinguish "healthy" from "running but DB down".
//
// Schema:
//   { status: 'ok'|'degraded', timestamp, version, db: 'ok'|'fail', uptimeSec, node }
//
// 'ok'       — every check passed
// 'degraded' — service is reachable but a downstream dependency failed
//
// No auth. No PII. No secrets. Safe to expose publicly.

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

  const status = dbStatus === 'ok' ? 'ok' : 'degraded';
  const body = {
    status,
    timestamp: new Date().toISOString(),
    version: readVersion(),
    db: dbStatus,
    dbLatencyMs,
    uptimeSec: Math.round((Date.now() - START_TIME) / 1000),
    node: process.version,
    responseTimeMs: Date.now() - startedAt,
  };

  // Always 200 — load balancers want a body even when degraded.
  res.status(200).json(body);
}
