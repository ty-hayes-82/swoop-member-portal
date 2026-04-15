import { useState } from 'react';

export default function CollapsibleSection({
  title,
  children,
  defaultExpanded = false,
  icon = '\uD83D\uDCD8'
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-xl border border-swoop-border bg-swoop-panel overflow-hidden mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3.5 bg-swoop-row border-none flex items-center justify-between cursor-pointer transition-colors duration-150 hover:bg-gray-200 focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{icon}</span>
          <span className="text-base font-semibold text-swoop-text">
            {title}
          </span>
        </div>
        <span
          className="text-xl text-swoop-text-muted inline-block transition-transform duration-200"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          \u25BC
        </span>
      </button>

      {isExpanded && (
        <div className="p-5 sm:p-6">
          {children}
        </div>
      )}
    </div>
  );
}
