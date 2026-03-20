import { useState } from 'react';
import { theme } from '@/config/theme';
import { Panel } from '@/components/ui';
import PageTransition from '@/components/ui/PageTransition';

// ── Tab definitions ──────────────────────────────────────────────────
const TABS = [
  { key: 'users', label: 'Users & Roles', icon: '👥' },
  { key: 'integrations', label: 'Integrations', icon: '🔌' },
  { key: 'notifications', label: 'Notifications', icon: '🔔' },
  { key: 'club', label: 'Club Profile', icon: '🏌️' },
  { key: 'billing', label: 'Billing', icon: '💳' },
  { key: 'security', label: 'Security', icon: '🔒' },
];

// ── Styles ───────────────────────────────────────────────────────────
const s = {
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textPrimary,
    background: theme.colors.bgDeep,
    border: '1px solid ' + theme.colors.border,
    borderRadius: theme.radius.sm,
    outline: 'none',
    boxSizing: 'border-box',
  },
  label: {
    display: 'block',
    fontSize: theme.fontSize.xs,
    fontWeight: 600,
    color: theme.colors.textSecondary,
    marginBottom: '6px',
  },
  fieldGroup: {
    marginBottom: '16px',
  },
  badge: (color, bg) => ({
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 10px',
    borderRadius: '12px',
    color,
    background: bg,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  }),
  btn: (variant) => ({
    padding: '8px 20px',
    borderRadius: theme.radius.sm,
    border: variant === 'primary' ? 'none' : '1px solid ' + theme.colors.border,
    background: variant === 'primary' ? theme.colors.accent : 'transparent',
    color: variant === 'primary' ? '#fff' : theme.colors.textPrimary,
    fontWeight: 600,
    fontSize: theme.fontSize.sm,
    cursor: 'pointer',
    fontFamily: theme.fonts.sans,
  }),
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: theme.colors.textPrimary,
    marginBottom: '12px',
  },
  sectionDesc: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginBottom: '16px',
    lineHeight: 1.5,
  },
  divider: {
    borderTop: '1px solid ' + theme.colors.border,
    margin: '20px 0',
  },
};


// ═══════════════════════════════════════════════════════════════════════
// USERS & ROLES TAB
// ═══════════════════════════════════════════════════════════════════════
const MOCK_USERS = [
  { id: 1, name: 'Sarah Mitchell', email: 'sarah@oakmonthills.com', role: 'General Manager', status: 'active', lastLogin: '2 hours ago' },
  { id: 2, name: 'Tom Bradford', email: 'tom@oakmonthills.com', role: 'Assistant GM', status: 'active', lastLogin: '1 day ago' },
  { id: 3, name: 'Maria Chen', email: 'maria@oakmonthills.com', role: 'F&B Director', status: 'active', lastLogin: '3 hours ago' },
  { id: 4, name: 'Jeff Nguyen', email: 'jeff@oakmonthills.com', role: 'Head Golf Pro', status: 'active', lastLogin: '5 hours ago' },
  { id: 5, name: 'Lisa Park', email: 'lisa@oakmonthills.com', role: 'Membership Director', status: 'active', lastLogin: '12 hours ago' },
  { id: 6, name: 'Dave Wilson', email: 'dave@oakmonthills.com', role: 'Controller', status: 'invited', lastLogin: 'Never' },
];

const ROLES = ['General Manager', 'Assistant GM', 'F&B Director', 'Head Golf Pro', 'Membership Director', 'Controller', 'Events Manager', 'View Only'];

function UsersTab() {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={s.sectionTitle}>Staff Users</div>
          <div style={s.sectionDesc}>Manage who has access to the Swoop dashboard and what they can see.</div>
        </div>
        <button style={s.btn('primary')} onClick={() => setShowInvite(!showInvite)}>
          + Invite User
        </button>
      </div>

      {showInvite && (
        <Panel>
          <div style={s.sectionTitle}>Invite New User</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
            <div style={s.fieldGroup}>
              <label style={s.label}>Full Name</label>
              <input style={s.input} placeholder="Jane Smith" />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Email</label>
              <input style={s.input} type="email" placeholder="jane@oakmonthills.com" />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Role</label>
              <select style={s.input}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={s.fieldGroup}>
              <button style={s.btn('primary')}>Send Invite</button>
            </div>
          </div>
        </Panel>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {MOCK_USERS.map(user => (
          <div key={user.id} style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1.5fr 1fr 0.8fr 0.8fr auto',
            gap: '12px',
            alignItems: 'center',
            padding: '14px 16px',
            background: theme.colors.bgCard,
            border: '1px solid ' + theme.colors.border,
            borderRadius: theme.radius.sm,
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>{user.name}</div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{user.email}</div>
            </div>
            <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>{user.role}</div>
            <div>
              <span style={s.badge(
                user.status === 'active' ? '#15803D' : '#B45309',
                user.status === 'active' ? '#F0FDF4' : '#FFFBEB'
              )}>
                {user.status}
              </span>
            </div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{user.lastLogin}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ ...s.btn('ghost'), padding: '4px 10px', fontSize: '12px' }}>Edit</button>
              <button style={{ ...s.btn('ghost'), padding: '4px 10px', fontSize: '12px', color: theme.colors.danger500 }}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div style={s.divider} />

      <div style={s.sectionTitle}>Role Permissions</div>
      <div style={s.sectionDesc}>Define what each role can access. Changes apply to all users with that role.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        {ROLES.map(role => (
          <div key={role} style={{
            padding: '14px',
            background: theme.colors.bgCard,
            border: '1px solid ' + theme.colors.border,
            borderRadius: theme.radius.sm,
          }}>
            <div style={{ fontWeight: 600, fontSize: theme.fontSize.sm, marginBottom: '6px', color: theme.colors.textPrimary }}>{role}</div>
            <div style={{ fontSize: '11px', color: theme.colors.textMuted, lineHeight: 1.5 }}>
              {role === 'General Manager' && 'Full access. Approve actions, manage users, view all data.'}
              {role === 'Assistant GM' && 'Full access except user management and billing.'}
              {role === 'F&B Director' && 'F&B dashboards, dining insights, staffing for F&B.'}
              {role === 'Head Golf Pro' && 'Tee sheet demand, pace of play, member engagement.'}
              {role === 'Membership Director' && 'Member health, retention, outreach playbooks.'}
              {role === 'Controller' && 'Revenue dashboards, billing, financial reports.'}
              {role === 'Events Manager' && 'Events, catering, capacity management.'}
              {role === 'View Only' && 'Read-only access to all dashboards. No actions.'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════
// INTEGRATIONS TAB
// ═══════════════════════════════════════════════════════════════════════
const INTEGRATION_CATEGORIES = [
  {
    category: 'Communication',
    icon: '💬',
    description: 'Connect communication channels for member outreach, alerts, and GM notifications.',
    integrations: [
      { name: 'Gmail', icon: '📧', status: 'available', description: 'Send personalized member outreach emails directly from Swoop.', features: ['Send/receive emails', 'Email templates', 'Thread tracking', 'Attachment support'] },
      { name: 'Google Calendar', icon: '📅', status: 'available', description: 'Sync club events, tee times, and GM meetings.', features: ['Event sync', 'Availability checking', 'Meeting scheduling', 'Reminders'] },
      { name: 'Twilio SMS', icon: '📱', status: 'available', description: 'Send text alerts to members for tee time changes, weather updates, and outreach.', features: ['SMS notifications', 'Two-way messaging', 'Bulk alerts', 'Delivery tracking'] },
      { name: 'Twilio Voice', icon: '📞', status: 'coming-soon', description: 'Automated call reminders and voice alerts for high-priority member outreach.', features: ['Outbound calls', 'Voicemail drops', 'Call logging', 'IVR flows'] },
      { name: 'SendGrid', icon: '✉️', status: 'available', description: 'Transactional and marketing email delivery with analytics.', features: ['Bulk email', 'Template engine', 'Bounce handling', 'Analytics'] },
      { name: 'Slack', icon: '💬', status: 'available', description: 'Push Swoop alerts and agent recommendations to your team Slack channel.', features: ['Alert channels', 'Action buttons', 'Thread replies', 'Bot commands'] },
      { name: 'Microsoft Teams', icon: '🟦', status: 'coming-soon', description: 'Integrate Swoop notifications with Microsoft Teams channels.', features: ['Channel alerts', 'Adaptive cards', 'Meeting scheduling', 'Bot integration'] },
    ],
  },
  {
    category: 'Calendar & Scheduling',
    icon: '📅',
    description: 'Sync calendars for event management, tee time coordination, and staff scheduling.',
    integrations: [
      { name: 'Google Calendar', icon: '📅', status: 'available', description: 'Two-way sync for club events, meetings, and member appointments.', features: ['Event sync', 'Availability', 'Room booking', 'Recurring events'] },
      { name: 'Outlook Calendar', icon: '📆', status: 'available', description: 'Microsoft 365 calendar integration for staff coordination.', features: ['Event sync', 'Shared calendars', 'Room scheduling', 'Notifications'] },
      { name: 'Calendly', icon: '🗓️', status: 'coming-soon', description: 'Member appointment scheduling for tours, lessons, and consultations.', features: ['Booking pages', 'Buffer times', 'Team scheduling', 'Reminders'] },
    ],
  },
  {
    category: 'Tee Sheet & Golf',
    icon: '⛳',
    description: 'Connect tee sheet systems for demand intelligence, pace-of-play, and booking optimization.',
    integrations: [
      { name: 'ForeTees', icon: '⛳', status: 'connected', description: 'Primary tee sheet — rounds, tee times, no-shows, and pace data.', features: ['Tee time sync', 'No-show tracking', 'Pace of play', 'Booking analytics'] },
      { name: 'Club Caddie', icon: '🏌️', status: 'available', description: 'Public and member tee data for mixed-access clubs.', features: ['Booking sync', 'Member/public split', 'Revenue tracking', 'Dynamic pricing'] },
      { name: 'EZLinks', icon: '🔗', status: 'available', description: 'Booking pace, pricing rules, and yield management.', features: ['Price optimization', 'Channel management', 'Package tracking', 'Utilization'] },
      { name: 'Golf Genius', icon: '🏆', status: 'coming-soon', description: 'Tournament pairings, scorecards, and event management.', features: ['Event scoring', 'Handicap sync', 'Pairing sheets', 'Leaderboards'] },
      { name: 'Chronogolf', icon: '⏱️', status: 'coming-soon', description: 'Lightspeed-powered tee time management and analytics.', features: ['Booking flow', 'Cancellation patterns', 'Revenue analytics', 'Member profiles'] },
    ],
  },
  {
    category: 'POS & Dining',
    icon: '🧾',
    description: 'Point-of-sale integrations for F&B spend tracking, dining patterns, and revenue analysis.',
    integrations: [
      { name: 'Northstar POS', icon: '🧾', status: 'connected', description: 'Primary POS — dining frequency, average check, outlet tracking.', features: ['Check sync', 'Cover counts', 'Outlet breakdown', 'Spend trends'] },
      { name: 'Clubessential POS', icon: '🏢', status: 'available', description: 'Checks, covers, promo usage tracking across outlets.', features: ['Transaction sync', 'Promo tracking', 'Tab management', 'Reporting'] },
      { name: 'Toast', icon: '🍞', status: 'available', description: 'Restaurant-grade POS with kitchen and server analytics.', features: ['Modifier analysis', 'Kitchen timing', 'Server performance', 'Menu mix'] },
      { name: 'Square POS', icon: '◻️', status: 'coming-soon', description: 'Transaction mix, tender breakdown, and tip analytics.', features: ['Payment sync', 'Tip analysis', 'Refund tracking', 'Tender types'] },
    ],
  },
  {
    category: 'CRM & Membership',
    icon: '👥',
    description: 'Member database systems for profiles, tenure, dues, health scores, and lifecycle management.',
    integrations: [
      { name: 'Clubessential CMS', icon: '🏢', status: 'connected', description: 'Primary CRM — members, dues ledger, households.', features: ['Member sync', 'Dues tracking', 'Household linking', 'Lifecycle events'] },
      { name: 'Jonas Club', icon: '🏛️', status: 'available', description: 'Profiles, statements, events, and club accounting.', features: ['Statement sync', 'Event attendance', 'Profile data', 'Committee tracking'] },
      { name: 'Northstar CRM', icon: '⭐', status: 'available', description: 'Health scores, segments, and balance tracking.', features: ['Scoring models', 'Segmentation', 'Balance alerts', 'Engagement tracking'] },
      { name: 'Salesforce', icon: '☁️', status: 'coming-soon', description: 'Enterprise CRM for prospect pipeline and lead management.', features: ['Lead tracking', 'Opportunity management', 'Task automation', 'Report builder'] },
      { name: 'HubSpot CRM', icon: '🟠', status: 'coming-soon', description: 'Contact management, deal pipeline, and marketing automation.', features: ['Contact sync', 'Deal stages', 'Email sequences', 'Form capture'] },
    ],
  },
  {
    category: 'Email & Marketing',
    icon: '✉️',
    description: 'Email marketing platforms for campaign analytics, open rates, and engagement decay tracking.',
    integrations: [
      { name: 'Constant Contact', icon: '✉️', status: 'available', description: 'Campaign sends, opens, and click-through analytics.', features: ['Campaign sync', 'Open tracking', 'Click analytics', 'List management'] },
      { name: 'Mailchimp', icon: '🐵', status: 'available', description: 'Audiences, campaign metrics, and engagement trends.', features: ['Audience sync', 'Automation triggers', 'A/B testing', 'Revenue attribution'] },
      { name: 'HubSpot Marketing', icon: '🟠', status: 'available', description: 'Email workflows, form conversion, and lead scoring.', features: ['Workflow sync', 'Lead scoring', 'Form tracking', 'Attribution'] },
      { name: 'Campaign Monitor', icon: '📊', status: 'coming-soon', description: 'Automation journeys and behavioral email triggers.', features: ['Journey builder', 'Segmentation', 'Analytics', 'Transactional email'] },
    ],
  },
  {
    category: 'Staffing & Labor',
    icon: '🕐',
    description: 'Workforce management for coverage optimization, labor cost tracking, and schedule alignment.',
    integrations: [
      { name: 'ADP Workforce', icon: '📋', status: 'connected', description: 'Schedules, clock events, overtime, and compliance.', features: ['Schedule sync', 'Clock events', 'Overtime alerts', 'Compliance tracking'] },
      { name: '7shifts', icon: '📅', status: 'available', description: 'Coverage plans, shift swaps, and role compliance.', features: ['Shift management', 'Swap tracking', 'Labor forecasts', 'Tip pooling'] },
      { name: 'HotSchedules', icon: '🔥', status: 'available', description: 'Labor forecasts, punches, and scheduling optimization.', features: ['Forecast sync', 'Punch data', 'Compliance', 'Manager tools'] },
      { name: 'Deputy', icon: '⏰', status: 'coming-soon', description: 'Timesheets, compliance alerts, and task management.', features: ['Timesheet sync', 'Compliance alerts', 'Task tracking', 'News feed'] },
      { name: 'Paycom', icon: '💰', status: 'coming-soon', description: 'Payroll integration with labor cost allocation.', features: ['Payroll sync', 'Labor costing', 'Benefits tracking', 'Tax compliance'] },
    ],
  },
  {
    category: 'Accounting & Finance',
    icon: '📊',
    description: 'Financial systems for revenue tracking, dues reconciliation, and ROI calculations.',
    integrations: [
      { name: 'QuickBooks Online', icon: '📗', status: 'available', description: 'Journal entries, receivables, and class reporting.', features: ['GL sync', 'Receivables', 'Class tracking', 'P&L reports'] },
      { name: 'Sage Intacct', icon: '📊', status: 'available', description: 'Enterprise accounting with dimensional reporting.', features: ['GL entries', 'Dimensions', 'Budgets', 'Custom reports'] },
      { name: 'Club Prophet', icon: '📈', status: 'available', description: 'Member spend tracking and inventory management.', features: ['Spend sync', 'Inventory', 'Variance reports', 'Budget vs actual'] },
      { name: 'Xero', icon: '🔵', status: 'coming-soon', description: 'Cloud accounting for smaller club operations.', features: ['Invoice sync', 'Bank feeds', 'Payroll', 'Reporting'] },
    ],
  },
  {
    category: 'Weather & External Data',
    icon: '🌤️',
    description: 'External data feeds for demand prediction, event planning, and operational adjustments.',
    integrations: [
      { name: 'Weather API', icon: '🌤️', status: 'connected', description: 'Real-time and forecast weather data for demand prediction.', features: ['Current conditions', '10-day forecast', 'Severe alerts', 'Historical data'] },
      { name: 'Google Maps', icon: '🗺️', status: 'coming-soon', description: 'Location intelligence and drive-time analysis.', features: ['Geocoding', 'Drive times', 'Nearby amenities', 'Traffic patterns'] },
    ],
  },
  {
    category: 'Payment Processing',
    icon: '💳',
    description: 'Payment gateways for dues collection, event payments, and transaction analytics.',
    integrations: [
      { name: 'Stripe', icon: '💳', status: 'available', description: 'Payment processing, subscription management, and payout tracking.', features: ['Payment sync', 'Subscription management', 'Refund tracking', 'Payout reports'] },
      { name: 'Square Payments', icon: '◻️', status: 'coming-soon', description: 'In-person and online payment processing.', features: ['Transaction sync', 'Terminal integration', 'Invoicing', 'Reporting'] },
    ],
  },
  {
    category: 'Analytics & Reporting',
    icon: '📈',
    description: 'Analytics platforms for website tracking, engagement measurement, and custom reporting.',
    integrations: [
      { name: 'Google Analytics', icon: '📊', status: 'available', description: 'Website and app analytics for member digital engagement.', features: ['Page tracking', 'Event tracking', 'Conversion funnels', 'Audience segments'] },
      { name: 'GGA PerformanceAI', icon: '🏢', status: 'coming-soon', description: 'Industry benchmarks, forecast accuracy, and performance alerts.', features: ['Benchmark sync', 'Forecast models', 'Alert rules', 'Custom KPIs'] },
      { name: 'Looker / Data Studio', icon: '🔍', status: 'coming-soon', description: 'Custom dashboard builder for advanced reporting.', features: ['Data connector', 'Dashboard embed', 'Scheduled reports', 'Collaboration'] },
    ],
  },
  {
    category: 'Social & Reviews',
    icon: '📱',
    description: 'Social media and review platforms for reputation management and member engagement.',
    integrations: [
      { name: 'Facebook / Meta', icon: '📘', status: 'coming-soon', description: 'Page management, event promotion, and ad targeting.', features: ['Post scheduling', 'Event sync', 'Ad audiences', 'Review monitoring'] },
      { name: 'Instagram', icon: '📸', status: 'coming-soon', description: 'Visual content scheduling and engagement tracking.', features: ['Post scheduling', 'Story analytics', 'Hashtag tracking', 'Engagement metrics'] },
      { name: 'Google Business', icon: '🏪', status: 'coming-soon', description: 'Business profile management, reviews, and Q&A.', features: ['Review alerts', 'Response management', 'Photo updates', 'Post publishing'] },
      { name: 'Yelp', icon: '⭐', status: 'coming-soon', description: 'Review monitoring and response management.', features: ['Review alerts', 'Response tools', 'Rating trends', 'Competitor tracking'] },
    ],
  },
  {
    category: 'Document & Storage',
    icon: '📁',
    description: 'File storage and document management for contracts, reports, and member documents.',
    integrations: [
      { name: 'Google Drive', icon: '📂', status: 'coming-soon', description: 'Store and share reports, contracts, and board packets.', features: ['File sync', 'Folder management', 'Sharing controls', 'Version history'] },
      { name: 'Dropbox', icon: '📦', status: 'coming-soon', description: 'Cloud file storage with team collaboration.', features: ['File sync', 'Team folders', 'Link sharing', 'Activity tracking'] },
      { name: 'DocuSign', icon: '✍️', status: 'coming-soon', description: 'Digital signatures for membership agreements and contracts.', features: ['Envelope tracking', 'Template management', 'Signing workflows', 'Audit trail'] },
    ],
  },
];

const STATUS_CONFIG = {
  connected: { label: 'Connected', color: '#15803D', bg: '#F0FDF4' },
  available: { label: 'Available', color: '#1D4ED8', bg: '#EFF6FF' },
  'coming-soon': { label: 'Coming Soon', color: '#B45309', bg: '#FFFBEB' },
};

function IntegrationCard({ integration }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[integration.status];

  return (
    <div style={{
      padding: '14px',
      background: theme.colors.bgCard,
      border: '1px solid ' + theme.colors.border,
      borderRadius: theme.radius.sm,
      cursor: 'pointer',
      transition: 'border-color 0.15s',
    }} onClick={() => setExpanded(!expanded)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>{integration.icon}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>{integration.name}</div>
            <div style={{ fontSize: '11px', color: theme.colors.textMuted, marginTop: '2px' }}>{integration.description}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={s.badge(cfg.color, cfg.bg)}>{cfg.label}</span>
          <span style={{ fontSize: '12px', color: theme.colors.textMuted, transition: 'transform 0.15s', transform: expanded ? 'rotate(180deg)' : 'none' }}>&#9660;</span>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid ' + theme.colors.border }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.textSecondary, marginBottom: '8px' }}>Capabilities</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
            {integration.features.map(f => (
              <span key={f} style={{
                fontSize: '11px',
                padding: '3px 10px',
                borderRadius: '12px',
                background: theme.colors.bgDeep,
                color: theme.colors.textSecondary,
                border: '1px solid ' + theme.colors.border,
              }}>{f}</span>
            ))}
          </div>
          {integration.status === 'connected' ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button style={s.btn('ghost')}>Configure</button>
              <button style={{ ...s.btn('ghost'), color: theme.colors.danger500 }}>Disconnect</button>
              <span style={{ fontSize: '11px', color: theme.colors.success500, marginLeft: 'auto' }}>Last synced: 5 min ago</span>
            </div>
          ) : integration.status === 'available' ? (
            <button style={s.btn('primary')}>Connect</button>
          ) : (
            <div style={{ fontSize: '12px', color: theme.colors.textMuted, fontStyle: 'italic' }}>This integration is on our roadmap. Contact support to express interest.</div>
          )}
        </div>
      )}
    </div>
  );
}

function IntegrationsTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = INTEGRATION_CATEGORIES.map(cat => ({
    ...cat,
    integrations: cat.integrations.filter(i => {
      const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'all' || i.status === filter;
      return matchSearch && matchFilter;
    }),
  })).filter(cat => cat.integrations.length > 0);

  const totalConnected = INTEGRATION_CATEGORIES.flatMap(c => c.integrations).filter(i => i.status === 'connected').length;
  const totalAvailable = INTEGRATION_CATEGORIES.flatMap(c => c.integrations).filter(i => i.status === 'available').length;
  const totalComingSoon = INTEGRATION_CATEGORIES.flatMap(c => c.integrations).filter(i => i.status === 'coming-soon').length;

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          style={{ ...s.input, maxWidth: '280px' }}
          placeholder="Search integrations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { key: 'all', label: `All (${totalConnected + totalAvailable + totalComingSoon})` },
            { key: 'connected', label: `Connected (${totalConnected})` },
            { key: 'available', label: `Available (${totalAvailable})` },
            { key: 'coming-soon', label: `Coming Soon (${totalComingSoon})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: filter === f.key ? 'none' : '1px solid ' + theme.colors.border,
              background: filter === f.key ? theme.colors.accent : 'transparent',
              color: filter === f.key ? '#fff' : theme.colors.textSecondary,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: theme.fonts.sans,
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {filtered.map(cat => (
        <div key={cat.category} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px' }}>{cat.icon}</span>
            <div style={s.sectionTitle}>{cat.category}</div>
          </div>
          <div style={{ ...s.sectionDesc, marginTop: '-4px' }}>{cat.description}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {cat.integrations.map(i => <IntegrationCard key={i.name} integration={i} />)}
          </div>
        </div>
      ))}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════
// NOTIFICATIONS TAB
// ═══════════════════════════════════════════════════════════════════════
const NOTIFICATION_SETTINGS = [
  {
    section: 'Member Alerts',
    items: [
      { key: 'member_at_risk', label: 'Member flagged at-risk', description: 'Health score drops below threshold', channels: { email: true, sms: false, push: true, slack: true } },
      { key: 'member_save', label: 'Member save confirmed', description: 'At-risk member re-engages after intervention', channels: { email: true, sms: false, push: true, slack: true } },
      { key: 'resignation_risk', label: 'Resignation risk detected', description: 'Member shows strong exit signals', channels: { email: true, sms: true, push: true, slack: true } },
      { key: 'health_score_change', label: 'Health score change > 15 pts', description: 'Significant change in member engagement', channels: { email: false, sms: false, push: true, slack: false } },
    ],
  },
  {
    section: 'Operational Alerts',
    items: [
      { key: 'service_failure', label: 'Service failure detected', description: 'Operational issue caught before member impact', channels: { email: true, sms: true, push: true, slack: true } },
      { key: 'weather_alert', label: 'Weather impact on tee times', description: 'Severe weather affecting scheduled rounds', channels: { email: true, sms: true, push: true, slack: true } },
      { key: 'staffing_gap', label: 'Staffing gap detected', description: 'Coverage falls below minimum for shift', channels: { email: true, sms: true, push: true, slack: false } },
      { key: 'capacity_alert', label: 'Capacity threshold exceeded', description: 'Event or dining at >90% capacity', channels: { email: false, sms: false, push: true, slack: true } },
    ],
  },
  {
    section: 'Revenue Alerts',
    items: [
      { key: 'revenue_anomaly', label: 'Revenue anomaly', description: 'F&B or dues revenue deviates >15% from forecast', channels: { email: true, sms: false, push: true, slack: false } },
      { key: 'spend_drop', label: 'Member spend decline', description: 'Individual member spend drops >30% month-over-month', channels: { email: false, sms: false, push: true, slack: false } },
    ],
  },
  {
    section: 'System Alerts',
    items: [
      { key: 'integration_down', label: 'Integration disconnected', description: 'Connected system stops syncing data', channels: { email: true, sms: false, push: true, slack: true } },
      { key: 'data_sync', label: 'Data sync complete', description: 'Scheduled data import finishes', channels: { email: false, sms: false, push: false, slack: true } },
      { key: 'report_ready', label: 'Board report ready', description: 'Monthly board report generated', channels: { email: true, sms: false, push: true, slack: false } },
    ],
  },
];

function ToggleSwitch({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} style={{
      width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
      background: checked ? theme.colors.accent : theme.colors.bgDeep,
      position: 'relative', transition: 'background 0.15s',
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <div style={{
        width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
        position: 'absolute', top: '2px', transition: 'left 0.15s',
        left: checked ? '18px' : '2px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
      }} />
    </button>
  );
}

function NotificationsTab() {
  const [settings, setSettings] = useState(() => {
    const map = {};
    NOTIFICATION_SETTINGS.forEach(sec => sec.items.forEach(item => { map[item.key] = { ...item.channels }; }));
    return map;
  });

  const toggle = (key, channel) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], [channel]: !prev[key][channel] },
    }));
  };

  const CHANNELS = [
    { key: 'email', label: 'Email' },
    { key: 'sms', label: 'SMS' },
    { key: 'push', label: 'Push' },
    { key: 'slack', label: 'Slack' },
  ];

  return (
    <div>
      <div style={s.sectionDesc}>Configure how and when your team receives alerts from Swoop. Each notification can be enabled per channel.</div>

      {NOTIFICATION_SETTINGS.map(sec => (
        <div key={sec.section} style={{ marginBottom: '24px' }}>
          <div style={s.sectionTitle}>{sec.section}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sec.items.map(item => (
              <div key={item.key} style={{
                display: 'grid',
                gridTemplateColumns: '1fr repeat(4, 60px)',
                gap: '8px',
                alignItems: 'center',
                padding: '12px 16px',
                background: theme.colors.bgCard,
                border: '1px solid ' + theme.colors.border,
                borderRadius: theme.radius.sm,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: theme.colors.textMuted }}>{item.description}</div>
                </div>
                {CHANNELS.map(ch => (
                  <div key={ch.key} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: theme.colors.textMuted, marginBottom: '4px', textTransform: 'uppercase' }}>{ch.label}</div>
                    <ToggleSwitch checked={settings[item.key][ch.key]} onChange={() => toggle(item.key, ch.key)} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={s.divider} />
      <div style={s.sectionTitle}>Escalation Rules</div>
      <div style={s.sectionDesc}>Define what happens when alerts go unacknowledged.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ padding: '16px', background: theme.colors.bgCard, border: '1px solid ' + theme.colors.border, borderRadius: theme.radius.sm }}>
          <div style={{ fontWeight: 600, fontSize: theme.fontSize.sm, marginBottom: '8px', color: theme.colors.textPrimary }}>First Escalation</div>
          <div style={s.fieldGroup}>
            <label style={s.label}>If unacknowledged after</label>
            <select style={s.input}><option>30 minutes</option><option>1 hour</option><option>2 hours</option><option>4 hours</option></select>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Escalate to</label>
            <select style={s.input}><option>Assistant GM</option>{ROLES.map(r => <option key={r}>{r}</option>)}</select>
          </div>
        </div>
        <div style={{ padding: '16px', background: theme.colors.bgCard, border: '1px solid ' + theme.colors.border, borderRadius: theme.radius.sm }}>
          <div style={{ fontWeight: 600, fontSize: theme.fontSize.sm, marginBottom: '8px', color: theme.colors.textPrimary }}>Second Escalation</div>
          <div style={s.fieldGroup}>
            <label style={s.label}>If still unacknowledged after</label>
            <select style={s.input}><option>2 hours</option><option>4 hours</option><option>8 hours</option><option>24 hours</option></select>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Escalate to</label>
            <select style={s.input}><option>General Manager</option>{ROLES.map(r => <option key={r}>{r}</option>)}</select>
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════
// CLUB PROFILE TAB
// ═══════════════════════════════════════════════════════════════════════
function ClubProfileTab() {
  return (
    <div>
      <div style={s.sectionTitle}>Club Information</div>
      <div style={s.sectionDesc}>Basic details about your club. These appear in reports and member-facing communications.</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Panel>
          <div style={s.fieldGroup}>
            <label style={s.label}>Club Name</label>
            <input style={s.input} defaultValue="Oakmont Hills Country Club" />
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Address</label>
            <input style={s.input} defaultValue="1200 Oakmont Drive" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div style={s.fieldGroup}>
              <label style={s.label}>City</label>
              <input style={s.input} defaultValue="Westfield" />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>State</label>
              <input style={s.input} defaultValue="NJ" />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Zip</label>
              <input style={s.input} defaultValue="07090" />
            </div>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Phone</label>
            <input style={s.input} defaultValue="(908) 555-0142" />
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Website</label>
            <input style={s.input} defaultValue="https://oakmonthills.com" />
          </div>
        </Panel>

        <Panel>
          <div style={s.fieldGroup}>
            <label style={s.label}>Club Type</label>
            <select style={s.input}>
              <option>Private Equity</option>
              <option>Private Member-Owned</option>
              <option>Semi-Private</option>
              <option>Resort / Daily Fee</option>
            </select>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Total Members</label>
            <input style={s.input} type="number" defaultValue="487" />
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Membership Categories</label>
            <input style={s.input} defaultValue="Full, Social, Junior, Legacy, Corporate" />
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Fiscal Year Start</label>
            <select style={s.input}>
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Timezone</label>
            <select style={s.input}>
              <option>Eastern (ET)</option>
              <option>Central (CT)</option>
              <option>Mountain (MT)</option>
              <option>Pacific (PT)</option>
            </select>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Club Logo</label>
            <div style={{ padding: '20px', border: '2px dashed ' + theme.colors.border, borderRadius: theme.radius.sm, textAlign: 'center', color: theme.colors.textMuted, fontSize: theme.fontSize.xs, cursor: 'pointer' }}>
              Drop image here or click to upload (PNG, SVG)
            </div>
          </div>
        </Panel>
      </div>

      <div style={s.divider} />
      <div style={s.sectionTitle}>Amenities & Facilities</div>
      <div style={s.sectionDesc}>Check which facilities your club operates. This helps Swoop tailor dashboards and insights.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
        {['18-Hole Golf Course', '9-Hole Course', 'Practice Range', 'Pool & Aquatics', 'Tennis Courts', 'Pickleball Courts', 'Fitness Center', 'Spa', 'Main Dining Room', 'Casual Grill', 'Banquet Facilities', 'Pro Shop', 'Locker Rooms', 'Kids Programs', 'Golf Simulators'].map(a => (
          <label key={a} style={{
            display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 12px',
            background: theme.colors.bgCard, border: '1px solid ' + theme.colors.border, borderRadius: theme.radius.sm,
            fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, cursor: 'pointer',
          }}>
            <input type="checkbox" defaultChecked={['18-Hole Golf Course', 'Pool & Aquatics', 'Main Dining Room', 'Casual Grill', 'Banquet Facilities', 'Pro Shop', 'Locker Rooms', 'Practice Range', 'Fitness Center'].includes(a)} />
            {a}
          </label>
        ))}
      </div>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button style={s.btn('primary')}>Save Changes</button>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════
// BILLING TAB
// ═══════════════════════════════════════════════════════════════════════
function BillingTab() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <Panel>
          <div style={s.sectionTitle}>Current Plan</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: theme.colors.accent }}>Pro</span>
            <span style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted }}>$499/month</span>
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, lineHeight: 1.6, marginBottom: '16px' }}>
            Full dashboard access, 6 AI agents, unlimited members, all integrations, board reports, and priority support.
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={s.btn('primary')}>Upgrade to Club ($1,499/mo)</button>
            <button style={s.btn('ghost')}>View All Plans</button>
          </div>
        </Panel>

        <Panel>
          <div style={s.sectionTitle}>Usage This Period</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Members tracked', value: '487', limit: 'Unlimited' },
              { label: 'AI agent actions', value: '142', limit: '500/mo' },
              { label: 'SMS sent', value: '47', limit: '200/mo' },
              { label: 'Email sends', value: '312', limit: '2,000/mo' },
              { label: 'Data syncs', value: '1,440', limit: 'Unlimited' },
              { label: 'API calls', value: '8,291', limit: '50,000/mo' },
            ].map(u => (
              <div key={u.label} style={{ padding: '10px', background: theme.colors.bgDeep, borderRadius: theme.radius.sm }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: theme.colors.textPrimary }}>{u.value}</div>
                <div style={{ fontSize: '11px', color: theme.colors.textMuted }}>{u.label}</div>
                <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginTop: '2px' }}>Limit: {u.limit}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div style={s.sectionTitle}>Billing History</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {[
          { date: 'Mar 1, 2026', amount: '$499.00', status: 'Paid', invoice: 'INV-2026-003' },
          { date: 'Feb 1, 2026', amount: '$499.00', status: 'Paid', invoice: 'INV-2026-002' },
          { date: 'Jan 1, 2026', amount: '$499.00', status: 'Paid', invoice: 'INV-2026-001' },
          { date: 'Dec 1, 2025', amount: '$499.00', status: 'Paid', invoice: 'INV-2025-012' },
        ].map(inv => (
          <div key={inv.invoice} style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'center',
            padding: '12px 16px', background: theme.colors.bgCard, border: '1px solid ' + theme.colors.border, borderRadius: theme.radius.sm,
          }}>
            <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>{inv.date}</div>
            <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, fontFamily: theme.fonts.mono, color: theme.colors.textPrimary }}>{inv.amount}</div>
            <div><span style={s.badge('#15803D', '#F0FDF4')}>{inv.status}</span></div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{inv.invoice}</div>
            <button style={{ ...s.btn('ghost'), padding: '4px 10px', fontSize: '12px' }}>Download</button>
          </div>
        ))}
      </div>

      <div style={s.divider} />
      <div style={s.sectionTitle}>Payment Method</div>
      <div style={{ padding: '16px', background: theme.colors.bgCard, border: '1px solid ' + theme.colors.border, borderRadius: theme.radius.sm, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>💳</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>Visa ending in 4242</div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Expires 08/2027</div>
          </div>
        </div>
        <button style={s.btn('ghost')}>Update Card</button>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════
// SECURITY TAB
// ═══════════════════════════════════════════════════════════════════════
function SecurityTab() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Panel>
          <div style={s.sectionTitle}>Authentication</div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Password Policy</label>
            <select style={s.input}>
              <option>Strong (12+ chars, mixed case, number, symbol)</option>
              <option>Standard (8+ chars, mixed case, number)</option>
              <option>Basic (8+ chars)</option>
            </select>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Session Timeout</label>
            <select style={s.input}>
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>4 hours</option>
              <option>8 hours</option>
              <option>Never</option>
            </select>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Two-Factor Authentication</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ToggleSwitch checked={true} onChange={() => {}} />
              <span style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>Required for all users</span>
            </div>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Single Sign-On (SSO)</label>
            <div style={{ padding: '12px', background: theme.colors.bgDeep, borderRadius: theme.radius.sm, fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
              SSO is available on the Club plan ($1,499/mo). Supports SAML 2.0 and OAuth.
            </div>
          </div>
        </Panel>

        <Panel>
          <div style={s.sectionTitle}>Data & Privacy</div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Data Retention</label>
            <select style={s.input}>
              <option>Keep all data</option>
              <option>Auto-delete after 2 years</option>
              <option>Auto-delete after 1 year</option>
            </select>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Audit Logging</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ToggleSwitch checked={true} onChange={() => {}} />
              <span style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>Log all user actions</span>
            </div>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Data Export</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={s.btn('ghost')}>Export All Data (CSV)</button>
              <button style={s.btn('ghost')}>Export All Data (JSON)</button>
            </div>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>API Keys</label>
            <div style={{ padding: '10px 12px', background: theme.colors.bgDeep, borderRadius: theme.radius.sm, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: theme.fontSize.sm, fontFamily: theme.fonts.mono, color: theme.colors.textMuted }}>sk_live_****************************7f2a</span>
              <button style={{ ...s.btn('ghost'), padding: '4px 10px', fontSize: '12px' }}>Regenerate</button>
            </div>
          </div>
        </Panel>
      </div>

      <div style={s.divider} />
      <div style={s.sectionTitle}>Recent Login Activity</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {[
          { user: 'Sarah Mitchell', time: '2 hours ago', ip: '192.168.1.45', device: 'Chrome / macOS', status: 'success' },
          { user: 'Maria Chen', time: '3 hours ago', ip: '192.168.1.102', device: 'Safari / iOS', status: 'success' },
          { user: 'Jeff Nguyen', time: '5 hours ago', ip: '10.0.0.88', device: 'Chrome / Windows', status: 'success' },
          { user: 'Unknown', time: '8 hours ago', ip: '203.45.67.89', device: 'Firefox / Linux', status: 'failed' },
          { user: 'Tom Bradford', time: '1 day ago', ip: '192.168.1.50', device: 'Edge / Windows', status: 'success' },
        ].map((log, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr auto', gap: '12px', alignItems: 'center',
            padding: '10px 16px', background: theme.colors.bgCard, border: '1px solid ' + theme.colors.border, borderRadius: theme.radius.sm,
          }}>
            <div style={{ fontWeight: 600, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>{log.user}</div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{log.time}</div>
            <div style={{ fontSize: theme.fontSize.xs, fontFamily: theme.fonts.mono, color: theme.colors.textMuted }}>{log.ip}</div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{log.device}</div>
            <span style={s.badge(
              log.status === 'success' ? '#15803D' : '#B91C1C',
              log.status === 'success' ? '#F0FDF4' : '#FEF2F2'
            )}>{log.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════
// MAIN ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');

  const TAB_COMPONENTS = {
    users: UsersTab,
    integrations: IntegrationsTab,
    notifications: NotificationsTab,
    club: ClubProfileTab,
    billing: BillingTab,
    security: SecurityTab,
  };

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <PageTransition>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: theme.colors.textPrimary }}>Admin Settings</h1>
          <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted, margin: '4px 0 0 0' }}>
            Manage users, integrations, notifications, and club configuration.
          </p>
        </div>

        <div style={{
          display: 'flex', gap: '4px', marginBottom: '24px', overflowX: 'auto',
          borderBottom: '1px solid ' + theme.colors.border, paddingBottom: '0',
        }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 18px',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid ' + theme.colors.accent : '2px solid transparent',
                background: 'none',
                color: activeTab === tab.key ? theme.colors.textPrimary : theme.colors.textMuted,
                fontWeight: activeTab === tab.key ? 600 : 400,
                fontSize: theme.fontSize.sm,
                cursor: 'pointer',
                fontFamily: theme.fonts.sans,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <ActiveComponent />
      </div>
    </PageTransition>
  );
}
