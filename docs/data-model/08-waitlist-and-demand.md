# 8. Waitlist & Demand Intelligence Domain

*Advanced tee sheet demand modeling: member waitlists, cancellation risk scoring, demand heatmaps, and churn predictions. Powers predictive slot management and revenue optimization.*

**Tables:** `member_waitlist`, `cancellation_risk`, `demand_heatmap`, `churn_predictions`

> Note: `waitlist_entries` (course-level) is in [03-golf-operations.md](./03-golf-operations.md). This domain covers member-level waitlist and ML-driven demand intelligence.

---

## `member_waitlist`

Per-member waitlist entries with retention priority scoring.

**Schema source:** seed | **PK:** `waitlist_id`
**Indexes:** idx_waitlist_member, idx_waitlist_priority

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `waitlist_id` | TEXT | NO | | PK (mwl_001) | System-generated. |
| `member_id` | TEXT | NO | | FK to members | TTM: Member # on waitlist request. |
| `course_id` | TEXT | NO | | FK to courses | TTM: Course code. |
| `requested_date` | TEXT | NO | | Requested date | TTM: Date requested. |
| `requested_slot` | TEXT | NO | | Requested time slot | TTM: Preferred slot. |
| `alternatives_accepted` | TEXT | NO | '[]' | JSON: accepted alternatives | **Swoop Computed.** Waitlist workflow. |
| `days_waiting` | INTEGER | NO | 0 | Days on waitlist | **Swoop Computed.** |
| `retention_priority` | TEXT | NO | 'NORMAL' | HIGH or NORMAL | **Swoop Computed.** Based on health_score and dues_at_risk. |
| `notified_at` | TEXT | YES | | Notification timestamp | **Swoop Computed.** |
| `filled_at` | TEXT | YES | | Slot filled timestamp | **Swoop Computed.** |
| `dining_incentive_attached` | INTEGER | NO | 0 | Boolean: dining incentive | **Swoop Computed.** Cross-domain incentive. |

---

## `cancellation_risk`

ML-scored cancellation probability per booking.

**Schema source:** seed | **PK:** `risk_id`
**Indexes:** idx_cancel_risk_booking, idx_cancel_risk_member, idx_cancel_risk_prob

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `risk_id` | TEXT | NO | | PK (cr_001) | **Swoop Computed.** |
| `booking_id` | TEXT | NO | | FK to bookings | TTM: Tee time reservation. |
| `member_id` | TEXT | NO | | FK to members | TTM: Member # on booking. |
| `scored_at` | TEXT | NO | | Score timestamp | **Swoop Computed.** |
| `cancel_probability` | REAL | NO | | Probability 0.0-1.0 | **Swoop Computed.** ML model output. |
| `drivers` | TEXT | NO | '[]' | JSON: risk driver factors | **Swoop Computed.** |
| `recommended_action` | TEXT | NO | | Suggested intervention | **Swoop Computed.** |
| `estimated_revenue_lost` | REAL | NO | 0 | Revenue at risk | **Swoop Computed.** |
| `action_taken` | TEXT | YES | | confirmation_sent / personal_outreach / no_action | Staff via Swoop UI. |
| `outcome` | TEXT | YES | | kept or cancelled | TTM: Actual booking outcome. |

---

## `demand_heatmap`

Aggregated demand by course/day/time-block.

**Schema source:** seed | **PK:** `heatmap_id`
**Indexes:** idx_heatmap_course, idx_heatmap_day_time

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `heatmap_id` | TEXT | NO | | PK (dh_001) | **Swoop Computed.** |
| `course_id` | TEXT | NO | | FK to courses | TTM: Course code. |
| `day_of_week` | TEXT | NO | | Mon-Sun | **Swoop Computed.** Date dimension. |
| `time_block` | TEXT | NO | | e.g. '7-8 AM' | **Swoop Computed.** Bucketed from tee times. |
| `fill_rate` | REAL | NO | 0 | Utilization rate 0.0-1.0 | **Swoop Computed.** booked/available. |
| `unmet_rounds` | INTEGER | NO | 0 | Unmet demand count | **Swoop Computed.** From waitlist data. |
| `demand_level` | TEXT | NO | 'normal' | oversubscribed / normal / underutilized | **Swoop Computed.** |
| `computed_for_month` | TEXT | NO | | YYYY-MM | Date dimension. |

---

## `churn_predictions`

ML churn probability at 30/60/90-day horizons.

**Schema source:** migration | **PK:** `prediction_id`
**Unique:** (club_id, member_id)
**Indexes:** idx_churn_predictions_club

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `prediction_id` | TEXT | NO | gen_random_uuid() | PK | System UUID. |
| `club_id` | TEXT | NO | | FK to club | Swoop-assigned. |
| `member_id` | TEXT | NO | | FK to members (UNIQUE w/ club_id) | JCM: Member #. |
| `prob_30d` | REAL | YES | | 30-day churn probability | **Swoop Computed.** ML model. |
| `prob_60d` | REAL | YES | | 60-day probability | **Swoop Computed.** |
| `prob_90d` | REAL | YES | | 90-day probability | **Swoop Computed.** |
| `confidence` | REAL | YES | | Model confidence | **Swoop Computed.** |
| `risk_factors` | JSONB | NO | '[]' | Contributing factors | **Swoop Computed.** |
| `model_version` | TEXT | NO | 'rules_v1' | Model version | N/A (system). |
| `computed_at` | TIMESTAMPTZ | YES | NOW() | Computation timestamp | N/A (system). |
