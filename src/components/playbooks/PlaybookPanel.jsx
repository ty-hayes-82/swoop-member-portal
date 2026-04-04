// PlaybookPanel — renamed "Response Plan"
import { useFixItActions } from '@/hooks/useFixItActions';
import { useAppContext } from '@/context/AppContext';
import { trackAction } from '@/services/activityService';
import { useState } from 'react';
import PlaybookStep from './PlaybookStep';
import BeforeAfter from './BeforeAfter';
import ActionPreview from './ActionPreview';
import PlaybookHistory from './PlaybookHistory';

export default function PlaybookPanel({ id, title, scenario, steps = [], beforeMetrics = [], afterMetrics = [], accentColor, memberContext }) {
  const { isActive, activatePlaybook, deactivatePlaybook, getImpact } = useFixItActions();
  const { trailProgress, trailSteps } = useAppContext();
  const [stepsExpanded, setStepsExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const active  = isActive(id);
  const impact  = getImpact(id);
  const accent  = accentColor ?? '#ff8b00';
  const trail   = trailSteps[id] ?? [];
  const done    = trailProgress[id] ?? 0;
  const fmt     = (n) => n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

  const handleActivate = () => {
    if (!confirming) { setConfirming(true); return; }
    activatePlaybook(id);
    trackAction({ actionType: 'playbook', actionSubtype: 'activate', description: title, referenceId: id, referenceType: 'playbook' });
    setConfirming(false);
  };

  return (
    <div className={`rounded-2xl border bg-white overflow-hidden dark:bg-white/[0.03] ${active ? 'border-brand-200 shadow-theme-md dark:border-brand-500/30' : 'border-gray-200 shadow-theme-xs dark:border-gray-800'}`}>
      {/* Header */}
      <div className={`p-5 sm:p-6 border-b border-gray-200 flex justify-between items-start dark:border-gray-800 ${active ? 'bg-brand-50 dark:bg-brand-500/5' : 'bg-gray-50 dark:bg-gray-800'}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            {active && <span className="w-2 h-2 rounded-full bg-success-500 shrink-0 shadow-[0_0_6px_#12b76a]" />}
            <span className="text-[11px] font-bold text-brand-500 tracking-wider uppercase">Response Plan</span>
          </div>
          <div className="text-lg font-bold text-gray-800 font-serif mb-1.5 dark:text-white/90">{title}</div>
          <p className="text-sm text-gray-600 m-0 max-w-[520px] leading-relaxed dark:text-gray-400">{scenario}</p>
          {memberContext && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] text-gray-500 dark:text-gray-400">Triggered for:</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded border" style={{ color: memberContext.color, background: `${memberContext.color}14`, borderColor: `${memberContext.color}25` }}>
                {memberContext.name}
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">{memberContext.profile}</span>
            </div>
          )}
        </div>
        <div className="text-right shrink-0 ml-6">
          <div className="text-xs text-gray-500 dark:text-gray-400">Monthly impact</div>
          <div className={`text-xl font-mono font-bold ${active ? 'text-success-500' : 'text-brand-500'}`}>{fmt(impact.monthly)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{fmt(impact.annual)}/yr</div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 sm:p-6">
        {/* Logic chain */}
        {impact.logicChain && (
          <div className="mb-4 px-3 py-2 bg-brand-50 border-l-[3px] border-l-brand-500 rounded-r-lg dark:bg-brand-500/5">
            <div className="text-[10px] font-bold text-brand-500 tracking-wide uppercase mb-[3px]">How we get to that number</div>
            <div className="text-xs text-gray-600 font-mono dark:text-gray-400">{impact.logicChain}</div>
          </div>
        )}

        {!active && <ActionPreview steps={steps} accent={accent} />}
        {!active && <PlaybookHistory playbookId={id} accent={accent} />}

        {active && trail.length > 0 && (
          <div className="mb-4 flex flex-col gap-1.5">
            <div className="text-[11px] font-bold text-success-500 tracking-wider uppercase mb-1">Actions taken</div>
            {trail.map((step, i) => (
              <div key={i} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-all duration-400 ${
                i < done ? 'bg-success-50 border-success-200 dark:bg-success-500/5 dark:border-success-500/20' : 'bg-gray-100 border-gray-200 opacity-45 dark:bg-gray-800 dark:border-gray-700'
              }`}>
                <span className="text-sm shrink-0">{i < done ? '\u2713' : '\u25CC'}</span>
                <span className={`text-xs ${i < done ? 'text-gray-800 dark:text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>{step}</span>
              </div>
            ))}
          </div>
        )}

        {/* Steps toggle */}
        <button onClick={() => setStepsExpanded(e => !e)} className={`bg-transparent border-none cursor-pointer p-0 text-brand-500 text-sm flex items-center gap-1.5 ${stepsExpanded ? 'mb-4' : 'mb-0'}`}>
          {stepsExpanded ? '\u25BE' : '\u25B8'} {steps.length}-step plan details
        </button>
        {stepsExpanded && (
          <div className="mb-4">
            {steps.map((step, i) => <PlaybookStep key={i} stepNumber={i + 1} {...step} isCompleted={active} />)}
          </div>
        )}

        <BeforeAfter beforeMetrics={beforeMetrics} afterMetrics={afterMetrics} isActive={active} />

        {confirming && !active && (
          <div className="mt-4 p-4 bg-brand-50 border border-brand-200 rounded-xl dark:bg-brand-500/5 dark:border-brand-500/30">
            <div className="text-sm font-bold text-gray-800 mb-3 dark:text-white/90">Confirm activation</div>
            <div className="text-sm text-gray-600 leading-relaxed mb-4 dark:text-gray-400">
              Activating <strong>{title}</strong> will trigger the {steps.length} steps shown above. Each step is previewed \u2014 nothing will happen that isn't listed. You can deactivate at any time.
            </div>
            <div className="flex gap-3 items-center">
              <button onClick={handleActivate} className="px-5 py-3 rounded-xl border-none bg-brand-500 text-white text-sm font-bold cursor-pointer shadow-theme-sm">
                Yes, activate this plan
              </button>
              <button onClick={() => setConfirming(false)} className="px-4 py-3 rounded-xl border-none bg-transparent text-gray-500 text-sm cursor-pointer font-medium dark:text-gray-400">
                Not yet
              </button>
            </div>
          </div>
        )}

        {!confirming && (
          <button
            onClick={() => {
              if (active) {
                deactivatePlaybook(id);
                trackAction({ actionType: 'playbook', actionSubtype: 'deactivate', description: title, referenceId: id, referenceType: 'playbook' });
              } else {
                handleActivate();
              }
            }}
            className={`w-full mt-4 px-4 py-3 rounded-xl text-base font-semibold cursor-pointer transition-all duration-200 ${
              active
                ? 'border border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
                : 'border border-brand-500 bg-brand-500 text-white'
            }`}
          >
            {active ? '\u2713 Active \u2014 Deactivate' : 'Activate this response plan'}
          </button>
        )}
      </div>
    </div>
  );
}
