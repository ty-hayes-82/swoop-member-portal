# 5. Events & Communications Domain

*Event definitions, registrations, email campaigns, and email engagement tracking. Powers event ROI analysis and member communication preferences.*

**Tables:** `event_definitions`, `event_registrations`, `email_campaigns`, `email_events`

---

## `event_definitions`

Club events (tournaments, socials, dining events).

**Schema source:** seed | **PK:** `event_id`
**Foreign keys:** club_id -> club(club_id)

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `event_id` | TEXT | NO | | PK (evt_001) | JAM: **Event Number**. **Extraction:** Event List. |
| `club_id` | TEXT | NO | | FK to club | Swoop-assigned. |
| `name` | TEXT | NO | | Event name | JAM: **Event Name** field. |
| `type` | TEXT | NO | | golf_tournament / dining / league / social | JAM: **Event Type** dropdown. |
| `event_date` | TEXT | NO | | Event date | JAM: **Start Date** / **End Date** fields. |
| `capacity` | INTEGER | NO | | Max capacity | JAM: Capacity/max registration setting. |
| `registration_fee` | REAL | NO | 0 | Fee per registrant | JAM: **Event Pricing Category**. |
| `description` | TEXT | YES | | Event description | JAM: Event description field. |

---

## `event_registrations`

Member registrations for events. Tracks attendance and no-shows.

**Schema source:** seed | **PK:** `registration_id`
**Indexes:** idx_registrations_event, idx_registrations_member

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `registration_id` | TEXT | NO | | PK (reg_0001) | JAM: Registration record ID. |
| `event_id` | TEXT | NO | | FK to event_definitions | JAM: Event Number. |
| `member_id` | TEXT | NO | | FK to members | JAM: **Client Code** / Member #. |
| `status` | TEXT | NO | 'registered' | registered / attended / no_show / cancelled | JAM: Registration status. |
| `guest_count` | INTEGER | NO | 0 | Guests brought | JAM: Guest count. |
| `fee_paid` | REAL | NO | 0 | Fee paid | JAM: Payment amount. |
| `registered_at` | TEXT | NO | | Registration timestamp | JAM: Registration date/time. |
| `checked_in_at` | TEXT | YES | | Check-in timestamp | JAM: Check-in event. |

---

## `email_campaigns`

Email campaign metadata for engagement tracking.

**Schema source:** seed | **PK:** `campaign_id`

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `campaign_id` | TEXT | NO | | PK (cam_001) | CHO: Campaign ID from ClubHouse Online. |
| `club_id` | TEXT | NO | | FK to club | Swoop-assigned. |
| `subject` | TEXT | NO | | Email subject line | CHO: Campaign subject line. |
| `type` | TEXT | NO | | newsletter / operational / event_promo / fb_promo | CHO: Campaign type/category. |
| `send_date` | TEXT | NO | | Send date | CHO: Campaign send date. |
| `recipient_count` | INTEGER | NO | 0 | Total recipients | CHO: Audience count. |
| `html_content_url` | TEXT | YES | | URL to HTML content | CHO: Campaign content URL. |

---

## `email_events`

Individual email engagement events (opens, clicks, bounces).

**Schema source:** seed | **PK:** `event_id`
**Indexes:** idx_email_events_campaign, idx_email_events_member, idx_email_events_type

| Column | Type | Null | Default | Description | Jonas Source |
|--------|------|------|---------|-------------|-------------|
| `event_id` | TEXT | NO | | PK (ee_00001) | CHO: Email event tracking record. |
| `campaign_id` | TEXT | NO | | FK to email_campaigns | CHO: Parent campaign. |
| `member_id` | TEXT | NO | | FK to members | CHO: Member email mapped to Member #. |
| `event_type` | TEXT | NO | | send / open / click / bounce / unsubscribe | CHO: Response tab tracking. |
| `occurred_at` | TEXT | NO | | Event timestamp | CHO: Engagement timestamp. |
| `link_clicked` | TEXT | YES | | URL clicked (if click event) | CHO: Clicked URL from Response tab. |
| `device_type` | TEXT | YES | | mobile / desktop / tablet | CHO: Device info if available. |
