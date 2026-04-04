# 7. Operations & Metrics Domain

*Aggregated operational data: daily close-outs, canonical event bus, engagement rollups, visit sessions, weather impact data, and health score time series.*

**Tables:** `close_outs`, `canonical_events`, `member_engagement_daily`, `member_engagement_weekly`, `visit_sessions`, `weather_daily`, `health_scores`

---

## `close_outs`

Daily revenue close-out summaries. One row per operating day.

**Schema source:** seed | **PK:** `closeout_id`

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `closeout_id` | TEXT | NO | | PK (co_001) | POS/TTM: Derived from end-of-day processing. |
| `club_id` | TEXT | NO | | FK to club | Swoop-assigned. |
| `date` | TEXT | NO | | Operating date (UNIQUE) | POS: Settlement date. TTM: End of Day Processing date. |
| `golf_revenue` | REAL | NO | 0 | Golf revenue | TTM: Sum of green fees, cart fees. |
| `fb_revenue` | REAL | NO | 0 | F&B revenue | POS: Sum of Sales by Category totals. |
| `total_revenue` | REAL | NO | 0 | Total revenue | **Swoop Computed.** golf_revenue + fb_revenue. |
| `rounds_played` | INTEGER | NO | 0 | Rounds completed | TTM: Round count from End of Day. |
| `covers` | INTEGER | NO | 0 | Dining covers | POS: Cover count. Also MF dashboard. |
| `weather` | TEXT | NO | 'sunny' | Weather condition | External Weather API. |
| `is_understaffed` | INTEGER | NO | 0 | Boolean: understaffed | **Swoop Computed.** From staff_shifts ratio. |

---

## `canonical_events`

Vendor-agnostic event bus. Normalizes events from all CMS sources into a single stream.

**Schema source:** seed | **PK:** `event_id`
**Indexes:** idx_canonical_entity(entity_type, entity_id), idx_canonical_timestamp

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `event_id` | TEXT | NO | | PK (MD5-based idempotency key) | **Swoop Computed.** Hash for deduplication. |
| `entity_type` | TEXT | NO | | Entity type (member, booking, check, etc.) | **Swoop Computed.** Normalized. |
| `entity_id` | TEXT | NO | | Entity ID | Source system: Member #, Booking ID, Chit #, etc. |
| `event_type` | TEXT | NO | | created / updated / completed / cancelled / resigned | **Swoop Computed.** Normalized. |
| `event_timestamp` | TEXT | NO | | Event timestamp | Source system timestamp. |
| `source_vendor` | TEXT | NO | | ForeTees / Jonas POS / Northstar / ClubReady / Club Prophet | Source system identifier. |
| `payload` | TEXT | NO | | JSON snapshot of event data | **Swoop Computed.** Serialized payload. |

---

## `member_engagement_daily`

Daily engagement rollup per member. 300 x 31 = 9,300 rows in simulation.

**Schema source:** seed | **PK:** `row_id`
**Unique:** (member_id, date)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `row_id` | TEXT | NO | | PK | **Swoop Computed.** |
| `member_id` | TEXT | NO | | FK to members | JCM: Member #. |
| `date` | TEXT | NO | | Date | Date dimension. |
| `rounds_played` | INTEGER | NO | 0 | Rounds that day | TTM: Bookings with status=completed. |
| `dining_checks` | INTEGER | NO | 0 | Dining visits | POS: Chit count for member+date. |
| `dining_spend` | REAL | NO | 0 | Dining spend | POS: Sum of chit totals. |
| `events_attended` | INTEGER | NO | 0 | Events attended | JAM: Registrations with status=attended. |
| `emails_opened` | INTEGER | NO | 0 | Emails opened | CHO: Open event count. |
| `feedback_submitted` | INTEGER | NO | 0 | Feedback count | JCM/MI: Feedback records count. |
| `visit_flag` | INTEGER | NO | 0 | Boolean: visited club | **Swoop Computed.** 1 if any touchpoint. |

---

## `member_engagement_weekly`

Weekly engagement rollup. 300 x 5 = 1,500 rows. Powers trend sparklines.

**Schema source:** seed | **PK:** `row_id`
**Unique:** (member_id, week_number)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `row_id` | TEXT | NO | | PK | **Swoop Computed.** |
| `member_id` | TEXT | NO | | FK to members | JCM: Member #. |
| `week_number` | INTEGER | NO | | Week 1-5 | Date dimension. |
| `week_start` | TEXT | NO | | Week start date | Date dimension. |
| `week_end` | TEXT | NO | | Week end date | Date dimension. |
| `rounds_played` | INTEGER | NO | 0 | Rounds that week | TTM: Aggregated from daily. |
| `dining_visits` | INTEGER | NO | 0 | Dining visits | POS: Aggregated from daily. |
| `dining_spend` | REAL | NO | 0 | Dining spend | POS: Aggregated from daily. |
| `events_attended` | INTEGER | NO | 0 | Events attended | JAM: Aggregated from daily. |
| `email_open_rate` | REAL | NO | 0 | Email open rate | CHO: opens/sends for member+week. |
| `engagement_score` | REAL | NO | 0 | Composite engagement score | **Swoop Computed.** Weighted composite. |

---

## `visit_sessions`

Visit-level sessions aggregating all touchpoints during a single club visit.

**Schema source:** seed | **PK:** `session_id`

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `session_id` | TEXT | NO | | PK (vs_00001) | **Swoop Computed.** Session stitched from activity events. |
| `member_id` | TEXT | NO | | FK to members | JCM: Member #. |
| `session_date` | TEXT | NO | | Visit date | Earliest touchpoint date. |
| `anchor_type` | TEXT | NO | | golf / dining / event | **Swoop Computed.** Primary activity type. |
| `arrival_time` | TEXT | YES | | Arrival timestamp | JCM: Club Activity File first check-in. |
| `departure_time` | TEXT | YES | | Departure timestamp | JCM: Last activity timestamp. |
| `duration_minutes` | INTEGER | YES | | Visit duration | **Swoop Computed.** departure - arrival. |
| `touchpoints` | INTEGER | NO | 1 | Number of touchpoints | **Swoop Computed.** Distinct activity count. |
| `total_spend` | REAL | NO | 0 | Total spend during visit | POS: Sum of all chits during visit. |
| `activities` | TEXT | NO | '[]' | JSON array of activities | **Swoop Computed.** |

---

## `weather_daily`

Daily weather data with demand modifiers.

**Schema source:** seed | **PK:** `weather_id`

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `weather_id` | TEXT | NO | | PK (one per day) | External Weather API. |
| `date` | TEXT | NO | | Date (UNIQUE) | Date dimension. |
| `condition` | TEXT | NO | | sunny / cloudy / rainy / windy / perfect | Weather API. |
| `temp_high` | INTEGER | NO | | High temperature | Weather API. |
| `temp_low` | INTEGER | NO | | Low temperature | Weather API. |
| `wind_mph` | INTEGER | NO | 0 | Wind speed | Weather API. |
| `precipitation_in` | REAL | NO | 0 | Precipitation inches | Weather API. |
| `golf_demand_modifier` | REAL | NO | 0 | Golf demand adjustment factor | **Swoop Computed.** Weather-to-demand model. |
| `fb_demand_modifier` | REAL | NO | 0 | F&B demand adjustment factor | **Swoop Computed.** |

---

## `health_scores`

Health score time series. Each computation creates a new row.

**Schema source:** migration | **PK:** `id`
**Indexes:** idx_health_scores_member(member_id, computed_at DESC)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `id` | TEXT | NO | gen_random_uuid() | PK | System UUID. |
| `member_id` | TEXT | NO | | FK to members | JCM: Member #. |
| `club_id` | TEXT | NO | | FK to club | Swoop-assigned. |
| `score` | REAL | NO | | Overall health score | **Swoop Computed.** Weighted composite. |
| `tier` | TEXT | NO | | Tier classification | **Swoop Computed.** Threshold-based. |
| `golf_score` | REAL | YES | | Golf sub-score | **Swoop Computed.** From TTM round frequency/recency. |
| `dining_score` | REAL | YES | | Dining sub-score | **Swoop Computed.** From POS visit frequency/spend. |
| `email_score` | REAL | YES | | Email engagement sub-score | **Swoop Computed.** From CHO open/click rates. |
| `event_score` | REAL | YES | | Event sub-score | **Swoop Computed.** From JAM attendance. |
| `computed_at` | TIMESTAMPTZ | YES | NOW() | Computation timestamp | N/A (system). |
| `archetype` | TEXT | YES | | Archetype at computation time | **Swoop Computed.** |
| `score_delta` | REAL | YES | | Change from previous score | **Swoop Computed.** |
