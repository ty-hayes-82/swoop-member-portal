// VendorLandscapeSection.jsx — full vendor landscape organized by category

const TIER_CLS = {
  primary:     { text: 'text-success-600', bg: 'bg-success-50', border: 'border-success-200' },
  supported:   { text: 'text-swoop-text-muted', bg: 'bg-swoop-row', border: 'border-swoop-border' },
  coming_soon: { text: 'text-swoop-text-muted', bg: 'bg-swoop-row', border: 'border-swoop-border' },
};

export default function VendorLandscapeSection({ categories }) {
  const totalVendors = categories.reduce((n, c) => n + c.vendors.length, 0);

  return (
    <div>
      <div className="mb-3">
        <div className="text-base font-bold text-swoop-text">Full Vendor Landscape</div>
        <div className="text-[11px] text-swoop-text-muted mt-0.5">
          {totalVendors}+ compatible vendors across {categories.length} categories \u2014 Swoop works with what you already have
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {categories.map(cat => {
          const primaryCount   = cat.vendors.filter(v => v.tier === 'primary').length;
          const supportedCount = cat.vendors.filter(v => v.tier === 'supported').length;
          const soonCount      = cat.vendors.filter(v => v.tier === 'coming_soon').length;

          return (
            <div key={cat.category} className="rounded-lg border border-swoop-border border-l-[3px] border-l-brand-500 bg-swoop-panel p-3">
              {/* Category header */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-sm leading-none">{cat.icon}</span>
                <div>
                  <div className="text-xs font-bold text-swoop-text leading-tight">{cat.category}</div>
                  <div className="text-[10px] text-swoop-text-muted mt-px">{cat.description}</div>
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
              <div className="flex gap-2.5 border-t border-swoop-border-inset pt-1.5">
                {primaryCount   > 0 && <Tally label="Live"      count={primaryCount}   cls="text-success-500" />}
                {supportedCount > 0 && <Tally label="Supported" count={supportedCount} cls="text-swoop-text-muted" />}
                {soonCount      > 0 && <Tally label="Coming"    count={soonCount}      cls="text-swoop-text-muted" />}
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
