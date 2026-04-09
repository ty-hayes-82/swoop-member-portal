// HealthOverview — unified "Members Needing Attention" view
// V4: Single priority-sorted list replacing 5 overlapping sections
import MemberLink from '@/components/MemberLink.jsx';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge.jsx';
import QuickActions from '@/components/ui/QuickActions.jsx';
import ActionPanel from '@/components/ui/ActionPanel.jsx';
import TrendChart from '@/components/charts/TrendChart.jsx';
import { getHealthDistribution, getAtRiskMembers, getWatchMembers, getVolatileMembers, getMemberSummary } from '@/services/memberService';
import { getComplaintCorrelation } from '@/services/staffingService';
import { getMemberSaves } from '@/services/boardReportService';
import { isAuthenticatedClub } from '@/config/constants';
import DataEmptyState from '@/components/ui/DataEmptyState';
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
  complaint: '#ef4444',
  email: '#f59e0b',
  golf: '#ff8b00',
  dining: '#3B82F6',
  'new-member': '#2563eb',
  ghost: '#9CA3AF',
  declining: '#ef4444',
  social: '#8b5cf6',
  snowbird: '#2563eb',
  general: '#ff8b00',
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
  if (atRisk.length === 0 && watchList.length === 0) {
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
    score < 30 ? '#ef4444'
    : score < 50 ? '#f59e0b'
    : '#6B7280';

  // Pillar 3 PROVE IT — dollar exposure and saves rollup
  const summaryForKpi = getMemberSummary();
  const totalAtRiskCount = atRisk.length;
  const totalDuesAtRisk = (atRisk || []).reduce(
    (sum, m) => sum + (m.duesAnnual || m.dues_annual || m.dues || 0),
    0
  );
  const savesThisMonth = getMemberSaves() || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Pillar 3 PROVE IT — dollar exposure & saves rollup */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 dark:bg-white/[0.03] dark:border-gray-800">
          <div className="text-[10px] font-bold uppercase tracking-wide text-error-500">Members at Risk</div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white/90 font-mono mt-1">{totalAtRiskCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">priority outreach needed</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 dark:bg-white/[0.03] dark:border-gray-800">
          <div className="text-[10px] font-bold uppercase tracking-wide text-error-500">Dues at Risk</div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white/90 font-mono mt-1">
            ${totalDuesAtRisk > 0 ? totalDuesAtRisk.toLocaleString() : (summaryForKpi.potentialDuesAtRisk || 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">annual dues exposure</div>
        </div>
        <button
          type="button"
          onClick={() => navigate('board-report', { tab: 1 })}
          className="bg-white border border-gray-200 rounded-xl p-4 dark:bg-white/[0.03] dark:border-gray-800 cursor-pointer text-left hover:border-success-500 hover:shadow-md transition-all"
          title="View Member Saves in Board Report"
        >
          <div className="text-[10px] font-bold uppercase tracking-wide text-success-500">Saves This Month →</div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white/90 font-mono mt-1">{savesThisMonth.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">retained through intervention</div>
        </button>
      </div>

      {/* Health Distribution KPI Cards */}
      <div className="grid-responsive-4">
        {dist.map((d) => {
          const delta = Number.isFinite(d?.delta) ? d.delta : 0;
          const descriptor = levelDescriptions[d.level] ?? 'are in this state';
          const deltaColor = delta > 0 ? '#ef4444' : delta < 0 ? '#12b76a' : '#9CA3AF';
          const deltaCopy = delta === 0
            ? 'same as last month.'
            : `${Math.abs(delta)} ${delta > 0 ? 'more' : 'fewer'} than last month.`;
          return (
            <div key={d.level} className="bg-white shadow-theme-xs rounded-xl p-4" style={{ border: `1px solid ${d.color}40` }}>
              <div className="flex justify-between mb-2">
                <span className="text-xs text-gray-400 uppercase tracking-wide">{d.level}</span>
                <span className="text-xs" style={{ color: d.color }}>
                  {(d.percentage * 100).toFixed(0)}%
                </span>
              </div>
              <div className="text-[28px] font-mono font-bold" style={{ color: d.color }}>{d.count}</div>
              <div className="text-xs text-gray-400">members</div>
              <div className="h-1 bg-gray-200 rounded-sm mt-2">
                <div className="h-full rounded-sm" style={{ background: d.color, width: `${d.percentage * 100}%` }} />
              </div>
              <div className="mt-2 text-xs text-gray-500 leading-snug">
                <strong>{d.count} members</strong> {descriptor} —{' '}
                <span style={{ color: deltaColor }}>{deltaCopy}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Members Needing Attention — single priority list */}
      <div>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div>
            <div className="text-[11px] font-bold text-error-500 uppercase tracking-wider mb-1">
              Members Needing Attention
            </div>
            <div className="text-xs text-gray-400">
              Priority-sorted by health score, complaints, and engagement signals
            </div>
          </div>
          {/* Bulk approve — Pillar 2: FIX IT */}
          {priorityMembers.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const totalDues = priorityMembers.reduce((s, m) => s + (m.duesAnnual || 0), 0);
                const proceed = window.confirm(
                  `Approve recommended outreach for all ${priorityMembers.length} priority members?` +
                  (totalDues > 0 ? `\n\nProtects $${totalDues.toLocaleString()}/yr in dues.` : '')
                );
                if (!proceed) return;
                priorityMembers.forEach(m => {
                  trackAction({
                    actionType: 'approve',
                    actionSubtype: 'bulk_outreach',
                    memberId: m.memberId,
                    memberName: m.name,
                    referenceType: 'priority_member',
                    referenceId: `bulk_${m.memberId}`,
                    description: `Bulk approved: ${m.action}`,
                  });
                });
                if (showToast) {
                  showToast({ type: 'success', message: `Approved outreach for ${priorityMembers.length} members.` });
                }
              }}
              className="px-4 py-2 rounded-lg bg-success-500 text-white text-xs font-semibold cursor-pointer border-none whitespace-nowrap hover:bg-success-600"
            >
              Approve all {priorityMembers.length} →
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {priorityMembers.map((m, idx) => {
            const sc = scoreColor(m.score);
            const actionColor = ACTION_TYPE_COLORS[m.actionType] || '#ff8b00';
            const isExpanded = expandedId === m.memberId;

            // Build contextual recommendations based on member's situation
            const memberRecommended = [];
            if (m.actionType === 'complaint') {
              memberRecommended.push({ key: 'escalate', icon: '🔺', label: 'Escalate to GM', type: 'staff_task', description: m.reason });
              memberRecommended.push({ key: 'recovery', icon: '✉', label: 'Send Recovery Email', type: 'email', description: 'Acknowledge complaint and offer resolution' });
            } else if (m.actionType === 'ghost') {
              memberRecommended.push({ key: 'call', icon: '📞', label: 'GM Personal Call', type: 'call', description: 'Re-engagement conversation' });
              memberRecommended.push({ key: 'email', icon: '✉', label: 'Send Personal Email', type: 'email', description: 'Warm outreach from GM' });
            } else if (m.actionType === 'golf') {
              memberRecommended.push({ key: 'sms', icon: '💬', label: 'Send Tee Time Offer', type: 'sms', description: m.action });
              memberRecommended.push({ key: 'call', icon: '📞', label: 'Pro Shop Check-in Call', type: 'call', description: 'Equipment/schedule check' });
            } else if (m.actionType === 'social') {
              memberRecommended.push({ key: 'email', icon: '✉', label: 'Send Event Invitation', type: 'email', description: m.action });
              memberRecommended.push({ key: 'sms', icon: '💬', label: 'Personal Event Nudge', type: 'sms', description: 'Quick text about upcoming event' });
            } else if (m.actionType === 'new-member') {
              memberRecommended.push({ key: 'call', icon: '📞', label: 'Integration Check-in Call', type: 'call', description: m.action });
              memberRecommended.push({ key: 'email', icon: '✉', label: 'Welcome Follow-up Email', type: 'email', description: 'Personalized onboarding content' });
            } else if (m.actionType === 'snowbird') {
              memberRecommended.push({ key: 'email', icon: '✉', label: 'Send Welcome-Back Package', type: 'email', description: m.action });
              memberRecommended.push({ key: 'sms', icon: '💬', label: 'Tee Time Reservation Text', type: 'sms', description: 'Reserve preferred tee time' });
            } else {
              memberRecommended.push({ key: 'email', icon: '✉', label: 'Send Personal Email', type: 'email', description: m.action });
              memberRecommended.push({ key: 'call', icon: '📞', label: 'Schedule Call', type: 'call', description: `Follow up with ${m.name}` });
            }

            return (
              <div key={m.memberId}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : m.memberId)}
                  className="px-[18px] py-[14px] bg-white border border-gray-200 rounded-xl cursor-pointer transition-all duration-150 hover:shadow-theme-md hover:-translate-y-px"
                  style={{ borderLeft: `3px solid ${sc}` }}
                >
                  {/* Row 1: Name + badges + expand indicator */}
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-gray-400 font-mono w-5">
                        {idx + 1}
                      </span>
                      <MemberLink memberId={m.memberId} mode="drawer" className="font-bold text-sm text-[#1a1a2e]">
                        {m.name}
                      </MemberLink>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full font-mono" style={{ background: `${sc}15`, color: sc }}>
                        {m.score}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100/60 text-gray-500">
                        {m.archetype}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-brand-500">
                      {isExpanded ? '▾ Collapse' : '▸ Act'}
                    </span>
                  </div>

                  {/* Row 2: Reason */}
                  <div className="text-xs text-gray-500 mb-1 leading-snug pl-[30px]">
                    {m.reason}
                  </div>

                  {/* Row 3: Owner + Differentiated action */}
                  <div className="text-xs font-semibold pl-[30px] flex items-center gap-2">
                    {m.owner && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 uppercase tracking-tight shrink-0">
                        {m.owner}
                      </span>
                    )}
                    <span style={{ color: actionColor }}>{m.action}</span>
                  </div>
                </div>

                {/* Expanded: ActionPanel + QuickActions */}
                {isExpanded && (
                  <div className="bg-gray-100 rounded-b-xl border border-gray-200 border-t-0 -mt-px">
                    <ActionPanel
                      context={{
                        memberId: m.memberId,
                        memberName: m.name,
                        description: m.reason,
                        source: m.owner || 'Member Health',
                      }}
                      recommended={memberRecommended}
                      onClose={() => setExpandedId(null)}
                      compact
                    />
                    <div className="p-4 pt-2 border-t border-gray-200">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Full Actions</div>
                      <QuickActions memberName={m.name} memberId={m.memberId} context={m.topRisk || m.signal} archetype={m.archetype} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {allPriorityMembers.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-2.5 px-4 py-2 text-xs font-semibold text-brand-500 bg-transparent border border-brand-500/20 rounded-lg cursor-pointer w-full text-center hover:bg-brand-500/5 transition-colors"
          >
            {showAll ? 'Show top 5 only' : `View all ${allPriorityMembers.length} at-risk members \u2192`}
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
          <div className="bg-blue-600/[0.04] border border-blue-600/[0.13] rounded-xl px-[18px] py-[14px]">
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                New Members (First 90 Days)
              </div>
              <button
                onClick={() => navigate('members', { mode: 'cohorts' })}
                className="text-xs text-blue-600 bg-transparent border-none cursor-pointer font-semibold underline p-0"
              >
                {newMembers.length} member{newMembers.length !== 1 ? 's' : ''} in integration window {'\u2192'}
              </button>
            </div>
            {newMemberData.map(m => {
              const completed = MILESTONES.filter(ms => m.milestones[ms.key]).length;
              return (
                <div key={m.memberId} className="py-2 border-t border-blue-600/[0.06]">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <MemberLink memberId={m.memberId} mode="drawer" className="font-semibold text-sm text-[#1a1a2e]">
                      {m.name}
                    </MemberLink>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full font-mono" style={{ background: `${scoreColor(m.score)}15`, color: scoreColor(m.score) }}>
                      {m.score}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full font-mono bg-blue-600/[0.08] text-blue-600">
                      Day {m.dayIn} of 90
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 uppercase ml-auto">
                      {m.owner || 'Membership Director'}
                    </span>
                  </div>
                  <div className="flex gap-2 pl-0.5">
                    {MILESTONES.map(ms => (
                      <span key={ms.key} className={`text-[10px] px-2 py-0.5 rounded font-semibold flex items-center gap-1 ${m.milestones[ms.key] ? 'bg-success-500/[0.08] text-success-500' : 'bg-gray-400/[0.06] text-gray-400'}`}>
                        {m.milestones[ms.key] ? '\u2713' : '\u25CB'} {ms.label}
                      </span>
                    ))}
                    <span className="text-[10px] text-gray-400 ml-auto">
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
          { key: 'memberHealthAvg',   color: '#1a1a2e', label: 'Avg Health Score' },
          { key: 'atRiskMemberCount', color: '#ef4444',  label: 'Members Needing Attention' },
        ]}
        format="number"
      />
    </div>
  );
}
