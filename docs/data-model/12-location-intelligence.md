# 12. Location Intelligence Domain

*Real-time member and staff location tracking. Data source: **Swoop App GPS** and **Staff App**. No Jonas source for any table in this domain.*

**Tables:** `member_location_current`, `staff_location_current`, `service_recovery_alerts`

---

## `member_location_current`

Real-time member zone tracking. One row per member (upserted on check-in).

**Schema source:** seed | **PK:** `member_id` (FK to members)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `member_id` | TEXT | NO | | PK, FK to members | **Swoop App.** |
| `zone` | VARCHAR(50) | YES | | Current zone (Clubhouse, Course, Driving Range, Pool, etc.) | **Swoop App.** |
| `sub_location` | VARCHAR(100) | YES | | Sub-location (e.g. "Hole 7", "The Grille - Patio") | **Swoop App.** |
| `check_in_time` | TIMESTAMPTZ | YES | | Last check-in timestamp | **Swoop App.** |
| `health_status` | VARCHAR(20) | YES | | Member health tier at check-in | **Swoop App.** |
| `activity_type` | VARCHAR(50) | YES | | Current activity (golf, dining, event, etc.) | **Swoop App.** |

---

## `staff_location_current`

Real-time staff positions for service routing.

**Schema source:** seed | **PK:** `staff_id`

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `staff_id` | VARCHAR(20) | NO | | PK | **Swoop App.** |
| `name` | VARCHAR(100) | YES | | Staff display name | **Swoop App.** |
| `zone` | VARCHAR(50) | YES | | Current zone | **Swoop App.** |
| `status` | VARCHAR(20) | YES | | available / busy / break | **Swoop App.** |
| `eta_minutes` | INT | YES | | Estimated time to available | **Swoop App.** |
| `department` | VARCHAR(50) | YES | | Department | **Swoop App.** |

---

## `service_recovery_alerts`

Active service recovery alerts triggered by member experience signals.

**Schema source:** seed | **PK:** `alert_id` (SERIAL)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `alert_id` | SERIAL | NO | | PK | N/A (system). |
| `member_id` | VARCHAR(20) | YES | | Affected member | **Swoop App.** |
| `member_name` | VARCHAR(100) | YES | | Member display name | **Swoop App.** |
| `severity` | VARCHAR(20) | YES | | low / medium / high / critical | **Swoop App.** |
| `zone` | VARCHAR(50) | YES | | Zone where issue detected | **Swoop App.** |
| `detail` | TEXT | YES | | Alert details | **Swoop App.** |
| `recommended_action` | TEXT | YES | | Suggested response | **Swoop App.** |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Alert creation | N/A (system). |
| `resolved_at` | TIMESTAMPTZ | YES | | Resolution timestamp | N/A (system). |
