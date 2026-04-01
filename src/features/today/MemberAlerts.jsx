// MemberAlerts — Top 5 priority members needing attention this week
import { theme } from '@/config/theme';
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

      let reason, action;
      if (hasComplaint) {
        reason = `Complaint unresolved ${complaint.days} days (${complaint.category})`;
        action = `Schedule GM call — complaint unresolved ${complaint.days} days`;
      } else if (m.archetype === 'Ghost' || m.archetype === 'Declining') {
        reason = m.topRisk || m.signal || 'Engagement declining across all channels';
        action = 'Membership Director outreach — re-engagement conversation';
      } else if (m.archetype === 'Weekend Warrior' || m.archetype === 'Die-Hard Golfer') {
        reason = m.topRisk || m.signal || 'Golf activity declining';
        action = `Pro shop outreach — hasn't played recently`;
      } else if (m.archetype === 'Social Butterfly') {
        reason = m.topRisk || m.signal || 'Dining and event engagement dropping';
        action = 'Invite to upcoming wine dinner or social event';
      } else if (isNewMember) {
        reason = m.topRisk || m.signal || 'No habits forming in first 60 days';
        action = 'New member integration check-in — identify engagement gaps';
      } else {
        reason = m.topRisk || m.signal || 'Health score declining';
        action = m.action || 'Personalized outreach based on engagement pattern';
      }

      return { ...m, priorityScore, reason, action };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 3);
}

const ARCHETYPE_COLORS = {
  'Die-Hard Golfer': theme.colors.success,
  'Social Butterfly': theme.colors.info,
  'Balanced Active': theme.colors.accent,
  'Weekend Warrior': theme.colors.warning,
  'Declining': theme.colors.urgent,
  'New Member': theme.colors.info500,
  'Ghost': theme.colors.textMuted,
  'Snowbird': theme.colors.textSecondary,
};

export default function MemberAlerts() {
  const { navigate } = useNavigation();
  const members = buildPriorityList();

  return (
    <div>
      <div style={{
        fontSize: '11px', fontWeight: 700, color: theme.colors.urgent,
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12,
      }}>
        Priority Member Alerts
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {members.map((m) => {
          const score = m.score ?? 50;
          const scoreColor = score < 30 ? theme.colors.urgent
            : score < 50 ? theme.colors.warning
            : theme.colors.textSecondary;
          const arcColor = ARCHETYPE_COLORS[m.archetype] || theme.colors.textMuted;

          return (
            <div
              key={m.memberId}
              style={{
                padding: '12px 16px',
                background: theme.colors.bgCard,
                border: `1px solid ${theme.colors.border}`,
                borderLeft: `3px solid ${scoreColor}`,
                borderRadius: theme.radius.md,
                cursor: 'pointer',
                transition: 'box-shadow 0.15s, transform 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = theme.shadow.md; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MemberLink memberId={m.memberId} mode="drawer" style={{ fontWeight: 700, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>
                    {m.name}
                  </MemberLink>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                    background: `${scoreColor}15`, color: scoreColor,
                  }}>
                    {score}
                  </span>
                  <span style={{
                    fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                    background: `${arcColor}12`, color: arcColor,
                  }}>
                    {m.archetype}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginBottom: 4, lineHeight: 1.4 }}>
                {m.reason}
              </div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.accent, fontWeight: 600 }}>
                {m.action}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => navigate('members')}
        style={{
          marginTop: 10, padding: '8px 16px', fontSize: theme.fontSize.xs,
          fontWeight: 600, color: theme.colors.accent, background: 'none',
          border: `1px solid ${theme.colors.accent}30`, borderRadius: theme.radius.sm,
          cursor: 'pointer', width: '100%', textAlign: 'center',
        }}
      >
        View all members →
      </button>
    </div>
  );
}
