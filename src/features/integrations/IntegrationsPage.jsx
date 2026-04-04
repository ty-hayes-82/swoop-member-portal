import { useMemo, useState } from 'react';
import { getConnectedSystems } from '@/services/integrationsService';
import { useNavigationContext } from '@/context/NavigationContext';
import PageTransition from '@/components/ui/PageTransition';

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
  'Accounting & Finance': 'pos',
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
  connected: '#16a34a',
  available: '#475569',
  'coming-soon': '#c2410c',
};

export default function IntegrationsPage() {
  const { navigate } = useNavigationContext();
  const systems = useMemo(() => getConnectedSystems(), []);
  const systemMap = useMemo(() => Object.fromEntries(systems.map((system) => [system.id, system])), [systems]);
  const [statusFilter, setStatusFilter] = useState('connected');

  const connectedSystems = systems.filter((system) => system.status === 'connected').length;
  const totalSystems = systems.length;
  const intelligenceScore = totalSystems ? Math.round((connectedSystems / totalSystems) * 100) : 94;
  const dataPointsSynced = connectedSystems * 620;

  // Intelligence Score color coding (GMC-04)
  const getScoreColor = (score) => {
    if (score < 40) return '#ef4444'; // red
    if (score < 70) return '#f59e0b'; // yellow
    return '#22c55e'; // green
  };

  const getScoreLabel = (score) => {
    if (score < 40) return 'Getting Started';
    if (score < 70) return 'Growing Intelligence';
    return 'Full Intelligence';
  };

  const [showMarketplace, setShowMarketplace] = useState(false);
  const [expandedVendor, setExpandedVendor] = useState(null);

  const summaryCards = [
    { label: 'Systems Connected', value: `${connectedSystems}`, sub: 'All Healthy', color: '#22c55e' },
    { label: 'Data Points Synced', value: dataPointsSynced >= 1000 ? `${(dataPointsSynced / 1000).toFixed(1)}K` : dataPointsSynced.toLocaleString(), sub: 'This week' },
    {
      label: 'System Status',
      value: 'All Healthy',
      sub: 'Last sync: 11 min ago',
      color: '#22c55e',
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

      <section className="grid-responsive-4" className="grid gap-4">
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
              border: `1px solid ${statusFilter === filter.value ? '#465fff' : '#E5E7EB'}`,
              borderRadius: '12px',
              background: statusFilter === filter.value ? `${'#465fff'}15` : '#F8F9FA',
              color: statusFilter === filter.value ? '#465fff' : '#6B7280',
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
                  border: `1px solid ${isExpanded ? '#465fff' + '50' : '#E5E7EB'}`,
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
                    <div style={{ fontSize: 11, color: '#465fff', opacity: 0.85 }}>
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
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e' }}>98.5%</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recent Syncs</div>
                      {syncInfo.history.map((h, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', borderBottom: i < syncInfo.history.length - 1 ? `1px solid ${'#E5E7EB'}` : 'none' }}>
                          <span className="text-gray-400">{h.time}</span>
                          <span style={{ fontFamily: '"JetBrains Mono", monospace', color: '#6B7280' }}>{h.records} records</span>
                          <span style={{ color: h.ok ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{h.ok ? 'OK' : 'Error'}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                        <button style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', border: `1px solid ${'#465fff'}40`, background: `${'#465fff'}12`, color: '#465fff', cursor: 'pointer' }}>Force Sync</button>
                        <button style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', border: `1px solid ${'#E5E7EB'}`, background: 'transparent', color: '#6B7280', cursor: 'pointer' }}>View Logs</button>
                        <button style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', border: `1px solid ${'#E5E7EB'}`, background: 'transparent', color: '#6B7280', cursor: 'pointer' }}>Configure</button>
                        <button style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', border: `1px solid ${'#ef4444'}40`, background: 'transparent', color: '#ef4444', cursor: 'pointer', marginLeft: 'auto' }}>Disconnect</button>
                      </div>
                    </div>
                  )}
                  {/* GMC-02: Add Connect button to available cards */}
                  {vendor.status === 'available' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                      <button
                        onClick={() => alert(`Connect ${vendor.name} - Integration setup will be available in the next release`)}
                        style={{
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          border: `1px solid ${'#465fff'}`,
                          borderRadius: '8px',
                          background: '#465fff',
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
                            color: '#465fff',
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
                            color: '#465fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
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
    </div>
    </PageTransition>
    );
}
