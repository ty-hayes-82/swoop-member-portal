// features/integrations/SelectionPrompt.jsx
import { integrationsById } from '@/data/integrations';

export function SelectionPrompt({ selected }) {
  if (selected.length === 2) return null;

  if (selected.length === 1) {
    const item = integrationsById[selected[0]];
    return (
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-5 mb-6 text-sm text-gray-500 flex items-center gap-2.5 animate-pulse">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item?.color || '#22c55e' }} />
        <span>
          <strong className="text-gray-800 dark:text-white/90">{item?.name}</strong> selected — now pick a second system to see the insights they unlock together.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-5 mb-6 text-sm text-gray-500 flex items-center gap-2.5 animate-pulse">
      <div className="w-2 h-2 rounded-full bg-success-500 shrink-0" />
      <span>Select any two integrations below to see the insights and automations they unlock together.</span>
    </div>
  );
}
