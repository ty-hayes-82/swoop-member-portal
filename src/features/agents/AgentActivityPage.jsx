/**
 * AgentActivityPage — Real-time agent activity dashboard.
 * Shows live feed, active playbooks, and agent coordination logs.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch, getClubId } from '@/services/apiClient';

// ── Agent color map ──────────────────────────────────────────────────────────
const AGENT_COLORS = {
  agt_retention:    { bg: 'bg-red-100 dark:bg-red-900/40',    text: 'text-red-700 dark:text-red-300',    dot: 'bg-red-500' },
  agt_teesheet:     { bg: 'bg-blue-100 dark:bg-blue-900/40',   text: 'text-blue-700 dark:text-blue-300',   dot: 'bg-blue-500' },
  agt_concierge:    { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  agt_revenue:      { bg: 'bg-green-100 dark:bg-green-900/40',  text: 'text-green-700 dark:text-green-300',  dot: 'bg-green-500' },
  agt_staffing:     { bg: 'bg-amber-100 dark:bg-amber-900/40',  text: 'text-amber-700 dark:text-amber-300',  dot: 'bg-amber-500' },
  agt_complaint:    { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  agt_cos:          { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
};

const DEFAULT_COLORS = { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', dot: 'bg-gray-500' };

function agentColor(agentId) {
  return AGENT_COLORS[agentId] || DEFAULT_COLORS;
}

function agentLabel(agentId) {
  const labels = {
    agt_retention: 'Retention Sentinel',
    agt_teesheet: 'Tee Sheet Optimizer',
    agt_concierge: 'Concierge',
    agt_revenue: 'Revenue Agent',
    agt_staffing: 'Staffing Agent',
    agt_complaint: 'Complaint Agent',
    agt_cos: 'Chief of Staff',
  };
  return labels[agentId] || agentId;
}

// ── Time formatting ──────────────────────────────────────────────────────────
function relativeTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ── Polling hook ─────────────────────────────────────────────────────────────
function useAgentActivity(pollInterval = 5000) {
  const [data, setData] = useState({ activity: [], activePlaybooks: [], coordination: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const fetchData = useCallback(async () => {
    const clubId = getClubId();
    if (!clubId) return;
    try {
      const result = await apiFetch(`/api/agent-activity?club_id=${clubId}&limit=100`);
      if (result) {
        setData(result);
        setError(null);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(fetchData, pollInterval);
    return () => clearInterval(timerRef.current);
  }, [fetchData, pollInterval]);

  return { data, loading, error };
}

// ── Sub-components ───────────────────────────────────────────────────────────

function LiveFeedItem({ event }) {
  const c = agentColor(event.agent_id);
  return (
    <div className="flex items-start gap-3 py-3 px-4 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      {/* Agent dot */}
      <div className="pt-1 flex-shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${c.bg} ${c.text}`}>
            {agentLabel(event.agent_id)}
          </span>
          {event.phase && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
              {event.phase}
            </span>
          )}
          <span className="ml-auto text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">
            {relativeTime(event.created_at)}
          </span>
        </div>

        <p className="mt-1 text-sm text-gray-700 dark:text-gray-200 leading-snug">
          {event.description || event.action_type}
        </p>

        {event.member_name && (
          <span className="inline-flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            {event.member_name}
          </span>
        )}

        {event.reasoning && (
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 italic leading-snug">
            {event.reasoning}
          </p>
        )}

        <div className="flex items-center gap-3 mt-1.5">
          {event.confidence != null && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              Confidence: {Math.round(event.confidence * 100)}%
            </span>
          )}
          {event.auto_executed && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-green-600 dark:text-green-400">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              Auto-executed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PlaybookCard({ playbook }) {
  const totalSteps = parseInt(playbook.total_steps) || 0;
  const completedSteps = parseInt(playbook.completed_steps) || 0;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const currentStep = playbook.current_step;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-4 shadow-theme-xs">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate">
          {playbook.playbook_name}
        </h4>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 uppercase">
          Active
        </span>
      </div>

      {playbook.member_name && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
          {playbook.member_name}
        </p>
      )}

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mb-1">
          <span>Step {completedSteps + 1} of {totalSteps}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {currentStep && (
        <div className="mt-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/40">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-200">
            Next: {currentStep.title}
          </p>
          {currentStep.due_date && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              Due: {formatDate(currentStep.due_date)}
            </p>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
        <span>Started {relativeTime(playbook.started_at)}</span>
        {playbook.triggered_by && <span>by {playbook.triggered_by}</span>}
      </div>
    </div>
  );
}

function CoordinationCard({ log }) {
  const details = log.conflict_details;
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-4 shadow-theme-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${AGENT_COLORS.agt_cos?.dot || 'bg-indigo-500'}`} />
          <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Chief of Staff Coordination
          </h4>
        </div>
        <span className="text-[11px] text-gray-400 dark:text-gray-500">
          {formatDate(log.log_date)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Actions In" value={log.actions_input} />
        <Stat label="Actions Out" value={log.actions_output} />
        <Stat label="Conflicts Found" value={log.conflicts_detected} />
        <Stat label="Resolved" value={log.conflicts_resolved} />
      </div>

      {log.agents_contributing?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {log.agents_contributing.map(id => {
            const c = agentColor(id);
            return (
              <span key={id} className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${c.bg} ${c.text}`}>
                {agentLabel(id)}
              </span>
            );
          })}
        </div>
      )}

      {details && typeof details === 'object' && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/40 rounded-lg p-2">
          <pre className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed">
            {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-gray-800 dark:text-white/90">{value ?? 0}</p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">No agent activity yet</h3>
      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 max-w-xs">
        Import data and activate agents to see them work. Activity from all agents will appear here in real time.
      </p>
    </div>
  );
}

function PulsingDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
    </span>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'feed', label: 'Live Feed' },
  { key: 'playbooks', label: 'Active Playbooks' },
  { key: 'coordination', label: 'Agent Coordination' },
];

// ── Main component ───────────────────────────────────────────────────────────
export default function AgentActivityPage() {
  const { data, loading } = useAgentActivity(5000);
  const [activeTab, setActiveTab] = useState('feed');

  const hasActivity = data.activity.length > 0 || data.activePlaybooks.length > 0 || data.coordination.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold m-0 text-gray-800 dark:text-white/90">Agent Activity</h1>
          <p className="text-sm text-gray-500 mt-1 mb-0">
            Real-time view of all agent communications, decisions, and actions.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <PulsingDot />
          <span>Live</span>
        </div>
      </div>

      {/* Summary cards */}
      {hasActivity && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard label="Total Events" value={data.activity.length} />
          <SummaryCard label="Active Playbooks" value={data.activePlaybooks.length} />
          <SummaryCard label="Auto-Executed" value={data.activity.filter(e => e.auto_executed).length} />
          <SummaryCard label="Coordination Runs" value={data.coordination.length} />
        </div>
      )}

      {/* Tabs */}
      <div role="tablist" className="flex gap-0.5 rounded-lg bg-gray-100 p-0.5 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        {TABS.map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none transition-all duration-150 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-brand-500 ${
              activeTab === tab.key
                ? 'bg-white text-gray-800 shadow-theme-xs dark:bg-gray-700 dark:text-white'
                : 'bg-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.key === 'playbooks' && data.activePlaybooks.length > 0 && (
              <span className="ml-1 min-w-[16px] h-[16px] inline-flex items-center justify-center rounded-full bg-brand-500 text-white text-[9px] font-bold px-1">
                {data.activePlaybooks.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : !hasActivity ? (
          <EmptyState />
        ) : (
          <>
            {/* Live Feed */}
            {activeTab === 'feed' && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 shadow-theme-xs overflow-hidden">
                {data.activity.length === 0 ? (
                  <p className="p-6 text-sm text-gray-400 dark:text-gray-500 text-center">No activity events recorded yet.</p>
                ) : (
                  data.activity.map(event => (
                    <LiveFeedItem key={event.activity_id} event={event} />
                  ))
                )}
              </div>
            )}

            {/* Active Playbooks */}
            {activeTab === 'playbooks' && (
              <div className="grid gap-4 sm:grid-cols-2">
                {data.activePlaybooks.length === 0 ? (
                  <p className="p-6 text-sm text-gray-400 dark:text-gray-500 text-center col-span-2">No active playbooks running.</p>
                ) : (
                  data.activePlaybooks.map(pb => (
                    <PlaybookCard key={pb.run_id} playbook={pb} />
                  ))
                )}
              </div>
            )}

            {/* Coordination */}
            {activeTab === 'coordination' && (
              <div className="grid gap-4">
                {data.coordination.length === 0 ? (
                  <p className="p-6 text-sm text-gray-400 dark:text-gray-500 text-center">No coordination events recorded yet.</p>
                ) : (
                  data.coordination.map(log => (
                    <CoordinationCard key={log.log_id} log={log} />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-3 shadow-theme-xs text-center">
      <p className="text-2xl font-bold text-gray-800 dark:text-white/90">{value}</p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}
