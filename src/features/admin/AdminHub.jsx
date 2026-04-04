/**
 * Admin Hub — Consolidated admin section with 3 sub-pages
 * Replaces 6 scattered SETTINGS sidebar items with one unified entry.
 *
 * Sub-pages:
 * - Data Hub (Connected Sources + Manual Upload + Data Gaps)
 * - Health & Quality (Pipeline Monitor + Data Model)
 * - Activity Log (Import History + Agent Actions + System Events)
 */
import { useState, useEffect } from 'react';
import DataHealthDashboard from '@/features/data-health/DataHealthDashboard';

// V3: Reduced from 5 tabs to 2. CSV Import, Notifications, User Roles deferred.
// V5: Data Health tab hidden until 2+ live API sources connected
const ALL_ADMIN_TABS = [
  { key: 'data-hub', label: 'Integrations', icon: '🔌' },
  { key: 'health', label: 'Data Health', icon: '🩺' },
];

export default function AdminHub() {
  const [liveSourceCount, setLiveSourceCount] = useState(0);
  const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;

  useEffect(() => {
    if (!clubId) return;
    fetch(`/api/feature-availability?clubId=${clubId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.domains) {
          const connected = d.domains.filter(dm => dm.connected).length;
          setLiveSourceCount(connected);
        }
      })
      .catch(() => {});
  }, [clubId]);

  const ADMIN_TABS = liveSourceCount >= 2 ? ALL_ADMIN_TABS : ALL_ADMIN_TABS.filter(t => t.key !== 'health');
  const [activeTab, setActiveTab] = useState('data-hub');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold m-0 text-gray-800 dark:text-white/90">Admin</h1>
        <p className="text-sm text-gray-500 mt-1 mb-0">
          Integrations and data health monitoring.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1.5 flex-wrap rounded-lg bg-gray-100 p-0.5 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        {ADMIN_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none transition-all duration-150 ${
              activeTab === tab.key
                ? 'bg-white text-gray-800 shadow-theme-xs dark:bg-gray-700 dark:text-white'
                : 'bg-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'data-hub' && <DataHubTab clubId={clubId} />}
      {activeTab === 'health' && <DataHealthDashboard />}
      {/* V3: CSV Import, Notifications, User Roles removed — white-glove onboarding */}
    </div>
  );
}

function DataHubTab({ clubId }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold m-0 text-gray-800 dark:text-white/90">Data Hub</h2>
        <p className="text-sm text-gray-500 mt-1 mb-0">
          Connect data sources, upload CSVs, and see what intelligence each connection unlocks.
        </p>
      </div>

      {/* Connected Sources */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-base font-bold mb-3 m-0 text-gray-800 dark:text-white/90">Connected Sources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[
            { name: 'Jonas Club CRM', status: 'connected', icon: '👥', tables: 'members, households, membership_types', rows: '300+' },
            { name: 'ForeTees Tee Sheet', status: 'available', icon: '⛳', tables: 'bookings, pace_of_play', rows: '—' },
            { name: 'POS System', status: 'available', icon: '🍽️', tables: 'pos_checks, pos_line_items, pos_payments', rows: '—' },
            { name: 'Email Marketing', status: 'available', icon: '📧', tables: 'email_campaigns, email_events', rows: '—' },
            { name: 'Staffing / Labor', status: 'available', icon: '👷', tables: 'staff, staff_shifts', rows: '—' },
            { name: 'Weather API', status: 'connected', icon: '🌤️', tables: 'weather_daily', rows: '365' },
            { name: 'Events System', status: 'connected', icon: '🎉', tables: 'event_definitions, event_registrations', rows: '120+' },
            { name: 'Complaints & Feedback', status: 'connected', icon: '📝', tables: 'feedback, service_requests', rows: '47' },
          ].map(source => (
            <div key={source.name} className={`px-3.5 py-3 rounded-lg border ${
              source.status === 'connected'
                ? 'border-success-300 bg-success-50 dark:border-success-500/30 dark:bg-success-500/5'
                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
            }`}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-lg">{source.icon}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-xl uppercase ${
                  source.status === 'connected'
                    ? 'bg-success-100 text-success-600 dark:bg-success-500/15 dark:text-success-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}>{source.status}</span>
              </div>
              <div className="font-semibold text-sm text-gray-800 dark:text-white/90">{source.name}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{source.tables}</div>
              {source.status === 'connected' && <div className="text-[11px] text-success-600 dark:text-success-400 mt-1">{source.rows} rows synced</div>}
            </div>
          ))}
        </div>
      </div>

      {/* CSV Upload link */}
      <div className="flex justify-between items-center rounded-xl p-4 bg-brand-50 border border-brand-200 dark:bg-brand-500/5 dark:border-brand-500/20">
        <div>
          <div className="font-bold text-sm text-gray-800 dark:text-white/90">Manual Data Upload</div>
          <div className="text-xs text-gray-500">Upload CSV files for members, rounds, transactions, or complaints when API access isn't available.</div>
        </div>
        <button onClick={() => { window.location.hash = '#/integrations/csv-import'; }} className="px-4 py-2 rounded-lg border-none bg-brand-500 text-white font-bold text-xs cursor-pointer">Open Upload Tool</button>
      </div>
    </div>
  );
}

function ActivityLogTab({ clubId }) {
  const [entries] = useState(() => {
    // Pull from localStorage activity log
    try {
      const log = JSON.parse(localStorage.getItem('swoop_outreach_log') || '[]');
      return log.slice(0, 30);
    } catch { return []; }
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold m-0 text-gray-800 dark:text-white/90">Activity Log</h2>
        <p className="text-sm text-gray-500 mt-1 mb-0">
          Every action taken in the platform — approvals, dismissals, outreach, imports, and system events.
        </p>
      </div>
      {entries.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-sm">
          No activity logged yet. Actions will appear here as you use the platform.
        </div>
      ) : (
        entries.map((entry, i) => (
          <div key={i} className="flex justify-between items-start px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div>
              <div className="font-semibold text-sm text-gray-800 dark:text-white/90">{entry.type || entry.description}</div>
              <div className="text-xs text-gray-500">{entry.memberName || entry.detail || ''}</div>
            </div>
            <div className="text-[11px] text-gray-500 whitespace-nowrap">
              {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function UserRolesTab() {
  const user = (() => { try { return JSON.parse(localStorage.getItem('swoop_auth_user') || '{}'); } catch { return {}; } })();

  const teamMembers = [
    { name: user.name || 'Sarah Mitchell', email: user.email || 'sarah@oakmontcc.com', role: 'General Manager', status: 'Active', lastActive: 'Today' },
    { name: 'James Crawford', email: 'james@oakmontcc.com', role: 'Head Golf Professional', status: 'Active', lastActive: '2 days ago' },
    { name: 'Maria Santos', email: 'maria@oakmontcc.com', role: 'F&B Director', status: 'Active', lastActive: '1 day ago' },
    { name: 'David Chen', email: 'david@oakmontcc.com', role: 'Membership Director', status: 'Invited', lastActive: '—' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold m-0 text-gray-800 dark:text-white/90">User Roles</h2>
          <p className="text-sm text-gray-500 mt-1 mb-0">
            Manage team access and role assignments.
          </p>
        </div>
        <button className="px-4 py-2 rounded-lg border border-brand-500 bg-brand-50 text-brand-500 font-bold text-sm cursor-pointer dark:bg-brand-500/5">
          + Invite User
        </button>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden dark:border-gray-800">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              {['Name', 'Email', 'Role', 'Status', 'Last Active'].map(h => (
                <th key={h} className="px-3.5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((m, i) => (
              <tr key={m.email} className={`bg-white dark:bg-white/[0.03] ${i < teamMembers.length - 1 ? 'border-b border-gray-200 dark:border-gray-800' : ''}`}>
                <td className="px-3.5 py-3 font-semibold text-gray-800 dark:text-white/90">{m.name}</td>
                <td className="px-3.5 py-3 text-gray-500">{m.email}</td>
                <td className="px-3.5 py-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    m.role === 'General Manager'
                      ? 'bg-brand-50 text-brand-500 dark:bg-brand-500/10'
                      : 'bg-blue-50 text-blue-500 dark:bg-blue-500/10'
                  }`}>{m.role}</span>
                </td>
                <td className="px-3.5 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                    m.status === 'Active' ? 'text-success-600' : 'text-warning-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      m.status === 'Active' ? 'bg-success-500' : 'bg-warning-500'
                    }`} />
                    {m.status}
                  </span>
                </td>
                <td className="px-3.5 py-3 text-gray-500 text-xs">{m.lastActive}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Account section */}
      <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-2">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          Your Account
        </div>
        <div className="border border-gray-200 rounded-xl bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-2 text-sm text-gray-800 dark:text-white/90">
            <div><strong>Signed in as:</strong> {user.name || '—'} ({user.role || '—'})</div>
            <div><strong>Email:</strong> {user.email || '—'}</div>
            <div><strong>Club ID:</strong> {user.clubId || 'Demo Mode'}</div>
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('swoop_auth_user');
            localStorage.removeItem('swoop_auth_token');
            localStorage.removeItem('swoop_club_id');
            window.location.reload();
          }}
          className="mt-2 px-4 py-2 rounded-lg border border-error-300 bg-error-50 text-error-600 font-semibold text-xs cursor-pointer dark:bg-error-500/5 dark:border-error-500/30"
        >Sign Out</button>
      </div>
    </div>
  );
}
