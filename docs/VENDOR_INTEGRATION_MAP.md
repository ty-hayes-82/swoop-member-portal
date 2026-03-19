# Mapping Private Club Software Vendors to the Swoop Golf Data Model

**Internal Strategy Document** | March 2026

---

## What the Data Model Implies About Source Systems

The Swoop schema is a "club operating system" warehouse spanning 49 tables across 8 domains. It expects data from:

1. **Member/accounting system-of-record** (identity, dues, AR, households)
2. **Tee sheet/golf reservations** (bookings, pace, waitlists, demand)
3. **F&B point-of-sale** (checks, line items, payments, comps/voids)
4. **Events and communications** (event registration, email campaigns, engagement)
5. **Workforce scheduling/payroll** (staff, shifts, understaffing flags)
6. **On-course GPS/pace tech** (hole segments, bottlenecks, real-time location)
7. **Weather** (daily conditions, demand modifiers)
8. **Feedback/experience** (complaints, sentiment, service requests)

The model includes a normalized change stream (`canonical_events`) and cross-domain analytics (Layer 3 correlations, interventions, board snapshots), which assumes reliable extraction of granular, timestamped events from each vendor — reconciled to a single member identity.

**Key architectural implication:** Clubs run either integrated suites (simpler identity reconciliation, fewer connectors) or best-of-breed stacks (stronger point solutions, heavier integration work). Swoop must support both.

---

## Vendor Landscape Aligned to the Data Model

### Integrated Club Management Suites
Cover membership + accounting + POS + reservations in one platform:

| Vendor | Coverage | Alignment |
|--------|----------|-----------|
| **Clubessential** | Accounting, POS, membership, billing, GL, reporting, mobile POS | Club reference + members + POS + events |
| **Jonas Club Software** | Membership/AR, POS, event management, tee times ("The Sheet") | Members + POS + events + basic tee sheet |
| **Northstar Technologies** | Membership, golf, F&B/POS, accounting, reporting, Happometer | Full operational stack + feedback/sentiment |
| **clubsystems group** | Accounting, membership, F&B, catering, tee times, POS, payroll | Broadest single-vendor coverage |

### Golf-First Operations Suites
Tee sheet + pro shop + member billing:

| Vendor | Coverage | Alignment |
|--------|----------|-----------|
| **ForeTees** | Tee sheet, waitlist, events/clinics, dining reservations | Bookings + waitlist + lightweight events |
| **Club Prophet** | Tee sheet (Starter Hut), POS, member billing | Golf ops + retail POS + billing |
| **MembersFirst** | Online tee sheet, pace of play, marketing/email | Tee sheet + basic pace + comms |

### Best-of-Breed Point Systems

| Vendor | Domain | Tables Fed |
|--------|--------|-----------|
| **Toast** | F&B POS | pos_checks, pos_line_items, pos_payments |
| **Lightspeed POS** | F&B POS | pos_checks, pos_line_items, pos_payments |
| **Square POS** | F&B POS | pos_checks, pos_payments |
| **Golf Genius** | Tournament/events | event_definitions, event_registrations |
| **Mailchimp** | Email marketing | email_campaigns, email_events |
| **Constant Contact** | Email marketing | email_campaigns, email_events |
| **ADP** | Workforce/payroll | staff, staff_shifts |
| **7shifts** | Restaurant scheduling | staff_shifts |
| **Paylocity** | HR/payroll | staff, staff_shifts |
| **Tagmarshal** | GPS/pace management | pace_of_play, pace_hole_segments, location tables |
| **Club Benchmarking / GGA** | Industry benchmarks | industry_benchmarks, board_report_snapshots |
| **Noteefy** | Waitlist management | member_waitlist, waitlist_entries |
| **SevenRooms** | Dining reservations | pos_checks (reservation metadata) |
| **USGA GHIN** | Handicap identity | members.ghin_number |

---

## Domain-by-Domain Vendor Mapping

### 1. Club Reference & Member Identity

**Tables:** `club`, `membership_types`, `households`, `members`

| Datapoints | Source Type | Best Vendors |
|-----------|-----------|-------------|
| Member ID, name, email, phone, DOB | Club CRM / accounting | Jonas, Clubessential, Northstar, clubsystems |
| Membership tier, status, dues, balance | Club accounting/AR | Jonas (AR engine), Clubessential (billing) |
| Household grouping, family members | Club CRM | Jonas, Clubessential (may treat family as sub-accounts) |
| GHIN handicap number | Handicap service | USGA GHIN (distinct enrichment feed) |
| Archetype assignment | Swoop computed | Internal ML based on behavioral data |
| Communication opt-in | Club CRM / email | CRM or email system preferences |

**Integration notes:**
- Suites are authoritative for balances/AR
- "Household" can be tricky when vendors treat family members as sub-accounts
- Member ID consistency across systems requires crosswalk in `connected_systems`

### 2. Golf Operations & Reservations

**Tables:** `courses`, `bookings`, `booking_players`, `pace_of_play`, `pace_hole_segments`, `waitlist_entries`

| Datapoints | Source Type | Best Vendors |
|-----------|-----------|-------------|
| Course config (holes, par, intervals) | Tee sheet | ForeTees, Chronogolf, ForeUP, Teesnap |
| Tee time bookings, status, players | Tee sheet | ForeTees, Clubessential Reservations, Jonas |
| Guest flags, warm lead detection | Tee sheet + Swoop | Tee sheet provides roster; Swoop computes lead score |
| Check-in, round start/end, duration | Tee sheet / GPS | Tee sheet for check-in; Tagmarshal for precise timing |
| Pace: total minutes, slow round flag | Tee sheet / GPS | MembersFirst (coarse); Tagmarshal (granular) |
| Pace: hole segments, bottlenecks | GPS only | Tagmarshal (hole-by-hole timing) |
| Ranger interventions | On-course staff | Manual entry or Tagmarshal alerts |

**Integration notes:**
- Tee sheets often store only a "member number" — reliable JOINs require consistent member IDs or a crosswalk
- Hole-segment pace data is rarely native to accounting suites; requires GPS telemetry
- ForeTees has configurable waitlist (auto-assign vs notify, push/email) that maps to `member_waitlist`

### 3. Waitlist & Demand Intelligence

**Tables:** `member_waitlist`, `cancellation_risk`, `demand_heatmap`, `booking_confirmations`, `slot_reassignments`, `waitlist_config`

| Datapoints | Source Type | Best Vendors |
|-----------|-----------|-------------|
| Waitlist requests, slot preferences | Tee sheet waitlist | ForeTees wait lists, Noteefy |
| Demand heatmap (fill rates by day/time) | Tee sheet analytics | ForeTees, Chronogolf, ForeUP |
| Cancellation probability | Swoop ML | Internal prediction model |
| Confirmation outreach tracking | Swoop workflow | Above-vendor — Swoop owns this |
| Slot reassignment audit trail | Swoop workflow | Above-vendor — Swoop owns this |

**Key insight:** Vendors provide waitlists, but the combination of prediction + outreach workflow + revenue recovery audit trails is Swoop-owned IP. ForeTees' waitlist features represent the baseline we build on top of.

### 4. Food & Beverage POS

**Tables:** `dining_outlets`, `pos_checks`, `pos_line_items`, `pos_payments`

| Datapoints | Source Type | Best Vendors |
|-----------|-----------|-------------|
| Outlet definitions (name, type, covers) | POS config | Jonas POS, Clubessential POS, Toast |
| Check lifecycle (opened/closed timestamps) | POS | Toast, Jonas POS, Lightspeed, Square |
| Item detail (name, category, price, qty) | POS | Toast (richest), Jonas POS, Lightspeed |
| Comps, voids, discounts | POS | All POS systems (verify export granularity) |
| Payment splits, method, tip | POS | Toast, Square, Lightspeed |
| Post-round dining flag | Swoop computed | Linked via booking_id + timestamps |
| Understaffed day flag | Scheduling crossref | ADP shifts + demand signals |
| Event linkage | POS + events | Jonas (POS integrated with events) |

**Integration notes:**
- Outsized value in timestamps (first_item_fired_at, last_item_fulfilled_at) and void/comp detail
- Verify each POS can export these fields consistently before building connectors
- Toast's reporting primitives map most closely to our `pos_checks` / `pos_payments` grain
- Jonas POS is deeply integrated with club billing (member_charge payment method)

### 5. Events & Communications

**Tables:** `event_definitions`, `event_registrations`, `email_campaigns`, `email_events`

| Datapoints | Source Type | Best Vendors |
|-----------|-----------|-------------|
| Event definitions (name, type, date, capacity) | Events module | Jonas Event Management, Golf Genius |
| Registration, attendance, no-show | Events module | Jonas, Golf Genius, ForeTees |
| Fee paid, check-in timestamp | Events + POS | Jonas (event→billing integration) |
| Email campaigns (subject, send date, recipients) | Email ESP | Mailchimp, Constant Contact |
| Email events (open/click/bounce/unsub) | Email ESP | Mailchimp (per-message tracking), Constant Contact |
| Device type on email events | Email ESP | Mailchimp, Constant Contact |

**Integration notes:**
- Golf Genius handles tournament creation/registration, then imports player lists into tee sheet — a known integration pattern
- MembersFirst documents event billing flows sending to Jonas POS (cross-vendor event→billing)
- Email open/click metrics have known bot/noise issues; our model's event-level logging is the right posture

### 6. Service & Staffing

**Tables:** `feedback`, `service_requests`, `staff`, `staff_shifts`

| Datapoints | Source Type | Best Vendors |
|-----------|-----------|-------------|
| Complaints (category, sentiment, status, resolution) | Feedback platform | Northstar Happometer, Swoop App |
| Service requests (on-course, beverage cart) | Mobile app | Swoop App (we own this workflow) |
| Staff directory (department, role, rate) | Workforce/payroll | ADP, Paylocity, clubsystems payroll |
| Shift schedules, hours, understaffing | Scheduling | ADP, 7shifts |
| is_understaffed_day computation | Cross-domain | Swoop computed (shifts vs demand signals) |

**Integration notes:**
- Northstar describes real-time sentiment/feedback capture
- To compute `is_understaffed_day`, need both scheduled labor AND actual demand signals (covers/rounds/events) — reinforces cross-domain rollups
- Our `service_requests` taxonomy is a strong differentiation if we own the workflow

### 7. Operations & Metrics

**Tables:** `close_outs`, `canonical_events`, `member_engagement_daily`, `member_engagement_weekly`, `visit_sessions`, `weather_daily`

| Datapoints | Source Type | Best Vendors |
|-----------|-----------|-------------|
| Daily revenue closeouts | POS + tee sheet | Jonas/Clubessential (end-of-day reports) |
| Canonical event stream (CDC) | All systems | Swoop pipeline (normalized from all vendors) |
| Daily/weekly engagement scores | Swoop computed | Internal aggregation across all domains |
| Visit sessions (arrival→departure) | Swoop computed | Linked tee sheet + POS + GPS timestamps |
| Weather (condition, temp, precip) | Weather API | OpenWeatherMap, WeatherAPI, etc. |

**Key insight:** The `canonical_events` table is our core asset — the normalized CDC stream that reconciles events from all vendor systems into a single timeline per member.

### 8. Analytics & Intelligence (Swoop-Owned)

**Tables:** `board_report_snapshots`, `member_interventions`, `operational_interventions`, `experience_correlations`, `correlation_insights`, `event_roi_metrics`, `archetype_spend_gaps`, `industry_benchmarks`

These tables are **above-vendor** and will rarely be provided by club software:

| Table | What It Is | Why Swoop Owns It |
|-------|-----------|------------------|
| `experience_correlations` | Cross-domain retention correlations | No vendor connects tee sheet → POS → email → feedback |
| `correlation_insights` | Layer 3 insight cards | This is Swoop's core IP |
| `member_interventions` | Intervention history with health score deltas | Tracks Swoop-driven outcomes |
| `archetype_spend_gaps` | Untapped revenue by behavioral segment | Requires cross-domain behavioral data |
| `industry_benchmarks` | Club vs. industry comparisons | Club Benchmarking / GGA data + Swoop research |
| `board_report_snapshots` | Monthly ROI evidence | Aggregated from all Swoop intelligence |

---

## Table-Level Source System Map

| Domain | Tables | Primary Source | Secondary Source | Swoop Computed |
|--------|--------|---------------|-----------------|----------------|
| Club Reference | club, courses, dining_outlets, membership_types | Club CRM, Tee Sheet, POS | — | — |
| Members | households, members | Club CRM | — | archetype |
| Golf Ops | bookings, booking_players | Tee Sheet | — | is_warm_lead |
| Pace | pace_of_play, pace_hole_segments | GPS (Tagmarshal) | Tee Sheet (coarse) | is_slow_round, is_bottleneck |
| Waitlist | waitlist_entries, member_waitlist | Tee Sheet | Noteefy | retention_priority, dining_incentive |
| Demand | cancellation_risk, demand_heatmap | — | — | All fields (ML) |
| Tee Sheet Ops | booking_confirmations, slot_reassignments, waitlist_config | — | — | All fields (Swoop workflow) |
| F&B POS | pos_checks, pos_line_items, pos_payments | POS (Toast/Jonas/Lightspeed) | — | post_round_dining, is_understaffed |
| Events | event_definitions, event_registrations | Events system (Jonas/Golf Genius) | CRM | — |
| Email | email_campaigns, email_events | Email ESP (Mailchimp/CC) | — | — |
| Feedback | feedback, service_requests | Club CRM / Swoop App | Northstar Happometer | sentiment_score |
| Staffing | staff, staff_shifts | ADP / 7shifts / Paylocity | — | is_understaffed_day |
| Daily Ops | close_outs, weather_daily | POS + Tee Sheet, Weather API | — | demand modifiers |
| Engagement | member_engagement_daily, member_engagement_weekly | — | — | All fields (Swoop aggregation) |
| Sessions | visit_sessions | — | — | All fields (Swoop linkage) |
| CDC | canonical_events | All vendor systems | — | Normalization layer |
| Board/Intelligence | board_report_*, interventions, correlations, insights, ROI, benchmarks | — | Club Benchmarking | All fields (Swoop analytics) |
| Agents | agent_definitions, agent_actions | — | — | All fields (Swoop AI) |
| Activity | activity_log | — | — | All fields (Dashboard UI) |
| Location | member_location_current, staff_location_current, service_recovery_alerts | Swoop App GPS, Staff App | — | health_status, severity |
| Integrations | connected_systems, user_sessions | Config + Auth | — | — |

---

## Currently Connected Systems in Demo

Based on `src/data/integrations.js`, 14 systems are connected:

| System | Category | Tier | Feeds Tables |
|--------|----------|------|-------------|
| ForeTees | Tee Sheet | 1 | bookings, booking_players, waitlist_entries, courses |
| Chronogolf | Tee Sheet | 1 | bookings, booking_players |
| ForeUP | Tee Sheet | 2 | bookings, booking_players |
| Teesnap | Tee Sheet | 2 | bookings |
| Lightspeed POS | POS | 1 | pos_checks, pos_line_items, pos_payments |
| Toast | POS | 1 | pos_checks, pos_line_items, pos_payments |
| Clubessential POS | POS | 2 | pos_checks, pos_line_items |
| Square POS | POS | 2 | pos_checks, pos_payments |
| Stripe | POS/Payments | 3 | pos_payments |
| Northstar CRM | CRM | 1 | members, households, feedback |
| Jonas | CRM | 1 | members, membership_types, event_definitions |
| Salesforce | CRM | 2 | (lead/opportunity data, not core member) |
| QuickBooks | Accounting | 2 | close_outs (revenue reconciliation) |
| ADP | Staffing | 2 | staff, staff_shifts |
| ADP Payroll | Staffing | 2 | staff (payroll enrichment) |
| Noteefy | Waitlist | 2 | member_waitlist |
| GGA PerformanceAI | Analytics | 2 | industry_benchmarks |

---

## Coverage Gaps & Swoop Differentiators

### What vendors provide but Swoop enriches:
- **Tee sheet** → Swoop adds cancellation prediction, retention-priority waitlists, slot recovery workflows
- **POS** → Swoop adds post-round dining linkage, understaffing impact correlation, spend gap analysis
- **Email** → Swoop adds decay curve detection, churn prediction from engagement patterns
- **Feedback** → Swoop adds NLP sentiment scoring, staffing correlation, resolution SLA tracking

### What NO vendor provides (Swoop's defensible IP):
- **Cross-domain correlations** (experience_correlations, correlation_insights)
- **Member intervention tracking with health score deltas** (member_interventions)
- **Archetype-driven spend gap analysis** (archetype_spend_gaps)
- **Cancellation risk ML + recovery workflows** (cancellation_risk, booking_confirmations, slot_reassignments)
- **Universal action audit trail** (activity_log)
- **Normalized CDC event stream** (canonical_events) — the identity reconciliation layer

### What's missing from current vendor connections:
- **Email ESP** — Mailchimp/Constant Contact listed as "coming-soon", not connected
- **GPS/Pace** — Tagmarshal class not in current connected systems
- **Survey/NPS** — SurveyTab shows "Sample Data" placeholder
- **Catering/banquets** — Not modeled (future domain)
- **Pro shop inventory** — Not granularly modeled (Club Prophet covers retail POS)

---

## Integration Strategy: Suite vs. Best-of-Breed

### If club runs an integrated suite (Clubessential / Jonas / Northstar):
- **Ingestion:** Module coverage + API/export extractability
- **Identity:** Single member ID across domains (simpler)
- **Challenge:** Getting granular timestamps (first_item_fired, hole_segment_minutes) from suite APIs
- **Swoop value:** Cross-domain intelligence the suite's native reporting can't provide

### If club runs best-of-breed (ForeTees + Toast + Mailchimp + ADP):
- **Ingestion:** Multiple APIs, different auth, different data formats
- **Identity:** Cross-system member ID reconciliation (harder)
- **Challenge:** The `canonical_events` normalization is critical
- **Swoop value:** The hub that connects systems that don't talk to each other

---

## CSV Import as Onboarding Bridge

For clubs without mature APIs, the CSV Import hub supports 10 data categories:

| Template | Maps To Tables |
|----------|---------------|
| Members | members, households, membership_types |
| Tee Times | bookings, booking_players |
| F&B Transactions | pos_checks, pos_line_items |
| Reservations | pos_checks (dining reservations) |
| Staffing | staff, staff_shifts |
| Events | event_definitions, event_registrations |
| Complaints & Feedback | feedback |
| Email Engagement | email_campaigns, email_events |
| Golf Rounds | bookings, pace_of_play |
| Fitness & Pool Usage | visit_sessions (future) |

Auto-mapping uses fuzzy field matching (0.55 confidence threshold) with validation for dates, numbers, enums, and required fields.

---

## Strategic Alliance Targets

Ranked by alignment to highest-value tables:

1. **Tee sheet vendors** (ForeTees, Clubessential, Jonas, Chronogolf) — Upstream of most behaviorally predictive events. ForeTees' waitlist automation is the baseline we build prediction on top of.

2. **POS platforms with item-level exports** (Toast, Jonas POS, Lightspeed) — Power spend-based archetyping, event ROI, and visit session linking.

3. **Member experience/feedback** (Northstar Happometer, Clubessential mobile) — Core to the interventions narrative and service recovery workflows.

4. **On-course GPS** (Tagmarshal class) — Unlocks credible pace primitives and real-time oversight at segment level.

5. **Benchmark networks** (Club Benchmarking, GGA) — Grounds board-level KPIs relative to peers.

---

## Decision Framework

| Question | Suite Strategy | Best-of-Breed Strategy |
|----------|---------------|----------------------|
| Win by being... | Preferred add-on to 1-2 suite ecosystems | Analytics/intelligence layer above any stack |
| Optimize for... | Deep partnership + co-selling | Immaculate canonical_events normalization |
| Most predictive upstream? | Tee time behavior (suites have it) | Spend/visit dynamics (POS + tee sheet linked) |
| Defensible differentiation? | Cross-domain correlations suites can't do | Unified identity + cross-vendor intelligence |

**Recommendation:** Support both, but lead with best-of-breed onboarding — clubs running mixed stacks have the most pain and the most to gain from Swoop's cross-domain intelligence. Suite clubs are easier to onboard but get less incremental value.
