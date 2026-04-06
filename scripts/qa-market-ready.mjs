#!/usr/bin/env node
/**
 * Market-Ready QA Test — Full Progressive Import + Frontend Data Validation
 *
 * Goes beyond API status checks — validates the actual data shapes that
 * the frontend components need to render correctly. If this passes,
 * the UI will show real data (not empty states) after import.
 *
 * Usage: node scripts/qa-market-ready.mjs [base-url]
 */

const BASE = process.argv[2] || 'https://swoop-member-portal-dev.vercel.app';
const TS = Date.now();

let TOKEN, CLUB_ID, PASS = 0, FAIL = 0, WARN = 0;
const results = [];

function log(phase, test, status, detail = '') {
  const icon = status === 'PASS' ? '\u2705' : status === 'FAIL' ? '\u274C' : '\u26A0\uFE0F';
  console.log(`  ${icon} ${test}${detail ? ' \u2014 ' + detail : ''}`);
  results.push({ phase, test, status, detail });
  if (status === 'PASS') PASS++;
  else if (status === 'FAIL') FAIL++;
  else WARN++;
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
// PHASE 0: Create Club
// ════════════════════════════════════════
async function phase0() {
  console.log('\n\u2550\u2550\u2550 PHASE 0: Create Club + Validate Empty State \u2550\u2550\u2550');

  const club = await api('POST', '/api/onboard-club', {
    clubName: `Market Ready ${TS}`,
    adminName: 'QA Admin',
    adminEmail: `qa-market-${TS}@test.com`,
    adminPassword: 'TestPass123!',
    city: 'Scottsdale', state: 'AZ', zip: '85255', memberCount: 50,
  });

  if (!club.ok || !club.data.clubId) {
    log('0', '0.1 Create club', 'FAIL', JSON.stringify(club.data).slice(0, 100));
    return false;
  }
  CLUB_ID = club.data.clubId;
  TOKEN = club.data.token;

  // Validate club ID is UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(CLUB_ID);
  log('0', '0.1 Create club', isUUID ? 'PASS' : 'FAIL', `clubId=${CLUB_ID} (${isUUID ? 'UUID' : 'NOT UUID'})`);

  // Validate auth response includes clubName
  log('0', '0.2 Auth returns clubName', club.data.user?.clubName ? 'PASS' : 'FAIL',
    `clubName=${club.data.user?.clubName || 'MISSING'}`);

  // Empty state checks
  const members = await api('GET', '/api/members');
  log('0', '0.3 Members API empty', members.ok && members.data?.total === 0 ? 'PASS' : 'FAIL',
    `total=${members.data?.total}`);

  const featureAvail = await api('GET', `/api/feature-availability?clubId=${CLUB_ID}`);
  log('0', '0.4 Feature availability 200 (not 401/403)', featureAvail.ok ? 'PASS' : 'FAIL',
    `status=${featureAvail.status}`);

  const notifications = await api('GET', `/api/notifications?clubId=${CLUB_ID}&unreadOnly=true`);
  log('0', '0.5 Notifications API works', notifications.ok ? 'PASS' : 'FAIL',
    `status=${notifications.status}, count=${notifications.data?.notifications?.length ?? 'ERROR'}`);

  const search = await api('GET', `/api/search?q=test&clubId=${CLUB_ID}`);
  log('0', '0.6 Search API works (empty)', search.ok ? 'PASS' : 'FAIL',
    `status=${search.status}, results=${search.data?.results?.length ?? 'ERROR'}`);

  // Reset password validation endpoint
  const resetCheck = await api('GET', '/api/reset-password?token=fake-token-12345');
  log('0', '0.7 Reset password rejects fake token', resetCheck.ok && resetCheck.data?.valid === false ? 'PASS' : 'FAIL',
    `valid=${resetCheck.data?.valid}`);

  return true;
}

// ════════════════════════════════════════
// PHASE 1: Import Members + Validate Rendering Data
// ════════════════════════════════════════
async function phase1() {
  console.log('\n\u2550\u2550\u2550 PHASE 1: Import Members + Validate Data Shapes \u2550\u2550\u2550');

  const firstNames = ['James','Sarah','Michael','Emily','David','Jessica','Robert','Ashley','William','Stephanie',
    'John','Jennifer','Thomas','Amanda','Chris','Lisa','Daniel','Nicole','Matthew','Rachel'];
  const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Anderson',
    'Taylor','Thomas','Moore','Jackson','Martin','Lee','Thompson','White','Harris','Clark'];

  const rows = [];
  for (let i = 1; i <= 55; i++) {
    const joinYear = i <= 5 ? 2026 : 2024;
    rows.push({
      first_name: firstNames[i % 20], last_name: lastNames[i % 20],
      email: `${firstNames[i % 20].toLowerCase()}.${lastNames[i % 20].toLowerCase()}.${TS}_${i}@test.com`,
      phone: `555-01${String(i).padStart(2, '0')}`,
      membership_type: ['FG', 'SOC', 'SPT', 'JR'][i % 4],
      annual_dues: 8000 + i * 200,
      join_date: `${joinYear}-${String((i % 12) + 1).padStart(2, '0')}-15`,
      external_id: `ext_${i}`,
    });
  }

  const imp = await api('POST', '/api/import-csv', { clubId: CLUB_ID, importType: 'members', rows, uploadedBy: 'qa-test' });
  log('1', '1.1 Import 55 members', imp.ok && imp.data.success === 55 ? 'PASS' : 'FAIL',
    `success=${imp.data?.success}, errors=${imp.data?.errors}`);

  // Validate members API returns proper data shape for frontend
  const members = await api('GET', '/api/members');
  const roster = members.data?.memberRoster || [];
  log('1', '1.2 memberRoster is array with data', Array.isArray(roster) && roster.length === 55 ? 'PASS' : 'FAIL',
    `roster.length=${roster.length}`);

  // Check roster has required fields for AllMembersView
  if (roster.length > 0) {
    const m = roster[0];
    const hasFields = m.memberId && m.name && (m.tier || m.archetype !== undefined);
    log('1', '1.3 Roster records have required fields', hasFields ? 'PASS' : 'FAIL',
      `fields: memberId=${!!m.memberId}, name=${!!m.name}, tier=${m.tier}, archetype=${m.archetype}`);
  }

  // Validate memberSummary shape
  const summary = members.data?.memberSummary;
  log('1', '1.4 memberSummary has totalMembers', summary?.total >= 55 ? 'PASS' : 'FAIL',
    `total=${summary?.total}, totalMembers=${summary?.totalMembers}`);

  // Search works after import
  const search = await api('GET', `/api/search?q=James&clubId=${CLUB_ID}`);
  log('1', '1.5 Search finds imported members', search.ok && search.data?.results?.length > 0 ? 'PASS' : 'FAIL',
    `results=${search.data?.results?.length}`);

  // Feature availability updated (CRM domain connected)
  const fa = await api('GET', `/api/feature-availability?clubId=${CLUB_ID}`);
  const crmDomain = fa.data?.domains?.find(d => d.domain_code === 'CRM' || d.code === 'CRM');
  log('1', '1.6 Data Health: CRM domain connected', crmDomain?.is_connected || crmDomain?.connected ? 'PASS' : 'WARN',
    `connected=${crmDomain?.is_connected ?? crmDomain?.connected}, rows=${crmDomain?.row_count}`);

  return true;
}

// ════════════════════════════════════════
// PHASE 2: Import Rounds
// ════════════════════════════════════════
async function phase2() {
  console.log('\n\u2550\u2550\u2550 PHASE 2: Import Rounds \u2550\u2550\u2550');

  const rows = [];
  for (let i = 1; i <= 220; i++) {
    const memberId = `${CLUB_ID}_ext_${(i % 55) + 1}`;
    const d = new Date(2026, 3, 6);
    d.setDate(d.getDate() - (i % 90));
    rows.push({
      member_id: memberId,
      round_date: d.toISOString().slice(0, 10),
      tee_time: `${6 + (i % 10)}:${String((i * 7) % 60).padStart(2, '0')}`,
      course_id: 'main',
      duration_minutes: 200 + (i % 80),
      players: 2 + (i % 3),
    });
  }

  const imp = await api('POST', '/api/import-csv', { clubId: CLUB_ID, importType: 'rounds', rows, uploadedBy: 'qa-test' });
  log('2', '2.1 Import 220 rounds', imp.ok && imp.data.success === 220 ? 'PASS' : 'FAIL',
    `success=${imp.data?.success}, errors=${imp.data?.errors}`);

  // Check TEE_SHEET domain
  const fa = await api('GET', `/api/feature-availability?clubId=${CLUB_ID}`);
  const tsDomain = fa.data?.domains?.find(d => d.domain_code === 'TEE_SHEET' || d.code === 'TEE_SHEET');
  log('2', '2.2 Data Health: TEE_SHEET connected', tsDomain?.is_connected || tsDomain?.connected ? 'PASS' : 'WARN',
    `rows=${tsDomain?.row_count}`);

  return true;
}

// ════════════════════════════════════════
// PHASE 3: Import Transactions
// ════════════════════════════════════════
async function phase3() {
  console.log('\n\u2550\u2550\u2550 PHASE 3: Import Transactions \u2550\u2550\u2550');

  const outlets = ['Grill Room', 'Terrace', 'Pool Bar', 'Halfway House', 'Banquet'];
  const rows = [];
  for (let i = 1; i <= 550; i++) {
    const d = new Date(2026, 3, 6);
    d.setDate(d.getDate() - (i % 90));
    rows.push({
      member_id: `${CLUB_ID}_ext_${(i % 55) + 1}`,
      transaction_date: d.toISOString().slice(0, 10),
      total_amount: Math.round((15 + Math.random() * 165) * 100) / 100,
      outlet_name: outlets[i % 5],
      category: 'dining',
    });
  }

  const imp = await api('POST', '/api/import-csv', { clubId: CLUB_ID, importType: 'transactions', rows, uploadedBy: 'qa-test' });
  log('3', '3.1 Import 550 transactions', imp.ok && imp.data.success === 550 ? 'PASS' : 'FAIL',
    `success=${imp.data?.success}, errors=${imp.data?.errors}`);

  const fa = await api('GET', `/api/feature-availability?clubId=${CLUB_ID}`);
  const posDomain = fa.data?.domains?.find(d => d.domain_code === 'POS' || d.code === 'POS');
  log('3', '3.2 Data Health: POS connected', posDomain?.is_connected || posDomain?.connected ? 'PASS' : 'WARN',
    `rows=${posDomain?.row_count}`);

  return true;
}

// ════════════════════════════════════════
// PHASE 4: Import Complaints
// ════════════════════════════════════════
async function phase4() {
  console.log('\n\u2550\u2550\u2550 PHASE 4: Import Complaints \u2550\u2550\u2550');

  const cats = ['Food Quality', 'Service Speed', 'Facility Maintenance', 'Staff Attitude', 'Booking Issues'];
  const rows = [];
  for (let i = 0; i < 25; i++) {
    const d = new Date(2026, 3, 6);
    d.setDate(d.getDate() - (i * 3) % 60);
    rows.push({
      member_id: `${CLUB_ID}_ext_${(i % 55) + 1}`,
      category: cats[i % 5],
      description: `Test complaint ${i + 1}`,
      status: ['open', 'in_progress', 'in_progress', 'resolved', 'open'][i % 5],
      priority: i < 5 ? 'high' : 'medium',
      reported_at: d.toISOString(),
    });
  }

  const imp = await api('POST', '/api/import-csv', { clubId: CLUB_ID, importType: 'complaints', rows, uploadedBy: 'qa-test' });
  log('4', '4.1 Import 25 complaints', imp.ok && imp.data.success === 25 ? 'PASS' : 'FAIL',
    `success=${imp.data?.success}, errors=${imp.data?.errors}`);

  return true;
}

// ════════════════════════════════════════
// PHASE 5: Import Events + Registrations
// ════════════════════════════════════════
async function phase5() {
  console.log('\n\u2550\u2550\u2550 PHASE 5: Import Events + Registrations \u2550\u2550\u2550');

  const events = [];
  const names = ['Spring Gala', 'Member-Guest', 'Wine Dinner', 'Kids Camp', 'Ladies Day', 'Poker Night',
    'BBQ', 'Trivia Night', 'Golf Clinic', 'Awards Banquet', 'Pool Party', 'New Member Welcome'];
  for (let i = 0; i < 12; i++) {
    events.push({
      event_id: `evt_${TS}_${i + 1}`, event_name: names[i],
      event_type: i < 6 ? 'social' : 'sports',
      start_date: `2026-${String((i % 12) + 1).padStart(2, '0')}-15`, capacity: 50 + i * 10,
    });
  }

  const evtImp = await api('POST', '/api/import-csv', { clubId: CLUB_ID, importType: 'events', rows: events, uploadedBy: 'qa-test' });
  log('5', '5.1 Import 12 events', evtImp.ok && evtImp.data.success === 12 ? 'PASS' : 'FAIL',
    `success=${evtImp.data?.success}, errors=${evtImp.data?.errors}${evtImp.data?.errorDetails?.[0]?.message ? ' \u2014 ' + evtImp.data.errorDetails[0].message.slice(0, 60) : ''}`);

  const regs = [];
  for (let i = 0; i < 60; i++) {
    regs.push({
      registration_id: `reg_${TS}_${i + 1}`, event_id: `evt_${TS}_${(i % 12) + 1}`,
      member_id: `${CLUB_ID}_ext_${(i % 55) + 1}`, status: 'attended',
      guest_count: i % 3, fee_paid: 25 + (i % 4) * 25,
      registration_date: `2026-${String((i % 12) + 1).padStart(2, '0')}-10`,
    });
  }

  const regImp = await api('POST', '/api/import-csv', { clubId: CLUB_ID, importType: 'event_registrations', rows: regs, uploadedBy: 'qa-test' });
  log('5', '5.2 Import 60 registrations', regImp.ok && regImp.data.success === 60 ? 'PASS' : 'FAIL',
    `success=${regImp.data?.success}, errors=${regImp.data?.errors}${regImp.data?.errorDetails?.[0]?.message ? ' \u2014 ' + regImp.data.errorDetails[0].message.slice(0, 60) : ''}`);

  return true;
}

// ════════════════════════════════════════
// PHASE 6: Import Email
// ════════════════════════════════════════
async function phase6() {
  console.log('\n\u2550\u2550\u2550 PHASE 6: Import Email Engagement \u2550\u2550\u2550');

  const campaigns = [];
  for (let i = 0; i < 8; i++) {
    campaigns.push({
      campaign_id: `camp_${TS}_${i + 1}`,
      subject: ['Newsletter', 'Welcome', 'Wine Dinner RSVP', 'Spring Schedule', 'Tee Time Deals', 'Survey', 'Holiday Hours', 'Golf Tips'][i],
      campaign_type: i < 4 ? 'newsletter' : 'promotional',
      send_date: `2026-${String((i % 12) + 1).padStart(2, '0')}-01`, audience_count: 55,
    });
  }

  const campImp = await api('POST', '/api/import-csv', { clubId: CLUB_ID, importType: 'email_campaigns', rows: campaigns, uploadedBy: 'qa-test' });
  log('6', '6.1 Import 8 campaigns', campImp.ok && campImp.data.success === 8 ? 'PASS' : 'FAIL',
    `success=${campImp.data?.success}, errors=${campImp.data?.errors}${campImp.data?.errorDetails?.[0]?.message ? ' \u2014 ' + campImp.data.errorDetails[0].message.slice(0, 60) : ''}`);

  const emailEvents = [];
  for (let i = 0; i < 200; i++) {
    emailEvents.push({
      campaign_id: `camp_${TS}_${(i % 8) + 1}`,
      member_id: `${CLUB_ID}_ext_${(i % 55) + 1}`,
      event_type: i % 4 === 0 ? 'opened' : i % 4 === 1 ? 'clicked' : 'sent',
      timestamp: `2026-${String((i % 12) + 1).padStart(2, '0')}-02T10:00:00Z`,
    });
  }

  const eeImp = await api('POST', '/api/import-csv', { clubId: CLUB_ID, importType: 'email_events', rows: emailEvents, uploadedBy: 'qa-test' });
  log('6', '6.2 Import 200 email events', eeImp.ok && eeImp.data.success === 200 ? 'PASS' : 'FAIL',
    `success=${eeImp.data?.success}, errors=${eeImp.data?.errors}${eeImp.data?.errorDetails?.[0]?.message ? ' \u2014 ' + eeImp.data.errorDetails[0].message.slice(0, 60) : ''}`);

  return true;
}

// ════════════════════════════════════════
// PHASE 7: Import Staffing
// ════════════════════════════════════════
async function phase7() {
  console.log('\n\u2550\u2550\u2550 PHASE 7: Import Staffing \u2550\u2550\u2550');

  const depts = ['Golf', 'F&B', 'Admin', 'Maintenance', 'Pro Shop'];
  const titles = ['Server', 'Cook', 'Starter', 'Groundskeeper', 'Associate'];
  const staff = [];
  for (let i = 0; i < 20; i++) {
    staff.push({
      employee_id: `staff_${TS}_${i + 1}`, first_name: `Employee${i + 1}`, last_name: 'Test',
      department: depts[i % 5], job_title: titles[i % 5],
      hire_date: '2024-01-15', hourly_rate: 15 + (i % 10), ft_pt: i % 3 === 0 ? 'PT' : 'FT',
    });
  }

  const staffImp = await api('POST', '/api/import-csv', { clubId: CLUB_ID, importType: 'staff', rows: staff, uploadedBy: 'qa-test' });
  log('7', '7.1 Import 20 staff', staffImp.ok && staffImp.data.success === 20 ? 'PASS' : 'FAIL',
    `success=${staffImp.data?.success}, errors=${staffImp.data?.errors}${staffImp.data?.errorDetails?.[0]?.message ? ' \u2014 ' + staffImp.data.errorDetails[0].message.slice(0, 60) : ''}`);

  const shifts = [];
  for (let i = 0; i < 100; i++) {
    const d = new Date(2026, 3, 6);
    d.setDate(d.getDate() - (i % 30));
    shifts.push({
      shift_id: `shift_${TS}_${i + 1}`, employee_id: `staff_${TS}_${(i % 20) + 1}`,
      date: d.toISOString().slice(0, 10),
      shift_start: '08:00', shift_end: '16:00', actual_hours: 7.5 + (i % 3) * 0.5,
    });
  }

  const shiftImp = await api('POST', '/api/import-csv', { clubId: CLUB_ID, importType: 'shifts', rows: shifts, uploadedBy: 'qa-test' });
  log('7', '7.2 Import 100 shifts', shiftImp.ok && shiftImp.data.success === 100 ? 'PASS' : 'FAIL',
    `success=${shiftImp.data?.success}, errors=${shiftImp.data?.errors}${shiftImp.data?.errorDetails?.[0]?.message ? ' \u2014 ' + shiftImp.data.errorDetails[0].message.slice(0, 60) : ''}`);

  return true;
}

// ════════════════════════════════════════
// PHASE 8: Health Scores + Deep Validation
// ════════════════════════════════════════
async function phase8() {
  console.log('\n\u2550\u2550\u2550 PHASE 8: Health Scores + Deep Validation \u2550\u2550\u2550');

  // Compute health scores
  const hs = await api('POST', `/api/compute-health-scores?clubId=${CLUB_ID}`);
  log('8', '8.1 Compute health scores', hs.ok && hs.data.computed > 0 ? 'PASS' : 'FAIL',
    `computed=${hs.data?.computed}`);

  // Deep validate members API response shape
  const members = await api('GET', '/api/members');

  const healthDist = members.data?.healthDistribution || [];
  log('8', '8.2 healthDistribution populated', healthDist.length > 0 ? 'PASS' : 'FAIL',
    `levels=${healthDist.map(h => `${h.level}:${h.count}`).join(', ') || 'EMPTY'}`);

  const archTypes = members.data?.memberArchetypes || [];
  log('8', '8.3 memberArchetypes populated', archTypes.length > 0 ? 'PASS' : 'FAIL',
    `types=${archTypes.map(a => `${a.archetype}:${a.count}`).join(', ') || 'EMPTY'}`);

  const atRisk = members.data?.atRiskMembers || [];
  log('8', '8.4 atRiskMembers populated', atRisk.length > 0 ? 'PASS' : 'FAIL',
    `count=${atRisk.length}, top=${atRisk[0]?.name || '-'} (score:${atRisk[0]?.score ?? '-'})`);

  // Check at-risk members have required frontend fields
  if (atRisk.length > 0) {
    const m = atRisk[0];
    const fields = ['name', 'score', 'archetype', 'riskLevel', 'topRisk'];
    const missing = fields.filter(f => m[f] === undefined || m[f] === null);
    log('8', '8.5 At-risk record has all fields', missing.length === 0 ? 'PASS' : 'FAIL',
      missing.length > 0 ? `missing: ${missing.join(', ')}` : `name=${m.name}, score=${m.score}, archetype=${m.archetype}`);
  }

  const summary = members.data?.memberSummary || {};
  log('8', '8.6 memberSummary.total > 0', summary.total > 0 ? 'PASS' : 'FAIL',
    `total=${summary.total}, healthy=${summary.healthy}, atRisk=${summary.atRisk}, critical=${summary.critical}`);

  // KPI check: Board Report would use these
  const hasRetentionData = summary.total > 0 && (summary.healthy >= 0);
  log('8', '8.7 Board Report KPI data available', hasRetentionData ? 'PASS' : 'FAIL',
    `total=${summary.total}, healthy=${summary.healthy}, duesAtRisk=$${summary.potentialDuesAtRisk || 0}`);

  // Dashboard live
  const dash = await api('GET', `/api/dashboard-live?clubId=${CLUB_ID}`);
  log('8', '8.8 Dashboard live has tiers', dash.ok && dash.data?.totalMembers > 0 ? 'PASS' : 'FAIL',
    `totalMembers=${dash.data?.totalMembers}, tiers=${JSON.stringify(dash.data?.healthTiers || {})}`);

  // Feature availability: all domains should be connected
  const fa = await api('GET', `/api/feature-availability?clubId=${CLUB_ID}`);
  const domains = fa.data?.domains || [];
  const connectedCount = domains.filter(d => d.is_connected || d.connected).length;
  log('8', '8.9 Data Health: domains connected', connectedCount >= 3 ? 'PASS' : 'WARN',
    `${connectedCount} connected: ${domains.filter(d => d.is_connected || d.connected).map(d => d.domain_code || d.code).join(', ') || 'none'}`);

  // Value score
  const valueScore = fa.data?.valueScore ?? 0;
  log('8', '8.10 Value Score > 0', valueScore > 0 ? 'PASS' : 'WARN',
    `valueScore=${valueScore}%`);

  // Staffing API
  const staffing = await api('GET', `/api/staffing?clubId=${CLUB_ID}`);
  log('8', '8.11 Staffing API', staffing.ok ? 'PASS' : 'FAIL', `status=${staffing.status}`);

  // Search still works
  const search = await api('GET', `/api/search?q=James&clubId=${CLUB_ID}`);
  log('8', '8.12 Search works post-import', search.ok && search.data?.results?.length > 0 ? 'PASS' : 'FAIL',
    `results=${search.data?.results?.length}`);

  // Session still valid
  const auth = await api('GET', '/api/auth');
  log('8', '8.13 Session still valid', auth.ok ? 'PASS' : 'FAIL');

  // Onboarding progress
  const onboard = await api('GET', `/api/onboard-club?clubId=${CLUB_ID}`);
  log('8', '8.14 Onboarding progress', onboard.ok ? 'PASS' : 'FAIL',
    `progress=${onboard.data?.progress}`);

  return true;
}

// ════════════════════════════════════════
// RUN
// ════════════════════════════════════════
async function main() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  SWOOP GOLF — MARKET-READY QA TEST`);
  console.log(`  Target: ${BASE}`);
  console.log(`  Time:   ${new Date().toISOString()}`);
  console.log(`${'═'.repeat(60)}`);

  const ok0 = await phase0();
  if (!ok0) { console.log('\n\u274C Phase 0 failed — cannot continue'); process.exit(1); }

  await phase1();
  await phase2();
  await phase3();
  await phase4();
  await phase5();
  await phase6();
  await phase7();
  await phase8();

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  RESULTS: ${PASS} PASS | ${FAIL} FAIL | ${WARN} WARN`);
  console.log(`  Club ID: ${CLUB_ID}`);
  console.log(`${'═'.repeat(60)}`);

  if (FAIL > 0) {
    console.log('\n\u274C FAILURES:');
    results.filter(r => r.status === 'FAIL').forEach(r =>
      console.log(`  [Phase ${r.phase}] ${r.test}: ${r.detail}`)
    );
  }
  if (WARN > 0) {
    console.log('\n\u26A0\uFE0F WARNINGS:');
    results.filter(r => r.status === 'WARN').forEach(r =>
      console.log(`  [Phase ${r.phase}] ${r.test}: ${r.detail}`)
    );
  }

  if (FAIL === 0) {
    console.log('\n\u2705 MARKET READY — All critical checks passed.');
  } else {
    console.log(`\n\u274C NOT READY — ${FAIL} failure(s) must be fixed.`);
  }

  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
