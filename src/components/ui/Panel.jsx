import { SourceBadge } from './index.js';

export default function Panel({
  title, subtitle, tabs, activeTab, onTabChange, actions, children,
  sourceSystems,
}) {
  return (
    <div className="rounded-xl border border-swoop-border bg-swoop-panel overflow-hidden">
      {/* Header */}
      <div className={`px-5 pt-5 sm:px-6 sm:pt-6 ${tabs ? 'pb-0' : 'pb-4 border-b border-swoop-border-inset'}`}>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-swoop-text leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-swoop-text-muted mt-1 italic">
                {subtitle}
              </p>
            )}
            {sourceSystems && sourceSystems.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-2 items-center">
                <span className="text-[10px] text-swoop-text-muted">Source:</span>
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
                      ? 'font-semibold text-swoop-text border-brand-500'
                      : 'font-normal text-swoop-text-muted border-transparent'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[11px] font-semibold rounded-full px-2 py-0.5 border ${
                        active
                          ? 'text-brand-500 border-brand-500 bg-brand-50'
                          : 'text-swoop-text-muted border-swoop-border bg-swoop-row'
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
