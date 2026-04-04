// VendorDetailPanel — fixed right-side slide-in panel with vendor detail + combos
import TierBadge from './TierBadge';

const STATUS = {
  connected:   { label: 'Connected',   cls: 'text-success-500', dotCls: 'bg-success-500' },
  available:   { label: 'Available',   cls: 'text-warning-500', dotCls: 'bg-warning-500' },
  coming_soon: { label: 'Coming Soon', cls: 'text-gray-400', dotCls: 'bg-gray-400' },
};

export default function VendorDetailPanel({ vendor, combos = [], onClose }) {
  if (!vendor) return (
    <div className="fixed top-0 right-0 bottom-0 w-80 translate-x-full transition-transform duration-250" />
  );

  const sc = STATUS[vendor.status] ?? STATUS.available;

  return (
    <div className="fixed top-0 right-0 bottom-0 w-80 bg-white border-l border-gray-200 shadow-theme-xl z-[200] flex flex-col translate-x-0 transition-transform duration-250 overflow-y-auto dark:bg-white/[0.03] dark:border-gray-800">
      {/* Header */}
      <div className="p-4 pb-3 border-b border-gray-200 bg-brand-50 dark:border-gray-800 dark:bg-brand-500/5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="text-2xl leading-none w-11 h-11 flex items-center justify-center rounded-xl bg-brand-100 shrink-0 dark:bg-brand-500/15">
              {vendor.icon}
            </span>
            <div>
              <div className="text-base font-bold text-gray-800 leading-tight dark:text-white/90">{vendor.name}</div>
              <TierBadge tier={vendor.tier} size="sm" />
            </div>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1 text-gray-500 text-base leading-none shrink-0 dark:text-gray-400">\u2715</button>
        </div>
        <div className="flex items-center gap-1.5 mt-2.5">
          <span className={`w-2 h-2 rounded-full shrink-0 ${sc.dotCls}`} />
          <span className={`text-xs font-semibold ${sc.cls}`}>{sc.label}</span>
          {vendor.status === 'connected' && vendor.lastSync &&
            <span className="text-[11px] text-gray-500 dark:text-gray-400">\u00B7 {vendor.lastSync}</span>}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3 dark:text-gray-400">Why This Integration</div>
          <p className="text-sm text-gray-600 leading-relaxed m-0 dark:text-gray-400">{vendor.why}</p>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3 dark:text-gray-400">Go Live Estimate</div>
          <span className="text-sm font-bold text-gray-800 font-mono dark:text-white/90">{vendor.goLive}</span>
          <span className="text-[11px] text-gray-500 dark:text-gray-400"> after approval</span>
        </div>

        {vendor.partners?.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3 dark:text-gray-400">Works With</div>
            <div className="flex flex-wrap gap-1.5">
              {vendor.partners.map((p, i) => (
                <span key={i} className="text-[11px] font-semibold text-brand-500 bg-brand-50 border border-brand-200 px-2 py-[3px] rounded-lg dark:bg-brand-500/15 dark:border-brand-500/30">{p}</span>
              ))}
            </div>
          </div>
        )}

        {combos.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3 dark:text-gray-400">Combo Insights ({combos.length})</div>
            <div className="flex flex-col gap-2">
              {combos.map(c => (
                <div key={c.id} className="px-3 py-2.5 rounded-lg bg-gray-100 border-l-[3px] border-l-brand-500 dark:bg-gray-800">
                  <div className="text-xs font-bold text-gray-800 mb-1 dark:text-white/90">{c.label}</div>
                  <div className="text-[11px] text-gray-600 leading-relaxed dark:text-gray-400">{c.insight}</div>
                  {c.swoop_only && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-brand-500 bg-brand-50 px-1.5 py-px rounded inline-block mt-1.5 dark:bg-brand-500/15">
                      Swoop Only
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
