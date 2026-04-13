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
import { useNavigationContext } from '@/context/NavigationContext';
import DataHealthDashboard from '@/features/data-health/DataHealthDashboard';
import { Card } from '@/components/tailadmin';
import { apiFetch } from '@/services/apiClient';
import Badge from '@/components/tailadmin/Badge';
import { getConnectedSystems, useIntegrationsData } from '@/services/integrationsService';
import SourceBadge from '@/components/ui/SourceBadge';
import { getHealthRollup, useApiHealthData } from '@/services/apiHealthService';
import { useCurrentClub } from '@/hooks/useCurrentClub';
import { getDataMode } from '@/services/demoGate';

// Shared with DataHealthDashboard — keep in sync with DOMAIN_PILLAR_IMPACT there.
const DOMAIN_VALUE_PCTS = { CRM: 40, TEE_SHEET: 25, POS: 20, EMAIL: 10, LABOR: 5 };
const DOMAIN_UNLOCK_IMPACT = {
  CRM: {
    label: 'CRM / Members',
    sourceSystem: 'Member CRM',
    features: ['Today Morning Briefing', 'Member Health Scores', 'First Domino visualization'],
    dollar: 'Required for all member-level intelligence',
  },
  TEE_SHEET: {
    label: 'Tee Sheet',
    sourceSystem: 'Tee Sheet',
    features: ['Today briefing rounds count', 'Hole 12 bottleneck drill-down', 'At-risk on tee sheet detection'],
    dollar: '$5,760/mo pace-to-dining attribution', // lint-no-hardcoded-dollars: allow — domain unlock teaser shown when source is disconnected
  },
  POS: {
    label: 'POS / F&B',
    sourceSystem: 'POS',
    features: ['F&B revenue decomposition', 'Dining conversion correlation', 'Post-round dining stats'],
    dollar: '$9,377/mo full F&B leakage decomposition', // lint-no-hardcoded-dollars: allow — domain unlock teaser shown when source is disconnected
  },
  EMAIL: {
    label: 'Email & Events',
    sourceSystem: 'Email',
    features: ['First Domino email signal', 'Engagement decay watch list', 'Cohort heatmap'],
    dollar: 'Earliest decay signal — typically the first domino to fall',
  },
  LABOR: {
    label: 'Scheduling & Labor',
    sourceSystem: 'Scheduling',
    features: ['Tomorrow staffing risk', 'Pace-to-Revenue connection card', 'Understaffed days correlation'],
    dollar: '$3,400/mo staffing-driven F&B loss', // lint-no-hardcoded-dollars: allow — domain unlock teaser shown when source is disconnected
  },
};

// V3: Reduced from 5 tabs to 2. CSV Import, Notifications, User Roles deferred.
// V5: Data Health tab hidden until 2+ live API sources connected
// V6: Club Management tab for switching/deleting clubs
const ALL_ADMIN_TABS = [
  { key: 'data-hub', label: 'Integrations', icon: '🔌' },
  { key: 'health', label: 'Data Health', icon: '🩺' },
  { key: 'clubs', label: 'Club Management', icon: '🏌️' },
];

export default function AdminHub() {
  const { navigate } = useNavigationContext();
  const [liveSourceCount, setLiveSourceCount] = useState(0);
  const clubId = useCurrentClub();

  useEffect(() => {
    if (!clubId) return;
    apiFetch(`/api/feature-availability?clubId=${clubId}`)
      .then(d => {
        if (d?.domains) {
          const connected = d.domains.filter(dm => dm.connected).length;
          setLiveSourceCount(connected);
        }
      })
      .catch(() => {});
  }, [clubId]);

  const ADMIN_TABS = ALL_ADMIN_TABS;
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
      <div role="tablist" aria-label="Admin tabs" className="flex gap-1 rounded-lg bg-gray-100 p-0.5 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 overflow-x-auto">
        {ADMIN_TABS.map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none transition-all duration-150 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-brand-500 ${
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
      <div role="tabpanel">
        {activeTab === 'data-hub' && <DataHubTab clubId={clubId} />}
        {activeTab === 'health' && <DataHealthDashboard />}
        {activeTab === 'clubs' && <ClubManagementTab currentClubId={clubId} />}
      </div>
      {/* V3: CSV Import, Notifications, User Roles removed — white-glove onboarding */}
    </div>
  );
}

function DataHubTab({ clubId }) {
  const { navigate } = useNavigationContext();

  // "Next Intelligence Unlock" — which single disconnected domain would unlock
  // the most pillar value? Pulled from /api/feature-availability; falls back to
  // demo assumptions (CRM+EMAIL connected) when unauthenticated.
  const [nextUnlock, setNextUnlock] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const DEMO_CONNECTED = new Set(['CRM', 'EMAIL']);
    const pickHighestValue = (connectedSet) => {
      const disconnected = Object.keys(DOMAIN_VALUE_PCTS).filter(d => !connectedSet.has(d));
      if (!disconnected.length) return null;
      disconnected.sort((a, b) => (DOMAIN_VALUE_PCTS[b] || 0) - (DOMAIN_VALUE_PCTS[a] || 0));
      return disconnected[0];
    };

    if (getDataMode() !== 'live') {
      setNextUnlock(pickHighestValue(DEMO_CONNECTED));
      return;
    }
    apiFetch(`/api/feature-availability?clubId=${clubId}`)
      .then(d => {
        if (cancelled) return;
        if (d?.domains) {
          const connectedSet = new Set(d.domains.filter(dm => dm.connected || dm.is_connected).map(dm => dm.code));
          // Prefer API's own recommendation if it exists, else fall back to highest-value heuristic
          setNextUnlock(d.nextDomainToConnect?.domain || pickHighestValue(connectedSet));
        } else {
          setNextUnlock(pickHighestValue(DEMO_CONNECTED));
        }
      })
      .catch(() => { if (!cancelled) setNextUnlock(pickHighestValue(DEMO_CONNECTED)); });
    return () => { cancelled = true; };
  }, [clubId]);

  // Live System Health — migrated to useServiceCache (SHIP_PLAN §2.3).
  // The endpoint is public and may legitimately return overall:'unknown' when
  // offline or behind a proxy; render that case gracefully.
  const { data: health, isLoading: healthLoading } = useApiHealthData();

  const unlockImpact = nextUnlock ? DOMAIN_UNLOCK_IMPACT[nextUnlock] : null;
  const unlockPct = nextUnlock ? DOMAIN_VALUE_PCTS[nextUnlock] : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold m-0 text-gray-800 dark:text-white/90">Data Hub</h2>
        <p className="text-sm text-gray-500 mt-1 mb-0">
          Connect data sources, upload CSVs, and see what intelligence each connection unlocks.
        </p>
      </div>

      {/* Next Intelligence Unlock */}
      {unlockImpact && (
        <Card>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-500">Next Intelligence Unlock</span>
                <SourceBadge system={unlockImpact.sourceSystem} size="xs" />
              </div>
              <h3 className="text-base font-bold m-0 text-gray-800 dark:text-white/90">
                Connect {unlockImpact.label} to unlock {unlockPct}% more platform value
              </h3>
              <div className="mt-1 text-xs font-semibold text-warning-600 dark:text-warning-400">
                {unlockImpact.dollar}
              </div>
              <div className="mt-3 text-[11px] uppercase tracking-wide text-gray-400">Would enable:</div>
              <ul className="text-xs text-gray-700 dark:text-gray-300 m-0 pl-4 leading-snug mt-1">
                {unlockImpact.features.map(f => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => navigate('integrations')}
              aria-label={`Connect ${unlockImpact.label}`}
              className="px-4 py-2 rounded-lg border-none bg-brand-500 text-white font-bold text-xs cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Connect {unlockImpact.label}
            </button>
          </div>
        </Card>
      )}

      {/* Live System Health — consumes apiHealthService.getHealthRollup() */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold m-0 text-gray-800 dark:text-white/90">Live System Health</h3>
          {health && (
            <Badge
              color={health.overall === 'ok' ? 'success' : health.overall === 'degraded' ? 'warning' : 'light'}
              size="sm"
            >
              {health.overall === 'ok' ? 'All systems OK' : health.overall === 'degraded' ? 'Degraded' : 'Unknown'}
            </Badge>
          )}
        </div>

        {healthLoading ? (
          <div className="text-xs text-gray-400">Checking /api/health...</div>
        ) : !health || health.overall === 'unknown' ? (
          <div className="text-xs text-gray-500">
            Health endpoint unreachable or returned no data. The app is still usable — this card will populate once <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800">/api/health</code> responds.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${
                  health.db?.status === 'ok' ? 'bg-success-500/10 text-success-600' : 'bg-error-500/10 text-error-600'
                }`}>
                  {health.db?.status === 'ok' ? '✓' : '!'}
                </span>
                <span className="text-sm font-semibold text-gray-800 dark:text-white/90">Database</span>
              </div>
              <div className="text-[11px] text-gray-500">
                {health.db?.status === 'ok'
                  ? `Connected${health.db.latencyMs != null ? ` · ${health.db.latencyMs} ms` : ''}`
                  : 'Connection failed'}
              </div>
            </div>

            {health.integrations.length === 0 ? (
              <div className="text-[11px] text-gray-500 px-3 py-2">No integrations reported by health endpoint.</div>
            ) : (
              health.integrations.map(intg => (
                <div key={intg.key || intg.name} className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${
                      intg.status === 'ok' ? 'bg-success-500/10 text-success-600'
                        : intg.status === 'stale' ? 'bg-warning-500/10 text-warning-600'
                          : 'bg-gray-400/10 text-gray-500'
                    }`}>
                      {intg.badge}
                    </span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{intg.name}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 text-right max-w-[60%] truncate" title={intg.hint}>{intg.hint}</div>
                </div>
              ))
            )}

            {health.fetchedAt && (
              <div className="text-[10px] text-gray-400 mt-1">
                Fetched {new Date(health.fetchedAt).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Connected Sources — pilot migration to useServiceCache (SHIP_PLAN §2.3) */}
      <ConnectedSourcesCard />

      {/* CSV Upload link */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 rounded-xl p-4 bg-brand-50 border border-brand-200 dark:bg-brand-500/5 dark:border-brand-500/20">
        <div>
          <div className="font-bold text-sm text-gray-800 dark:text-white/90">Manual Data Upload</div>
          <div className="text-xs text-gray-500">Upload CSV files for members, rounds, transactions, or complaints when API access isn&rsquo;t available.</div>
        </div>
        <button onClick={() => navigate('csv-import')} className="px-4 py-2 rounded-lg border-none bg-brand-500 text-white font-bold text-xs cursor-pointer shrink-0 self-start sm:self-auto focus-visible:ring-2 focus-visible:ring-brand-500">Open Upload Tool</button>
      </div>
    </div>
  );
}

function ConnectedSourcesCard() {
  const { data: systems, isLoading } = useIntegrationsData();
  const sources = (systems || getConnectedSystems()).slice(0, 12);

  return (
    <>
      <Card>
        <h3 className="text-base font-bold mb-3 m-0 text-gray-800 dark:text-white/90">Connected Sources</h3>
        {isLoading && !systems ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="px-3.5 py-3 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 animate-pulse h-[82px]"
              />
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sources.map(source => (
            <div key={source.id} className={`px-3.5 py-3 rounded-lg border ${
              source.status === 'connected'
                ? 'border-success-300 bg-success-50 dark:border-success-500/30 dark:bg-success-500/5'
                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
            }`}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-lg font-bold text-gray-400">{source.logo}</span>
                <Badge color={source.status === 'connected' ? 'success' : 'light'} size="sm">{source.status}</Badge>
              </div>
              <div className="font-semibold text-sm text-gray-800 dark:text-white/90">{source.name}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{source.category}</div>
              {source.status === 'connected' && source.lastSync && <div className="text-[11px] text-success-600 dark:text-success-400 mt-1">Synced {source.lastSync}</div>}
            </div>
          ))}
        </div>
        )}
      </Card>
    </>
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
    { name: user.name || 'Sarah Mitchell', email: user.email || 'sarah@pinetreecc.com', role: 'General Manager', status: 'Active', lastActive: 'Today' },
    { name: 'James Crawford', email: 'james@pinetreecc.com', role: 'Head Golf Professional', status: 'Active', lastActive: '2 days ago' },
    { name: 'Maria Santos', email: 'maria@pinetreecc.com', role: 'F&B Director', status: 'Active', lastActive: '1 day ago' },
    { name: 'David Chen', email: 'david@pinetreecc.com', role: 'Membership Director', status: 'Invited', lastActive: '—' },
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

      <div className="border border-gray-200 rounded-xl overflow-hidden dark:border-gray-800 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full border-collapse text-sm min-w-[600px]">
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

function ClubManagementTab({ currentClubId }) {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/club');
      if (data?.clubs) setClubs(data.clubs);
      else if (data?.club_id) setClubs([data]); // single-club response for non-admin GMs
    } catch { setError('Failed to load clubs'); }
    setLoading(false);
  };

  useEffect(() => { fetchClubs(); }, []);

  const handleSwitch = (clubId, clubName) => {
    localStorage.setItem('swoop_club_id', clubId);
    localStorage.setItem('swoop_club_name', clubName || 'Club');
    const user = JSON.parse(localStorage.getItem('swoop_auth_user') || '{}');
    user.clubId = clubId;
    user.clubName = clubName;
    localStorage.setItem('swoop_auth_user', JSON.stringify(user));
    window.location.reload();
  };

  const [resetting, setResetting] = useState(null);

  const handleResetData = async (clubId, clubName) => {
    if (!confirm(`Reset all imported data for "${clubName || clubId}"?\n\nThis will delete all members, rounds, transactions, complaints, and computed insights. Your club account and login will be preserved.\n\nThis cannot be undone.`)) return;
    setResetting(clubId);
    setError(null);
    try {
      const res = await fetch(`/api/club?action=reset-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('swoop_auth_token')}`,
        },
        body: JSON.stringify({ clubId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Reset complete — cleared ${data.totalRowsDeleted} rows. Reload the page to see the empty state.`);
        fetchClubs();
        window.dispatchEvent(new Event('swoop:data-imported')); // trigger DataProvider refresh
      } else {
        setError(data.error || 'Reset failed');
      }
    } catch (e) {
      setError(e.message);
    }
    setResetting(null);
  };

  const handleDelete = async (clubId) => {
    if (!confirm(`Delete ALL data for club "${clubId}"? This cannot be undone.`)) return;
    setDeleting(clubId);
    setError(null);
    try {
      const force = clubId === 'club_001' ? '&force=true' : '';
      const res = await fetch(`/api/club?clubId=${clubId}${force}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('swoop_auth_token')}`,
          'X-Demo-Club': clubId,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Deleted ${data.totalRowsDeleted} rows from ${clubId}`);
        // If we deleted the current club, switch away
        if (clubId === currentClubId) {
          localStorage.removeItem('swoop_club_id');
          localStorage.removeItem('swoop_club_name');
        }
        fetchClubs();
      } else {
        setError(data.error || 'Delete failed');
      }
    } catch (e) {
      setError(e.message);
    }
    setDeleting(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold m-0 text-gray-800 dark:text-white/90">Club Management</h2>
          <p className="text-sm text-gray-500 mt-1 mb-0">
            View all clubs in the database, switch between them, or clean up test data.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const name = prompt('Club name:');
              if (!name) return;
              const city = prompt('City:');
              if (!city) return;
              const state = prompt('State (2-letter code):');
              if (!state) return;
              const token = localStorage.getItem('swoop_auth_token');
              fetch('/api/quick-setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ club_name: name, city, state, create_new: true }),
              })
                .then(r => r.json())
                .then(data => {
                  if (data.clubId) {
                    setSuccess(`Created "${name}" (${data.clubId}). Switch to it below.`);
                    fetchClubs();
                  } else {
                    setError(data.error || 'Failed to create club');
                  }
                })
                .catch(() => setError('Connection error'));
            }}
            className="px-3 py-1.5 rounded-lg bg-brand-500 text-white font-semibold text-xs cursor-pointer hover:bg-brand-600"
          >
            + New Club
          </button>
          <button onClick={fetchClubs} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 font-semibold text-xs cursor-pointer hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="px-3.5 py-2.5 rounded-lg bg-error-50 text-error-700 text-sm font-medium dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}
      {success && (
        <div className="px-3.5 py-2.5 rounded-lg bg-success-50 text-success-700 text-sm font-medium dark:bg-success-500/10 dark:text-success-400">
          {success}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Loading clubs...</div>
      ) : clubs.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2">🏌️</div>
            <div className="text-sm font-medium">No clubs found in database</div>
          </div>
        </Card>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden dark:border-gray-800 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full border-collapse text-sm min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                {['Club ID', 'Name', 'Location', 'Members', 'Last Activity', 'Actions'].map(h => (
                  <th key={h} className="px-3.5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clubs.map((club, i) => {
                const isActive = club.club_id === currentClubId;
                return (
                  <tr key={club.club_id} className={`${isActive ? 'bg-brand-50 dark:bg-brand-500/5' : 'bg-white dark:bg-white/[0.03]'} ${i < clubs.length - 1 ? 'border-b border-gray-200 dark:border-gray-800' : ''}`}>
                    <td className="px-3.5 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {club.club_id}
                      {isActive && <span className="ml-2 px-1.5 py-0.5 rounded bg-brand-500 text-white text-[10px] font-bold">ACTIVE</span>}
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-gray-800 dark:text-white/90">{club.name || '—'}</td>
                    <td className="px-3.5 py-3 text-gray-500 text-xs">{[club.city, club.state].filter(Boolean).join(', ') || '—'}</td>
                    <td className="px-3.5 py-3 text-gray-600 dark:text-gray-400">{club.member_count ?? '—'}</td>
                    <td className="px-3.5 py-3 text-gray-500 text-xs">{club.last_activity ? new Date(club.last_activity).toLocaleDateString() : '—'}</td>
                    <td className="px-3.5 py-3">
                      <div className="flex gap-2">
                        {!isActive && (
                          <button
                            onClick={() => handleSwitch(club.club_id, club.name)}
                            className="px-2.5 py-1 rounded-md border border-brand-300 bg-brand-50 text-brand-600 text-[11px] font-bold cursor-pointer hover:bg-brand-100 dark:bg-brand-500/5 dark:border-brand-500/30"
                          >
                            Switch
                          </button>
                        )}
                        {isActive && (
                          <button
                            onClick={() => handleResetData(club.club_id, club.name)}
                            disabled={resetting === club.club_id}
                            className="px-2.5 py-1 rounded-md border border-warning-300 bg-warning-50 text-warning-700 text-[11px] font-bold cursor-pointer hover:bg-warning-100 disabled:opacity-50 dark:bg-warning-500/5 dark:border-warning-500/30"
                          >
                            {resetting === club.club_id ? 'Resetting...' : 'Reset Data'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(club.club_id)}
                          disabled={deleting === club.club_id}
                          className="px-2.5 py-1 rounded-md border border-error-300 bg-error-50 text-error-600 text-[11px] font-bold cursor-pointer hover:bg-error-100 disabled:opacity-50 dark:bg-error-500/5 dark:border-error-500/30"
                        >
                          {deleting === club.club_id ? 'Deleting...' : 'Delete Club'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Card>
        <div className="text-xs text-gray-500">
          <strong>Current club:</strong> {currentClubId || 'None selected'}
          {currentClubId?.startsWith('demo_') && <span className="ml-2 text-warning-500 font-semibold">(Demo session — data will be cleaned up on logout)</span>}
        </div>
      </Card>
    </div>
  );
}
