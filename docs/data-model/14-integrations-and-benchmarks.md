# 14. Integrations & Benchmarks Domain

*Connected system registry, data sync tracking, CSV import management, and industry benchmarks.*

**Tables:** `connected_systems`, `industry_benchmarks`, `data_source_status`, `data_syncs`, `csv_imports`

---

## `connected_systems`

Vendor registry of all connected data sources.

**Schema source:** seed | **PK:** `system_id`

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `system_id` | VARCHAR(50) | NO | | PK | Config entry per vendor. |
| `vendor_name` | VARCHAR(100) | YES | | Vendor name | Config. Jonas entry = "Jonas Club Software". |
| `category` | VARCHAR(50) | YES | | tee_sheet / pos / crm / scheduling / email / weather / finance | Config. |
| `status` | VARCHAR(20) | YES | 'available' | connected / available / error | System health check. |
| `last_sync` | TIMESTAMPTZ | YES | | Last sync timestamp | System. |
| `data_points_synced` | INT | YES | 0 | Total data points synced | System. |
| `config` | JSONB | YES | | Integration configuration | Club admin setup. |

---

## `industry_benchmarks`

Club vs. industry metric comparisons.

**Schema source:** seed | **PK:** `metric_key`

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `metric_key` | VARCHAR(50) | NO | | PK | Club Benchmarking / GGA data. |
| `club_value` | NUMERIC(12,2) | YES | | Club's current value | Computed from club data. |
| `industry_value` | NUMERIC(12,2) | YES | | Industry average | Club Benchmarking data. |
| `unit` | VARCHAR(10) | YES | | Unit of measurement (%, $, etc.) | Config. |
| `label` | VARCHAR(100) | YES | | Display label | Config. |
| `comparison_text` | VARCHAR(50) | YES | | e.g. "12% above average" | **Swoop Computed.** |
| `direction` | VARCHAR(20) | YES | | higher_better / lower_better | Config. |

---

## `data_source_status`

Per-domain connectivity health monitoring.

**Schema source:** migration | **PK:** `status_id` (UUID)
**Unique:** (club_id, domain_code)
**Indexes:** idx_data_source_status_club

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `status_id` | TEXT | NO | gen_random_uuid() | PK | N/A (system). |
| `club_id` | TEXT | NO | | FK to club | **Swoop Platform.** |
| `domain_code` | TEXT | NO | | Domain identifier (golf, dining, email, etc.) | **Swoop Platform.** |
| `is_connected` | BOOLEAN | NO | FALSE | Whether domain has live data | **Swoop Platform.** |
| `source_vendor` | TEXT | YES | | Connected vendor name | **Swoop Platform.** |
| `last_sync_at` | TIMESTAMPTZ | YES | | Last successful sync | N/A (system). |
| `row_count` | INTEGER | YES | 0 | Total rows synced | **Swoop Platform.** |
| `staleness_hours` | INTEGER | YES | | Hours since last sync | **Swoop Platform.** |
| `health_status` | TEXT | YES | 'unknown' | unknown / healthy / stale / error | **Swoop Platform.** |
| `updated_at` | TIMESTAMPTZ | YES | NOW() | Last status check | N/A (system). |

---

## `data_syncs`

Individual sync run logs.

**Schema source:** migration | **PK:** `sync_id` (UUID)
**Indexes:** idx_data_syncs_club(club_id, started_at DESC)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `sync_id` | TEXT | NO | gen_random_uuid() | PK | N/A (system). |
| `club_id` | TEXT | NO | | FK to club | **Swoop Platform.** |
| `source_type` | TEXT | NO | | Source system (jonas_members, foretees_rounds, etc.) | **Swoop Platform.** |
| `status` | TEXT | YES | 'running' | running / completed / failed | **Swoop Platform.** |
| `records_processed` | INTEGER | YES | 0 | Successfully processed rows | **Swoop Platform.** |
| `records_failed` | INTEGER | YES | 0 | Failed rows | **Swoop Platform.** |
| `error_message` | TEXT | YES | | Error details if failed | **Swoop Platform.** |
| `started_at` | TIMESTAMPTZ | YES | NOW() | Sync start | N/A (system). |
| `completed_at` | TIMESTAMPTZ | YES | | Sync completion | N/A (system). |

---

## `csv_imports`

CSV file import tracking.

**Schema source:** migration | **PK:** `import_id` (UUID)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `import_id` | TEXT | NO | gen_random_uuid() | PK | N/A (system). |
| `club_id` | TEXT | NO | | FK to club | **Swoop Platform.** |
| `uploaded_by` | TEXT | YES | | User who uploaded | **Swoop Platform.** |
| `file_name` | TEXT | YES | | Original file name | **Swoop Platform.** |
| `import_type` | TEXT | NO | | members / rounds / transactions / staff | **Swoop Platform.** |
| `status` | TEXT | YES | 'processing' | processing / completed / failed | **Swoop Platform.** |
| `total_rows` | INTEGER | YES | | Total rows in file | **Swoop Platform.** |
| `success_rows` | INTEGER | YES | 0 | Successfully imported | **Swoop Platform.** |
| `error_rows` | INTEGER | YES | 0 | Failed rows | **Swoop Platform.** |
| `errors` | JSONB | YES | '[]' | Error details per row | **Swoop Platform.** |
| `started_at` | TIMESTAMPTZ | YES | NOW() | Import start | N/A (system). |
| `completed_at` | TIMESTAMPTZ | YES | | Import completion | N/A (system). |
