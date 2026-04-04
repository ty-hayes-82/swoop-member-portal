import { useState } from 'react';
import { Panel } from '@/components/ui';
import PageTransition from '@/components/ui/PageTransition';
import { useNavigationContext } from '@/context/NavigationContext';

// ── Tab definitions ──────────────────────────────────────────────────
const TABS = [
  { key: 'onboarding', label: 'Setup Guide', icon: '🚀' },
  { key: 'users', label: 'Users & Roles', icon: '👥' },
  { key: 'channels', label: 'Action Channels', icon: '📤' },
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
    fontSize: '14px',
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    color: '#1a1a2e',
    background: '#F3F4F6',
    border: '1px solid ' + '#E5E7EB',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#6B7280',
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
    borderRadius: '8px',
    border: variant === 'primary' ? 'none' : '1px solid ' + '#E5E7EB',
    background: variant === 'primary' ? '#465fff' : 'transparent',
    color: variant === 'primary' ? '#fff' : '#1a1a2e',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  }),
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: '12px',
  },
  sectionDesc: {
    fontSize: '12px',
    color: '#9CA3AF',
    marginBottom: '16px',
    lineHeight: 1.5,
  },
  divider: {
    borderTop: '1px solid ' + '#E5E7EB',
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
            background: '#ffffff',
            border: '1px solid ' + '#E5E7EB',
            borderRadius: '8px',
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>{user.name}</div>
              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{user.email}</div>
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>{user.role}</div>
            <div>
              <span style={s.badge(
                user.status === 'active' ? '#15803D' : '#B45309',
                user.status === 'active' ? '#F0FDF4' : '#FFFBEB'
              )}>
                {user.status}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{user.lastLogin}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ ...s.btn('ghost'), padding: '4px 10px', fontSize: '12px' }}>Edit</button>
              <button style={{ ...s.btn('ghost'), padding: '4px 10px', fontSize: '12px', color: '#ef4444' }}>Remove</button>
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
            background: '#ffffff',
            border: '1px solid ' + '#E5E7EB',
            borderRadius: '8px',
          }}>
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px', color: '#1a1a2e' }}>{role}</div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', lineHeight: 1.5 }}>
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
// Action Channels — outbound integrations only (data sources are in Connected Systems)
const INTEGRATION_CATEGORIES = [
  {
    category: 'Communication',
    icon: '💬',
    description: 'Outbound channels for member outreach, alerts, and team notifications.',
    integrations: [
      { name: 'Gmail', icon: '📧', status: 'available', description: 'Send personalized member outreach emails directly from Swoop.', features: ['Send/receive emails', 'Email templates', 'Thread tracking', 'Attachment support'] },
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
      background: '#ffffff',
      border: '1px solid ' + '#E5E7EB',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'border-color 0.15s',
    }} onClick={() => setExpanded(!expanded)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>{integration.icon}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>{integration.name}</div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{integration.description}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={s.badge(cfg.color, cfg.bg)}>{cfg.label}</span>
          <span style={{ fontSize: '12px', color: '#9CA3AF', transition: 'transform 0.15s', transform: expanded ? 'rotate(180deg)' : 'none' }}>&#9660;</span>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid ' + '#E5E7EB' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '8px' }}>Capabilities</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
            {integration.features.map(f => (
              <span key={f} style={{
                fontSize: '11px',
                padding: '3px 10px',
                borderRadius: '12px',
                background: '#F3F4F6',
                color: '#6B7280',
                border: '1px solid ' + '#E5E7EB',
              }}>{f}</span>
            ))}
          </div>
          {integration.status === 'connected' ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button style={s.btn('ghost')}>Configure</button>
              <button style={{ ...s.btn('ghost'), color: '#ef4444' }}>Disconnect</button>
              <span style={{ fontSize: '11px', color: '#22c55e', marginLeft: 'auto' }}>Last synced: 5 min ago</span>
            </div>
          ) : integration.status === 'available' ? (
            <button style={s.btn('primary')}>Connect</button>
          ) : (
            <div style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>This integration is on our roadmap. Contact support to express interest.</div>
          )}
        </div>
      )}
    </div>
  );
}

function IntegrationsTab({ onNavigate }) {
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
      <div style={{ padding: '12px 16px', background: '#eff6ff', border: `1px solid ${'#3B82F6'}30`, borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: '#1d4ed8' }}>
          These are <strong>outbound action channels</strong> Swoop uses to send alerts, emails, and notifications. For data source connections (tee sheet, POS, CRM), visit Connected Systems.
        </div>
        <button onClick={() => onNavigate('integrations')} style={{ ...s.btn('ghost'), padding: '4px 12px', fontSize: '12px', whiteSpace: 'nowrap', marginLeft: '12px' }}>Go to Connected Systems</button>
      </div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          style={{ ...s.input, maxWidth: '280px' }}
          placeholder="Search action channels..."
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
              border: filter === f.key ? 'none' : '1px solid ' + '#E5E7EB',
              background: filter === f.key ? '#465fff' : 'transparent',
              color: filter === f.key ? '#fff' : '#6B7280',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
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
// ONBOARDING / SETUP GUIDE TAB
// ═══════════════════════════════════════════════════════════════════════
const ONBOARDING_STEPS = [
  { id: 'tee', label: 'Connect tee sheet system', desc: 'ForeTees connected — tee time data flowing into demand intelligence.', done: true, target: 'integrations' },
  { id: 'pos', label: 'Connect POS system', desc: 'Northstar POS connected — dining frequency and spend data active.', done: true, target: 'integrations' },
  { id: 'crm', label: 'Connect member CRM', desc: 'Clubessential CMS connected — member profiles, dues, and households syncing.', done: true, target: 'integrations' },
  { id: 'members', label: 'Upload member roster', desc: '487 members imported with health scores and engagement history.', done: true, target: 'integrations/csv-import' },
  { id: 'team', label: 'Invite your department heads', desc: '4 of 6 team members have accepted invitations.', done: false, progress: '4/6' },
  { id: 'notifications', label: 'Configure notification channels', desc: 'Set up email, SMS, push, and Slack alerts for your team.', done: false },
  { id: 'profile', label: 'Review club profile & brand voice', desc: 'Club name, amenities, and communication tone configured.', done: true },
  { id: 'billing', label: 'Confirm billing plan', desc: 'Pro plan ($499/mo) active since January 2026.', done: true },
];

function OnboardingTab({ setActiveTab, navigate }) {
  const completedCount = ONBOARDING_STEPS.filter(s => s.done).length;
  const pct = Math.round((completedCount / ONBOARDING_STEPS.length) * 100);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', padding: '20px', background: '#ffffff', border: '1px solid ' + '#E5E7EB', borderRadius: '12px' }}>
        <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="30" fill="none" stroke={'#F3F4F6'} strokeWidth="6" />
            <circle cx="36" cy="36" r="30" fill="none" stroke={'#465fff'} strokeWidth="6"
              strokeDasharray={`${pct * 1.885} 188.5`} strokeLinecap="round"
              transform="rotate(-90 36 36)" style={{ transition: 'stroke-dasharray 0.3s' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', fontFamily: "'JetBrains Mono', monospace", color: '#1a1a2e' }}>{pct}%</div>
        </div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e' }}>{completedCount} of {ONBOARDING_STEPS.length} steps complete</div>
          <div style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '4px' }}>Complete all steps to unlock full Swoop intelligence. Estimated time remaining: ~15 minutes.</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {ONBOARDING_STEPS.map(step => (
          <div key={step.id} style={{
            display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
            background: '#ffffff', border: '1px solid ' + '#E5E7EB', borderRadius: '8px',
            borderLeft: `3px solid ${step.done ? '#22c55e' : '#f59e0b'}`,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: step.done ? '#22c55e' : '#F3F4F6', color: step.done ? '#fff' : '#9CA3AF',
              fontSize: '12px', fontWeight: 700,
            }}>
              {step.done ? '\u2713' : '\u2022'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>{step.label}</div>
              <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                {step.desc}
                {step.progress && <span style={{ marginLeft: '6px', fontWeight: 700, color: '#f59e0b' }}>({step.progress})</span>}
              </div>
            </div>
            {!step.done && (
              <button
                onClick={() => step.target ? navigate(step.target) : setActiveTab(step.id === 'notifications' ? 'notifications' : step.id === 'team' ? 'users' : 'club')}
                style={s.btn('primary')}
              >
                {step.target ? 'Go' : 'Configure'}
              </button>
            )}
          </div>
        ))}
      </div>
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
      background: checked ? '#465fff' : '#F3F4F6',
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

const ROLE_DEFAULTS = {
  member_at_risk: ['Membership Director'], member_save: ['Membership Director', 'General Manager'],
  resignation_risk: ['General Manager', 'Membership Director'], health_score_change: ['Membership Director'],
  service_failure: ['F&B Director', 'General Manager'], weather_alert: ['Head Golf Pro', 'Events Manager'],
  staffing_gap: ['F&B Director'], capacity_alert: ['Events Manager'],
  revenue_anomaly: ['Controller', 'General Manager'], spend_drop: ['Membership Director'],
  integration_down: ['General Manager'], data_sync: [], report_ready: ['General Manager'],
};

function NotificationsTab() {
  const [settings, setSettings] = useState(() => {
    const map = {};
    NOTIFICATION_SETTINGS.forEach(sec => sec.items.forEach(item => { map[item.key] = { ...item.channels }; }));
    return map;
  });
  const [testStatus, setTestStatus] = useState({});

  const sendTest = (channel) => {
    setTestStatus(prev => ({ ...prev, [channel]: 'sending' }));
    setTimeout(() => setTestStatus(prev => ({ ...prev, [channel]: 'sent' })), 1500);
    setTimeout(() => setTestStatus(prev => ({ ...prev, [channel]: 'idle' })), 4000);
  };

  const toggle = (key, channel) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], [channel]: !prev[key][channel] },
    }));
  };

  const CHANNELS = [
    { key: 'email', label: 'Email', icon: '📧', configured: true, detail: 'sarah@oakmonthills.com' },
    { key: 'sms', label: 'SMS', icon: '📱', configured: true, detail: '(908) 555-0142' },
    { key: 'push', label: 'Push', icon: '🔔', configured: true, detail: 'Swoop mobile app' },
    { key: 'slack', label: 'Slack', icon: '💬', configured: false, detail: 'Not connected' },
  ];

  return (
    <div>
      {/* Channel Status & Test */}
      <div style={s.sectionTitle}>Channel Status</div>
      <div style={{ ...s.sectionDesc, marginBottom: '12px' }}>Verify your notification channels are working before relying on them for critical alerts.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
        {CHANNELS.map(ch => (
          <div key={ch.key} style={{ padding: '12px', background: '#ffffff', border: '1px solid ' + '#E5E7EB', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>{ch.icon}</div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>{ch.label}</div>
            <div style={{ fontSize: '10px', color: ch.configured ? '#22c55e' : '#9CA3AF', marginTop: '2px' }}>
              {ch.configured ? ch.detail : 'Not configured'}
            </div>
            <button
              onClick={() => sendTest(ch.key)}
              disabled={!ch.configured || testStatus[ch.key] === 'sending'}
              style={{
                marginTop: '8px', padding: '4px 12px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', cursor: ch.configured ? 'pointer' : 'default',
                border: 'none', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                background: testStatus[ch.key] === 'sent' ? '#f0fdf4' : ch.configured ? `${'#465fff'}15` : '#F3F4F6',
                color: testStatus[ch.key] === 'sent' ? '#22c55e' : ch.configured ? '#465fff' : '#9CA3AF',
              }}
            >
              {testStatus[ch.key] === 'sending' ? 'Sending...' : testStatus[ch.key] === 'sent' ? 'Sent!' : 'Send Test'}
            </button>
          </div>
        ))}
      </div>

      <div style={s.divider} />
      <div style={s.sectionTitle}>Alert Routing</div>
      <div style={s.sectionDesc}>Configure which channels and roles receive each alert type.</div>

      {NOTIFICATION_SETTINGS.map(sec => (
        <div key={sec.section} style={{ marginBottom: '24px' }}>
          <div style={s.sectionTitle}>{sec.section}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sec.items.map(item => (
              <div key={item.key} style={{
                padding: '12px 16px',
                background: '#ffffff',
                border: '1px solid ' + '#E5E7EB',
                borderRadius: '8px',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4, 60px)', gap: '8px', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{item.description}</div>
                  </div>
                  {CHANNELS.map(ch => (
                    <div key={ch.key} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase' }}>{ch.label}</div>
                      <ToggleSwitch checked={settings[item.key][ch.key]} onChange={() => toggle(item.key, ch.key)} />
                    </div>
                  ))}
                </div>
                {ROLE_DEFAULTS[item.key]?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid ' + '#E5E7EB' }}>
                    <span style={{ fontSize: '10px', color: '#9CA3AF', flexShrink: 0 }}>Routes to:</span>
                    {ROLE_DEFAULTS[item.key].map(role => (
                      <span key={role} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: `${'#465fff'}12`, color: '#465fff', fontWeight: 600 }}>{role}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={s.divider} />
      <div style={s.sectionTitle}>Escalation Rules</div>
      <div style={s.sectionDesc}>Define what happens when alerts go unacknowledged.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ padding: '16px', background: '#ffffff', border: '1px solid ' + '#E5E7EB', borderRadius: '8px' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#1a1a2e' }}>First Escalation</div>
          <div style={s.fieldGroup}>
            <label style={s.label}>If unacknowledged after</label>
            <select style={s.input}><option>30 minutes</option><option>1 hour</option><option>2 hours</option><option>4 hours</option></select>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Escalate to</label>
            <select style={s.input}><option>Assistant GM</option>{ROLES.map(r => <option key={r}>{r}</option>)}</select>
          </div>
        </div>
        <div style={{ padding: '16px', background: '#ffffff', border: '1px solid ' + '#E5E7EB', borderRadius: '8px' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#1a1a2e' }}>Second Escalation</div>
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
            <div style={{ padding: '20px', border: '2px dashed ' + '#E5E7EB', borderRadius: '8px', textAlign: 'center', color: '#9CA3AF', fontSize: '12px', cursor: 'pointer' }}>
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
            background: '#ffffff', border: '1px solid ' + '#E5E7EB', borderRadius: '8px',
            fontSize: '14px', color: '#1a1a2e', cursor: 'pointer',
          }}>
            <input type="checkbox" defaultChecked={['18-Hole Golf Course', 'Pool & Aquatics', 'Main Dining Room', 'Casual Grill', 'Banquet Facilities', 'Pro Shop', 'Locker Rooms', 'Practice Range', 'Fitness Center'].includes(a)} />
            {a}
          </label>
        ))}
      </div>

      <div style={s.divider} />
      <div style={s.sectionTitle}>Brand & Voice</div>
      <div style={s.sectionDesc}>These settings shape how Swoop's AI agents communicate on behalf of your club. All AI-generated outreach will follow these guidelines.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Panel>
          <div style={s.fieldGroup}>
            <label style={s.label}>Communication Tone</label>
            <select style={s.input}>
              <option>Warm & Personal</option>
              <option>Professional & Formal</option>
              <option>Casual & Friendly</option>
            </select>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Preferred GM Signoff</label>
            <input style={s.input} defaultValue="Best regards, Sarah Mitchell" />
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Club Tagline</label>
            <input style={s.input} defaultValue="Where Tradition Meets Tomorrow" />
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Brand Colors</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 28, height: 28, borderRadius: '6px', background: '#1B4332', border: '1px solid ' + '#E5E7EB' }} />
                <input style={{ ...s.input, width: '90px' }} defaultValue="#1B4332" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 28, height: 28, borderRadius: '6px', background: '#C9A84C', border: '1px solid ' + '#E5E7EB' }} />
                <input style={{ ...s.input, width: '90px' }} defaultValue="#C9A84C" />
              </div>
            </div>
          </div>
        </Panel>
        <Panel>
          <div style={s.fieldGroup}>
            <label style={s.label}>AI Writing Style Notes</label>
            <textarea style={{ ...s.input, height: '120px', resize: 'vertical', lineHeight: 1.5 }} defaultValue={"Avoid overly casual language. Reference club traditions when appropriate. Always use member's preferred name. Sign emails from the GM unless delegated to department head."} />
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Brand Guidelines (Upload)</label>
            <div style={{ padding: '16px', border: '2px dashed ' + '#E5E7EB', borderRadius: '8px', textAlign: 'center', color: '#9CA3AF', fontSize: '12px', cursor: 'pointer' }}>
              Drop PDF or image here (brand guide, logo usage, letterhead)
            </div>
          </div>
        </Panel>
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
            <span style={{ fontSize: '28px', fontWeight: 700, color: '#465fff' }}>Pro</span>
            <span style={{ fontSize: '14px', color: '#9CA3AF' }}>$499/month</span>
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: 1.6, marginBottom: '16px' }}>
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
              <div key={u.label} style={{ padding: '10px', background: '#F3F4F6', borderRadius: '8px' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e' }}>{u.value}</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{u.label}</div>
                <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '2px' }}>Limit: {u.limit}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div style={s.sectionTitle}>Usage Trends</div>
      <div style={s.sectionDesc}>6-month consumption with projected month-end estimates.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'AI Agent Actions', data: [89, 102, 118, 127, 135, 142], limit: 500, unit: '' },
          { label: 'SMS Sent', data: [22, 28, 31, 38, 42, 47], limit: 200, unit: '', alert: 'SMS: 47 of 200 (24% consumed, 8 days in — projected under limit)' },
          { label: 'Email Sends', data: [180, 210, 245, 270, 295, 312], limit: 2000, unit: '' },
          { label: 'API Calls', data: [4200, 5100, 5800, 6700, 7500, 8291], limit: 50000, unit: '' },
        ].map(metric => {
          const current = metric.data[metric.data.length - 1];
          const pctUsed = Math.round((current / metric.limit) * 100);
          const max = Math.max(...metric.data) * 1.2;
          const points = metric.data.map((v, i) => `${(i / 5) * 100},${40 - (v / max) * 36}`).join(' ');
          return (
            <div key={metric.label} style={{ padding: '14px', background: '#ffffff', border: '1px solid ' + '#E5E7EB', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '4px' }}>{metric.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#1a1a2e' }}>{current.toLocaleString()}</span>
                <span style={{ fontSize: '10px', color: '#9CA3AF' }}>/ {metric.limit.toLocaleString()}</span>
              </div>
              <svg width="100%" height="40" viewBox="0 0 100 40" preserveAspectRatio="none" style={{ marginTop: '6px' }}>
                <polyline points={points} fill="none" stroke={'#465fff'} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div style={{ height: '4px', borderRadius: '2px', background: '#F3F4F6', marginTop: '4px' }}>
                <div style={{ height: '100%', borderRadius: '2px', background: pctUsed > 80 ? '#ef4444' : '#465fff', width: `${Math.min(pctUsed, 100)}%`, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '4px' }}>{pctUsed}% consumed</div>
              {metric.alert && <div style={{ fontSize: '10px', color: '#22c55e', marginTop: '2px' }}>{metric.alert}</div>}
            </div>
          );
        })}
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
            padding: '12px 16px', background: '#ffffff', border: '1px solid ' + '#E5E7EB', borderRadius: '8px',
          }}>
            <div style={{ fontSize: '14px', color: '#1a1a2e' }}>{inv.date}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: '#1a1a2e' }}>{inv.amount}</div>
            <div><span style={s.badge('#15803D', '#F0FDF4')}>{inv.status}</span></div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{inv.invoice}</div>
            <button style={{ ...s.btn('ghost'), padding: '4px 10px', fontSize: '12px' }}>Download</button>
          </div>
        ))}
      </div>

      <div style={s.divider} />
      <div style={s.sectionTitle}>Payment Method</div>
      <div style={{ padding: '16px', background: '#ffffff', border: '1px solid ' + '#E5E7EB', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>💳</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>Visa ending in 4242</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Expires 08/2027</div>
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
              <span style={{ fontSize: '14px', color: '#6B7280' }}>Required for all users</span>
            </div>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Single Sign-On (SSO)</label>
            <div style={{ padding: '12px', background: '#F3F4F6', borderRadius: '8px', fontSize: '12px', color: '#9CA3AF' }}>
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
              <span style={{ fontSize: '14px', color: '#6B7280' }}>Log all user actions</span>
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
            <div style={{ padding: '10px 12px', background: '#F3F4F6', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontFamily: "'JetBrains Mono', monospace", color: '#9CA3AF' }}>sk_live_****************************7f2a</span>
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
            padding: '10px 16px', background: '#ffffff', border: '1px solid ' + '#E5E7EB', borderRadius: '8px',
          }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>{log.user}</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{log.time}</div>
            <div style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: '#9CA3AF' }}>{log.ip}</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{log.device}</div>
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
  const { navigate } = useNavigationContext();
  const [activeTab, setActiveTab] = useState('onboarding');

  const renderTab = () => {
    switch (activeTab) {
      case 'onboarding': return <OnboardingTab setActiveTab={setActiveTab} navigate={navigate} />;
      case 'users': return <UsersTab />;
      case 'channels': return <IntegrationsTab onNavigate={navigate} />;
      case 'notifications': return <NotificationsTab />;
      case 'club': return <ClubProfileTab />;
      case 'billing': return <BillingTab />;
      case 'security': return <SecurityTab />;
      default: return <OnboardingTab setActiveTab={setActiveTab} navigate={navigate} />;
    }
  };

  return (
    <PageTransition>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#1a1a2e' }}>Admin Settings</h1>
          <p style={{ fontSize: '14px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
            Manage users, action channels, notifications, and club configuration.
          </p>
        </div>

        <div style={{
          display: 'flex', gap: '4px', marginBottom: '24px', overflowX: 'auto',
          borderBottom: '1px solid ' + '#E5E7EB', paddingBottom: '0',
        }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 18px',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid ' + '#465fff' : '2px solid transparent',
                background: 'none',
                color: activeTab === tab.key ? '#1a1a2e' : '#9CA3AF',
                fontWeight: activeTab === tab.key ? 600 : 400,
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
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

        {renderTab()}
      </div>
    </PageTransition>
  );
}
