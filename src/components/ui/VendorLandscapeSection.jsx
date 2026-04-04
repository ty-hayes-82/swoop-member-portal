// VendorLandscapeSection.jsx — full vendor landscape organized by category

const TIER_CLS = {
  primary:     { text: 'text-success-600 dark:text-success-400', bg: 'bg-success-50 dark:bg-success-500/10', border: 'border-success-200 dark:border-success-500/30' },
  supported:   { text: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700' },
  coming_soon: { text: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700' },
};

export default function VendorLandscapeSection({ categories }) {
  const totalVendors = categories.reduce((n, c) => n + c.vendors.length, 0);

  return (
    <div>
      <div className="mb-3">
        <div className="text-base font-bold text-gray-800 dark:text-white/90">Full Vendor Landscape</div>
        <div className="text-[11px] text-gray-500 mt-0.5 dark:text-gray-400">
          {totalVendors}+ compatible vendors across {categories.length} categories \u2014 Swoop works with what you already have
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {categories.map(cat => {
          const primaryCount   = cat.vendors.filter(v => v.tier === 'primary').length;
          const supportedCount = cat.vendors.filter(v => v.tier === 'supported').length;
          const soonCount      = cat.vendors.filter(v => v.tier === 'coming_soon').length;

          return (
            <div key={cat.category} className="rounded-lg border border-gray-200 border-l-[3px] border-l-brand-500 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
              {/* Category header */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-sm leading-none">{cat.icon}</span>
                <div>
                  <div className="text-xs font-bold text-gray-800 leading-tight dark:text-white/90">{cat.category}</div>
                  <div className="text-[10px] text-gray-500 mt-px dark:text-gray-400">{cat.description}</div>
                </div>
              </div>

              {/* Vendor chips */}
              <div className="flex flex-wrap gap-1 mb-2">
                {cat.vendors.map(v => {
                  const cls = TIER_CLS[v.tier] || TIER_CLS.supported;
                  return (
                    <span key={v.name} className={`text-[10px] px-1.5 py-0.5 rounded border ${cls.text} ${cls.bg} ${cls.border} ${v.tier === 'primary' ? 'font-semibold' : 'font-normal'} ${v.tier === 'coming_soon' ? 'opacity-65' : ''}`}>
                      {v.name}
                    </span>
                  );
                })}
              </div>

              {/* Tier counts */}
              <div className="flex gap-2.5 border-t border-gray-100 pt-1.5 dark:border-gray-800">
                {primaryCount   > 0 && <Tally label="Live"      count={primaryCount}   cls="text-success-500" />}
                {supportedCount > 0 && <Tally label="Supported" count={supportedCount} cls="text-gray-500 dark:text-gray-400" />}
                {soonCount      > 0 && <Tally label="Coming"    count={soonCount}      cls="text-gray-500 dark:text-gray-400" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Tally({ label, count, cls }) {
  return (
    <span className={`text-[10px] flex items-center gap-[3px] ${cls}`}>
      <span className="font-bold font-mono">{count}</span>
      <span>{label}</span>
    </span>
  );
}
