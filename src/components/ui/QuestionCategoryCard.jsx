// QuestionCategoryCard — GM question framing card for Integrations page

const TIER_LABEL = { 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' };

export default function QuestionCategoryCard({ question, readiness, comboCount, onExplore }) {
  const isFlagship = !!question.flagship;
  const { connected, required } = readiness;
  const pct = required > 0 ? Math.round((connected / required) * 100) : 0;

  if (isFlagship) return (
    <FlagshipCard question={question} connected={connected}
      required={required} comboCount={comboCount} onExplore={onExplore} />
  );

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-3.5 flex flex-col gap-2.5 cursor-pointer transition-shadow duration-150 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03]"
      onClick={onExplore}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{question.icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-brand-500 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded-lg dark:bg-brand-500/15 dark:border-brand-500/30">
            {TIER_LABEL[question.tier]}
          </span>
        </div>
        <ReadinessBar connected={connected} required={required} pct={pct} />
      </div>

      {/* Question label */}
      <div className="text-sm font-bold text-gray-800 leading-tight dark:text-white/90">
        {question.label}
      </div>

      {/* The GM question */}
      <div className="text-xs text-gray-500 leading-relaxed italic dark:text-gray-400">
        "{question.question}"
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto">
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          {comboCount} insight{comboCount !== 1 ? 's' : ''} \u00B7 {question.primaryBuyer}
        </span>
        <span className="text-[11px] text-brand-500 font-semibold">Explore \u2192</span>
      </div>
    </div>
  );
}

function ReadinessBar({ connected, required, pct }) {
  return (
    <div className="flex flex-col items-end gap-[3px] shrink-0">
      <span className={`text-[10px] font-semibold ${pct === 100 ? 'text-brand-500' : 'text-gray-500 dark:text-gray-400'}`}>
        {connected}/{required} connected
      </span>
      <div className="w-[60px] h-1 bg-gray-100 rounded-sm overflow-hidden dark:bg-gray-800">
        <div
          className={`h-full rounded-sm transition-all duration-400 ${pct === 100 ? 'bg-success-500' : 'bg-brand-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FlagshipCard({ question, connected, required, comboCount, onExplore }) {
  return (
    <div
      className="rounded-xl border border-brand-200 bg-gray-800 p-5 cursor-pointer transition-shadow duration-150 relative overflow-hidden hover:ring-2 hover:ring-brand-500/40 dark:bg-gray-900 dark:border-brand-500/30"
      onClick={onExplore}
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-500 to-blue-light-500" />

      <div className="flex items-start gap-4">
        <span className="text-[28px] leading-none shrink-0">{question.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-extrabold text-white">{question.label}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/20 border border-brand-500/40 px-2 py-0.5 rounded-lg">
              Swoop Only
            </span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed m-0 mb-3 italic">
            "{question.question}"
          </p>
          <p className="text-xs text-white/50 leading-relaxed m-0 mb-3.5">
            {question.why}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-white/50">Requires {required} systems connected</span>
              <span className="text-[11px] text-white/50">{comboCount} insights</span>
            </div>
            <span className="text-xs text-brand-400 font-bold">See Example \u2192</span>
          </div>
        </div>
      </div>
    </div>
  );
}
