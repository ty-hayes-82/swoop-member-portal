# scripts/operator/

One-shot operator scripts for the Swoop Golf member portal. These are **CLI
tools**, not API routes. They used to live under `api/` and ship as Vercel
serverless functions, which wasted cold-start memory, exposed noisy endpoints
to scanners, and cluttered the API surface. The B10 audit gated them at the
route level; this move takes the next step and removes them from `api/`
entirely so Vercel never sees them.

## How to run one

```bash
ALLOW_DEBUG=true node scripts/operator/<filename>
```

Each script loads `.env.local` from the repo root if `POSTGRES_URL` /
`POSTGRES_URL_NON_POOLING` are not already set in the environment.

`ALLOW_DEBUG=true` is **required**. These scripts still contain the
`NODE_ENV === 'production' && !ALLOW_DEBUG` guard from their old route
lifetime. Leaving the guard in means (a) we do not have to modify 23 handler
bodies, and (b) the guard still protects anyone who points a script at a
production DB without thinking about it. Set `ALLOW_DEBUG=true` consciously
before every invocation.

On success the script exits 0 after printing its result as JSON followed by
`OK`. On failure it exits 1 with `FAILED: <message>`.

## Why they are not in `api/` anymore

- No cold-start cost for routes nobody calls
- Not crawlable by scanners pointed at the deployment
- Clearer separation between real request handlers and operator-only code
- `scripts/lint-clubid.mjs` intentionally does **not** scan this directory:
  these run as CLI jobs, not per-request handlers, so the `req.auth.clubId`
  rule does not apply

## Categories

| Prefix    | Purpose                                                                 |
| --------- | ----------------------------------------------------------------------- |
| `seed-*`  | One-shot data seeders for demo clubs, pipelines, insights, agents, etc. |
| `fix-*`   | One-shot data repair jobs (destructive — read the source first).        |
| `check-*` | Read-only diagnostics for specific tables / columns.                    |
| `schema-*`| Schema introspection (column lists, FK graph, etc.).                    |
| `debug-*` | Ad-hoc DB probing during incident response.                             |

## Inventory

- `check-email.js`, `check-email2.js`, `check-tables.js`
- `debug-db.js`
- `fix-cancel.js`, `fix-cancel2.js`, `fix-decay-curves.js`, `fix-prd.js`, `fix-resigned-scores.js`
- `schema-all.js`, `schema-check.js`
- `seed-activity-log.js`, `seed-agents.js`, `seed-benchmarks.js`,
  `seed-board-report.js`, `seed-experience-insights.js`, `seed-fix.js`,
  `seed-fix-v2.js`, `seed-integrations.js`, `seed-location.js`,
  `seed-personalization.js`, `seed-realistic.js`, `seed-tee-sheet-ops.js`

## WARNING — destructive operations

Scripts under `fix-*` and `seed-*` **mutate the database**. Some of them
truncate or overwrite rows without prompting. Before running any of them:

1. Read the source. Understand exactly what it writes.
2. Confirm which DB `.env.local` points at. If it points at production, stop
   and think again.
3. Prefer a dev / preview DB for rehearsal.
4. Never set `ALLOW_DEBUG=true` in production for longer than one audited
   window, and unset it immediately after.

## Not a migration runner

For real schema migrations use **[`scripts/migrate.mjs`](../migrate.mjs)**,
which reads `api/migrations/*.js` in numeric order and records results in the
`migrations_log` table. Do not add new schema changes to `scripts/operator/`.
