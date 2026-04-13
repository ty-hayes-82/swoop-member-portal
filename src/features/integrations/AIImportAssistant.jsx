/**
 * AIImportAssistant — contextual AI co-pilot card for the CSV import wizard.
 *
 * Pure display component. No internal state, no API calls.
 * Parent (CsvImportPage) owns all state and passes it as props.
 *
 * Props:
 *   step      — 1 | 2 | 3  (which wizard step we're on)
 *   insight   — string | null  (AI-generated text, null = no content yet)
 *   loading   — boolean  (true while API call is in-flight)
 *   dismissed — boolean  (hide the whole card when true)
 *   onDismiss — () => void
 */
export default function AIImportAssistant({ step, insight, loading, dismissed, onDismiss }) {
  if (dismissed) return null;
  // Show nothing at all when neither loading nor has content
  if (!loading && !insight) return null;

  const isStep3 = step === 3;

  return (
    <div
      className={[
        'rounded-xl border p-4 mt-3',
        isStep3
          ? 'border-l-4 border-l-orange-400 border-orange-200 bg-orange-50/60 dark:bg-orange-500/5 dark:border-orange-500/20'
          : 'border-orange-200 bg-orange-50/60 dark:bg-orange-500/5 dark:border-orange-500/20',
      ].join(' ')}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: '#ea580c' }}
        >
          ✦ Swoop AI
        </span>
        <button
          type="button"
          onClick={onDismiss}
          className="text-[11px] text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer p-0 leading-none dark:hover:text-gray-300"
        >
          Hide AI tips
        </button>
      </div>

      {/* Loading dots */}
      {loading && !insight && (
        <div className="flex items-center gap-1 py-1">
          <span
            className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
          <span className="ml-2 text-xs text-gray-400 italic">Analyzing…</span>
        </div>
      )}

      {/* Insight text */}
      {insight && (
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed m-0">
          {insight}
        </p>
      )}
    </div>
  );
}
