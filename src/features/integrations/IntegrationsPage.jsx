import { useMemo, useState } from 'react';
import { getConnectedSystems } from '@/services/integrationsService';
import { getLeakageData } from '@/services/revenueService';
import { COMBOS } from '@/data/integrations';
import { useNavigationContext } from '@/context/NavigationContext';
import PageTransition from '@/components/ui/PageTransition';
import SourceBadge from '@/components/ui/SourceBadge';
import DataOnboardingChat from './DataOnboardingChat';
import ImportedDataCatalog from './ImportedDataCatalog';

function timeAgo(val) {
  if (!val) return 'Never';
  // Already relative like "2m ago"
  if (typeof val === 'string' && /\d+[mhd]\s*ago/i.test(val)) return val;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

const SYNC_DETAILS = {
  'ForeTees': { freq: 'Every 15 min', todayRecords: 142, history: [{ time: '11m ago', records: 142, ok: true }, { time: '26m ago', records: 138, ok: true }, { time: '41m ago', records: 145, ok: true }, { time: '56m ago', records: 140, ok: true }, { time: '1h ago', records: 136, ok: true }] },
  'Northstar POS': { freq: 'Every 30 min', todayRecords: 89, history: [{ time: '8m ago', records: 89, ok: true }, { time: '38m ago', records: 84, ok: true }, { time: '1h ago', records: 91, ok: true }, { time: '2h ago', records: 78, ok: true }, { time: '2h ago', records: 82, ok: true }] },
  'Clubessential CMS': { freq: 'Every 4 hours', todayRecords: 487, history: [{ time: '1h ago', records: 487, ok: true }, { time: '5h ago', records: 487, ok: true }, { time: '9h ago', records: 486, ok: true }] },
  'ADP Workforce': { freq: 'Every 6 hours', todayRecords: 24, history: [{ time: '2h ago', records: 24, ok: true }, { time: '8h ago', records: 24, ok: true }] },
  'Northstar Member CRM': { freq: 'Every 2 hours', todayRecords: 312, history: [{ time: '45m ago', records: 312, ok: true }, { time: '3h ago', records: 310, ok: true }] },
};

const EMAIL_VENDOR_IDS = ['hubspot', 'mailchimp'];
const ACCOUNTING_VENDOR_IDS = ['quickbooks', 'club-prophet'];

// Maps category labels to SYSTEMS category keys for CSV import routing
const CATEGORY_CSV_MAP = {
  'Tee Sheet Systems': 'tee-sheet',
  'POS / F&B': 'pos',
  'CRM & Membership Management': 'crm',
  'Email Marketing': 'email',
  'Scheduling & Labor': 'staffing',
  'Accounting & Finance': 'accounting',
};

const CATEGORY_CONFIG = [
  {
    label: 'Tee Sheet Systems',
    icon: '⛳',
    description: 'Demand, pace, and cancellation signals fuel waitlist prioritization and yield optimization.',
    vendors: [
      { id: 'tee-sheet', name: 'ForeTees', dataPoints: 'Rounds, tee times, no-shows' },
      { name: 'Club Caddie', status: 'available', dataPoints: 'Public + member tee data' },
      { id: 'ezlinks', name: 'EZLinks', dataPoints: 'Booking pace, pricing rules' },
      { name: 'Golf Genius', status: 'coming-soon', dataPoints: 'Event pairings, scorecards' },
    ],
  },
  {
    label: 'POS / F&B',
    icon: '🧾',
    description: 'Dining spend is the second-strongest engagement signal. Track checks, covers, and outlet mix automatically.',
    vendors: [
      { id: 'clubessential', name: 'Clubessential POS', dataPoints: 'Checks, covers, promo usage' },
      { name: 'Northstar POS', status: 'connected', dataPoints: 'Dining frequency, average check' },
      { id: 'toast-pos', name: 'Toast', dataPoints: 'Modifiers, kitchen state' },
    ],
  },
  {
    label: 'CRM & Membership Management',
    icon: '👥',
    description: 'Member profiles, tenure, dues, and lifecycle notes set the baseline for every health score.',
    vendors: [
      { id: 'club-mgmt', name: 'Clubessential CMS', dataPoints: 'Members, dues ledger, households' },
      { id: 'jonas', name: 'Jonas Club', dataPoints: 'Profiles, statements, events' },
      { name: 'Memberplanet', status: 'available', dataPoints: 'Committees, volunteer hours' },
      { name: 'Privit', status: 'available', dataPoints: 'Household compliance forms' },
    ],
  },
  {
    label: 'Email Marketing',
    icon: '✉️',
    description: 'Open and click trends are early warning signs. Swoop ties them back to individual member health.',
    vendors: [
      { name: 'Constant Contact', status: 'available', dataPoints: 'Campaign sends, opens' },
      { id: 'hubspot', name: 'HubSpot', dataPoints: 'Workflows, forms, lead scoring' },
      { id: 'mailchimp', name: 'Mailchimp', dataPoints: 'Audiences, campaign metrics' },
      { name: 'Campaign Monitor', status: 'coming-soon', dataPoints: 'Automation journeys' },
    ],
  },
  {
    label: 'Scheduling & Labor',
    icon: '📅',
    description: 'Align staff coverage with predicted demand to avoid both overstaffing waste and understaffing complaints.',
    vendors: [
      { id: 'staffing', name: 'ADP Workforce', dataPoints: 'Schedules, clock events' },
      { id: 'scheduling', name: '7shifts', dataPoints: 'Coverage plans, shift swaps' },
      { name: 'HotSchedules', status: 'available', dataPoints: 'Labor forecasts, punches' },
      { name: 'Deputy', status: 'available', dataPoints: 'Timesheets, compliance alerts' },
    ],
  },
  {
    label: 'Accounting & Finance',
    icon: '📊',
    description: 'Connect dues revenue, ancillary spend, and cost data so ROI math is grounded in real numbers.',
    vendors: [
      { name: 'Sage Intacct', status: 'available', dataPoints: 'GL entries, class reporting' },
      { id: 'quickbooks', name: 'QuickBooks Online', dataPoints: 'Journal, receivables' },
      { id: 'club-prophet', name: 'Club Prophet', dataPoints: 'Member spend, inventory' },
    ],
  },
];

// What intelligence each connected vendor powers — transforms status board into value surface
const VENDOR_POWERS = {
  'ForeTees': 'Pace-of-play, demand patterns, cancellation risk',
  'Club Caddie': 'Tee time demand, public/member mix',
  'Clubessential POS': 'Dining conversion, cover counts, promo tracking',
  'Northstar POS': 'Dining frequency, average check size',
  'Toast': 'Post-round dining, kitchen efficiency, server performance',
  'Clubessential CMS': 'Member profiles, dues ledger, household data',
  'Jonas Club': 'Member statements, event attendance, profile data',
  'Northstar Member CRM': 'Health scores, segments, balance tracking',
  'ADP Workforce': 'Staffing coverage, labor cost, overtime alerts',
  '7shifts': 'Shift coverage, swap tracking, role compliance',
  'HubSpot': 'Email workflows, form conversion, lead scoring',
  'Mailchimp': 'Campaign metrics, audience decay, engagement trends',
  'QuickBooks Online': 'GL entries, receivables, class reporting',
  'Chronogolf by Lightspeed': 'Tee time demand, cancellation patterns',
  'ForeUP Tee Sheet': 'Booking pace, package utilization',
  'Square POS': 'Transaction mix, tip analysis, tender breakdown',
  'Toast Restaurant POS': 'Check detail, modifier analysis, kitchen state',
  'Teesnap': 'Booking conversion, marketing attribution',
  'Stripe Payments': 'Payment flow, refund patterns, payout tracking',
  'Salesforce': 'Lead pipeline, opportunity tracking, task management',
  'GGA PerformanceAI': 'Benchmarks, forecast accuracy, alerts',
};

const STATUS_COLORS = {
  connected: '#039855',
  available: '#475569',
  'coming-soon': '#c2410c',
};

export default function IntegrationsPage() {
  const { navigate } = useNavigationContext();
  const systems = useMemo(() => getConnectedSystems(), []);
  const systemMap = useMemo(() => Object.fromEntries(systems.map((system) => [system.id, system])), [systems]);
  const [statusFilter, setStatusFilter] = useState('connected');

  // Pillar 3 (Prove It) — quantify each missing integration in dollars.
  // Dollar values flow from revenueService.getLeakageData() (pace + staffing + weather)
  // with COMBOS (src/data/integrations.js) providing member-CRM KPI fallback.
  // Canonical fallbacks match seed data: PACE $5,177 / STAFFING $3,400 /
  // WEATHER $800 / TOTAL $9,377 if the demo gates are closed.
  const leakage = getLeakageData();
  const paceDollars = leakage?.PACE_LOSS || 5177;
  const staffingDollars = leakage?.STAFFING_LOSS || 3400;
  const weatherDollars = leakage?.WEATHER_LOSS || 800;
  const totalLeakage = leakage?.TOTAL || 9377;
  const memberCrmCombo = COMBOS.find((c) => c.id === 'member-crm-pos');
  const memberCrmKpi = memberCrmCombo?.kpi?.value || '$128K'; // lint-no-hardcoded-dollars: allow — COMBOS KPI fallback (data lives in src/data/integrations.js)

  const unlockCards = useMemo(() => ([
    {
      systems: '\u26F3 Tee Sheet + \uD83C\uDF7D POS',
      dollars: `$${paceDollars.toLocaleString()}/mo`,
      unlocks: 'pace-to-dining attribution',
      reason: 'Slow rounds suppress post-round grill conversion — every minute over pace costs dining spend.',
      sources: ['Tee Sheet', 'POS'],
    },
    {
      systems: '\u2605 Member CRM + \uD83C\uDF7D POS',
      dollars: `${memberCrmKpi}/yr`,
      unlocks: 'unactivated F&B revenue',
      reason: 'High-visit members under-index on F&B spend vs. peers in the same tenure band.',
      sources: ['Member CRM', 'POS'],
    },
    {
      systems: '\uD83D\uDCC5 Scheduling + \uD83C\uDF7D POS',
      dollars: `$${staffingDollars.toLocaleString()}/mo`,
      unlocks: 'staffing-driven F&B recovery',
      reason: 'Understaffed prime dining windows drop satisfaction 19 pts and leak check revenue the next day.',
      sources: ['Scheduling', 'POS'],
    },
    {
      systems: '\u2601 Weather + \u26F3 Tee Sheet',
      dollars: `$${weatherDollars.toLocaleString()}/mo`,
      unlocks: 'weather no-show recovery',
      reason: 'Weather-driven cancellations skip dining entirely — backfilled via waitlist priority.',
      sources: ['Weather API', 'Tee Sheet'],
    },
  ]), [paceDollars, staffingDollars, weatherDollars, memberCrmKpi]);

  const connectedSystems = systems.filter((system) => system.status === 'connected').length;
  const totalSystems = systems.length;
  const intelligenceScore = totalSystems ? Math.round((connectedSystems / totalSystems) * 100) : 94;
  const dataPointsSynced = connectedSystems * 620;

  const [showMarketplace, setShowMarketplace] = useState(false);
  const [expandedVendor, setExpandedVendor] = useState(null);
  const [activeTab, setActiveTab] = useState('connections');

  // Club ID for the AI Import Assistant
  const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;

  const degradedSystems = systems.filter(s => s.status === 'connected' && s.health && s.health !== 'ok').length;
  const statusLabel = degradedSystems > 0 ? `${degradedSystems} degraded` : connectedSystems > 0 ? 'All Healthy' : 'No data';
  const statusColor = degradedSystems > 0 ? '#f59e0b' : '#12b76a';
  const freshestSync = systems
    .filter(s => s.status === 'connected' && s.lastSync)
    .map(s => Number.parseInt(s.lastSync, 10))
    .filter(n => Number.isFinite(n))
    .reduce((min, n) => Math.min(min, n), Number.POSITIVE_INFINITY);
  const lastSyncLabel = Number.isFinite(freshestSync) ? `Last sync: ${freshestSync} min ago` : 'Last sync: —';

  const summaryCards = [
    { label: 'Systems Connected', value: `${connectedSystems}`, sub: statusLabel, color: statusColor },
    { label: 'Data Points Synced', value: dataPointsSynced >= 1000 ? `${(dataPointsSynced / 1000).toFixed(1)}K` : dataPointsSynced.toLocaleString(), sub: 'This week' },
    {
      label: 'System Status',
      value: statusLabel,
      sub: lastSyncLabel,
      color: statusColor,
    },
  ];

  const categories = CATEGORY_CONFIG.map((category) => ({
    ...category,
    csvCategory: CATEGORY_CSV_MAP[category.label] || null,
    vendors: category.vendors
      .map((vendor) => {
        const system = vendor.id ? systemMap[vendor.id] : null;
        const normalized = {
          name: vendor.name || system?.name || 'Unnamed system',
          status: vendor.status || system?.status || 'available',
          lastSync: vendor.lastSync || system?.lastSync || null,
          dataPoints: vendor.dataPoints,
        };
        return normalized;
      })
      .filter((vendor) => {
        // GMC-05: Filter by status
        if (statusFilter === 'all') return true;
        return vendor.status === statusFilter;
      }),
  })).filter((category) => category.vendors.length > 0); // Hide empty categories

  return (
    <PageTransition>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <header className="flex flex-col gap-2">
        <h1 style={{ margin: 0, fontSize: 28, color: '#1a1a2e' }}>Connected Systems</h1>
        <p style={{ margin: 0, maxWidth: 600, color: '#6B7280' }}>
          See what data flows into Swoop and the intelligence it powers.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1" style={{ alignSelf: 'flex-start' }}>
        {[
          { id: 'connections', label: 'Connections' },
          { id: 'imported-data', label: 'Imported Data' },
          { id: 'import', label: 'Import Data' },
          { id: 'ai-assistant', label: 'AI Import Assistant' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'import') {
                navigate('integrations/csv-import');
                return;
              }
              setActiveTab(tab.id);
            }}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              borderRadius: '8px',
              background: activeTab === tab.id ? '#ffffff' : 'transparent',
              color: activeTab === tab.id ? '#1a1a2e' : '#6B7280',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Imported Data tab — baseline catalog of every CSV that has landed */}
      {activeTab === 'imported-data' && <ImportedDataCatalog />}

      {/* AI Import Assistant tab */}
      {activeTab === 'ai-assistant' && (
        <DataOnboardingChat clubId={clubId} onImportComplete={() => { /* refetch if needed */ }} />
      )}

      {/* Connections tab (existing content) */}
      {activeTab === 'connections' && (<>


      {/* Pillar 3: PROVE IT — what each connection unlocks */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(18, 183, 106,0.06), rgba(18, 183, 106,0.02))',
        border: '1px solid rgba(18, 183, 106,0.25)',
        borderRadius: '14px',
        padding: '16px 20px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#039855', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          What your connected systems unlock
        </div>
        <div style={{ fontSize: 14, color: '#1a1a2e', lineHeight: 1.5 }}>
          Every system you connect deepens Swoop's cross-domain intelligence. Each pairing below is already
          quantified from live leakage data — <strong>${totalLeakage.toLocaleString()}/mo total recoverable F&amp;B revenue</strong>:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginTop: 12 }}>
          {unlockCards.map((card) => (
            <div
              key={card.systems}
              style={{
                background: '#fff',
                border: '1px solid #d1fae5',
                borderRadius: 10,
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {card.systems}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#039855', lineHeight: 1.3 }}>
                Unlock {card.dollars} {card.unlocks}
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.4 }}>
                {card.reason}
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                {card.sources.map((s) => (
                  <SourceBadge key={s} system={s} size="xs" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="grid-responsive-4 grid gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} style={{
            borderRadius: '12px',
            border: `1px solid ${'#E5E7EB'}`,
            padding: '16px 18px',
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            position: 'relative',
          }} title={card.tooltip}>
            <div style={{ fontSize: '12px', color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{card.label}</div>
            <div style={{ 
              fontSize: 28, 
              fontWeight: 700, 
              marginTop: 6,
              color: card.color || '#1a1a2e'
            }}>{card.value}</div>
            <div className="text-sm text-gray-500">{card.sub}</div>
            {card.color && (
              <div style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: card.color,
                boxShadow: `0 0 0 2px ${card.color}33`
              }} />
            )}
          </div>
        ))}
      </section>

      {/* GMC-05: Filter buttons */}
      <section style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 14, color: '#9CA3AF', marginRight: 8 }}>Filter:</span>
        {[
          { value: 'all', label: 'All' },
          { value: 'connected', label: 'Connected' },
          { value: 'available', label: 'Available' },
          { value: 'coming-soon', label: 'Coming Soon' }
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
              border: `1px solid ${statusFilter === filter.value ? '#ff8b00' : '#E5E7EB'}`,
              borderRadius: '12px',
              background: statusFilter === filter.value ? `${'#ff8b00'}15` : '#F8F9FA',
              color: statusFilter === filter.value ? '#ff8b00' : '#6B7280',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {filter.label}
          </button>
        ))}
      </section>

      <section className="grid gap-5">
        {categories.map((category) => (
          <div key={category.label} style={{
            borderRadius: '16px',
            border: `1px solid ${'#E5E7EB'}`,
            background: '#ffffff',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{category.label}</div>
                  <div className="text-sm text-gray-500">{category.description}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {category.vendors.map((vendor) => {
                const isConnected = vendor.status === 'connected';
                const isExpanded = expandedVendor === vendor.name;
                const syncInfo = SYNC_DETAILS[vendor.name];
                return (
                <div key={vendor.name} style={{
                  border: `1px solid ${isExpanded ? '#ff8b00' + '50' : '#E5E7EB'}`,
                  borderRadius: '12px',
                  padding: '12px 14px',
                  background: '#F8F9FA',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  cursor: isConnected ? 'pointer' : 'default',
                  transition: 'border-color 0.15s',
                }} onClick={() => isConnected && setExpandedVendor(isExpanded ? null : vendor.name)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div className="font-semibold">{vendor.name}</div>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      padding: '2px 8px',
                      borderRadius: 999,
                      color: '#fff',
                      background: STATUS_COLORS[vendor.status] || STATUS_COLORS.available,
                    }}>
                      {vendor.status.replace('-', ' ')}
                    </span>
                  </div>
                  {isConnected && (
                    <div className="text-xs text-gray-400">
                      Last sync: {timeAgo(vendor.lastSync) || '2m ago'}
                    </div>
                  )}
                  {isConnected && VENDOR_POWERS[vendor.name] && (
                    <div style={{ fontSize: 11, color: '#ff8b00', opacity: 0.85 }}>
                      Powers: {VENDOR_POWERS[vendor.name]}
                    </div>
                  )}
                  <div className="text-[13px] text-gray-500">{vendor.dataPoints}</div>

                  {/* Sync detail panel for connected systems */}
                  {isConnected && isExpanded && syncInfo && (
                    <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: `1px solid ${'#E5E7EB'}` }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                        <div style={{ padding: '6px 8px', background: '#ffffff', borderRadius: '6px', border: `1px solid ${'#E5E7EB'}` }}>
                          <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase' }}>Frequency</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e' }}>{syncInfo.freq}</div>
                        </div>
                        <div style={{ padding: '6px 8px', background: '#ffffff', borderRadius: '6px', border: `1px solid ${'#E5E7EB'}` }}>
                          <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase' }}>Records Today</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e' }}>{syncInfo.todayRecords.toLocaleString()}</div>
                        </div>
                        <div style={{ padding: '6px 8px', background: '#ffffff', borderRadius: '6px', border: `1px solid ${'#E5E7EB'}` }}>
                          <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase' }}>Data Quality</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#12b76a' }}>98.5%</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recent Syncs</div>
                      {syncInfo.history.map((h, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', borderBottom: i < syncInfo.history.length - 1 ? `1px solid ${'#E5E7EB'}` : 'none' }}>
                          <span className="text-gray-400">{h.time}</span>
                          <span style={{ fontFamily: '"JetBrains Mono", monospace', color: '#6B7280' }}>{h.records} records</span>
                          <span style={{ color: h.ok ? '#12b76a' : '#ef4444', fontWeight: 600 }}>{h.ok ? 'OK' : 'Error'}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                        <button onClick={() => alert('Manual sync triggered. Check back in 2 minutes.')} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', border: `1px solid ${'#ff8b00'}40`, background: `${'#ff8b00'}12`, color: '#ff8b00', cursor: 'pointer' }}>Force Sync</button>
                        <button onClick={() => alert('Sync logs will be available in the next release.')} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', border: `1px solid ${'#E5E7EB'}`, background: 'transparent', color: '#6B7280', cursor: 'pointer' }}>View Logs</button>
                        <button onClick={() => alert('Configuration panel coming soon.')} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', border: `1px solid ${'#E5E7EB'}`, background: 'transparent', color: '#6B7280', cursor: 'pointer' }}>Configure</button>
                        <button onClick={() => { if (confirm('Disconnect this integration?')) alert('Integration disconnected.'); }} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', border: `1px solid ${'#ef4444'}40`, background: 'transparent', color: '#ef4444', cursor: 'pointer', marginLeft: 'auto' }}>Disconnect</button>
                      </div>
                    </div>
                  )}
                  {/* GMC-02: Add Connect button to available cards */}
                  {vendor.status === 'available' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                      <button
                        aria-label={`Connect to ${vendor.name}`}
                        onClick={() => alert(`Connect ${vendor.name} - Integration setup will be available in the next release`)}
                        style={{
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          border: `1px solid ${'#ff8b00'}`,
                          borderRadius: '8px',
                          background: '#ff8b00',
                          color: '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Connect Now
                      </button>
                      {category.csvCategory && (
                        <button
                          onClick={() => navigate('integrations/csv-import', { category: category.csvCategory, vendor: vendor.name })}
                          style={{
                            padding: 0,
                            border: 'none',
                            background: 'none',
                            color: '#ff8b00',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'center',
                          }}
                        >
                          or upload CSV →
                        </button>
                      )}
                    </div>
                  )}
                  {vendor.status === 'coming-soon' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                      <button
                        onClick={() => alert(`Request submitted! We'll notify you when ${vendor.name} integration is available.`)}
                        style={{
                          padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          border: `1px solid ${'#E5E7EB'}`, borderRadius: '8px',
                          background: 'transparent', color: '#6B7280',
                        }}
                      >
                        Request This Integration
                      </button>
                      {category.csvCategory && (
                        <button
                          onClick={() => navigate('integrations/csv-import', { category: category.csvCategory, vendor: vendor.name })}
                          style={{
                            padding: 0, border: 'none', background: 'none',
                            color: '#ff8b00', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          upload CSV instead →
                        </button>
                      )}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
      </>)}
    </div>
    </PageTransition>
    );
}
