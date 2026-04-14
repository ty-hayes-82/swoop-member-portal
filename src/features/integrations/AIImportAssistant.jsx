/**
 * AIImportAssistant — contextual AI co-pilot card for the CSV import wizard.
 *
 * Pure display component. No internal state, no API calls.
 * Parent (CsvImportPage) owns all state and passes it as props.
 *
 * Props:
 *   step            — 1 | 2 | 3
 *   insight         — string | null  (step 1 description, step 3 narrative; null on step 2)
 *   loading         — boolean
 *   dismissed       — boolean
 *   onDismiss       — () => void
 *   suggestions     — array of { id, type, csvCol, targetField, label, reason }
 *                     type: 'remap' | 'skip' | 'warning'
 *                     remap  → Apply button → parent remaps the column
 *                     skip   → Skip button → parent clears the mapping
 *                     warning → no button, amber caution icon
 *   validation      — { ready, warnings, errors } | null   (step 2 only)
 *   onApplySuggestion — (suggestion) => void
 */
export default function AIImportAssistant({
  step,
  insight,
  loading,
  dismissed,
  onDismiss,
  suggestions = [],
  validation = null,
  onApplySuggestion,
}) {
  if (dismissed) return null;
  if (!loading && !insight && suggestions.length === 0 && !validation) return null;

  const isStep3 = step === 3;
  const isStep2 = step === 2;

  return (
    <div
      className={[
        'rounded-xl border p-4 mt-3',
        isStep3
          ? 'border-l-4 border-l-orange-400 border-orange-200 bg-orange-50/60 dark:bg-orange-500/5 dark:border-orange-500/20'
          : 'border-orange-200 bg-orange-50/60 dark:bg-orange-500/5 dark:border-orange-500/20',
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#ea580c' }}>
          ✦ Swoop AI{isStep2 ? ' · Mapping Review' : ''}
        </span>
        <button
          type="button"
          onClick={onDismiss}
          className="text-[11px] text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer p-0 leading-none dark:hover:text-gray-300"
        >
          Hide
        </button>
      </div>

      {/* Loading dots */}
      {loading && !insight && suggestions.length === 0 && (
        <div className="flex items-center gap-1 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          <span className="ml-2 text-xs text-gray-400 italic">Reviewing mapping…</span>
        </div>
      )}

      {/* Step 1 / Step 3: narrative insight */}
      {!isStep2 && insight && (
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed m-0">
          {insight}
        </p>
      )}

      {/* Step 2: chips only — no prose */}
      {isStep2 && suggestions.length === 0 && !loading && validation && (
        <p className="text-xs text-gray-500 italic m-0">Mapping looks clean.</p>
      )}

      {/* Suggestion chips */}
      {suggestions.length > 0 && (
        <div className={`flex flex-col gap-2 ${(!isStep2 && insight) ? 'mt-3' : ''}`}>
          {suggestions.map((s) => {
            const isRemap = s.type === 'remap';
            const isSkip = s.type === 'skip';
            const isWarning = s.type === 'warning';

            return (
              <div
                key={s.id}
                className={`flex items-start gap-3 p-2.5 rounded-lg border ${
                  isWarning
                    ? 'bg-amber-50/80 border-amber-200 dark:bg-amber-500/5 dark:border-amber-500/20'
                    : 'bg-white/60 dark:bg-white/5 border-orange-100 dark:border-orange-500/20'
                }`}
              >
                {/* Icon */}
                <span className="text-sm shrink-0 mt-0.5">
                  {isWarning ? '⚠️' : isSkip ? '⊘' : '→'}
                </span>

                {/* Label + reason */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-snug">
                    {s.label}
                  </div>
                  {s.reason && (
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                      {s.reason}
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="shrink-0 mt-0.5">
                  {isRemap && onApplySuggestion ? (
                    <button
                      type="button"
                      onClick={() => onApplySuggestion(s)}
                      className="px-3 py-1 rounded-md text-[11px] font-bold text-white border-none cursor-pointer transition-colors"
                      style={{ background: '#ea580c' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#c2410c'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#ea580c'; }}
                    >
                      Apply
                    </button>
                  ) : isSkip && onApplySuggestion ? (
                    <button
                      type="button"
                      onClick={() => onApplySuggestion(s)}
                      className="px-3 py-1 rounded-md text-[11px] font-bold border cursor-pointer transition-colors border-gray-300 text-gray-600 bg-transparent hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
                    >
                      Skip
                    </button>
                  ) : isWarning ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                      Review
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Validation row */}
      {validation && (
        <div className="mt-3 flex items-center gap-4 text-[11px] font-semibold border-t border-orange-100 dark:border-orange-500/20 pt-2.5">
          <span className="text-emerald-600 dark:text-emerald-400">
            ✓ {validation.ready} ready
          </span>
          {validation.warnings > 0 && (
            <span className="text-amber-600 dark:text-amber-400">
              ⚠ {validation.warnings} warning{validation.warnings !== 1 ? 's' : ''}
            </span>
          )}
          {validation.errors > 0 && (
            <span className="text-red-600 dark:text-red-400">
              ✕ {validation.errors} error{validation.errors !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
