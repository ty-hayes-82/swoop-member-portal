# 3. Golf Operations Domain

*Tee sheet bookings, player details, pace of play tracking, and waitlist management. Links to F&B via post-round dining flags on POS checks.*

**Tables:** `bookings`, `booking_players`, `pace_of_play`, `pace_hole_segments`, `waitlist_entries`, `rounds`

---

## `bookings`

Tee time reservations. Central join point between golf, F&B (via pos_checks.linked_booking_id), and events.

**Schema source:** seed | **PK:** `booking_id`
**Indexes:** idx_bookings_date, idx_bookings_course, idx_bookings_status

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `booking_id` | TEXT | NO | | PK (bkg_0001) | TTM: Tee Time reservation ID. |
| `club_id` | TEXT | NO | | FK to club | Swoop-assigned. |
| `course_id` | TEXT | NO | | FK to courses | TTM: Course code. |
| `booking_date` | TEXT | NO | | ISO date of round | TTM: Tee sheet date. |
| `tee_time` | TEXT | NO | | Tee time (HH:MM) | TTM: Time slot on tee sheet. |
| `player_count` | INTEGER | NO | 1 | Players in group | TTM: Number of players (foursome slots). |
| `has_guest` | INTEGER | NO | 0 | Boolean: guest present | TTM: Guest flag on player slot. |
| `transportation` | TEXT | NO | 'cart' | cart / walk | TTM: Via Golfer Classifications and POS Items. |
| `has_caddie` | INTEGER | NO | 0 | Boolean: caddie booked | TTM: Caddie flag from Golfer Classification. |
| `round_type` | TEXT | NO | '18' | 18 / 9 | TTM: Derived from course configuration. |
| `status` | TEXT | NO | 'confirmed' | confirmed / completed / cancelled / no_show | TTM: Reservation status. |
| `check_in_time` | TEXT | YES | | Actual check-in timestamp | TTM: Check-in event. Writes to Club Activity File. |
| `round_start` | TEXT | YES | | Round start timestamp | TTM/GPS: First tee timestamp. |
| `round_end` | TEXT | YES | | Round end timestamp | TTM/GPS: Last hole timestamp. |
| `duration_minutes` | INTEGER | YES | | Total round duration | TTM/GPS: Calculated from round_start to round_end. |

---

## `booking_players`

Individual players within a booking group. Tracks guest warm leads for membership pipeline.

**Schema source:** seed | **PK:** `player_id`
**Indexes:** idx_booking_players_booking, idx_booking_players_member, idx_booking_players_lead

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `player_id` | TEXT | NO | | PK (bp_00001) | System-generated. |
| `booking_id` | TEXT | NO | | FK to bookings | TTM: Links to tee time reservation. |
| `member_id` | TEXT | YES | | FK to members (NULL if guest) | TTM: **Member #** in player slot. |
| `guest_name` | TEXT | YES | | Guest name if non-member | TTM: Guest name on tee sheet. |
| `is_guest` | INTEGER | NO | 0 | Boolean: is a guest | TTM: Derived from account type. |
| `is_warm_lead` | INTEGER | NO | 0 | Boolean: membership prospect | **Swoop Computed.** Scored by guest frequency. |
| `position_in_group` | INTEGER | NO | 1 | Position 1-4 in foursome | TTM: Slot position on tee sheet. |

---

## `pace_of_play`

Round-level pace metrics.

**Schema source:** seed | **PK:** `pace_id`
**Indexes:** idx_pace_booking, idx_pace_slow

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `pace_id` | TEXT | NO | | PK (pac_00001) | GPS/Pace tech (e.g. Tagmarshal). |
| `booking_id` | TEXT | NO | | FK to bookings | Linked via tee time. |
| `total_minutes` | INTEGER | NO | | Total round time | GPS/Pace tech. Not natively in Jonas. |
| `is_slow_round` | INTEGER | NO | 0 | Boolean: >270 min for 18H | **Swoop Computed.** Threshold on total_minutes. |
| `groups_passed` | INTEGER | NO | 0 | Groups that played through | GPS/Pace tech. |
| `ranger_interventions` | INTEGER | NO | 0 | Ranger contact count | Manual entry or GPS integration. |

---

## `pace_hole_segments`

Hole-by-hole pace data for bottleneck detection.

**Schema source:** seed | **PK:** `segment_id`
**Indexes:** idx_segments_pace, idx_segments_bottleneck

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `segment_id` | TEXT | NO | | PK (seg_000001) | GPS/Pace tech. |
| `pace_id` | TEXT | NO | | FK to pace_of_play | Linked via pace record. |
| `hole_number` | INTEGER | NO | | Hole number (1-18) | GPS/Pace tech. |
| `tee_time` | TEXT | YES | | Timestamp at tee | GPS/Pace tech. |
| `green_time` | TEXT | YES | | Timestamp at green | GPS/Pace tech. |
| `segment_minutes` | INTEGER | NO | | Minutes on this hole | GPS/Pace tech. |
| `is_bottleneck` | INTEGER | NO | 0 | Boolean: flagged as bottleneck | **Swoop Computed.** Threshold analysis. |

---

## `waitlist_entries`

Course-level waitlist pressure tracking.

**Schema source:** seed | **PK:** `entry_id`

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `entry_id` | TEXT | NO | | PK (wl_001) | TTM: System-generated. |
| `club_id` | TEXT | NO | | FK to club | Swoop-assigned. |
| `course_id` | TEXT | NO | | FK to courses | TTM: Course code. |
| `requested_date` | TEXT | NO | | Requested date | TTM: Waitlist request date. |
| `requested_tee_time` | TEXT | NO | | Requested tee time | TTM: Preferred time. |
| `waitlist_count` | INTEGER | NO | 1 | Members waiting | TTM: Count from waitlist or Noteefy. |
| `has_event_overlap` | INTEGER | NO | 0 | Boolean: event conflict | **Swoop Computed.** Cross-ref with event_definitions. |
| `peak_slot` | TEXT | YES | | Peak demand slot | **Swoop Computed.** |

---

## `rounds`

Production tee-sheet data ingested from CMS integrations. Simpler than seed bookings table.

**Schema source:** migration | **PK:** `round_id`
**Indexes:** idx_rounds_member(member_id, round_date DESC)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `round_id` | TEXT | NO | gen_random_uuid() | PK | System-generated UUID. |
| `club_id` | TEXT | NO | | FK to club | Swoop-assigned. |
| `member_id` | TEXT | NO | | FK to members | TTM: **Member #** on tee sheet. |
| `booking_id` | TEXT | YES | | Linked booking if available | TTM: Tee time reservation reference. |
| `round_date` | DATE | NO | | Date of round | TTM: Tee sheet date. **CSV alias:** ForeTees 'Tee Date'. |
| `tee_time` | TIME | YES | | Tee time | TTM: Time slot. **CSV alias:** ForeTees 'Booking Time'. |
| `course_id` | TEXT | YES | | FK to courses | TTM: Course code. |
| `duration_minutes` | INTEGER | YES | | Round duration | TTM/GPS: Calculated or pace tech. |
| `pace_rating` | TEXT | YES | | Pace quality rating | **Swoop Computed** or GPS input. |
| `players` | INTEGER | NO | 1 | Players in group | TTM: Player count. |
| `cancelled` | BOOLEAN | NO | FALSE | Was round cancelled | TTM: Cancellation from End of Day Processing. |
| `no_show` | BOOLEAN | NO | FALSE | Was a no-show | TTM: No-show flag. |
| `data_source` | TEXT | NO | 'tee_sheet' | Source system | N/A (system). |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Row created | N/A (system). |
