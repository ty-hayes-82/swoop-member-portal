#!/usr/bin/env node
/**
 * End-to-End Onboarding Flow Test
 *
 * Tests the complete pipeline:
 * 1. Create club + admin user
 * 2. Login
 * 3. Import members CSV
 * 4. Import rounds CSV
 * 5. Import transactions CSV
 * 6. Import complaints CSV
 * 7. Compute health scores
 * 8. Validate session
 * 9. Check onboarding progress
 *
 * Usage:
 *   node scripts/test-onboarding-e2e.mjs [base-url]
 *
 * Default base URL: https://swoop-member-portal-production-readiness.vercel.app
 */

const BASE_URL = process.argv[2] || 'https://swoop-member-portal-production-readiness.vercel.app';
const TIMESTAMP = Date.now();
const TEST_CLUB_NAME = `E2E Test Club ${TIMESTAMP}`;
const TEST_EMAIL = `e2e-test-${TIMESTAMP}@swoopgolf.com`;
const TEST_PASSWORD = 'TestPass123!';

let token = null;
let clubId = null;
let userId = null;
let passed = 0;
let failed = 0;
const results = [];

function log(status, step, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${step}${detail ? ` — ${detail}` : ''}`);
  results.push({ status, step, detail });
  if (status === 'PASS') passed++;
  if (status === 'FAIL') failed++;
}

async function apiCall(method, path, body = null, headers = {}) {
  const url = `${BASE_URL}${path}`;
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    return { status: 0, ok: false, data: { error: err.message } };
  }
}

// ─── STEP 1: Create Club ───────────────────────────────────────
async function step1_createClub() {
  const res = await apiCall('POST', '/api/onboard-club', {
    clubName: TEST_CLUB_NAME,
    city: 'Bowling Green',
    state: 'KY',
    zip: '42101',
    memberCount: 300,
    courseCount: 1,
    outletCount: 5,
    adminEmail: TEST_EMAIL,
    adminName: 'E2E Test Admin',
    adminPassword: TEST_PASSWORD,
  });

  if (res.status === 201 && res.data?.clubId) {
    clubId = res.data.clubId;
    userId = res.data.userId;
    log('PASS', 'Step 1: Create club', `clubId=${clubId}, userId=${userId}`);
  } else {
    log('FAIL', 'Step 1: Create club', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
  }
}

// ─── STEP 2: Login ─────────────────────────────────────────────
async function step2_login() {
  if (!clubId) return log('FAIL', 'Step 2: Login', 'Skipped — no clubId');

  const res = await apiCall('POST', '/api/auth', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (res.ok && res.data?.token) {
    token = res.data.token;
    log('PASS', 'Step 2: Login', `token=${token.slice(0, 8)}..., role=${res.data.user?.role}`);

    // Verify user object
    const user = res.data.user;
    if (user?.clubId !== clubId) {
      log('WARN', 'Step 2: Login (club match)', `Expected ${clubId}, got ${user?.clubId}`);
    }
  } else {
    log('FAIL', 'Step 2: Login', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
  }
}

// ─── STEP 3: Import Members ────────────────────────────────────
async function step3_importMembers() {
  if (!token) return log('FAIL', 'Step 3: Import members', 'Skipped — no token');

  const members = [];
  for (let i = 1; i <= 20; i++) {
    members.push({
      first_name: `TestMember${i}`,
      last_name: `Lastname${i}`,
      email: `member${i}@testclub.com`,
      membership_type: i <= 10 ? 'Full Golf' : 'Social',
      annual_dues: i <= 10 ? 12000 : 6000,
      join_date: `2024-0${Math.min(9, Math.ceil(i / 3))}-${String(i).padStart(2, '0')}`,
      status: 'active',
    });
  }

  const res = await apiCall('POST', '/api/import-csv', {
    importType: 'members',
    rows: members,
  }, { Authorization: `Bearer ${token}` });

  if (res.ok && res.data?.success >= 18) {
    log('PASS', 'Step 3: Import members', `${res.data.success}/${res.data.totalRows} imported`);
  } else {
    log('FAIL', 'Step 3: Import members', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
  }
}

// ─── STEP 4: Import Rounds ─────────────────────────────────────
async function step4_importRounds() {
  if (!token) return log('FAIL', 'Step 4: Import rounds', 'Skipped — no token');

  const rounds = [];
  for (let i = 1; i <= 40; i++) {
    const memberId = `mbr_${TIMESTAMP}_${((i - 1) % 20) + 1}`;
    const dayOffset = Math.floor(i / 2);
    const date = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);
    rounds.push({
      member_id: memberId,
      round_date: date.toISOString().split('T')[0],
      tee_time: `${8 + (i % 6)}:${i % 2 === 0 ? '00' : '30'}`,
      duration_minutes: 220 + Math.floor(Math.random() * 40),
      players: Math.ceil(Math.random() * 4),
    });
  }

  const res = await apiCall('POST', '/api/import-csv', {
    importType: 'rounds',
    rows: rounds,
  }, { Authorization: `Bearer ${token}` });

  if (res.ok) {
    log('PASS', 'Step 4: Import rounds', `${res.data?.success || '?'}/${res.data?.totalRows || '?'} imported`);
  } else {
    log('FAIL', 'Step 4: Import rounds', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
  }
}

// ─── STEP 5: Import Transactions ───────────────────────────────
async function step5_importTransactions() {
  if (!token) return log('FAIL', 'Step 5: Import transactions', 'Skipped — no token');

  const transactions = [];
  const outlets = ['Grill Room', 'The Terrace', 'Pool Bar', 'Pro Shop', 'Main Dining'];
  for (let i = 1; i <= 60; i++) {
    const dayOffset = Math.floor(i / 3);
    const date = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);
    transactions.push({
      member_id: `mbr_${TIMESTAMP}_${((i - 1) % 20) + 1}`,
      transaction_date: date.toISOString().split('T')[0],
      total_amount: 15 + Math.floor(Math.random() * 85),
      outlet_name: outlets[i % outlets.length],
      category: i % 3 === 0 ? 'beverage' : 'food',
      item_count: 1 + Math.floor(Math.random() * 4),
    });
  }

  const res = await apiCall('POST', '/api/import-csv', {
    importType: 'transactions',
    rows: transactions,
  }, { Authorization: `Bearer ${token}` });

  if (res.ok) {
    log('PASS', 'Step 5: Import transactions', `${res.data?.success || '?'}/${res.data?.totalRows || '?'} imported`);
  } else {
    log('FAIL', 'Step 5: Import transactions', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
  }
}

// ─── STEP 6: Import Complaints ─────────────────────────────────
async function step6_importComplaints() {
  if (!token) return log('FAIL', 'Step 6: Import complaints', 'Skipped — no token');

  const complaints = [
    { category: 'Pace of Play', description: 'Slow play on back nine', priority: 'high' },
    { category: 'Food Quality', description: 'Burger was cold at Grill Room', member_id: `mbr_${TIMESTAMP}_3` },
    { category: 'Staff', description: 'Rude bartender at Pool Bar', priority: 'medium' },
    { category: 'Maintenance', description: 'Bunker not raked on hole 7', status: 'resolved' },
    { category: 'Pace of Play', description: 'Fivesome not broken up', priority: 'high', member_id: `mbr_${TIMESTAMP}_8` },
  ];

  const res = await apiCall('POST', '/api/import-csv', {
    importType: 'complaints',
    rows: complaints,
  }, { Authorization: `Bearer ${token}` });

  if (res.ok) {
    log('PASS', 'Step 6: Import complaints', `${res.data?.success || '?'}/${res.data?.totalRows || '?'} imported`);
  } else {
    log('FAIL', 'Step 6: Import complaints', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
  }
}

// ─── STEP 7: Compute Health Scores ─────────────────────────────
async function step7_computeHealthScores() {
  if (!token || !clubId) return log('FAIL', 'Step 7: Compute health scores', 'Skipped — no token/clubId');

  const res = await apiCall('POST', `/api/compute-health-scores?clubId=${clubId}`, null, {
    Authorization: `Bearer ${token}`,
  });

  if (res.ok && res.data?.computed > 0) {
    log('PASS', 'Step 7: Compute health scores', `${res.data.computed} members scored, ${res.data.alerts || 0} alerts`);
  } else if (res.ok && res.data?.computed === 0) {
    log('WARN', 'Step 7: Compute health scores', 'Zero members computed — member_id mismatch?');
  } else {
    log('FAIL', 'Step 7: Compute health scores', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
  }
}

// ─── STEP 8: Validate Session ──────────────────────────────────
async function step8_validateSession() {
  if (!token) return log('FAIL', 'Step 8: Validate session', 'Skipped — no token');

  const res = await apiCall('GET', '/api/auth', null, {
    Authorization: `Bearer ${token}`,
  });

  if (res.ok && res.data?.user) {
    const u = res.data.user;
    log('PASS', 'Step 8: Validate session', `user=${u.name}, role=${u.role}, club=${u.clubId}`);
  } else {
    log('FAIL', 'Step 8: Validate session', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
  }
}

// ─── STEP 9: Check Onboarding Progress ─────────────────────────
async function step9_checkOnboarding() {
  if (!token || !clubId) return log('FAIL', 'Step 9: Onboarding progress', 'Skipped');

  const res = await apiCall('GET', `/api/onboard-club?clubId=${clubId}`, null, {
    Authorization: `Bearer ${token}`,
  });

  if (res.ok && res.data?.steps) {
    const completed = res.data.steps.filter(s => s.completed).length;
    log('PASS', 'Step 9: Onboarding progress', `${completed}/${res.data.steps.length} steps complete`);
  } else {
    log('FAIL', 'Step 9: Onboarding progress', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
  }
}

// ─── STEP 10: Fetch Members API (verify data renders) ──────────
async function step10_fetchMembers() {
  if (!token || !clubId) return log('FAIL', 'Step 10: Fetch members', 'Skipped');

  const res = await apiCall('GET', `/api/members?clubId=${clubId}`, null, {
    Authorization: `Bearer ${token}`,
  });

  const memberList = res.data?.members || res.data?.memberRoster;
  if (res.ok && Array.isArray(memberList)) {
    const count = memberList.length;
    const withScores = memberList.filter(m => m.health_score != null || m.healthScore != null).length;
    log('PASS', 'Step 10: Fetch members', `${count} members returned, ${withScores} with health scores`);
  } else if (res.ok && res.data?.total > 0) {
    log('PASS', 'Step 10: Fetch members', `${res.data.total} members (total count from API)`);
  } else {
    log('FAIL', 'Step 10: Fetch members', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
  }
}

// ─── RUN ────────────────────────────────────────────────────────
async function run() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log(' Swoop Member Portal — E2E Onboarding Flow Test');
  console.log(`═══════════════════════════════════════════════════`);
  console.log(`Base URL:  ${BASE_URL}`);
  console.log(`Test Club: ${TEST_CLUB_NAME}`);
  console.log(`Test Email: ${TEST_EMAIL}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  await step1_createClub();
  await step2_login();
  await step3_importMembers();
  await step4_importRounds();
  await step5_importTransactions();
  await step6_importComplaints();
  await step7_computeHealthScores();
  await step8_validateSession();
  await step9_checkOnboarding();
  await step10_fetchMembers();

  console.log('\n═══════════════════════════════════════════════════');
  console.log(` Results: ${passed} passed, ${failed} failed, ${results.filter(r => r.status === 'WARN').length} warnings`);
  console.log('═══════════════════════════════════════════════════\n');

  if (failed > 0) {
    console.log('FAILED STEPS:');
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  ❌ ${r.step}: ${r.detail}`));
    console.log('');
  }

  // Cleanup info
  if (clubId) {
    console.log(`Test club created: ${clubId}`);
    console.log(`To clean up: DELETE FROM club WHERE club_id = '${clubId}';`);
    console.log(`           DELETE FROM users WHERE club_id = '${clubId}';`);
    console.log(`           DELETE FROM sessions WHERE club_id = '${clubId}';`);
    console.log(`           DELETE FROM members WHERE club_id = '${clubId}';`);
    console.log(`           DELETE FROM rounds WHERE club_id = '${clubId}';`);
    console.log(`           DELETE FROM transactions WHERE club_id = '${clubId}';`);
    console.log(`           DELETE FROM complaints WHERE club_id = '${clubId}';`);
    console.log(`           DELETE FROM health_scores WHERE club_id = '${clubId}';`);
    console.log(`           DELETE FROM csv_imports WHERE club_id = '${clubId}';`);
    console.log(`           DELETE FROM onboarding_progress WHERE club_id = '${clubId}';`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

run();
