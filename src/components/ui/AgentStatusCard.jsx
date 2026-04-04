function formatLastAction(timestamp) {
  if (!timestamp) return 'No recent action';
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

const STATUS_CLS = {
  active:   { label: 'Active',   cls: 'text-success-500 bg-success-50 dark:bg-success-500/10' },
  idle:     { label: 'Idle',     cls: 'text-gray-500 bg-gray-100 dark:bg-white/5 dark:text-gray-400' },
  learning: { label: 'Learning', cls: 'text-warning-500 bg-warning-50 dark:bg-warning-500/10' },
};

export function AgentStatusCard({ agent, overrideStatus, onToggle, onConfigure, onViewLog }) {
  const status = overrideStatus ?? agent.status;
  const st = STATUS_CLS[status] ?? STATUS_CLS.idle;
  const accuracy = Math.max(0, Math.min(100, agent.accuracy ?? 0));

  return (
    <div
      className="rounded-xl border border-gray-200 border-l-[3px] border-l-blue-light-500 bg-white p-4 flex flex-col gap-2.5 dark:border-gray-800 dark:bg-white/[0.03]"
      style={{ borderLeftColor: agent.accentColor ?? undefined }}
    >
      <div className="flex justify-between items-center gap-2">
        <div className="text-sm font-bold text-gray-800 dark:text-white/90">{agent.name}</div>
        <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${st.cls}`}>{st.label}</span>
      </div>

      <div className="text-xs text-gray-600 leading-relaxed dark:text-gray-400">{agent.description}</div>

      {accuracy > 0 ? (
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[11px] text-gray-500 dark:text-gray-400">Accuracy</span>
            <span className="font-mono text-[11px] text-gray-800 dark:text-white/90">{accuracy}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden dark:bg-gray-800">
            <div className="h-full bg-blue-light-500 transition-all duration-200" style={{ width: `${accuracy}%` }} />
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[11px] text-warning-500">Building baseline</span>
            <span className="font-mono text-[11px] text-gray-500 dark:text-gray-400">Day 12 of 30</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden dark:bg-gray-800">
            <div className="h-full bg-warning-500 opacity-70 transition-all duration-200" style={{ width: '40%' }} />
          </div>
        </div>
      )}

      {agent.recentActivity ? (
        <div className="text-[11px] text-gray-600 dark:text-gray-400">{agent.recentActivity}</div>
      ) : (
        <div className="text-[11px] text-gray-600 dark:text-gray-400">
          {status === 'active' && agent.name?.includes('Pulse') && 'Flagged 3 at-risk members today'}
          {status === 'active' && agent.name?.includes('Demand') && 'Filled 2 canceled tee times via waitlist'}
          {status === 'active' && agent.name?.includes('Labor') && 'Proposed 2 staffing adjustments this week'}
          {status === 'active' && agent.name?.includes('Revenue') && 'Identified $2.1K in spend gaps today'}
          {status !== 'active' && `Last action: ${formatLastAction(agent.lastAction)}`}
        </div>
      )}

      {status === 'active' && (
        <div className="text-[11px] text-gray-500 dark:text-gray-400">
          Last action: <span className="text-gray-600 dark:text-gray-400">{formatLastAction(agent.lastAction)}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onToggle} className={`flex-1 rounded-lg border py-1.5 px-2 text-[11px] font-bold cursor-pointer ${
          status === 'active'
            ? 'border-warning-200 bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:border-warning-500/30 dark:text-warning-400'
            : 'border-success-200 bg-success-50 text-success-600 dark:bg-success-500/10 dark:border-success-500/30 dark:text-success-400'
        }`}>
          {status === 'active' ? 'Set Idle' : 'Set Active'}
        </button>
        {onViewLog && (
          <button onClick={onViewLog} className="rounded-lg border border-blue-light-200 bg-transparent text-blue-light-500 py-1.5 px-2.5 text-[11px] cursor-pointer dark:border-blue-light-500/30">
            Thought Log
          </button>
        )}
        {onConfigure && (
          <button onClick={onConfigure} className="rounded-lg border border-gray-200 bg-transparent text-gray-500 py-1.5 px-2.5 text-[11px] cursor-pointer dark:border-gray-700 dark:text-gray-400">
            Configure
          </button>
        )}
      </div>
    </div>
  );
}
