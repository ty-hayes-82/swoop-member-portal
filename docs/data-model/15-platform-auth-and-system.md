# 15. Platform, Auth & System Domain

*User authentication, notifications, playbooks, onboarding, feature management, and audit logging. All **Swoop Platform** tables with no Jonas source.*

**Tables:** `users`, `sessions`, `notifications`, `notification_preferences`, `playbook_runs`, `playbook_steps`, `onboarding_progress`, `feature_dependency`, `feature_state_log`, `pause_state`, `activity_log`

---

## `users`

Platform user accounts.

**Schema source:** migration | **PK:** `user_id` (UUID)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `user_id` | TEXT | NO | gen_random_uuid() | PK | N/A (system). |
| `club_id` | TEXT | NO | | FK to club | **Swoop Platform.** |
| `email` | TEXT | NO | | Email (UNIQUE) | **Swoop Platform.** |
| `name` | TEXT | NO | | Display name | **Swoop Platform.** |
| `role` | TEXT | NO | 'viewer' | viewer / editor / admin / owner | **Swoop Platform.** |
| `title` | TEXT | YES | | Job title | **Swoop Platform.** |
| `active` | BOOLEAN | YES | TRUE | Account active | **Swoop Platform.** |
| `password_hash` | TEXT | YES | | Hashed password | **Swoop Platform.** |
| `password_salt` | TEXT | YES | | Password salt | **Swoop Platform.** |
| `last_login` | TIMESTAMPTZ | YES | | Last login timestamp | N/A (system). |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Account created | N/A (system). |

---

## `sessions`

Auth session tokens.

**Schema source:** migration | **PK:** `token`

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `token` | TEXT | NO | | PK (session token) | **Swoop Platform.** |
| `user_id` | TEXT | NO | | FK to users | **Swoop Platform.** |
| `club_id` | TEXT | NO | | FK to club | **Swoop Platform.** |
| `role` | TEXT | NO | | User role at session creation | **Swoop Platform.** |
| `expires_at` | TIMESTAMPTZ | NO | | Session expiration | N/A (system). |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Session created | N/A (system). |

---

## `notifications`

In-app and email notifications.

**Schema source:** migration | **PK:** `notification_id` (UUID)
**Indexes:** idx_notifications_user(club_id, user_id, read_at)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `notification_id` | TEXT | NO | gen_random_uuid() | PK | N/A (system). |
| `club_id` | TEXT | NO | | FK to club | **Swoop Platform.** |
| `user_id` | TEXT | YES | | FK to users | **Swoop Platform.** |
| `channel` | TEXT | NO | 'in_app' | in_app / email / sms / slack | **Swoop Platform.** |
| `type` | TEXT | NO | | Notification type | **Swoop Platform.** |
| `title` | TEXT | NO | | Notification title | **Swoop Platform.** |
| `body` | TEXT | YES | | Notification body | **Swoop Platform.** |
| `priority` | TEXT | YES | 'normal' | Priority level | **Swoop Platform.** |
| `related_member_id` | TEXT | YES | | Related member | **Swoop Platform.** |
| `related_action_id` | TEXT | YES | | Related action | **Swoop Platform.** |
| `read_at` | TIMESTAMPTZ | YES | | When read | N/A (system). |
| `sent_at` | TIMESTAMPTZ | YES | NOW() | When sent | N/A (system). |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Created | N/A (system). |

---

## `notification_preferences`

Per-user notification delivery preferences.

**Schema source:** migration | **PK:** `user_id`

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `user_id` | TEXT | NO | | PK, FK to users | **Swoop Platform.** |
| `club_id` | TEXT | NO | | FK to club | **Swoop Platform.** |
| `morning_digest` | BOOLEAN | YES | TRUE | Receive morning digest | **Swoop Platform.** |
| `digest_time` | TEXT | YES | '07:00' | Preferred digest time | **Swoop Platform.** |
| `digest_channel` | TEXT | YES | 'email' | Digest delivery channel | **Swoop Platform.** |
| `high_priority_alerts` | BOOLEAN | YES | TRUE | Receive high-priority alerts | **Swoop Platform.** |
| `alert_channel` | TEXT | YES | 'email' | Alert delivery channel | **Swoop Platform.** |
| `escalation_alerts` | BOOLEAN | YES | TRUE | Receive escalation alerts | **Swoop Platform.** |
| `slack_webhook` | TEXT | YES | | Slack webhook URL | **Swoop Platform.** |

---

## `playbook_runs`

Playbook execution tracking.

**Schema source:** migration | **PK:** `run_id` (UUID)
**Indexes:** idx_playbook_runs_club(club_id, status)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `run_id` | TEXT | NO | gen_random_uuid() | PK | N/A (system). |
| `club_id` | TEXT | NO | | FK to club | **Swoop Platform.** |
| `playbook_id` | TEXT | NO | | Playbook template ID | **Swoop Platform.** |
| `playbook_name` | TEXT | NO | | Playbook display name | **Swoop Platform.** |
| `member_id` | TEXT | NO | | Target member | **Swoop Platform.** |
| `triggered_by` | TEXT | YES | | Who/what triggered | **Swoop Platform.** |
| `trigger_reason` | TEXT | YES | | Why triggered | **Swoop Platform.** |
| `status` | TEXT | YES | 'active' | active / completed / cancelled | **Swoop Platform.** |
| `started_at` | TIMESTAMPTZ | YES | NOW() | Run start | N/A (system). |
| `completed_at` | TIMESTAMPTZ | YES | | Run completion | N/A (system). |
| `health_score_at_start` | REAL | YES | | Health score when started | **Swoop Platform.** |
| `health_score_at_end` | REAL | YES | | Health score at completion | **Swoop Platform.** |
| `outcome` | TEXT | YES | | Measured outcome | **Swoop Platform.** |

---

## `playbook_steps`

Individual steps within playbook runs.

**Schema source:** migration | **PK:** `step_id` (UUID)
**Indexes:** idx_playbook_steps_run(run_id, step_number)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `step_id` | TEXT | NO | gen_random_uuid() | PK | N/A (system). |
| `run_id` | TEXT | NO | | FK to playbook_runs | **Swoop Platform.** |
| `club_id` | TEXT | NO | | FK to club | **Swoop Platform.** |
| `step_number` | INTEGER | NO | | Step order (1, 2, 3...) | **Swoop Platform.** |
| `title` | TEXT | NO | | Step title | **Swoop Platform.** |
| `description` | TEXT | YES | | Step instructions | **Swoop Platform.** |
| `assigned_to` | TEXT | YES | | Assigned staff | **Swoop Platform.** |
| `due_date` | TIMESTAMPTZ | YES | | Step due date | **Swoop Platform.** |
| `status` | TEXT | YES | 'pending' | pending / in_progress / completed / skipped | **Swoop Platform.** |
| `completed_at` | TIMESTAMPTZ | YES | | Completion timestamp | N/A (system). |
| `completed_by` | TEXT | YES | | Who completed | **Swoop Platform.** |
| `notes` | TEXT | YES | | Completion notes | **Swoop Platform.** |

---

## `onboarding_progress`

Club onboarding step completion tracking.

**Schema source:** migration | **PK:** (club_id, step_key)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `club_id` | TEXT | NO | | PK part 1 | **Swoop Platform.** |
| `step_key` | TEXT | NO | | PK part 2 (e.g. "connect_tee_sheet") | **Swoop Platform.** |
| `completed` | BOOLEAN | YES | FALSE | Step completed | **Swoop Platform.** |
| `completed_at` | TIMESTAMPTZ | YES | | Completion timestamp | N/A (system). |
| `notes` | TEXT | YES | | Completion notes | **Swoop Platform.** |

---

## `feature_dependency`

Feature-to-domain dependency mapping. Controls feature availability based on data connectivity.

**Schema source:** migration | **PK:** `dependency_id` (UUID)
**Indexes:** idx_feature_dependency_key(feature_type, feature_key)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `dependency_id` | TEXT | NO | gen_random_uuid() | PK | N/A (system). |
| `feature_type` | TEXT | NO | | Feature category (page, widget, chart) | **Swoop Platform.** |
| `feature_key` | TEXT | NO | | Feature identifier | **Swoop Platform.** |
| `domain_code` | TEXT | NO | | Required data domain | **Swoop Platform.** |
| `dependency_type` | TEXT | NO | | required / optional / enhancing | **Swoop Platform.** |
| `fallback_mode` | TEXT | YES | | What to show when data missing | **Swoop Platform.** |
| `user_message` | TEXT | YES | | Message shown to user | **Swoop Platform.** |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Created | N/A (system). |

---

## `feature_state_log`

Feature state audit trail. Tracks when features are enabled/disabled.

**Schema source:** migration | **PK:** `log_id` (UUID)
**Indexes:** idx_feature_state_log_club(club_id, changed_at DESC)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `log_id` | TEXT | NO | gen_random_uuid() | PK | N/A (system). |
| `club_id` | TEXT | NO | | FK to club | **Swoop Platform.** |
| `feature_type` | TEXT | NO | | Feature category | **Swoop Platform.** |
| `feature_key` | TEXT | NO | | Feature identifier | **Swoop Platform.** |
| `previous_state` | TEXT | YES | | State before change | **Swoop Platform.** |
| `new_state` | TEXT | NO | | State after change | **Swoop Platform.** |
| `reason` | TEXT | YES | | Why changed | **Swoop Platform.** |
| `changed_at` | TIMESTAMPTZ | YES | NOW() | Change timestamp | N/A (system). |

---

## `pause_state`

Pause/resume controls for agents and playbook runs.

**Schema source:** migration | **PK:** (club_id, target_type, target_id)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `club_id` | TEXT | NO | | PK part 1 | **Swoop Platform.** |
| `target_type` | TEXT | NO | | PK part 2 (agent / playbook) | **Swoop Platform.** |
| `target_id` | TEXT | NO | | PK part 3 (agent_id or run_id) | **Swoop Platform.** |
| `paused` | BOOLEAN | YES | FALSE | Currently paused | **Swoop Platform.** |
| `paused_at` | TIMESTAMPTZ | YES | | When paused | N/A (system). |
| `resume_at` | TIMESTAMPTZ | YES | | Scheduled resume time | **Swoop Platform.** |
| `paused_by` | TEXT | YES | | Who paused | **Swoop Platform.** |

---

## `activity_log`

Universal action audit trail. Records every user and system action.

**Schema source:** seed | **PK:** `id` (SERIAL)
**Indexes:** idx_activity_log_type, idx_activity_log_member, idx_activity_log_created(created_at DESC), idx_activity_log_reference(reference_id, reference_type)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `id` | SERIAL | NO | | PK | N/A (system). |
| `action_type` | VARCHAR(50) | NO | | approve / dismiss / call / note / task / campaign / playbook / escalate / flag / feedback / confirm / reassign / deploy / toggle_agent / config_agent / snooze | **Swoop Platform.** |
| `action_subtype` | VARCHAR(50) | YES | | Action subtype | **Swoop Platform.** |
| `actor` | VARCHAR(50) | YES | 'gm_default' | Who performed the action | **Swoop Platform.** |
| `member_id` | VARCHAR(20) | YES | | Affected member | **Swoop Platform.** |
| `member_name` | VARCHAR(100) | YES | | Member display name | **Swoop Platform.** |
| `agent_id` | VARCHAR(50) | YES | | Related agent | **Swoop Platform.** |
| `reference_id` | VARCHAR(100) | YES | | Related entity ID | **Swoop Platform.** |
| `reference_type` | VARCHAR(50) | YES | | agent_action / playbook / confirmation / reassignment / feedback | **Swoop Platform.** |
| `description` | TEXT | YES | | Human-readable description | **Swoop Platform.** |
| `meta` | JSONB | YES | '{}' | Arbitrary metadata | **Swoop Platform.** |
| `status` | VARCHAR(20) | YES | 'logged' | logged / pending_integration / sent / failed | **Swoop Platform.** |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Action timestamp | N/A (system). |
