# Finalization Report — 2026-04-13T16:53:05.186Z

Total runtime: 6499s

## ❌ FAILED

| Step | Result |
|------|--------|
| Permutation hardening (10×22) | ❌ exit 1 |
| Edge-case matrix               | ✅ pass |

---

## Permutation Punch List

# Permutation Hardening — Consolidated Punch List

Generated: 2026-04-13T18:41:13.705Z
Permutations run: 10
Total distinct failure signatures: 16
Total failure events: 95

## Failures ranked by blast radius

| # | Blast | Type | Target | Sample message | First step |
|---|---|---|---|---|---|
| 1 | 5/10 | insight-under-unlock | members | ["members"] | tee-first/step-14-event_registrations |
| 2 | 5/10 | deep-insight-error | payments | HTTP 500 | tee-first/step-14-event_registrations |
| 3 | 5/10 | deep-insight-error | ar-aging | HTTP 500 | tee-first/step-14-event_registrations |
| 4 | 5/10 | deep-insight-error | courses | HTTP 500 | tee-first/step-14-event_registrations |
| 5 | 5/10 | deep-insight-error | tier-revenue | HTTP 500 | tee-first/step-14-event_registrations |
| 6 | 5/10 | deep-insight-error | households | HTTP 500 | tee-first/step-14-event_registrations |
| 7 | 5/10 | deep-insight-error | service-tickets | HTTP 500 | tee-first/step-14-event_registrations |
| 8 | 5/10 | deep-insight-under-unlock | member-engagement | ["members"] | tee-first/step-14-event_registrations |
| 9 | 3/10 | insight-under-unlock | dining_outlets | ["dining_outlets"] | tee-first/step-14-event_registrations |
| 10 | 2/10 | insight-under-unlock | transactions | ["transactions"] | tee-first/step-14-event_registrations |
| 11 | 2/10 | insight-under-unlock | pos_payments | ["pos_payments","pos_checks"] | tee-first/step-14-event_registrations |
| 12 | 2/10 | insight-under-unlock | staff_shifts | ["staff_shifts"] | tee-first/step-14-event_registrations |
| 13 | 2/10 | insight-under-unlock | complaints | ["complaints"] | tee-first/step-14-event_registrations |
| 14 | 1/10 | insight-under-unlock | service_requests | ["service_requests"] | random-1337/step-12-membership_types |
| 15 | 1/10 | insight-under-unlock | club_profile | ["club"] | random-7/step-4-pos_checks |
| 16 | 1/10 | insight-under-unlock | pos_line_items | ["pos_line_items","pos_checks"] | tee-first/step-14-event_registrations |

## email-first — 0 failures

Order: members → email_campaigns → email_events → tee_times → transactions → complaints → booking_players → courses → pos_checks → line_items → payments → daily_close → sales_areas → shifts → staff → events → event_registrations → invoices → households → membership_types → service_requests → club_profile

## labor-first — 0 failures

Order: members → shifts → staff → tee_times → transactions → complaints → booking_players → courses → pos_checks → line_items → payments → daily_close → sales_areas → events → event_registrations → email_campaigns → email_events → invoices → households → membership_types → service_requests → club_profile

## reverse — 0 failures

Order: members → club_profile → service_requests → membership_types → households → invoices → email_events → email_campaigns → event_registrations → events → staff → shifts → sales_areas → daily_close → payments → line_items → pos_checks → courses → booking_players → complaints → transactions → tee_times

## pos-first — 0 failures

Order: members → transactions → pos_checks → line_items → payments → daily_close → sales_areas → tee_times → complaints → booking_players → courses → shifts → staff → events → event_registrations → email_campaigns → email_events → invoices → households → membership_types → service_requests → club_profile

## tee-first — 28 failures

Order: members → tee_times → booking_players → courses → transactions → complaints → pos_checks → line_items → payments → daily_close → sales_areas → shifts → staff → events → event_registrations → email_campaigns → email_events → invoices → households → membership_types → service_requests → club_profile

### step 14 (event_registrations) — 14 failures
- **insight-under-unlock** members: ["members"]
- **insight-under-unlock** transactions: ["transactions"]
- **insight-under-unlock** pos_line_items: ["pos_line_items","pos_checks"]
- **insight-under-unlock** pos_payments: ["pos_payments","pos_checks"]
- **insight-under-unlock** dining_outlets: ["dining_outlets"]
- **insight-under-unlock** staff_shifts: ["staff_shifts"]
- **insight-under-unlock** complaints: ["complaints"]
- **deep-insight-error** payments: HTTP 500
- **deep-insight-error** ar-aging: HTTP 500
- **deep-insight-error** courses: HTTP 500
- **deep-insight-error** tier-revenue: HTTP 500
- **deep-insight-error** households: HTTP 500
- **deep-insight-error** service-tickets: HTTP 500
- **deep-insight-under-unlock** member-engagement: ["members"]

### step 15 (email_campaigns) — 14 failures
- **insight-under-unlock** members: ["members"]
- **insight-under-unlock** transactions: ["transactions"]
- **insight-under-unlock** pos_line_items: ["pos_line_items","pos_checks"]
- **insight-under-unlock** pos_payments: ["pos_payments","pos_checks"]
- **insight-under-unlock** dining_outlets: ["dining_outlets"]
- **insight-under-unlock** staff_shifts: ["staff_shifts"]
- **insight-under-unlock** complaints: ["complaints"]
- **deep-insight-error** payments: HTTP 500
- **deep-insight-error** ar-aging: HTTP 500
- **deep-insight-error** courses: HTTP 500
- **deep-insight-error** tier-revenue: HTTP 500
- **deep-insight-error** households: HTTP 500
- **deep-insight-error** service-tickets: HTTP 500
- **deep-insight-under-unlock** member-engagement: ["members"]

## random-42 — 18 failures

Order: members → sales_areas → email_campaigns → tee_times → payments → households → booking_players → transactions → shifts → line_items → event_registrations → membership_types → pos_checks → staff → email_events → courses → service_requests → complaints → club_profile → invoices → daily_close → events

### step 6 (booking_players) — 9 failures
- **insight-under-unlock** members: ["members"]
- **insight-under-unlock** dining_outlets: ["dining_outlets"]
- **deep-insight-error** payments: HTTP 500
- **deep-insight-error** ar-aging: HTTP 500
- **deep-insight-error** courses: HTTP 500
- **deep-insight-error** tier-revenue: HTTP 500
- **deep-insight-error** households: HTTP 500
- **deep-insight-error** service-tickets: HTTP 500
- **deep-insight-under-unlock** member-engagement: ["members"]

### step 7 (transactions) — 9 failures
- **insight-under-unlock** members: ["members"]
- **insight-under-unlock** dining_outlets: ["dining_outlets"]
- **deep-insight-error** payments: HTTP 500
- **deep-insight-error** ar-aging: HTTP 500
- **deep-insight-error** courses: HTTP 500
- **deep-insight-error** tier-revenue: HTTP 500
- **deep-insight-error** households: HTTP 500
- **deep-insight-error** service-tickets: HTTP 500
- **deep-insight-under-unlock** member-engagement: ["members"]

## random-7 — 18 failures

Order: members → event_registrations → households → club_profile → pos_checks → staff → shifts → sales_areas → courses → email_campaigns → service_requests → complaints → invoices → payments → booking_players → email_events → line_items → daily_close → events → membership_types → transactions → tee_times

### step 4 (pos_checks) — 9 failures
- **insight-under-unlock** members: ["members"]
- **insight-under-unlock** club_profile: ["club"]
- **deep-insight-error** payments: HTTP 500
- **deep-insight-error** ar-aging: HTTP 500
- **deep-insight-error** courses: HTTP 500
- **deep-insight-error** tier-revenue: HTTP 500
- **deep-insight-error** households: HTTP 500
- **deep-insight-error** service-tickets: HTTP 500
- **deep-insight-under-unlock** member-engagement: ["members"]

### step 5 (staff) — 9 failures
- **insight-under-unlock** members: ["members"]
- **insight-under-unlock** club_profile: ["club"]
- **deep-insight-error** payments: HTTP 500
- **deep-insight-error** ar-aging: HTTP 500
- **deep-insight-error** courses: HTTP 500
- **deep-insight-error** tier-revenue: HTTP 500
- **deep-insight-error** households: HTTP 500
- **deep-insight-error** service-tickets: HTTP 500
- **deep-insight-under-unlock** member-engagement: ["members"]

## random-2026 — 18 failures

Order: members → courses → payments → pos_checks → daily_close → invoices → club_profile → transactions → email_campaigns → membership_types → service_requests → event_registrations → tee_times → email_events → households → shifts → booking_players → complaints → staff → events → line_items → sales_areas

### step 3 (pos_checks) — 9 failures
- **insight-under-unlock** members: ["members"]
- **insight-under-unlock** pos_payments: ["pos_payments","pos_checks"]
- **deep-insight-error** payments: HTTP 500
- **deep-insight-error** ar-aging: HTTP 500
- **deep-insight-error** courses: HTTP 500
- **deep-insight-error** tier-revenue: HTTP 500
- **deep-insight-error** households: HTTP 500
- **deep-insight-error** service-tickets: HTTP 500
- **deep-insight-under-unlock** member-engagement: ["members"]

### step 4 (daily_close) — 9 failures
- **insight-under-unlock** members: ["members"]
- **insight-under-unlock** pos_payments: ["pos_payments","pos_checks"]
- **deep-insight-error** payments: HTTP 500
- **deep-insight-error** ar-aging: HTTP 500
- **deep-insight-error** courses: HTTP 500
- **deep-insight-error** tier-revenue: HTTP 500
- **deep-insight-error** households: HTTP 500
- **deep-insight-error** service-tickets: HTTP 500
- **deep-insight-under-unlock** member-engagement: ["members"]

## random-1337 — 13 failures

Order: members → pos_checks → tee_times → households → shifts → complaints → daily_close → sales_areas → service_requests → courses → transactions → events → membership_types → event_registrations → email_campaigns → invoices → line_items → payments → staff → email_events → club_profile → booking_players

### step 12 (membership_types) — 13 failures
- **insight-under-unlock** members: ["members"]
- **insight-under-unlock** transactions: ["transactions"]
- **insight-under-unlock** dining_outlets: ["dining_outlets"]
- **insight-under-unlock** staff_shifts: ["staff_shifts"]
- **insight-under-unlock** complaints: ["complaints"]
- **insight-under-unlock** service_requests: ["service_requests"]
- **deep-insight-error** payments: HTTP 500
- **deep-insight-error** ar-aging: HTTP 500
- **deep-insight-error** courses: HTTP 500
- **deep-insight-error** tier-revenue: HTTP 500
- **deep-insight-error** households: HTTP 500
- **deep-insight-error** service-tickets: HTTP 500
- **deep-insight-under-unlock** member-engagement: ["members"]

## random-99 — 0 failures

Order: members → membership_types → sales_areas → payments → staff → complaints → line_items → email_events → households → booking_players → email_campaigns → courses → daily_close → club_profile → transactions → service_requests → event_registrations → tee_times → events → shifts → invoices → pos_checks


---

## Edge-Case Matrix

# Edge Case Matrix — 2026-04-13T18:41:24.606Z

Total: 12 cases, 12 passed, 0 failed, 10733ms

## 🎉 CLEAN — all cases passed

| # | ID | Label | Result | Detail | Time |
|---|----|-------|--------|--------|------|
| 1 | empty-members | members CSV with 0 rows → 0 accepted, no crash | ✅ | accepted=0 | 710ms |
| 2 | dup-external-id | duplicate external_id upserts (no PK violation) | ✅ | 1 row after 2 dup imports | 2142ms |
| 3 | missing-required | missing first_name rejects cleanly | ✅ | rejected=1 | 888ms |
| 4 | bad-date | invalid "join_date" value is rejected at schema layer | ✅ | rejected=1 | 975ms |
| 5 | non-numeric-dues | annual_dues="N/A" row is rejected | ✅ | rejected | 835ms |
| 6 | empty-stage-insights | empty tenant → all stage-insights unlocked:false | ✅ | 19 insights all locked | 312ms |
| 7 | empty-deep-insights | empty tenant → all deep-insights available:false | ✅ | 6/6 locked | 179ms |
| 8 | wrong-cron-key | wrong x-cron-key header → 401 | ✅ | 401 | 2ms |
| 9 | no-cron-no-auth | no cron key, no auth header → 401 | ✅ | 401 | 2ms |
| 10 | parallel-dup-imports | 2 parallel imports of same members file → 1 row | ✅ | 1 row idempotent | 1434ms |
| 11 | engagement-missing-member | member-engagement with bogus memberId → graceful | ✅ | available=false | 162ms |
| 12 | tenant-isolation-members | import to club A, query club B → 0 rows | ✅ | isolated | 3090ms |