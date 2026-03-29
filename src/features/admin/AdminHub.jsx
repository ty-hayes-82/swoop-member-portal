/**
 * Admin Hub — Consolidated admin section with 3 sub-pages
 * Replaces 6 scattered SETTINGS sidebar items with one unified entry.
 *
 * Sub-pages:
 * - Data Hub (Connected Sources + Manual Upload + Data Gaps)
 * - Health & Quality (Pipeline Monitor + Data Model)
 * - Activity Log (Import History + Agent Actions + System Events)
 */
import { useState } from 'react';
import { theme } from '@/config/theme';
import DataHealthDashboard from '@/features/data-health/DataHealthDashboard';
import NotificationSettings from '@/features/notification-settings/NotificationSettings';
import { CsvImportHub } from '@/features/csv-import';

const ADMIN_TABS = [
  { key: 'data-hub', label: 'Integrations', icon: '🔌' },
  { key: 'health', label: 'Data Health', icon: '🩺' },
  { key: 'activity', label: 'CSV Import', icon: '📥' },
  { key: 'notifications', label: 'Notifications', icon: '🔔' },
  { key: 'settings', label: 'User Roles', icon: '👤' },
];

export default function AdminHub() {
  const [activeTab, setActiveTab] = useState('data-hub');
  const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <div>
        <h1 style={{ fontSize: theme.fontSize.xl, fontWeight: 700, margin: 0 }}>Admin</h1>
        <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, margin: '4px 0 0' }}>
          Integrations, data health, CSV imports, notifications, and user roles.
        </p>
      </div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', background: theme.colors.bgDeep, borderRadius: theme.radius.md, padding: '3px', border: `1px solid ${theme.colors.border}` }}>
        {ADMIN_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '7px 16px', borderRadius: '8px', fontSize: theme.fontSize.xs, fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: activeTab === tab.key ? theme.colors.bgCard : 'transparent',
              color: activeTab === tab.key ? theme.colors.textPrimary : theme.colors.textMuted,
              boxShadow: activeTab === tab.key ? theme.shadow.sm : 'none',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span style={{ fontSize: '14px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'data-hub' && <DataHubTab clubId={clubId} />}
      {activeTab === 'health' && <DataHealthDashboard />}
      {activeTab === 'activity' && <CsvImportHub />}
      {activeTab === 'notifications' && <NotificationSettings />}
      {activeTab === 'settings' && <UserRolesTab />}
    </div>
  );
}

function DataHubTab({ clubId }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <div>
        <h2 style={{ fontSize: theme.fontSize.lg, fontWeight: 700, margin: 0 }}>Data Hub</h2>
        <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, margin: '4px 0 0' }}>
          Connect data sources, upload CSVs, and see what intelligence each connection unlocks.
        </p>
      </div>

      {/* Connected Sources */}
      <div style={{ border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md, background: theme.colors.bgCard, padding: theme.spacing.lg }}>
        <h3 style={{ fontSize: theme.fontSize.md, fontWeight: 700, margin: '0 0 12px' }}>Connected Sources</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: theme.spacing.md }}>
          {[
            { name: 'Jonas Club CRM', status: 'connected', icon: '👥', tables: 'members, households, membership_types', rows: '300+' },
            { name: 'ForeTees Tee Sheet', status: 'available', icon: '⛳', tables: 'bookings, pace_of_play, waitlist', rows: '—' },
            { name: 'POS System', status: 'available', icon: '🍽️', tables: 'pos_checks, pos_line_items, pos_payments', rows: '—' },
            { name: 'Email Marketing', status: 'available', icon: '📧', tables: 'email_campaigns, email_events', rows: '—' },
            { name: 'Staffing / Labor', status: 'available', icon: '👷', tables: 'staff, staff_shifts', rows: '—' },
            { name: 'Weather API', status: 'connected', icon: '🌤️', tables: 'weather_daily', rows: '365' },
            { name: 'Events System', status: 'connected', icon: '🎉', tables: 'event_definitions, event_registrations', rows: '120+' },
            { name: 'Complaints & Feedback', status: 'connected', icon: '📝', tables: 'feedback, service_requests', rows: '47' },
          ].map(source => (
            <div key={source.name} style={{
              padding: '12px 14px', borderRadius: theme.radius.sm,
              border: `1px solid ${source.status === 'connected' ? theme.colors.success + '30' : theme.colors.border}`,
              background: source.status === 'connected' ? `${theme.colors.success}04` : theme.colors.bg,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '18px' }}>{source.icon}</span>
                <span style={{
                  fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                  background: source.status === 'connected' ? `${theme.colors.success}15` : `${theme.colors.textMuted}10`,
                  color: source.status === 'connected' ? theme.colors.success : theme.colors.textMuted,
                  textTransform: 'uppercase',
                }}>{source.status}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>{source.name}</div>
              <div style={{ fontSize: '11px', color: theme.colors.textMuted, marginTop: 2 }}>{source.tables}</div>
              {source.status === 'connected' && <div style={{ fontSize: '11px', color: theme.colors.success, marginTop: 4 }}>{source.rows} rows synced</div>}
            </div>
          ))}
        </div>
      </div>

      {/* CSV Upload link */}
      <div style={{
        padding: theme.spacing.md, borderRadius: theme.radius.md,
        background: `${theme.colors.accent}06`, border: `1px solid ${theme.colors.accent}20`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>Manual Data Upload</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>Upload CSV files for members, rounds, transactions, or complaints when API access isn't available.</div>
        </div>
        <button onClick={() => { window.location.hash = '#/integrations/csv-import'; }} style={{
          padding: '8px 16px', borderRadius: theme.radius.sm, border: 'none',
          background: theme.colors.accent, color: '#fff', fontWeight: 700,
          fontSize: theme.fontSize.xs, cursor: 'pointer',
        }}>Open Upload Tool</button>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      <div>
        <h2 style={{ fontSize: theme.fontSize.lg, fontWeight: 700, margin: 0 }}>Activity Log</h2>
        <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, margin: '4px 0 0' }}>
          Every action taken in the platform — approvals, dismissals, outreach, imports, and system events.
        </p>
      </div>
      {entries.length === 0 ? (
        <div style={{ padding: theme.spacing.xl, textAlign: 'center', color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
          No activity logged yet. Actions will appear here as you use the platform.
        </div>
      ) : (
        entries.map((entry, i) => (
          <div key={i} style={{
            padding: '10px 14px', borderRadius: theme.radius.sm,
            border: `1px solid ${theme.colors.border}`, background: theme.colors.bgCard,
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: theme.fontSize.sm }}>{entry.type || entry.description}</div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{entry.memberName || entry.detail || ''}</div>
            </div>
            <div style={{ fontSize: '11px', color: theme.colors.textMuted, whiteSpace: 'nowrap' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: theme.fontSize.lg, fontWeight: 700, margin: 0 }}>User Roles</h2>
          <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, margin: '4px 0 0' }}>
            Manage team access and role assignments.
          </p>
        </div>
        <button style={{
          padding: '8px 16px', borderRadius: theme.radius.sm,
          border: `1px solid ${theme.colors.accent}`, background: `${theme.colors.accent}08`,
          color: theme.colors.accent, fontWeight: 700, fontSize: theme.fontSize.sm,
          cursor: 'pointer',
        }}>
          + Invite User
        </button>
      </div>

      <div style={{ border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
          <thead>
            <tr style={{ background: theme.colors.bgDeep, borderBottom: `1px solid ${theme.colors.border}` }}>
              {['Name', 'Email', 'Role', 'Status', 'Last Active'].map(h => (
                <th key={h} style={{
                  padding: '10px 14px', textAlign: 'left', fontSize: theme.fontSize.xs,
                  fontWeight: 600, color: theme.colors.textMuted, textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((m, i) => (
              <tr key={m.email} style={{ borderBottom: i < teamMembers.length - 1 ? `1px solid ${theme.colors.border}` : 'none', background: theme.colors.bgCard }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: theme.colors.textPrimary }}>{m.name}</td>
                <td style={{ padding: '12px 14px', color: theme.colors.textSecondary }}>{m.email}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                    background: m.role === 'General Manager' ? `${theme.colors.accent}12` : `${theme.colors.info}10`,
                    color: m.role === 'General Manager' ? theme.colors.accent : theme.colors.info,
                  }}>{m.role}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    color: m.status === 'Active' ? theme.colors.success : theme.colors.warning,
                    fontSize: theme.fontSize.xs, fontWeight: 600,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.status === 'Active' ? theme.colors.success : theme.colors.warning }} />
                    {m.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>{m.lastActive}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Account section */}
      <div style={{ borderTop: `1px solid ${theme.colors.border}`, paddingTop: theme.spacing.md, marginTop: theme.spacing.sm }}>
        <div style={{ fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: theme.spacing.sm }}>
          Your Account
        </div>
        <div style={{ border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md, background: theme.colors.bgCard, padding: theme.spacing.md }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: theme.fontSize.sm }}>
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
          style={{
            marginTop: theme.spacing.sm,
            padding: '8px 16px', borderRadius: theme.radius.sm,
            border: `1px solid ${theme.colors.urgent}30`, background: `${theme.colors.urgent}08`,
            color: theme.colors.urgent, fontWeight: 600, fontSize: theme.fontSize.xs,
            cursor: 'pointer',
          }}
        >Sign Out</button>
      </div>
    </div>
  );
}
