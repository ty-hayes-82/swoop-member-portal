// HealthOverview — unified "Members Needing Attention" view
// V4: Single priority-sorted list replacing 5 overlapping sections
import MemberLink from '@/components/MemberLink.jsx';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge.jsx';
import QuickActions from '@/components/ui/QuickActions.jsx';
import TrendChart from '@/components/charts/TrendChart.jsx';
import { getHealthDistribution, getAtRiskMembers, getWatchMembers, getVolatileMembers, getMemberSummary } from '@/services/memberService';
import { getComplaintCorrelation } from '@/services/staffingService';
import { isAuthenticatedClub } from '@/config/constants';
import DataEmptyState from '@/components/ui/DataEmptyState';
import { theme } from '@/config/theme';
import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigation } from '@/context/NavigationContext';
import { trackAction } from '@/services/activityService';

const REF_DATE = new Date('2026-01-31');

const levelDescriptions = {
  Healthy: 'are actively engaged across the club',
  Watch: 'need monitoring before small issues appear',
  'At Risk': 'are showing signs of disengagement',
  Critical: 'require immediate outreach',
};

function getComplaintInfo(memberId) {
  const complaint = getComplaintCorrelation().find(
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

function getDifferentiatedAction(member, complaint) {
  const owner = ACTION_OWNERS[member.archetype] || 'Membership Director';
  if (complaint) {
    return { action: `Resolve complaint — ${complaint.category}, ${complaint.days} days open`, type: 'complaint', owner: complaint.days > 14 ? 'GM' : owner };
  }
  const risk = (member.topRisk || member.signal || '').toLowerCase();
  // Archetype-specific actions (differentiated per audit)
  switch (member.archetype) {
    case 'Ghost':
      return { action: 'GM personal call — re-engagement conversation', type: 'ghost', owner: 'GM' };
    case 'Declining':
      return { action: `Membership Director outreach — identify root cause of declining activity`, type: 'declining', owner: 'Membership Director' };
    case 'Weekend Warrior':
      return { action: 'Priority Saturday tee time offer from Pro Shop', type: 'golf', owner: 'Pro Shop' };
    case 'Die-Hard Golfer': {
      const weeks = risk.match(/(\d+)\s*weeks?/)?.[1];
      return { action: `Pro shop outreach — ${weeks ? `check in, last round ${weeks} weeks ago` : 'check equipment/injury/schedule'}`, type: 'golf', owner: 'Pro Shop' };
    }
    case 'Social Butterfly':
      return { action: 'Invite to upcoming wine dinner or social event', type: 'social', owner: 'Events Coordinator' };
    case 'New Member':
      return { action: 'New member integration check-in — identify engagement gaps', type: 'new-member', owner: 'Membership Director' };
    case 'Snowbird':
      return { action: 'Send welcome-back package + tee time reservation', type: 'snowbird', owner: 'Front Desk' };
    default:
      break;
  }
  // Risk-signal-based fallbacks
  if (risk.includes('email') || risk.includes('open rate')) {
    const pct = risk.match(/(\d+)%/)?.[1] || '';
    return { action: `Check-in call — email engagement dropped${pct ? ` ${pct}%` : ''}`, type: 'email', owner };
  }
  if (risk.includes('dining') || risk.includes('f&b')) {
    return { action: 'Invite to upcoming dinner or dining event', type: 'dining', owner: 'F&B Director' };
  }
  return { action: member.action || 'Personalized outreach based on engagement pattern', type: 'general', owner };
}

function buildPriorityList(atRisk, watchList, volatileMembers) {
  const seen = new Set();
  const all = [];

  // Add all at-risk members first
  for (const m of atRisk) {
    if (!seen.has(m.memberId)) {
      seen.add(m.memberId);
      all.push({ ...m, score: m.score, tier: 'at-risk' });
    }
  }
  // Add volatile members not already included
  for (const m of volatileMembers) {
    if (!seen.has(m.memberId)) {
      seen.add(m.memberId);
      all.push({ ...m, score: m.score, tier: 'volatile' });
    }
  }
  // Add watch members not already included
  for (const m of watchList) {
    if (!seen.has(m.memberId)) {
      seen.add(m.memberId);
      all.push({ ...m, score: m.score, tier: 'watch' });
    }
  }

  return all
    .map(m => {
      const complaint = getComplaintInfo(m.memberId);
      const score = m.score ?? 50;
      const isNewMember = m.archetype === 'New Member';
      const priorityScore =
        (100 - score) +
        (complaint ? 20 : 0) +
        (score < 30 ? 15 : 0) +
        (isNewMember ? 10 : 0);

      const reason = complaint
        ? `Complaint unresolved ${complaint.days} days (${complaint.category})`
        : m.topRisk || m.signal || 'Health score declining';
      const { action, type, owner } = getDifferentiatedAction(m, complaint);

      return { ...m, priorityScore, reason, action, actionType: type, owner };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

const ACTION_TYPE_COLORS = {
  complaint: theme.colors.urgent,
  email: theme.colors.warning,
  golf: theme.colors.accent,
  dining: theme.colors.info500,
  'new-member': theme.colors.info,
  ghost: theme.colors.textMuted,
  declining: theme.colors.urgent,
  social: '#8b5cf6',
  snowbird: theme.colors.info,
  general: theme.colors.accent,
};

export default function HealthOverview() {
  const dist = getHealthDistribution();
  const atRisk = getAtRiskMembers();
  const watchList = getWatchMembers();
  const volatileMembers = getVolatileMembers();
  const [expandedId, setExpandedId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const { showToast, addAction } = useApp();
  const { navigate } = useNavigation();

  // Authenticated club with no at-risk or watch members — show contextual message
  if (isAuthenticatedClub() && atRisk.length === 0 && watchList.length === 0) {
    const summary = getMemberSummary();
    if (summary.total > 0) {
      return <DataEmptyState icon="✅" title="No members at risk" description={`${summary.total} members imported. Health scores require golf and dining data in addition to the member roster. Import tee sheet and POS data to see risk levels.`} dataType="engagement data" />;
    }
    return <DataEmptyState icon="👥" title="No members imported yet" description="Import your member roster to start tracking member health and engagement." dataType="members" />;
  }

  const allPriorityMembers = useMemo(
    () => buildPriorityList(atRisk, watchList, volatileMembers),
    [atRisk, watchList, volatileMembers]
  );
  const priorityMembers = showAll ? allPriorityMembers : allPriorityMembers.slice(0, 5);

  const scoreColor = (score) =>
    score < 30 ? theme.colors.urgent
    : score < 50 ? theme.colors.warning
    : theme.colors.textSecondary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Health Distribution KPI Cards */}
      <div className="grid-responsive-4">
        {dist.map((d) => {
          const delta = Number.isFinite(d?.delta) ? d.delta : 0;
          const descriptor = levelDescriptions[d.level] ?? 'are in this state';
          const deltaColor = delta > 0 ? theme.colors.urgent : delta < 0 ? theme.colors.success : theme.colors.textMuted;
          const deltaCopy = delta === 0
            ? 'same as last month.'
            : `${Math.abs(delta)} ${delta > 0 ? 'more' : 'fewer'} than last month.`;
          return (
            <div key={d.level} style={{ background: theme.colors.bgCard, boxShadow: theme.shadow.sm, borderRadius: theme.radius.md,
              border: `1px solid ${d.color}40`, padding: theme.spacing.md }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
                <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
                  textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d.level}</span>
                <span style={{ fontSize: theme.fontSize.xs, color: d.color }}>
                  {(d.percentage * 100).toFixed(0)}%
                </span>
              </div>
              <div style={{ fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.mono,
                fontWeight: 700, color: d.color }}>{d.count}</div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>members</div>
              <div style={{ height: 4, background: theme.colors.border, borderRadius: 2, marginTop: theme.spacing.sm }}>
                <div style={{ height: '100%', background: d.color, borderRadius: 2,
                  width: `${d.percentage * 100}%` }} />
              </div>
              <div style={{ marginTop: theme.spacing.sm, fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.4 }}>
                <strong>{d.count} members</strong> {descriptor} —{' '}
                <span style={{ color: deltaColor }}>{deltaCopy}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Members Needing Attention — single priority list */}
      <div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: theme.spacing.md,
        }}>
          <div>
            <div style={{
              fontSize: '11px', fontWeight: 700, color: theme.colors.urgent,
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
            }}>
              Members Needing Attention
            </div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
              Priority-sorted by health score, complaints, and engagement signals
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {priorityMembers.map((m, idx) => {
            const sc = scoreColor(m.score);
            const actionColor = ACTION_TYPE_COLORS[m.actionType] || theme.colors.accent;
            const isExpanded = expandedId === m.memberId;

            return (
              <div key={m.memberId}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : m.memberId)}
                  style={{
                    padding: '14px 18px',
                    background: theme.colors.bgCard,
                    border: `1px solid ${theme.colors.border}`,
                    borderLeft: `3px solid ${sc}`,
                    borderRadius: theme.radius.md,
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = theme.shadow.md; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                >
                  {/* Row 1: Name + badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.textMuted,
                        fontFamily: theme.fonts.mono, width: 20,
                      }}>
                        {idx + 1}
                      </span>
                      <MemberLink memberId={m.memberId} mode="drawer" style={{
                        fontWeight: 700, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary,
                      }}>
                        {m.name}
                      </MemberLink>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                        background: `${sc}15`, color: sc, fontFamily: theme.fonts.mono,
                      }}>
                        {m.score}
                      </span>
                      <span style={{
                        fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                        background: `${theme.colors.textMuted}10`, color: theme.colors.textSecondary,
                      }}>
                        {m.archetype}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast?.(`Call scheduled for ${m.name}`, 'success');
                          trackAction({ actionType: 'call', memberId: m.memberId, memberName: m.name });
                        }}
                        title="Call"
                        style={{
                          width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(34,197,94,0.2)',
                          background: 'rgba(34,197,94,0.08)', color: '#16a34a', fontSize: 13,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {'\uD83D\uDCDE'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast?.(`Email drafted for ${m.name}`, 'success');
                          trackAction({ actionType: 'email', memberId: m.memberId, memberName: m.name });
                        }}
                        title="Email"
                        style={{
                          width: 28, height: 28, borderRadius: '50%', border: `1px solid ${theme.colors.info500}30`,
                          background: `${theme.colors.info500}08`, color: theme.colors.info500, fontSize: 13,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {'\u2709\uFE0F'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast?.(`SMS sent to ${m.name}`, 'success');
                          trackAction({ actionType: 'sms', memberId: m.memberId, memberName: m.name });
                        }}
                        title="SMS"
                        style={{
                          width: 28, height: 28, borderRadius: '50%', border: `1px solid ${theme.colors.accent}30`,
                          background: `${theme.colors.accent}08`, color: theme.colors.accent, fontSize: 13,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {'\uD83D\uDCF1'}
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Reason */}
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginBottom: 4, lineHeight: 1.4, paddingLeft: 30 }}>
                    {m.reason}
                  </div>

                  {/* Row 3: Owner + Differentiated action */}
                  <div style={{ fontSize: theme.fontSize.xs, fontWeight: 600, paddingLeft: 30, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {m.owner && (
                      <span style={{
                        fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                        background: `${theme.colors.accent}10`, color: theme.colors.accent,
                        textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
                      }}>
                        {m.owner}
                      </span>
                    )}
                    <span style={{ color: actionColor }}>{m.action}</span>
                  </div>
                </div>

                {/* Expanded: Quick Actions */}
                {isExpanded && (
                  <div style={{
                    padding: theme.spacing.md, background: theme.colors.bgDeep,
                    borderRadius: `0 0 ${theme.radius.md} ${theme.radius.md}`,
                    border: `1px solid ${theme.colors.border}`, borderTop: 'none',
                    marginTop: -1,
                  }}>
                    <QuickActions memberName={m.name} memberId={m.memberId} context={m.topRisk || m.signal} archetype={m.archetype} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {allPriorityMembers.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            style={{
              marginTop: 10, padding: '8px 16px', fontSize: theme.fontSize.xs,
              fontWeight: 600, color: theme.colors.accent, background: 'none',
              border: `1px solid ${theme.colors.accent}30`, borderRadius: theme.radius.sm,
              cursor: 'pointer', width: '100%', textAlign: 'center',
            }}
          >
            {showAll ? 'Show top 5 only' : `View all ${allPriorityMembers.length} at-risk members →`}
          </button>
        )}
      </div>

      {/* New Members in 90-Day Window */}
      {(() => {
        const newMembers = allPriorityMembers.filter(m => m.archetype === 'New Member');
        if (newMembers.length === 0) return null;
        // Simulated day counts and milestones for new members
        const newMemberData = newMembers.map((m, i) => {
          const dayIn = [35, 23, 60, 45, 17][i] || 30;
          return {
            ...m,
            dayIn,
            milestones: {
              firstRound: m.score > 30,
              firstDining: m.score > 40,
              firstEvent: false,
              metMembers: m.score > 50,
            },
          };
        });
        const MILESTONES = [
          { key: 'firstRound', label: 'First round' },
          { key: 'firstDining', label: 'First dining' },
          { key: 'firstEvent', label: 'First event' },
          { key: 'metMembers', label: 'Met 3+ members' },
        ];
        return (
          <div style={{
            background: `${theme.colors.info}06`, border: `1px solid ${theme.colors.info}20`,
            borderRadius: theme.radius.md, padding: '14px 18px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.info, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                New Members (First 90 Days)
              </div>
              <button
                onClick={() => navigate('members', { mode: 'cohorts' })}
                style={{ fontSize: theme.fontSize.xs, color: theme.colors.info, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', padding: 0 }}
              >
                {newMembers.length} member{newMembers.length !== 1 ? 's' : ''} in integration window →
              </button>
            </div>
            {newMemberData.map(m => {
              const completed = MILESTONES.filter(ms => m.milestones[ms.key]).length;
              return (
                <div key={m.memberId} style={{ padding: '8px 0', borderTop: `1px solid ${theme.colors.info}10` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <MemberLink memberId={m.memberId} mode="drawer" style={{ fontWeight: 600, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>
                      {m.name}
                    </MemberLink>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${scoreColor(m.score)}15`, color: scoreColor(m.score), fontFamily: theme.fonts.mono }}>
                      {m.score}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${theme.colors.info}12`, color: theme.colors.info, fontFamily: theme.fonts.mono }}>
                      Day {m.dayIn} of 90
                    </span>
                    <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: `${theme.colors.accent}10`, color: theme.colors.accent, textTransform: 'uppercase', marginLeft: 'auto' }}>
                      {m.owner || 'Membership Director'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, paddingLeft: 2 }}>
                    {MILESTONES.map(ms => (
                      <span key={ms.key} style={{
                        fontSize: '10px', padding: '2px 8px', borderRadius: 4,
                        background: m.milestones[ms.key] ? `${theme.colors.success}12` : `${theme.colors.textMuted}08`,
                        color: m.milestones[ms.key] ? theme.colors.success : theme.colors.textMuted,
                        fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        {m.milestones[ms.key] ? '✓' : '○'} {ms.label}
                      </span>
                    ))}
                    <span style={{ fontSize: '10px', color: theme.colors.textMuted, marginLeft: 'auto' }}>
                      {completed}/4 milestones
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Member Health Trend chart */}
      <TrendChart
        title="Member Health Trend — avg score + members needing attention"
        subtitle="Tracking engagement health across the membership"
        seriesKeys={[
          { key: 'memberHealthAvg',   color: theme.colors.textPrimary, label: 'Avg Health Score' },
          { key: 'atRiskMemberCount', color: theme.colors.urgent,  label: 'Members Needing Attention' },
        ]}
        format="number"
      />
    </div>
  );
}
