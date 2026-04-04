// MemberAlerts — Top 5 priority members needing attention this week
import { atRiskMembers, watchMembers } from '@/data/members';
import { feedbackRecords } from '@/data/staffing';
import MemberLink from '@/components/MemberLink';
import { useNavigation } from '@/context/NavigationContext';

const REF_DATE = new Date('2026-01-31');

function getComplaintDays(memberId) {
  const complaint = feedbackRecords.find(
    f => f.memberId === memberId && f.status !== 'resolved'
  );
  if (!complaint) return null;
  const days = Math.round((REF_DATE - new Date(complaint.date)) / (1000 * 60 * 60 * 24));
  return { days, category: complaint.category };
}

const ACTION_OWNERS = {
  'Ghost': 'GM',
  'Declining': 'Membership Director',
  'Weekend Warrior': 'Pro Shop',
  'Die-Hard Golfer': 'Pro Shop',
  'Social Butterfly': 'Events Coordinator',
  'New Member': 'Membership Director',
  'Snowbird': 'Front Desk',
  'Balanced Active': 'Membership Director',
};

function buildPriorityList() {
  const all = [
    ...atRiskMembers.map(m => ({ ...m, tier: 'at-risk' })),
    ...watchMembers.map(m => ({ ...m, score: m.score, tier: 'watch' })),
  ];

  return all
    .map(m => {
      const complaint = getComplaintDays(m.memberId);
      const hasComplaint = !!complaint;
      const score = m.score ?? 50;
      const isNewMember = m.archetype === 'New Member';
      const priorityScore =
        (100 - score) +
        (hasComplaint ? 20 : 0) +
        (score < 40 ? 15 : 0) +
        (isNewMember ? 10 : 0);

      let reason, action, owner;
      if (hasComplaint) {
        reason = `Complaint unresolved ${complaint.days} days (${complaint.category})`;
        action = `Schedule GM call — complaint unresolved ${complaint.days} days`;
        owner = complaint.days > 14 ? 'GM' : (ACTION_OWNERS[m.archetype] || 'GM');
      } else if (m.archetype === 'Ghost') {
        reason = m.topRisk || m.signal || 'Engagement fully lapsed';
        action = 'GM personal call — re-engagement conversation';
        owner = 'GM';
      } else if (m.archetype === 'Declining') {
        reason = m.topRisk || m.signal || 'Activity declining across golf + dining';
        action = 'Membership Director outreach — identify root cause';
        owner = 'Membership Director';
      } else if (m.archetype === 'Weekend Warrior') {
        reason = m.topRisk || m.signal || 'Weekend golf frequency declining';
        action = 'Priority Saturday tee time offer';
        owner = 'Pro Shop';
      } else if (m.archetype === 'Die-Hard Golfer') {
        reason = m.topRisk || m.signal || 'Golf activity declining';
        action = 'Pro shop outreach — check equipment/injury/schedule';
        owner = 'Pro Shop';
      } else if (m.archetype === 'Social Butterfly') {
        reason = m.topRisk || m.signal || 'Dining and event engagement dropping';
        action = 'Invite to upcoming wine dinner or social event';
        owner = 'Events Coordinator';
      } else if (isNewMember) {
        reason = m.topRisk || m.signal || 'No habits forming in first 60 days';
        action = 'New member integration check-in — identify engagement gaps';
        owner = 'Membership Director';
      } else if (m.archetype === 'Snowbird') {
        reason = m.topRisk || m.signal || 'Seasonal return expected — no reactivation';
        action = 'Send welcome-back package + tee time reservation';
        owner = 'Front Desk';
      } else {
        reason = m.topRisk || m.signal || 'Health score declining';
        action = m.action || 'Personalized outreach based on engagement pattern';
        owner = ACTION_OWNERS[m.archetype] || 'Membership Director';
      }

      return { ...m, priorityScore, reason, action, owner };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 3);
}

const ARCHETYPE_COLORS = {
  'Die-Hard Golfer': '#22c55e',
  'Social Butterfly': '#2563eb',
  'Balanced Active': '#E8740C',
  'Weekend Warrior': '#f59e0b',
  'Declining': '#ef4444',
  'New Member': '#3B82F6',
  'Ghost': '#9CA3AF',
  'Snowbird': '#6B7280',
};

export default function MemberAlerts() {
  const { navigate } = useNavigation();
  const members = buildPriorityList();

  return (
    <div>
      <div className="text-[11px] font-bold text-error-500 uppercase tracking-wide mb-3">
        Priority Member Alerts
      </div>

      <div className="flex flex-col gap-2">
        {members.map((m) => {
          const score = m.score ?? 50;
          const scoreColor = score < 30 ? '#ef4444'
            : score < 50 ? '#f59e0b'
            : '#6B7280';
          const arcColor = ARCHETYPE_COLORS[m.archetype] || '#9CA3AF';

          return (
            <div
              key={m.memberId}
              className="py-3 px-4 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-px"
              style={{ borderLeft: `3px solid ${scoreColor}` }}
            >
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <MemberLink memberId={m.memberId} mode="drawer" className="font-bold text-sm text-gray-800 dark:text-white/90">
                    {m.name}
                  </MemberLink>
                  <span
                    className="text-[10px] font-bold py-0.5 px-2 rounded-[10px]"
                    style={{ background: `${scoreColor}15`, color: scoreColor }}
                  >
                    {score}
                  </span>
                  <span
                    className="text-[10px] font-semibold py-0.5 px-2 rounded-[10px]"
                    style={{ background: `${arcColor}12`, color: arcColor }}
                  >
                    {m.archetype}
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-1 leading-snug">
                {m.reason}
              </div>
              <div className="text-xs font-semibold flex items-center gap-2">
                {m.owner && (
                  <span className="text-[9px] font-bold py-0.5 px-1.5 rounded bg-brand-500/[0.06] text-brand-500 uppercase tracking-tight shrink-0">
                    {m.owner}
                  </span>
                )}
                <span className="text-brand-500">{m.action}</span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => navigate('members')}
        className="mt-2.5 py-2 px-4 text-xs font-semibold text-brand-500 bg-transparent border border-brand-500/20 rounded-lg cursor-pointer w-full text-center"
      >
        View all members →
      </button>
    </div>
  );
}
