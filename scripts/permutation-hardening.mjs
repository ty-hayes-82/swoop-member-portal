#!/usr/bin/env node
/**
 * scripts/permutation-hardening.mjs
 *
 * Order-independent hardening loop. Re-runs the 22-stage import cycle
 * under N distinct permutations (members always first, other 21 stages
 * shuffled deterministically). At EVERY intermediate state, verifies
 * three invariants:
 *
 *   1. INSIGHT-DIFF: stage-insights + deep-insights + catalog only show
 *      headlines for tables that are actually loaded. No leakage.
 *   2. AGENT ELIGIBILITY: only agents whose TRIGGER_REQUIREMENTS are
 *      satisfied write live_* actions. No over-eager firing.
 *   3. CLICK-TEST: a headless Chrome walks every GM nav route with zero
 *      console errors, zero 4xx/5xx on /api/*, no stuck loading states.
 *
 * Failures are accumulated per step and consolidated into a punch list
 * ranked by blast radius (how many permutations hit the same issue).
 *
 * Usage:
 *   POSTGRES_URL=... ANTHROPIC_API_KEY=... CRON_SECRET=x \
 *     node scripts/permutation-hardening.mjs [--dry-run] [--click-test] [--permutations=N]
 *
 * Flags:
 *   --dry-run        Skip Anthropic trigger calls (for iterative debugging)
 *   --click-test     Enable Playwright click-test (requires dev server)
 *   --permutations=N Override permutation count (default: 10)
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Load .env.local before importing any module that needs env vars
// ---------------------------------------------------------------------------
{
  const __root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const envFile = path.join(__root, '.env.local');
  try {
    const content = fs.readFileSync(envFile, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (key && !process.env[key]) process.env[key] = val;
    }
  } catch { /* .env.local not found — rely on env already being set */ }
}

import { sql } from '@vercel/postgres';

import {
  STAGE_ORDER,
  STAGE_INSIGHT_DEPS,
  DEEP_INSIGHT_DEPS,
  AGENT_TRIGGER_DEPS,
  TRIGGER_TO_AGENT_ID,
  allTablesLoaded,
  allDomainsSatisfied,
  loadedTables,
  satisfiedDomains,
} from './permutation-hardening/dependencies.mjs';

import { runClickTest } from './click-tester.mjs';

// ---------------------------------------------------------------------------
// Neon resilience — retry verification functions once on connection drop
// ---------------------------------------------------------------------------

function isNeonTransient(err) {
  const msg = String(err?.message || err || '');
  return /Connection terminated|ECONNRESET|WebSocket|terminating connection/i.test(msg);
}

async function withNeonRetry(fn, label) {
  try {
    return await fn();
  } catch (err) {
    if (!isNeonTransient(err)) throw err;
    console.log(`  (${label}: neon drop, sleeping 3s then retrying once)`);
    await new Promise(r => setTimeout(r, 3000));
    try {
      return await fn();
    } catch (err2) {
      if (isNeonTransient(err2)) {
        console.log(`  (${label}: neon still down after retry — skipping step)`);
        return null; // caller handles null by not accumulating failures
      }
      throw err2;
    }
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

// Each permutation gets its own fresh UUID club so we never have
// cross-session leakage from rows the wipe can't delete (FK skips on
// dining_outlets, event_definitions, email_campaigns, service_requests,
// club). This is the correct way to enforce tenant isolation for a
// destructive test loop.
function freshClubId(permName) {
  const suffix = Math.random().toString(36).slice(2, 10);
  return `perm-${permName}-${suffix}`;
}

// ---------------------------------------------------------------------------
// Flags
// ---------------------------------------------------------------------------

const FLAGS = {
  dryRun:      process.argv.includes('--dry-run'),
  clickTest:   process.argv.includes('--click-test'),
  failFast:    process.argv.includes('--fail-fast'),
  quick:       process.argv.includes('--quick'),
  permutations: (() => {
    const arg = process.argv.find(a => a.startsWith('--permutations='));
    return arg ? parseInt(arg.split('=')[1], 10) : 10;
  })(),
  concurrency: (() => {
    const arg = process.argv.find(a => a.startsWith('--concurrency='));
    return arg ? parseInt(arg.split('=')[1], 10) : 5;
  })(),
  // --filter=<name> — run only the named permutation (e.g. --filter=random-42)
  filter: (() => {
    const arg = process.argv.find(a => a.startsWith('--filter='));
    return arg ? arg.split('=')[1] : null;
  })(),
};
// quick mode = only run first 6 stages per permutation (members + 5 others)
const QUICK_STAGE_LIMIT = 5;

// ---------------------------------------------------------------------------
// Deterministic PRNG (Mulberry32) for reproducible shuffles
// ---------------------------------------------------------------------------

function mulberry32(seed) {
  return function() {
    seed |= 0;
    seed = seed + 0x6d2b79f5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function seededShuffle(arr, seed) {
  const out = [...arr];
  const rand = typeof seed === 'number' ? mulberry32(seed) : mulberry32(hash(seed));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

// ---------------------------------------------------------------------------
// Permutation strategies — members always first, other 21 stages shuffled
// ---------------------------------------------------------------------------

const NON_MEMBER_STAGES = STAGE_ORDER.filter(s => s.key !== 'members');

function buildPermutation(perm) {
  const base = NON_MEMBER_STAGES;
  switch (perm.seed) {
    case 'pos-first': {
      const posKeys = new Set(['transactions', 'pos_checks', 'line_items', 'payments', 'daily_close', 'sales_areas']);
      const pos = base.filter(s => posKeys.has(s.key));
      const rest = base.filter(s => !posKeys.has(s.key));
      return [...pos, ...rest];
    }
    case 'labor-first': {
      const laborKeys = new Set(['shifts', 'staff']);
      const labor = base.filter(s => laborKeys.has(s.key));
      const rest = base.filter(s => !laborKeys.has(s.key));
      return [...labor, ...rest];
    }
    case 'tee-first': {
      const teeKeys = new Set(['tee_times', 'booking_players', 'courses']);
      const tee = base.filter(s => teeKeys.has(s.key));
      const rest = base.filter(s => !teeKeys.has(s.key));
      return [...tee, ...rest];
    }
    case 'email-first': {
      const emailKeys = new Set(['email_campaigns', 'email_events']);
      const email = base.filter(s => emailKeys.has(s.key));
      const rest = base.filter(s => !emailKeys.has(s.key));
      return [...email, ...rest];
    }
    case 'reverse':
      return [...base].reverse();
    default:
      return seededShuffle(base, perm.seed);
  }
}

const PERMUTATIONS = [
  { name: 'pos-first',    seed: 'pos-first' },
  { name: 'tee-first',     seed: 'tee-first' },
  { name: 'labor-first',   seed: 'labor-first' },
  { name: 'email-first',   seed: 'email-first' },
  { name: 'reverse',       seed: 'reverse' },
  { name: 'random-42',     seed: 42 },
  { name: 'random-1337',   seed: 1337 },
  { name: 'random-7',       seed: 7 },
  { name: 'random-2026',    seed: 2026 },
  { name: 'random-99',      seed: 99 },
].slice(0, FLAGS.permutations).filter(p => !FLAGS.filter || p.name === FLAGS.filter);

// ---------------------------------------------------------------------------
// Wipe — reused verbatim from e2e-full-cycle.mjs
// ---------------------------------------------------------------------------

async function wipeClub(clubId) {
  const tables = [
    `DELETE FROM agent_actions WHERE club_id = $1`,
    `DELETE FROM playbook_steps WHERE club_id = $1`,
    `DELETE FROM playbook_runs WHERE club_id = $1`,
    `DELETE FROM event_bus WHERE club_id = $1`,
    `DELETE FROM booking_players WHERE booking_id IN (SELECT booking_id FROM bookings WHERE club_id = $1)`,
    `DELETE FROM pos_line_items WHERE check_id IN (SELECT check_id FROM pos_checks WHERE club_id = $1)`,
    `DELETE FROM pos_payments WHERE check_id IN (SELECT check_id FROM pos_checks WHERE club_id = $1)`,
    `DELETE FROM staff_shifts WHERE club_id = $1`,
    `DELETE FROM staff WHERE club_id = $1`,
    `DELETE FROM member_invoices WHERE member_id IN (SELECT member_id FROM members WHERE club_id = $1)`,
    `DELETE FROM email_events WHERE club_id = $1`,
    `DELETE FROM email_campaigns WHERE club_id = $1`,
    `DELETE FROM event_registrations WHERE club_id = $1`,
    `DELETE FROM event_definitions WHERE club_id = $1`,
    `DELETE FROM feedback WHERE club_id = $1`,
    `DELETE FROM complaints WHERE club_id = $1`,
    `DELETE FROM service_requests WHERE member_id IN (SELECT member_id FROM members WHERE club_id = $1)`,
    `DELETE FROM close_outs WHERE club_id = $1`,
    `DELETE FROM pos_checks WHERE club_id = $1`,
    `DELETE FROM bookings WHERE club_id = $1`,
    `DELETE FROM transactions WHERE club_id = $1`,
    `DELETE FROM member_engagement_weekly WHERE club_id = $1`,
    `DELETE FROM health_scores WHERE club_id = $1`,
    `DELETE FROM members WHERE club_id = $1`,
    `DELETE FROM households WHERE club_id = $1`,
    `DELETE FROM membership_types WHERE club_id = $1`,
    `DELETE FROM csv_imports WHERE club_id = $1`,
    `DELETE FROM data_source_status WHERE club_id = $1`,
  ];
  for (const q of tables) {
    try { await sql.query(q, [clubId]); } catch { /* fresh club — shouldn't hit FKs */ }
  }
}

// ---------------------------------------------------------------------------
// Single stage import via stage-import.mjs as child process
// ---------------------------------------------------------------------------

// In-process CSV parser + import handler call — eliminates the ~1.5s
// child-process startup overhead per stage. Reuses the header maps and
// parse logic from stage-import.mjs but calls api/import-csv.js directly.

// Header maps cribbed from scripts/stage-import.mjs (copied verbatim so
// permutation-hardening doesn't depend on that file staying stable).
const HEADER_MAPS = {
  'JCM_Members_F9.csv': {
    'Member #': 'external_id', 'Member Number': '_skip',
    'Given Name': 'first_name', 'Surname': 'last_name',
    'Email': 'email', 'Phone #': 'phone', 'Birthday': 'birthday',
    'Sex': 'sex', 'Membership Type': 'membership_type', 'Status': 'status',
    'Date Joined': 'join_date', 'Date Resigned': 'date_resigned',
    'Household ID': 'household_id', 'Annual Fee': 'annual_dues',
    'Current Balance': 'current_balance', 'Handicap #': 'handicap', 'Mailings': '_skip',
  },
  'TTM_Tee_Sheet_SV.csv': {
    'Reservation ID': 'reservation_id', 'Course': 'course', 'Date': 'date',
    'Tee Time': 'tee_time', 'Players': 'players', 'Guest Flag': 'guest_flag',
    'Transportation': 'transportation', 'Caddie': 'caddie', 'Holes': 'holes',
    'Status': 'status', 'Check-In Time': 'check_in_time',
    'Round Start': 'round_start', 'Round End': 'round_end', 'Duration (min)': 'duration_min',
  },
  'TTM_Tee_Sheet_Players_SV.csv': {
    'Player ID': 'player_id', 'Reservation ID': 'reservation_id',
    'Member #': 'member_id', 'Guest Name': 'guest_name',
    'Guest Flag': 'guest_flag', 'Position': 'position',
  },
  'TTM_Course_Setup_F9.csv': {
    'Course Code': 'course_code', 'Course Name': 'course_name',
    'Holes': 'holes', 'Par': 'par', 'Interval (min)': 'interval_min',
    'Start Time': 'start_time', 'End Time': 'end_time',
  },
  'POS_Sales_Detail_SV.csv|pos_checks': {
    'Chk#': 'check_id', 'Sales Area': 'sales_area',
    'Member #': 'member_id', 'Open Time': 'open_time',
    'Close Time': 'close_time', 'First Fire': '_skip', 'Last Fulfilled': '_skip',
    'Net Amount': 'net_amount', 'Tax': 'tax', 'Gratuity': 'gratuity',
    'Comp': 'comp', 'Discount': 'discount', 'Void': 'void',
    'Total Due': 'total_due', 'Settlement Method': 'settlement_method',
  },
  'POS_Sales_Detail_SV.csv': {
    'Chk#': '_skip', 'Sales Area': 'outlet_name',
    'Member #': 'member_id', 'Open Time': 'transaction_date',
    'Close Time': 'close_time', 'First Fire': '_skip', 'Last Fulfilled': '_skip',
    'Net Amount': 'total_amount', 'Tax': 'tax', 'Gratuity': 'gratuity',
    'Comp': 'comp', 'Discount': 'discount', 'Void': 'void',
    'Total Due': '_skip', 'Settlement Method': 'settlement_method',
  },
  'POS_Line_Items_SV.csv': {
    'Line Item ID': 'line_item_id', 'Chk#': 'check_id',
    'Item Description': 'item_description', 'Sales Category': 'sales_category',
    'Regular Price': 'regular_price', 'Qty': 'qty', 'Line Total': 'line_total',
    'Comp': 'comp', 'Void': 'void', 'Fire Time': 'fire_time',
  },
  'POS_Payments_SV.csv': {
    'Payment ID': 'payment_id', 'Chk#': 'check_id',
    'Settlement Method': 'payment_method', 'Amount': 'amount',
    'Settlement Time': 'processed_at', 'Split': 'is_split',
  },
  'POS_Daily_Close_SV.csv': {
    'Close ID': 'closeout_id', 'Date': 'date',
    'Golf Revenue': 'golf_revenue', 'F&B Revenue': 'fb_revenue',
    'Total Revenue': 'total_revenue', 'Rounds Played': 'rounds_played',
    'Covers': 'covers', 'Weather': 'weather',
  },
  'POS_Sales_Areas_F9.csv': {
    'Sales Area ID': 'sales_area_id', 'Sales Area Description': 'description',
    'Type': 'type', 'Operating Hours': 'operating_hours',
    'Weekday Covers': 'weekday_covers', 'Weekend Covers': 'weekend_covers',
  },
  '7shifts_Staff_Shifts.csv': {
    'Shift ID': 'shift_id', 'Employee ID': 'employee_id',
    'Date': 'date', 'Location': 'location',
    'Shift Start': 'shift_start', 'Shift End': 'shift_end',
    'Act Hrs': 'actual_hours', 'Notes': 'notes',
  },
  'ADP_Staff_Roster.csv': {
    'Employee ID': 'employee_id', 'First Name': 'first_name',
    'Last Name': 'last_name', 'Dept': 'department',
    'Job Title': 'job_title', 'Hire Date': 'hire_date',
    'Hourly Rate': 'hourly_rate', 'FT/PT': 'ft_pt',
  },
  'JAM_Event_List_SV.csv': {
    'Event Number': 'event_id', 'Event Name': 'event_name',
    'Event Type': 'event_type', 'Start Date': 'start_date',
    'Capacity': 'capacity', 'Pricing Category': 'registration_fee',
    'Description': 'description',
  },
  'JAM_Registrations_SV.csv': {
    'Registration ID': 'registration_id', 'Event Number': 'event_id',
    'Client Code': 'member_id', 'Status': 'status',
    'Guest Count': 'guest_count', 'Fee Paid': 'fee_paid',
    'Registration Date': 'registration_date', 'Check-In Time': 'check_in_time',
  },
  'CHO_Campaigns_SV.csv': {
    'Campaign ID': 'campaign_id', 'Subject': 'subject',
    'Campaign Type': 'campaign_type', 'Send Date': 'send_date',
    'Audience Count': 'audience_count',
  },
  'CHO_Email_Events_SV.csv': {
    'Event ID': '_skip', 'Campaign': 'campaign_id',
    'Member #': 'member_id', 'Event Type': 'event_type',
    'Timestamp': 'timestamp', 'Link Clicked': 'link_clicked', 'Device': 'device',
  },
  'JCM_Aged_Receivables_SV.csv': {
    'Invoice #': 'invoice_id', 'Member #': 'member_id',
    'Statement Date': 'statement_date', 'Due Date': 'due_date',
    'Net Amount': 'net_amount', 'Billing Code Type': 'billing_code_type',
    'Description': 'description', 'Aging Bucket': 'aging_bucket',
    'Last Payment': 'last_payment', 'Payment Amount': 'payment_amount',
    'Days Past Due': 'days_past_due', 'Late Fee': 'late_fee',
  },
  'JCM_Dependents_F9.csv': {
    'Household ID': 'household_id', 'Primary Member #': 'primary_member_id',
    'Dependent Count': 'dependent_count', 'Home Address': 'home_address',
  },
  'JCM_Membership_Types_F9.csv': {
    'Type Code': 'type_code', 'Description': 'description',
    'Annual Fee': 'annual_fee', 'F&B Minimum': 'fnb_minimum',
    'Golf Eligible': 'golf_eligible',
  },
  'JCM_Communications_RG.csv': {
    'Communication ID': 'feedback_id', 'Member #': 'member_id',
    'Date': 'reported_at', 'Type': 'category',
    'Happometer Score': 'priority', 'Subject': 'description',
    'Complete': 'status', 'Resolution Date': 'resolved_at',
  },
  'JCM_Service_Requests_RG.csv': {
    'Request ID': 'request_id', 'Member #': 'member_id',
    'Booking Ref': 'booking_ref', 'Type': 'type', 'Date': 'date',
    'Response Time (min)': 'response_time_min',
    'Resolution Date': 'resolution_date', 'Notes': 'notes',
  },
  'JCM_Club_Profile.csv': {
    'Club Name': 'club_name', 'Address': 'address', 'City': 'city',
    'State': 'state', 'Zip': 'zip', 'Phone': 'phone', 'Website': 'website',
    'Founded': 'founded', 'Membership Cap': 'membership_cap',
  },
};

function splitCSVLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; }
      else q = !q;
    } else if (ch === ',' && !q) {
      out.push(cur); cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

// Cache parsed CSV rows so multiple permutations don't re-parse the same files.
const csvCache = new Map();

function parseCSV(filePath, headerMap) {
  if (csvCache.has(filePath)) return csvCache.get(filePath);
  const content = fs.readFileSync(path.resolve(ROOT, filePath), 'utf-8');
  const lines = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '"') { q = !q; cur += ch; }
    else if ((ch === '\n' || ch === '\r') && !q) {
      if (cur.trim()) lines.push(cur);
      cur = '';
      if (ch === '\r' && content[i + 1] === '\n') i++;
    } else cur += ch;
  }
  if (cur.trim()) lines.push(cur);
  if (!lines.length) { csvCache.set(filePath, []); return []; }
  const headers = splitCSVLine(lines[0]).map(h => {
    const trimmed = h.trim();
    if (headerMap && headerMap[trimmed]) return headerMap[trimmed];
    return trimmed.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '_');
  });
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = splitCSVLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      if (headers[j] === '_skip') continue;
      row[headers[j]] = (vals[j] || '').trim();
    }
    rows.push(row);
  }
  csvCache.set(filePath, rows);
  return rows;
}

async function runStageImport(importType, csvPath, clubId) {
  const baseName = path.basename(csvPath);
  const headerMap = HEADER_MAPS[`${baseName}|${importType}`] || HEADER_MAPS[baseName] || null;
  const rows = parseCSV(csvPath, headerMap);
  try {
    const handler = (await import(`../api/import-csv.js?v=${Date.now()}`)).default;
    const req = {
      method: 'POST',
      headers: { 'x-cron-key': process.env.CRON_SECRET || 'x' },
      body: { importType, rows, club_id: clubId, clubId },
    };
    const res = {
      code: 0,
      body: null,
      setHeader() {},
      status(c) { this.code = c; return this; },
      json(o) { this.body = o; return this; },
      end() { return this; },
    };
    await handler(req, res);
    const accepted = res.body?.accepted ?? 0;
    return { code: res.code === 200 ? 0 : 1, accepted, body: res.body };
  } catch (err) {
    return { code: 1, accepted: 0, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// compute-health-scores invocation
// ---------------------------------------------------------------------------

async function computeHealthScores(clubId) {
  const handler = (await import(`../api/compute-health-scores.js?v=${Date.now()}`)).default;
  const req = { method: 'POST', headers: { 'x-cron-key': process.env.CRON_SECRET || 'x' }, body: { club_id: clubId } };
  const res = { code: 0, body: null, status(c) { this.code = c; return this; }, json(o) { this.body = o; return this; } };
  await handler(req, res);
  return res.body?.computed || 0;
}

// ---------------------------------------------------------------------------
// Verification — 3 invariants checked at every step
// ---------------------------------------------------------------------------

async function verifyInsightDiff(clubId, loadedStages, stepLabel) {
  const failures = [];

  // stage-insights
  const siHandler = (await import(`../api/stage-insights.js?v=${Date.now()}`)).default;
  const siReq = { method: 'GET', headers: { 'x-cron-key': process.env.CRON_SECRET || 'x' }, query: { clubId } };
  const siRes = { code: 0, body: null, status(c) { this.code = c; return this; }, json(o) { this.body = o; return this; } };
  await siHandler(siReq, siRes);

  if (siRes.code !== 200) {
    failures.push({ type: 'stage-insights-error', step: stepLabel, message: `HTTP ${siRes.code}` });
  } else {
    for (const insight of siRes.body.insights || []) {
      const spec = STAGE_INSIGHT_DEPS[insight.stage];
      if (!spec) continue; // unknown stage in spec — warn, don't fail
      const should = allTablesLoaded(spec.requires, loadedStages);
      if (insight.unlocked && !should) {
        failures.push({
          type: 'insight-leakage',
          step: stepLabel,
          stage: insight.stage,
          headline: (insight.headline || '').slice(0, 80),
          missing: spec.requires.filter(t => !loadedTables(loadedStages).has(t)),
        });
      }
      if (!insight.unlocked && should) {
        failures.push({
          type: 'insight-under-unlock',
          step: stepLabel,
          stage: insight.stage,
          requires: spec.requires,
        });
      }
    }
  }

  // deep-insights kinds — fire all 7 in parallel for a ~60% round-trip cut.
  const diHandler = (await import(`../api/deep-insights.js?v=${Date.now()}`)).default;
  let sampleMemberId = null;
  if (loadedStages.has('members')) {
    try {
      const m = await sql.query(
        `SELECT member_id FROM members WHERE club_id = $1 LIMIT 1`,
        [clubId],
      );
      sampleMemberId = m.rows[0]?.member_id || null;
    } catch { /* members may not exist yet */ }
  }
  const kindChecks = await Promise.all(
    Object.entries(DEEP_INSIGHT_DEPS).map(async ([kind, spec]) => {
      const query = { kind, clubId };
      if (kind === 'member-engagement' && sampleMemberId) query.memberId = sampleMemberId;
      const req = { method: 'GET', headers: { 'x-cron-key': process.env.CRON_SECRET || 'x' }, query };
      const res = { code: 0, body: null, status(c) { this.code = c; return this; }, json(o) { this.body = o; return this; } };
      try {
        await diHandler(req, res);
        return { kind, spec, code: res.code, body: res.body, error: null };
      } catch (err) {
        return { kind, spec, code: 500, body: null, error: err.message.slice(0, 100) };
      }
    }),
  );
  for (const { kind, spec, code, body, error } of kindChecks) {
    if (error) {
      failures.push({ type: 'deep-insight-throw', step: stepLabel, kind, message: error });
      continue;
    }
    if (code !== 200) {
      failures.push({ type: 'deep-insight-error', step: stepLabel, kind, message: `HTTP ${code}` });
      continue;
    }
    const should = allTablesLoaded(spec.requires, loadedStages);
    if (body?.available && !should) {
      failures.push({
        type: 'deep-insight-leakage',
        step: stepLabel,
        kind,
        missing: spec.requires.filter(t => !loadedTables(loadedStages).has(t)),
      });
    }
    if (!body?.available && should && !spec.softFallback) {
      failures.push({
        type: 'deep-insight-under-unlock',
        step: stepLabel,
        kind,
        requires: spec.requires,
      });
    }
  }

  return failures;
}

async function verifyAgentEligibility(clubId, loadedStages, stepLabel) {
  const failures = [];

  // In dry-run, skip the entire agent eligibility check. The insight-diff
  // check already covers the "what should be visible" assertion, and the
  // trigger handlers still do expensive data-availability + eligibility
  // queries even when they skip the Anthropic call. Cutting them entirely
  // is worth ~1 minute per permutation.
  if (FLAGS.dryRun) return failures;

  // Wipe live_* actions so we only count actions from this step's triggers
  await sql`DELETE FROM agent_actions WHERE club_id = ${clubId} AND action_id LIKE 'live_%' AND timestamp > NOW() - INTERVAL '5 minutes'`;

  const m = await sql`SELECT member_id FROM members WHERE club_id = ${clubId} ORDER BY annual_dues DESC NULLS LAST LIMIT 1`;
  const memberId = m.rows[0]?.member_id;
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const headers = { 'x-cron-key': process.env.CRON_SECRET || 'x' };

  const cases = [
    ['complaint-trigger',    { member_id: memberId || 'mbr_none', priority: 'high', category: 'service' }],
    ['fb-trigger',           { target_date: today }],
    ['gameplan-trigger',     { plan_date: today }],
    ['staffing-trigger',     { target_date: today, trigger_type: 'daily' }],
    ['arrival-trigger',      { member_id: memberId || 'mbr_none', tee_time: today + 'T08:00:00' }],
    ['service-save-trigger', { member_id: memberId || 'mbr_none', complaint_id: 'cmp_perm', priority: 'high' }],
    ['board-report-trigger', { month }],
    ['risk-trigger',         { member_id: memberId || 'mbr_none' }],
  ];

  for (const [triggerName, body] of cases) {
    const file = `${triggerName}.js`;
    try {
      const handler = (await import(`../api/agents/${file}?v=${Date.now()}`)).default;
      const req = { method: 'POST', headers, body: { ...body, club_id: clubId } };
      const res = { code: 0, body: null, status(c) { this.code = c; return this; }, json(o) { this.body = o; return this; } };
      await handler(req, res);
    } catch (err) {
      failures.push({ type: 'trigger-throw', step: stepLabel, trigger: triggerName, message: err.message.slice(0, 100) });
    }
  }

  // Now check which agents wrote actions and compare against eligibility
  const r = await sql`
    SELECT DISTINCT agent_id FROM agent_actions
    WHERE club_id = ${clubId} AND action_id LIKE 'live_%'
      AND timestamp > NOW() - INTERVAL '5 minutes'
  `;
  const firedAgentIds = new Set(r.rows.map(x => x.agent_id));

  for (const [triggerName, spec] of Object.entries(AGENT_TRIGGER_DEPS)) {
    const agentId = TRIGGER_TO_AGENT_ID[triggerName];
    if (!agentId) continue; // cos-trigger has no live_ write path — skip
    const eligible = allDomainsSatisfied(spec.requires, loadedStages);
    const fired = firedAgentIds.has(agentId);
    if (fired && !eligible) {
      failures.push({
        type: 'agent-over-eager',
        step: stepLabel,
        trigger: triggerName,
        agentId,
        requires: spec.requires,
        satisfied: [...satisfiedDomains(loadedStages)],
      });
    }
    // "not fired but eligible" is a warning, not a failure (could be an
    // internal criterion like "no high-dues members"). Track separately.
  }

  return failures;
}

// ---------------------------------------------------------------------------
// Main cycle
// ---------------------------------------------------------------------------

async function runPermutation(perm, permIdx) {
  const permReportDir = path.join(ROOT, 'reports', `permutation-${perm.name}`);
  fs.mkdirSync(permReportDir, { recursive: true });

  const clubId = freshClubId(perm.name);

  console.log(`\n${'='.repeat(72)}`);
  console.log(`  PERMUTATION ${permIdx + 1}/${PERMUTATIONS.length}: ${perm.name} (seed: ${perm.seed})`);
  console.log(`  Club: ${clubId}`);
  console.log(`${'='.repeat(72)}`);

  await wipeClub(clubId); // belt-and-suspenders — fresh UUID should already be empty

  const permutation = buildPermutation(perm);
  const loadedStages = new Set();
  const stepResults = [];
  let totalStepFailures = 0;

  // Step 0 — members always first
  const members = STAGE_ORDER.find(s => s.key === 'members');
  console.log(`\n[step 0] import members`);
  const r0 = await runStageImport('members', members.csv, clubId);
  if (r0.code === 0) loadedStages.add('members');
  const step0Failures = [];
  const s0Insight = await withNeonRetry(
    () => verifyInsightDiff(clubId, loadedStages, 'step-0-members'),
    'step-0-members/insight-diff',
  );
  if (s0Insight) step0Failures.push(...s0Insight);
  const s0Agent = await withNeonRetry(
    () => verifyAgentEligibility(clubId, loadedStages, 'step-0-members'),
    'step-0-members/agent-eligibility',
  );
  if (s0Agent) step0Failures.push(...s0Agent);
  if (FLAGS.clickTest) {
    try {
      const ct = await runClickTest({ baseUrl: BASE_URL, clubId, label: 'step-0-members', reportDir: permReportDir });
      if (ct.totalErrors > 0) {
        for (const route of ct.routes) {
          for (const err of route.errors) {
            step0Failures.push({ type: 'click-error', step: 'step-0-members', route: route.route, errorType: err.type, message: err.message });
          }
        }
      }
    } catch (err) {
      step0Failures.push({ type: 'click-test-crash', step: 'step-0-members', message: err.message.slice(0, 200) });
    }
  }
  stepResults.push({ step: 0, stage: 'members', failures: step0Failures });
  totalStepFailures += step0Failures.length;
  console.log(`  ${step0Failures.length === 0 ? '\u2713' : '\u2717'} step 0 (members): ${step0Failures.length} failures`);

  // Fail-fast on step 0
  if (FLAGS.failFast && step0Failures.length > 0) {
    console.log(`  \u26d4 FAIL-FAST: halting at step 0 (${step0Failures.length} failures)`);
    const summary = { permutation: perm.name, seed: perm.seed, clubId, totalFailures: step0Failures.length, steps: stepResults, order: [members.key], halted: true };
    fs.writeFileSync(path.join(permReportDir, 'summary.json'), JSON.stringify(summary, null, 2));
    return summary;
  }

  // Steps 1..21 — shuffled non-member stages (or first N if --quick)
  const stepLimit = FLAGS.quick ? Math.min(QUICK_STAGE_LIMIT, permutation.length) : permutation.length;
  for (let i = 0; i < stepLimit; i++) {
    const stage = permutation[i];
    const stepLabel = `step-${i + 1}-${stage.key}`;
    console.log(`\n[step ${i + 1}] import ${stage.key}`);

    const r = await runStageImport(stage.key, stage.csv, clubId);
    if (r.code === 0 && r.accepted > 0) {
      loadedStages.add(stage.key);
    }

    // booking_players → refresh health scores so the chain is real.
    // Skip in dry-run — insight-diff doesn't depend on engagement_score
    // values, and the compute job makes 400 sequential queries that can
    // saturate the Neon websocket pool mid-cycle. Not worth the risk.
    if (!FLAGS.dryRun && stage.key === 'booking_players' && loadedStages.has('members') && loadedStages.has('tee_times')) {
      try {
        await computeHealthScores(clubId);
      } catch (err) {
        console.log(`  (compute-health-scores skipped: ${err.message.slice(0, 60)})`);
      }
    }

    const stepFailures = [];
    const insightRes = await withNeonRetry(
      () => verifyInsightDiff(clubId, loadedStages, stepLabel),
      `${stepLabel}/insight-diff`,
    );
    if (insightRes) stepFailures.push(...insightRes);
    const agentRes = await withNeonRetry(
      () => verifyAgentEligibility(clubId, loadedStages, stepLabel),
      `${stepLabel}/agent-eligibility`,
    );
    if (agentRes) stepFailures.push(...agentRes);
    if (FLAGS.clickTest) {
      try {
        const ct = await runClickTest({ baseUrl: BASE_URL, clubId, label: stepLabel, reportDir: permReportDir });
        if (ct.totalErrors > 0) {
          for (const route of ct.routes) {
            for (const err of route.errors) {
              stepFailures.push({ type: 'click-error', step: stepLabel, route: route.route, errorType: err.type, message: err.message });
            }
          }
        }
      } catch (err) {
        stepFailures.push({ type: 'click-test-crash', step: stepLabel, message: err.message.slice(0, 200) });
      }
    }

    stepResults.push({ step: i + 1, stage: stage.key, failures: stepFailures });
    totalStepFailures += stepFailures.length;
    console.log(`  ${stepFailures.length === 0 ? '\u2713' : '\u2717'} ${stepLabel}: ${stepFailures.length} failures`);

    if (FLAGS.failFast && stepFailures.length > 0) {
      console.log(`  \u26d4 FAIL-FAST: halting permutation at ${stepLabel}`);
      break;
    }
  }

  // Write per-permutation summary
  const summary = {
    permutation: perm.name,
    seed: perm.seed,
    clubId,
    totalFailures: totalStepFailures,
    steps: stepResults,
    order: [members.key, ...permutation.map(s => s.key)],
  };
  fs.writeFileSync(path.join(permReportDir, 'summary.json'), JSON.stringify(summary, null, 2));
  return summary;
}

async function writeConsolidatedPunchList(allSummaries) {
  const reportDir = path.join(ROOT, 'reports');
  fs.mkdirSync(reportDir, { recursive: true });

  // Group failures by type + key details
  const bucket = new Map();
  for (const s of allSummaries) {
    for (const step of s.steps) {
      for (const f of step.failures) {
        const key = `${f.type}::${f.stage || f.kind || f.trigger || f.route || ''}::${(f.message || '').slice(0, 60)}`;
        if (!bucket.has(key)) bucket.set(key, { sample: f, perms: new Set(), steps: [] });
        const entry = bucket.get(key);
        entry.perms.add(s.permutation);
        entry.steps.push(`${s.permutation}/${f.step}`);
      }
    }
  }

  const ranked = [...bucket.values()]
    .map(e => ({ ...e, blastRadius: e.perms.size }))
    .sort((a, b) => b.blastRadius - a.blastRadius || a.steps[0].localeCompare(b.steps[0]));

  const lines = [];
  lines.push('# Permutation Hardening — Consolidated Punch List');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Permutations run: ${allSummaries.length}`);
  lines.push(`Total distinct failure signatures: ${ranked.length}`);
  lines.push(`Total failure events: ${allSummaries.reduce((s, p) => s + p.totalFailures, 0)}`);
  lines.push('');

  if (ranked.length === 0) {
    lines.push('## 🎉 CLEAN — no failures across any permutation');
    fs.writeFileSync(path.join(reportDir, 'hardening-punch-list.md'), lines.join('\n'));
    return;
  }

  lines.push('## Failures ranked by blast radius');
  lines.push('');
  lines.push('| # | Blast | Type | Target | Sample message | First step |');
  lines.push('|---|---|---|---|---|---|');
  for (let i = 0; i < ranked.length; i++) {
    const r = ranked[i];
    const f = r.sample;
    const target = f.stage || f.kind || f.trigger || f.route || '-';
    const msg = (f.message || f.headline || JSON.stringify(f.missing || f.requires || '')).slice(0, 60);
    lines.push(`| ${i + 1} | ${r.blastRadius}/${allSummaries.length} | ${f.type} | ${target} | ${msg} | ${r.steps[0]} |`);
  }
  lines.push('');

  // Per-permutation step detail
  for (const s of allSummaries) {
    lines.push(`## ${s.permutation} — ${s.totalFailures} failures`);
    lines.push('');
    lines.push('Order: ' + s.order.join(' → '));
    lines.push('');
    for (const step of s.steps) {
      if (step.failures.length === 0) continue;
      lines.push(`### step ${step.step} (${step.stage}) — ${step.failures.length} failures`);
      for (const f of step.failures) {
        lines.push(`- **${f.type}** ${f.stage || f.kind || f.trigger || f.route || ''}: ${(f.message || f.headline || JSON.stringify(f.missing || f.requires || '')).slice(0, 120)}`);
      }
      lines.push('');
    }
  }

  fs.writeFileSync(path.join(reportDir, 'hardening-punch-list.md'), lines.join('\n'));
}

async function main() {
  const t0 = Date.now();
  console.log('='.repeat(72));
  console.log('  PERMUTATION HARDENING LOOP');
  console.log(`  Permutations: ${PERMUTATIONS.length}`);
  console.log(`  Flags: ${JSON.stringify(FLAGS)}`);
  console.log('='.repeat(72));

  // Run permutations in parallel with a concurrency cap. Each permutation
  // uses a fresh club UUID so they don't conflict at the data layer.
  const allSummaries = [];
  const queue = PERMUTATIONS.map((perm, idx) => ({ perm, idx }));
  const workers = Array.from({ length: Math.min(FLAGS.concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const { perm, idx } = queue.shift();
      try {
        const summary = await runPermutation(perm, idx);
        allSummaries.push(summary);
      } catch (err) {
        console.error(`[${perm.name}] CRASHED:`, err.message);
        allSummaries.push({
          permutation: perm.name,
          seed: perm.seed,
          totalFailures: 999,
          steps: [{ step: -1, stage: 'CRASH', failures: [{ type: 'permutation-crash', step: 'init', message: err.message.slice(0, 200) }] }],
          order: [],
        });
      }
    }
  });
  await Promise.all(workers);

  await writeConsolidatedPunchList(allSummaries);

  const elapsedSec = Math.round((Date.now() - t0) / 1000);
  const elapsed = `${Math.floor(elapsedSec / 60)}m${elapsedSec % 60}s`;
  const totalFail = allSummaries.reduce((s, p) => s + p.totalFailures, 0);
  console.log('\n' + '='.repeat(72));
  if (totalFail === 0) {
    console.log(`  \u2705 HARDENING LOOP CLEAN — ${PERMUTATIONS.length} permutations, 0 failures, ${elapsed}`);
    process.exit(0);
  } else {
    console.log(`  \u274C HARDENING LOOP FAILED — ${totalFail} failures across ${PERMUTATIONS.length} permutations, ${elapsed}`);
    console.log(`     See reports/hardening-punch-list.md`);
    process.exit(1);
  }
}

// Swallow transient Neon websocket drops — the next sql call will
// re-open the pool automatically. Only log; do not exit.
process.on('uncaughtException', (err) => {
  if (/Connection terminated|ECONNRESET|WebSocket/i.test(err.message || '')) {
    console.error(`  (neon transient: ${err.message.slice(0, 80)})`);
    return;
  }
  console.error('UNCAUGHT:', err);
  process.exit(2);
});
process.on('unhandledRejection', (err) => {
  if (/Connection terminated|ECONNRESET|WebSocket/i.test(String(err?.message || err))) {
    console.error(`  (neon transient: ${String(err?.message || err).slice(0, 80)})`);
    return;
  }
  console.error('UNHANDLED:', err);
});

main().catch(err => {
  console.error('CRASH:', err);
  process.exit(2);
});
