# Skill: Jonas Field Mappings

This skill maps Jonas Club Management System field names to plain-language
terms agents use when reasoning about member data.

## Member Record Fields

| Jonas Field | Plain Name | Notes |
|---|---|---|
| `member_id` | member ID | Internal identifier |
| `member_number` | member number | Club-facing ID |
| `member_type_code` | membership category | Golf, Social, Junior, etc. |
| `billing_class` | dues class | Determines billing rate |
| `annual_dues` | annual dues | Billed amount, not dues tier |
| `join_date` | join date | Date of full membership activation |
| `status` | member status | A=Active, I=Inactive, R=Resigned |
| `home_address` | home address | Use for proximity calculations only |

## Activity / Round Data

| Jonas Field | Plain Name | Notes |
|---|---|---|
| `rounds_played` | rounds played | Count per period |
| `tee_time_date` | tee time date | Date of the round |
| `course_played` | course | Which course (18-hole, 9-hole, etc.) |
| `cart_type` | cart preference | Walking, riding, push cart |
| `tee_set` | tee selection | Back, middle, forward |

## POS / Dining Data

| Jonas Field | Plain Name | Notes |
|---|---|---|
| `check_total` | check total | Pre-gratuity |
| `outlet_id` | outlet | Grill, Terrace, Bar, Locker Room |
| `server_id` | server | Maps to staff record |
| `covers` | covers | Number of dining guests |
| `visit_date` | dining date | Date of the visit |

## Household / Family

| Jonas Field | Plain Name | Notes |
|---|---|---|
| `household_id` | household | Groups members under one account |
| `relationship_code` | relationship | Spouse, Dependent, etc. |
| `sub_member` | household member | Secondary member on primary account |

## Complaints / Feedback

| Jonas Field | Plain Name | Notes |
|---|---|---|
| `feedback_id` | complaint ID | Primary key |
| `feedback_type` | complaint category | F&B, Golf, Facilities, Other |
| `priority` | priority | critical, high, medium, low |
| `status` | resolution status | open, in_progress, resolved |
| `resolution_date` | resolved date | When closed |

## Derived / Calculated Fields (not Jonas native)

These are computed by the Swoop analytics layer:

- `health_score` — composite 0-100 engagement metric (never share with members)
- `engagement_tier` — Thriving / Engaged / Watch / At-Risk / Inactive
- `archetype` — behavioral segment label (never share with members)
- `last_activity_date` — most recent touchpoint across all activity types
