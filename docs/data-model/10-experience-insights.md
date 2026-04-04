# 10. Experience Insights Domain

*Cross-domain correlation analysis. All tables are **Swoop Computed** from the analytics engine.*

**Tables:** `experience_correlations`, `correlation_insights`, `correlations`, `event_roi_metrics`, `archetype_spend_gaps`

---

## `experience_correlations`

Touchpoint-to-retention correlations by segment and archetype.

**Schema source:** seed | **PK:** `correlation_id` (SERIAL)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `correlation_id` | SERIAL | NO | | PK | N/A (system). |
| `touchpoint` | VARCHAR(100) | YES | | Touchpoint name | **Swoop Computed.** |
| `retention_impact` | NUMERIC(4,2) | YES | | Impact on retention (-1.0 to 1.0) | **Swoop Computed.** |
| `category` | VARCHAR(50) | YES | | Category grouping | **Swoop Computed.** |
| `description` | TEXT | YES | | Human-readable description | **Swoop Computed.** |
| `segment` | VARCHAR(20) | YES | 'all' | Member segment filter | **Swoop Computed.** |
| `archetype` | VARCHAR(50) | YES | | Archetype filter | **Swoop Computed.** |
| `trend_data` | JSONB | YES | | Historical trend data | **Swoop Computed.** |
| `delta` | VARCHAR(20) | YES | | Change indicator | **Swoop Computed.** |
| `delta_direction` | VARCHAR(10) | YES | | up / down / flat | **Swoop Computed.** |

---

## `correlation_insights`

Human-readable insights derived from correlations.

**Schema source:** seed | **PK:** `insight_id`

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `insight_id` | VARCHAR(50) | NO | | PK | **Swoop Computed.** |
| `headline` | TEXT | YES | | Insight headline | **Swoop Computed.** |
| `detail` | TEXT | YES | | Detailed explanation | **Swoop Computed.** |
| `domains` | TEXT[] | YES | | Affected domains | **Swoop Computed.** |
| `impact` | VARCHAR(20) | YES | | Impact level | **Swoop Computed.** |
| `metric_value` | VARCHAR(20) | YES | | Key metric value | **Swoop Computed.** |
| `metric_label` | VARCHAR(100) | YES | | Metric label | **Swoop Computed.** |
| `trend_data` | JSONB | YES | | Trend data | **Swoop Computed.** |
| `delta` | VARCHAR(20) | YES | | Change indicator | **Swoop Computed.** |
| `delta_direction` | VARCHAR(10) | YES | | Direction | **Swoop Computed.** |
| `archetype` | VARCHAR(50) | YES | | Archetype filter | **Swoop Computed.** |

---

## `correlations`

Production per-club correlations. Replaces seed experience_correlations for live clubs.

**Schema source:** migration | **PK:** `correlation_id` (UUID)
**Unique:** (club_id, correlation_key)
**Indexes:** idx_correlations_club

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `correlation_id` | TEXT | NO | gen_random_uuid() | PK | N/A (system). |
| `club_id` | TEXT | NO | | FK to club | **Swoop Computed.** |
| `correlation_key` | TEXT | NO | | Unique key per club | **Swoop Computed.** |
| `headline` | TEXT | NO | | Insight headline | **Swoop Computed.** |
| `detail` | TEXT | YES | | Detailed explanation | **Swoop Computed.** |
| `domains` | TEXT[] | YES | | Affected domains | **Swoop Computed.** |
| `impact` | TEXT | YES | 'medium' | Impact level | **Swoop Computed.** |
| `metric_value` | TEXT | YES | | Key metric value | **Swoop Computed.** |
| `metric_label` | TEXT | YES | | Metric label | **Swoop Computed.** |
| `trend` | REAL[] | YES | | Trend array | **Swoop Computed.** |
| `delta` | TEXT | YES | | Change indicator | **Swoop Computed.** |
| `delta_direction` | TEXT | YES | | Direction | **Swoop Computed.** |
| `computed_at` | TIMESTAMPTZ | YES | NOW() | Computation timestamp | N/A (system). |

---

## `event_roi_metrics`

Aggregated ROI by event type.

**Schema source:** seed | **PK:** `event_type`

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `event_type` | VARCHAR(100) | NO | | PK (golf_tournament, dining, etc.) | **Swoop Computed.** |
| `attendance_avg` | INT | YES | | Average attendance | **Swoop Computed.** |
| `retention_rate` | NUMERIC(5,2) | YES | | Retention rate for attendees | **Swoop Computed.** |
| `avg_spend` | NUMERIC(8,2) | YES | | Average spend per attendee | **Swoop Computed.** |
| `roi_score` | NUMERIC(4,1) | YES | | Computed ROI score | **Swoop Computed.** |
| `frequency` | VARCHAR(50) | YES | | Event frequency (weekly, monthly, etc.) | **Swoop Computed.** |

---

## `archetype_spend_gaps`

Revenue gap analysis by member archetype.

**Schema source:** seed | **PK:** `archetype`

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `archetype` | VARCHAR(50) | NO | | PK | **Swoop Computed.** |
| `member_count` | INT | YES | | Members in archetype | **Swoop Computed.** |
| `current_dining` | INT | YES | | Current dining visits | **Swoop Computed.** |
| `potential_dining` | INT | YES | | Potential dining visits | **Swoop Computed.** |
| `current_events` | INT | YES | | Current event attendance | **Swoop Computed.** |
| `potential_events` | INT | YES | | Potential event attendance | **Swoop Computed.** |
| `avg_annual_spend` | NUMERIC(10,2) | YES | | Average annual spend | **Swoop Computed.** |
| `untapped_dining` | NUMERIC(10,2) | YES | | Untapped dining revenue | **Swoop Computed.** |
| `untapped_events` | NUMERIC(10,2) | YES | | Untapped events revenue | **Swoop Computed.** |
| `total_untapped` | NUMERIC(10,2) | YES | | Total untapped revenue | **Swoop Computed.** |
| `campaign` | TEXT | YES | | Recommended campaign | **Swoop Computed.** |
