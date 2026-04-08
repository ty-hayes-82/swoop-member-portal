// TodaysRisks — Staffing status grid + Open complaints with aging
import { getComplaintCorrelation, getShiftCoverage } from '@/services/staffingService';
import { shouldUseStatic } from '@/services/demoGate';
import { useNavigation } from '@/context/NavigationContext';
import MemberLink from '@/components/MemberLink';

const REF_DATE = new Date();

function getStaffingColor(current, required) {
  if (current >= required) return '#22c55e';
  if (current >= required - 1) return '#ca8a04';
  return '#ef4444';
}

function getStaffingLabel(current, required) {
  if (current >= required) return 'Fully staffed';
  if (current >= required - 1) return 'Tight';
  return 'Gap';
}

export default function TodaysRisks() {
  const { navigate } = useNavigation();
  const allComplaints = getComplaintCorrelation();
  const shiftCoverage = getShiftCoverage();
  const showMemberNames = shouldUseStatic('members');

  const hasComplaintsGate = shouldUseStatic('complaints');
  const hasWeatherGate = shouldUseStatic('weather');

  // Hide section only if no data AND no relevant gates open
  if (allComplaints.length === 0 && shiftCoverage.length === 0 && !hasComplaintsGate && !hasWeatherGate) {
    return null;
  }

  // Aggregate shift coverage by department — API returns per-date rows,
  // roll up to department-level for display
  const OUTLETS = (() => {
    if (shiftCoverage.length === 0) return [];

    // Group by department and compute avg staffing
    const byDept = {};
    for (const s of shiftCoverage) {
      const dept = s.outlet || s.department || 'Outlet';
      if (!byDept[dept]) byDept[dept] = { count: 0, total: 0, understaffed: 0 };
      byDept[dept].count++;
      byDept[dept].total += (s.staffCount || s.actual || s.current || s.scheduled || 0);
      if (s.isUnderstaffed || s.isUnderstaffedDay) byDept[dept].understaffed++;
    }

    // Target staffing by department (based on typical club needs)
    const targets = { 'F&B Service': 6, 'F&B Kitchen': 4, 'Golf Operations': 5, 'Grounds': 4, 'Pro Shop': 2, 'Administration': 2 };
    return Object.entries(byDept).slice(0, 6).map(([dept, data]) => {
      const avgStaff = Math.round(data.total / Math.max(1, data.count));
      const required = targets[dept] || Math.ceil(avgStaff * 1.1);
      return { name: dept, current: avgStaff, required };
    });
  })();

  // Unresolved complaints with aging
  const unresolvedComplaints = allComplaints
    .filter(f => f.status !== 'resolved')
    .map(f => {
      const days = Math.round((REF_DATE - new Date(f.date)) / (1000 * 60 * 60 * 24));
      return { ...f, daysOpen: Math.max(0, days) };
    })
    .sort((a, b) => b.daysOpen - a.daysOpen);

  const displayComplaints = unresolvedComplaints.slice(0, 3);
  const totalUnresolved = unresolvedComplaints.length;

  const statusColors = {
    acknowledged: '#ca8a04',
    in_progress: '#3B82F6',
    escalated: '#ef4444',
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Staffing Status Grid */}
      <div>
        <div className="text-[11px] font-bold text-brand-500 uppercase tracking-wide mb-2.5">
          Today's Staffing vs Demand
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5">
          {OUTLETS.map(outlet => {
            const color = getStaffingColor(outlet.current, outlet.required);
            const label = getStaffingLabel(outlet.current, outlet.required);
            return (
              <div
                key={outlet.name}
                onClick={() => navigate('service', { tab: 'staffing' })}
                className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-px"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                <div className="text-sm font-bold text-gray-800 dark:text-white/90 mb-1">
                  {outlet.name}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold" style={{ color }}>
                    {outlet.current}/{outlet.required}
                  </span>
                  <span className="text-xs font-semibold" style={{ color }}>
                    {label}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  servers
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Open Complaints with Aging */}
      {(totalUnresolved > 0 || hasComplaintsGate) && (
        <div>
          <div className="text-[11px] font-bold text-warning-500 uppercase tracking-wide mb-2.5">
            Open Complaints ({totalUnresolved})
          </div>
          {totalUnresolved === 0 ? (
            <div className="py-4 px-3.5 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg">
              No unresolved complaints — all issues resolved
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                {displayComplaints.map(c => {
                  const isOld = c.daysOpen > 7;
                  const isCritical = c.daysOpen > 30;
                  const statusColor = statusColors[c.status] || '#6b7280';
                  return (
                    <div
                      key={c.id}
                      onClick={() => navigate('service', { tab: 'complaints' })}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between py-2.5 px-3.5 rounded-lg cursor-pointer transition-shadow duration-150 hover:shadow-md gap-1.5 sm:gap-0 ${isOld ? 'bg-red-500/[0.024] border border-red-500/[0.15]' : 'border border-gray-200'} ${isCritical ? 'animate-[pulse-border_2s_infinite]' : ''}`}
                    >
                      <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0 flex-wrap">
                        {showMemberNames ? (
                          <MemberLink memberId={c.memberId} mode="drawer" className="font-semibold text-sm text-gray-800 dark:text-white/90 whitespace-nowrap">
                            {c.memberName}
                          </MemberLink>
                        ) : (
                          <span className="font-semibold text-sm text-gray-800 dark:text-white/90 whitespace-nowrap">Member</span>
                        )}
                        <span className="text-xs text-gray-500">{c.category}</span>
                        {c.isUnderstaffedDay && (
                          <span className="text-[9px] font-bold text-error-500 bg-error-500/[0.07] px-1.5 py-px rounded-full">Understaffed</span>
                        )}
                        {!c.isUnderstaffedDay && c.daysOpen <= 10 && (
                          <span className="text-[9px] font-bold text-[#ca8a04] bg-[#ca8a0412] px-1.5 py-px rounded-full">High-demand day</span>
                        )}
                        {c.category === 'Pace of Play' && (
                          <span className="text-[9px] font-bold text-blue-500 bg-blue-500/[0.07] px-1.5 py-px rounded-full">Weather impact</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                        <span className="text-[9px] font-bold py-0.5 px-1.5 rounded bg-brand-500/[0.06] text-brand-500 uppercase tracking-tight">
                          {c.daysOpen > 14 ? 'GM' : 'Dept Head'}
                        </span>
                        <span className={`text-xs font-bold ${isOld ? 'text-error-500' : 'text-gray-600'}`}>{c.daysOpen}d</span>
                        <span className="text-[10px] font-semibold py-0.5 px-2 rounded-xl capitalize" style={{ background: `${statusColor}15`, color: statusColor }}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {totalUnresolved > 3 && (
                <button
                  onClick={() => navigate('service', { tab: 'complaints' })}
                  className="mt-2 py-1.5 px-3 text-xs font-semibold text-brand-500 bg-transparent border border-brand-500/20 rounded-lg cursor-pointer"
                >
                  View all {totalUnresolved} in Service →
                </button>
              )}
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(239,68,68,0.15); }
          50% { border-color: rgba(239,68,68,0.38); }
        }
      `}</style>
    </div>
  );
}
