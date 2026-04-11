// AgentUpsell — subtle upgrade prompt showing what AI agents would do
// Shows in free tier to demonstrate agent value. Dismissible per session.
import { useState } from 'react';

const AGENT_ICONS = {
  'Member Risk Agent': '\uD83C\uDFAF',
  'Staffing-Demand Agent': '\u26A1',
  'Service Recovery Agent': '\uD83D\uDEE0\uFE0F',
  'Re-Engagement Agent': '\uD83E\uDD1D',
  'Board Report Compiler': '\uD83D\uDCCA',
};

export default function AgentUpsell({ agentName, benefit, metric, className = '' }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const icon = AGENT_ICONS[agentName] || '\uD83E\uDD16';

  return (
    <div
      className={`relative rounded-xl border border-purple-500/20 px-4 py-3 flex items-start gap-3 ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.04) 0%, rgba(99,102,241,0.06) 100%)',
      }}
    >
      <span className="text-lg shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-purple-500 mb-0.5">
          {agentName}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          {benefit}
          {metric && (
            <span className="font-mono font-bold text-purple-600 dark:text-purple-400"> {metric}</span>
          )}
        </div>
        <a
          href="#/demo/agents-landing"
          className="inline-block mt-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          Enable AI Agents &rarr;
        </a>
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
        className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 bg-transparent border-none cursor-pointer text-sm leading-none p-0"
        title="Dismiss"
      >
        &times;
      </button>
    </div>
  );
}
