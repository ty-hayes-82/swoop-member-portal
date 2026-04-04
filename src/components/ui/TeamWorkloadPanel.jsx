/**
 * M2: Team Workload View
 */
import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';

const STAFF_ROLES = [
  { name: 'Sarah Mitchell', title: 'General Manager', role: 'gm' },
  { name: 'Head Golf Professional', title: 'Head Pro', role: 'head_pro' },
  { name: 'Membership Director', title: 'Membership', role: 'membership_director' },
  { name: 'F&B Director', title: 'F&B', role: 'fb_director' },
  { name: 'Events Director', title: 'Events', role: 'events' },
  { name: 'Assistant GM', title: 'Asst GM', role: 'assistant_gm' },
];

export default function TeamWorkloadPanel() {
  const { inbox } = useApp();

  const workload = useMemo(() => {
    const byOwner = {};
    inbox.forEach(action => {
      const owner = action.owner || action.assignedTo || action.source || 'Unassigned';
      if (!byOwner[owner]) byOwner[owner] = { pending: 0, approved: 0, dismissed: 0, total: 0 };
      byOwner[owner].total++;
      if (action.status === 'pending') byOwner[owner].pending++;
      else if (action.status === 'approved') byOwner[owner].approved++;
      else if (action.status === 'dismissed') byOwner[owner].dismissed++;
    });

    const result = STAFF_ROLES.map(staff => {
      const match = Object.entries(byOwner).find(([key]) =>
        key.toLowerCase().includes(staff.name.toLowerCase()) ||
        key.toLowerCase().includes(staff.title.toLowerCase()) ||
        key.toLowerCase().includes(staff.role)
      );
      const data = match ? match[1] : { pending: 0, approved: 0, dismissed: 0, total: 0 };
      const completionRate = data.total > 0 ? Math.round((data.approved + data.dismissed) / data.total * 100) : 0;
      return { ...staff, ...data, completionRate };
    });

    return result.filter(r => r.total > 0 || STAFF_ROLES.some(s => s.name === r.name));
  }, [inbox]);

  const totalPending = workload.reduce((s, w) => s + w.pending, 0);

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-100 flex justify-between items-center dark:border-gray-800 dark:bg-gray-800">
        <div>
          <div className="font-bold text-sm text-gray-800 dark:text-white/90">Team Workload</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{totalPending} pending actions across team</div>
        </div>
      </div>

      <div className="p-2">
        {/* Header */}
        <div className="grid gap-2 px-2 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400"
          style={{ gridTemplateColumns: '1.5fr 0.7fr 0.7fr 0.7fr 0.8fr' }}>
          <span>Team Member</span>
          <span className="text-center">Pending</span>
          <span className="text-center">Approved</span>
          <span className="text-center">Dismissed</span>
          <span className="text-right">Completion</span>
        </div>

        {workload.map(member => (
          <div key={member.name}
            className={`grid gap-2 p-2 rounded-lg items-center text-xs ${member.pending > 3 ? 'bg-warning-50 dark:bg-warning-500/5' : 'bg-transparent'}`}
            style={{ gridTemplateColumns: '1.5fr 0.7fr 0.7fr 0.7fr 0.8fr' }}>
            <div>
              <div className="font-semibold text-gray-800 dark:text-white/90">{member.name}</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">{member.title}</div>
            </div>
            <div className={`text-center font-bold font-mono ${member.pending > 0 ? 'text-brand-500' : 'text-gray-500 dark:text-gray-400'}`}>{member.pending}</div>
            <div className="text-center font-mono text-success-500">{member.approved}</div>
            <div className="text-center font-mono text-gray-500 dark:text-gray-400">{member.dismissed}</div>
            <div className="text-right">
              <span className={`font-bold font-mono ${
                member.completionRate >= 80 ? 'text-success-500' : member.completionRate >= 50 ? 'text-warning-500' : 'text-gray-500 dark:text-gray-400'
              }`}>{member.completionRate}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
