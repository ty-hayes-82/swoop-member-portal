#!/usr/bin/env node
/**
 * scripts/pinetree-seed-personas.mjs
 *
 * Seeds all Pinetree test personas (7 staff + 3 members) by calling the
 * 023-seed-personas migration endpoint, then writes credentials to
 * critiques/pinetree-personas.json for use by test scripts.
 *
 * Usage:
 *   APP_URL=https://swoop-member-portal-dev.vercel.app node scripts/pinetree-seed-personas.mjs
 *
 * Requires critiques/pinetree-creds.json with GM credentials (from pinetree-setup.mjs).
 *
 * Output: critiques/pinetree-personas.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { login } from './lib/infra.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_URL = (process.env.APP_URL || 'https://swoop-member-portal-dev.vercel.app').replace(/\/$/, '');
const CREDS_FILE = path.join(__dirname, '../..', 'critiques', 'pinetree-creds.json');
const OUTPUT_FILE = path.join(__dirname, '../..', 'critiques', 'pinetree-personas.json');

console.log('═══════════════════════════════════════════════════');
console.log('  Pinetree — Seed Test Personas');
console.log('═══════════════════════════════════════════════════');
console.log(`App: ${APP_URL}\n`);

// Load GM credentials
let creds;
try {
  creds = JSON.parse(fs.readFileSync(CREDS_FILE, 'utf8'));
} catch (e) {
  console.error(`✗ Cannot read ${CREDS_FILE}`);
  console.error('  Run: node scripts/pinetree-setup.mjs first');
  process.exit(1);
}

// Re-login to get fresh token
let token;
try {
  const fresh = await login(APP_URL, creds.email, creds.password);
  token = fresh.token;
  console.log(`Auth: logged in as ${creds.email}`);
} catch (e) {
  console.error(`✗ Login failed: ${e.message}`);
  process.exit(1);
}

// Call the seed-personas migration endpoint
console.log('\nCalling /api/migrations/023-seed-personas…\n');
const res = await fetch(`${APP_URL}/api/migrations/023-seed-personas`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

const text = await res.text();
let data;
try {
  data = JSON.parse(text);
} catch (e) {
  console.error(`✗ Response was not JSON (status=${res.status}):`);
  console.error(text.slice(0, 500));
  process.exit(1);
}

if (!res.ok) {
  console.error(`✗ Migration failed (status=${res.status}):`, JSON.stringify(data));
  process.exit(1);
}

console.log(`Created: ${data.created} new accounts`);
console.log(`Skipped: ${data.skipped} existing accounts`);

// Print staff summary
console.log('\n── Staff Personas ──────────────────────────────────');
for (const s of (data.credentials?.staff || [])) {
  if (s.error) {
    console.log(`  ✗ ${s.email}: ${s.error}`);
  } else {
    console.log(`  ✓ [${s.role.padEnd(20)}] ${s.name} <${s.email}>`);
  }
}

// Print member summary
console.log('\n── Member Personas ─────────────────────────────────');
for (const m of (data.credentials?.members || [])) {
  if (m.error) {
    console.log(`  ✗ ${m.email}: ${m.error}`);
  } else {
    console.log(`  ✓ [${(m.memberId || '').padEnd(10)}] ${m.name} <${m.email}>`);
    console.log(`      ${m.profile}`);
  }
}

// Build output — merge club-level fields from pinetree-creds.json
const output = {
  clubId: data.credentials.clubId || creds.clubId,
  appUrl: APP_URL,
  password: 'Pinetree1!',
  staff: data.credentials.staff || [],
  members: data.credentials.members || [],
  // Keep GM admin creds for migrations/admin operations
  admin: {
    email: creds.email,
    password: creds.password,
    token: creds.token,
    clubId: creds.clubId,
    userId: creds.userId,
  },
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
console.log(`\n✓ Credentials saved to critiques/pinetree-personas.json`);
console.log('\n  To use in tests:');
console.log('    PERSONAS_FILE=critiques/pinetree-personas.json node scripts/test-agent-endpoints.mjs');
console.log('═══════════════════════════════════════════════════\n');
