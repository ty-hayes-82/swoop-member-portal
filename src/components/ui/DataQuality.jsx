// DataQuality — "Your Systems" integration panel.
import { useState } from 'react';

const SYSTEMS = [
  { name: 'Tee Sheet', type: 'Tee Sheet & Reservations', status: 'connected', lastSync: '4 min ago', quality: 98, detail: '2,524 bookings \u00B7 8,196 player records \u00B7 35 waitlist entries', note: null },
  { name: 'POS', type: 'Food & Beverage', status: 'connected', lastSync: '7 min ago', quality: 94, detail: '3,851 checks \u00B7 17,443 line items', note: '6% of checks are guest transactions \u2014 not linked to member profiles. This is expected.' },
  { name: 'Member CRM', type: 'Member CRM & Dues', status: 'connected', lastSync: '12 min ago', quality: 99, detail: '300 members \u00B7 220 households \u00B7 6 membership types', note: null },
  { name: 'Scheduling', type: 'Staffing & Scheduling', status: 'connected', lastSync: '1 min ago', quality: 97, detail: '45 staff \u00B7 701 shifts \u00B7 31 days', note: null },
  { name: 'Analytics', type: 'Events & Programming', status: 'connected', lastSync: '9 min ago', quality: 100, detail: '12 events \u00B7 641 registrations', note: null },
];

const statusCfg = (s) => ({
  connected: { label: '\u25CF Connected', cls: 'text-success-500' },
  warning:   { label: '\u25D1 Partial', cls: 'text-warning-500' },
  error:     { label: '\u25CB Offline', cls: 'text-error-500' },
}[s]);

export default function DataQuality() {
  const [expanded, setExpanded] = useState(null);
  const overall = Math.round(SYSTEMS.reduce((s, sys) => s + sys.quality, 0) / SYSTEMS.length);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="px-5 py-4 sm:px-6 border-b border-gray-200 flex justify-between items-center dark:border-gray-800">
        <div>
          <div className="text-sm font-semibold text-gray-800 dark:text-white/90">Your Connected Systems</div>
          <div className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">Every number in this platform traces back to one of these systems</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-xl font-bold text-success-500">{overall}%</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400">data quality</div>
        </div>
      </div>

      {/* System rows */}
      {SYSTEMS.map((sys) => {
        const st = statusCfg(sys.status);
        const isOpen = expanded === sys.name;
        return (
          <div key={sys.name}>
            <div
              onClick={() => setExpanded(isOpen ? null : sys.name)}
              className={`px-5 py-3 sm:px-6 border-b border-gray-100 flex items-center gap-4 cursor-pointer dark:border-gray-800 ${isOpen ? 'bg-gray-50 dark:bg-gray-800' : 'bg-transparent'}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{sys.name}</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">{sys.type}</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-px dark:text-gray-400">{sys.detail}</div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-[11px] font-semibold ${st.cls}`}>{st.label}</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Synced {sys.lastSync}</div>
              </div>
              <div className="w-12 h-1.5 bg-gray-200 rounded-sm shrink-0 dark:bg-gray-700">
                <div className={`h-full rounded-sm ${sys.quality > 95 ? 'bg-success-500' : 'bg-warning-500'}`} style={{ width: `${sys.quality}%` }} />
              </div>
              <span className="text-[10px] text-gray-500 w-8 shrink-0 dark:text-gray-400">{sys.quality}%</span>
              <span className="text-sm text-gray-500 inline-block transition-transform duration-150 dark:text-gray-400" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>\u203A</span>
            </div>
            {isOpen && (
              <div className="px-5 py-3 sm:px-6 pb-4 bg-gray-50 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-800">
                <div className="text-xs text-gray-600 leading-relaxed dark:text-gray-400">
                  <strong className="text-gray-800 dark:text-white/90">What we pull:</strong> {sys.detail}
                </div>
                {sys.note && (
                  <div className="mt-1.5 px-2.5 py-1.5 bg-blue-light-50 border-l-[3px] border-l-blue-light-500 rounded-r text-xs text-blue-light-600 leading-relaxed dark:bg-blue-light-500/10">
                    \u2139 {sys.note}
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Data quality measures what % of records fully matched across systems.{sys.quality < 100 && ` The ${100 - sys.quality}% gap is normal \u2014 it represents guest transactions and records created outside normal workflow.`}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="p-4 bg-gray-50 flex justify-between items-center dark:bg-gray-800">
        <span className="text-[11px] text-gray-500 dark:text-gray-400">Typical go-live timeline with Tee Sheet + POS: 10\u201314 days</span>
        <span className="text-[11px] text-success-500 font-semibold">\u25CF All systems syncing normally</span>
      </div>
    </div>
  );
}
