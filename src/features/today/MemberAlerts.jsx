// MemberAlerts — Top 5 priority members needing attention this week
// Uses live API data from memberService (not static demo data)
import { useState, useEffect, useRef } from 'react';
import { getAtRiskMembers, getWatchMembers, getMemberSummary } from '@/services/memberService';
import { getDailyBriefing } from '@/services/briefingService';
import { getComplaintCorrelation } from '@/services/staffingService';
import { isGateOpen } from '@/services/demoGate';
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
        action = `Schedule GM call: complaint unresolved ${complaint.days} days`;
        owner = complaint.days > 14 ? 'GM' : (ACTION_OWNERS[archetype] || 'GM');
      } else if (archetype === 'Ghost') {
        reason = filterRiskSignal(m.topRisk) || filterRiskSignal(m.signal) || 'Email open rate dropped, golf rounds stopped, dining visits at zero';
        action = 'GM personal call: re-engagement conversation';
        owner = 'GM';
      } else if (archetype === 'Declining') {
        reason = filterRiskSignal(m.topRisk) || filterRiskSignal(m.signal) || 'Golf rounds dropped from 3 to 0 this month; F&B spend $0 last 30 days';
        action = 'Membership Director outreach: identify root cause';
        owner = 'Membership Director';
      } else if (archetype === 'Weekend Warrior') {
        reason = filterRiskSignal(m.topRisk) || filterRiskSignal(m.signal) || 'Engagement frequency declining';
        action = 'Priority Saturday tee time offer';
        owner = 'Pro Shop';
      } else if (archetype === 'Die-Hard Golfer') {
        reason = filterRiskSignal(m.topRisk) || filterRiskSignal(m.signal) || 'Round frequency dropped vs. 90-day baseline, tee sheet bookings sparse';
        action = 'Pro shop outreach: check equipment, injury, or schedule conflict';
        owner = 'Pro Shop';
      } else if (archetype === 'Social Butterfly') {
        reason = filterRiskSignal(m.topRisk) || filterRiskSignal(m.signal) || 'Event engagement dropping';
        action = 'Invite to upcoming wine dinner or social event';
        owner = 'Events Coordinator';
      } else if (isNewMember) {
        reason = filterRiskSignal(m.topRisk) || filterRiskSignal(m.signal) || 'No habits forming in first 60 days';
        action = 'New member integration check-in: identify engagement gaps';
        owner = 'Membership Director';
      } else if (archetype === 'Snowbird') {
        reason = filterRiskSignal(m.topRisk) || filterRiskSignal(m.signal) || 'Seasonal return expected: no reactivation detected';
        action = 'Send welcome-back package';
        owner = 'Front Desk';
      } else {
        reason = filterRiskSignal(m.topRisk) || filterRiskSignal(m.signal) || 'Golf and F&B activity both below 90-day average; email engagement softening';
        const memberDues = m.duesAnnual || m.dues_annual || m.dues || 0;
        action = m.action || (memberDues > 10000
          ? `GM personal call: high-value member ($${Math.round(memberDues / 1000)}K/yr) showing disengagement`
          : score < 45
          ? 'Membership Director outreach: score below 45 — schedule retention conversation'
          : 'Membership Director check-in: identify engagement gaps before next renewal');
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
  'Balanced Active': '#F3922D',
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

// Build a short draft message preview for the Approve tooltip
function buildDraftPreview(member) {
  const { name, archetype, reason, action } = member;
  const firstName = name.split(' ')[0];
  if (archetype === 'Ghost' || archetype === 'Declining') {
    return `Hi ${firstName}, we noticed you haven't been in recently. We'd love to connect and make sure everything is meeting your expectations. Can we schedule a quick call?`;
  }
  if (archetype === 'Die-Hard Golfer' || archetype === 'Weekend Warrior') {
    return `Hi ${firstName}, your Pro Shop team noticed you haven't had a round in a while. We have some prime tee times this weekend and wanted to reach out personally.`;
  }
  if (archetype === 'Social Butterfly') {
    return `Hi ${firstName}, we have an exclusive upcoming event we think you'd love. We wanted to personally reach out to make sure you had first access.`;
  }
  if (archetype === 'New Member') {
    return `Hi ${firstName}, you're in your first 90 days and we want to make sure you're getting the most from your membership. Can we schedule a quick welcome check-in?`;
  }
  return `Hi ${firstName}, your membership team flagged some changes in your engagement and wanted to personally reach out. We'd love to make sure everything is going well.`;
}

export default function MemberAlerts() {
  const { navigate } = useNavigation();
  const members = buildPriorityList();
  const [bulkApproved, setBulkApproved] = useState(false);
  const [rowStates, setRowStates] = useState({}); // memberId -> 'approved' | 'dismissed' | 'snoozed'
  const [undoToast, setUndoToast] = useState(null); // { memberId, memberName, prevState }
  const undoTimerRef = useRef(null);

  // Clear undo toast timer on unmount
  useEffect(() => () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current); }, []);

  const handleRowAction = (memberId, action, memberName, memberAction) => {
    const prevState = rowStates[memberId] || null;
    setRowStates(prev => ({ ...prev, [memberId]: action }));

    // Show 5-second undo toast
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoToast({ memberId, memberName, action, prevState });
    undoTimerRef.current = setTimeout(() => {
      setUndoToast(null);
      // Commit the action only after undo window expires
      if (action === 'approved') {
        trackAction({
          actionType: 'approve',
          actionSubtype: 'member_alert',
          memberId,
          memberName,
          referenceType: 'priority_member',
          referenceId: `alert_${memberId}`,
          description: `Approved outreach: ${memberAction}`,
        });
      }
    }, 5000);
  };

  const handleUndo = () => {
    if (!undoToast) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setRowStates(prev => {
      const next = { ...prev };
      if (undoToast.prevState === null) {
        delete next[undoToast.memberId];
      } else {
        next[undoToast.memberId] = undoToast.prevState;
      }
      return next;
    });
    setUndoToast(null);
  };

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
    const summary = getMemberSummary();
    const rosterImported = (summary.total || 0) > 0;
    const hasActivityData = isGateOpen('tee-sheet') || isGateOpen('fb') || isGateOpen('email');

    // Stage 1: members imported but no activity — next step is connecting activity sources,
    // not re-importing members. Teases $32K dues save opportunity.
    if (rosterImported && !hasActivityData) {
      return (
        <div className="alerts-section-enhanced fade-in-up fade-delay-1">
          <div className="alerts-header">Priority Member Alerts</div>
          <div className="alerts-empty" style={{ flexWrap: 'wrap' }}>
            <div className="alerts-empty-icon">◆</div>
            <div style={{ flex: '1 1 0%', minWidth: 200 }}>
              <div className="alerts-empty-title">{summary.total} members imported · awaiting activity data</div>
              <div className="alerts-empty-desc">
                Connect POS and tee sheet to spot at-risk members before they resign — catch 82→61 health drops and protect $32K+ in annual dues per save.
              </div>
            </div>
            <button
              className="alerts-cta"
              onClick={() => navigate('integrations')}
              style={{ background: 'rgb(243,146,45)', color: '#fff' }}
            >
              Connect POS / Tee Sheet →
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="alerts-section-enhanced fade-in-up fade-delay-1">
        <div className="alerts-header">Priority Member Alerts</div>
        <div className="alerts-empty" style={{ flexWrap: 'wrap' }}>
          <div className="alerts-empty-icon">✅</div>
          <div style={{ flex: '1 1 0%', minWidth: 200 }}>
            <div className="alerts-empty-title">All Members in Good Standing</div>
            <div className="alerts-empty-desc">{rosterImported ? 'No at-risk members detected. Connect additional engagement sources to refine health scoring.' : 'Import member data and connect activity sources to activate priority alerts.'}</div>
          </div>
          <button className="alerts-cta" onClick={() => navigate(rosterImported ? 'members' : 'integrations/csv-import', rosterImported ? {} : { category: 'members' })}>{rosterImported ? 'View Members →' : 'Import Member Data'}</button>
        </div>
      </div>
    );
  }

  return (
    <div id="today-member-alerts" className="alerts-section-enhanced fade-in-up fade-delay-1" data-section="member-alerts">
      {/* Undo toast — 5-second window after Approve/Dismiss */}
      {undoToast && (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 mb-2 rounded-lg bg-swoop-canvas border border-swoop-border text-xs animate-fade-in">
          <span className="text-swoop-text-muted">
            {undoToast.action === 'approved' ? '✓ Approved' : undoToast.action === 'snoozed' ? '⏰ Snoozed' : 'Dismissed'} outreach for <span className="font-semibold text-swoop-text">{undoToast.memberName}</span>
          </span>
          <button
            type="button"
            onClick={handleUndo}
            className="text-brand-500 font-bold hover:underline bg-transparent border-none cursor-pointer p-0 text-xs shrink-0"
          >
            Undo
          </button>
        </div>
      )}
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
          // Canonical §2.8 tint pair: severity color drives background + border.
          // Bulk-approved rows shift to green success tint; individually approved/dismissed rows too.
          const rowState = rowStates[m.memberId];
          const isRowApproved = bulkApproved || rowState === 'approved';
          const isRowDismissed = rowState === 'dismissed';
          const isRowSnoozed = rowState === 'snoozed';
          const severityRgb = isRowApproved
            ? '34,197,94'
            : isRowDismissed || isRowSnoozed
            ? '100,100,120'
            : m.score < 30 ? '239,68,68'
            : m.score < 50 ? '243,146,45'
            : '245,158,11';
          const severityColor = `rgb(${severityRgb})`;
          const severityLabel = isRowApproved ? 'APPROVED' : isRowSnoozed ? 'SNOOZED' : isRowDismissed ? 'DISMISSED' : healthTierLabel(m.score).toUpperCase();
          const teeTime = getTeeTimeForMember(m.memberId);

          const metaParts = [
            `Health ${m.score}`,
            m.archetype,
            teeTime ? `Tees ${teeTime.time}` : null,
            m.duesAnnual > 0 ? `$${Math.round(m.duesAnnual / 1000)}K/yr` : null,
          ].filter(Boolean);

          return (
            <div
              key={m.memberId}
              className="swoop-detail-row"
              style={{
                background: `rgba(${severityRgb},0.07)`,
                borderColor: `rgba(${severityRgb},0.18)`,
                flexDirection: 'column',
                gap: 0,
                opacity: isRowApproved || isRowDismissed || isRowSnoozed ? 0.6 : 1,
              }}
            >
              {/* Header strip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: severityColor,
                    background: `rgba(${severityRgb},0.15)`,
                    border: `1px solid rgba(${severityRgb},0.3)`,
                    padding: '2px 7px',
                    borderRadius: 999,
                    flexShrink: 0,
                  }}
                >
                  {severityLabel}
                </span>
                <MemberLink
                  memberId={m.memberId}
                  mode="drawer"
                  className="underline decoration-brand-500/50"
                  style={{ fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none' }}
                >
                  {m.name}
                </MemberLink>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                  {metaParts.join(' · ')}
                </span>
                {m.roundsTrend?.length > 0 && (
                  <span className="inline-flex items-end gap-px shrink-0" title={m.roundsTrend.map(t => `${t.month}: ${t.rounds}`).join(' → ')}>
                    {m.roundsTrend.map((t, i) => {
                      const max = Math.max(...m.roundsTrend.map(r => r.rounds), 1);
                      const h = Math.max(Math.round((t.rounds / max) * 16), 2);
                      return <span key={i} style={{ width: 4, height: h, borderRadius: 1, background: i === m.roundsTrend.length - 1 ? severityColor : 'rgba(255,255,255,0.25)' }} />;
                    })}
                  </span>
                )}
                <span style={{ flex: '1 1 0%' }} />
                {/* Approve / Dismiss / View segmented control */}
                <div className="flex items-center gap-1 shrink-0">
                  {rowStates[m.memberId] === 'approved' ? (
                    <span className="text-[10px] font-bold text-success-500 px-2">✓ Approved</span>
                  ) : rowStates[m.memberId] === 'snoozed' ? (
                    <span className="text-[10px] font-bold text-swoop-text-muted px-2">⏰ Snoozed to tomorrow</span>
                  ) : rowStates[m.memberId] === 'dismissed' ? (
                    <span className="text-[10px] font-bold text-swoop-text-muted px-2">Dismissed</span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRowAction(m.memberId, 'approved', m.name, m.action)}
                        className="px-2.5 py-1 rounded-l-md text-[10px] font-bold bg-success-500/15 text-success-500 border border-success-500/30 hover:bg-success-500/25 transition-colors"
                        title={`Preview draft:\n\n"${buildDraftPreview(m)}"\n\nApprove to send via ${m.archetype === 'Ghost' ? 'email' : 'email or SMS'}.`}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRowAction(m.memberId, 'snoozed', m.name, m.action)}
                        className="px-2.5 py-1 text-[10px] font-bold bg-swoop-row text-swoop-text-muted border-y border-swoop-border hover:bg-swoop-border transition-colors"
                        title="Snooze: push this alert to tomorrow"
                      >
                        Snooze
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRowAction(m.memberId, 'dismissed', m.name, m.action)}
                        className="px-2.5 py-1 text-[10px] font-bold bg-swoop-row text-swoop-text-muted border-y border-l-0 border-swoop-border hover:bg-swoop-border transition-colors"
                        title="Dismiss this alert"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('members')}
                        className="px-2.5 py-1 rounded-r-md text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/25 hover:bg-brand-500/20 transition-colors"
                        title="View member profile"
                      >
                        View →
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Divider + 2-col body */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  width: '100%',
                }}
              >
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>
                    Signal
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
                    {m.reason}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>
                    Recommended Action
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
                    {isRowApproved && '✓ '}{m.action}
                  </div>
                  {m.duesAnnual > 0 && (
                    <div style={{ fontSize: 11, color: severityColor, fontWeight: 700, marginTop: 4 }}>
                      ${Math.round(m.duesAnnual / 1000)}K/yr dues at risk: save opportunity
                    </div>
                  )}
                  {m.owner && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600, marginTop: 2 }}>
                      Owner: {m.owner}
                    </div>
                  )}
                </div>
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
