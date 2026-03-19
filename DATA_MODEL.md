# Swoop Golf — Complete Data Model

**Oakmont Hills Country Club** | Demo Environment | January 2026
**Database:** Neon PostgreSQL (via Vercel Postgres)
**Tables:** 49 | **Domains:** 8

---

## Domain Map

```
 CLUB REFERENCE          MEMBERS              GOLF OPERATIONS
 ┌────────────┐    ┌─────────────────┐    ┌──────────────────────┐
 │ club       │◄───│ members         │───►│ bookings             │
 │ courses    │    │ households      │    │ booking_players      │
 │ dining_    │    │ membership_     │    │ pace_of_play         │
 │   outlets  │    │   types         │    │ pace_hole_segments   │
 └────────────┘    └─────────────────┘    │ waitlist_entries     │
                                          └──────────────────────┘

 FOOD & BEVERAGE         EVENTS & COMMS        SERVICE & STAFFING
 ┌────────────────┐    ┌─────────────────┐    ┌──────────────────┐
 │ pos_checks     │    │ event_          │    │ feedback         │
 │ pos_line_items │    │   definitions   │    │ service_requests │
 │ pos_payments   │    │ event_          │    │ staff            │
 └────────────────┘    │   registrations │    │ staff_shifts     │
                       │ email_campaigns │    └──────────────────┘
                       │ email_events    │
                       └─────────────────┘

 OPERATIONS & METRICS            ANALYTICS & INTELLIGENCE
 ┌───────────────────────┐    ┌──────────────────────────────┐
 │ close_outs            │    │ board_report_snapshots       │
 │ canonical_events      │    │ member_interventions         │
 │ member_engagement_    │    │ operational_interventions    │
 │   daily               │    │ experience_correlations      │
 │ member_engagement_    │    │ correlation_insights         │
 │   weekly              │    │ event_roi_metrics            │
 │ visit_sessions        │    │ archetype_spend_gaps         │
 │ weather_daily         │    │ industry_benchmarks          │
 └───────────────────────┘    └──────────────────────────────┘

 WAITLIST & DEMAND               AGENTS & AUTOMATION
 ┌───────────────────────┐    ┌──────────────────────────────┐
 │ member_waitlist       │    │ agent_definitions            │
 │ cancellation_risk     │    │ agent_actions                │
 │ demand_heatmap        │    │ activity_log                 │
 │ booking_confirmations │    └──────────────────────────────┘
 │ slot_reassignments    │
 │ waitlist_config       │    LOCATION INTELLIGENCE
 └───────────────────────┘    ┌──────────────────────────────┐
                              │ member_location_current      │
 INTEGRATIONS                 │ staff_location_current       │
 ┌───────────────────────┐    │ service_recovery_alerts      │
 │ connected_systems     │    └──────────────────────────────┘
 │ user_sessions         │
 └───────────────────────┘
```

---

## 1. Club Reference Domain

### `club`
The root entity. One row per club.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `club_id` | TEXT PK | Club identifier (e.g., `oakmont_hills`) | Club CRM |
| `name` | TEXT | Display name | Club CRM |
| `city` | TEXT | City | Club CRM |
| `state` | TEXT | State | Club CRM |
| `zip` | TEXT | ZIP code | Club CRM |
| `founded_year` | INTEGER | Year founded | Club CRM |
| `member_count` | INTEGER | Total active members | Computed |
| `course_count` | INTEGER | Number of courses | Club CRM |
| `outlet_count` | INTEGER | Number of F&B outlets | Club CRM |

### `courses`
Golf courses at the club.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `course_id` | TEXT PK | Course identifier | Tee Sheet (ForeTees) |
| `club_id` | TEXT FK → club | Parent club | — |
| `name` | TEXT | Course name | Tee Sheet |
| `holes` | INTEGER | 9 or 18 | Tee Sheet |
| `par` | INTEGER | Course par | Tee Sheet |
| `tee_interval_min` | INTEGER | Minutes between tee times | Tee Sheet |
| `first_tee` | TEXT | First available tee time (HH:MM) | Tee Sheet |
| `last_tee` | TEXT | Last available tee time (HH:MM) | Tee Sheet |

### `dining_outlets`
F&B outlets (restaurants, bars, on-course).

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `outlet_id` | TEXT PK | Outlet identifier | POS (Jonas/Toast) |
| `club_id` | TEXT FK → club | Parent club | — |
| `name` | TEXT | Outlet name (e.g., "The Grill Room") | POS |
| `type` | TEXT | `dining` / `bar` / `on-course` | POS |
| `meal_periods` | TEXT | JSON array of meal periods | POS |
| `weekday_covers` | INTEGER | Average weekday covers | POS |
| `weekend_covers` | INTEGER | Average weekend covers | POS |

### `membership_types`
Membership tier definitions.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `type_code` | TEXT PK | Code (FG, SOC, JR, LEG, SPT, NR) | Club CRM |
| `name` | TEXT | Display name | Club CRM |
| `annual_dues` | REAL | Annual dues amount | Club CRM |
| `fb_minimum` | REAL | F&B minimum spend | Club CRM |
| `golf_eligible` | INTEGER | 1 = can book tee times | Club CRM |

---

## 2. Members Domain

### `households`
Family/household groupings.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `household_id` | TEXT PK | Household identifier | Club CRM |
| `primary_member_id` | TEXT | Primary account holder | Club CRM |
| `member_count` | INTEGER | Members in household | Computed |
| `address` | TEXT | Mailing address | Club CRM |
| `is_multi_member` | INTEGER | 1 if multiple members | Computed |

### `members`
Core member records. 300 active members in demo.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `member_id` | TEXT PK | Member ID (mbr_001 ... mbr_300) | Club CRM |
| `member_number` | INTEGER | Display number | Club CRM |
| `first_name` | TEXT | First name | Club CRM |
| `last_name` | TEXT | Last name | Club CRM |
| `email` | TEXT | Email address | Club CRM |
| `phone` | TEXT | Phone number | Club CRM |
| `date_of_birth` | TEXT | DOB (ISO date) | Club CRM |
| `gender` | TEXT | Gender | Club CRM |
| `membership_type` | TEXT FK → membership_types | Tier code | Club CRM |
| `membership_status` | TEXT | `active` / `loa` / `resigned` | Club CRM |
| `join_date` | TEXT | Date joined (ISO) | Club CRM |
| `resigned_on` | TEXT | Resignation date (NULL if active) | Club CRM |
| `household_id` | TEXT FK → households | Family grouping | Club CRM |
| `archetype` | TEXT | Behavioral archetype | Swoop Computed |
| `annual_dues` | REAL | Annual dues for this member | Club CRM |
| `account_balance` | REAL | Current account balance | Club CRM |
| `ghin_number` | TEXT | GHIN handicap number | Golf Systems |
| `communication_opt_in` | INTEGER | 1 = opted in to comms | Club CRM |

**Archetypes:** Die-Hard Golfer, Social Butterfly, Balanced Active, Weekend Warrior, New Member, Snowbird, Declining, Ghost

**Indexes:** archetype, membership_status, household_id

---

## 3. Golf Operations Domain

### `bookings`
Tee sheet reservations. ~4,000 rows in demo month.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `booking_id` | TEXT PK | Booking ID | Tee Sheet (ForeTees) |
| `club_id` | TEXT FK → club | Club | — |
| `course_id` | TEXT FK → courses | Course | Tee Sheet |
| `booking_date` | TEXT | Date (ISO) | Tee Sheet |
| `tee_time` | TEXT | Tee time (HH:MM) | Tee Sheet |
| `player_count` | INTEGER | Players in group | Tee Sheet |
| `has_guest` | INTEGER | 1 if guests included | Tee Sheet |
| `transportation` | TEXT | `cart` / `walk` | Tee Sheet |
| `has_caddie` | INTEGER | 1 if caddie | Tee Sheet |
| `round_type` | TEXT | `18` / `9` | Tee Sheet |
| `status` | TEXT | `confirmed` / `completed` / `cancelled` / `no_show` | Tee Sheet |
| `check_in_time` | TEXT | Actual check-in time | Tee Sheet |
| `round_start` | TEXT | Round start timestamp | Tee Sheet |
| `round_end` | TEXT | Round end timestamp | Tee Sheet |
| `duration_minutes` | INTEGER | Actual round duration | Computed |

### `booking_players`
Individual players within a booking.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `player_id` | TEXT PK | Player record ID | Tee Sheet |
| `booking_id` | TEXT FK → bookings | Parent booking | — |
| `member_id` | TEXT FK → members | Member (NULL if guest) | Tee Sheet |
| `guest_name` | TEXT | Guest name (if applicable) | Tee Sheet |
| `is_guest` | INTEGER | 1 = guest | Tee Sheet |
| `is_warm_lead` | INTEGER | 1 = prospective member | Swoop Computed |
| `position_in_group` | INTEGER | 1-4 position | Tee Sheet |

### `pace_of_play`
Round-level pace tracking.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `pace_id` | TEXT PK | Pace record ID | Tee Sheet / GPS |
| `booking_id` | TEXT FK → bookings | Linked booking | — |
| `total_minutes` | INTEGER | Total round duration | Tee Sheet |
| `is_slow_round` | INTEGER | 1 if > 270 min (18H) | Computed |
| `groups_passed` | INTEGER | Groups that played through | On-Course Staff |
| `ranger_interventions` | INTEGER | Ranger pace warnings | On-Course Staff |

### `pace_hole_segments`
Hole-by-hole pace data for bottleneck detection.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `segment_id` | TEXT PK | Segment ID | GPS / Tee Sheet |
| `pace_id` | TEXT FK → pace_of_play | Parent pace record | — |
| `hole_number` | INTEGER | Hole 1-18 | — |
| `tee_time` | TEXT | Tee arrival timestamp | GPS |
| `green_time` | TEXT | Green completion timestamp | GPS |
| `segment_minutes` | INTEGER | Minutes on this hole | Computed |
| `is_bottleneck` | INTEGER | 1 = significant delay | Computed |

### `waitlist_entries`
Aggregated waitlist demand by time slot.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `entry_id` | TEXT PK | Entry ID | Tee Sheet |
| `club_id` | TEXT FK → club | Club | — |
| `course_id` | TEXT FK → courses | Course | Tee Sheet |
| `requested_date` | TEXT | Requested date | Tee Sheet |
| `requested_tee_time` | TEXT | Requested time | Tee Sheet |
| `waitlist_count` | INTEGER | People waiting for slot | Tee Sheet |
| `has_event_overlap` | INTEGER | 1 = event conflict | Computed |
| `peak_slot` | TEXT | Peak demand indicator | Computed |

---

## 4. Food & Beverage Domain

### `pos_checks`
Point-of-sale transactions. ~5,000 rows in demo month.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `check_id` | TEXT PK | Check ID | POS (Jonas/Toast) |
| `outlet_id` | TEXT FK → dining_outlets | F&B outlet | POS |
| `member_id` | TEXT FK → members | Member | POS |
| `opened_at` | TEXT | Check opened timestamp | POS |
| `closed_at` | TEXT | Check closed timestamp | POS |
| `first_item_fired_at` | TEXT | First item fired | POS |
| `last_item_fulfilled_at` | TEXT | Last item completed | POS |
| `subtotal` | REAL | Subtotal before tax | POS |
| `tax_amount` | REAL | Tax | POS |
| `tip_amount` | REAL | Gratuity | POS |
| `comp_amount` | REAL | Comps | POS |
| `discount_amount` | REAL | Discounts | POS |
| `void_amount` | REAL | Voided items | POS |
| `total` | REAL | Final total | POS |
| `payment_method` | TEXT | `member_charge` / `credit_card` / `cash` | POS |
| `post_round_dining` | INTEGER | 1 = dined after golf round | Swoop Computed |
| `linked_booking_id` | TEXT FK → bookings | Associated tee time | Swoop Computed |
| `event_id` | TEXT FK → event_definitions | Associated event | POS |
| `is_understaffed_day` | INTEGER | 1 = understaffed day | Scheduling (ADP) |

### `pos_line_items`
Individual items on a check.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `line_item_id` | TEXT PK | Line item ID | POS |
| `check_id` | TEXT FK → pos_checks | Parent check | — |
| `item_name` | TEXT | Item name | POS |
| `category` | TEXT | appetizer / entree / beer / wine / etc. | POS |
| `unit_price` | REAL | Unit price | POS |
| `quantity` | INTEGER | Quantity | POS |
| `line_total` | REAL | Extended price | POS |
| `is_comp` | INTEGER | 1 = comped | POS |
| `is_void` | INTEGER | 1 = voided | POS |
| `fired_at` | TEXT | Time fired to kitchen | POS |

### `pos_payments`
Payment splits on a check.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `payment_id` | TEXT PK | Payment ID | POS |
| `check_id` | TEXT FK → pos_checks | Parent check | — |
| `payment_method` | TEXT | Payment method | POS |
| `amount` | REAL | Payment amount | POS |
| `processed_at` | TEXT | Processing timestamp | POS |
| `is_split` | INTEGER | 1 = split payment | POS |

---

## 5. Events & Communications Domain

### `event_definitions`
Club events (tournaments, dinners, socials).

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `event_id` | TEXT PK | Event ID | Club CRM / Events System |
| `club_id` | TEXT FK → club | Club | — |
| `name` | TEXT | Event name | Events System |
| `type` | TEXT | `golf_tournament` / `dining` / `league` / `social` | Events System |
| `event_date` | TEXT | Event date (ISO) | Events System |
| `capacity` | INTEGER | Max attendees | Events System |
| `registration_fee` | REAL | Fee per person | Events System |
| `description` | TEXT | Event description | Events System |

### `event_registrations`
Member registrations for events.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `registration_id` | TEXT PK | Registration ID | Events System |
| `event_id` | TEXT FK → event_definitions | Event | — |
| `member_id` | TEXT FK → members | Member | — |
| `status` | TEXT | `registered` / `attended` / `no_show` / `cancelled` | Events System |
| `guest_count` | INTEGER | Additional guests | Events System |
| `fee_paid` | REAL | Fee paid | Events System |
| `registered_at` | TEXT | Registration timestamp | Events System |
| `checked_in_at` | TEXT | Check-in timestamp | Events System |

### `email_campaigns`
Email campaigns sent to members.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `campaign_id` | TEXT PK | Campaign ID | Email (Mailchimp/Constant Contact) |
| `club_id` | TEXT FK → club | Club | — |
| `subject` | TEXT | Email subject line | Email System |
| `type` | TEXT | `newsletter` / `operational` / `event_promo` / `fb_promo` | Email System |
| `send_date` | TEXT | Send date (ISO) | Email System |
| `recipient_count` | INTEGER | Total recipients | Email System |
| `html_content_url` | TEXT | Link to email content | Email System |

### `email_events`
Individual email engagement events (opens, clicks, bounces).

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `event_id` | TEXT PK | Event ID | Email System |
| `campaign_id` | TEXT FK → email_campaigns | Campaign | — |
| `member_id` | TEXT FK → members | Member | — |
| `event_type` | TEXT | `send` / `open` / `click` / `bounce` / `unsubscribe` | Email System |
| `occurred_at` | TEXT | Event timestamp | Email System |
| `link_clicked` | TEXT | URL clicked (if click event) | Email System |
| `device_type` | TEXT | `mobile` / `desktop` / `tablet` | Email System |

---

## 6. Service & Staffing Domain

### `feedback`
Member feedback and complaints.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `feedback_id` | TEXT PK | Feedback ID | Club CRM / Swoop App |
| `member_id` | TEXT FK → members | Member | — |
| `club_id` | TEXT FK → club | Club | — |
| `submitted_at` | TEXT | Submission timestamp | Club CRM |
| `category` | TEXT | Service Speed / Food Quality / Course Condition / Facility / Staff / Pace of Play / General | Club CRM |
| `sentiment_score` | REAL | -1.0 to +1.0 | Swoop NLP |
| `description` | TEXT | Free-text description | Club CRM |
| `status` | TEXT | `acknowledged` / `in_progress` / `resolved` / `escalated` | Club CRM |
| `resolved_at` | TEXT | Resolution timestamp | Club CRM |
| `is_understaffed_day` | INTEGER | 1 = understaffed when submitted | Scheduling (ADP) |

### `service_requests`
On-course and facility service requests.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `request_id` | TEXT PK | Request ID | Swoop App / Staff |
| `member_id` | TEXT FK → members | Member | — |
| `booking_id` | TEXT FK → bookings | Associated booking | — |
| `request_type` | TEXT | `beverage_cart` / `pace_complaint` / `course_condition` / `equipment` / `facility_maintenance` | Swoop App |
| `requested_at` | TEXT | Request timestamp | Swoop App |
| `response_time_min` | INTEGER | Minutes to respond | Staff |
| `resolved_at` | TEXT | Resolution timestamp | Staff |
| `resolution_notes` | TEXT | Resolution notes | Staff |
| `is_understaffed_day` | INTEGER | 1 = understaffed | Scheduling (ADP) |

### `staff`
Staff directory.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `staff_id` | TEXT PK | Staff ID | Scheduling (ADP) |
| `club_id` | TEXT FK → club | Club | — |
| `first_name` | TEXT | First name | ADP |
| `last_name` | TEXT | Last name | ADP |
| `department` | TEXT | Golf Operations / F&B Service / F&B Kitchen / Grounds / Pro Shop / Administration | ADP |
| `role` | TEXT | Job title | ADP |
| `hire_date` | TEXT | Hire date | ADP |
| `hourly_rate` | REAL | Hourly wage | ADP |
| `is_full_time` | INTEGER | 1 = full-time | ADP |

### `staff_shifts`
Staff scheduling and shift records.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `shift_id` | TEXT PK | Shift ID | Scheduling (ADP) |
| `staff_id` | TEXT FK → staff | Staff member | — |
| `shift_date` | TEXT | Shift date (ISO) | ADP |
| `outlet_id` | TEXT FK → dining_outlets | F&B outlet (NULL for non-F&B) | ADP |
| `start_time` | TEXT | Shift start | ADP |
| `end_time` | TEXT | Shift end | ADP |
| `hours_worked` | REAL | Hours | ADP |
| `is_understaffed_day` | INTEGER | 1 = understaffed | Swoop Computed |
| `notes` | TEXT | Shift notes | ADP |

---

## 7. Operations & Metrics Domain

### `close_outs`
Daily revenue and operations summary. 31 rows (one per day).

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `closeout_id` | TEXT PK | Closeout ID | POS / Tee Sheet |
| `club_id` | TEXT FK → club | Club | — |
| `date` | TEXT UNIQUE | Date (ISO) | — |
| `golf_revenue` | REAL | Golf revenue | Tee Sheet |
| `fb_revenue` | REAL | F&B revenue | POS |
| `total_revenue` | REAL | Combined revenue | Computed |
| `rounds_played` | INTEGER | Total rounds | Tee Sheet |
| `covers` | INTEGER | Total F&B covers | POS |
| `weather` | TEXT | Weather condition | Weather API |
| `is_understaffed` | INTEGER | 1 = understaffed | Scheduling (ADP) |

### `canonical_events`
Normalized event stream from all vendor systems. Change data capture.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `event_id` | TEXT PK | MD5-based idempotency key | Swoop Pipeline |
| `entity_type` | TEXT | Entity type (member, booking, check, etc.) | All Systems |
| `entity_id` | TEXT | Entity ID | All Systems |
| `event_type` | TEXT | `created` / `updated` / `completed` / `cancelled` / `resigned` | All Systems |
| `event_timestamp` | TEXT | Event timestamp | All Systems |
| `source_vendor` | TEXT | ForeTees / Jonas POS / Northstar / ClubReady / Club Prophet | All Systems |
| `payload` | TEXT | JSON snapshot of the event | All Systems |

### `member_engagement_daily`
Daily engagement metrics per member. 300 members x 31 days = 9,300 rows.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `row_id` | TEXT PK | Row ID | Swoop Computed |
| `member_id` | TEXT FK → members | Member | — |
| `date` | TEXT | Date (ISO) | — |
| `rounds_played` | INTEGER | Rounds that day | Tee Sheet |
| `dining_checks` | INTEGER | Dining visits | POS |
| `dining_spend` | REAL | Dining spend | POS |
| `events_attended` | INTEGER | Events attended | Events System |
| `emails_opened` | INTEGER | Emails opened | Email System |
| `feedback_submitted` | INTEGER | Feedback count | Club CRM |
| `visit_flag` | INTEGER | 1 = visited property | Swoop App |

### `member_engagement_weekly`
Weekly engagement rollups with health score. 300 members x 5 weeks = 1,500 rows.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `row_id` | TEXT PK | Row ID | Swoop Computed |
| `member_id` | TEXT FK → members | Member | — |
| `week_number` | INTEGER | Week 1-5 | — |
| `week_start` | TEXT | Week start date | — |
| `week_end` | TEXT | Week end date | — |
| `rounds_played` | INTEGER | Rounds in week | Tee Sheet |
| `dining_visits` | INTEGER | Dining visits in week | POS |
| `dining_spend` | REAL | Dining spend in week | POS |
| `events_attended` | INTEGER | Events in week | Events System |
| `email_open_rate` | REAL | Email open rate (0-1) | Email System |
| `engagement_score` | REAL | Composite health score (0-100) | Swoop Computed |

### `visit_sessions`
Member visit sessions linking activities during a single property visit.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `session_id` | TEXT PK | Session ID | Swoop Computed |
| `member_id` | TEXT FK → members | Member | — |
| `session_date` | TEXT | Visit date | Computed |
| `anchor_type` | TEXT | `golf` / `dining` / `event` | Computed |
| `arrival_time` | TEXT | Arrival timestamp | Tee Sheet / POS |
| `departure_time` | TEXT | Departure timestamp | POS / Tee Sheet |
| `duration_minutes` | INTEGER | Time on property | Computed |
| `touchpoints` | INTEGER | Activities during visit | Computed |
| `total_spend` | REAL | Total spend during visit | POS |
| `activities` | TEXT | JSON array of activities | Computed |

### `weather_daily`
Daily weather conditions. 31 rows.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `weather_id` | TEXT PK | Weather ID | Weather API |
| `date` | TEXT UNIQUE | Date (ISO) | — |
| `condition` | TEXT | `sunny` / `cloudy` / `rainy` / `windy` / `perfect` | Weather API |
| `temp_high` | INTEGER | High temp (F) | Weather API |
| `temp_low` | INTEGER | Low temp (F) | Weather API |
| `wind_mph` | INTEGER | Wind speed | Weather API |
| `precipitation_in` | REAL | Precipitation | Weather API |
| `golf_demand_modifier` | REAL | Impact on golf demand (-1 to +1) | Swoop Computed |
| `fb_demand_modifier` | REAL | Impact on F&B demand (-1 to +1) | Swoop Computed |

---

## 8. Waitlist & Demand Domain

### `member_waitlist`
Individual member waitlist requests.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `waitlist_id` | TEXT PK | Waitlist ID | Tee Sheet |
| `member_id` | TEXT FK → members | Member | — |
| `course_id` | TEXT FK → courses | Course | Tee Sheet |
| `requested_date` | TEXT | Requested date | Tee Sheet |
| `requested_slot` | TEXT | Requested time slot | Tee Sheet |
| `alternatives_accepted` | TEXT | JSON array of acceptable alternatives | Tee Sheet |
| `days_waiting` | INTEGER | Days on waitlist | Computed |
| `retention_priority` | TEXT | `HIGH` / `NORMAL` | Swoop Computed |
| `notified_at` | TEXT | Last notification timestamp | Swoop |
| `filled_at` | TEXT | Slot fill timestamp | Tee Sheet |
| `dining_incentive_attached` | INTEGER | 1 = dining credit offered | Swoop |

### `cancellation_risk`
Predicted cancellation probabilities per booking.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `risk_id` | TEXT PK | Risk ID | Swoop ML |
| `booking_id` | TEXT FK → bookings | Booking | — |
| `member_id` | TEXT FK → members | Member | — |
| `scored_at` | TEXT | Score timestamp | Swoop ML |
| `cancel_probability` | REAL | 0.0 to 1.0 probability | Swoop ML |
| `drivers` | TEXT | JSON array of risk drivers | Swoop ML |
| `recommended_action` | TEXT | Recommended intervention | Swoop ML |
| `estimated_revenue_lost` | REAL | Revenue at risk | Swoop Computed |
| `action_taken` | TEXT | `confirmation_sent` / `personal_outreach` / `no_action` | Staff |
| `outcome` | TEXT | `kept` / `cancelled` | Tee Sheet |

### `demand_heatmap`
Aggregated demand patterns by day/time. Used for demand intelligence.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `heatmap_id` | TEXT PK | Heatmap ID | Swoop Computed |
| `course_id` | TEXT FK → courses | Course | — |
| `day_of_week` | TEXT | Mon-Sun | — |
| `time_block` | TEXT | Time block (e.g., "8-9 AM") | — |
| `fill_rate` | REAL | Fill rate (0-1) | Tee Sheet |
| `unmet_rounds` | INTEGER | Demand that couldn't be served | Tee Sheet |
| `demand_level` | TEXT | `oversubscribed` / `normal` / `underutilized` | Swoop Computed |
| `computed_for_month` | TEXT | Month (YYYY-MM) | — |

### `booking_confirmations`
Outreach tracking for at-risk bookings.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `confirmation_id` | VARCHAR(50) PK | Confirmation ID | Swoop |
| `booking_id` | VARCHAR(50) | Associated booking | Tee Sheet |
| `member_id` | VARCHAR(20) | Member | — |
| `member_name` | VARCHAR(100) | Member display name | Club CRM |
| `tee_time` | VARCHAR(100) | Tee time description | Tee Sheet |
| `cancel_probability` | NUMERIC(3,2) | Cancellation risk (0-1) | Swoop ML |
| `outreach_status` | VARCHAR(20) | `pending` / `contacted` / `confirmed` / `cancelled` / `no_response` | Staff |
| `outreach_channel` | VARCHAR(20) | Channel used (call, text, email) | Staff |
| `staff_notes` | TEXT | Staff notes | Staff |
| `contacted_at` | TIMESTAMPTZ | Contact timestamp | Staff |
| `responded_at` | TIMESTAMPTZ | Response timestamp | Staff |
| `created_at` | TIMESTAMPTZ | Record creation | System |

### `slot_reassignments`
Cancelled slot fill tracking with audit trail.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `reassignment_id` | VARCHAR(50) PK | Reassignment ID | Swoop |
| `source_booking_id` | VARCHAR(50) | Original booking | Tee Sheet |
| `source_slot` | VARCHAR(100) | Slot description | Tee Sheet |
| `source_member_id` | VARCHAR(20) | Cancelling member | — |
| `source_member_name` | VARCHAR(100) | Cancelling member name | Club CRM |
| `recommended_fill_member_id` | VARCHAR(20) | Recommended fill | Swoop ML |
| `recommended_fill_member_name` | VARCHAR(100) | Recommended fill name | Club CRM |
| `status` | VARCHAR(20) | `pending` / `approved` / `overridden` / `skipped` | Staff |
| `staff_decision` | TEXT | Staff decision notes | Staff |
| `revenue_recovered` | NUMERIC(8,2) | Revenue recovered | Computed |
| `health_before` | INT | Health score before | Swoop |
| `health_after` | INT | Health score after | Swoop |
| `decided_at` | TIMESTAMPTZ | Decision timestamp | Staff |
| `audit_trail` | JSONB | Array of audit entries | System |

### `waitlist_config`
Club-level waitlist configuration.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `club_id` | VARCHAR(20) PK | Club (default: oakmont) | Config |
| `hold_time_minutes` | INT | Slot hold time | Club Admin |
| `auto_offer_threshold` | NUMERIC(3,2) | Auto-offer probability threshold | Club Admin |
| `max_offers` | INT | Max concurrent offers | Club Admin |
| `notification_limit` | INT | Max notifications per member | Club Admin |

---

## 9. Analytics & Intelligence Domain

### `board_report_snapshots`
Monthly board report KPI snapshots.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `snapshot_id` | SERIAL PK | Auto-increment | System |
| `snapshot_date` | DATE | Report date | System |
| `members_saved` | INT | Members retained via intervention | Swoop Computed |
| `dues_protected` | NUMERIC(12,2) | Dues saved ($) | Swoop Computed |
| `ltv_protected` | NUMERIC(12,2) | Lifetime value protected ($) | Swoop Computed |
| `revenue_recovered` | NUMERIC(12,2) | Revenue recovered ($) | Swoop Computed |
| `service_failures_caught` | INT | Service issues caught early | Swoop Computed |
| `avg_response_time_hrs` | NUMERIC(5,1) | Average response time | Swoop Computed |
| `board_confidence_pct` | INT | Board confidence score (0-100) | Swoop Computed |

### `member_interventions`
Individual member intervention history (feeds Board Report "Member Saves").

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `intervention_id` | SERIAL PK | Auto-increment | System |
| `member_id` | TEXT FK → members | Member | — |
| `trigger_type` | VARCHAR(50) | What triggered the intervention | Swoop Detection |
| `trigger_detail` | TEXT | Trigger details | Swoop Detection |
| `action_taken` | TEXT | What was done | Staff |
| `outcome` | TEXT | Result | Staff |
| `health_before` | INT | Health score before | Swoop |
| `health_after` | INT | Health score after | Swoop |
| `dues_at_risk` | NUMERIC(12,2) | Dues at risk ($) | Computed |
| `intervention_date` | DATE | Intervention date | System |
| `resolved_date` | DATE | Resolution date | Staff |

### `operational_interventions`
Non-member operational interventions (weather saves, staffing catches).

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `intervention_id` | SERIAL PK | Auto-increment | System |
| `event_type` | VARCHAR(100) | Event type | Swoop Detection |
| `event_date` | DATE | Event date | System |
| `detection_method` | TEXT | How detected | Swoop |
| `action_taken` | TEXT | What was done | Staff |
| `outcome` | TEXT | Result | Staff |
| `revenue_protected` | NUMERIC(12,2) | Revenue protected ($) | Computed |
| `members_affected` | INT | Members affected | Computed |

### `experience_correlations`
Pre-computed touchpoint-retention correlations. Supports archetype and segment filtering.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `correlation_id` | SERIAL PK | Auto-increment | System |
| `touchpoint` | VARCHAR(100) | Touchpoint name | Swoop Analytics |
| `retention_impact` | NUMERIC(4,2) | Correlation strength (0-1) | Swoop Analytics |
| `category` | VARCHAR(50) | Category | Swoop Analytics |
| `description` | TEXT | Description | Swoop Analytics |
| `segment` | VARCHAR(20) | `all` / `at-risk` / `healthy` | — |
| `archetype` | VARCHAR(50) | Archetype filter (NULL = all) | — |
| `trend_data` | JSONB | Trend sparkline data | Swoop Analytics |
| `delta` | VARCHAR(20) | Change amount | Swoop Analytics |
| `delta_direction` | VARCHAR(10) | `up` / `down` | Swoop Analytics |

### `correlation_insights`
Cross-domain insight cards (the "Layer 3" intelligence).

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `insight_id` | VARCHAR(50) PK | Insight ID | Swoop Analytics |
| `headline` | TEXT | Headline text | Swoop Analytics |
| `detail` | TEXT | Detail text | Swoop Analytics |
| `domains` | TEXT[] | Array of domains (Golf, Dining, etc.) | Swoop Analytics |
| `impact` | VARCHAR(20) | `high` / `medium` / `low` | Swoop Analytics |
| `metric_value` | VARCHAR(20) | Display value (e.g., "2.3x") | Swoop Analytics |
| `metric_label` | VARCHAR(100) | Metric label | Swoop Analytics |
| `trend_data` | JSONB | Trend data | Swoop Analytics |
| `delta` | VARCHAR(20) | Change | Swoop Analytics |
| `delta_direction` | VARCHAR(10) | Direction | Swoop Analytics |
| `archetype` | VARCHAR(50) | Archetype (NULL = all) | — |

### `event_roi_metrics`
Event type ROI analysis.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `event_type` | VARCHAR(100) PK | Event type | Swoop Analytics |
| `attendance_avg` | INT | Average attendance | Events System |
| `retention_rate` | NUMERIC(5,2) | Attendee retention rate | Swoop Analytics |
| `avg_spend` | NUMERIC(8,2) | Average spend per attendee | POS |
| `roi_score` | NUMERIC(4,1) | ROI multiplier | Swoop Analytics |
| `frequency` | VARCHAR(50) | How often (Monthly, Quarterly) | Events System |

### `archetype_spend_gaps`
Spend gap analysis by archetype.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `archetype` | VARCHAR(50) PK | Archetype | Swoop |
| `member_count` | INT | Members in archetype | Computed |
| `current_dining` | INT | Current dining engagement % | POS |
| `potential_dining` | INT | Potential dining engagement % | Swoop Analytics |
| `current_events` | INT | Current events engagement % | Events |
| `potential_events` | INT | Potential events engagement % | Swoop Analytics |
| `avg_annual_spend` | NUMERIC(10,2) | Average annual spend | POS |
| `untapped_dining` | NUMERIC(10,2) | Untapped dining revenue ($) | Computed |
| `untapped_events` | NUMERIC(10,2) | Untapped events revenue ($) | Computed |
| `total_untapped` | NUMERIC(10,2) | Total untapped revenue ($) | Computed |
| `campaign` | TEXT | Recommended campaign | Swoop |

### `industry_benchmarks`
Club vs. industry benchmark comparisons.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `metric_key` | VARCHAR(50) PK | Metric identifier | Swoop Research |
| `club_value` | NUMERIC(12,2) | Club's value | Computed |
| `industry_value` | NUMERIC(12,2) | Industry average | Swoop Research |
| `unit` | VARCHAR(10) | Unit (%, $, hrs) | — |
| `label` | VARCHAR(100) | Display label | — |
| `comparison_text` | VARCHAR(50) | "Above average", etc. | Computed |
| `direction` | VARCHAR(20) | Whether higher is better | — |

---

## 10. Agents & Automation Domain

### `agent_definitions`
AI agent registry. 6 agents in the canonical set.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `agent_id` | VARCHAR(50) PK | Agent ID | Swoop |
| `name` | VARCHAR(100) | Agent name | Swoop |
| `description` | TEXT | What the agent does | Swoop |
| `status` | VARCHAR(20) | `active` / `idle` / `learning` | Swoop |
| `model` | VARCHAR(50) | AI model used | Swoop |
| `avatar` | VARCHAR(100) | Avatar path | Swoop |
| `source_systems` | TEXT[] | Data sources array | Swoop |
| `last_run` | TIMESTAMPTZ | Last execution time | Swoop |

**Canonical Agents:** Member Pulse, Demand Optimizer, Service Recovery, Revenue Analyst, Engagement Autopilot, Labor Optimizer

### `agent_actions`
Agent-proposed actions awaiting human approval.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `action_id` | VARCHAR(50) PK | Action ID | Swoop Agent |
| `agent_id` | VARCHAR(50) FK → agent_definitions | Source agent | — |
| `action_type` | VARCHAR(50) | Action category | Swoop Agent |
| `priority` | VARCHAR(20) | `high` / `medium` / `low` | Swoop Agent |
| `source` | VARCHAR(100) | Detection source | Swoop Agent |
| `description` | TEXT | What the agent recommends | Swoop Agent |
| `impact_metric` | VARCHAR(100) | Expected impact | Swoop Agent |
| `member_id` | VARCHAR(20) | Target member | — |
| `status` | VARCHAR(20) | `pending` / `approved` / `dismissed` | Staff |
| `approval_action` | TEXT | How it was approved (Send/Schedule/Assign) | Staff |
| `dismissal_reason` | TEXT | Why dismissed | Staff |
| `timestamp` | TIMESTAMPTZ | Created at | System |
| `approved_at` | TIMESTAMPTZ | Approval timestamp | Staff |
| `dismissed_at` | TIMESTAMPTZ | Dismissal timestamp | Staff |

### `activity_log`
Universal action tracking. Every user action in the dashboard persists here.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `id` | SERIAL PK | Auto-increment | System |
| `action_type` | VARCHAR(50) | approve / dismiss / call / note / task / campaign / playbook / escalate / flag / feedback / confirm / reassign / deploy / toggle_agent / config_agent / snooze | Dashboard UI |
| `action_subtype` | VARCHAR(50) | Refinement (send / schedule / assign / bulk / activate / deactivate / etc.) | Dashboard UI |
| `actor` | VARCHAR(50) | User who took action | Auth (default: gm_default) |
| `member_id` | VARCHAR(20) | Target member (nullable) | Context |
| `member_name` | VARCHAR(100) | Target member name | Context |
| `agent_id` | VARCHAR(50) | Source AI agent (nullable) | Context |
| `reference_id` | VARCHAR(100) | Foreign key to related entity | Context |
| `reference_type` | VARCHAR(50) | Type of reference (agent_action / playbook / confirmation / reassignment / feedback) | Context |
| `description` | TEXT | Action description | Dashboard UI |
| `meta` | JSONB | Flexible payload (impact, archetype, staff, notes) | Dashboard UI |
| `status` | VARCHAR(20) | `logged` / `pending_integration` / `sent` / `failed` | System |
| `created_at` | TIMESTAMPTZ | Timestamp | System |

---

## 11. Location Intelligence Domain

### `member_location_current`
Real-time member on-property location.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `member_id` | TEXT PK FK → members | Member | Swoop App GPS |
| `zone` | VARCHAR(50) | Property zone | Swoop App GPS |
| `sub_location` | VARCHAR(100) | Specific location | Swoop App GPS |
| `check_in_time` | TIMESTAMPTZ | Zone entry time | Swoop App GPS |
| `health_status` | VARCHAR(20) | Member health status | Swoop Computed |
| `activity_type` | VARCHAR(50) | Current activity | Swoop App GPS |

### `staff_location_current`
Real-time staff location for dispatch.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `staff_id` | VARCHAR(20) PK | Staff ID | Staff App |
| `name` | VARCHAR(100) | Staff name | ADP |
| `zone` | VARCHAR(50) | Current zone | Staff App |
| `status` | VARCHAR(20) | Available / busy / on-break | Staff App |
| `eta_minutes` | INT | ETA to nearest need | Computed |
| `department` | VARCHAR(50) | Department | ADP |

### `service_recovery_alerts`
Active service recovery situations requiring attention.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `alert_id` | SERIAL PK | Alert ID | Swoop Detection |
| `member_id` | VARCHAR(20) | Affected member | — |
| `member_name` | VARCHAR(100) | Member name | Club CRM |
| `severity` | VARCHAR(20) | `low` / `medium` / `high` / `critical` | Swoop Computed |
| `zone` | VARCHAR(50) | Location on property | Swoop App GPS |
| `detail` | TEXT | Alert details | Swoop Detection |
| `recommended_action` | TEXT | Recommended response | Swoop |
| `created_at` | TIMESTAMPTZ | Alert timestamp | System |
| `resolved_at` | TIMESTAMPTZ | Resolution timestamp | Staff |

---

## 12. Integrations Domain

### `connected_systems`
Third-party system integrations.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `system_id` | VARCHAR(50) PK | System ID | Config |
| `vendor_name` | VARCHAR(100) | Vendor name | Config |
| `category` | VARCHAR(50) | tee_sheet / pos / crm / scheduling / email / weather / finance | Config |
| `status` | VARCHAR(20) | `connected` / `available` / `error` | System |
| `last_sync` | TIMESTAMPTZ | Last sync timestamp | System |
| `data_points_synced` | INT | Total data points synced | System |
| `config` | JSONB | Integration configuration | Club Admin |

### `user_sessions`
Dashboard user session tracking (for "Since Last Login" deltas).

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `session_id` | SERIAL PK | Session ID | System |
| `user_id` | VARCHAR(50) | Dashboard user | Auth |
| `login_at` | TIMESTAMPTZ | Login timestamp | System |
| `snapshot` | JSONB | State snapshot at login time | Swoop Computed |

---

## Source Systems Summary

| Source | Tables Fed | Integration Type |
|--------|-----------|-----------------|
| **Club CRM** (Jonas Club / Clubessential) | club, members, households, membership_types, feedback | API / CSV |
| **Tee Sheet** (ForeTees) | courses, bookings, booking_players, waitlist_entries, member_waitlist | API |
| **POS** (Jonas / Toast / Northstar) | dining_outlets, pos_checks, pos_line_items, pos_payments | API |
| **Scheduling** (ADP Workforce) | staff, staff_shifts, is_understaffed flags | API |
| **Email** (Mailchimp / Constant Contact) | email_campaigns, email_events | API |
| **Events** (Club CRM / Custom) | event_definitions, event_registrations | API / CSV |
| **Weather API** | weather_daily | API (automated daily) |
| **Swoop App** (GPS/Mobile) | member_location_current, service_requests, visit_sessions | Real-time |
| **Swoop ML/Analytics** | cancellation_risk, demand_heatmap, engagement scores, correlations, insights | Computed |
| **Dashboard UI** | activity_log, agent_actions (approve/dismiss), booking_confirmations (status updates) | User actions |

---

## Row Counts (Demo Environment)

| Table | Approximate Rows |
|-------|-----------------|
| members | 300 |
| bookings | ~4,000 |
| booking_players | ~12,000 |
| pos_checks | ~5,000 |
| pos_line_items | ~15,000 |
| member_engagement_daily | 9,300 |
| member_engagement_weekly | 1,500 |
| email_events | ~8,000 |
| staff_shifts | ~800 |
| weather_daily | 31 |
| close_outs | 31 |
| agent_actions | ~12 |
| activity_log | 17+ (grows with use) |
| All other tables | 5-100 rows each |
