# 13. Tee Sheet Operations Domain

*Predictive tee sheet management. Mix of **TTM** source data and **Swoop Computed** workflow state.*

**Tables:** `booking_confirmations`, `slot_reassignments`, `waitlist_config`

---

## `booking_confirmations`

Proactive outreach for high-cancel-risk bookings.

**Schema source:** seed | **PK:** `confirmation_id`

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `confirmation_id` | VARCHAR(50) | NO | | PK | **Swoop Computed.** |
| `booking_id` | VARCHAR(50) | YES | | FK to bookings | TTM: Tee time reservation. |
| `member_id` | VARCHAR(20) | YES | | FK to members | TTM: Member #. |
| `member_name` | VARCHAR(100) | YES | | Member display name | JCM: Member name. |
| `tee_time` | VARCHAR(100) | YES | | Tee time description | TTM: Date + time slot. |
| `cancel_probability` | NUMERIC(3,2) | YES | | Cancel risk score | **Swoop Computed.** From cancellation_risk ML model. |
| `outreach_status` | VARCHAR(20) | YES | 'pending' | pending / sent / confirmed / no_response | Staff via Swoop UI. |
| `outreach_channel` | VARCHAR(20) | YES | | sms / email / phone | Staff selection. |
| `staff_notes` | TEXT | YES | | Staff notes on outreach | Staff via Swoop UI. |
| `contacted_at` | TIMESTAMPTZ | YES | | When outreach was made | Staff via Swoop UI. |
| `responded_at` | TIMESTAMPTZ | YES | | When member responded | Staff via Swoop UI. |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Record created | N/A (system). |

---

## `slot_reassignments`

Cancelled slot reassignment tracking. Matches cancelled slots to waitlisted members.

**Schema source:** seed | **PK:** `reassignment_id`

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `reassignment_id` | VARCHAR(50) | NO | | PK | **Swoop Computed.** |
| `source_booking_id` | VARCHAR(50) | YES | | Original cancelled booking | TTM: Cancelled tee time. |
| `source_slot` | VARCHAR(100) | YES | | Original slot description | TTM: Date + time + course. |
| `source_member_id` | VARCHAR(20) | YES | | Member who cancelled | TTM: Member # on booking. |
| `source_member_name` | VARCHAR(100) | YES | | Canceller's name | JCM: Member name. |
| `recommended_fill_member_id` | VARCHAR(20) | YES | | Recommended fill member | **Swoop Computed.** From waitlist + health priority. |
| `recommended_fill_member_name` | VARCHAR(100) | YES | | Fill member's name | JCM: Member name. |
| `status` | VARCHAR(20) | YES | 'pending' | pending / filled / expired | Staff via Swoop UI. |
| `staff_decision` | TEXT | YES | | Staff decision notes | Staff via Swoop UI. |
| `revenue_recovered` | NUMERIC(8,2) | YES | | Revenue recovered | **Swoop Computed.** |
| `health_before` | INT | YES | | Fill member health before | **Swoop Computed.** |
| `health_after` | INT | YES | | Fill member health after | **Swoop Computed.** |
| `decided_at` | TIMESTAMPTZ | YES | | Decision timestamp | Staff via Swoop UI. |
| `audit_trail` | JSONB | YES | '[]' | Action history | **Swoop Computed.** |

---

## `waitlist_config`

Club-level waitlist parameters.

**Schema source:** seed | **PK:** `club_id`

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `club_id` | VARCHAR(20) | NO | 'oakmont' | PK, FK to club | N/A (config). |
| `hold_time_minutes` | INT | YES | 30 | How long to hold an offered slot | N/A (config). |
| `auto_offer_threshold` | NUMERIC(3,2) | YES | 0.80 | Confidence threshold for auto-offers | N/A (config). |
| `max_offers` | INT | YES | 3 | Max simultaneous offers | N/A (config). |
| `notification_limit` | INT | YES | 2 | Max notifications per member per day | N/A (config). |
