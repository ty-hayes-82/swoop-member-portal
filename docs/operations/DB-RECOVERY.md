# Database Backup & Recovery Runbook

> **Status:** Best-effort first draft. **Several facts marked TODO** are blocked on a Vercel support ticket — see §6.
> **Owner:** DevOps lead.
> **Cadence:** Reviewed at every quarterly rollback drill (RUNBOOK §5.1).
> **Companion to:** [`RUNBOOK.md`](./RUNBOOK.md) §4 (Database) and §12.2 (Database backup & recovery — TODO stub).
> **Created 2026-04-09** as part of the F1 autonomous sweep (PRODUCT-FINALIZATION criterion 9). Closes §12.2.

This file is the **single source of truth** for how we back up the production Postgres database, how long backups are retained, and how we restore from them. If a fact below is wrong, fix it here in the same PR as the discovery.

---

## 1. What backs up automatically

Swoop runs on **Vercel Postgres** (the managed Neon-backed offering). According to Vercel's Storage docs and the Neon documentation:

- **Point-in-time recovery** is available for paid Vercel Postgres tiers via the Vercel dashboard. The retention window depends on the plan tier.
- **TODO:** confirm the exact retention window for our project's plan. **Filed:** _(no ticket yet — DevOps to file with Vercel support)_
- **TODO:** confirm whether nightly logical backups are taken in addition to PITR.

**Until the gaps above are filled, treat the recovery RTO/RPO as "unknown" and plan for the worst case.**

---

## 2. Bootstrap: logical backups via `pg_dump`

If the Vercel Postgres retention window is < 7 days (or unknown), we should take our own nightly logical backups until we can confirm.

### 2.1 Manual one-shot backup

Run from any machine that can reach the production DB. Use a read-only `POSTGRES_URL` if one exists.

```bash
# Set the URL from Vercel project env vars
export POSTGRES_URL='postgres://...'

# Dump everything to a timestamped file
pg_dump --no-owner --no-acl --format=custom \
  --file="swoop-$(date +%Y%m%d-%H%M%S).dump" \
  "$POSTGRES_URL"

# Verify the dump is non-empty and contains the expected tables
pg_restore --list "swoop-$(date +%Y%m%d-%H%M%S).dump" | head
```

Expected output: a list of `TABLE`, `INDEX`, `CONSTRAINT`, and `FK CONSTRAINT` entries for every table in `docs/operations/DATABASE.md` §1.

### 2.2 Recommended automated cadence

Until Vercel Postgres retention is confirmed sufficient, run a nightly `pg_dump` to S3 or another off-platform store. **Not yet automated** — this is the §12.2 outstanding work.

Suggested schedule (for the future automation ticket):

```
Daily  03:00 UTC  pg_dump → s3://swoop-db-backups/daily/
Weekly Sunday    pg_dump → s3://swoop-db-backups/weekly/
Monthly 1st      pg_dump → s3://swoop-db-backups/monthly/
Retention:       daily 7d, weekly 4w, monthly 12m
```

---

## 3. Restore procedures

### 3.1 Point-in-time recovery (Vercel dashboard) — **PREFERRED**

For data-loss incidents within the retention window (e.g. accidental `DELETE` of a club's data, bad migration, dropped table):

1. Vercel dashboard → Storage → select the Postgres database → **Backups** tab.
2. Find the closest restore point BEFORE the incident.
3. Click **Restore**. Follow the prompts. Vercel will create a new database (or branch); it does **not** overwrite the live one.
4. Once restored, **verify the data is correct** before any cutover.
5. Cutover plan: update `POSTGRES_URL` in Vercel project env vars to point at the restored database. Trigger a redeploy. Watch `/api/health` for `db: ok`.
6. Keep the old (corrupted) database online for at least 7 days for forensics.

**RTO estimate:** ~30 minutes from decision to live, assuming no migrations need replay.
**RPO estimate:** depends on the Vercel plan PITR granularity (TODO confirm).

### 3.2 Restore from `pg_dump` file

If PITR is unavailable or insufficient (e.g. older than retention window):

```bash
# Create a fresh empty database
psql "$ADMIN_POSTGRES_URL" -c 'CREATE DATABASE swoop_restore'

# Restore the dump
pg_restore --no-owner --no-acl --dbname="$RESTORE_POSTGRES_URL" \
  --jobs=4 --verbose swoop-YYYYMMDD-HHMMSS.dump

# Verify row counts on critical tables
psql "$RESTORE_POSTGRES_URL" -c '
  SELECT
    (SELECT COUNT(*) FROM members) AS members,
    (SELECT COUNT(*) FROM rounds) AS rounds,
    (SELECT COUNT(*) FROM transactions) AS transactions,
    (SELECT COUNT(*) FROM cross_club_audit) AS audit_rows;
'
```

### 3.3 Replay migrations after restore

If the restored database is older than the latest migration (e.g. you restored a 30-day-old backup), run pending migrations using the safe runner:

```bash
# DRY RUN first (default — no mutations)
node scripts/migrate.mjs

# If the dry run looks correct, apply
node scripts/migrate.mjs --apply
```

The migration runner has a **safety guard** added in Sprint 1 (B9) after an incident where 13 migrations were inadvertently applied. It will refuse to mutate without `--apply`.

See [`RUNBOOK.md`](./RUNBOOK.md) §4 and [`DATABASE.md`](./DATABASE.md) for the migration history. Migrations 003-005 have a constraint history; 007+009 enforce `club_id`; 014 created `member_invoices` retroactively; 015 is `cross_club_audit`; 016 is pause_state.

---

## 4. Pre-restore checklist (do these BEFORE any restore)

1. **Stop the bleeding.** If the incident is ongoing (e.g. a runaway script is still deleting rows), kill the process / disable the offending feature flag first.
2. **Confirm the incident timeline.** When did the data loss start? Which tables/clubs are affected? This determines the restore point.
3. **Communicate.** Page DevOps lead + GM (release readiness owner) + PM. SEV1 if a pilot club is affected.
4. **Snapshot the current (corrupted) state** for forensics — `pg_dump` the live DB before doing anything. This is your "before" copy.
5. **Pick the restore method:** PITR > pg_dump file > manual reconstruction.
6. **Restore to a NEW database**, never overwrite the live one. Verify, then cut over.
7. **Post-mortem** within 48 h — see [`RUNBOOK.md`](./RUNBOOK.md) §7.2 for the SLA.

---

## 5. Smoke test after restore

Once a restore completes and `POSTGRES_URL` points to the new database, verify:

```bash
# Health check
curl https://swoop-member-portal-dev.vercel.app/api/health
# expect: db: 'ok', integrations.weather + integrations.audit reporting

# Critical query — clubs exist
psql "$POSTGRES_URL" -c 'SELECT club_id, name FROM club ORDER BY club_id;'

# Critical query — members exist for the affected club
psql "$POSTGRES_URL" -c "SELECT COUNT(*) FROM members WHERE club_id = '<affected>';"

# Run the full Playwright smoke gate against the dev preview
APP_URL=https://swoop-member-portal-dev.vercel.app npx playwright test \
  tests/e2e/storyboard-flows.spec.js tests/e2e/polish-final.spec.js --project="Desktop Chrome"
# expect: 12/12 passing
```

If any of the above fails, **DO NOT cut over to the restored database**. Triage first.

---

## 6. Outstanding gaps (TODOs)

Filed as part of the §12.2 stub closure 2026-04-09. Each one needs a Linear ticket.

| # | Gap | Owner | Resolution path |
|---|---|---|---|
| 1 | Vercel Postgres PITR retention window is unknown for our project's plan | DevOps | File support ticket; document the answer here |
| 2 | Nightly logical backup automation does not exist | DevOps | Build a Vercel cron job that calls `pg_dump` and pipes to S3 (`api/cron/nightly-pgdump.js`); add to RUNBOOK §6 cron table |
| 3 | A full restore drill has never been performed on production | DevOps + GM | Schedule first restore drill as part of the next quarterly rollback drill (RUNBOOK §5.1) |
| 4 | We have no documented RTO/RPO commitments | GM + DevOps | Once gap #1 is resolved, document RTO/RPO publicly (or to clubs as part of the pilot SLA) |
| 5 | The migration runner only mutates with `--apply`, but there is no automated test that the dry-run output matches what `--apply` will do | Backend | File ticket — add a `pg_dump --schema-only` diff between dry-run-target and live DB |
| 6 | No alerting on backup job success/failure (because there is no backup job yet) | DevOps | Once gap #2 is resolved, page on 0-success-in-48h |

---

## 7. Cross-references

- [`RUNBOOK.md`](./RUNBOOK.md) §4 — Database
- [`RUNBOOK.md`](./RUNBOOK.md) §12.2 — Database backup & recovery (TODO stub — closed by this file)
- [`DATABASE.md`](./DATABASE.md) — schema reference and migration history
- [`PRODUCT-FINALIZATION.md`](./PRODUCT-FINALIZATION.md) §11.4 — Runbook gap follow-ups
- [`SECRETS-INVENTORY.md`](./SECRETS-INVENTORY.md) — `POSTGRES_URL` rotation procedure
