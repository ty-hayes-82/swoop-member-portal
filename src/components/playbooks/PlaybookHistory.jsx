// PlaybookHistory.jsx — shows simulated past run history for each playbook
import { PLAYBOOK_HISTORY } from '@/config/actionTypes';

export default function PlaybookHistory({ playbookId, accent }) {
  const history = PLAYBOOK_HISTORY[playbookId];
  if (!history?.length) return null;

  return (
    <div className="mb-4 p-4 bg-success-50 border border-success-200 rounded-xl dark:bg-success-500/5 dark:border-success-500/20">
      <div className="text-[11px] font-semibold text-success-500 tracking-wider uppercase mb-3 flex items-center gap-1.5">
        <span>\u2713</span> Track Record
      </div>

      <div className="flex flex-col gap-1.5">
        {history.map((record, i) => (
          <div key={i} className="flex items-center px-2.5 py-2 bg-gray-50 rounded-lg gap-4 dark:bg-gray-800">
            {/* Quarter */}
            <span className="text-[11px] font-bold text-gray-500 font-mono min-w-[48px] dark:text-gray-400">{record.quarter}</span>

            {/* Runs count */}
            <span className="text-[11px] text-gray-500 px-1.5 py-0.5 bg-brand-50 rounded shrink-0 dark:bg-brand-500/10 dark:text-gray-400">{record.runs}\u00D7 run</span>

            {/* Outcome */}
            <span className="text-xs text-gray-600 flex-1 min-w-0 dark:text-gray-400">{record.outcome}</span>

            {/* Impact */}
            <span className="text-xs font-bold text-success-500 font-mono shrink-0">{record.impact}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
