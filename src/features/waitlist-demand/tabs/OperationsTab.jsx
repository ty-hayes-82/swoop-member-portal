import { useMemo } from 'react';
import { StatCard, SoWhatCallout, InfoTooltip } from '@/components/ui';
import { theme } from '@/config/theme';
import { useApp } from '@/context/AppContext';
import { trackAction } from '@/services/activityService';
import { getConfirmations, getConfirmationSummary, getReassignments, getFillReport } from '@/services/teeSheetOpsService';
import { getWaitlistQueue } from '@/services/waitlistService';
import ConfirmationRow from '../components/ConfirmationRow';
import ReassignmentCard from '../components/ReassignmentCard';

export default function OperationsTab() {
  const { showToast, updateConfirmation, createReassignment, updateReassignment, teeSheetOps } = useApp();

  const confirmations = useMemo(() => getConfirmations(), [teeSheetOps.confirmations]);
  const summary = useMemo(() => getConfirmationSummary(), [teeSheetOps.confirmations]);
  const reassignments = useMemo(() => getReassignments(), [teeSheetOps.reassignments]);
  const fillReport = useMemo(() => getFillReport(), [teeSheetOps.reassignments]);
  const queue = useMemo(() => getWaitlistQueue(), []);

  const pendingReassignments = reassignments.filter((r) => r.status === 'pending');
  const completedReassignments = reassignments.filter((r) => r.status === 'completed');

  function handleUpdateStatus(id, newStatus) {
    const conf = confirmations.find((c) => c.id === id);
    updateConfirmation(id, { outreachStatus: newStatus });

    if (newStatus === 'confirmed') {
      showToast(`${conf?.memberName ?? 'Member'} confirmed for ${conf?.teeTime ?? 'slot'}`, 'success');
      trackAction({ actionType: 'confirm', actionSubtype: newStatus, memberId: conf?.memberId, memberName: conf?.memberName, referenceId: id, referenceType: 'confirmation', description: conf?.teeTime });
    } else if (newStatus === 'cancelled' || newStatus === 'no_response') {
      showToast(
        newStatus === 'cancelled'
          ? `${conf?.memberName ?? 'Member'} cancelled — slot entering re-assignment pipeline`
          : `No response from ${conf?.memberName ?? 'member'} — slot released to pipeline`,
        'warning',
      );
      trackAction({ actionType: 'confirm', actionSubtype: newStatus, memberId: conf?.memberId, memberName: conf?.memberName, referenceId: id, referenceType: 'confirmation', description: conf?.teeTime });
      // Auto-create re-assignment entry
      if (conf) {
        const topCandidate = queue.find((m) => m.memberId !== conf.memberId) ?? queue[0];
        if (topCandidate) {
          createReassignment({
            sourceBookingId: conf.bookingId,
            sourceSlot: conf.teeTime,
            sourceMemberId: conf.memberId,
            sourceMemberName: conf.memberName,
            cancelReason: newStatus === 'cancelled' ? 'Member confirmed cancellation' : 'No response to outreach — slot released',
            recommendedFillMemberId: topCandidate.memberId,
            recommendedFillMemberName: topCandidate.memberName,
            recommendedFillHealthScore: topCandidate.healthScore,
            recommendedFillRiskLevel: topCandidate.riskLevel,
            recommendedFillDuesAtRisk: topCandidate.memberValueAnnual,
            recommendedFillDaysWaiting: topCandidate.daysWaiting,
            retentionRationale: `Health ${topCandidate.healthScore}, ${topCandidate.riskLevel}, $${(topCandidate.memberValueAnnual ?? 0).toLocaleString()}/yr dues, waiting ${topCandidate.daysWaiting} days. ${topCandidate.archetype} archetype.`,
          });
        }
      }
    } else {
      showToast(`${conf?.memberName ?? 'Member'} marked as ${newStatus}`, 'info');
      trackAction({ actionType: 'confirm', actionSubtype: newStatus, memberId: conf?.memberId, memberName: conf?.memberName, referenceId: id, referenceType: 'confirmation', description: conf?.teeTime });
    }
  }

  function handleAddNotes(id, notes) {
    updateConfirmation(id, { staffNotes: notes });
    showToast('Notes saved', 'success');
    trackAction({ actionType: 'note', actionSubtype: 'staff', referenceId: id, referenceType: 'confirmation', description: notes });
  }

  function handleApproveFill(id) {
    updateReassignment(id, {
      status: 'completed',
      outcome: 'filled',
      staffDecision: 'Approved recommendation — highest retention priority in queue',
      staffId: 'staff_proshop',
    });
    showToast('Fill approved — member notified', 'success');
    const ra = reassignments.find((r) => r.id === id);
    trackAction({ actionType: 'reassign', actionSubtype: 'approve_fill', referenceId: id, referenceType: 'reassignment', memberId: ra?.recommendedFillMemberId, memberName: ra?.recommendedFillMemberName });
  }

  function handleOverride(id, member) {
    updateReassignment(id, {
      status: 'completed',
      outcome: 'filled',
      overrideMemberId: member.memberId,
      overrideMemberName: member.memberName,
      staffDecision: `Overridden — chose ${member.memberName} (health ${member.healthScore}, $${(member.memberValueAnnual ?? 0).toLocaleString()}/yr)`,
      staffId: 'staff_proshop',
    });
    showToast(`Override: ${member.memberName} assigned to slot`, 'success');
    trackAction({ actionType: 'reassign', actionSubtype: 'override', referenceId: id, referenceType: 'reassignment', memberId: member.memberId, memberName: member.memberName });
  }

  function handleSkip(id, reason) {
    updateReassignment(id, {
      status: 'skipped',
      staffDecision: reason || 'Skipped by staff',
      staffId: 'staff_proshop',
    });
    showToast('Slot skipped — will cascade to next candidate', 'warning');
    trackAction({ actionType: 'reassign', actionSubtype: 'skip', referenceId: id, referenceType: 'reassignment' });
  }

  const stats = [
    {
      label: 'Outreach Pending',
      value: summary.pending + summary.contacted,
      badge: { text: summary.contacted > 0 ? `${summary.contacted} contacted` : 'Action Needed', variant: summary.pending > 0 ? 'warning' : 'success' },
      source: 'Tee Sheet',
    },
    {
      label: 'Confirmed Today',
      value: summary.confirmed,
      badge: { text: 'Locked In', variant: 'success' },
      source: 'Staff',
    },
    {
      label: 'Slots for Re-Assignment',
      value: summary.slotsForReassignment,
      badge: { text: pendingReassignments.length > 0 ? `${pendingReassignments.length} awaiting decision` : 'Pipeline Clear', variant: pendingReassignments.length > 0 ? 'urgent' : 'success' },
      source: 'System',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: theme.spacing.md }}>
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Confirmation Panel */}
      <div style={{
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        background: theme.colors.bgCard,
        boxShadow: theme.shadow.sm,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: theme.spacing.md,
          borderBottom: `1px solid ${theme.colors.border}`,
          background: theme.colors.bgDeep,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontWeight: 700, color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, display: 'flex', alignItems: 'center', gap: 6 }}>
              Confirmation Outreach
              <InfoTooltip text="Proactively confirm high-risk bookings 24–72 hours before tee time. Catching cancellations early routes slots to retention-priority members instead of going empty." />
            </div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
              Contact high-risk bookings before they cancel. Log outcomes to feed the re-assignment pipeline.
            </div>
          </div>
        </div>

        <div style={{ padding: theme.spacing.md, display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 90px 100px 1fr',
            gap: theme.spacing.sm,
            padding: '0 12px',
            fontSize: 11,
            fontWeight: 600,
            color: theme.colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            <span>Member</span>
            <span>Top Risk Driver</span>
            <span>Cancel %</span>
            <span>Status</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>

          {confirmations.map((conf) => (
            <ConfirmationRow
              key={conf.id}
              confirmation={conf}
              onUpdateStatus={handleUpdateStatus}
              onAddNotes={handleAddNotes}
            />
          ))}
        </div>
      </div>

      {/* Re-Assignment Pipeline */}
      <div style={{
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        background: theme.colors.bgCard,
        boxShadow: theme.shadow.sm,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: theme.spacing.md,
          borderBottom: `1px solid ${theme.colors.border}`,
          background: theme.colors.bgDeep,
        }}>
          <div style={{ fontWeight: 700, color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, display: 'flex', alignItems: 'center', gap: 6 }}>
            Open Slots — Guided Re-Assignment
            <InfoTooltip text="When a booking is cancelled or goes unresponsive, the system recommends the highest-priority waitlist member for the open slot. Approve, override, or skip each recommendation." />
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
            Cancelled or unresponsive bookings create open slots. Route them to the right member.
          </div>
        </div>

        <div style={{ padding: theme.spacing.md, display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          {reassignments.length === 0 && (
            <div style={{ padding: theme.spacing.lg, textAlign: 'center', color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
              No open slots in the pipeline. Confirmation outreach results will appear here when bookings are cancelled or go unresponsive.
            </div>
          )}
          {reassignments.map((ra) => (
            <ReassignmentCard
              key={ra.id}
              reassignment={ra}
              queueMembers={queue}
              onApprove={handleApproveFill}
              onOverride={handleOverride}
              onSkip={handleSkip}
            />
          ))}
        </div>
      </div>

      {/* Impact callout */}
      <SoWhatCallout variant={completedReassignments.length > 0 ? 'insight' : 'warning'}>
        {completedReassignments.length > 0 ? (
          <>
            <strong>{completedReassignments.length} slot{completedReassignments.length > 1 ? 's' : ''} recovered today</strong> — ${fillReport.totalRevenueRecovered.toLocaleString()} in slot value protected.
            {fillReport.avgHealthDelta > 0 && (
              <> Served members gained an average of <strong>+{fillReport.avgHealthDelta} health points</strong> from tee sheet access.</>
            )}
            {' '}Every fill is logged with a full audit trail for board reporting.
          </>
        ) : (
          <>
            <strong>No fills completed yet.</strong> Mark cancellations or no-responses above to open slots for re-assignment.
            The system will recommend the highest-priority waitlist member for each slot.
          </>
        )}
      </SoWhatCallout>
    </div>
  );
}
