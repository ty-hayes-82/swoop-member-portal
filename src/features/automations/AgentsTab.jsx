/**
 * AgentsTab — AI agent status cards, per-agent config, and activity feed
 */
import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { getAgents, getAllActions, getAgentSummary } from '@/services/agentService';

const STATUS_STYLES = {
  active: { bg: 'bg-success-50 dark:bg-success-500/10', text: 'text-success-600 dark:text-success-400', label: 'Active' },
  idle: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-500 dark:text-gray-400', label: 'Idle' },
  learning: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', label: 'Learning' },
  paused: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', label: 'Paused' },
};

function AgentCard({ agent, agentStatus, onToggle, actions }) {
  const [expanded, setExpanded] = useState(false);
  const statusKey = agentStatus || agent.status || 'idle';
  const style = STATUS_STYLES[statusKey] || STATUS_STYLES.idle;
  const isPaused = statusKey === 'paused';
  const agentActions = actions.filter(a => a.agentId === agent.id).slice(0, 3);

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white dark:bg-gray-900 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg">
            🤖
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800 dark:text-white/90">{agent.name}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                {style.label}
              </span>
              {agent.accuracy && (
                <span className="text-[10px] text-gray-400">{agent.accuracy}% accuracy</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => onToggle(agent.id, statusKey)}
          className={`px-3 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border transition-colors ${
            isPaused
              ? 'bg-brand-500 text-white border-brand-500'
              : 'bg-transparent text-gray-500 border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400'
          }`}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3 m-0">
        {agent.description}
      </p>

      {/* Source systems */}
      {agent.sourceSystems && (
        <div className="flex flex-wrap gap-1 mb-3">
          {(Array.isArray(agent.sourceSystems) ? agent.sourceSystems : []).map(s => (
            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Recent actions (expandable) */}
      {agentActions.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400 cursor-pointer bg-transparent border-none p-0 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
            Recent actions ({agentActions.length})
          </button>
          {expanded && (
            <div className="mt-2 space-y-1.5">
              {agentActions.map(a => (
                <div key={a.id} className="text-xs text-gray-600 dark:text-gray-400 pl-4 border-l-2 border-gray-200 dark:border-gray-700 py-1">
                  <div className="line-clamp-1">{a.description}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {a.status} {a.timestamp ? `· ${new Date(a.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Last action time */}
      {agent.lastAction && (
        <div className="text-[10px] text-gray-400 mt-2">
          Last active: {new Date(agent.lastAction).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
}

export default function AgentsTab() {
  const { agentStatuses, toggleAgent } = useApp();
  const agents = useMemo(() => getAgents(), []);
  const actions = useMemo(() => getAllActions(), []);
  const summary = useMemo(() => getAgentSummary(), []);

  return (
    <div className="flex flex-col gap-6">
      {/* Summary strip */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success-50 dark:bg-success-500/10">
          <span className="text-sm font-bold text-success-600 dark:text-success-400">{summary.activeAgents || agents.length}</span>
          <span className="text-xs text-success-600 dark:text-success-400">Active Agents</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-50 dark:bg-brand-500/10">
          <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{summary.pendingActions || 0}</span>
          <span className="text-xs text-brand-600 dark:text-brand-400">Pending Actions</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
          <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{summary.approvedActions || 0}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Approved This Period</span>
        </div>
      </div>

      {/* Agent cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            agentStatus={agentStatuses?.[agent.id]}
            onToggle={toggleAgent}
            actions={actions}
          />
        ))}
      </div>

      {agents.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-3xl mb-3">🤖</div>
          <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">No agents configured</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            AI agents will appear here once your club data is connected.
          </div>
        </div>
      )}
    </div>
  );
}
