#!/usr/bin/env node
/**
 * Full QA Progressive Import Test
 * Tests all 8 phases from QA-PROGRESSIVE-IMPORT.md
 */

const BASE = process.argv[2] || 'https://swoop-member-portal-production-readiness.vercel.app';
const TS = Date.now();

let TOKEN, CLUB_ID, PASS = 0, FAIL = 0, SKIP = 0;
const results = [];

function log(phase, test, status, detail = '') {
  const icon = status === 'PASS' ? '\u2705' : status === 'FAIL' ? '\u274C' : '\u26A0\uFE0F';
  console.log(`  ${icon} ${test}${detail ? ' — ' + detail : ''}`);
  results.push({ phase, test, status, detail });
  if (status === 'PASS') PASS++;
  else if (status === 'FAIL') FAIL++;
  else SKIP++;
}

async function api(method, path, body, headers = {}) {
  const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };
  if (TOKEN) opts.headers['Authorization'] = `Bearer ${TOKEN}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, ok: res.ok };
}

// ════════════════════════════════════════
// PHASE 0: Create Club + Empty State
// ════════════════════════════════════════
async function phase0() {
  console.log('\n═══ PHASE 0: Create Club + Empty State ═══');

  // 0.1 Create club
  const club = await api('POST', '/api/onboard-club', {
    clubName: `QA Progressive ${TS}`,
    adminName: 'QA Tester',
    adminEmail: `qa-prog-${TS}@test.com`,
    adminPassword: 'TestPass123!',
    city: 'Phoenix', state: 'AZ', zip: '85001', memberCount: 50,
  });

  if (club.ok && club.data.clubId) {
    CLUB_ID = club.data.clubId;
    // Use token from onboard if available, otherwise login
    if (club.data.token) {
      TOKEN = club.data.token;
      log('0', '0.1.1 Create club + auto-login', 'PASS', `clubId=${CLUB_ID}, token=${TOKEN.slice(0, 12)}...`);
    } else {
      log('0', '0.1.1 Create club', 'PASS', `clubId=${CLUB_ID}`);
    }
  } else if (club.status === 429) {
    // Rate-limited — fall back to creating via login with a new account
    log('0', '0.1.1 Create club', 'SKIP', 'Rate-limited. Retrying with fresh timestamp...');
    // Try logging in with previously created QA account
    const fallbackEmail = process.argv[3] || `qa-prog-${TS}@test.com`;
    const fallbackPass = 'TestPass123!';
    const login = await api('POST', '/api/auth', { email: fallbackEmail, password: fallbackPass });
    if (login.ok && login.data.token) {
      TOKEN = login.data.token;
      CLUB_ID = login.data.user.clubId;
      log('0', '0.1.1 Fallback login', 'PASS', `Reusing club=${CLUB_ID}`);
    } else {
      log('0', '0.1.1 Create club', 'FAIL', `Rate-limited AND no fallback account. Provide email as 3rd arg.`);
      return false;
    }
  } else {
    log('0', '0.1.1 Create club', 'FAIL', JSON.stringify(club.data).slice(0, 100));
    return false;
  }

  // 0.1.2 Login (if no token from onboard)
  if (!TOKEN) {
    const login = await api('POST', '/api/auth', {
      email: `qa-prog-${TS}@test.com`, password: 'TestPass123!',
    });
    if (login.ok && login.data.token) {
      TOKEN = login.data.token;
      log('0', '0.1.2 Login', 'PASS', `token=${TOKEN.slice(0, 12)}...`);
    } else {
      log('0', '0.1.2 Login', 'FAIL', JSON.stringify(login.data).slice(0, 100));
      return false;
    }
  } else {
    // Verify session works with the onboard token
    const session = await api('GET', '/api/auth');
    log('0', '0.1.2 Session from onboard token', session.ok ? 'PASS' : 'FAIL',
      session.ok ? `user=${session.data.user?.name}` : `status=${session.status}`);
  }

  // 0.1.3 Validate session
  const session = await api('GET', '/api/auth');
  log('0', '0.1.3 Validate session', session.ok ? 'PASS' : 'FAIL',
    session.ok ? `user=${session.data.user?.name}` : `status=${session.status}`);

  // 0.2 Empty state checks
  const members = await api('GET', '/api/members');
  const roster = members.data?.memberRoster || [];
  const total = members.data?.total ?? members.data?.memberSummary?.total ?? -1;
  log('0', '0.2.1 Members API (empty)', members.ok && total === 0 ? 'PASS' : 'FAIL',
    `total=${total}, roster=${roster.length}`);

  const dash = await api('GET', `/api/dashboard-live?clubId=${CLUB_ID}`);
  log('0', '0.2.2 Dashboard (empty)', dash.ok ? 'PASS' : 'FAIL',
    `totalMembers=${dash.data?.totalMembers ?? '-'}`);

  const notif = await api('GET', `/api/notifications?clubId=${CLUB_ID}&unreadOnly=true`);
  log('0', '0.2.3 Notifications (empty)', notif.ok ? 'PASS' : 'FAIL',
    `count=${notif.data?.notifications?.length ?? '-'}`);

  return true;
}

// ════════════════════════════════════════
// PHASE 1: Import Members
// ════════════════════════════════════════
async function phase1() {
  console.log('\n═══ PHASE 1: Import 55 Members ═══');

  const firstNames = ['James','Sarah','Michael','Emily','David','Jessica','Robert','Ashley','William','Stephanie','John','Jennifer','Thomas','Amanda','Chris','Lisa','Daniel','Nicole','Matthew','Rachel'];
  const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Anderson','Taylor','Thomas','Moore','Jackson','Martin','Lee','Thompson','White','Harris','Clark'];
  const tiers = ['FG','SOC','SPT','JR'];

  const rows = [];
  for (let i = 1; i <= 55; i++) {
    const fn = firstNames[i % 20];
    const ln = lastNames[i % 20];
    // Make some members recently joined for "New Member" archetype
    const joinMonth = (i % 12) + 1;
    const joinYear = i <= 5 ? 2026 : 2024; // 5 new members
    rows.push({
      first_name: fn, last_name: ln,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}.${i}@test.com`,
      phone: `555-01${String(i).padStart(2, '0')}`,
      membership_type: tiers[i % 4],
      annual_dues: 8000 + i * 200,
      join_date: `${joinYear}-${String(joinMonth).padStart(2, '0')}-15`,
      external_id: `ext_${i}`,
    });
  }

  const imp = await api('POST', '/api/import-csv', {
    clubId: CLUB_ID, importType: 'members', rows, uploadedBy: 'qa-test',
  });
  log('1', '1.1 Import 55 members', imp.ok && imp.data.success === 55 ? 'PASS' : 'FAIL',
    `success=${imp.data?.success}, errors=${imp.data?.errors}`);

  // Verify members appear
  const members = await api('GET', '/api/members');
  const total = members.data?.total ?? members.data?.memberRoster?.length ?? 0;
  log('1', '1.2 Members API shows roster', total >= 55 ? 'PASS' : 'FAIL',
    `total=${total}`);

  // Verify search
  const search = await api('GET', `/api/search?q=James&clubId=${CLUB_ID}`);
  log('1', '1.3 Search finds "James"', search.ok && search.data?.results?.length > 0 ? 'PASS' : 'FAIL',
    `results=${search.data?.results?.length ?? 0}`);

  return true;
}

// ════════════════════════════════════════
// PHASE 2: Import Rounds
// ════════════════════════════════════════
async function phase2() {
  console.log('\n═══ PHASE 2: Import 220 Rounds ═══');

  const rows = [];
  for (let i = 1; i <= 220; i++) {
    const memberId = `${CLUB_ID}_ext_${(i % 55) + 1}`;
    const daysAgo = i % 90;
    const d = new Date(2026, 3, 5); // April 5, 2026
    d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().slice(0, 10);
    rows.push({
      member_id: memberId,
      round_date: dateStr,
      tee_time: `${6 + (i % 10)}:${String((i * 7) % 60).padStart(2, '0')}`,
      course_id: 'main',
      duration_minutes: 200 + (i % 80),
      players: 2 + (i % 3),
    });
  }

  const imp = await api('POST', '/api/import-csv', {
    clubId: CLUB_ID, importType: 'rounds', rows, uploadedBy: 'qa-test',
  });
  log('2', '2.1 Import 220 rounds', imp.ok && imp.data.success === 220 ? 'PASS' : 'FAIL',
    `success=${imp.data?.success}, errors=${imp.data?.errors}`);

  return true;
}

// ════════════════════════════════════════
// PHASE 3: Import Transactions
// ════════════════════════════════════════
async function phase3() {
  console.log('\n═══ PHASE 3: Import 550 Transactions ═══');

  const outlets = ['Grill Room','Terrace','Pool Bar','Halfway House','Banquet'];
  const rows = [];
  for (let i = 1; i <= 550; i++) {
    const memberId = `${CLUB_ID}_ext_${(i % 55) + 1}`;
    const daysAgo = i % 90;
    const d = new Date(2026, 3, 5);
    d.setDate(d.getDate() - daysAgo);
    rows.push({
      member_id: memberId,
      transaction_date: d.toISOString().slice(0, 10),
      total_amount: Math.round((15 + Math.random() * 165) * 100) / 100,
      outlet_name: outlets[i % 5],
      category: 'dining',
    });
  }

  const imp = await api('POST', '/api/import-csv', {
    clubId: CLUB_ID, importType: 'transactions', rows, uploadedBy: 'qa-test',
  });
  log('3', '3.1 Import 550 transactions', imp.ok && imp.data.success === 550 ? 'PASS' : 'FAIL',
    `success=${imp.data?.success}, errors=${imp.data?.errors}`);

  return true;
}

// ════════════════════════════════════════
// PHASE 4: Import Complaints
// ════════════════════════════════════════
async function phase4() {
  console.log('\n═══ PHASE 4: Import 25 Complaints ═══');

  const cats = ['Food Quality','Service Speed','Facility Maintenance','Staff Attitude','Booking Issues'];
  const descs = ['Cold food served','30 min wait for drinks','Broken AC in dining room','Rude valet staff','Tee time double-booked',
    'Overcharged on statement','Loud music','Dirty restrooms','Slow pace','Wrong order','Parking pothole',
    'Defective item','Setup wrong','Chemicals strong','Cart path','Missing reservation','Stale bread',
    'Leaking faucet','Starter late','Cold soup','No towels','WiFi down','Caddie no-show','Wrong wine','Greens unmowed'];
  const statuses = ['open','in_progress','in_progress','resolved','open'];

  const rows = [];
  for (let i = 0; i < 25; i++) {
    const daysAgo = (i * 3) % 60;
    const d = new Date(2026, 3, 5);
    d.setDate(d.getDate() - daysAgo);
    rows.push({
      member_id: `${CLUB_ID}_ext_${(i % 55) + 1}`,
      category: cats[i % 5],
      description: descs[i],
      status: statuses[i % 5],
      priority: i < 5 ? 'high' : 'medium',
      reported_at: d.toISOString(),
    });
  }

  const imp = await api('POST', '/api/import-csv', {
    clubId: CLUB_ID, importType: 'complaints', rows, uploadedBy: 'qa-test',
  });
  log('4', '4.1 Import 25 complaints', imp.ok && imp.data.success === 25 ? 'PASS' : 'FAIL',
    `success=${imp.data?.success}, errors=${imp.data?.errors}`);

  return true;
}

// ════════════════════════════════════════
// PHASE 5: Import Events + Registrations
// ════════════════════════════════════════
async function phase5() {
  console.log('\n═══ PHASE 5: Import Events + Registrations ═══');

  const eventRows = [];
  const eventNames = ['Spring Gala','Member-Guest','Wine Dinner','Kids Camp','Ladies Day','Poker Night','BBQ','Trivia Night','Golf Clinic','Awards Banquet','Pool Party','New Member Welcome'];
  for (let i = 0; i < 12; i++) {
    eventRows.push({
      event_id: `evt_${i + 1}`,
      event_name: eventNames[i],
      event_type: i < 6 ? 'social' : 'sports',
      start_date: `2026-${String((i % 12) + 1).padStart(2, '0')}-15`,
      capacity: 50 + i * 10,
    });
  }

  const evtImp = await api('POST', '/api/import-csv', {
    clubId: CLUB_ID, importType: 'events', rows: eventRows, uploadedBy: 'qa-test',
  });
  log('5', '5.1 Import 12 events', evtImp.ok && evtImp.data.success === 12 ? 'PASS' : 'FAIL',
    `success=${evtImp.data?.success}, errors=${evtImp.data?.errors}${evtImp.data?.errorDetails?.[0]?.message ? ' — ' + evtImp.data.errorDetails[0].message.slice(0, 80) : ''}`);

  // Registrations
  const regRows = [];
  for (let i = 0; i < 60; i++) {
    regRows.push({
      registration_id: `reg_${i + 1}`,
      event_id: `evt_${(i % 12) + 1}`,
      member_id: `${CLUB_ID}_ext_${(i % 55) + 1}`,
      status: 'attended',
      guest_count: i % 3,
      fee_paid: 25 + (i % 4) * 25,
      registration_date: `2026-${String((i % 12) + 1).padStart(2, '0')}-10`,
    });
  }

  const regImp = await api('POST', '/api/import-csv', {
    clubId: CLUB_ID, importType: 'event_registrations', rows: regRows, uploadedBy: 'qa-test',
  });
  log('5', '5.2 Import 60 registrations', regImp.ok && regImp.data.success === 60 ? 'PASS' : 'FAIL',
    `success=${regImp.data?.success}, errors=${regImp.data?.errors}${regImp.data?.errorDetails?.[0]?.message ? ' — ' + regImp.data.errorDetails[0].message.slice(0, 80) : ''}`);

  return true;
}

// ════════════════════════════════════════
// PHASE 6: Import Email Campaigns + Events
// ════════════════════════════════════════
async function phase6() {
  console.log('\n═══ PHASE 6: Import Email Engagement ═══');

  const campaigns = [];
  const subjects = ['January Newsletter','Welcome New Members','Wine Dinner RSVP','Spring Schedule','Tee Time Deals','Member Survey','Holiday Hours','Golf Tips'];
  for (let i = 0; i < 8; i++) {
    campaigns.push({
      campaign_id: `camp_${i + 1}`,
      subject: subjects[i],
      campaign_type: i < 4 ? 'newsletter' : 'promotional',
      send_date: `2026-${String((i % 12) + 1).padStart(2, '0')}-01`,
      audience_count: 55,
    });
  }

  const campImp = await api('POST', '/api/import-csv', {
    clubId: CLUB_ID, importType: 'email_campaigns', rows: campaigns, uploadedBy: 'qa-test',
  });
  log('6', '6.1 Import 8 campaigns', campImp.ok && campImp.data.success === 8 ? 'PASS' : 'FAIL',
    `success=${campImp.data?.success}, errors=${campImp.data?.errors}${campImp.data?.errorDetails?.[0]?.message ? ' — ' + campImp.data.errorDetails[0].message.slice(0, 80) : ''}`);

  // Email events
  const emailEvents = [];
  for (let i = 0; i < 200; i++) {
    emailEvents.push({
      campaign_id: `camp_${(i % 8) + 1}`,
      member_id: `${CLUB_ID}_ext_${(i % 55) + 1}`,
      event_type: i % 4 === 0 ? 'opened' : i % 4 === 1 ? 'clicked' : 'sent',
      timestamp: `2026-${String((i % 12) + 1).padStart(2, '0')}-02T10:00:00Z`,
    });
  }

  const eeImp = await api('POST', '/api/import-csv', {
    clubId: CLUB_ID, importType: 'email_events', rows: emailEvents, uploadedBy: 'qa-test',
  });
  log('6', '6.2 Import 200 email events', eeImp.ok && eeImp.data.success === 200 ? 'PASS' : 'FAIL',
    `success=${eeImp.data?.success}, errors=${eeImp.data?.errors}${eeImp.data?.errorDetails?.[0]?.message ? ' — ' + eeImp.data.errorDetails[0].message.slice(0, 80) : ''}`);

  return true;
}

// ════════════════════════════════════════
// PHASE 7: Import Staffing
// ════════════════════════════════════════
async function phase7() {
  console.log('\n═══ PHASE 7: Import Staffing ═══');

  const staff = [];
  const depts = ['Golf','F&B','Admin','Maintenance','Pro Shop'];
  const titles = ['Server','Cook','Starter','Groundskeeper','Associate'];
  for (let i = 0; i < 20; i++) {
    staff.push({
      employee_id: `staff_${i + 1}`,
      first_name: `Employee${i + 1}`,
      last_name: `Test`,
      department: depts[i % 5],
      job_title: titles[i % 5],
      hire_date: '2024-01-15',
      hourly_rate: 15 + (i % 10),
      ft_pt: i % 3 === 0 ? 'PT' : 'FT',
    });
  }

  const staffImp = await api('POST', '/api/import-csv', {
    clubId: CLUB_ID, importType: 'staff', rows: staff, uploadedBy: 'qa-test',
  });
  log('7', '7.1 Import 20 staff', staffImp.ok && staffImp.data.success === 20 ? 'PASS' : 'FAIL',
    `success=${staffImp.data?.success}, errors=${staffImp.data?.errors}${staffImp.data?.errorDetails?.[0]?.message ? ' — ' + staffImp.data.errorDetails[0].message.slice(0, 80) : ''}`);

  // Shifts
  const shifts = [];
  for (let i = 0; i < 100; i++) {
    const daysAgo = i % 30;
    const d = new Date(2026, 3, 5);
    d.setDate(d.getDate() - daysAgo);
    shifts.push({
      shift_id: `shift_${i + 1}`,
      employee_id: `staff_${(i % 20) + 1}`,
      date: d.toISOString().slice(0, 10),
      location: depts[i % 5],
      shift_start: '08:00',
      shift_end: '16:00',
      actual_hours: 7.5 + (i % 3) * 0.5,
    });
  }

  const shiftImp = await api('POST', '/api/import-csv', {
    clubId: CLUB_ID, importType: 'shifts', rows: shifts, uploadedBy: 'qa-test',
  });
  log('7', '7.2 Import 100 shifts', shiftImp.ok && shiftImp.data.success === 100 ? 'PASS' : 'FAIL',
    `success=${shiftImp.data?.success}, errors=${shiftImp.data?.errors}${shiftImp.data?.errorDetails?.[0]?.message ? ' — ' + shiftImp.data.errorDetails[0].message.slice(0, 80) : ''}`);

  return true;
}

// ════════════════════════════════════════
// PHASE 8: Compute Health Scores + Validate
// ════════════════════════════════════════
async function phase8() {
  console.log('\n═══ PHASE 8: Health Scores + Full Validation ═══');

  // Compute health scores
  const hs = await api('POST', `/api/compute-health-scores?clubId=${CLUB_ID}`);
  log('8', '8.1 Compute health scores', hs.ok && hs.data.computed > 0 ? 'PASS' : 'FAIL',
    `computed=${hs.data?.computed}, errors=${hs.data?.errors}, alerts=${hs.data?.alerts}`);

  // Verify members now have scores
  const members = await api('GET', '/api/members');
  const atRisk = members.data?.atRiskMembers || [];
  const archTypes = members.data?.memberArchetypes || [];
  const healthDist = members.data?.healthDistribution || [];
  const summary = members.data?.memberSummary || {};

  log('8', '8.2 Health distribution populated', healthDist.length > 0 ? 'PASS' : 'FAIL',
    `levels=${healthDist.map(h => `${h.level}:${h.count}`).join(', ')}`);

  log('8', '8.3 Archetypes populated', archTypes.length > 0 ? 'PASS' : 'FAIL',
    `types=${archTypes.map(a => `${a.archetype}:${a.count}`).join(', ')}`);

  log('8', '8.4 At-risk members detected', atRisk.length > 0 ? 'PASS' : 'FAIL',
    `count=${atRisk.length}, top=${atRisk[0]?.name || '-'} (score:${atRisk[0]?.score || '-'})`);

  log('8', '8.5 Member summary', summary.total > 0 ? 'PASS' : 'FAIL',
    `total=${summary.total}, healthy=${summary.healthy}, atRisk=${summary.atRisk}, critical=${summary.critical}`);

  // Dashboard live
  const dash = await api('GET', `/api/dashboard-live?clubId=${CLUB_ID}`);
  log('8', '8.6 Dashboard live', dash.ok ? 'PASS' : 'FAIL',
    `totalMembers=${dash.data?.totalMembers}, tiers=${JSON.stringify(dash.data?.healthTiers || {})}`);

  // Staffing
  const staffing = await api('GET', `/api/staffing?clubId=${CLUB_ID}`);
  log('8', '8.7 Staffing API', staffing.ok ? 'PASS' : 'FAIL',
    `status=${staffing.status}`);

  // Operations/briefing
  const ops = await api('GET', `/api/operations?clubId=${CLUB_ID}`);
  log('8', '8.8 Operations API', ops.ok ? 'PASS' : 'FAIL',
    `status=${ops.status}`);

  // Search
  const search = await api('GET', `/api/search?q=James&clubId=${CLUB_ID}`);
  log('8', '8.9 Search "James"', search.ok && search.data?.results?.length > 0 ? 'PASS' : 'FAIL',
    `results=${search.data?.results?.length || 0}`);

  // Auth still works
  const auth = await api('GET', '/api/auth');
  log('8', '8.10 Session still valid', auth.ok ? 'PASS' : 'FAIL');

  // Onboarding progress
  const onboard = await api('GET', `/api/onboard-club?clubId=${CLUB_ID}`);
  log('8', '8.11 Onboarding progress', onboard.ok ? 'PASS' : 'FAIL',
    `progress=${onboard.data?.progress}, pct=${onboard.data?.percentComplete}%`);

  return true;
}

// ════════════════════════════════════════
// RUN ALL PHASES
// ════════════════════════════════════════
async function main() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  SWOOP GOLF — FULL QA PROGRESSIVE IMPORT TEST`);
  console.log(`  Target: ${BASE}`);
  console.log(`  Time:   ${new Date().toISOString()}`);
  console.log(`${'═'.repeat(60)}`);

  const ok0 = await phase0();
  if (!ok0) { console.log('\n\u274C Phase 0 failed — cannot continue'); return; }

  await phase1();
  await phase2();
  await phase3();
  await phase4();
  await phase5();
  await phase6();
  await phase7();
  await phase8();

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  RESULTS: ${PASS} PASS | ${FAIL} FAIL | ${SKIP} SKIP`);
  console.log(`  Club ID: ${CLUB_ID}`);
  console.log(`${'═'.repeat(60)}`);

  if (FAIL > 0) {
    console.log('\nFailed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r =>
      console.log(`  \u274C [Phase ${r.phase}] ${r.test}: ${r.detail}`)
    );
  }

  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
