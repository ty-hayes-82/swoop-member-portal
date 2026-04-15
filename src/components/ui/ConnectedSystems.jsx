// ConnectedSystems.jsx — integration status panel for Daily Briefing + Demo Mode

// lastSync intentionally '—' — no service exposes per-system sync freshness yet.
// See docs/operations/freshness-audit-2026-04-09.md (needs service support).
const SYSTEMS = [
  { name: 'Tee Sheet', role: 'Tee Sheet \u00B7 Golf Operations', icon: '\u26F3', colorCls: 'text-blue-light-500', lastSync: '\u2014', records: '2,524 bookings' },
  { name: 'POS', role: 'Food & Beverage \u00B7 Payments', icon: '\uD83C\uDF7D', colorCls: 'text-orange-500', lastSync: '\u2014', records: '3,851 checks' },
  { name: 'Member CRM', role: 'Member CRM \u00B7 Email', icon: '\u2605', colorCls: 'text-swoop-text-muted', lastSync: '\u2014', records: '300 members' },
  { name: 'Scheduling', role: 'Staff Scheduling', icon: '\uD83D\uDCC5', colorCls: 'text-blue-light-600', lastSync: '\u2014', records: '701 shifts' },
  { name: 'Analytics', role: 'Membership Management', icon: '\u25C9', colorCls: 'text-swoop-text-muted', lastSync: '\u2014', records: '300 accounts' },
];

export default function ConnectedSystems({ compact = false }) {
  return (
    <div className="rounded-xl border border-swoop-border bg-swoop-panel overflow-hidden">
      <div className="px-4 py-3 border-b border-swoop-border flex items-center gap-3">
        <span className="text-[11px] font-semibold text-swoop-text-muted tracking-wider uppercase">
          Connected Systems
        </span>
        <span className="text-[10px] px-1.5 py-px rounded-full bg-success-50 text-success-500 font-semibold">
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
                {!compact && <span className="text-[10px] text-swoop-text-muted">{sys.role}</span>}
              </div>
              {!compact && (
                <div className="text-[10px] text-swoop-text-muted mt-px">
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
