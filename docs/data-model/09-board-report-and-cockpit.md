# 9. Board Report & Cockpit Domain

*Executive-level reporting: monthly snapshots of Swoop value, member intervention outcomes, operational intervention tracking. All tables are **Swoop Computed** with no direct Jonas source.*

**Tables:** `board_report_snapshots`, `member_interventions`, `operational_interventions`, `interventions`, `user_sessions`

---

## `board_report_snapshots`

Monthly executive snapshots of Swoop platform value.

**Schema source:** seed | **PK:** `snapshot_id` (SERIAL)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `snapshot_id` | SERIAL | NO | | PK | N/A (system). |
| `snapshot_date` | DATE | NO | | Month of snapshot | **Swoop Computed.** |
| `members_saved` | INT | YES | 0 | Members saved from resignation | **Swoop Computed.** |
| `dues_protected` | NUMERIC(12,2) | YES | 0 | Dues revenue protected | **Swoop Computed.** |
| `ltv_protected` | NUMERIC(12,2) | YES | 0 | Lifetime value protected | **Swoop Computed.** |
| `revenue_recovered` | NUMERIC(12,2) | YES | 0 | Revenue recovered from interventions | **Swoop Computed.** |
| `service_failures_caught` | INT | YES | 0 | Service failures detected | **Swoop Computed.** |
| `avg_response_time_hrs` | NUMERIC(5,1) | YES | 0 | Average response time in hours | **Swoop Computed.** |
| `board_confidence_pct` | INT | YES | 0 | Board confidence percentage | **Swoop Computed.** |

---

## `member_interventions`

Individual member save records with health score impact.

**Schema source:** seed | **PK:** `intervention_id` (SERIAL)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `intervention_id` | SERIAL | NO | | PK | N/A (system). |
| `member_id` | TEXT | YES | | FK to members | **Swoop Computed.** |
| `trigger_type` | VARCHAR(50) | YES | | What triggered the intervention | **Swoop Computed.** |
| `trigger_detail` | TEXT | YES | | Specific trigger details | **Swoop Computed.** |
| `action_taken` | TEXT | YES | | Action performed | **Swoop Computed.** |
| `outcome` | TEXT | YES | | Result of intervention | **Swoop Computed.** |
| `health_before` | INT | YES | | Health score before | **Swoop Computed.** |
| `health_after` | INT | YES | | Health score after | **Swoop Computed.** |
| `dues_at_risk` | NUMERIC(12,2) | YES | | Dues amount at risk | **Swoop Computed.** |
| `intervention_date` | DATE | YES | | Date of intervention | **Swoop Computed.** |
| `resolved_date` | DATE | YES | | Date resolved | **Swoop Computed.** |

---

## `operational_interventions`

Club-level operational saves (non-member-specific).

**Schema source:** seed | **PK:** `intervention_id` (SERIAL)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `intervention_id` | SERIAL | NO | | PK | N/A (system). |
| `event_type` | VARCHAR(100) | YES | | Type of operational event | **Swoop Computed.** |
| `event_date` | DATE | YES | | Event date | **Swoop Computed.** |
| `detection_method` | TEXT | YES | | How Swoop detected the issue | **Swoop Computed.** |
| `action_taken` | TEXT | YES | | Action performed | **Swoop Computed.** |
| `outcome` | TEXT | YES | | Result | **Swoop Computed.** |
| `revenue_protected` | NUMERIC(12,2) | YES | | Revenue protected | **Swoop Computed.** |
| `members_affected` | INT | YES | | Members impacted | **Swoop Computed.** |

---

## `interventions`

Production intervention lifecycle tracking with full outcome measurement.

**Schema source:** migration | **PK:** `intervention_id` (UUID)
**Indexes:** idx_interventions_member

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `intervention_id` | TEXT | NO | gen_random_uuid() | PK | N/A (system). |
| `club_id` | TEXT | NO | | FK to club | **Swoop Computed.** |
| `member_id` | TEXT | NO | | FK to members | **Swoop Computed.** |
| `action_id` | TEXT | YES | | FK to actions | **Swoop Computed.** |
| `intervention_type` | TEXT | NO | | Intervention category | **Swoop Computed.** |
| `description` | TEXT | YES | | Details | **Swoop Computed.** |
| `initiated_by` | TEXT | YES | | Who initiated | **Swoop Computed.** |
| `initiated_at` | TIMESTAMPTZ | YES | NOW() | Start timestamp | N/A (system). |
| `health_score_before` | REAL | YES | | Health score pre-intervention | **Swoop Computed.** |
| `health_score_after` | REAL | YES | | Health score post-intervention | **Swoop Computed.** |
| `outcome` | TEXT | YES | | Measured outcome | **Swoop Computed.** |
| `outcome_measured_at` | TIMESTAMPTZ | YES | | When outcome was measured | N/A (system). |
| `dues_protected` | NUMERIC(10,2) | YES | | Dues protected | **Swoop Computed.** |
| `revenue_recovered` | NUMERIC(10,2) | YES | | Revenue recovered | **Swoop Computed.** |
| `is_member_save` | BOOLEAN | YES | FALSE | Was this a member save | **Swoop Computed.** |

---

## `user_sessions`

GM login sessions for "Since Last Login" delta calculations.

**Schema source:** seed | **PK:** `session_id` (SERIAL)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `session_id` | SERIAL | NO | | PK | N/A (system). |
| `user_id` | VARCHAR(50) | YES | 'gm_default' | Dashboard user | **Swoop Computed.** |
| `login_at` | TIMESTAMPTZ | YES | NOW() | Login timestamp | N/A (system). |
| `snapshot` | JSONB | YES | | State snapshot at login time | **Swoop Computed.** |
