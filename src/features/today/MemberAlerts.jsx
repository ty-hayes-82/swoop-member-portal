// MemberAlerts — Top 5 priority members needing attention this week
// Uses live API data from memberService (not static demo data)
import { useState } from 'react';
import { getAtRiskMembers, getWatchMembers } from '@/services/memberService';
import { getDailyBriefing } from '@/services/briefingService';
import { getComplaintCorrelation } from '@/services/staffingService';
import MemberLink from '@/components/MemberLink';
import { useNavigation } from '@/context/NavigationContext';
import SourceBadge from '@/components/ui/SourceBadge';
import { trackAction } from '@/services/activityService';
import AgentUpsell from '@/components/ui/AgentUpsell';

// Mirrors TeeSheetView.healthLabel so the same member reads consistently
// across Today and Tee Sheet (bug #32).
const healthTierLabel = (score) => {
  if (score >= 70) return 'Healthy';
  if (score >= 50) return 'Watch';
  if (score >= 30) return 'At Risk';
  return 'Critical';
};

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

function getComplaintDays(memberId) {
  const records = getComplaintCorrelation();
  const complaint = records.find(
    f => f.memberId === memberId && f.status !== 'resolved'
  );
  if (!complaint) return null;
  const days = Math.round((Date.now() - new Date(complaint.date || complaint.reported_at).getTime()) / (1000 * 60 * 60 * 24));
  return { days: Math.max(0, days), category: complaint.category };
}

// Pass through risk signal text (services now return data-driven signals)
function filterRiskSignal(text) {
  return text || null;
}

function buildPriorityList() {
  const atRisk = getAtRiskMembers();
  const watch = getWatchMembers();

  const all = [
    ...atRisk.map(m => ({ ...m, tier: 'at-risk' })),
    ...watch.map(m => ({ ...m, tier: 'watch' })),
  ];

  if (all.length === 0) return [];

  return all
    .map(m => {
      const memberId = m.memberId || m.member_id;
      const name = m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim();
      const score = m.score ?? m.healthScore ?? 50;
      const archetype = m.archetype || 'Unknown';
      const complaint = getComplaintDays(memberId);
      const hasComplaint = !!complaint;
      const isNewMember = archetype === 'New Member';
      const priorityScore =
        (100 - score) +
        (hasComplaint ? 20 : 0) +
        (score < 40 ? 15 : 0) +
        (isNewMember ? 10 : 0);

      let reason, action, owner;
      if (hasComplaint) {
        reason = `Complaint unresolved ${complaint.days} days (${complaint.category})`;
        action = `Schedule GM call — complaint unresolved ${complaint.days} days`;
        owner = complaint.days > 14 ? 'GM' : (ACTION_OWNERS[archetype] || 'GM');
      } else if (archetype === 'Ghost') {
        reason = filterRiskSignal(m.topRisk) || filterRiskSignal(m.signal) || 'Engagement fully lapsed';
        action = 'GM personal call — re-engagement conversation';
        owner = 'GM';
      } else if (archetype === 'Declining') {
        reason = filterRiskSignal(m.topRisk) || filterRiskSignal(m.signal) || 'Activity declining';
        action = 'Membership Director outreach — identify root cause';
        owner = 'Membership Director';
      } else if (archetype === 'Weekend Warrior') {
        reason = filterRiskSignal(m.topRisk) || filterRiskSignal(m.signal) || 'Engagement frequency declining';
        action = 'Priority Saturday tee time offer';
        owner = 'Pro Shop';
      } else if (archetype === 'Die-Hard Golfer') {
        reason = filterRiskSignal(m.topRisk) || filterRiskSignal(m.signal) || 'Activity declining';
        action = 'Pro shop outreach — check equipment/injury/schedule';
        owner = 'Pro Shop';
      } else if (archetype === 'Social Butterfly') {
        reason = filterRiskSignal(m.topRisk) || filterRiskSignal(m.signal) || 'Event engagement dropping';
        action = 'Invite to upcoming wine dinner or social event';
        owner = 'Events Coordinator';
      } else if (isNewMember) {
        reason = filterRiskSignal(m.topRisk) || filterRiskSignal(m.signal) || 'No habits forming in first 60 days';
        action = 'New member integration check-in — identify engagement gaps';
        owner = 'Membership Director';
      } else if (archetype === 'Snowbird') {
        reason = filterRiskSignal(m.topRisk) || filterRiskSignal(m.signal) || 'Seasonal return expected — no reactivation';
        action = 'Send welcome-back package';
        owner = 'Front Desk';
      } else {
        reason = filterRiskSignal(m.topRisk) || filterRiskSignal(m.signal) || 'Health score declining';
        action = m.action || 'Personalized outreach based on engagement pattern';
        owner = ACTION_OWNERS[archetype] || 'Membership Director';
      }

      const duesAnnual = m.duesAnnual || m.dues_annual || m.dues || 0;
      const roundsTrend = m.roundsTrend || null;
      return { memberId, name, score, archetype, priorityScore, reason, action, owner, duesAnnual, roundsTrend };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 5);
}

const ARCHETYPE_COLORS = {
  'Die-Hard Golfer': '#12b76a',
  'Social Butterfly': '#2563eb',
  'Balanced Active': '#ff8b00',
  'Weekend Warrior': '#f59e0b',
  'Declining': '#ef4444',
  'New Member': '#3B82F6',
  'Ghost': '#9CA3AF',
  'Snowbird': '#6B7280',
};

function getTeeTimeForMember(memberId) {
  const briefing = getDailyBriefing();
  const atRiskTeetimes = briefing?.todayRisks?.atRiskTeetimes;
  if (!Array.isArray(atRiskTeetimes)) return null;
  return atRiskTeetimes.find(t => t.memberId === memberId) || null;
}

export default function MemberAlerts() {
  const { navigate } = useNavigation();
  const members = buildPriorityList();
  const [bulkApproved, setBulkApproved] = useState(false);

  const handleBulkApprove = () => {
    if (members.length === 0) return;
    const totalDues = members.reduce((s, m) => s + (m.duesAnnual || 0), 0);
    const proceed = window.confirm(
      `Approve recommended outreach for all ${members.length} priority members?` +
      (totalDues > 0 ? `\n\nProtects $${totalDues.toLocaleString()}/yr in dues.` : '')
    );
    if (!proceed) return;
    members.forEach(m => {
      trackAction({
        actionType: 'approve',
        actionSubtype: 'bulk_outreach',
        memberId: m.memberId,
        memberName: m.name,
        referenceType: 'priority_member',
        referenceId: `bulk_today_${m.memberId}`,
        description: `Bulk approved (Today): ${m.action}`,
      });
    });
    setBulkApproved(true);
  };

  if (members.length === 0) {
    return (
      <div className="alerts-section-enhanced fade-in-up fade-delay-1">
        <div className="alerts-header">Priority Member Alerts</div>
        <div className="alerts-empty" style={{ flexWrap: 'wrap' }}>
          <div className="alerts-empty-icon">✅</div>
          <div style={{ flex: '1 1 0%', minWidth: 200 }}>
            <div className="alerts-empty-title">All Members in Good Standing</div>
            <div className="alerts-empty-desc">No at-risk members detected. Import member data and engagement sources to activate priority alerts.</div>
          </div>
          <button className="alerts-cta" onClick={() => navigate('integrations/csv-import', { category: 'members' })}>📥 Import Member Data</button>
        </div>
      </div>
    );
  }

  return (
    <div id="today-member-alerts" className="alerts-section-enhanced fade-in-up fade-delay-1" data-section="member-alerts">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="alerts-header" style={{ color: '#ef4444', margin: 0 }}>
            Priority Member Alerts
          </div>
          <div className="flex gap-1 flex-wrap">
            <SourceBadge system="Member CRM" size="xs" />
            <SourceBadge system="Analytics" size="xs" />
            <SourceBadge system="Complaint Log" size="xs" />
          </div>
        </div>
        {members.length > 0 && (
          <button
            type="button"
            onClick={handleBulkApprove}
            disabled={bulkApproved}
            className={`px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer border-none whitespace-nowrap focus-visible:ring-2 focus-visible:ring-brand-500 ${
              bulkApproved
                ? 'bg-success-100 text-success-700 cursor-default'
                : 'bg-success-500 text-white hover:bg-success-600'
            }`}
          >
            {bulkApproved ? '✓ All approved' : `Approve all ${members.length} →`}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {members.map((m) => {
          const scoreColor = m.score < 30 ? '#ef4444'
            : m.score < 50 ? '#f59e0b'
            : '#6B7280';
          const arcColor = ARCHETYPE_COLORS[m.archetype] || '#9CA3AF';
          const teeTime = getTeeTimeForMember(m.memberId);

          return (
            <div
              key={m.memberId}
              className={`py-3 px-4 border rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-px ${
                bulkApproved
                  ? 'bg-success-50 dark:bg-success-500/5 border-success-200 dark:border-success-800 opacity-60'
                  : 'bg-white dark:bg-white/[0.03] border-gray-200 dark:border-gray-800'
              }`}
              style={{ borderLeft: `3px solid ${bulkApproved ? '#12b76a' : scoreColor}` }}
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
                    {m.score} · {healthTierLabel(m.score)}
                  </span>
                  <span
                    className="text-[10px] font-semibold py-0.5 px-2 rounded-[10px]"
                    style={{ background: `${arcColor}12`, color: arcColor }}
                  >
                    {m.archetype}
                  </span>
                  {m.duesAnnual > 0 && (
                    <span
                      className="text-[10px] font-mono font-bold py-0.5 px-2 rounded-[10px]"
                      style={{
                        background: m.score < 50 ? '#fef2f2' : '#fef3c7',
                        color: m.score < 50 ? '#b91c1c' : '#b45309',
                      }}
                      title={`$${m.duesAnnual.toLocaleString()}/yr ${m.score < 50 ? 'at risk' : 'in dues'}`}
                    >
                      ${Math.round(m.duesAnnual / 1000)}K{m.score < 50 ? ' at risk' : '/yr'}
                    </span>
                  )}
                  {teeTime && (
                    <span
                      className="text-[10px] font-bold py-0.5 px-2 rounded-[10px] uppercase tracking-wide"
                      style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                    >
                      Tees off at {teeTime.time}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-1 leading-snug flex items-center gap-2">
                <span>{m.reason}</span>
                {m.roundsTrend?.length > 0 && (
                  <span className="inline-flex items-end gap-px shrink-0" title={m.roundsTrend.map(t => `${t.month}: ${t.rounds}`).join(' → ')}>
                    {m.roundsTrend.map((t, i) => {
                      const max = Math.max(...m.roundsTrend.map(r => r.rounds), 1);
                      const h = Math.max(Math.round((t.rounds / max) * 16), 2);
                      return <span key={i} style={{ width: 4, height: h, borderRadius: 1, background: i === m.roundsTrend.length - 1 ? '#ef4444' : '#d1d5db' }} />;
                    })}
                  </span>
                )}
              </div>
              <div className="text-xs font-semibold flex items-center gap-2">
                {m.owner && (
                  <span className={`text-[9px] font-bold py-0.5 px-1.5 rounded uppercase tracking-tight shrink-0 ${
                    bulkApproved ? 'bg-success-500/[0.06] text-success-500' : 'bg-brand-500/[0.06] text-brand-500'
                  }`}>
                    {m.owner}
                  </span>
                )}
                <span className={bulkApproved ? 'text-success-500 line-through' : 'text-brand-500'}>
                  {bulkApproved && '✓ '}{m.action}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <AgentUpsell
        agentName="Member Risk Agent"
        benefit="Would have flagged James Whitfield 6 weeks before resignation."
        className="mt-3"
      />

      <button
        onClick={() => navigate('members')}
        className="mt-2.5 py-2 px-4 text-xs font-semibold text-brand-500 bg-transparent border border-brand-500/20 rounded-lg cursor-pointer w-full text-center"
      >
        View all members →
      </button>
    </div>
  );
}
