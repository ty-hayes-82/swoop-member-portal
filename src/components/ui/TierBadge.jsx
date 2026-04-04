// TierBadge — Priority / Standard / Roadmap label chip for vendor catalog

const TIER = {
  1: { label: 'Priority', colorCls: 'text-blue-light-500 bg-blue-light-50 border-blue-light-200 dark:bg-blue-light-500/15 dark:border-blue-light-500/30', dotCls: 'bg-blue-light-500', tip: 'Swoop recommends connecting these first \u2014 widest data footprint, unlocks the most insights.' },
  2: { label: 'Standard', colorCls: 'text-brand-500 bg-brand-50 border-brand-200 dark:bg-brand-500/15 dark:border-brand-500/30', dotCls: 'bg-brand-500', tip: 'Important for segment coverage. Connect after Priority integrations are stable.' },
  3: { label: 'Roadmap',  colorCls: 'text-gray-500 bg-gray-100 border-gray-200 dark:bg-white/5 dark:border-gray-700 dark:text-gray-400', dotCls: 'bg-gray-500 dark:bg-gray-400', tip: 'Valuable for specific use cases. Queued for a future sprint.' },
};

export default function TierBadge({ tier = 1, size = 'sm' }) {
  const cfg   = TIER[tier] ?? TIER[1];
  const isMd  = size === 'md';

  return (
    <span title={cfg.tip} className={`inline-flex items-center gap-1 font-bold tracking-wide uppercase whitespace-nowrap rounded-lg border ${cfg.colorCls} ${isMd ? 'text-xs px-2 py-0.5' : 'text-[10px] px-1.5 py-0.5'}`}>
      <span className={`rounded-full shrink-0 ${cfg.dotCls} ${isMd ? 'w-[7px] h-[7px]' : 'w-[5px] h-[5px]'}`} />
      {cfg.label}
    </span>
  );
}
