import { useMemo, useState } from 'react';
import { theme } from '@/config/theme';
import { getConnectedSystems } from '@/services/integrationsService';
import TwoLayerDiagram from '@/components/ui/TwoLayerDiagram.jsx';
import DataSourceComparison from '@/components/ui/DataSourceComparison.jsx';
import CollapsibleSection from '@/components/ui/CollapsibleSection.jsx';

import PageTransition from '@/components/ui/PageTransition';

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
  const [statusFilter, setStatusFilter] = useState('all');

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

  const summaryCards = [
    { label: 'Connected Systems', value: `${connectedSystems}/${totalSystems}`, sub: 'Live connectors' },
    { label: 'Data Points Synced', value: dataPointsSynced >= 1000 ? `${(dataPointsSynced / 1000).toFixed(1)}K` : dataPointsSynced.toLocaleString(), sub: 'This week' },
    { 
      label: 'Insights Unlocked', 
      value: `${intelligenceScore}%`, 
      sub: 'Connect more systems to unlock more insights',
      color: getScoreColor(intelligenceScore),
      tooltip: `${intelligenceScore}% of possible insights available. Connect ${totalSystems - connectedSystems} more systems to unlock the full picture.`
    },
  ];

  const categories = CATEGORY_CONFIG.map((category) => ({
    ...category,
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
      {/* GMC-07: Reordered - diagram first, then What Swoop Adds, then comparison */}
      
      {/* GMC-06: Two-Layer Intelligence diagram - collapsible, default collapsed */}
      <CollapsibleSection 
        title="Why Swoop sees what others miss — Two layers of intelligence" 
        icon="🔍"
        defaultExpanded={false}
      >
        <div style={{ marginTop: theme.spacing.md }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
            {[
              {
                label: 'Layer 1 — Swoop Member App',
                color: theme.colors.accent,
                description: 'Real-time behavioral data your existing systems cannot capture.',
                signals: ['GPS on-course tracking', 'In-app ordering and requests', 'Push notification engagement', 'Social activity and preferences'],
                tagline: 'The Swoop app captures what happens between transactions.',
              },
              {
                label: 'Layer 2 — Club System Integrations',
                color: theme.colors.success,
                description: '28 integrations with your existing tee sheet, POS, CRM, and scheduling systems.',
                signals: ['Tee times and rounds played', 'F&B spend and dining frequency', 'Dues payments and member status', 'Staff schedules and event calendars'],
                tagline: 'Your existing systems tell us what happened. The app tells us what is happening now.',
              },
            ].map((layer, i) => (
              <div key={i} style={{
                borderLeft: '4px solid ' + layer.color,
                background: layer.color + '08',
                borderRadius: theme.radius.sm,
                padding: theme.spacing.md,
              }}>
                <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: layer.color, marginBottom: '4px' }}>
                  {layer.label}
                </div>
                <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: '8px' }}>
                  {layer.description}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px' }}>
                  {layer.signals.map((signal) => (
                    <div key={signal} style={{
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.textPrimary,
                      background: theme.colors.bgCard,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid ' + theme.colors.border,
                    }}>
                      {signal}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: theme.fontSize.xs, fontStyle: 'italic', color: theme.colors.textMuted, marginTop: '8px' }}>
                  {layer.tagline}
                </div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: theme.spacing.md,
            textAlign: 'center',
            fontSize: theme.fontSize.sm,
            fontWeight: 700,
            color: theme.colors.textPrimary,
            padding: '10px',
            background: theme.colors.bgDeep,
            borderRadius: theme.radius.sm,
          }}>
            Together: cross-domain intelligence that catches churn signals competitors miss.
          </div>
        </div>
      </CollapsibleSection>

      {/* What Swoop Adds section - moved up per GMC-07 */}
      <section style={{ 
        borderRadius: theme.radius.lg, 
        border: `1px solid ${theme.colors.border}`, 
        padding: 24, 
        background: theme.colors.bgCard,
        boxShadow: theme.shadow.sm,
      }}>
        <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 700 }}>What Swoop Adds</h2>
        <p style={{ margin: '0 0 14px', color: theme.colors.textSecondary }}>
          Combining systems creates intelligence no single vendor provides:
        </p>
        <ul style={{ margin: 0, paddingLeft: 18, color: theme.colors.textPrimary, lineHeight: 1.6 }}>
          {ADDED_INTELLIGENCE.map((point) => (
            <li key={point} style={{ marginBottom: 8 }}>{point}</li>
          ))}
        </ul>
      </section>

      {/* GMC-06: Data comparison table - collapsible, default collapsed */}
      <CollapsibleSection 
        title="Data depth comparison — Same data source. Deeper intelligence." 
        icon="📊"
        defaultExpanded={false}
      >
        <div style={{ overflowX: 'auto', marginTop: theme.spacing.md }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
            <thead>
              <tr style={{ background: theme.colors.bgDeep }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.textPrimary, borderBottom: '1px solid ' + theme.colors.border }}>Data Type</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.textMuted, borderBottom: '1px solid ' + theme.colors.border }}>Single-System View</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.accent, borderBottom: '1px solid ' + theme.colors.border }}>Swoop Intelligence</th>
              </tr>
            </thead>
            <tbody>
              {[
                { dataType: 'Tee time bookings', competitors: 'Rounds played, no-shows', swoop: 'Rounds + GPS pace tracking + post-round behavior' },
                { dataType: 'Dining activity', competitors: 'Check totals, covers', swoop: 'Checks + wait times + turn-stand-to-table conversion' },
                { dataType: 'Member engagement', competitors: 'Last visit date, dues status', swoop: 'Multi-signal decay curve across 6+ touchpoints' },
                { dataType: 'Staffing coverage', competitors: 'Scheduled shifts', swoop: 'Demand-driven gaps + service quality correlation' },
                { dataType: 'On-course behavior', competitors: 'Not captured', swoop: 'GPS tracking: pace, 9-hole exits, practice range visits' },
                { dataType: 'Churn prediction', competitors: 'Manual review or none', swoop: 'AI health scores with 6-8 week early warning' },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={{ padding: '10px 12px', fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary, borderBottom: '1px solid ' + theme.colors.borderLight }}>{row.dataType}</td>
                  <td style={{ padding: '10px 12px', fontSize: theme.fontSize.sm, color: theme.colors.textMuted, borderBottom: '1px solid ' + theme.colors.borderLight }}>{row.competitors}</td>
                  <td style={{ padding: '10px 12px', fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, fontWeight: 500, borderBottom: '1px solid ' + theme.colors.borderLight }}>{row.swoop}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

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
            position: 'relative',
          }} title={card.tooltip}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{card.label}</div>
            <div style={{ 
              fontSize: 28, 
              fontWeight: 700, 
              marginTop: 6,
              color: card.color || theme.colors.textPrimary
            }}>{card.value}</div>
            <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>{card.sub}</div>
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
        <span style={{ fontSize: 14, color: theme.colors.textMuted, marginRight: 8 }}>Filter:</span>
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
              border: `1px solid ${statusFilter === filter.value ? theme.colors.primary : theme.colors.border}`,
              borderRadius: theme.radius.md,
              background: statusFilter === filter.value ? `${theme.colors.primary}15` : theme.colors.bg,
              color: statusFilter === filter.value ? theme.colors.primary : theme.colors.textSecondary,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {filter.label}
          </button>
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
                  {/* GMC-01: Show timestamps for ALL connected cards */}
                  {vendor.status === 'connected' && (
                    <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                      Last sync: {vendor.lastSync || '2m ago'}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>{vendor.dataPoints}</div>
                  {/* GMC-02: Add Connect button to available cards */}
                  {vendor.status === 'available' && (
                    <button
                      onClick={() => alert(`Connect ${vendor.name} - Integration setup will be available in the next release`)}
                      style={{
                        marginTop: 4,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        border: `1px solid ${theme.colors.primary}`,
                        borderRadius: theme.radius.sm,
                        background: theme.colors.primary,
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Connect Now
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
    </PageTransition>
    );
}
