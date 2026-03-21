/**
 * M2: Team Workload View
 * Shows pending actions per staff member with completion rates.
 */
import { useMemo } from 'react';
import { theme } from '@/config/theme';
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

    // Count actions by owner/assignee
    inbox.forEach(action => {
      const owner = action.owner || action.assignedTo || action.source || 'Unassigned';
      if (!byOwner[owner]) byOwner[owner] = { pending: 0, approved: 0, dismissed: 0, total: 0 };
      byOwner[owner].total++;
      if (action.status === 'pending') byOwner[owner].pending++;
      else if (action.status === 'approved') byOwner[owner].approved++;
      else if (action.status === 'dismissed') byOwner[owner].dismissed++;
    });

    // Map to staff members + catch unmatched
    const result = STAFF_ROLES.map(staff => {
      // Match by name or role
      const match = Object.entries(byOwner).find(([key]) =>
        key.toLowerCase().includes(staff.name.toLowerCase()) ||
        key.toLowerCase().includes(staff.title.toLowerCase()) ||
        key.toLowerCase().includes(staff.role)
      );
      const data = match ? match[1] : { pending: 0, approved: 0, dismissed: 0, total: 0 };
      const completionRate = data.total > 0 ? Math.round((data.approved + data.dismissed) / data.total * 100) : 0;
      return { ...staff, ...data, completionRate };
    });

    // Add agent-sourced actions as "AI Agents" row
    const agentActions = Object.entries(byOwner).filter(([key]) =>
      key.includes('Optimizer') || key.includes('Autopilot') || key.includes('Pulse') ||
      key.includes('Analyst') || key.includes('Recovery') || key.includes('Agent')
    );
    if (agentActions.length > 0) {
      const combined = agentActions.reduce((sum, [, d]) => ({
        pending: sum.pending + d.pending, approved: sum.approved + d.approved,
        dismissed: sum.dismissed + d.dismissed, total: sum.total + d.total,
      }), { pending: 0, approved: 0, dismissed: 0, total: 0 });
      result.push({
        name: 'AI Agents', title: '6 agents', role: 'ai',
        ...combined,
        completionRate: combined.total > 0 ? Math.round((combined.approved + combined.dismissed) / combined.total * 100) : 0,
      });
    }

    return result.filter(r => r.total > 0 || STAFF_ROLES.some(s => s.name === r.name));
  }, [inbox]);

  const totalPending = workload.reduce((s, w) => s + w.pending, 0);

  return (
    <div style={{
      border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md,
      background: theme.colors.bgCard, overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px', borderBottom: `1px solid ${theme.colors.border}`,
        background: theme.colors.bgDeep, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>Team Workload</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{totalPending} pending actions across team</div>
        </div>
      </div>

      <div style={{ padding: '8px' }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1.5fr 0.7fr 0.7fr 0.7fr 0.8fr',
          gap: 8, padding: '6px 8px', fontSize: '10px', fontWeight: 600,
          color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          <span>Team Member</span>
          <span style={{ textAlign: 'center' }}>Pending</span>
          <span style={{ textAlign: 'center' }}>Approved</span>
          <span style={{ textAlign: 'center' }}>Dismissed</span>
          <span style={{ textAlign: 'right' }}>Completion</span>
        </div>

        {workload.map(member => (
          <div key={member.name} style={{
            display: 'grid', gridTemplateColumns: '1.5fr 0.7fr 0.7fr 0.7fr 0.8fr',
            gap: 8, padding: '8px', borderRadius: theme.radius.sm,
            alignItems: 'center', fontSize: theme.fontSize.xs,
            background: member.pending > 3 ? `${theme.colors.warning}06` : 'transparent',
          }}>
            <div>
              <div style={{ fontWeight: 600, color: theme.colors.textPrimary }}>{member.name}</div>
              <div style={{ fontSize: '10px', color: theme.colors.textMuted }}>{member.title}</div>
            </div>
            <div style={{
              textAlign: 'center', fontWeight: 700, fontFamily: theme.fonts.mono,
              color: member.pending > 0 ? theme.colors.accent : theme.colors.textMuted,
            }}>{member.pending}</div>
            <div style={{ textAlign: 'center', fontFamily: theme.fonts.mono, color: theme.colors.success }}>{member.approved}</div>
            <div style={{ textAlign: 'center', fontFamily: theme.fonts.mono, color: theme.colors.textMuted }}>{member.dismissed}</div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                fontWeight: 700, fontFamily: theme.fonts.mono,
                color: member.completionRate >= 80 ? theme.colors.success : member.completionRate >= 50 ? theme.colors.warning : theme.colors.textMuted,
              }}>{member.completionRate}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
