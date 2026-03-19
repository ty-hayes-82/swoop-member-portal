-- =============================================================================
-- Swoop Golf Five Lenses Platform — Database Schema
-- Oakmont Hills Country Club · January 2026 simulation
-- 32 tables across 7 operational domains
-- Run once against Vercel Postgres (POSTGRES_URL_NON_POOLING)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 3.1 CLUB REFERENCE DOMAIN
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS club (
    club_id             TEXT PRIMARY KEY,
    name                TEXT NOT NULL,
    city                TEXT NOT NULL,
    state               TEXT NOT NULL,
    zip                 TEXT NOT NULL,
    founded_year        INTEGER,
    member_count        INTEGER,
    course_count        INTEGER,
    outlet_count        INTEGER
);

CREATE TABLE IF NOT EXISTS courses (
    course_id           TEXT PRIMARY KEY,
    club_id             TEXT NOT NULL REFERENCES club(club_id),
    name                TEXT NOT NULL,
    holes               INTEGER NOT NULL,
    par                 INTEGER NOT NULL,
    tee_interval_min    INTEGER NOT NULL,
    first_tee           TEXT NOT NULL,   -- HH:MM
    last_tee            TEXT NOT NULL    -- HH:MM
);

CREATE TABLE IF NOT EXISTS dining_outlets (
    outlet_id           TEXT PRIMARY KEY,
    club_id             TEXT NOT NULL REFERENCES club(club_id),
    name                TEXT NOT NULL,
    type                TEXT NOT NULL,          -- dining | bar | on-course
    meal_periods        TEXT NOT NULL,          -- JSON array
    weekday_covers      INTEGER NOT NULL,
    weekend_covers      INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS membership_types (
    type_code           TEXT PRIMARY KEY,       -- FG | SOC | JR | LEG | SPT | NR
    name                TEXT NOT NULL,
    annual_dues         REAL NOT NULL,
    fb_minimum          REAL NOT NULL DEFAULT 0,
    golf_eligible       INTEGER NOT NULL DEFAULT 1
);

-- ---------------------------------------------------------------------------
-- 3.2 MEMBERS DOMAIN
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS households (
    household_id        TEXT PRIMARY KEY,
    primary_member_id   TEXT,                   -- updated after members insert
    member_count        INTEGER NOT NULL DEFAULT 1,
    address             TEXT,
    is_multi_member     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS members (
    member_id               TEXT PRIMARY KEY,   -- mbr_001 … mbr_300
    member_number           INTEGER NOT NULL,
    first_name              TEXT NOT NULL,
    last_name               TEXT NOT NULL,
    email                   TEXT,
    phone                   TEXT,
    date_of_birth           TEXT,
    gender                  TEXT,
    membership_type         TEXT NOT NULL REFERENCES membership_types(type_code),
    membership_status       TEXT NOT NULL DEFAULT 'active',  -- active | loa | resigned
    join_date               TEXT NOT NULL,
    resigned_on             TEXT,               -- NULL unless resigned
    household_id            TEXT REFERENCES households(household_id),
    archetype               TEXT NOT NULL,
    annual_dues             REAL NOT NULL,
    account_balance         REAL NOT NULL DEFAULT 0,
    ghin_number             TEXT,
    communication_opt_in    INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_members_archetype        ON members(archetype);
CREATE INDEX IF NOT EXISTS idx_members_status           ON members(membership_status);
CREATE INDEX IF NOT EXISTS idx_members_household        ON members(household_id);

-- ---------------------------------------------------------------------------
-- 3.3 GOLF OPERATIONS DOMAIN
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bookings (
    booking_id          TEXT PRIMARY KEY,       -- bkg_0001 …
    club_id             TEXT NOT NULL REFERENCES club(club_id),
    course_id           TEXT NOT NULL REFERENCES courses(course_id),
    booking_date        TEXT NOT NULL,          -- ISO date
    tee_time            TEXT NOT NULL,          -- HH:MM
    player_count        INTEGER NOT NULL DEFAULT 1,
    has_guest           INTEGER NOT NULL DEFAULT 0,
    transportation      TEXT NOT NULL DEFAULT 'cart',   -- cart | walk
    has_caddie          INTEGER NOT NULL DEFAULT 0,
    round_type          TEXT NOT NULL DEFAULT '18',     -- 18 | 9
    status              TEXT NOT NULL DEFAULT 'confirmed',
    check_in_time       TEXT,
    round_start         TEXT,
    round_end           TEXT,
    duration_minutes    INTEGER
);

CREATE INDEX IF NOT EXISTS idx_bookings_date            ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_course          ON bookings(course_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status          ON bookings(status);

CREATE TABLE IF NOT EXISTS booking_players (
    player_id           TEXT PRIMARY KEY,       -- bp_00001 …
    booking_id          TEXT NOT NULL REFERENCES bookings(booking_id),
    member_id           TEXT REFERENCES members(member_id),  -- NULL if guest
    guest_name          TEXT,
    is_guest            INTEGER NOT NULL DEFAULT 0,
    is_warm_lead        INTEGER NOT NULL DEFAULT 0,
    position_in_group   INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_booking_players_booking  ON booking_players(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_players_member   ON booking_players(member_id);
CREATE INDEX IF NOT EXISTS idx_booking_players_lead     ON booking_players(is_warm_lead);

CREATE TABLE IF NOT EXISTS pace_of_play (
    pace_id             TEXT PRIMARY KEY,       -- pac_00001 …
    booking_id          TEXT NOT NULL REFERENCES bookings(booking_id),
    total_minutes       INTEGER NOT NULL,
    is_slow_round       INTEGER NOT NULL DEFAULT 0,  -- 1 if > 270 min (18H)
    groups_passed       INTEGER NOT NULL DEFAULT 0,
    ranger_interventions INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pace_booking             ON pace_of_play(booking_id);
CREATE INDEX IF NOT EXISTS idx_pace_slow                ON pace_of_play(is_slow_round);

CREATE TABLE IF NOT EXISTS pace_hole_segments (
    segment_id          TEXT PRIMARY KEY,       -- seg_000001 …
    pace_id             TEXT NOT NULL REFERENCES pace_of_play(pace_id),
    hole_number         INTEGER NOT NULL,
    tee_time            TEXT,                   -- ISO timestamp
    green_time          TEXT,                   -- ISO timestamp
    segment_minutes     INTEGER NOT NULL,
    is_bottleneck       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_segments_pace            ON pace_hole_segments(pace_id);
CREATE INDEX IF NOT EXISTS idx_segments_bottleneck      ON pace_hole_segments(is_bottleneck);

CREATE TABLE IF NOT EXISTS waitlist_entries (
    entry_id            TEXT PRIMARY KEY,       -- wl_001 …
    club_id             TEXT NOT NULL REFERENCES club(club_id),
    course_id           TEXT NOT NULL REFERENCES courses(course_id),
    requested_date      TEXT NOT NULL,
    requested_tee_time  TEXT NOT NULL,
    waitlist_count      INTEGER NOT NULL DEFAULT 1,
    has_event_overlap   INTEGER NOT NULL DEFAULT 0,
    peak_slot           TEXT
);

-- ---------------------------------------------------------------------------
-- 3.4 FOOD & BEVERAGE DOMAIN
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pos_checks (
    check_id                TEXT PRIMARY KEY,   -- chk_00001 …
    outlet_id               TEXT NOT NULL REFERENCES dining_outlets(outlet_id),
    member_id               TEXT REFERENCES members(member_id),
    opened_at               TEXT NOT NULL,
    closed_at               TEXT,
    first_item_fired_at     TEXT,
    last_item_fulfilled_at  TEXT,
    subtotal                REAL NOT NULL DEFAULT 0,
    tax_amount              REAL NOT NULL DEFAULT 0,
    tip_amount              REAL NOT NULL DEFAULT 0,
    comp_amount             REAL NOT NULL DEFAULT 0,
    discount_amount         REAL NOT NULL DEFAULT 0,
    void_amount             REAL NOT NULL DEFAULT 0,
    total                   REAL NOT NULL DEFAULT 0,
    payment_method          TEXT NOT NULL DEFAULT 'member_charge',
    post_round_dining       INTEGER NOT NULL DEFAULT 0,
    linked_booking_id       TEXT REFERENCES bookings(booking_id),
    event_id                TEXT,               -- FK to event_definitions (added after)
    is_understaffed_day     INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pos_member               ON pos_checks(member_id);
CREATE INDEX IF NOT EXISTS idx_pos_outlet               ON pos_checks(outlet_id);
CREATE INDEX IF NOT EXISTS idx_pos_date                 ON pos_checks(opened_at);
CREATE INDEX IF NOT EXISTS idx_pos_post_round           ON pos_checks(post_round_dining);
CREATE INDEX IF NOT EXISTS idx_pos_understaffed         ON pos_checks(is_understaffed_day);

CREATE TABLE IF NOT EXISTS pos_line_items (
    line_item_id        TEXT PRIMARY KEY,       -- li_000001 …
    check_id            TEXT NOT NULL REFERENCES pos_checks(check_id),
    item_name           TEXT NOT NULL,
    category            TEXT NOT NULL,          -- appetizer | entree | sandwich | salad | side | dessert | beer | wine | cocktail | na_beverage
    unit_price          REAL NOT NULL,
    quantity            INTEGER NOT NULL DEFAULT 1,
    line_total          REAL NOT NULL,
    is_comp             INTEGER NOT NULL DEFAULT 0,
    is_void             INTEGER NOT NULL DEFAULT 0,
    fired_at            TEXT
);

CREATE INDEX IF NOT EXISTS idx_line_items_check         ON pos_line_items(check_id);
CREATE INDEX IF NOT EXISTS idx_line_items_category      ON pos_line_items(category);

CREATE TABLE IF NOT EXISTS pos_payments (
    payment_id          TEXT PRIMARY KEY,       -- pay_00001 …
    check_id            TEXT NOT NULL REFERENCES pos_checks(check_id),
    payment_method      TEXT NOT NULL,
    amount              REAL NOT NULL,
    processed_at        TEXT NOT NULL,
    is_split            INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_payments_check           ON pos_payments(check_id);

-- ---------------------------------------------------------------------------
-- 3.5 EVENTS & COMMUNICATIONS DOMAIN
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS event_definitions (
    event_id            TEXT PRIMARY KEY,       -- evt_001 …
    club_id             TEXT NOT NULL REFERENCES club(club_id),
    name                TEXT NOT NULL,
    type                TEXT NOT NULL,          -- golf_tournament | dining | league | social
    event_date          TEXT NOT NULL,
    capacity            INTEGER NOT NULL,
    registration_fee    REAL NOT NULL DEFAULT 0,
    description         TEXT
);

-- Add FK from pos_checks to event_definitions now that event_definitions exists
ALTER TABLE pos_checks ADD CONSTRAINT fk_pos_event
    FOREIGN KEY (event_id) REFERENCES event_definitions(event_id)
    DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE IF NOT EXISTS event_registrations (
    registration_id     TEXT PRIMARY KEY,       -- reg_0001 …
    event_id            TEXT NOT NULL REFERENCES event_definitions(event_id),
    member_id           TEXT NOT NULL REFERENCES members(member_id),
    status              TEXT NOT NULL DEFAULT 'registered',  -- registered | attended | no_show | cancelled
    guest_count         INTEGER NOT NULL DEFAULT 0,
    fee_paid            REAL NOT NULL DEFAULT 0,
    registered_at       TEXT NOT NULL,
    checked_in_at       TEXT
);

CREATE INDEX IF NOT EXISTS idx_registrations_event      ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_member     ON event_registrations(member_id);

CREATE TABLE IF NOT EXISTS email_campaigns (
    campaign_id         TEXT PRIMARY KEY,       -- cam_001 …
    club_id             TEXT NOT NULL REFERENCES club(club_id),
    subject             TEXT NOT NULL,
    type                TEXT NOT NULL,          -- newsletter | operational | event_promo | fb_promo
    send_date           TEXT NOT NULL,
    recipient_count     INTEGER NOT NULL DEFAULT 0,
    html_content_url    TEXT
);

CREATE TABLE IF NOT EXISTS email_events (
    event_id            TEXT PRIMARY KEY,       -- ee_00001 …
    campaign_id         TEXT NOT NULL REFERENCES email_campaigns(campaign_id),
    member_id           TEXT NOT NULL REFERENCES members(member_id),
    event_type          TEXT NOT NULL,          -- send | open | click | bounce | unsubscribe
    occurred_at         TEXT NOT NULL,
    link_clicked        TEXT,
    device_type         TEXT                    -- mobile | desktop | tablet
);

CREATE INDEX IF NOT EXISTS idx_email_events_campaign    ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_member      ON email_events(member_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type        ON email_events(event_type);

-- ---------------------------------------------------------------------------
-- 3.6 SERVICE & STAFFING DOMAIN
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS feedback (
    feedback_id         TEXT PRIMARY KEY,       -- fb_001 …
    member_id           TEXT REFERENCES members(member_id),
    club_id             TEXT NOT NULL REFERENCES club(club_id),
    submitted_at        TEXT NOT NULL,
    category            TEXT NOT NULL,          -- Service Speed | Food Quality | Course Condition | Facility | Staff | Pace of Play | General
    sentiment_score     REAL NOT NULL,          -- -1.0 to +1.0
    description         TEXT,
    status              TEXT NOT NULL DEFAULT 'acknowledged',  -- acknowledged | in_progress | resolved | escalated
    resolved_at         TEXT,
    is_understaffed_day INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_feedback_member          ON feedback(member_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status          ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_understaffed    ON feedback(is_understaffed_day);

CREATE TABLE IF NOT EXISTS service_requests (
    request_id          TEXT PRIMARY KEY,       -- sr_0001 …
    member_id           TEXT REFERENCES members(member_id),
    booking_id          TEXT REFERENCES bookings(booking_id),
    request_type        TEXT NOT NULL,          -- beverage_cart | pace_complaint | course_condition | equipment | facility_maintenance
    requested_at        TEXT NOT NULL,
    response_time_min   INTEGER,
    resolved_at         TEXT,
    resolution_notes    TEXT,
    is_understaffed_day INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_service_req_member       ON service_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_service_req_type         ON service_requests(request_type);

CREATE TABLE IF NOT EXISTS staff (
    staff_id            TEXT PRIMARY KEY,       -- stf_001 …
    club_id             TEXT NOT NULL REFERENCES club(club_id),
    first_name          TEXT NOT NULL,
    last_name           TEXT NOT NULL,
    department          TEXT NOT NULL,          -- Golf Operations | F&B Service | F&B Kitchen | Grounds | Pro Shop | Administration
    role                TEXT NOT NULL,
    hire_date           TEXT NOT NULL,
    hourly_rate         REAL NOT NULL,
    is_full_time        INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS staff_shifts (
    shift_id            TEXT PRIMARY KEY,       -- shf_0001 …
    staff_id            TEXT NOT NULL REFERENCES staff(staff_id),
    shift_date          TEXT NOT NULL,
    outlet_id           TEXT REFERENCES dining_outlets(outlet_id),  -- NULL for non-F&B
    start_time          TEXT NOT NULL,
    end_time            TEXT NOT NULL,
    hours_worked        REAL NOT NULL,
    is_understaffed_day INTEGER NOT NULL DEFAULT 0,
    notes               TEXT
);

CREATE INDEX IF NOT EXISTS idx_shifts_staff             ON staff_shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date              ON staff_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_shifts_understaffed      ON staff_shifts(is_understaffed_day);

-- ---------------------------------------------------------------------------
-- 3.7 OPERATIONS & METRICS DOMAIN
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS close_outs (
    closeout_id         TEXT PRIMARY KEY,       -- co_001 …
    club_id             TEXT NOT NULL REFERENCES club(club_id),
    date                TEXT NOT NULL UNIQUE,
    golf_revenue        REAL NOT NULL DEFAULT 0,
    fb_revenue          REAL NOT NULL DEFAULT 0,
    total_revenue       REAL NOT NULL DEFAULT 0,
    rounds_played       INTEGER NOT NULL DEFAULT 0,
    covers              INTEGER NOT NULL DEFAULT 0,
    weather             TEXT NOT NULL DEFAULT 'sunny',
    is_understaffed     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS canonical_events (
    event_id            TEXT PRIMARY KEY,       -- MD5-based idempotency key
    entity_type         TEXT NOT NULL,
    entity_id           TEXT NOT NULL,
    event_type          TEXT NOT NULL,          -- created | updated | completed | cancelled | resigned
    event_timestamp     TEXT NOT NULL,
    source_vendor       TEXT NOT NULL,          -- ForeTees | Jonas POS | Northstar | ClubReady | Club Prophet
    payload             TEXT NOT NULL           -- JSON snapshot
);

CREATE INDEX IF NOT EXISTS idx_canonical_entity         ON canonical_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_canonical_timestamp      ON canonical_events(event_timestamp);

CREATE TABLE IF NOT EXISTS member_engagement_daily (
    row_id              TEXT PRIMARY KEY,       -- 300 × 31 = 9,300 rows
    member_id           TEXT NOT NULL REFERENCES members(member_id),
    date                TEXT NOT NULL,
    rounds_played       INTEGER NOT NULL DEFAULT 0,
    dining_checks       INTEGER NOT NULL DEFAULT 0,
    dining_spend        REAL NOT NULL DEFAULT 0,
    events_attended     INTEGER NOT NULL DEFAULT 0,
    emails_opened       INTEGER NOT NULL DEFAULT 0,
    feedback_submitted  INTEGER NOT NULL DEFAULT 0,
    visit_flag          INTEGER NOT NULL DEFAULT 0,
    UNIQUE(member_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_member             ON member_engagement_daily(member_id);
CREATE INDEX IF NOT EXISTS idx_daily_date               ON member_engagement_daily(date);

CREATE TABLE IF NOT EXISTS member_engagement_weekly (
    row_id              TEXT PRIMARY KEY,       -- 300 × 5 = 1,500 rows
    member_id           TEXT NOT NULL REFERENCES members(member_id),
    week_number         INTEGER NOT NULL,       -- 1–5
    week_start          TEXT NOT NULL,
    week_end            TEXT NOT NULL,
    rounds_played       INTEGER NOT NULL DEFAULT 0,
    dining_visits       INTEGER NOT NULL DEFAULT 0,
    dining_spend        REAL NOT NULL DEFAULT 0,
    events_attended     INTEGER NOT NULL DEFAULT 0,
    email_open_rate     REAL NOT NULL DEFAULT 0,
    engagement_score    REAL NOT NULL DEFAULT 0,
    UNIQUE(member_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_weekly_member            ON member_engagement_weekly(member_id);
CREATE INDEX IF NOT EXISTS idx_weekly_score             ON member_engagement_weekly(engagement_score);

CREATE TABLE IF NOT EXISTS visit_sessions (
    session_id          TEXT PRIMARY KEY,       -- vs_00001 …
    member_id           TEXT NOT NULL REFERENCES members(member_id),
    session_date        TEXT NOT NULL,
    anchor_type         TEXT NOT NULL,          -- golf | dining | event
    arrival_time        TEXT,
    departure_time      TEXT,
    duration_minutes    INTEGER,
    touchpoints         INTEGER NOT NULL DEFAULT 1,
    total_spend         REAL NOT NULL DEFAULT 0,
    activities          TEXT NOT NULL DEFAULT '[]'  -- JSON array
);

CREATE INDEX IF NOT EXISTS idx_sessions_member          ON visit_sessions(member_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date            ON visit_sessions(session_date);

CREATE TABLE IF NOT EXISTS weather_daily (
    weather_id          TEXT PRIMARY KEY,       -- one row per day
    date                TEXT NOT NULL UNIQUE,
    condition           TEXT NOT NULL,          -- sunny | cloudy | rainy | windy | perfect
    temp_high           INTEGER NOT NULL,
    temp_low            INTEGER NOT NULL,
    wind_mph            INTEGER NOT NULL DEFAULT 0,
    precipitation_in    REAL NOT NULL DEFAULT 0,
    golf_demand_modifier REAL NOT NULL DEFAULT 0,
    fb_demand_modifier  REAL NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- 3.8 WAITLIST & DEMAND DOMAIN (Sprint Addition)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS member_waitlist (
    waitlist_id             TEXT PRIMARY KEY,   -- mwl_001 …
    member_id               TEXT NOT NULL REFERENCES members(member_id),
    course_id               TEXT NOT NULL REFERENCES courses(course_id),
    requested_date          TEXT NOT NULL,
    requested_slot          TEXT NOT NULL,
    alternatives_accepted   TEXT NOT NULL DEFAULT '[]',  -- JSON array
    days_waiting            INTEGER NOT NULL DEFAULT 0,
    retention_priority      TEXT NOT NULL DEFAULT 'NORMAL',  -- HIGH | NORMAL
    notified_at             TEXT,
    filled_at               TEXT,
    dining_incentive_attached INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_waitlist_member          ON member_waitlist(member_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_priority        ON member_waitlist(retention_priority);

CREATE TABLE IF NOT EXISTS cancellation_risk (
    risk_id                 TEXT PRIMARY KEY,   -- cr_001 …
    booking_id              TEXT NOT NULL REFERENCES bookings(booking_id),
    member_id               TEXT NOT NULL REFERENCES members(member_id),
    scored_at               TEXT NOT NULL,
    cancel_probability      REAL NOT NULL,      -- 0.0–1.0
    drivers                 TEXT NOT NULL DEFAULT '[]',  -- JSON array
    recommended_action      TEXT NOT NULL,
    estimated_revenue_lost  REAL NOT NULL DEFAULT 0,
    action_taken            TEXT,               -- NULL | confirmation_sent | personal_outreach | no_action
    outcome                 TEXT                -- NULL | kept | cancelled
);

CREATE INDEX IF NOT EXISTS idx_cancel_risk_booking      ON cancellation_risk(booking_id);
CREATE INDEX IF NOT EXISTS idx_cancel_risk_member       ON cancellation_risk(member_id);
CREATE INDEX IF NOT EXISTS idx_cancel_risk_prob         ON cancellation_risk(cancel_probability);

CREATE TABLE IF NOT EXISTS demand_heatmap (
    heatmap_id          TEXT PRIMARY KEY,       -- dh_001 …
    course_id           TEXT NOT NULL REFERENCES courses(course_id),
    day_of_week         TEXT NOT NULL,          -- Mon | Tue | Wed | Thu | Fri | Sat | Sun
    time_block          TEXT NOT NULL,          -- 7-8 AM | 8-9 AM | etc.
    fill_rate           REAL NOT NULL DEFAULT 0,
    unmet_rounds        INTEGER NOT NULL DEFAULT 0,
    demand_level        TEXT NOT NULL DEFAULT 'normal',  -- oversubscribed | normal | underutilized
    computed_for_month  TEXT NOT NULL            -- YYYY-MM
);

CREATE INDEX IF NOT EXISTS idx_heatmap_course           ON demand_heatmap(course_id);
CREATE INDEX IF NOT EXISTS idx_heatmap_day_time         ON demand_heatmap(day_of_week, time_block);

-- ---------------------------------------------------------------------------
-- 4.1 BOARD REPORT & COCKPIT DOMAIN (Sprint 1)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS board_report_snapshots (
  snapshot_id         SERIAL PRIMARY KEY,
  snapshot_date       DATE NOT NULL,
  members_saved       INT DEFAULT 0,
  dues_protected      NUMERIC(12,2) DEFAULT 0,
  ltv_protected       NUMERIC(12,2) DEFAULT 0,
  revenue_recovered   NUMERIC(12,2) DEFAULT 0,
  service_failures_caught INT DEFAULT 0,
  avg_response_time_hrs NUMERIC(5,1) DEFAULT 0,
  board_confidence_pct INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS member_interventions (
  intervention_id     SERIAL PRIMARY KEY,
  member_id           TEXT REFERENCES members(member_id),
  trigger_type        VARCHAR(50),
  trigger_detail      TEXT,
  action_taken        TEXT,
  outcome             TEXT,
  health_before       INT,
  health_after        INT,
  dues_at_risk        NUMERIC(12,2),
  intervention_date   DATE,
  resolved_date       DATE
);

CREATE TABLE IF NOT EXISTS operational_interventions (
  intervention_id     SERIAL PRIMARY KEY,
  event_type          VARCHAR(100),
  event_date          DATE,
  detection_method    TEXT,
  action_taken        TEXT,
  outcome             TEXT,
  revenue_protected   NUMERIC(12,2),
  members_affected    INT
);

CREATE TABLE IF NOT EXISTS user_sessions (
  session_id          SERIAL PRIMARY KEY,
  user_id             VARCHAR(50) DEFAULT 'gm_default',
  login_at            TIMESTAMPTZ DEFAULT NOW(),
  snapshot            JSONB
);

-- ---------------------------------------------------------------------------
-- 4.2 EXPERIENCE INSIGHTS DOMAIN (Sprint 2)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS experience_correlations (
  correlation_id      SERIAL PRIMARY KEY,
  touchpoint          VARCHAR(100),
  retention_impact    NUMERIC(4,2),
  category            VARCHAR(50),
  description         TEXT,
  segment             VARCHAR(20) DEFAULT 'all',
  archetype           VARCHAR(50) DEFAULT NULL,
  trend_data          JSONB,
  delta               VARCHAR(20),
  delta_direction     VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS correlation_insights (
  insight_id          VARCHAR(50) PRIMARY KEY,
  headline            TEXT,
  detail              TEXT,
  domains             TEXT[],
  impact              VARCHAR(20),
  metric_value        VARCHAR(20),
  metric_label        VARCHAR(100),
  trend_data          JSONB,
  delta               VARCHAR(20),
  delta_direction     VARCHAR(10),
  archetype           VARCHAR(50) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS event_roi_metrics (
  event_type          VARCHAR(100) PRIMARY KEY,
  attendance_avg      INT,
  retention_rate      NUMERIC(5,2),
  avg_spend           NUMERIC(8,2),
  roi_score           NUMERIC(4,1),
  frequency           VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS archetype_spend_gaps (
  archetype           VARCHAR(50) PRIMARY KEY,
  member_count        INT,
  current_dining      INT,
  potential_dining     INT,
  current_events      INT,
  potential_events    INT,
  avg_annual_spend    NUMERIC(10,2),
  untapped_dining     NUMERIC(10,2),
  untapped_events     NUMERIC(10,2),
  total_untapped      NUMERIC(10,2),
  campaign            TEXT
);

-- ---------------------------------------------------------------------------
-- 4.3 AGENTS DOMAIN (Sprint 3)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS agent_definitions (
  agent_id            VARCHAR(50) PRIMARY KEY,
  name                VARCHAR(100),
  description         TEXT,
  status              VARCHAR(20) DEFAULT 'active',
  model               VARCHAR(50),
  avatar              VARCHAR(100),
  source_systems      TEXT[],
  last_run            TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS agent_actions (
  action_id           VARCHAR(50) PRIMARY KEY,
  agent_id            VARCHAR(50) REFERENCES agent_definitions(agent_id),
  action_type         VARCHAR(50),
  priority            VARCHAR(20),
  source              VARCHAR(100),
  description         TEXT,
  impact_metric       VARCHAR(100),
  member_id           VARCHAR(20),
  status              VARCHAR(20) DEFAULT 'pending',
  approval_action     TEXT,
  dismissal_reason    TEXT,
  timestamp           TIMESTAMPTZ DEFAULT NOW(),
  approved_at         TIMESTAMPTZ,
  dismissed_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_actions_status ON agent_actions(status);
CREATE INDEX IF NOT EXISTS idx_agent_actions_agent  ON agent_actions(agent_id);

-- ---------------------------------------------------------------------------
-- 4.4 LOCATION INTELLIGENCE DOMAIN (Sprint 3)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS member_location_current (
  member_id           TEXT PRIMARY KEY REFERENCES members(member_id),
  zone                VARCHAR(50),
  sub_location        VARCHAR(100),
  check_in_time       TIMESTAMPTZ,
  health_status       VARCHAR(20),
  activity_type       VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS staff_location_current (
  staff_id            VARCHAR(20) PRIMARY KEY,
  name                VARCHAR(100),
  zone                VARCHAR(50),
  status              VARCHAR(20),
  eta_minutes         INT,
  department          VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS service_recovery_alerts (
  alert_id            SERIAL PRIMARY KEY,
  member_id           VARCHAR(20),
  member_name         VARCHAR(100),
  severity            VARCHAR(20),
  zone                VARCHAR(50),
  detail              TEXT,
  recommended_action  TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  resolved_at         TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- 4.5 TEE SHEET OPERATIONS DOMAIN (Sprint 3)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS booking_confirmations (
  confirmation_id     VARCHAR(50) PRIMARY KEY,
  booking_id          VARCHAR(50),
  member_id           VARCHAR(20),
  member_name         VARCHAR(100),
  tee_time            VARCHAR(100),
  cancel_probability  NUMERIC(3,2),
  outreach_status     VARCHAR(20) DEFAULT 'pending',
  outreach_channel    VARCHAR(20),
  staff_notes         TEXT,
  contacted_at        TIMESTAMPTZ,
  responded_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS slot_reassignments (
  reassignment_id     VARCHAR(50) PRIMARY KEY,
  source_booking_id   VARCHAR(50),
  source_slot         VARCHAR(100),
  source_member_id    VARCHAR(20),
  source_member_name  VARCHAR(100),
  recommended_fill_member_id   VARCHAR(20),
  recommended_fill_member_name VARCHAR(100),
  status              VARCHAR(20) DEFAULT 'pending',
  staff_decision      TEXT,
  revenue_recovered   NUMERIC(8,2),
  health_before       INT,
  health_after        INT,
  decided_at          TIMESTAMPTZ,
  audit_trail         JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS waitlist_config (
  club_id             VARCHAR(20) PRIMARY KEY DEFAULT 'oakmont',
  hold_time_minutes   INT DEFAULT 30,
  auto_offer_threshold NUMERIC(3,2) DEFAULT 0.80,
  max_offers          INT DEFAULT 3,
  notification_limit  INT DEFAULT 2
);

-- ---------------------------------------------------------------------------
-- 4.6 INTEGRATIONS & BENCHMARKS DOMAIN (Sprint 4)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS connected_systems (
  system_id           VARCHAR(50) PRIMARY KEY,
  vendor_name         VARCHAR(100),
  category            VARCHAR(50),
  status              VARCHAR(20) DEFAULT 'available',
  last_sync           TIMESTAMPTZ,
  data_points_synced  INT DEFAULT 0,
  config              JSONB
);

CREATE TABLE IF NOT EXISTS industry_benchmarks (
  metric_key          VARCHAR(50) PRIMARY KEY,
  club_value          NUMERIC(12,2),
  industry_value      NUMERIC(12,2),
  unit                VARCHAR(10),
  label               VARCHAR(100),
  comparison_text     VARCHAR(50),
  direction           VARCHAR(20)
);

-- ---------------------------------------------------------------------------
-- 4.7 ACTIVITY LOG — Universal action tracking
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS activity_log (
  id              SERIAL PRIMARY KEY,
  action_type     VARCHAR(50) NOT NULL,
  action_subtype  VARCHAR(50),
  actor           VARCHAR(50) DEFAULT 'gm_default',
  member_id       VARCHAR(20),
  member_name     VARCHAR(100),
  agent_id        VARCHAR(50),
  reference_id    VARCHAR(100),
  reference_type  VARCHAR(50),
  description     TEXT,
  meta            JSONB DEFAULT '{}',
  status          VARCHAR(20) DEFAULT 'logged',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_member ON activity_log(member_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_reference ON activity_log(reference_id, reference_type);

-- =============================================================================
-- End of schema
-- =============================================================================
