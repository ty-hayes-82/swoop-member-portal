import { useMemo } from 'react';
import { theme } from '@/config/theme';
import { getConnectedSystems } from '@/services/integrationsService';
import TwoLayerDiagram from '@/components/ui/TwoLayerDiagram.jsx';
import DataSourceComparison from '@/components/ui/DataSourceComparison.jsx';

const EMAIL_VENDOR_IDS = ['hubspot', 'mailchimp'];
const ACCOUNTING_VENDOR_IDS = ['quickbooks', 'club-prophet'];

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

const ADDED_INTELLIGENCE = [
  'Correlates dining spend with round frequency to predict churn before resignations hit the desk.',
  'Flags slow-round windows where grill revenue collapses so staffing can adjust proactively.',
  'Ranks waitlist fills by retention value rather than first-come order.',
  'Shows which members visit the property yet skip key amenities, signaling disengagement.',
];

const STATUS_COLORS = {
  connected: '#16a34a',
  available: '#475569',
  'coming-soon': '#c2410c',
};

export function IntegrationsPage() {
  const systems = useMemo(() => getConnectedSystems(), []);
  const systemMap = useMemo(() => Object.fromEntries(systems.map((system) => [system.id, system])), [systems]);

  const connectedSystems = systems.filter((system) => system.status === 'connected').length;
  const totalSystems = systems.length;
  const intelligenceScore = totalSystems ? Math.round((connectedSystems / totalSystems) * 100) : 94;
  const dataPointsSynced = connectedSystems * 620;

  const summaryCards = [
    { label: 'Connected Systems', value: `${connectedSystems}/${totalSystems}`, sub: 'Live connectors' },
    { label: 'Data Points Synced', value: dataPointsSynced >= 1000 ? `${(dataPointsSynced / 1000).toFixed(1)}K` : dataPointsSynced.toLocaleString(), sub: 'This week' },
    { label: 'Intelligence Score', value: `${intelligenceScore}/100`, sub: 'Coverage across signals' },
  ];

  const categories = CATEGORY_CONFIG.map((category) => ({
    ...category,
    vendors: category.vendors.map((vendor) => {
      const system = vendor.id ? systemMap[vendor.id] : null;
      const normalized = {
        name: vendor.name || system?.name || 'Unnamed system',
        status: vendor.status || system?.status || 'available',
        lastSync: vendor.lastSync || system?.lastSync || null,
        dataPoints: vendor.dataPoints,
      };
      return normalized;
    }),
  }));

  return (
    <>
      <TwoLayerDiagram />
      <DataSourceComparison />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 28, color: theme.colors.textPrimary }}>Connected Systems</h1>
        <p style={{ margin: 0, maxWidth: 600, color: theme.colors.textSecondary }}>
          See what data flows into Swoop and the intelligence it powers.
        </p>
      </header>

      <section className="grid-responsive-4" style={{ display: 'grid', gap: 16 }}>
        {summaryCards.map((card) => (
          <div key={card.label} style={{
            borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.border}`,
            padding: '16px 18px',
            background: theme.colors.bgCard,
            boxShadow: theme.shadow.sm,
          }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{card.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>{card.value}</div>
            <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>{card.sub}</div>
          </div>
        ))}
      </section>

      <section style={{ display: 'grid', gap: 20 }}>
        {categories.map((category) => (
          <div key={category.label} style={{
            borderRadius: theme.radius.lg,
            border: `1px solid ${theme.colors.border}`,
            background: theme.colors.bgCard,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{category.icon}</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{category.label}</div>
                  <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>{category.description}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {category.vendors.map((vendor) => (
                <div key={vendor.name} style={{
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  padding: '12px 14px',
                  background: theme.colors.bg,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontWeight: 600 }}>{vendor.name}</div>
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
                  {vendor.lastSync && (
                    <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Last sync: {vendor.lastSync}</div>
                  )}
                  <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>{vendor.dataPoints}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section style={{ borderRadius: theme.radius.lg, border: `1px solid ${theme.colors.border}`, padding: 24, background: theme.colors.bgCard }}>
        <h2 style={{ margin: '0 0 10px' }}>What Swoop Adds</h2>
        <p style={{ margin: '0 0 14px', color: theme.colors.textSecondary }}>
          Combining systems creates intelligence no single vendor provides:
        </p>
        <ul style={{ margin: 0, paddingLeft: 18, color: theme.colors.textPrimary, lineHeight: 1.6 }}>
          {ADDED_INTELLIGENCE.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>
    </div>
  
    </>
    );
}
