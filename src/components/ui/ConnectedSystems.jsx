// ConnectedSystems.jsx — integration status panel for Daily Briefing + Demo Mode

// lastSync intentionally '—' — no service exposes per-system sync freshness yet.
// See docs/operations/freshness-audit-2026-04-09.md (needs service support).
const SYSTEMS = [
  { name: 'Tee Sheet', role: 'Tee Sheet \u00B7 Golf Operations', icon: '\u26F3', colorCls: 'text-blue-light-500', lastSync: '\u2014', records: '2,524 bookings' },
  { name: 'POS', role: 'Food & Beverage \u00B7 Payments', icon: '\uD83C\uDF7D', colorCls: 'text-orange-500', lastSync: '\u2014', records: '3,851 checks' },
  { name: 'Member CRM', role: 'Member CRM \u00B7 Email', icon: '\u2605', colorCls: 'text-gray-600 dark:text-gray-400', lastSync: '\u2014', records: '300 members' },
  { name: 'Scheduling', role: 'Staff Scheduling', icon: '\uD83D\uDCC5', colorCls: 'text-blue-light-600', lastSync: '\u2014', records: '701 shifts' },
  { name: 'Analytics', role: 'Membership Management', icon: '\u25C9', colorCls: 'text-gray-600 dark:text-gray-400', lastSync: '\u2014', records: '300 accounts' },
];

export default function ConnectedSystems({ compact = false }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3 dark:border-gray-800">
        <span className="text-[11px] font-semibold text-gray-600 tracking-wider uppercase dark:text-gray-400">
          Connected Systems
        </span>
        <span className="text-[10px] px-1.5 py-px rounded-full bg-success-50 text-success-500 font-semibold dark:bg-success-500/15">
          {SYSTEMS.length} Live
        </span>
      </div>

      <div className={`flex flex-col ${compact ? 'px-4 py-3 gap-1.5' : 'p-4 gap-3'}`}>
        {SYSTEMS.map(sys => (
          <div key={sys.name} className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-success-500 shrink-0 shadow-[0_0_4px_#12b76a]" />
            <span className="text-sm">{sys.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-xs font-semibold ${sys.colorCls}`}>{sys.name}</span>
                {!compact && <span className="text-[10px] text-gray-500 dark:text-gray-400">{sys.role}</span>}
              </div>
              {!compact && (
                <div className="text-[10px] text-gray-500 mt-px dark:text-gray-400">
                  {sys.records} \u00B7 synced {sys.lastSync}
                </div>
              )}
            </div>
            <span className="text-[10px] text-success-500 shrink-0">\u25CF</span>
          </div>
        ))}
      </div>
    </div>
  );
}
