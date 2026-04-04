# 11. AI Agents Domain

*Agent definitions, actions, activity logs, and auto-approval configs. All **Swoop Platform** tables.*

**Tables:** `agent_definitions`, `agent_actions`, `actions`, `agent_activity`, `agent_configs`

---

## `agent_definitions`

Agent profiles and metadata.

**Schema source:** seed | **PK:** `agent_id`

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `agent_id` | VARCHAR(50) | NO | | PK | **Swoop Platform.** |
| `name` | VARCHAR(100) | YES | | Agent display name | **Swoop Platform.** |
| `description` | TEXT | YES | | What the agent does | **Swoop Platform.** |
| `status` | VARCHAR(20) | YES | 'active' | active / paused / disabled | **Swoop Platform.** |
| `model` | VARCHAR(50) | YES | | ML model identifier | **Swoop Platform.** |
| `avatar` | VARCHAR(100) | YES | | Avatar/icon path | **Swoop Platform.** |
| `source_systems` | TEXT[] | YES | | Data sources used | **Swoop Platform.** |
| `last_run` | TIMESTAMPTZ | YES | | Last execution timestamp | N/A (system). |

---

## `agent_actions`

Seed-schema proposed/resolved actions from agents.

**Schema source:** seed | **PK:** `action_id`
**Indexes:** idx_agent_actions_status, idx_agent_actions_agent

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `action_id` | VARCHAR(50) | NO | | PK | **Swoop Platform.** |
| `agent_id` | VARCHAR(50) | YES | | FK to agent_definitions | **Swoop Platform.** |
| `action_type` | VARCHAR(50) | YES | | Type of action proposed | **Swoop Platform.** |
| `priority` | VARCHAR(20) | YES | | Priority level | **Swoop Platform.** |
| `source` | VARCHAR(100) | YES | | Signal source | **Swoop Platform.** |
| `description` | TEXT | YES | | Action description | **Swoop Platform.** |
| `impact_metric` | VARCHAR(100) | YES | | Expected impact metric | **Swoop Platform.** |
| `member_id` | VARCHAR(20) | YES | | Target member | **Swoop Platform.** |
| `status` | VARCHAR(20) | YES | 'pending' | pending / approved / dismissed | **Swoop Platform.** |
| `approval_action` | TEXT | YES | | Approval details | **Swoop Platform.** |
| `dismissal_reason` | TEXT | YES | | Why dismissed | **Swoop Platform.** |
| `timestamp` | TIMESTAMPTZ | YES | NOW() | Created timestamp | N/A (system). |
| `approved_at` | TIMESTAMPTZ | YES | | Approval timestamp | N/A (system). |
| `dismissed_at` | TIMESTAMPTZ | YES | | Dismissal timestamp | N/A (system). |

---

## `actions`

Production multi-purpose action queue with full lifecycle tracking.

**Schema source:** migration | **PK:** `action_id` (UUID)
**Indexes:** idx_actions_club(club_id, status)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `action_id` | TEXT | NO | gen_random_uuid() | PK | N/A (system). |
| `club_id` | TEXT | NO | | FK to club | **Swoop Platform.** |
| `member_id` | TEXT | YES | | Target member | **Swoop Platform.** |
| `action_type` | TEXT | NO | | Action type | **Swoop Platform.** |
| `description` | TEXT | YES | | Description | **Swoop Platform.** |
| `status` | TEXT | YES | 'pending' | pending / approved / dismissed / executed | **Swoop Platform.** |
| `priority` | TEXT | YES | 'medium' | Priority level | **Swoop Platform.** |
| `assigned_to` | TEXT | YES | | Assigned staff | **Swoop Platform.** |
| `source` | TEXT | YES | 'system' | Origin source | **Swoop Platform.** |
| `impact_metric` | TEXT | YES | | Expected impact | **Swoop Platform.** |
| `approved_at` | TIMESTAMPTZ | YES | | Approval timestamp | N/A (system). |
| `approved_by` | TEXT | YES | | Who approved | **Swoop Platform.** |
| `executed_at` | TIMESTAMPTZ | YES | | Execution timestamp | N/A (system). |
| `dismissed_at` | TIMESTAMPTZ | YES | | Dismissal timestamp | N/A (system). |
| `dismiss_reason` | TEXT | YES | | Dismissal reason | **Swoop Platform.** |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Created | N/A (system). |

---

## `agent_activity`

Granular agent audit trail for every action taken.

**Schema source:** migration | **PK:** `activity_id` (UUID)
**Indexes:** idx_agent_activity_club(club_id, created_at DESC)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `activity_id` | TEXT | NO | gen_random_uuid() | PK | N/A (system). |
| `club_id` | TEXT | NO | | FK to club | **Swoop Platform.** |
| `agent_id` | TEXT | NO | | FK to agent_definitions | **Swoop Platform.** |
| `action_type` | TEXT | NO | | Action type | **Swoop Platform.** |
| `description` | TEXT | YES | | What happened | **Swoop Platform.** |
| `member_id` | TEXT | YES | | Affected member | **Swoop Platform.** |
| `confidence` | REAL | YES | | Model confidence | **Swoop Platform.** |
| `auto_executed` | BOOLEAN | YES | FALSE | Was auto-executed | **Swoop Platform.** |
| `reasoning` | TEXT | YES | | Agent reasoning | **Swoop Platform.** |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Timestamp | N/A (system). |

---

## `agent_configs`

Per-club agent settings and auto-approval configuration.

**Schema source:** migration | **PK:** (club_id, agent_id)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `club_id` | TEXT | NO | | PK part 1 | **Swoop Platform.** |
| `agent_id` | TEXT | NO | | PK part 2 | **Swoop Platform.** |
| `enabled` | BOOLEAN | YES | TRUE | Agent enabled | **Swoop Platform.** |
| `auto_approve_threshold` | REAL | YES | 0.80 | Confidence threshold for auto-approval | **Swoop Platform.** |
| `auto_approve_enabled` | BOOLEAN | YES | FALSE | Auto-approve enabled | **Swoop Platform.** |
| `last_run` | TIMESTAMPTZ | YES | | Last execution | N/A (system). |
| `total_proposals` | INTEGER | YES | 0 | Total proposals made | **Swoop Platform.** |
| `total_auto_executed` | INTEGER | YES | 0 | Total auto-executed | **Swoop Platform.** |
| `accuracy_score` | REAL | YES | 0.75 | Measured accuracy | **Swoop Platform.** |
