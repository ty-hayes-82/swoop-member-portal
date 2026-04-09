# 2. Members Domain

*Core member records, household groupings, and billing data. The members table has two schema variants: seed (simulation) and production (migration). Both coexist; production columns are additive via migration 002.*

**Tables:** `households`, `members`, `member_invoices`

---

## `households`

Groups related members by household for retention analysis.

**Schema source:** seed | **PK:** `household_id`

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `household_id` | TEXT | NO | | PK | JCM: Derived from Dependent screen linkages. |
| `primary_member_id` | TEXT | YES | | Head of household member_id | JCM: Primary Member # that dependents are linked to. |
| `member_count` | INTEGER | NO | 1 | Members in household | JCM: Count of records in Dependent screen. |
| `address` | TEXT | YES | | Street address | JCM: Home Address fields from Setup/Edit Members. |
| `is_multi_member` | INTEGER | NO | 0 | Boolean: >1 member | **Swoop Computed.** Derived from member_count > 1. |

---

## `members`

Core member entity. Seed schema has 300 simulated members. Production schema adds health_score, health_tier, preferred_channel, external_id, and data_source columns via migrations.

**Schema source:** seed + migration | **PK:** `member_id`
**Foreign keys:** membership_type -> membership_types(type_code), household_id -> households(household_id), club_id -> club(club_id)
**Indexes:** idx_members_archetype, idx_members_status, idx_members_household, idx_members_club, idx_members_health(club_id, health_score)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `member_id` | TEXT | NO | | PK (e.g. mbr_001) | JCM: **Member #** (primary identifier). **Extraction:** Setup/Edit Members, F9 Lister. |
| `member_number` | INTEGER | NO | | Display member number | JCM: Same as Member # (numeric representation). |
| `club_id` | TEXT | YES | | FK to club (production) | Swoop-assigned. Maps to Jonas system context. |
| `external_id` | TEXT | YES | | CMS external ID (production) | JCM: **Member #** stored as external reference. |
| `first_name` | TEXT | NO | | First name | JCM: **Given Name** field (21 chars). **Extraction:** F9 Lister. |
| `last_name` | TEXT | NO | | Last name | JCM: **Surname** field (31 chars). |
| `email` | TEXT | YES | | Email address | JCM: **Email** field. Also in CHO member database. |
| `phone` | TEXT | YES | | Phone number | JCM: **Phone #** field (16 chars). |
| `date_of_birth` | TEXT | YES | | Date of birth | JCM: **Birthday** field on Setup/Edit Members. |
| `gender` | TEXT | YES | | Gender | JCM: **Sex** dropdown. |
| `membership_type` | TEXT | NO | | FK to membership_types | JCM: **Membership Type** code from Member Status Rules. |
| `membership_status` | TEXT | NO | 'active' | active / loa / resigned | JCM: **Status** field. Governed by Member Status Rules engine. |
| `join_date` | TEXT/DATE | NO | | Date joined the club | JCM: **Date Joined** field. **CSV alias:** Jonas 'Join Dt' -> join_date. |
| `resigned_on` | TEXT | YES | | Resignation date if applicable | JCM: **Date Resigned** field. |
| `household_id` | TEXT | YES | | FK to households | JCM: Derived from **Dependent** screen linkage. |
| `archetype` | TEXT | NO | | Behavioral archetype classification | **Swoop Computed.** Classified by Swoop ML. |
| `annual_dues` | REAL/NUMERIC | NO | | Annual dues amount | JCM: **Fee Billing Info**. **CSV alias:** Jonas 'Acct Balance' -> annual_dues. |
| `account_balance` | REAL | NO | 0 | Current account balance | JCM: **Current Balance** field. |
| `ghin_number` | TEXT | YES | | GHIN handicap number | JCM: **Handicap Profile** data. |
| `communication_opt_in` | INTEGER | NO | 1 | Boolean: email opt-in | JCM: **Mailings** screen preferences. |
| `health_score` | REAL | YES | | Computed health score (production) | **Swoop Computed.** From golf + dining + email + event sub-scores. |
| `health_tier` | TEXT | YES | | Tier from health score (production) | **Swoop Computed.** Derived from health_score thresholds. |
| `last_health_update` | TIMESTAMPTZ | YES | | Last health recalculation | **Swoop Computed.** System timestamp. |
| `preferred_channel` | TEXT | YES | 'email' | Preferred outreach channel | JCM: Inferred from **Communications** preferences. |
| `data_source` | TEXT | YES | 'manual' | Data origin: manual / csv / api | N/A (system). Swoop import provenance. |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Row creation timestamp | N/A (system). |
| `updated_at` | TIMESTAMPTZ | YES | NOW() | Last updated | N/A (system). |

### Member Archetypes

| Archetype | Description |
|-----------|-------------|
| Die-Hard Golfer | High golf frequency, moderate dining |
| Social Butterfly | High events + dining, low golf |
| Balanced Active | Active across all dimensions |
| Weekend Warrior | Weekend-only golfer |
| New Member | Joined within last 12 months |
| Snowbird | Seasonal member (winter or summer) |
| Declining | Decreasing engagement across all dimensions |
| Ghost | Very low engagement, at-risk |

---

## `member_invoices`

Quarterly dues invoices and F&B minimum shortfall charges per member.

**Schema source:** api/migrations/014-member-invoices-table.js | **PK:** `invoice_id`
**Indexes:** idx_invoices_member(member_id), idx_invoices_status(status)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `invoice_id` | TEXT | NO | | PK (e.g. INV-mbr_001-DUES-2025-Q1) | JCM: A/R Billing > Invoice/Statement number. |
| `member_id` | TEXT | NO | | FK to members | JCM: Member # on invoice. |
| `invoice_date` | TEXT | NO | | Invoice issue date | JCM: Statement date from A/R Billing cycle. |
| `due_date` | TEXT | NO | | Payment due date | JCM: Due date from billing terms. |
| `amount` | REAL | NO | | Invoice amount | JCM: Net Amount from Aged Receivables detail. |
| `type` | TEXT | NO | 'dues' | dues / fb_minimum / assessment | JCM: Derived from billing code type. |
| `description` | TEXT | NO | | Human-readable line description | JCM: Transaction description. |
| `status` | TEXT | NO | 'paid' | paid / current / past_due_30/60/90 | JCM: Derived from Aged Receivables aging buckets. |
| `paid_date` | TEXT | YES | | Date payment received | JCM: **Last Payment** date field. |
| `paid_amount` | REAL | NO | 0 | Amount actually paid | JCM: Payment amount from A/R history. |
| `days_past_due` | INTEGER | NO | 0 | Days past due date | **Swoop Computed.** |
| `late_fee` | REAL | NO | 0 | Calculated late fee | JCM: Interest/late fee from A/R billing. |
| `collection_status` | TEXT | NO | 'none' | none / reminder_sent / second_notice / final_notice | **Swoop Computed.** Escalation workflow. |
