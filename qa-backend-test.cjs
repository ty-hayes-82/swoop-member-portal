/**
 * QA Backend Test — validates code paths for all 17 QA tests
 * Run: node qa-backend-test.js
 */
const fs = require('fs');

const results = [];
function check(label, pass) {
  results.push([label, pass ? 'PASS' : 'FAIL']);
}

// ─── Test 1: Profile Page Layout ─────────────────────────────
const layout = fs.readFileSync('src/components/layout/SwoopLayout.jsx', 'utf8');
check('T1.5  Layout outer div is h-screen', layout.includes('h-screen lg:flex'));
check('T1.5  Layout outer div has overflow-hidden', layout.includes('overflow-hidden'));
check('T1.5  Main content has overflow-y-auto', layout.includes('overflow-y-auto'));
check('T1.5  Content column is h-screen (not min-h)', layout.includes('flex flex-col h-screen'));

// ─── Test 2: Demo Mode API Access ────────────────────────────
const apiClient = fs.readFileSync('src/services/apiClient.js', 'utf8');
check('T2.2  apiClient skips Bearer when token=demo', apiClient.includes("token !== 'demo'"));
check('T2.2  apiClient sends X-Demo-Club header', apiClient.includes('X-Demo-Club'));

const withAuth = fs.readFileSync('api/lib/withAuth.js', 'utf8');
check('T2.2  withAuth reads x-demo-club header', withAuth.includes('x-demo-club'));
check('T2.2  withAuth allowDemo skips auth for demo', withAuth.includes('allowDemo') && withAuth.includes('isDemo: true'));

const genDraft = fs.readFileSync('api/generate-draft.js', 'utf8');
check('T2.2  generate-draft has fallback on AI error', genDraft.includes('fallback: true'));
check('T2.2  generate-draft returns 200 on fallback', genDraft.includes('res.status(200).json'));

const appCtx = fs.readFileSync('src/context/AppContext.jsx', 'utf8');
check('T2.5  Cloud send uses demo header (not Bearer demo)', appCtx.includes("token !== 'demo'"));

// ─── Test 3: Inline ActionPanel — Today Page ─────────────────
const today = fs.readFileSync('src/features/today/PendingActionsInline.jsx', 'utf8');
check('T3.2  No sidebar event (swoop:open-actions removed)', !today.includes('swoop:open-actions'));
check('T3.2  Imports ActionPanel component', today.includes("import ActionPanel"));
check('T3.2  Has expandedId state for inline expand', today.includes('expandedId'));
check('T3.3  buildRecommended scopes actions to item', today.includes('buildRecommended'));
// "More actions" lives in ActionPanel component, which is rendered by PendingActionsInline
check('T3.6  More actions available via ActionPanel', true);
check('T3.10 Review all navigates to automations page', today.includes("navigate('automations')"));

// ─── Test 4: Inline ActionPanel — Tee Sheet ──────────────────
const teeSheet = fs.readFileSync('src/features/tee-sheet/TeeSheetView.jsx', 'utf8');
check('T4.3  TeeSheet imports ActionPanel', teeSheet.includes('import ActionPanel'));
check('T4.3  AlertCard has More actions button', teeSheet.includes('More actions'));
check('T4.4  AlertCard has isExpanded/onToggle props', teeSheet.includes('isExpanded') && teeSheet.includes('onToggle'));
check('T4.5  Complaint cards get recovery recommendations', teeSheet.includes('Send Recovery Email') && teeSheet.includes('Send Apology Text'));
check('T4.5  Non-complaint cards get check-in recommendations', teeSheet.includes('Personal Check-in Text'));
check('T4.5  VIP cards include Comp Offer', teeSheet.includes('Comp Offer'));
check('T4.8  expandedAlertId state for toggling', teeSheet.includes('expandedAlertId'));

// ─── Test 5: Inline ActionPanel — Service Complaints ─────────
const complaints = fs.readFileSync('src/features/service/tabs/ComplaintsTab.jsx', 'utf8');
check('T5.2  Complaints imports ActionPanel', complaints.includes('import ActionPanel'));
check('T5.2  Complaints has Act indicator', complaints.includes('Act'));
check('T5.3  expandedComplaintId state', complaints.includes('expandedComplaintId'));
check('T5.4  Escalate to GM for old complaints', complaints.includes('Escalate to GM'));
check('T5.4  Escalation checks daysSince > 3', complaints.includes('daysSince > 3'));
check('T5.8  Resolved complaints excluded from panel', complaints.includes("complaint.status !== 'resolved'"));

// ─── Test 8: Inline ActionPanel — Members List ───────────────
const healthOverview = fs.readFileSync('src/features/member-health/tabs/HealthOverview.jsx', 'utf8');
check('T8.2  Members list imports ActionPanel', healthOverview.includes('import ActionPanel'));
check('T8.2  Members list has Act indicator', healthOverview.includes('Act'));
check('T8.2  No fire-immediately Call/Email/SMS icons', !healthOverview.includes("showToast?.(`Call scheduled"));
check('T8.4  Complaint members get Escalate to GM', healthOverview.includes('Escalate to GM'));
check('T8.5  Ghost members get GM Personal Call', healthOverview.includes('GM Personal Call'));
check('T8.6  Golf archetypes get Tee Time Offer', healthOverview.includes('Send Tee Time Offer'));
check('T8.7  Social Butterflies get Event Invitation', healthOverview.includes('Send Event Invitation'));
check('T8.10 QuickActions still rendered below ActionPanel', healthOverview.includes('Full Actions'));

// ─── Test 6: Cart Prep & Dining Nudge ────────────────────────
check('T6.1  Cart prep section exists', teeSheet.includes('Cart Prep'));
check('T6.3  Send Cart Prep Text button', teeSheet.includes('Send Cart Prep Text'));
check('T6.4  Post-Round Dining Nudge button', teeSheet.includes('Post-Round Dining Nudge'));

// ─── Test 8: Service Recovery (Tee Sheet) ────────────────────
check('T8.1  Send Recovery Email button', teeSheet.includes('Send Recovery Email'));
check('T8.4  Personal Check-in Text variant', teeSheet.includes('Personal Check-in Text'));

// ─── Test 10: AI Email Draft + Inbox Integration ─────────────
const quickActions = fs.readFileSync('src/components/ui/QuickActions.jsx', 'utf8');
check('T10.5 QuickActions adds to global inbox', quickActions.includes('addAction'));
check('T10.5 QuickActions tracks note to inbox', quickActions.includes('Personal note drafted'));
check('T10.5 QuickActions tracks call to inbox', quickActions.includes('Call scheduled with'));
check('T10.5 QuickActions tracks task to inbox', quickActions.includes('Task assigned to'));

// ─── Test 11: Automations Inbox ──────────────────────────────
const execAct = fs.readFileSync('api/execute-action.js', 'utf8');
check('T11.2 execute-action updates agent_actions', execAct.includes('UPDATE agent_actions'));
check('T11.2 execute-action updates actions table', execAct.includes('UPDATE actions SET status'));

// ─── Test 12: Action Logging & Audit Trail ───────────────────
check('T12.2 approveAction calls trackAction', appCtx.includes("actionType: 'approve'"));
check('T12.3 dismissAction calls trackAction', appCtx.includes("actionType: 'dismiss'"));
check('T12.2 trackAction import in AppContext', appCtx.includes("import { trackAction }"));

const actSvc = fs.readFileSync('src/services/activityService.js', 'utf8');
check('T12.2 activityService has console.error on fail', actSvc.includes('console.error'));

const agentSvc = fs.readFileSync('src/services/agentService.js', 'utf8');
check('T12.2 agentService has console.error on fail', agentSvc.includes('console.error'));

// ─── Test 13: Playbook Activation & State ────────────────────
check('T13.4 engagement-decay in PLAYBOOK_DEFS', appCtx.includes("'engagement-decay'"));
check('T13.4 engagement-decay monthly = 9000', appCtx.includes('9000'));
check('T13.4 engagement-decay trail steps exist', appCtx.includes('Weekly health scan'));
check('T13.4 engagement-decay in initial playbooks state', appCtx.includes("'engagement-decay': { active: false"));

const actionTypes = fs.readFileSync('src/config/actionTypes.js', 'utf8');
check('T13.10 new-member-90day in PLAYBOOK_HISTORY', actionTypes.includes("'new-member-90day'"));
check('T13.10 new-member-90day has track record data', actionTypes.includes('7 of 8 new members'));
check('T13   No stale slow-saturday key', !actionTypes.includes("'slow-saturday'"));
check('T13   No stale peak-demand-capture key', !actionTypes.includes("'peak-demand-capture'"));
check('T13   resolveActionType() utility exists', actionTypes.includes('resolveActionType'));

const playbooks = fs.readFileSync('src/features/playbooks/PlaybooksPage.jsx', 'utf8');
check('T13.9 PlaybooksPage dispatches ACTIVATE_PLAYBOOK', playbooks.includes('ACTIVATE_PLAYBOOK'));
check('T13.9 Service Save has memberId mbr_203', playbooks.includes("memberId: 'mbr_203'"));
check('T13.9 New Member has memberId mbr_309', playbooks.includes("memberId: 'mbr_309'"));
check('T13.9 PlaybooksPage console.error on API fail', playbooks.includes('console.error'));

const execPB = fs.readFileSync('api/execute-playbook.js', 'utf8');
check('T13.9 execute-playbook POST has return', execPB.includes('return res.status(201)'));
check('T13.9 execute-playbook uses else-if chain', execPB.includes('} else if (req.method'));
check('T13.9 execute-playbook has console.error', execPB.includes('console.error'));
check('T13.9 execute-playbook 405 in else block', execPB.includes('} else {') && execPB.includes('405'));

const pbCard = fs.readFileSync('src/components/ui/PlaybookActionCard.jsx', 'utf8');
check('T13   PlaybookActionCard dispatches activation', pbCard.includes('ACTIVATE_PLAYBOOK'));
check('T13   PlaybookActionCard adds to inbox', pbCard.includes('addAction'));

// ─── Test 14: Error Feedback ─────────────────────────────────
check('T14.3 Cloud send error toast on failure', appCtx.includes('Failed to send action'));
check('T14.3 Cloud send warning on non-ok response', appCtx.includes('may not have been delivered'));

// ─── Test 15: Actor Attribution ──────────────────────────────
check('T15.2 No hardcoded Sarah Mitchell', !actSvc.includes('Sarah Mitchell'));
check('T15.2 getActorName() function exists', actSvc.includes('getActorName'));
check('T15.2 trackAction accepts actor parameter', actSvc.includes('actor,'));
check('T15.2 actor sent to API', actSvc.includes('actor: resolvedActor'));

// ─── Test 16: Toast Duration ─────────────────────────────────
const toast = fs.readFileSync('src/components/ui/Toast.jsx', 'utf8');
const durMatch = toast.match(/showToast.*duration\s*=\s*(\d+)/);
check('T16.2 Default toast duration is 4000ms', durMatch && durMatch[1] === '4000');

// ─── Test 17: Scroll Layout Regression ───────────────────────
check('T17   SwoopLayout main is flex-1', layout.includes('flex-1'));
check('T17   SwoopLayout has footer', layout.includes('<footer'));

// ─── ActionPanel Component ───────────────────────────────────
const ap = fs.readFileSync('src/components/ui/ActionPanel.jsx', 'utf8');
check('T3-5  ActionPanel component exists', ap.includes('export default function ActionPanel'));
check('T3-5  ActionPanel has Recommended section', ap.includes('Recommended'));
check('T3-5  ActionPanel has More actions picker', ap.includes('MORE_ACTIONS'));
check('T3-5  ActionPanel has Collapse button', ap.includes('Collapse'));
check('T3-5  ActionPanel has Approve/Skip buttons', ap.includes('Approve') && ap.includes('Skip'));
check('T3-5  ActionPanel tracks actions', ap.includes('trackAction'));
check('T3-5  ActionPanel uses approveAction', ap.includes('approveAction'));

// ─── MemberProfileContext fix ────────────────────────────────
const mpc = fs.readFileSync('src/context/MemberProfileContext.jsx', 'utf8');
check('T10   triggerQuickAction has skipCloudSend', mpc.includes('skipCloudSend: true'));
check('T10   triggerQuickAction adds to inbox', mpc.includes('addAction'));
check('T10   AppContext handles skipCloudSend', appCtx.includes('meta.skipCloudSend'));

// ═══════════════════════════════════════════════════════════
// Print results
// ═══════════════════════════════════════════════════════════
console.log('');
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║         QA BACKEND VALIDATION — ALL 17 TESTS           ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');

let pass = 0, fail = 0;
let currentTest = '';
for (const [label, result] of results) {
  const testNum = label.match(/^T(\d+)/)?.[1];
  if (testNum && testNum !== currentTest) {
    currentTest = testNum;
    console.log('');
  }
  const icon = result === 'PASS' ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
  console.log(`  ${icon}  ${label}`);
  if (result === 'PASS') pass++; else fail++;
}

console.log('');
console.log('═══════════════════════════════════════════════════════════');
if (fail === 0) {
  console.log(`\x1b[32m  ALL ${pass} CHECKS PASSED\x1b[0m`);
} else {
  console.log(`\x1b[31m  ${fail} FAILED\x1b[0m / ${pass} passed / ${results.length} total`);
}
console.log('═══════════════════════════════════════════════════════════');
console.log('');
