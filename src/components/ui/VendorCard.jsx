// VendorCard — individual vendor card with tier badge, status, and combo count
import TierBadge from './TierBadge';

const STATUS_DOT = {
  connected:   { dotCls: 'bg-success-500', textCls: 'text-success-500', label: 'Connected' },
  available:   { dotCls: 'bg-warning-500', textCls: 'text-warning-500', label: 'Available' },
  coming_soon: { dotCls: 'bg-gray-400', textCls: 'text-gray-400', label: 'Coming Soon' },
};

export default function VendorCard({
  name, categoryLabel, icon, themeColor, tier, status,
  lastSync, description, comboCount = 0, isSelected, onSelect,
}) {
  const cfg = STATUS_DOT[status] ?? STATUS_DOT.available;

  return (
    <button
      onClick={onSelect}
      className={`flex flex-col gap-3 w-full text-left rounded-xl p-4 cursor-pointer transition-all duration-150 ${
        isSelected
          ? 'bg-white border border-brand-500 border-l-[3px] border-l-brand-500 shadow-theme-md dark:bg-white/[0.03]'
          : 'bg-white border border-gray-200 border-l-[3px] border-l-transparent shadow-theme-xs dark:bg-white/[0.03] dark:border-gray-800'
      }`}
    >
      {/* Top row */}
      <div className="flex items-center gap-2">
        <span className="text-lg leading-none w-8 h-8 flex items-center justify-center rounded-lg bg-brand-50 shrink-0 dark:bg-brand-500/10">
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-800 leading-tight whitespace-nowrap overflow-hidden text-ellipsis dark:text-white/90">{name}</div>
          <div className="text-[11px] text-brand-500 font-semibold uppercase tracking-wide">{categoryLabel}</div>
        </div>
        <TierBadge tier={tier} size="sm" />
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 leading-relaxed m-0 line-clamp-2 dark:text-gray-400">{description}</p>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${cfg.dotCls}`} />
          <span className="text-[11px] text-gray-500 font-medium dark:text-gray-400">
            {cfg.label}{status === 'connected' && lastSync ? ` \u00B7 ${lastSync}` : ''}
          </span>
        </div>
        {comboCount > 0 && (
          <span className="text-[11px] text-brand-500 font-semibold flex items-center gap-[3px]">
            {comboCount} combo insight{comboCount > 1 ? 's' : ''} \u2192
          </span>
        )}
      </div>
    </button>
  );
}
