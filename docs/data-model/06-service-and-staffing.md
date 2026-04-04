# 6. Service & Staffing Domain

*Member feedback, service requests, staff records, and shift scheduling. The is_understaffed_day flag cross-references service quality with staffing levels to prove operational correlations.*

**Tables:** `feedback`, `service_requests`, `complaints`, `staff`, `staff_shifts`, `member_sentiment_ratings`

---

## `feedback`

Member feedback with sentiment scoring.

**Schema source:** seed | **PK:** `feedback_id`
**Indexes:** idx_feedback_member, idx_feedback_status, idx_feedback_understaffed

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `feedback_id` | TEXT | NO | | PK (fb_001) | JCM/MI: System-generated. |
| `member_id` | TEXT | YES | | FK to members | JCM: Member # from CRM Communications or MemberInsight survey. |
| `club_id` | TEXT | NO | | FK to club | Swoop-assigned. |
| `submitted_at` | TEXT | NO | | Submission timestamp | JCM: Date field on Communications record. MI: Survey submission date. |
| `category` | TEXT | NO | | Service Speed / Food Quality / Course Condition / Facility / Staff / Pace of Play / General | JCM/MI: Derived from Communication **Type** field or survey category. |
| `sentiment_score` | REAL | NO | | Score from -1.0 to +1.0 | MI: **Happometer** score. Or **Swoop Computed** via NLP. |
| `description` | TEXT | YES | | Free-text feedback | JCM: Communication **Subject** + notes. MI: Open-text response. |
| `status` | TEXT | NO | 'acknowledged' | acknowledged / in_progress / resolved / escalated | JCM: Communication **Cmpl.** checkbox + manual workflow. |
| `resolved_at` | TEXT | YES | | Resolution timestamp | JCM: Task completion date. |
| `is_understaffed_day` | INTEGER | NO | 0 | Boolean: understaffed correlation | **Swoop Computed.** Cross-ref from staff_shifts. |

---

## `service_requests`

On-course and facility service requests with response time tracking.

**Schema source:** seed | **PK:** `request_id`
**Indexes:** idx_service_req_member, idx_service_req_type

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `request_id` | TEXT | NO | | PK (sr_0001) | System-generated. |
| `member_id` | TEXT | YES | | FK to members | JCM: Member # from CRM. Or Swoop App member ID. |
| `booking_id` | TEXT | YES | | FK to bookings | TTM: Linked if course-related during a round. |
| `request_type` | TEXT | NO | | beverage_cart / pace_complaint / course_condition / equipment / facility_maintenance | JCM: Mapped from Communication Type. |
| `requested_at` | TEXT | NO | | Request timestamp | JCM: Communication date. Or Swoop App submission. |
| `response_time_min` | INTEGER | YES | | Response time in minutes | **Swoop Computed.** |
| `resolved_at` | TEXT | YES | | Resolution timestamp | JCM: Communication completion date. |
| `resolution_notes` | TEXT | YES | | Resolution notes | JCM: Communication notes field. |
| `is_understaffed_day` | INTEGER | NO | 0 | Boolean: understaffed flag | **Swoop Computed.** |

---

## `complaints`

Production complaint/issue tracking from CMS or manual entry.

**Schema source:** migration | **PK:** `complaint_id`
**Indexes:** idx_complaints_club(club_id, status)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `complaint_id` | TEXT | NO | gen_random_uuid() | PK | System UUID. |
| `club_id` | TEXT | NO | | FK to club | Swoop-assigned. |
| `member_id` | TEXT | YES | | FK to members | JCM: Member # from CRM/Communications. |
| `category` | TEXT | YES | | Complaint category | JCM: Communication Type lookup. |
| `description` | TEXT | YES | | Details | JCM: Communication Subject + notes. |
| `status` | TEXT | NO | 'open' | open / in_progress / resolved | Swoop workflow status. |
| `priority` | TEXT | NO | 'medium' | low / medium / high / critical | JCM: Communication **Priority** dropdown. |
| `reported_at` | TIMESTAMPTZ | YES | NOW() | Report timestamp | JCM: Communication Date field. |
| `resolved_at` | TIMESTAMPTZ | YES | | Resolution timestamp | JCM: Task completion date. |
| `resolved_by` | TEXT | YES | | Staff who resolved | JCM: Communication **Assigned** field. |
| `resolution_notes` | TEXT | YES | | Resolution details | JCM: Communication notes. |
| `sla_hours` | INTEGER | NO | 24 | SLA target hours | N/A (config). Swoop-configured. |
| `data_source` | TEXT | NO | 'manual' | Source system | N/A (system). |

---

## `staff`

Staff roster by department.

**Schema source:** seed | **PK:** `staff_id`

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `staff_id` | TEXT | NO | | PK (stf_001) | Payroll/scheduling system (ADP, 7shifts, Paylocity). |
| `club_id` | TEXT | NO | | FK to club | Swoop-assigned. |
| `first_name` | TEXT | NO | | First name | Payroll system. |
| `last_name` | TEXT | NO | | Last name | Payroll system. |
| `department` | TEXT | NO | | Golf Ops / F&B Service / F&B Kitchen / Grounds / Pro Shop / Admin | Payroll: Department code. |
| `role` | TEXT | NO | | Job title | Payroll: Job title/role. |
| `hire_date` | TEXT | NO | | Hire date | Payroll: Hire date. |
| `hourly_rate` | REAL | NO | | Pay rate | Payroll: Hourly rate. |
| `is_full_time` | INTEGER | NO | 1 | Boolean: full-time | Payroll: FT/PT classification. |

---

## `staff_shifts`

Daily shift records linked to outlets and understaffing flags.

**Schema source:** seed | **PK:** `shift_id`
**Indexes:** idx_shifts_staff, idx_shifts_date, idx_shifts_understaffed

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `shift_id` | TEXT | NO | | PK (shf_0001) | Scheduling system. |
| `staff_id` | TEXT | NO | | FK to staff | Scheduling: Employee ID. |
| `shift_date` | TEXT | NO | | Shift date | Scheduling: Shift date. |
| `outlet_id` | TEXT | YES | | FK to dining_outlets (NULL for non-F&B) | Scheduling: Mapped to Swoop outlet. |
| `start_time` | TEXT | NO | | Shift start | Scheduling: Start time. |
| `end_time` | TEXT | NO | | Shift end | Scheduling: End time. |
| `hours_worked` | REAL | NO | | Total hours | Scheduling: Actual hours. |
| `is_understaffed_day` | INTEGER | NO | 0 | Boolean: understaffed flag | **Swoop Computed.** Staff-to-cover ratio threshold. |
| `notes` | TEXT | YES | | Shift notes | Scheduling: Shift notes. |

---

## `member_sentiment_ratings`

Granular member sentiment ratings from surveys, interactions, or NLP.

**Schema source:** migration | **PK:** `rating_id`
**Indexes:** idx_sentiment_member(member_id, submitted_at DESC)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `rating_id` | TEXT | NO | gen_random_uuid() | PK | System UUID. |
| `club_id` | TEXT | NO | | FK to club | Swoop-assigned. |
| `member_id` | TEXT | NO | | FK to members | MI: Member # linked to survey. JCM: Member # on CRM. |
| `rating_type` | TEXT | NO | | Type of rating | MI: Survey type/question category. |
| `score` | REAL | NO | | Numeric score | MI: **Happometer** or NPS score. |
| `comment` | TEXT | YES | | Text comment | MI: Open-text response. JCM: Communication notes. |
| `context_id` | TEXT | YES | | Related entity ID | Links to event, booking, or check. |
| `submitted_at` | TIMESTAMPTZ | YES | NOW() | Submission timestamp | MI: Survey submission date. |
| `source` | TEXT | NO | 'manual' | Source: manual / nps / survey | Tracks origin. |
| `archived` | BOOLEAN | NO | FALSE | Soft-delete flag | N/A (system). |
