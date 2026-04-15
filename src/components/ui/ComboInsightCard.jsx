// ComboInsightCard — cross-system insight card with KPI or sparkline preview
import Sparkline from './Sparkline';

export default function ComboInsightCard({
  systems, label, insight, automations, preview, swoop_only,
  isExpanded, onToggle, allSystems, sparklineData,
}) {
  return (
    <div className="rounded-xl border border-swoop-border bg-swoop-panel overflow-hidden transition-shadow duration-150">
      {/* Header */}
      <button onClick={onToggle} className="flex w-full items-center justify-between p-4 bg-transparent border-none cursor-pointer text-left focus-visible:ring-2 focus-visible:ring-brand-500">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <SystemBadges systems={systems} allSystems={allSystems} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-swoop-text leading-tight">{label}</div>
            <div className="flex items-center gap-2 mt-[3px]">
              {swoop_only && (
                <span title="This insight is only possible when systems are connected through Swoop." className="text-[9px] font-bold uppercase tracking-wider text-brand-500 bg-brand-50 px-1.5 py-px rounded cursor-help inline-block">
                  Swoop Only \u24D8
                </span>
              )}
              {!isExpanded && preview?.value && (
                <span className="text-[11px] text-swoop-text-muted">
                  <span className="font-bold text-swoop-text font-mono">{preview.value}</span>
                  {' \u00B7 '}{preview.label}
                </span>
              )}
            </div>
          </div>
        </div>
        <span className="text-swoop-text-muted text-xs ml-2 shrink-0">{isExpanded ? '\u25B2' : '\u25BC'}</span>
      </button>

      {/* Expanded body */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-swoop-border-inset">
          <p className="text-xs text-swoop-text-muted leading-relaxed my-3">{insight}</p>

          {/* Automations */}
          <div className="mb-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-swoop-text-muted mb-1.5">Automations</div>
            <ul className="m-0 p-0 list-none flex flex-col gap-1">
              {automations.map((a, i) => (
                <li key={i} className="text-xs text-swoop-text flex items-start gap-1.5">
                  <span className="text-success-500 shrink-0 mt-px">\u2192</span> {a}
                </li>
              ))}
            </ul>
          </div>

          <PreviewWidget preview={preview} sparklineData={sparklineData} />
        </div>
      )}
    </div>
  );
}

function SystemBadges({ systems, allSystems }) {
  return (
    <div className="flex gap-1 shrink-0">
      {systems.map(id => {
        const sys = allSystems.find(s => s.id === id);
        if (!sys) return null;
        return (
          <span key={id} className="text-[10px] font-semibold text-brand-500 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded">
            {sys.name}
          </span>
        );
      })}
    </div>
  );
}

function PreviewWidget({ preview, sparklineData }) {
  return (
    <div className="bg-swoop-row rounded-lg px-3 py-2.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-swoop-text-muted mb-1.5">{preview.label}</div>
      {preview.type === 'sparkline' && sparklineData?.length > 0 ? (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Sparkline data={sparklineData} height={36} color={preview.trend === 'down' ? '#f79009' : '#12b76a'} />
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-swoop-text font-mono">{preview.value}</div>
            <div className="text-[10px] text-swoop-text-muted">{preview.subtext}</div>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-[22px] font-bold text-swoop-text font-mono">{preview.value}</div>
          <div className="text-[10px] text-swoop-text-muted mt-0.5">{preview.subtext}</div>
        </div>
      )}
    </div>
  );
}
