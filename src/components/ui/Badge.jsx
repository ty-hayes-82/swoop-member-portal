const VARIANT_CLASSES = {
  urgent:   'bg-error-50 text-error-600 border-error-200',
  warning:  'bg-warning-50 text-warning-600 border-warning-200',
  success:  'bg-success-50 text-success-600 border-success-200',
  neutral:  'bg-swoop-row text-swoop-text-muted border-swoop-border',
  effort:   'bg-swoop-row text-swoop-text-muted border-swoop-border',
  timeline: 'bg-swoop-row text-swoop-text-muted border-swoop-border',
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
