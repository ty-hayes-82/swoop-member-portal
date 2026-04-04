const VARIANT_CONFIG = {
  insight:     { borderCls: 'border-l-brand-500', bgCls: 'bg-brand-50 dark:bg-brand-500/5', icon: '\uD83D\uDCA1' },
  warning:     { borderCls: 'border-l-warning-500', bgCls: 'bg-warning-50 dark:bg-warning-500/5', icon: '\u26A0\uFE0F' },
  urgent:      { borderCls: 'border-l-error-500', bgCls: 'bg-error-50 dark:bg-error-500/5', icon: '\u26A0' },
  opportunity: { borderCls: 'border-l-brand-500', bgCls: 'bg-brand-50 dark:bg-brand-500/5', icon: '\u25CE' },
};

export default function SoWhatCallout({ children, variant = 'insight' }) {
  const s = VARIANT_CONFIG[variant] || VARIANT_CONFIG.insight;

  return (
    <div className={`border-l-4 ${s.borderCls} ${s.bgCls} rounded-r-lg px-5 py-3.5 flex gap-2.5 items-start shadow-theme-xs`}>
      <span className="text-base shrink-0 mt-px">{s.icon}</span>
      <p className="text-sm text-gray-600 leading-relaxed italic m-0 dark:text-gray-400">
        {children}
      </p>
    </div>
  );
}
