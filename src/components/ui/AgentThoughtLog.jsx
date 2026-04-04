import { useState } from 'react';

export function AgentThoughtLog({ thoughts = [] }) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? thoughts : thoughts.slice(0, 3);

  return (
    <div className="bg-gray-100 border border-blue-light-200 rounded-xl p-3 dark:bg-gray-800 dark:border-blue-light-500/25">
      <div className="flex flex-col gap-1.5">
        {rows.map((entry, index) => (
          <div key={`${entry.timestamp}-${index}`} className="grid gap-2.5" style={{ gridTemplateColumns: '64px 1fr' }}>
            <span className="font-mono text-[11px] text-blue-light-500">{entry.timestamp ?? entry.time}</span>
            <span className="text-xs text-gray-600 leading-relaxed dark:text-gray-400">{entry.text}</span>
          </div>
        ))}
      </div>

      {thoughts.length > 3 && (
        <button
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 border-none bg-transparent text-blue-light-500 cursor-pointer text-[11px] font-semibold p-0"
        >
          {expanded ? 'Hide reasoning chain' : `Show full reasoning chain (${thoughts.length})`}
        </button>
      )}
    </div>
  );
}
