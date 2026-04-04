# 1. Club Reference Domain

*Multi-tenant root configuration. Club identity, course topology, dining outlets, membership tier pricing. Seeded once per club onboarding.*

**Tables:** `club`, `courses`, `dining_outlets`, `membership_types`

---

## `club`

Multi-tenant root entity. Every club gets one row.

**Schema source:** seed + migration | **PK:** `club_id`

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `club_id` | TEXT | NO | | PK (e.g. 'oakmont') | Swoop-assigned. No direct Jonas equivalent. |
| `name` | TEXT | NO | | Display name | JCM: Club name from System Parameters screen. |
| `city` | TEXT | NO | | City | JCM: Club address fields. |
| `state` | TEXT | NO | | State abbreviation | JCM: Club address fields. |
| `zip` | TEXT | NO | | ZIP code | JCM: Club address fields. |
| `founded_year` | INTEGER | YES | | Year club was founded | Manual entry. Not stored in Jonas. |
| `member_count` | INTEGER | YES | | Total member headcount | JCM: Member Count Reports. **Extraction:** RG > Member Reporting, export via SV. |
| `course_count` | INTEGER | YES | | Number of golf courses | TTM: Course count from Tee Time System Profile. |
| `outlet_count` | INTEGER | YES | | Number of F&B outlets | POS: Count of Sales Areas. **Extraction:** F9 on Sales Areas. |
| `logo_url` | TEXT | YES | | URL to club logo | N/A (config). Uploaded during onboarding. |
| `brand_voice` | TEXT | YES | 'professional' | Tone for AI-generated content | N/A (config). Swoop platform setting. |
| `timezone` | TEXT | YES | 'America/New_York' | Club timezone | N/A (config). Set during onboarding. |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Row creation timestamp | N/A (system). |
| `updated_at` | TIMESTAMPTZ | YES | NOW() | Last updated timestamp | N/A (system). |

---

## `courses`

Golf course definitions within a club. Drives tee sheet capacity calculations.

**Schema source:** seed | **PK:** `course_id`
**Foreign keys:** club_id -> club(club_id)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `course_id` | TEXT | NO | | PK | TTM: Course code from Course Setup. **Extraction:** F9 on Courses. |
| `club_id` | TEXT | NO | | FK to club | Swoop-assigned. |
| `name` | TEXT | NO | | Course name (e.g. 'Championship') | TTM: Course description field. |
| `holes` | INTEGER | NO | | Number of holes (9 or 18) | TTM: Course Setup > Holes field. |
| `par` | INTEGER | NO | | Par for the course | TTM: Course Setup > Par field. |
| `tee_interval_min` | INTEGER | NO | | Minutes between tee times | TTM: Tee Sheet Template > interval setting. |
| `first_tee` | TEXT | NO | | First available tee time (HH:MM) | TTM: Tee Sheet Template > Start Time. |
| `last_tee` | TEXT | NO | | Last available tee time (HH:MM) | TTM: Tee Sheet Template > End Time. |

---

## `dining_outlets`

F&B outlet definitions. Used for POS check routing and staffing calculations.

**Schema source:** seed | **PK:** `outlet_id`
**Foreign keys:** club_id -> club(club_id)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `outlet_id` | TEXT | NO | | PK | POS: Sales Area ID. **Extraction:** F9 on Sales Areas. |
| `club_id` | TEXT | NO | | FK to club | Swoop-assigned. |
| `name` | TEXT | NO | | Outlet name (e.g. 'The Grille') | POS: Sales Area Description. |
| `type` | TEXT | NO | | dining / bar / on-course | POS: Inferred from Sales Area config and Terminal Restrictions. |
| `meal_periods` | TEXT | NO | | JSON array of meal periods served | POS: Derived from shift/operating hours config. |
| `weekday_covers` | INTEGER | NO | | Average weekday cover count | MF: MetricsFirst F&B dashboard > Covers metric. |
| `weekend_covers` | INTEGER | NO | | Average weekend cover count | MF: Same extraction as weekday. |

---

## `membership_types`

Membership tier definitions with dues and F&B minimum requirements.

**Schema source:** seed | **PK:** `type_code`

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `type_code` | TEXT | NO | | PK (FG / SOC / JR / LEG / SPT / NR) | JCM: Membership Type code. **Extraction:** F9 Lister. |
| `name` | TEXT | NO | | Display name | JCM: Membership Type description field. |
| `annual_dues` | REAL | NO | | Annual dues amount | JCM: Fee Billing setup per membership type. |
| `fb_minimum` | REAL | NO | 0 | Quarterly F&B minimum spend | JCM: Regular Spending Minimums setup. |
| `golf_eligible` | INTEGER | NO | 1 | Boolean: golf privileges | JCM: Membership Type configuration > privileges flags. |
