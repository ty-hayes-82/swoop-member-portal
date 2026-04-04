import { SourceBadge } from './index.js';

export default function Panel({
  title, subtitle, tabs, activeTab, onTabChange, actions, children,
  sourceSystems,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className={`px-5 pt-5 sm:px-6 sm:pt-6 ${tabs ? 'pb-0' : 'pb-4 border-b border-gray-100 dark:border-gray-800'}`}>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-800 leading-tight dark:text-white/90">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1 italic dark:text-gray-400">
                {subtitle}
              </p>
            )}
            {sourceSystems && sourceSystems.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-2 items-center">
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Source:</span>
                {sourceSystems.map(s => <SourceBadge key={s} system={s} size="xs" />)}
              </div>
            )}
          </div>
          {actions && <div className="shrink-0 ml-3">{actions}</div>}
        </div>

        {/* Tabs */}
        {tabs && (
          <div className="flex flex-nowrap mt-4 max-w-full overflow-x-auto [scrollbar-width:thin]" style={{ WebkitOverflowScrolling: 'touch' }}>
            {tabs.map(tab => {
              const active = tab.key === activeTab;
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange?.(tab.key)}
                  className={`px-4 py-2 text-sm whitespace-nowrap flex items-center gap-2 transition-colors duration-150 shrink-0 border-b-2 ${
                    active
                      ? 'font-semibold text-gray-800 border-brand-500 dark:text-white/90'
                      : 'font-normal text-gray-500 border-transparent dark:text-gray-400'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[11px] font-semibold rounded-full px-2 py-0.5 border ${
                        active
                          ? 'text-brand-500 border-brand-500 bg-brand-50 dark:bg-brand-500/15'
                          : 'text-gray-500 border-gray-200 bg-gray-50 dark:text-gray-400 dark:border-gray-700 dark:bg-white/5'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6">
        {children}
      </div>
    </div>
  );
}
