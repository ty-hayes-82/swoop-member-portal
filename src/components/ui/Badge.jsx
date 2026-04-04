const VARIANT_CLASSES = {
  urgent:   'bg-error-50 text-error-600 border-error-200 dark:bg-error-500/15 dark:text-error-500 dark:border-error-500/30',
  warning:  'bg-warning-50 text-warning-600 border-warning-200 dark:bg-warning-500/15 dark:text-warning-500 dark:border-warning-500/30',
  success:  'bg-success-50 text-success-600 border-success-200 dark:bg-success-500/15 dark:text-success-500 dark:border-success-500/30',
  neutral:  'bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-gray-700',
  effort:   'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  timeline: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
};

export default function Badge({ text, variant = 'neutral', size = 'sm' }) {
  const variantCls = VARIANT_CLASSES[variant] || VARIANT_CLASSES.neutral;
  const sizeCls = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-full font-semibold tracking-wide whitespace-nowrap border ${sizeCls} ${variantCls}`}>
      {text}
    </span>
  );
}
