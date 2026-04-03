# Swoop Golf — Database Schema Reference
## Vercel Postgres (Neon)

**Generated:** April 1, 2026
**Source:** `api/migrations/001-core-tables.js` + `api/seed-agents.js`
**Engine:** Vercel Postgres (Neon-backed PostgreSQL)

---

## Table of Contents

1. [Core Entities](#core-entities) — club, members, users, sessions
2. [Health & Intelligence](#health--intelligence) — health_scores, churn_predictions, correlations
3. [Operational Data](#operational-data) — rounds, transactions, complaints
4. [Actions & Interventions](#actions--interventions) — actions, interventions, playbook_runs, playbook_steps
5. [Agent System](#agent-system) — agent_definitions, agent_actions, agent_activity, agent_configs
6. [Notifications](#notifications) — notifications, notification_preferences
7. [Data Infrastructure](#data-infrastructure) — data_syncs, data_source_status, csv_imports
8. [Feature Management](#feature-management) — feature_dependency, feature_state_log, onboarding_progress
9. [Member Feedback](#member-feedback) — member_sentiment_ratings
10. [Indexes](#indexes)

---

## Core Entities

### `club`
Multi-tenant root table. One row per club/property.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `club_id` | TEXT | **PK** | Unique club identifier (e.g., `pine-valley-cc`) |
| `name` | TEXT | NOT NULL | Display name |
| `city` | TEXT | | City |
| `state` | TEXT | | State/province |
| `zip` | TEXT | | ZIP/postal code |
| `founded_year` | INTEGER | | Year club was founded |
| `member_count` | INTEGER | | Total active members |
| `course_count` | INTEGER | | Number of courses |
| `outlet_count` | INTEGER | | Number of F&B outlets |
| `logo_url` | TEXT | | Club logo URL |
| `brand_voice` | TEXT | DEFAULT `'professional'` | Communication tone setting |
| `timezone` | TEXT | DEFAULT `'America/New_York'` | Club timezone |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

### `members`
Core member entity. One row per member per club.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `member_id` | TEXT | **PK** | Unique member ID (e.g., `mbr_203`) |
| `club_id` | TEXT | NOT NULL | FK to club |
| `external_id` | TEXT | | ID from source CRM |
| `first_name` | TEXT | NOT NULL | |
| `last_name` | TEXT | NOT NULL | |
| `email` | TEXT | | |
| `phone` | TEXT | | |
| `membership_type` | TEXT | | e.g., Full Golf, Social, Junior |
| `annual_dues` | NUMERIC(10,2) | | Annual dues amount |
| `join_date` | DATE | | Date joined |
| `status` | TEXT | DEFAULT `'active'` | active, inactive, resigned |
| `household_id` | TEXT | | Links family members |
| `preferred_channel` | TEXT | DEFAULT `'email'` | email, phone, sms |
| `archetype` | TEXT | | Die-Hard Golfer, Social Butterfly, etc. |
| `health_score` | REAL | | Current health score (0-100) |
| `health_tier` | TEXT | | Healthy, Watch, At Risk, Critical |
| `last_health_update` | TIMESTAMPTZ | | When score was last computed |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `data_source` | TEXT | DEFAULT `'manual'` | manual, csv, api |

### `users`
Platform users (GMs, staff, admins).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | TEXT | **PK** (uuid) | |
| `club_id` | TEXT | NOT NULL | FK to club |
| `email` | TEXT | NOT NULL, UNIQUE | Login email |
| `name` | TEXT | NOT NULL | Display name |
| `role` | TEXT | DEFAULT `'viewer'` | admin, manager, viewer |
| `title` | TEXT | | Job title |
| `active` | BOOLEAN | DEFAULT TRUE | |
| `last_login` | TIMESTAMPTZ | | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

### `sessions`
Auth sessions (token-based).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `token` | TEXT | **PK** | Session token |
| `user_id` | TEXT | NOT NULL | FK to users |
| `club_id` | TEXT | NOT NULL | FK to club |
| `role` | TEXT | NOT NULL | Role at time of login |
| `expires_at` | TIMESTAMPTZ | NOT NULL | Token expiry |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

## Health & Intelligence

### `health_scores`
Time-series health score history per member.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | **PK** (uuid) | |
| `member_id` | TEXT | NOT NULL | FK to members |
| `club_id` | TEXT | NOT NULL | FK to club |
| `score` | REAL | NOT NULL | Composite score 0-100 |
| `tier` | TEXT | NOT NULL | Healthy, Watch, At Risk, Critical |
| `golf_score` | REAL | | Golf engagement dimension |
| `dining_score` | REAL | | Dining engagement dimension |
| `email_score` | REAL | | Email engagement dimension |
| `event_score` | REAL | | Event attendance dimension |
| `computed_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `archetype` | TEXT | | Archetype at time of scoring |
| `score_delta` | REAL | | Change from previous score |

### `churn_predictions`
Resignation probability predictions per member.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `prediction_id` | TEXT | **PK** (uuid) | |
| `club_id` | TEXT | NOT NULL | FK to club |
| `member_id` | TEXT | NOT NULL | FK to members |
| `prob_30d` | REAL | | 30-day resignation probability |
| `prob_60d` | REAL | | 60-day resignation probability |
| `prob_90d` | REAL | | 90-day resignation probability |
| `confidence` | REAL | | Model confidence |
| `risk_factors` | JSONB | DEFAULT `'[]'` | Array of {factor, weight, detail} |
| `model_version` | TEXT | DEFAULT `'rules_v1'` | |
| `computed_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Unique constraint:** `(club_id, member_id)`

### `correlations`
Cross-domain correlation insights (computed by `/api/compute-correlations`).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `correlation_id` | TEXT | **PK** (uuid) | |
| `club_id` | TEXT | NOT NULL | FK to club |
| `correlation_key` | TEXT | NOT NULL | Unique key per insight |
| `headline` | TEXT | NOT NULL | Human-readable insight |
| `detail` | TEXT | | Explanation text |
| `domains` | TEXT[] | | Array of domains involved |
| `impact` | TEXT | DEFAULT `'medium'` | low, medium, high |
| `metric_value` | TEXT | | e.g., "3.1x" |
| `metric_label` | TEXT | | e.g., "resignation risk" |
| `trend` | REAL[] | | Trend data points |
| `delta` | TEXT | | Change description |
| `delta_direction` | TEXT | | up, down, flat |
| `computed_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Unique constraint:** `(club_id, correlation_key)`

---

## Operational Data

### `rounds`
Tee sheet / round data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `round_id` | TEXT | **PK** (uuid) | |
| `club_id` | TEXT | NOT NULL | FK to club |
| `member_id` | TEXT | NOT NULL | FK to members |
| `booking_id` | TEXT | | External booking reference |
| `round_date` | DATE | NOT NULL | |
| `tee_time` | TIME | | Booked tee time |
| `course_id` | TEXT | | Which course |
| `duration_minutes` | INTEGER | | Actual round duration |
| `pace_rating` | TEXT | | fast, normal, slow |
| `players` | INTEGER | DEFAULT 1 | Players in group |
| `cancelled` | BOOLEAN | DEFAULT FALSE | |
| `no_show` | BOOLEAN | DEFAULT FALSE | |
| `data_source` | TEXT | DEFAULT `'tee_sheet'` | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

### `transactions`
POS / dining transaction data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `transaction_id` | TEXT | **PK** (uuid) | |
| `club_id` | TEXT | NOT NULL | FK to club |
| `member_id` | TEXT | | FK to members (nullable for guests) |
| `outlet_id` | TEXT | | Outlet identifier |
| `outlet_name` | TEXT | | e.g., Grill Room, Terrace |
| `transaction_date` | TIMESTAMPTZ | NOT NULL | |
| `total_amount` | NUMERIC(10,2) | | Transaction total |
| `item_count` | INTEGER | | Number of items |
| `category` | TEXT | | dining, pro_shop, beverage_cart |
| `is_post_round` | BOOLEAN | DEFAULT FALSE | Within 90min of round end |
| `data_source` | TEXT | DEFAULT `'pos'` | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

### `complaints`
Service complaints and feedback.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `complaint_id` | TEXT | **PK** (uuid) | |
| `club_id` | TEXT | NOT NULL | FK to club |
| `member_id` | TEXT | | FK to members |
| `category` | TEXT | | Service Speed, Food Quality, etc. |
| `description` | TEXT | | Complaint details |
| `status` | TEXT | DEFAULT `'open'` | open, acknowledged, in_progress, escalated, resolved |
| `priority` | TEXT | DEFAULT `'medium'` | low, medium, high, critical |
| `reported_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `resolved_at` | TIMESTAMPTZ | | |
| `resolved_by` | TEXT | | Staff who resolved |
| `resolution_notes` | TEXT | | |
| `sla_hours` | INTEGER | DEFAULT 24 | Resolution SLA |
| `data_source` | TEXT | DEFAULT `'manual'` | |

---

## Actions & Interventions

### `actions`
Recommended and tracked actions (from agents or manual).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `action_id` | TEXT | **PK** (uuid) | |
| `club_id` | TEXT | NOT NULL | FK to club |
| `member_id` | TEXT | | FK to members |
| `action_type` | TEXT | NOT NULL | outreach, schedule, flag, rebalance |
| `description` | TEXT | | Human-readable description |
| `status` | TEXT | DEFAULT `'pending'` | pending, approved, executed, dismissed |
| `priority` | TEXT | DEFAULT `'medium'` | low, medium, high |
| `assigned_to` | TEXT | | Staff member assigned |
| `source` | TEXT | DEFAULT `'system'` | Agent name or manual |
| `impact_metric` | TEXT | | e.g., "$18K/yr at risk" |
| `approved_at` | TIMESTAMPTZ | | |
| `approved_by` | TEXT | | |
| `executed_at` | TIMESTAMPTZ | | |
| `dismissed_at` | TIMESTAMPTZ | | |
| `dismiss_reason` | TEXT | | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

### `interventions`
Tracked intervention outcomes (member saves, re-engagements).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `intervention_id` | TEXT | **PK** (uuid) | |
| `club_id` | TEXT | NOT NULL | FK to club |
| `member_id` | TEXT | NOT NULL | FK to members |
| `action_id` | TEXT | | FK to actions |
| `intervention_type` | TEXT | NOT NULL | call, email, comp, event_invite |
| `description` | TEXT | | |
| `initiated_by` | TEXT | | Staff who executed |
| `initiated_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `health_score_before` | REAL | | Score when intervention started |
| `health_score_after` | REAL | | Score after outcome measured |
| `outcome` | TEXT | | retained, re-engaged, resigned, pending |
| `outcome_measured_at` | TIMESTAMPTZ | | |
| `dues_protected` | NUMERIC(10,2) | | Dollar value of protected dues |
| `revenue_recovered` | NUMERIC(10,2) | | Recovered ancillary revenue |
| `is_member_save` | BOOLEAN | DEFAULT FALSE | Flagged as a board-reportable save |

### `playbook_runs`
Automated playbook execution tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `run_id` | TEXT | **PK** (uuid) | |
| `club_id` | TEXT | NOT NULL | FK to club |
| `playbook_id` | TEXT | NOT NULL | e.g., service-save, new-member-90day |
| `playbook_name` | TEXT | NOT NULL | Human-readable name |
| `member_id` | TEXT | NOT NULL | FK to members |
| `triggered_by` | TEXT | | GM, system, agent |
| `trigger_reason` | TEXT | | Why this playbook was triggered |
| `status` | TEXT | DEFAULT `'active'` | active, completed, cancelled |
| `started_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `completed_at` | TIMESTAMPTZ | | |
| `health_score_at_start` | REAL | | |
| `health_score_at_end` | REAL | | |
| `outcome` | TEXT | | Success description |

### `playbook_steps`
Individual steps within a playbook run.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `step_id` | TEXT | **PK** (uuid) | |
| `run_id` | TEXT | NOT NULL | FK to playbook_runs |
| `club_id` | TEXT | NOT NULL | FK to club |
| `step_number` | INTEGER | NOT NULL | Ordered step position |
| `title` | TEXT | NOT NULL | Step name |
| `description` | TEXT | | Step detail |
| `assigned_to` | TEXT | | Staff member responsible |
| `due_date` | TIMESTAMPTZ | | When step should be completed |
| `status` | TEXT | DEFAULT `'pending'` | pending, completed, skipped |
| `completed_at` | TIMESTAMPTZ | | |
| `completed_by` | TEXT | | |
| `notes` | TEXT | | Execution notes |

---

## Agent System

### `agent_definitions`
AI agent registry.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `agent_id` | VARCHAR(50) | **PK** | e.g., member-pulse, demand-optimizer |
| `name` | VARCHAR(100) | | Display name |
| `description` | TEXT | | What the agent does |
| `status` | VARCHAR(20) | DEFAULT `'active'` | active, learning, idle |
| `model` | VARCHAR(50) | | Model version |
| `avatar` | VARCHAR(100) | | Avatar image path |
| `source_systems` | TEXT[] | | Array of data sources used |
| `last_run` | TIMESTAMPTZ | | Last execution time |

### `agent_actions`
Actions proposed by AI agents.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `action_id` | VARCHAR(50) | **PK** | e.g., agx_001 |
| `agent_id` | VARCHAR(50) | **FK** → agent_definitions | Which agent proposed this |
| `action_type` | VARCHAR(50) | | outreach, rebalance, alert, flag, draft, schedule |
| `priority` | VARCHAR(20) | | low, medium, high |
| `source` | VARCHAR(100) | | Data sources that informed this |
| `description` | TEXT | | Human-readable action description |
| `impact_metric` | VARCHAR(100) | | e.g., "$4,200 annual spend at risk" |
| `member_id` | VARCHAR(20) | | Related member (nullable) |
| `status` | VARCHAR(20) | DEFAULT `'pending'` | pending, approved, dismissed |
| `approval_action` | TEXT | | What was done on approval |
| `dismissal_reason` | TEXT | | Why it was dismissed |
| `timestamp` | TIMESTAMPTZ | DEFAULT NOW() | When proposed |
| `approved_at` | TIMESTAMPTZ | | |
| `dismissed_at` | TIMESTAMPTZ | | |

### `agent_activity`
Agent execution audit log.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `activity_id` | TEXT | **PK** (uuid) | |
| `club_id` | TEXT | NOT NULL | FK to club |
| `agent_id` | TEXT | NOT NULL | Which agent |
| `action_type` | TEXT | NOT NULL | Type of activity |
| `description` | TEXT | | What happened |
| `member_id` | TEXT | | Related member |
| `confidence` | REAL | | Agent confidence (0-1) |
| `auto_executed` | BOOLEAN | DEFAULT FALSE | Was this auto-approved |
| `reasoning` | TEXT | | Agent's reasoning chain |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

### `agent_configs`
Per-club agent configuration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `club_id` | TEXT | **PK** (composite) | FK to club |
| `agent_id` | TEXT | **PK** (composite) | FK to agent_definitions |
| `enabled` | BOOLEAN | DEFAULT TRUE | Is agent active for this club |
| `auto_approve_threshold` | REAL | DEFAULT 0.80 | Confidence threshold for auto-approval |
| `auto_approve_enabled` | BOOLEAN | DEFAULT FALSE | Allow autonomous actions |
| `last_run` | TIMESTAMPTZ | | |
| `total_proposals` | INTEGER | DEFAULT 0 | Lifetime proposal count |
| `total_auto_executed` | INTEGER | DEFAULT 0 | Lifetime auto-executions |
| `accuracy_score` | REAL | DEFAULT 0.75 | Measured accuracy |

---

## Notifications

### `notifications`
In-app and email notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `notification_id` | TEXT | **PK** (uuid) | |
| `club_id` | TEXT | NOT NULL | FK to club |
| `user_id` | TEXT | | FK to users |
| `channel` | TEXT | DEFAULT `'in_app'` | in_app, email, sms, slack |
| `type` | TEXT | NOT NULL | alert, digest, escalation |
| `title` | TEXT | NOT NULL | |
| `body` | TEXT | | |
| `priority` | TEXT | DEFAULT `'normal'` | low, normal, high, urgent |
| `related_member_id` | TEXT | | |
| `related_action_id` | TEXT | | |
| `read_at` | TIMESTAMPTZ | | |
| `sent_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

### `notification_preferences`
Per-user notification settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | TEXT | **PK** | FK to users |
| `club_id` | TEXT | NOT NULL | FK to club |
| `morning_digest` | BOOLEAN | DEFAULT TRUE | Receive morning digest |
| `digest_time` | TEXT | DEFAULT `'07:00'` | When to send digest |
| `digest_channel` | TEXT | DEFAULT `'email'` | |
| `high_priority_alerts` | BOOLEAN | DEFAULT TRUE | |
| `alert_channel` | TEXT | DEFAULT `'email'` | |
| `escalation_alerts` | BOOLEAN | DEFAULT TRUE | |
| `slack_webhook` | TEXT | | Slack integration URL |

---

## Data Infrastructure

### `data_syncs`
Data import/sync execution log.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `sync_id` | TEXT | **PK** (uuid) | |
| `club_id` | TEXT | NOT NULL | FK to club |
| `source_type` | TEXT | NOT NULL | crm, tee_sheet, pos, etc. |
| `status` | TEXT | DEFAULT `'running'` | running, completed, failed |
| `records_processed` | INTEGER | DEFAULT 0 | |
| `records_failed` | INTEGER | DEFAULT 0 | |
| `error_message` | TEXT | | |
| `started_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `completed_at` | TIMESTAMPTZ | | |

### `data_source_status`
Per-club data source connection status.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `status_id` | TEXT | **PK** (uuid) | |
| `club_id` | TEXT | NOT NULL | FK to club |
| `domain_code` | TEXT | NOT NULL | CRM, TEE_SHEET, POS, EMAIL, LABOR |
| `is_connected` | BOOLEAN | DEFAULT FALSE | |
| `source_vendor` | TEXT | | e.g., Jonas, ForeTees |
| `last_sync_at` | TIMESTAMPTZ | | |
| `row_count` | INTEGER | DEFAULT 0 | |
| `staleness_hours` | INTEGER | | Hours since last fresh data |
| `health_status` | TEXT | DEFAULT `'unknown'` | healthy, stale, disconnected |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Unique constraint:** `(club_id, domain_code)`

### `csv_imports`
CSV file upload tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `import_id` | TEXT | **PK** (uuid) | |
| `club_id` | TEXT | NOT NULL | FK to club |
| `uploaded_by` | TEXT | | User who uploaded |
| `file_name` | TEXT | | Original file name |
| `import_type` | TEXT | NOT NULL | members, rounds, transactions |
| `status` | TEXT | DEFAULT `'processing'` | processing, completed, failed |
| `total_rows` | INTEGER | | |
| `success_rows` | INTEGER | DEFAULT 0 | |
| `error_rows` | INTEGER | DEFAULT 0 | |
| `errors` | JSONB | DEFAULT `'[]'` | Array of error details |
| `started_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `completed_at` | TIMESTAMPTZ | | |

---

## Feature Management

### `feature_dependency`
Maps which features depend on which data sources.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `dependency_id` | TEXT | **PK** (uuid) | |
| `feature_type` | TEXT | NOT NULL | page, widget, metric |
| `feature_key` | TEXT | NOT NULL | e.g., health-overview, staffing-tab |
| `domain_code` | TEXT | NOT NULL | Required data domain |
| `dependency_type` | TEXT | NOT NULL | required, enhancing |
| `fallback_mode` | TEXT | | static, hidden, degraded |
| `user_message` | TEXT | | Message shown when degraded |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

### `feature_state_log`
Audit trail of feature state changes (enabled/disabled/degraded).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `log_id` | TEXT | **PK** (uuid) | |
| `club_id` | TEXT | NOT NULL | FK to club |
| `feature_type` | TEXT | NOT NULL | |
| `feature_key` | TEXT | NOT NULL | |
| `previous_state` | TEXT | | |
| `new_state` | TEXT | NOT NULL | enabled, disabled, degraded |
| `reason` | TEXT | | Why the state changed |
| `changed_at` | TIMESTAMPTZ | DEFAULT NOW() | |

### `onboarding_progress`
Club onboarding step tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `club_id` | TEXT | **PK** (composite) | FK to club |
| `step_key` | TEXT | **PK** (composite) | e.g., connect-crm, upload-members |
| `completed` | BOOLEAN | DEFAULT FALSE | |
| `completed_at` | TIMESTAMPTZ | | |
| `notes` | TEXT | | |

---

## Member Feedback

### `member_sentiment_ratings`
Post-visit and post-event satisfaction ratings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `rating_id` | TEXT | **PK** (uuid) | |
| `club_id` | TEXT | NOT NULL | FK to club |
| `member_id` | TEXT | NOT NULL | FK to members |
| `rating_type` | TEXT | NOT NULL | post_round, post_dining, post_event |
| `score` | REAL | NOT NULL | Rating value (1-5) |
| `comment` | TEXT | | Free-text feedback |
| `context_id` | TEXT | | Related round/transaction/event ID |
| `submitted_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `source` | TEXT | DEFAULT `'manual'` | manual, app, sms, email |
| `archived` | BOOLEAN | DEFAULT FALSE | |

---

## Indexes

| Index Name | Table | Columns | Purpose |
|-----------|-------|---------|---------|
| `idx_members_club` | members | `(club_id)` | Multi-tenant member lookup |
| `idx_members_health` | members | `(club_id, health_score)` | Health-sorted member queries |
| `idx_health_scores_member` | health_scores | `(member_id, computed_at DESC)` | Latest score per member |
| `idx_rounds_member` | rounds | `(member_id, round_date DESC)` | Recent rounds per member |
| `idx_transactions_member` | transactions | `(member_id, transaction_date DESC)` | Recent transactions per member |
| `idx_complaints_club` | complaints | `(club_id, status)` | Open complaints per club |
| `idx_actions_club` | actions | `(club_id, status)` | Pending actions per club |
| `idx_interventions_member` | interventions | `(member_id)` | Intervention history |
| `idx_data_syncs_club` | data_syncs | `(club_id, started_at DESC)` | Recent syncs |
| `idx_data_source_status_club` | data_source_status | `(club_id)` | Connection status lookup |
| `idx_feature_dependency_key` | feature_dependency | `(feature_type, feature_key)` | Feature dependency lookup |
| `idx_notifications_user` | notifications | `(club_id, user_id, read_at)` | Unread notifications |
| `idx_playbook_runs_club` | playbook_runs | `(club_id, status)` | Active playbook runs |
| `idx_playbook_steps_run` | playbook_steps | `(run_id, step_number)` | Ordered steps per run |
| `idx_agent_activity_club` | agent_activity | `(club_id, created_at DESC)` | Recent agent activity |
| `idx_churn_predictions_club` | churn_predictions | `(club_id, member_id)` | Prediction lookup |
| `idx_sentiment_member` | member_sentiment_ratings | `(member_id, submitted_at DESC)` | Recent ratings |
| `idx_correlations_club` | correlations | `(club_id, correlation_key)` | Correlation lookup |
| `idx_feature_state_log_club` | feature_state_log | `(club_id, changed_at DESC)` | Audit trail |

---

## Entity Relationships

```
club (1) ──── (N) members
club (1) ──── (N) users
club (1) ──── (N) rounds
club (1) ──── (N) transactions
club (1) ──── (N) complaints
club (1) ──── (N) actions
club (1) ──── (N) interventions
club (1) ──── (N) data_syncs
club (1) ──── (N) data_source_status
club (1) ──── (N) notifications
club (1) ──── (N) playbook_runs
club (1) ──── (N) agent_activity
club (1) ──── (N) agent_configs

members (1) ── (N) health_scores
members (1) ── (N) rounds
members (1) ── (N) transactions
members (1) ── (1) churn_predictions
members (1) ── (N) complaints
members (1) ── (N) actions
members (1) ── (N) interventions
members (1) ── (N) member_sentiment_ratings

agent_definitions (1) ── (N) agent_actions
playbook_runs (1) ──── (N) playbook_steps
actions (1) ────────── (0..1) interventions
users (1) ─────────── (1) notification_preferences
```

---

## Table Count Summary

| Category | Tables | Description |
|----------|--------|-------------|
| Core Entities | 4 | club, members, users, sessions |
| Health & Intelligence | 3 | health_scores, churn_predictions, correlations |
| Operational Data | 3 | rounds, transactions, complaints |
| Actions & Interventions | 4 | actions, interventions, playbook_runs, playbook_steps |
| Agent System | 4 | agent_definitions, agent_actions, agent_activity, agent_configs |
| Notifications | 2 | notifications, notification_preferences |
| Data Infrastructure | 3 | data_syncs, data_source_status, csv_imports |
| Feature Management | 3 | feature_dependency, feature_state_log, onboarding_progress |
| Member Feedback | 1 | member_sentiment_ratings |
| **Total** | **27 tables** | + 19 indexes |
