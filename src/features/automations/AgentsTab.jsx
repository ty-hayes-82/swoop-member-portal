/**
 * AgentsTab — AI agent status cards with per-agent configuration
 * Each card: status, accuracy, pause/resume, expandable settings (threshold, tone override, custom instructions)
 */
import { useState, useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { getAgents, getAllActions, getAgentSummary } from '@/services/agentService';

const STATUS_STYLES = {
  active: { bg: 'bg-success-50 dark:bg-success-500/10', text: 'text-success-600 dark:text-success-400', label: 'Active' },
  idle: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-500 dark:text-gray-400', label: 'Idle' },
  learning: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', label: 'Learning' },
  paused: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', label: 'Paused' },
};

const TONE_OPTIONS = [
  { value: 'default', label: 'Use Global Setting' },
  { value: 'warm-professional', label: 'Warm & Professional' },
  { value: 'casual-friendly', label: 'Casual & Friendly' },
  { value: 'formal-executive', label: 'Formal & Executive' },
  { value: 'empathetic-supportive', label: 'Empathetic & Supportive' },
  { value: 'energetic-enthusiastic', label: 'Energetic & Enthusiastic' },
];

function AgentCard({ agent, agentStatus, agentConfig, onToggle, onSaveConfig, actions }) {
  const [showSettings, setShowSettings] = useState(false);
  const [showActions, setShowActions] = useState(false);
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

  return (
    <div className="border border-gray-200 rounded-xl bg-white dark:bg-gray-900 dark:border-gray-800 overflow-hidden">
      <div className="p-4">
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

        {/* Action bar: Settings + Recent Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowSettings(!showSettings); if (showActions) setShowActions(false); }}
            className={`flex items-center gap-1 text-[11px] font-semibold cursor-pointer bg-transparent border-none p-0 transition-colors ${
              showSettings ? 'text-brand-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9v1a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            Settings
          </button>
          {agentActions.length > 0 && (
            <button
              onClick={() => { setShowActions(!showActions); if (showSettings) setShowSettings(false); }}
              className={`flex items-center gap-1 text-[11px] font-semibold cursor-pointer bg-transparent border-none p-0 transition-colors ${
                showActions ? 'text-brand-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
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
          <div className="text-[10px] text-gray-400 mt-2">
            Last active: {new Date(agent.lastAction).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* Expandable: Settings Panel */}
      {showSettings && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 space-y-3">
          {/* Auto-approve threshold */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
              Auto-approve threshold: {Math.round(localConfig.autoApproveThreshold * 100)}%
            </label>
            <input
              type="range" min="0.5" max="0.99" step="0.01"
              value={localConfig.autoApproveThreshold}
              onChange={e => handleConfigChange('autoApproveThreshold', parseFloat(e.target.value))}
              className="w-full accent-brand-500 h-1.5"
            />
            <div className="flex justify-between text-[9px] text-gray-400">
              <span>More auto-approved</span>
              <span>Manual review</span>
            </div>
          </div>

          {/* Tone override */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Tone Override</label>
            <select
              value={localConfig.toneOverride}
              onChange={e => handleConfigChange('toneOverride', e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs dark:bg-gray-900 dark:border-gray-700 dark:text-white/90"
            >
              {TONE_OPTIONS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Max actions per day */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
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
              onClick={() => handleConfigChange('notifyOnAction', !localConfig.notifyOnAction)}
              className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                localConfig.notifyOnAction ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                localConfig.notifyOnAction ? 'translate-x-[18px]' : 'translate-x-0.5'
              }`} />
            </button>
            <span className="text-[11px] text-gray-600 dark:text-gray-400">Notify me when this agent proposes an action</span>
          </div>

          {/* Custom instructions */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Custom Instructions</label>
            <textarea
              value={localConfig.customInstructions}
              onChange={e => handleConfigChange('customInstructions', e.target.value)}
              placeholder="e.g., Focus on members with dues over $10K. Always recommend a phone call before email for high-value members. Never suggest comp offers for members with outstanding balances."
              rows={2}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-[11px] dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 resize-none"
            />
          </div>

          <button
            onClick={handleSaveConfig}
            className="w-full py-1.5 rounded-lg bg-brand-500 text-white text-[11px] font-semibold cursor-pointer border-none hover:bg-brand-600 transition-colors"
          >
            Save Agent Settings
          </button>
        </div>
      )}

      {/* Expandable: Recent Actions */}
      {showActions && agentActions.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
          <div className="space-y-1.5">
            {agentActions.map(a => (
              <div key={a.id} className="text-xs text-gray-600 dark:text-gray-400 pl-3 border-l-2 border-gray-200 dark:border-gray-700 py-1">
                <div className="line-clamp-2">{a.description}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">
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

export default function AgentsTab() {
  const { agentStatuses, toggleAgent, saveAgentConfig, getAgentConfig } = useApp();
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {agents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            agentStatus={agentStatuses?.[agent.id]}
            agentConfig={getAgentConfig?.(agent.id)}
            onToggle={toggleAgent}
            onSaveConfig={saveAgentConfig}
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
