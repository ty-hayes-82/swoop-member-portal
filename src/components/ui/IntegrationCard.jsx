// IntegrationCard — single integration system card with status + partner list

const STATUS_CONFIG = {
  connected:   { label: 'Connected',   dotCls: 'bg-success-500' },
  available:   { label: 'Available',   dotCls: 'bg-warning-500' },
  coming_soon: { label: 'Coming Q2',   dotCls: 'bg-gray-400' },
};

export default function IntegrationCard({
  name, category, icon, themeColor, status, lastSync, partners, description,
  isSelected, onSelect,
}) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.available;

  return (
    <button
      onClick={onSelect}
      className={`block w-full text-left rounded-xl p-4 cursor-pointer transition-all duration-150 ${
        isSelected
          ? 'bg-brand-50 border-[1.5px] border-brand-500 dark:bg-brand-500/10 dark:border-brand-500'
          : 'bg-white border-[1.5px] border-gray-200 dark:bg-white/[0.03] dark:border-gray-800'
      } ${status === 'coming_soon' ? 'opacity-70' : 'opacity-100'}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{icon}</span>
          <div>
            <div className="text-sm font-bold text-brand-500">{name}</div>
            <div className="text-[10px] text-gray-500 mt-px dark:text-gray-400">{category}</div>
          </div>
        </div>
        <StatusPip cfg={cfg} lastSync={lastSync} />
      </div>

      {/* Description */}
      <p className="text-[11px] text-gray-600 leading-relaxed m-0 mb-2 dark:text-gray-400">
        {description}
      </p>

      {/* Partners */}
      <div className="text-[10px] text-gray-500 dark:text-gray-400">
        Also: {partners.slice(1).join(', ')}
      </div>
    </button>
  );
}

function StatusPip({ cfg, lastSync }) {
  return (
    <div className="flex flex-col items-end gap-0.5 shrink-0">
      <div className="flex items-center gap-1">
        <span className={`w-1.5 h-1.5 rounded-full inline-block ${cfg.dotCls}`} />
        <span className={`text-[10px] font-semibold ${cfg.dotCls === 'bg-success-500' ? 'text-success-500' : cfg.dotCls === 'bg-warning-500' ? 'text-warning-500' : 'text-gray-400'}`}>{cfg.label}</span>
      </div>
      {lastSync && (
        <span className="text-[10px] text-gray-500 dark:text-gray-400">Synced {lastSync}</span>
      )}
    </div>
  );
}
