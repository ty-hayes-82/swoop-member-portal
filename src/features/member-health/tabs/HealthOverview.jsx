// HealthOverview — unified "Members Needing Attention" view
// V5: compact table replacing card-style rows; stat cards removed
import { Fragment, useMemo, useState } from 'react';
import MemberLink from '@/components/MemberLink.jsx';
import TrendChart from '@/components/charts/TrendChart.jsx';
import { getHealthDistribution, getAtRiskMembers, getWatchMembers, getVolatileMembers, getMemberSummary } from '@/services/memberService';
import { getComplaintCorrelation } from '@/services/staffingService';
import DataEmptyState from '@/components/ui/DataEmptyState';
import { isGateOpen } from '@/services/demoGate';
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

const OWNER_COLORS = {
  'GM': '#6366f1',
  'Membership Director': '#f59e0b',
  'Pro Shop': '#22c55e',
  'Events Coordinator': '#8b5cf6',
  'F&B Director': '#3b82f6',
  'Front Desk': '#06b6d4',
};

const ARCHETYPE_COLORS = {
  'Declining': '#ef4444',
  'Ghost': '#9CA3AF',
  'Weekend Warrior': '#3b82f6',
  'Die-Hard Golfer': '#22c55e',
  'Social Butterfly': '#8b5cf6',
  'New Member': '#2563eb',
  'Snowbird': '#06b6d4',
  'Balanced Active': '#22c55e',
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
  switch (member.archetype) {
    case 'Ghost':
      return { action: 'GM personal call — re-engagement conversation', type: 'ghost', owner: 'GM' };
    case 'Declining':
      return { action: 'Membership Director outreach — identify root cause of declining activity', type: 'declining', owner: 'Membership Director' };
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
  for (const m of atRisk) {
    if (!seen.has(m.memberId)) { seen.add(m.memberId); all.push({ ...m, score: m.score, tier: 'at-risk' }); }
  }
  for (const m of volatileMembers) {
    if (!seen.has(m.memberId)) { seen.add(m.memberId); all.push({ ...m, score: m.score, tier: 'volatile' }); }
  }
  for (const m of watchList) {
    if (!seen.has(m.memberId)) { seen.add(m.memberId); all.push({ ...m, score: m.score, tier: 'watch' }); }
  }
  return all
    .map(m => {
      const complaint = getComplaintInfo(m.memberId);
      const score = m.score ?? 50;
      const isNewMember = m.archetype === 'New Member';
      const priorityScore = (100 - score) + (complaint ? 20 : 0) + (score < 30 ? 15 : 0) + (isNewMember ? 10 : 0);
      const reason = complaint
        ? `Complaint unresolved ${complaint.days} days (${complaint.category})`
        : m.topRisk || m.signal || 'Health score declining';
      const { action, type, owner } = getDifferentiatedAction(m, complaint);
      return { ...m, priorityScore, reason, action, actionType: type, owner };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export default function HealthOverview() {
  const dist = getHealthDistribution();
  const atRisk = getAtRiskMembers();
  const watchList = getWatchMembers();
  const volatileMembers = getVolatileMembers();
  const [expandedId, setExpandedId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const { showToast } = useApp();
  const { navigate } = useNavigation();

  if (atRisk.length === 0 && watchList.length === 0) {
    const summary = getMemberSummary();
    if (summary.total > 0) {
      const hasTee = isGateOpen('tee-sheet');
      const hasFb = isGateOpen('fb');
      const hasEmail = isGateOpen('email');
      const nextSource = !hasTee ? 'tee sheet' : !hasFb ? 'POS' : !hasEmail ? 'email' : null;
      const desc = nextSource
        ? `${summary.total} members imported${hasTee ? ' + tee sheet' : ''}${hasFb ? ' + POS' : ''}${hasEmail ? ' + email' : ''}. Connect your ${nextSource} to unlock deeper risk scoring.`
        : `${summary.total} members imported with all engagement sources connected. No members currently at risk.`;
      return <DataEmptyState icon="✅" title="No members at risk" description={desc} dataType="engagement data" />;
    }
    return <DataEmptyState icon="👥" title="No members imported yet" description="Import your member roster to start tracking member health and engagement." dataType="members" />;
  }

  const allPriorityMembers = useMemo(
    () => buildPriorityList(atRisk, watchList, volatileMembers),
    [atRisk, watchList, volatileMembers]
  );
  const priorityMembers = showAll ? allPriorityMembers : allPriorityMembers.slice(0, 5);

  const scoreColor = (score) =>
    score < 20 ? '#ef4444'
    : score < 30 ? '#f97316'
    : score < 50 ? '#f59e0b'
    : '#6B7280';

  return (
    <div className="flex flex-col gap-6">
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
                <span className="text-xs" style={{ color: d.color }}>{(d.percentage * 100).toFixed(0)}%</span>
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

      {/* Members Needing Attention — compact table */}
      <div>
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <div>
            <div className="text-[11px] font-bold text-error-500 uppercase tracking-wider mb-0.5">Members Needing Attention</div>
            <div className="text-xs text-gray-400">Priority-sorted by health score, complaints, and engagement signals</div>
          </div>
          {priorityMembers.length > 0 && (
            <div className="flex items-center gap-2">
              {bulkConfirm && (
                <button
                  type="button"
                  onClick={() => setBulkConfirm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border border-gray-200 bg-transparent text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!bulkConfirm) { setBulkConfirm(true); return; }
                  setBulkConfirm(false);
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
                  if (showToast) showToast(`Approved outreach for ${priorityMembers.length} members — added to Automations inbox.`, 'success');
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 ${bulkConfirm ? 'bg-success-600 text-white hover:bg-success-700' : 'bg-success-500 text-white hover:bg-success-600'}`}
              >
                {bulkConfirm ? `Confirm — approve all ${priorityMembers.length} →` : `Approve all ${priorityMembers.length} →`}
              </button>
            </div>
          )}
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-[10px] text-gray-400 font-medium text-left w-8">#</th>
                <th className="px-3 py-2 text-[10px] text-gray-400 font-medium text-left">Member</th>
                <th className="px-3 py-2 text-[10px] text-gray-400 font-medium text-left w-24">Score</th>
                <th className="px-3 py-2 text-[10px] text-gray-400 font-medium text-left w-28 hidden sm:table-cell">Archetype</th>
                <th className="px-3 py-2 text-[10px] text-gray-400 font-medium text-left hidden md:table-cell">Signal</th>
                <th className="px-3 py-2 text-[10px] text-gray-400 font-medium text-left w-36 hidden sm:table-cell">Assign To</th>
                <th className="px-3 py-2 text-[10px] text-gray-400 font-medium text-center w-12">Alerts</th>
              </tr>
            </thead>
            <tbody>
              {priorityMembers.map((m, idx) => {
                const sc = scoreColor(m.score);
                const isExpanded = expandedId === m.memberId;
                const hasEmailDecay = m.actionType === 'email' || (m.reason || '').toLowerCase().includes('email');
                const ownerColor = OWNER_COLORS[m.owner] || '#6b7280';
                const archetypeColor = ARCHETYPE_COLORS[m.archetype] || '#6b7280';
                const rowBg = isExpanded ? 'bg-indigo-50/40 dark:bg-indigo-500/5' : idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-50';

                return (
                  <Fragment key={m.memberId}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : m.memberId)}
                      className={`border-t border-gray-200 cursor-pointer transition-all duration-150 ${rowBg}`}
                    >
                      <td className="px-3 py-2.5 text-[11px] font-mono font-bold text-center">
                        {isExpanded
                          ? <span className="text-brand-500 text-[10px]">▼</span>
                          : <span className="text-gray-400">{idx + 1}</span>}
                      </td>
                      <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                        <MemberLink memberId={m.memberId} mode="drawer" className="font-semibold text-sm text-[#1a1a2e] hover:text-brand-500 transition-colors">
                          {m.name}
                        </MemberLink>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold font-mono px-1.5 py-0.5 rounded shrink-0" style={{ color: sc, background: sc + '15' }}>
                            {m.score}
                          </span>
                          <div className="flex-1 h-[3px] bg-gray-100 rounded-full min-w-[24px] max-w-[40px]">
                            <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.min(100, m.score)}%`, background: sc }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 hidden sm:table-cell">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap" style={{ color: archetypeColor, background: archetypeColor + '18' }}>
                          {m.archetype}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500 max-w-[260px] hidden md:table-cell">
                        <span className="line-clamp-1">{m.reason}</span>
                      </td>
                      <td className="px-3 py-2.5 hidden sm:table-cell">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap" style={{ color: ownerColor, background: ownerColor + '18' }}>
                          {m.owner}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {hasEmailDecay && (
                          <div className="relative group inline-flex justify-center">
                            <span className="text-sm cursor-default select-none">✉</span>
                            <div className="hidden group-hover:block absolute right-0 top-full mt-1 z-10 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg shadow-xl pointer-events-none">
                              <div className="font-bold mb-1 text-yellow-300">⚠ Email Decay Alert</div>
                              <div>Open {m.name.split(' ')[0]}&apos;s profile to view email engagement trend and take action.</div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-gray-50 dark:bg-gray-800/30">
                        <td colSpan={7} className="px-6 py-3 border-t border-gray-100">
                          <div className="flex gap-8 flex-wrap items-start mb-3">
                            <div>
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Signal</div>
                              <div className="text-xs text-gray-600 dark:text-gray-300 max-w-sm">{m.reason}</div>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Recommended Action</div>
                              <div className="text-xs text-gray-600 dark:text-gray-300 max-w-sm">{m.action}</div>
                              <span className="mt-1.5 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: ownerColor, background: ownerColor + '18' }}>
                                {m.owner}
                              </span>
                            </div>
                          </div>
                          <div onClick={e => e.stopPropagation()}>
                            <MemberLink
                              memberId={m.memberId}
                              mode="drawer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-500 hover:underline cursor-pointer"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" x2="21" y1="14" y2="3" />
                              </svg>
                              Open member profile
                            </MemberLink>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {allPriorityMembers.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-2 px-4 py-2 text-xs font-semibold text-brand-500 bg-transparent border border-brand-500/20 rounded-lg cursor-pointer w-full text-center hover:bg-brand-500/5 transition-colors"
          >
            {showAll ? 'Show top 5 only' : `View all ${allPriorityMembers.length} at-risk members \u2192`}
          </button>
        )}
      </div>

      {/* New Members in 90-Day Window */}
      {(() => {
        const newMembers = allPriorityMembers.filter(m => m.archetype === 'New Member');
        if (newMembers.length === 0) return null;
        const newMemberData = newMembers.map((m, i) => {
          const dayIn = [35, 23, 60, 45, 17][i] || 30;
          return {
            ...m, dayIn,
            milestones: { firstRound: m.score > 30, firstDining: m.score > 40, firstEvent: false, metMembers: m.score > 50 },
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
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">New Members (First 90 Days)</div>
              <button
                onClick={() => navigate('members', { mode: 'cohorts' })}
                className="text-xs text-blue-600 bg-transparent border-none cursor-pointer font-semibold underline p-0 focus-visible:ring-2 focus-visible:ring-brand-500"
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
                    <span className="text-[10px] text-gray-400 ml-auto">{completed}/4 milestones</span>
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
