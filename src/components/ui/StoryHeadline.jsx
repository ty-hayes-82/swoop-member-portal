// StoryHeadline.jsx — Story-first headline for every view.

const VARIANT_CONFIG = {
  urgent: {
    borderClass: 'border-l-error-500',
    bgClass: 'bg-error-50',
    icon: '\u26A0',
  },
  warning: {
    borderClass: 'border-l-warning-500',
    bgClass: 'bg-warning-50',
    icon: '\u25C6',
  },
  insight: {
    borderClass: 'border-l-brand-500',
    bgClass: 'bg-brand-50',
    icon: '\u25C8',
  },
  opportunity: {
    borderClass: 'border-l-brand-500',
    bgClass: 'bg-brand-50',
    icon: '\u25CE',
  },
};

/**
 * StoryHeadline — renders as the first thing above the fold on every view.
 * @param {string} headline   — The single most important operational insight (plain English)
 * @param {string} [context]  — Optional supporting sentence with dollar/data grounding
 * @param {'urgent'|'warning'|'insight'|'opportunity'} [variant='insight']
 */
export default function StoryHeadline({ headline, context, variant = 'insight' }) {
  const s = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.insight;

  return (
    <div className={`border-l-4 ${s.borderClass} ${s.bgClass} rounded-r-xl px-5 py-4 sm:px-6 mb-3 shadow-theme-xs`}>
      <div className="flex items-start gap-4">
        <span className="text-xl leading-none mt-0.5 shrink-0 opacity-85">
          {s.icon}
        </span>
        <div>
          <p className="font-serif text-lg text-swoop-text font-normal leading-snug m-0">
            {headline}
          </p>
          {context && (
            <p className="text-sm text-swoop-text-muted mt-2 leading-relaxed m-0">
              {context}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
