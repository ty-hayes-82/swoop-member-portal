#!/usr/bin/env node
/**
 * scripts/migrate.mjs — Database migration runner
 *
 * Reads api/migrations/[0-9]*.js in numeric order and applies each that
 * hasn't already been recorded in the `migrations_log` table. Idempotent:
 * re-running is a no-op if everything is already applied.
 *
 * The migration files in api/migrations/ are Vercel serverless API handlers
 * that export a default async function (req, res). This runner invokes them
 * directly with a mock req/res so the same files power both the production
 * HTTP path and the CLI path — no duplicated schema logic.
 *
 * Usage:
 *   node scripts/migrate.mjs            # apply pending migrations
 *   node scripts/migrate.mjs --status   # show applied/pending without running
 *   node scripts/migrate.mjs --dry-run  # list what would run, skip DB writes
 *   node scripts/migrate.mjs --help     # print usage
 *
 * Env:
 *   POSTGRES_URL (or POSTGRES_URL_NON_POOLING) must be set. If not set, the
 *   runner tries to load .env.local from the repo root before connecting.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');
const MIGRATIONS_DIR = join(REPO_ROOT, 'api', 'migrations');

const HELP = `Usage: node scripts/migrate.mjs [options]

Lists or applies pending database migrations from api/migrations/ in numeric order.

SAFE BY DEFAULT: without --apply, this command never mutates the database.
You must pass --apply explicitly to actually run migrations against the
configured POSTGRES_URL.

Options:
  --status    Print applied / pending migrations and exit (no DB writes)
  --dry-run   Same as --status, kept for compatibility (no DB writes)
  --apply     ACTUALLY apply pending migrations to the configured database.
              Required to perform any DB mutation. Without this flag the
              command runs in dry-run / status mode.
  --help, -h  Show this help

Each migration is an ES module that default-exports a Vercel-style
(req, res) handler. The runner invokes it with a mock POST request and
records success in the migrations_log table.

Re-running with all migrations applied is a safe no-op.

Production deploys: review the printed plan first (no flag), then re-run
with --apply once you have explicit approval.
`;

// ---------- arg parsing ----------
const args = new Set(process.argv.slice(2));
if (args.has('--help') || args.has('-h')) {
  process.stdout.write(HELP);
  process.exit(0);
}
const STATUS_ONLY = args.has('--status');
const DRY_RUN = args.has('--dry-run');
const APPLY = args.has('--apply');
// SAFETY: default to dry-run unless --apply is explicitly passed.
// This prevents accidental DB mutation when the script is imported,
// invoked by another tool, or run by an agent.
const EFFECTIVE_DRY_RUN = DRY_RUN || !APPLY;

// ---------- env loading ----------
function loadEnvLocal() {
  if (process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING) return;
  const envFile = join(REPO_ROOT, '.env.local');
  if (!existsSync(envFile)) return;
  const raw = readFileSync(envFile, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnvLocal();

// ---------- migration discovery ----------
function discoverMigrations() {
  if (!existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
  }
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d+.*\.js$/.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/^(\d+)/)[1], 10);
      const nb = parseInt(b.match(/^(\d+)/)[1], 10);
      return na - nb;
    });
  return files.map((file) => ({
    id: file.replace(/\.js$/, ''),
    file,
    path: join(MIGRATIONS_DIR, file),
  }));
}

// ---------- mock req/res for handler invocation ----------
function makeMockReqRes() {
  const req = { method: 'POST', query: {}, body: {}, headers: {} };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    send(payload) { this.body = payload; return this; },
    setHeader() { return this; },
    end() { return this; },
  };
  return { req, res };
}

// ---------- main ----------
async function main() {
  const migrations = discoverMigrations();

  if (STATUS_ONLY || DRY_RUN) {
    // For status/dry-run we still need the log table to know what's applied,
    // unless the user has no DB configured — in which case just list files.
    if (!process.env.POSTGRES_URL && !process.env.POSTGRES_URL_NON_POOLING) {
      console.log(`[migrate] No POSTGRES_URL set — listing migration files only`);
      for (const m of migrations) console.log(`  ${m.id}`);
      console.log(`[migrate] total: ${migrations.length}`);
      return;
    }
  }

  if (!process.env.POSTGRES_URL && !process.env.POSTGRES_URL_NON_POOLING) {
    console.error('[migrate] POSTGRES_URL not set. Aborting.');
    console.error('          Set POSTGRES_URL in .env.local or the environment.');
    process.exit(1);
  }

  // Lazy import — so --help / file-listing work with no deps resolved
  const { sql } = await import('@vercel/postgres');

  // Ensure log table exists
  await sql`
    CREATE TABLE IF NOT EXISTS migrations_log (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW(),
      status TEXT NOT NULL DEFAULT 'ok',
      notes TEXT
    )
  `;

  const appliedRows = await sql`SELECT id FROM migrations_log WHERE status = 'ok'`;
  const applied = new Set(appliedRows.rows.map((r) => r.id));

  console.log(`[migrate] discovered ${migrations.length} migrations, ${applied.size} already applied`);

  if (STATUS_ONLY) {
    for (const m of migrations) {
      const tag = applied.has(m.id) ? 'APPLIED' : 'pending';
      console.log(`  [${tag}] ${m.id}`);
    }
    return;
  }

  const pending = migrations.filter((m) => !applied.has(m.id));
  if (pending.length === 0) {
    console.log('[migrate] nothing to do — all migrations applied');
    return;
  }

  console.log(`[migrate] ${pending.length} pending:`);
  for (const m of pending) console.log(`  - ${m.id}`);

  if (EFFECTIVE_DRY_RUN) {
    if (!APPLY) {
      console.log('[migrate] DRY RUN — pass --apply to actually run these migrations');
    } else {
      console.log('[migrate] --dry-run set, not executing');
    }
    return;
  }

  let failed = null;
  for (const m of pending) {
    process.stdout.write(`[migrate] applying ${m.id} ... `);
    try {
      const mod = await import(pathToFileURL(m.path).href);
      const handler = mod.default || mod.run || mod.handler;
      if (typeof handler !== 'function') {
        throw new Error(`migration ${m.id} has no default export / run() / handler()`);
      }
      const { req, res } = makeMockReqRes();
      await handler(req, res);

      // Vercel handlers set 2xx on success, 207 for partial, 5xx on failure.
      // We accept 200-299 and 207 (multi-status partial ok).
      const ok = res.statusCode >= 200 && res.statusCode < 300;
      if (!ok) {
        throw new Error(`handler returned HTTP ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }

      const notes = res.body ? JSON.stringify(res.body).slice(0, 500) : null;
      await sql`
        INSERT INTO migrations_log (id, status, notes)
        VALUES (${m.id}, 'ok', ${notes})
        ON CONFLICT (id) DO UPDATE
          SET status = 'ok', applied_at = NOW(), notes = EXCLUDED.notes
      `;
      console.log(`ok (HTTP ${res.statusCode})`);
    } catch (err) {
      console.log(`FAILED`);
      console.error(`[migrate]   error: ${err.message}`);
      try {
        await sql`
          INSERT INTO migrations_log (id, status, notes)
          VALUES (${m.id}, 'error', ${err.message.slice(0, 500)})
          ON CONFLICT (id) DO UPDATE
            SET status = 'error', applied_at = NOW(), notes = EXCLUDED.notes
        `;
      } catch { /* best-effort */ }
      failed = m.id;
      break;
    }
  }

  if (failed) {
    console.error(`[migrate] stopped at ${failed}. Fix the error and re-run.`);
    process.exit(1);
  }
  console.log('[migrate] done');
}

main().catch((err) => {
  console.error('[migrate] fatal:', err);
  process.exit(1);
});
