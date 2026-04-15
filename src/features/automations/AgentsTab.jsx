/**
 * AgentsTab — AI agent status cards with per-agent configuration
 * Each card: status, accuracy, pause/resume, run-now, expandable settings
 */
import { useState, useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigation } from '@/context/NavigationContext';
import { getAgents, getAllActions, getAgentSummary, getCoordinationGraph } from '@/services/agentService';
import AgentConfigDrawer from '@/features/agents/AgentConfigDrawer';

const STATUS_STYLES = {
  active: { bg: 'bg-success-50', text: 'text-success-600', label: 'Active' },
  idle: { bg: 'bg-swoop-row', text: 'text-swoop-text-muted', label: 'Idle' },
  learning: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Learning' },
  paused: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Paused' },
};

const TONE_OPTIONS = [
  { value: 'default', label: 'Use Global Setting' },
  { value: 'warm-professional', label: 'Warm & Professional' },
  { value: 'casual-friendly', label: 'Casual & Friendly' },
  { value: 'formal-executive', label: 'Formal & Executive' },
  { value: 'empathetic-supportive', label: 'Empathetic & Supportive' },
  { value: 'energetic-enthusiastic', label: 'Energetic & Enthusiastic' },
];

function AgentCard({ agent, agentStatus, agentConfig, onToggle, onSaveConfig, onOpenConfig, onRunNow, actions }) {
  const [showSettings, setShowSettings] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const statusKey = agentStatus || agent.status || 'idle';
  const style = STATUS_STYLES[statusKey] || STATUS_STYLES.idle;
  const isPaused = statusKey === 'paused';
  const agentActions = actions.filter(a => a.agentId === agent.id).slice(0, 5);

  // Per-agent config (falls back to defaults)
  const config = agentConfig || {};
  const [localConfig, setLocalConfig] = useState({
    autoApproveThreshold: config.autoApproveThreshold ?? 0.85,
    toneOverride: config.toneOverride || 'default',
    customInstructions: config.customInstructions || '',
    maxActionsPerDay: config.maxActionsPerDay ?? 10,
    notifyOnAction: config.notifyOnAction ?? true,
  });

  const handleConfigChange = useCallback((key, value) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSaveConfig = () => {
    onSaveConfig(agent.id, localConfig);
  };

  const handleRunNow = useCallback(async () => {
    setRunning(true);
    setRunResult(null);
    try {
      await onRunNow?.(agent.id);
      setRunResult({ ok: true, text: 'Agent run queued.' });
    } catch (err) {
      setRunResult({ ok: false, text: err.message || 'Run failed.' });
    }
    setRunning(false);
  }, [agent.id, onRunNow]);

  return (
    <div className="border border-swoop-border rounded-xl bg-swoop-panel overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-swoop-row flex items-center justify-center text-lg">
              🤖
            </div>
            <div>
              <div className="text-sm font-bold text-swoop-text">{agent.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
                {agent.accuracy && (
                  <span className="text-[10px] text-swoop-text-label">{agent.accuracy}% accuracy</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRunNow}
              disabled={running}
              title="Manually trigger this agent now (normally runs on schedule or webhook)"
              className="px-3 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border border-brand-300 text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {running ? (
                <span className="inline-block w-2.5 h-2.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
              Run Now
            </button>
            <button
              onClick={() => onToggle(agent.id, statusKey)}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border transition-colors ${
                isPaused
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-transparent text-swoop-text-muted border-swoop-border hover:bg-swoop-row-hover'
              }`}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-swoop-text-muted leading-relaxed mb-3 m-0">
          {agent.description}
        </p>

        {/* Source systems */}
        {agent.sourceSystems && (
          <div className="flex flex-wrap gap-1 mb-3">
            {(Array.isArray(agent.sourceSystems) ? agent.sourceSystems : []).map(s => (
              <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-swoop-row text-swoop-text-muted">
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Action bar: Configure + Settings + Recent Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenConfig?.(agent)}
            className="flex items-center gap-1 text-[11px] font-semibold cursor-pointer bg-transparent border-none p-0 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 text-brand-500 hover:text-brand-600"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9v1a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            Configure
          </button>
          <span className="text-swoop-text-ghost">|</span>
          <button
            onClick={() => { setShowSettings(!showSettings); if (showActions) setShowActions(false); }}
            className={`flex items-center gap-1 text-[11px] font-semibold cursor-pointer bg-transparent border-none p-0 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 ${
              showSettings ? 'text-brand-500' : 'text-swoop-text-muted hover:text-swoop-text-2'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9v1a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            Quick Settings
          </button>
          {agentActions.length > 0 && (
            <button
              onClick={() => { setShowActions(!showActions); if (showSettings) setShowSettings(false); }}
              className={`flex items-center gap-1 text-[11px] font-semibold cursor-pointer bg-transparent border-none p-0 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 ${
                showActions ? 'text-brand-500' : 'text-swoop-text-muted hover:text-swoop-text-2'
              }`}
            >
              <svg className={`w-3 h-3 transition-transform ${showActions ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
              Activity ({agentActions.length})
            </button>
          )}
        </div>

        {/* Last action time */}
        {agent.lastAction && (
          <div className="text-[10px] text-swoop-text-label mt-2">
            Last active: {new Date(agent.lastAction).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </div>
        )}
        {runResult && (
          <div className={`text-[11px] font-medium mt-1 ${runResult.ok ? 'text-emerald-600' : 'text-red-600'}`}>
            {runResult.text}
          </div>
        )}
      </div>

      {/* Expandable: Settings Panel */}
      {showSettings && (
        <div className="border-t border-swoop-border bg-swoop-row px-4 py-3 space-y-3">
          {/* Auto-approve threshold */}
          <div>
            <label className="block text-[11px] font-medium text-swoop-text-muted mb-1">
              Auto-approve threshold: {Math.round(localConfig.autoApproveThreshold * 100)}%
            </label>
            <input
              type="range" min="0.5" max="0.99" step="0.01"
              value={localConfig.autoApproveThreshold}
              onChange={e => handleConfigChange('autoApproveThreshold', parseFloat(e.target.value))}
              className="w-full accent-brand-500 h-1.5"
            />
            <div className="flex justify-between text-[9px] text-swoop-text-label">
              <span>More auto-approved</span>
              <span>Manual review</span>
            </div>
          </div>

          {/* Tone override */}
          <div>
            <label className="block text-[11px] font-medium text-swoop-text-muted mb-1">Tone Override</label>
            <select
              value={localConfig.toneOverride}
              onChange={e => handleConfigChange('toneOverride', e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-swoop-border bg-swoop-panel text-xs"
            >
              {TONE_OPTIONS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Max actions per day */}
          <div>
            <label className="block text-[11px] font-medium text-swoop-text-muted mb-1">
              Max actions/day: {localConfig.maxActionsPerDay}
            </label>
            <input
              type="range" min="1" max="50" step="1"
              value={localConfig.maxActionsPerDay}
              onChange={e => handleConfigChange('maxActionsPerDay', parseInt(e.target.value))}
              className="w-full accent-brand-500 h-1.5"
            />
          </div>

          {/* Notify on action */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={localConfig.notifyOnAction}
              aria-label="Notify me when this agent proposes an action"
              onClick={() => handleConfigChange('notifyOnAction', !localConfig.notifyOnAction)}
              className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                localConfig.notifyOnAction ? 'bg-brand-500' : 'bg-swoop-border'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-swoop-panel shadow transition-transform ${
                localConfig.notifyOnAction ? 'translate-x-[18px]' : 'translate-x-0.5'
              }`} />
            </button>
            <span className="text-[11px] text-swoop-text-muted">Notify me when this agent proposes an action</span>
          </div>

          {/* Custom instructions */}
          <div>
            <label className="block text-[11px] font-medium text-swoop-text-muted mb-1">Custom Instructions</label>
            <textarea
              value={localConfig.customInstructions}
              onChange={e => handleConfigChange('customInstructions', e.target.value)}
              placeholder="e.g., Focus on members with dues over $10K. Always recommend a phone call before email for high-value members. Never suggest comp offers for members with outstanding balances." // lint-no-hardcoded-dollars: allow — placeholder example text in textarea
              rows={2}
              className="w-full px-2 py-1.5 rounded-lg border border-swoop-border bg-swoop-panel text-[11px] resize-none"
            />
          </div>

          <button
            onClick={handleSaveConfig}
            className="w-full py-1.5 rounded-lg bg-brand-500 text-white text-[11px] font-semibold cursor-pointer border-none hover:bg-brand-600 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Save Agent Settings
          </button>
        </div>
      )}

      {/* Expandable: Recent Actions */}
      {showActions && agentActions.length > 0 && (
        <div className="border-t border-swoop-border bg-swoop-row px-4 py-3">
          <div className="space-y-1.5">
            {agentActions.map(a => (
              <div key={a.id} className="text-xs text-swoop-text-muted pl-3 border-l-2 border-swoop-border py-1">
                <div className="line-clamp-2">{a.description}</div>
                <div className="text-[10px] text-swoop-text-label mt-0.5">
                  {a.status} {a.timestamp ? `· ${new Date(a.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CoordinationPanel({ agents }) {
  const edges = useMemo(() => getCoordinationGraph(), []);
  const agentMap = useMemo(() => Object.fromEntries(agents.map(a => [a.id, a.name])), [agents]);

  if (edges.length === 0) return null;

  return (
    <div className="border border-swoop-border rounded-xl bg-swoop-panel p-4">
      <div className="text-sm font-bold text-swoop-text mb-1">Agent Coordination Graph</div>
      <p className="text-xs text-swoop-text-muted mb-3 m-0">
        Agents share member context in real time. Each link shows agents coordinating on the same member.
      </p>
      <div className="flex flex-wrap gap-2">
        {edges.slice(0, 8).map(e => (
          <div key={`${e.agentA}-${e.agentB}`} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-50 border border-brand-100">
            <span className="text-[11px] font-semibold text-brand-700">{agentMap[e.agentA] || e.agentA}</span>
            <svg className="w-3 h-3 text-brand-400" viewBox="0 0 20 20" fill="currentColor"><path d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" /></svg>
            <span className="text-[11px] font-semibold text-brand-700">{agentMap[e.agentB] || e.agentB}</span>
            <span className="text-[10px] text-brand-500 ml-1">{e.sharedMembers.length} shared</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AgentsTab() {
  const { agentStatuses, toggleAgent, saveAgentConfig, getAgentConfig } = useApp();
  const { navigate } = useNavigation();
  const agents = useMemo(() => getAgents(), []);
  const actions = useMemo(() => getAllActions(), []);
  const summary = useMemo(() => getAgentSummary(), []);

  // Config drawer state
  const [drawerAgent, setDrawerAgent] = useState(null);
  const openConfigDrawer = useCallback((agent) => setDrawerAgent(agent), []);
  const closeConfigDrawer = useCallback(() => setDrawerAgent(null), []);

  // Manual agent trigger — never auto-runs, only on explicit click
  const runAgent = useCallback(async (agentId) => {
    const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_auth_token') : null;
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && token !== 'demo' ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ operation: 'run', agentId, clubId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Summary strip */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success-50">
          <span className="text-sm font-bold text-success-600">{summary.activeAgents || agents.length}</span>
          <span className="text-xs text-success-600">Active Agents</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-50">
          <span className="text-sm font-bold text-brand-600">{summary.pendingActions || 0}</span>
          <span className="text-xs text-brand-600">Pending Actions</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-swoop-row">
          <span className="text-sm font-bold text-swoop-text-muted">{summary.approvedActions || 0}</span>
          <span className="text-xs text-swoop-text-muted">Approved This Period</span>
        </div>
      </div>

      {/* Cross-agent coordination */}
      <CoordinationPanel agents={agents} />

      {/* Agent cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {agents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            agentStatus={agentStatuses?.[agent.id]}
            agentConfig={getAgentConfig?.(agent.id)}
            onToggle={toggleAgent}
            onSaveConfig={saveAgentConfig}
            onOpenConfig={openConfigDrawer}
            onRunNow={runAgent}
            actions={actions}
          />
        ))}
      </div>

      {agents.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-3xl mb-3">🤖</div>
          <div className="font-semibold text-swoop-text-2 mb-1">No agents configured</div>
          <div className="text-sm text-swoop-text-muted">
            Import your member roster and tee sheet data to activate agents. Start in{' '}
            <button
              type="button"
              className="text-brand underline bg-transparent border-none cursor-pointer p-0 font-inherit text-sm"
              onClick={() => navigate('admin', { tab: 'data-hub' })}
            >
              Import Data
            </button>
            .
          </div>
        </div>
      )}

      {/* Sprint 2: Full config drawer */}
      <AgentConfigDrawer
        agentId={drawerAgent?.id}
        agentName={drawerAgent?.name}
        open={!!drawerAgent}
        onClose={closeConfigDrawer}
      />
    </div>
  );
}
