# QA Test Script — End-to-End Verification

**Goal:** confirm that a GM signing up, creating a club, importing any combination of files, and landing on the Today view sees real value — headline insights, deep widgets, and live Anthropic agent recommendations — with every step traceable back to imported CSV data.

**Time to run:** ~30 minutes if everything's green. Add 10 minutes if something fails and you need to diagnose.

**What you need:**
- Terminal at `C:\GIT\Development\swoop-member-portal`
- Access to the Neon DB (via `POSTGRES_URL` env var)
- Anthropic API key (via `ANTHROPIC_API_KEY` env var in `.env.local`)
- Two browser tabs: one for the dev server, one for the Vercel dashboard
- The `CRON_SECRET` env var set to any value (e.g. `x`) — used to bypass `withAuth` for automation scripts

---

## Part 1 — Automated cycle (must pass before anything else)

This is the canonical "does the whole pipeline work" check. If this doesn't pass, nothing downstream will.

### 1.1 Run the full E2E cycle script

```bash
POSTGRES_URL="postgresql://neondb_owner:npg_STj6ErHVm0vF@ep-sparkling-brook-aiqua5yv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require" \
ANTHROPIC_API_KEY="<your key>" \
CRON_SECRET="x" \
  node scripts/e2e-full-cycle.mjs
```

Expected output — 7 sections, each ending with `✓` and a final banner:

```
[1] Wipe test club e56ae6f7…
    ✓ agent_actions → N   (and similar for 27 more tables)

[2] Run all 21 stage imports…
    ✓ members                accepted=100
    ✓ tee_times              accepted=1993
    ... (22 rows total, every one with accepted > 0)

[3] Compute health scores from booking_players…
    ✓ computed 100 members in ~100s

[4] Verify imported-data-catalog endpoint…
    ✓ catalog: 20/20 datasets populated, 28,548 total rows

[5] Verify stage-insights endpoint…
    ✓ stage-insights: 19/19 unlocked
    • Members: 100 members imported
    • Tee Sheet: 1,993 tee-time bookings tracked
    • Booking Players: Top golfer: Frank Compton — 20 rounds last 90d
    • F&B Transactions: 686 F&B transactions — $68,408 revenue
    • POS Line Items: Top seller: Club Sandwich — 194 sold
    • POS Payments: Settlement mix: credit_card leads at $90,096.9

[6] Verify deep-insights endpoint (all kinds)…
    ✓ payments             $240,370 across 3 methods
    ✓ ar-aging             $20,450 open, $20,450 60+ days
    ✓ courses              4 courses, max 67 tee times/day
    ✓ tier-revenue         $1,507,000 dues book across 6 tiers
    ✓ households           145 households, avg 1/household, 0 families 4+
    ✓ service-tickets      68 tickets (16 open) across 12 types
    ✓ member-engagement    3/4 dimensions active

[7] Fire all agent triggers and verify Anthropic actions…
    ✓ complaint          code=200  live_count=1
    ✓ fb                 code=200  live_count=2
    ✓ gameplan           code=200  live_count=3
    ✓ staffing           code=200  live_count=4
    ✓ arrival            code=200  live_count=5
    ✓ service-save       code=200  live_count=6
    ✓ board-report       code=200  live_count=7
    ✓ risk               code=200  live_count=8
    ✓ 8 distinct agents wrote real Anthropic actions
    • arrival-anticipation
    • board-report-compiler
    • fb-intelligence
    • member-pulse
    • member-service-recovery
    • service-recovery
    • staffing-demand
    • tomorrows-game-plan

  ✅ E2E CYCLE PASSED in ~500s — every stage, every insight, every agent
```

**Runtime:** 480–540 seconds (the bulk is compute-health-scores which makes one query per member).

### Checklist

- [ ] Section 1 wipe reports 20+ tables cleared
- [ ] Section 2 imports all show `accepted > 0`
- [ ] Section 3 reports `computed 100 members`
- [ ] Section 4 catalog shows `20/20 datasets populated` and `28,000+ total rows`
- [ ] Section 5 shows `19/19 unlocked` with 6 sample headlines
- [ ] Section 6 shows all 7 deep-insights kinds with `✓` (payments, ar-aging, courses, tier-revenue, households, service-tickets, member-engagement)
- [ ] Section 7 live_count increments 1→2→3→4→5→6→7→8 monotonically
- [ ] Final banner reads `✅ E2E CYCLE PASSED`
- [ ] Exit code is `0` (echo `$?` or `%ERRORLEVEL%` after the run)

### If any of these fail

Most common failure modes:
- **Section 2 `accepted=0`**: some CSV has a schema drift with the import handler. Look at `[stage-import] sample rejections:` output above the failure line.
- **Section 3 times out or errors**: Neon is slow or the `compute-health-scores` handler hit a missing column. Re-run and check for SQL errors.
- **Section 6 `unavailable: memberId query param required`**: the deep-insights router isn't passing query opts through — should be fixed by commit `2505d15`.
- **Section 7 `only N distinct agents`** (N < 8): one trigger silently failed an insert. Common cause is `agent_actions` column width. Verify with:
  ```sql
  SELECT column_name, data_type, character_maximum_length
  FROM information_schema.columns
  WHERE table_name = 'agent_actions';
  ```
  Every column should be `text` — no `character varying(N)`.

**Do not proceed to Part 2 until Part 1 exits 0.**

---

## Part 2 — Backend API verification (direct calls)

Now verify each endpoint independently returns the expected shape.

### 2.1 Imported Data Catalog

```bash
POSTGRES_URL="<same>" CRON_SECRET="x" node --input-type=module -e "
const h = (await import('./api/imported-data-catalog.js')).default;
const req = { method:'GET', headers:{'x-cron-key':'x'}, query:{ clubId:'e56ae6f7-e7cd-4198-8786-f2de9f813e17' } };
const res = { code:0, body:null, status(c){this.code=c;return this;}, json(o){this.body=o;return this;} };
await h(req, res);
console.log('code:', res.code);
console.log('totalRows:', res.body.totalRows);
console.log('populated:', res.body.tables.filter(t => t.rowCount > 0).length, '/', res.body.tables.length);
"
```

Expected:
```
code: 200
totalRows: 28548
populated: 20 / 20
```

- [ ] Returns 200
- [ ] totalRows ≥ 28,000
- [ ] 20 / 20 populated

### 2.2 Stage Insights

```bash
POSTGRES_URL="<same>" CRON_SECRET="x" node --input-type=module -e "
const h = (await import('./api/stage-insights.js')).default;
const req = { method:'GET', headers:{'x-cron-key':'x'}, query:{ clubId:'e56ae6f7-e7cd-4198-8786-f2de9f813e17' } };
const res = { code:0, body:null, status(c){this.code=c;return this;}, json(o){this.body=o;return this;} };
await h(req, res);
console.log('unlocked:', res.body.unlockedCount, '/', res.body.totalStages);
res.body.insights.forEach(i => console.log(i.unlocked ? '[OK]' : '[..]', i.label, '|', i.headline.slice(0,60)));
"
```

Expected: 19 rows all marked `[OK]`, each with a non-empty headline.

- [ ] `unlocked: 19 / 19`
- [ ] Every row starts with `[OK]`
- [ ] Headlines contain specific numbers (not "imported yet" placeholders)

### 2.3 Deep Insights (all 7 kinds)

```bash
POSTGRES_URL="<same>" CRON_SECRET="x" node --input-type=module -e "
import { sql } from '@vercel/postgres';
const h = (await import('./api/deep-insights.js')).default;
const clubId = 'e56ae6f7-e7cd-4198-8786-f2de9f813e17';
const memRows = await sql\`SELECT member_id FROM members WHERE club_id=\${clubId} LIMIT 1\`;
const sampleMember = memRows.rows[0]?.member_id;
const kinds = [
  ['payments', {}],
  ['ar-aging', {}],
  ['courses', {}],
  ['tier-revenue', {}],
  ['households', {}],
  ['service-tickets', {}],
  ['member-engagement', { memberId: sampleMember }],
];
for (const [kind, extra] of kinds) {
  const req = { method:'GET', headers:{'x-cron-key':'x'}, query:{ kind, clubId, ...extra } };
  const res = { code:0, body:null, status(c){this.code=c;return this;}, json(o){this.body=o;return this;} };
  await h(req, res);
  console.log(kind.padEnd(20), res.code, res.body.available ? 'OK' : 'NOT AVAILABLE: ' + res.body.reason);
}
"
```

Expected: all 7 lines end with `OK`.

- [ ] `payments` OK — ≥ 3 settlement methods
- [ ] `ar-aging` OK — $20k open balance
- [ ] `courses` OK — 4 courses
- [ ] `tier-revenue` OK — ≥ 6 tiers, $1.5M book
- [ ] `households` OK — 145 households
- [ ] `service-tickets` OK — 68 tickets / 16 open
- [ ] `member-engagement` OK — at least 1 dimension active

---

## Part 3 — Direct database sanity checks

A few targeted queries to confirm the underlying data matches what the API is returning.

```bash
POSTGRES_URL="<same>" node --input-type=module -e "
import { sql } from '@vercel/postgres';
const clubId = 'e56ae6f7-e7cd-4198-8786-f2de9f813e17';

console.log('--- core tables ---');
for (const t of ['members','bookings','transactions','complaints','courses','pos_checks','staff','staff_shifts','event_definitions','email_campaigns','member_invoices','membership_types','service_requests','households']) {
  const r = await sql.query(\`SELECT COUNT(*)::int AS n FROM \${t} WHERE club_id = \$1\`, [clubId]);
  console.log(' ', t.padEnd(22), r.rows[0].n);
}

console.log('\\n--- joined tables (no club_id column) ---');
const bp = await sql\`SELECT COUNT(*)::int AS n FROM booking_players bp JOIN bookings b ON b.booking_id=bp.booking_id WHERE b.club_id=\${clubId}\`;
console.log('  booking_players (joined)', bp.rows[0].n);
const li = await sql\`SELECT COUNT(*)::int AS n FROM pos_line_items li JOIN pos_checks pc ON pc.check_id=li.check_id WHERE pc.club_id=\${clubId}\`;
console.log('  pos_line_items (joined)', li.rows[0].n);
const pp = await sql\`SELECT COUNT(*)::int AS n FROM pos_payments p JOIN pos_checks pc ON pc.check_id=p.check_id WHERE pc.club_id=\${clubId}\`;
console.log('  pos_payments (joined)', pp.rows[0].n);

console.log('\\n--- live agent actions ---');
const a = await sql\`SELECT agent_id FROM agent_actions WHERE club_id=\${clubId} AND action_id LIKE 'live_%' ORDER BY agent_id\`;
console.log('  distinct agents:', a.rows.length);
a.rows.forEach(x => console.log('   ', x.agent_id));

console.log('\\n--- health scores ---');
const h = await sql\`SELECT health_tier, COUNT(*)::int AS n FROM members WHERE club_id=\${clubId} GROUP BY health_tier ORDER BY n DESC\`;
h.rows.forEach(x => console.log(' ', (x.health_tier || 'null').padEnd(20), x.n));
"
```

Expected:
```
--- core tables ---
  members                100
  bookings               1993
  transactions           686
  complaints             8
  courses                4
  pos_checks             1916
  staff                  45
  staff_shifts           641
  event_definitions      18  (rough — may differ based on import order)
  email_campaigns        40  (rough)
  member_invoices        554 (joined via member_id)
  membership_types       6
  service_requests       68  (joined via member_id)
  households             145

--- joined tables (no club_id column) ---
  booking_players (joined) 1993
  pos_line_items (joined)  7409
  pos_payments (joined)    1916

--- live agent actions ---
  distinct agents: 8
    arrival-anticipation
    board-report-compiler
    fb-intelligence
    member-pulse
    member-service-recovery
    service-recovery
    staffing-demand
    tomorrows-game-plan

--- health scores ---
  Healthy              ~40
  Watch                ~55
  Insufficient Data    few
  (etc)
```

### Checklist

- [ ] `members` = 100 (exactly — from the small fixture)
- [ ] `bookings` = 1993
- [ ] `booking_players` joined to test club ≥ 1000
- [ ] `pos_line_items` joined to test club ≥ 7000
- [ ] `pos_payments` joined to test club ≥ 1900
- [ ] `distinct agents` = 8
- [ ] Every member has a `health_tier` set (no raw nulls — at minimum "Insufficient Data")

---

## Part 4 — UI walkthrough (visual verification in a real browser)

Start the Vite dev server:

```bash
cd "C:\GIT\Development\swoop-member-portal"
npm run dev
```

Open `http://localhost:5173` in a browser.

### 4.1 Sign in to the test club

- [ ] Landing page renders without console errors
- [ ] Click "Sign in" (or navigate to a logged-in state)
- [ ] You land on the Today view

### 4.2 Today view — Stage Insights Panel

Scroll the Today view until you find the panel titled **"What your data is showing you"**.

- [ ] Title bar reads `19 of 19 unlocked · 100% complete` (green pill on the right)
- [ ] Grid shows ~19 cards, each with:
  - UPPERCASE blue label (e.g. "F&B TRANSACTIONS")
  - A concrete headline (e.g. "Top seller: Club Sandwich — 194 sold")
  - A secondary blue metric line
  - A small bullet list
- [ ] Sample headlines that should appear (at least 4 of these):
  - [ ] "Top golfer: Frank Compton — XX rounds last 90d" (or similar member name)
  - [ ] "Top seller: Club Sandwich — 194 sold"
  - [ ] "Event champion: Satoshi Lambert — XX RSVPs" (or similar)
  - [ ] "Settlement mix: credit_card leads at $90,096.9"
- [ ] The collapsible "not yet imported" footer is empty or hidden (since all 19 are unlocked)

### 4.3 Today view — Agent Actions panel

Find the **Pending Actions** / priorities section (typically near the top).

- [ ] At least 1 action card appears with "Source: anthropic" or similar tag
- [ ] Action description references a real member name (e.g., "GM should personally call Amanda West...")
- [ ] Click an action card — an action panel expands with owner, impact metric, and approve/dismiss buttons
- [ ] Approve or dismiss button responds (network tab shows POST `/api/agents` → 200)

### 4.4 Integrations → Imported Data tab

Navigate to Settings → Integrations (the gear / cog icon in nav → Integrations).

- [ ] Page loads with 4 tabs: **Connections**, **Imported Data**, **Import Data**, **AI Import Assistant**
- [ ] Click **Imported Data**
- [ ] Header pill shows `28,548 total rows across 20 dataset(s)` (approx)
- [ ] Table has 20 rows — one per imported dataset
- [ ] Each row shows:
  - Dataset label (e.g. "F&B Transactions")
  - Table name in monospace
  - Row count (right-aligned)
  - Last imported time ("Xm ago" / "Xd ago")
  - Sample row preview

### 4.5 Revenue view — Settlement mix + AR aging

Navigate to **Revenue** (or Revenue Leakage).

Find two cards at the top (above the "Revenue Leakage" headline):

**Settlement Mix Donut:**
- [ ] SVG donut with 3 colored slices
- [ ] Legend showing percentages: `credit_card 37%`, `cash 34%`, `member_charge 29%` (or similar)
- [ ] Header says `$240,370 processed`

**AR Aging Panel:**
- [ ] Header says `$20,450` open balance
- [ ] Red pill showing `$20,450 aged 60+ days` (this test club has all aging past 60)
- [ ] Horizontal bars for buckets: current / 1-30 / 31-60 / 61-90 / 90+
- [ ] "Top Open Balances" list shows 5 member names with dollar amounts (Philippe Foster $3,375, etc.)

### 4.6 Tee Sheet view — Course utilization

Navigate to **Tee Sheet**.

- [ ] Below the EvidenceStrip, find **Course Utilization** section
- [ ] 4 course cards visible (Championship Course, Executive Nine, plus 2 tenant-prefixed)
- [ ] Each card shows:
  - Course name + holes/par/tee interval
  - Colored progress bar (red/yellow/green based on utilization %)
  - "X rounds" on the left, "Y% utilized" on the right
  - "Max N tee times/day" at the bottom

### 4.7 Members view — Tier revenue + Household composition

Navigate to **Members**.

Above the roster summary stats, find two side-by-side cards:

**Annual Dues by Tier:**
- [ ] Header says `$1,507,000` (or similar) annual dues book
- [ ] 6 horizontal bars, each with tier code, colored bar, revenue, member count, %
- [ ] Top tier is FG with $1,062,000 / 59 members / 70% (or similar)

**Household Composition:**
- [ ] Header says `145 households · avg N/household`
- [ ] Histogram bars for household sizes (1 member, 2 members, etc.)

### 4.8 Service view — Service tickets panel

Navigate to **Service**.

Above the tab switcher, find the **Service Requests** panel.

- [ ] Header: `68 tickets · 16 open`
- [ ] "By Category" list: 12 categories with totals
- [ ] Open tickets shown in red pill next to their category
- [ ] "Top Requesters" list: 5 member names with ticket counts

### 4.9 Member Profile — Engagement timeline

Navigate back to **Members**, click any member row to open the profile drawer.

Below the Decay Chain visualization, find **Engagement Timeline**.

- [ ] Header: "Engagement Timeline · Cross-domain signals from imported data"
- [ ] 2×2 grid showing: Rounds (90d), Event RSVPs, Email Opens, Complaints
- [ ] At least 2 of the 4 boxes have a non-zero count (blue background)
- [ ] Each active box shows "last: YYYY-MM-DD"
- [ ] If the member has unresolved complaints, a red warning appears

### 4.10 Browser console check

Throughout the UI walkthrough, keep DevTools console open.

- [ ] Zero `Uncaught` errors
- [ ] Zero `404` on `/api/*` routes
- [ ] Zero React warnings about missing keys or invalid props
- [ ] `X-Vercel-Cache` headers are absent (local) or reasonable (if pointed at prod)

---

## Part 5 — Auto-fire agent verification (live import)

Prove that importing one file end-to-end triggers Anthropic calls without any manual intervention.

### 5.1 Note the current action count

```bash
POSTGRES_URL="<same>" node --input-type=module -e "
import { sql } from '@vercel/postgres';
const r = await sql\`SELECT COUNT(*)::int AS n FROM agent_actions WHERE club_id='e56ae6f7-e7cd-4198-8786-f2de9f813e17' AND action_id LIKE 'live_%'\`;
console.log('before:', r.rows[0].n);
"
```

- [ ] Note the number: `before: ___`

### 5.2 Fire a single complaint import via the endpoint

```bash
POSTGRES_URL="<same>" CRON_SECRET="x" ANTHROPIC_API_KEY="<yours>" node --input-type=module -e "
const h = (await import('./api/import-csv.js')).default;
const req = {
  method: 'POST',
  headers: { 'x-cron-key': 'x', host: 'localhost:5173' },
  body: {
    club_id: 'e56ae6f7-e7cd-4198-8786-f2de9f813e17',
    importType: 'complaints',
    rows: [{
      category: 'service',
      description: 'QA manual walkthrough test',
      priority: 'high',
      status: 'open',
      reported_at: new Date().toISOString(),
      member_id: 'mbr_001',
    }],
  },
};
const res = { code:0, body:null, status(c){this.code=c;return this;}, json(o){this.body=o;return this;}, setHeader(){} };
await h(req, res);
console.log(res.code, JSON.stringify(res.body));
"
```

- [ ] Returns `200` with `accepted: 1, rejected: 0`

### 5.3 Re-check the action count after ~30 seconds

The auto-fire is fire-and-forget, so the agents fire in the background.

```bash
sleep 30 && POSTGRES_URL="<same>" node --input-type=module -e "
import { sql } from '@vercel/postgres';
const r = await sql\`
  SELECT agent_id, COUNT(*)::int AS n
  FROM agent_actions
  WHERE club_id='e56ae6f7-e7cd-4198-8786-f2de9f813e17'
    AND action_id LIKE 'live_%'
    AND timestamp > NOW() - INTERVAL '2 minutes'
  GROUP BY agent_id ORDER BY agent_id
\`;
console.log('fresh actions (last 2min):');
r.rows.forEach(x => console.log(' ', x.agent_id, '×', x.n));
"
```

Expected: fresh live actions from the auto-fire — typically service-recovery, member-service-recovery, fb-intelligence, tomorrows-game-plan, staffing-demand, arrival-anticipation, board-report-compiler, member-pulse.

- [ ] At least 4 distinct agents fired within 2 minutes of the import
- [ ] At least one references the complaint's member ("mbr_001" or their real name)

**Note:** The auto-fire is wired to `fetch()` a host derived from `req.headers.host`. In the in-process test above, that resolves to `localhost:5173`, so the fetches will hit the dev server (if running) or silently no-op (if not). To verify the auto-fire against the real dev server, import via `curl` against `localhost:5173/api/import-csv` while `npm run dev` is running.

---

## Part 6 — Onboarding flow (cold start — optional but recommended)

This verifies a brand-new GM's first 60 seconds.

### 6.1 Create a fresh test club

In a separate bash session:

```bash
POSTGRES_URL="<same>" node --input-type=module -e "
import { sql } from '@vercel/postgres';
// Create an empty club row
await sql\`INSERT INTO club (club_id, name) VALUES ('qa-test-club', 'QA Walkthrough Club') ON CONFLICT (club_id) DO NOTHING\`;
console.log('club created');
"
```

### 6.2 Hit the stage-insights endpoint for the new club

```bash
POSTGRES_URL="<same>" CRON_SECRET="x" node --input-type=module -e "
const h = (await import('./api/stage-insights.js')).default;
const req = { method:'GET', headers:{'x-cron-key':'x'}, query:{ clubId:'qa-test-club' } };
const res = { code:0, body:null, status(c){this.code=c;return this;}, json(o){this.body=o;return this;} };
await h(req, res);
console.log('unlocked:', res.body.unlockedCount, '/', res.body.totalStages);
console.log('first 3 locked hints:');
res.body.insights.filter(i => !i.unlocked).slice(0, 3).forEach(i => console.log(' ', i.label, '-', i.bullets[0]));
"
```

Expected:
```
unlocked: 0 / 19 (or 1/19 if the club row creates a club_profile stage)
first 3 locked hints:
  Members - Import to unlock: Member roster, dues book, health tier setup
  Tee Sheet - Import to unlock: Tee-time tracking, bookings widget
  Booking Players - Import to unlock: Per-player attribution, golf health score
```

- [ ] Fresh club shows 0 or 1 unlocked (not 19)
- [ ] Every locked card has a non-empty "Import to unlock..." hint
- [ ] The hints describe downstream GM value, not raw table names

### 6.3 Import one file and re-check

```bash
POSTGRES_URL="<same>" CRON_SECRET="x" node scripts/stage-import.mjs members tests/fixtures/small/JCM_Members_F9.csv qa-test-club
```

Then re-run the stage-insights check from 6.2 against `qa-test-club`.

- [ ] `unlocked` count incremented by 1
- [ ] The `Members` card now shows `[OK] Members | 100 members imported`
- [ ] The other 18 cards are still locked with hints

### 6.4 Clean up the test club

```bash
POSTGRES_URL="<same>" node --input-type=module -e "
import { sql } from '@vercel/postgres';
await sql\`DELETE FROM members WHERE club_id = 'qa-test-club'\`;
await sql\`DELETE FROM club WHERE club_id = 'qa-test-club'\`;
console.log('cleaned');
"
```

---

## Part 7 — Repeatability

Run the E2E cycle script a **second time** without any changes in between:

```bash
POSTGRES_URL="<same>" ANTHROPIC_API_KEY="<same>" CRON_SECRET="x" node scripts/e2e-full-cycle.mjs
```

- [ ] Second run also exits 0
- [ ] Second run also shows `8 distinct agents wrote real Anthropic actions`
- [ ] Runtime is within 30 seconds of the first run

Repeatability proves the pipeline is deterministic and not dependent on any one-time DB state.

---

## Summary checklist

Final green light requires **all** of these:

- [ ] **Part 1** — Automated cycle exits 0 with 8/8 agents and 19/19 insights
- [ ] **Part 2.1** — Catalog endpoint returns 20/20 populated
- [ ] **Part 2.2** — Stage insights returns 19/19 unlocked
- [ ] **Part 2.3** — All 7 deep-insights kinds return available
- [ ] **Part 3** — Direct DB counts match expected fixture sizes
- [ ] **Part 4.2** — Stage Insights Panel renders on Today view with 19 cards
- [ ] **Part 4.3** — At least 1 live Anthropic action visible on Today
- [ ] **Part 4.4** — Imported Data tab shows 20 datasets
- [ ] **Part 4.5** — Revenue view has SettlementMix + ARAging cards
- [ ] **Part 4.6** — Tee Sheet view has CourseUtilization cards
- [ ] **Part 4.7** — Members view has TierRevenue + Household cards
- [ ] **Part 4.8** — Service view has ServiceTickets panel
- [ ] **Part 4.9** — Member Profile drawer has EngagementTimeline
- [ ] **Part 4.10** — No console errors during UI walkthrough
- [ ] **Part 5** — Auto-fire produces fresh live actions post-import
- [ ] **Part 6** — Fresh club starts at 0/19 unlocked with useful import hints (optional)
- [ ] **Part 7** — E2E cycle is repeatable — second run also exits 0

---

## Troubleshooting

### "function not found" or SPA HTML returned for an `/api/*` call

You're hitting a deployed environment where the function isn't bundled, or you're past the Vercel function cap. Check that the file exists under `api/` and isn't in `.vercelignore`.

### `403 Forbidden` with `Vercel Security Checkpoint`

The prod URL is behind Vercel Attack Challenge Mode or Deployment Protection. Either disable the protection at:
- `vercel.com/tyhayesswoopgolfcos-projects/swoop-member-portal/settings/deployment-protection`
or add a bypass token and pass it as `x-vercel-protection-bypass: <secret>` on every request.

### `value too long for type character varying(100)`

A previous schema drift. Widen the offending column to `text`:

```sql
ALTER TABLE agent_actions ALTER COLUMN impact_metric TYPE text;
```

Check the whole `agent_actions` table — all text columns should be `text`, not `varchar(N)`.

### Agents return triggered:true but agent_actions is empty

The SIM block inside the trigger is failing silently. Check:
1. `ANTHROPIC_API_KEY` env var is the uppercase name the SDK expects (not `anthropic=`).
2. The agent_id referenced in `realAgentCall` exists in `agent_definitions` (FK constraint).
3. Every text column on `agent_actions` is `text`, not narrow varchar.

### compute-health-scores hangs or times out

It makes one query per member, so 100 members × 4 dimensions = 400 queries against Neon. Takes ~100s. If it's longer than 180s something is wrong — check Neon status and try a direct `SELECT 1` latency test.

---

*Last updated: 2026-04-13 · covers commits through `2505d15`*
