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