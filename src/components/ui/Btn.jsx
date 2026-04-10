// Btn — Button primitive with clear visual hierarchy
// variant: 'primary' | 'secondary' | 'tertiary' | 'ghost'

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

const VARIANT_CLASSES = {
  primary: 'bg-brand-500 text-white border border-brand-500 shadow-theme-xs hover:bg-brand-600',
  secondary: 'bg-brand-50 text-brand-500 border border-brand-200 hover:bg-brand-100 dark:bg-brand-500/10 dark:border-brand-500/30',
  ghost: 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 dark:bg-white/[0.03] dark:text-gray-400 dark:border-gray-700 dark:hover:bg-white/5',
  tertiary: 'bg-transparent text-gray-600 border-none font-medium text-sm dark:text-gray-400',
};

const DISABLED_CLASSES = 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700';

export default function Btn({
  variant = 'ghost',
  size = 'md',
  accent,
  disabled = false,
  onClick,
  children,
  style = {},
  type = 'button',
}) {
  const sizeCls = variant === 'tertiary' ? '' : (SIZE_CLASSES[size] || SIZE_CLASSES.md);
  const variantCls = disabled ? DISABLED_CLASSES : (VARIANT_CLASSES[variant] || VARIANT_CLASSES.ghost);

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      className={`inline-flex items-center gap-1.5 font-semibold rounded-xl cursor-pointer transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 whitespace-nowrap ${sizeCls} ${variantCls}`}
      style={style}
    >
      {children}
    </button>
  );
}
