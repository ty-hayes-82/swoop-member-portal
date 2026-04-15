// TierBadge — Priority / Standard / Roadmap label chip for vendor catalog

const TIER = {
  1: { label: 'Priority', colorCls: 'text-blue-light-500 bg-blue-light-50 border-blue-light-200', dotCls: 'bg-blue-light-500', tip: 'Swoop recommends connecting these first \u2014 widest data footprint, unlocks the most insights.' },
  2: { label: 'Standard', colorCls: 'text-brand-500 bg-brand-50 border-brand-200', dotCls: 'bg-brand-500', tip: 'Important for segment coverage. Connect after Priority integrations are stable.' },
  3: { label: 'Roadmap',  colorCls: 'text-swoop-text-muted bg-swoop-row border-swoop-border', dotCls: 'bg-gray-500', tip: 'Valuable for specific use cases. Queued for a future sprint.' },
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
