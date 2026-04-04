import { useState } from 'react';
import { DEMO_TIMESTAMP } from '@/config/constants.js';

export default function OnlySwoopModule({ question, insights = [], action, context = [], timestamp }) {
  const [showSignals, setShowSignals] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!question) return null;

  const insightCount = insights.length;
  const previewInsights = insights.slice(0, 2);
  const remainingInsights = insights.slice(2);
  const resolvedTimestamp = timestamp ?? DEMO_TIMESTAMP;
  const collapsedSummary = action
    ? `${action.owner}${action.dueBy ? ` \u00B7 Due ${action.dueBy}` : ''}`
    : insightCount > 0
      ? `${insightCount} supporting signal${insightCount === 1 ? '' : 's'}`
      : '';

  return (
    <section
      className="border-[1.5px] border-gray-200 rounded-2xl p-5 sm:p-6 bg-white shadow-theme-xs flex flex-col gap-4 mb-8 dark:border-gray-800 dark:bg-white/[0.03]"
      data-animate
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[220px]">
          <p className="m-0 text-xs tracking-widest uppercase text-gray-500 font-bold dark:text-gray-400">
            Only Swoop can answer
          </p>
          <h2 className="text-lg font-serif text-gray-800 mt-1 leading-tight dark:text-white/90">
            {question}
          </h2>
          {!expanded && collapsedSummary && (
            <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-1.5 dark:text-gray-400">
              <span>{collapsedSummary}</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className={`border border-gray-200 text-sm font-semibold px-4 py-1.5 rounded-xl inline-flex items-center gap-1.5 cursor-pointer text-gray-800 dark:text-white/90 dark:border-gray-700 ${
            expanded ? 'bg-gray-100 dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
          }`}
        >
          <span>{expanded ? 'Hide details' : 'View details'}</span>
          <span>{expanded ? '\u25B4' : '\u25BE'}</span>
        </button>
      </div>

      {expanded && (
        <>
          <div className="flex flex-wrap items-stretch gap-4 mt-4">
            {context.length > 0 && (
              <div className="flex-1 min-w-[240px]">
                <div className="mt-1 flex flex-wrap gap-3">
                  {context.map(({ label, value, icon }) => (
                    <div
                      key={`${label}-${value}`}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 border border-gray-200 min-w-[150px] flex flex-col gap-0.5 dark:bg-gray-800 dark:border-gray-700"
                    >
                      <span className="text-xs text-gray-500 uppercase font-semibold tracking-widest dark:text-gray-400">
                        {icon ? `${icon} ${label}` : label}
                      </span>
                      <span className="text-base font-semibold text-gray-800 dark:text-white/90">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {action && (
              <div className="basis-80 shrink-0 rounded-2xl bg-gray-100 border border-gray-200 p-4 flex flex-col gap-1.5 dark:bg-gray-800 dark:border-gray-700">
                <p className="m-0 text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Immediate action
                </p>
                <p className="m-0 text-base leading-snug text-gray-800 dark:text-white/90">{action.text}</p>
                <div className="flex flex-wrap gap-1.5 text-sm text-gray-600 font-semibold dark:text-gray-400">
                  <span className="text-gray-800 dark:text-white/90">{action.owner}</span>
                  {action.dueBy && (
                    <span className="text-gray-500 dark:text-gray-400">\u00B7 Due {action.dueBy}</span>
                  )}
                </div>
                {resolvedTimestamp && (
                  <p className="mt-1.5 mb-0 text-xs text-gray-500 tracking-wide uppercase font-semibold dark:text-gray-400">
                    As of {resolvedTimestamp}
                  </p>
                )}
              </div>
            )}
          </div>

          {insightCount > 0 && (
            <div className="mt-4 flex flex-col gap-1.5">
              {previewInsights.length > 0 && (
                <ul className="m-0 pl-4 flex flex-col gap-1.5 text-gray-800 dark:text-white/90">
                  {previewInsights.map((insight) => (
                    <li key={`preview-${insight}`} className="leading-snug">{insight}</li>
                  ))}
                </ul>
              )}

              {remainingInsights.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowSignals((prev) => !prev)}
                    className={`border border-gray-200 text-sm font-bold px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 cursor-pointer dark:border-gray-700 ${
                      showSignals
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white/90'
                        : 'bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/10 dark:text-blue-light-400'
                    }`}
                  >
                    <span>{showSignals ? 'Hide' : 'View'} additional signals</span>
                    <span className="text-xs opacity-80">({remainingInsights.length})</span>
                  </button>

                  {showSignals && (
                    <ul className="mt-1.5 mb-0 pl-4 flex flex-col gap-1.5 text-gray-800 dark:text-white/90">
                      {remainingInsights.map((insight) => (
                        <li key={`extra-${insight}`} className="leading-snug">{insight}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
