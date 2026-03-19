import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { operation, confirmationId, reassignmentId, ...fields } = req.body;
      if (operation === 'updateConfirmation') {
        await sql`UPDATE booking_confirmations
          SET outreach_status = ${fields.outreachStatus ?? null},
              staff_notes = ${fields.staffNotes ?? null},
              contacted_at = NOW()
          WHERE confirmation_id = ${confirmationId}`;
      } else if (operation === 'decideReassignment') {
        await sql`UPDATE slot_reassignments
          SET status = ${fields.status ?? 'decided'},
              staff_decision = ${fields.staffDecision ?? null},
              decided_at = NOW()
          WHERE reassignment_id = ${reassignmentId}`;
      }
      return res.status(200).json({ ok: true });
    }

    const [confirmationsResult, reassignmentsResult, configResult] = await Promise.all([
      sql`SELECT * FROM booking_confirmations ORDER BY created_at DESC`,
      sql`SELECT * FROM slot_reassignments ORDER BY reassignment_id`,
      sql`SELECT * FROM waitlist_config WHERE club_id = 'oakmont'`,
    ]);

    const confirmations = confirmationsResult.rows.map((r) => ({
      id: r.confirmation_id ?? r.id,
      bookingId: r.booking_id ?? r.bookingId,
      memberId: r.member_id ?? r.memberId,
      memberName: r.member_name ?? r.memberName,
      teeTime: r.tee_time ?? r.teeTime,
      cancelProbability: parseFloat(r.cancel_probability ?? r.cancelProbability ?? 0),
      outreachStatus: r.outreach_status ?? r.outreachStatus ?? 'pending',
      outreachChannel: r.outreach_channel ?? r.outreachChannel,
      staffNotes: r.staff_notes ?? r.staffNotes,
      contactedAt: r.contacted_at ?? r.contactedAt,
      respondedAt: r.responded_at ?? r.respondedAt,
      createdAt: r.created_at ?? r.createdAt,
      archetype: r.archetype ?? null,
      drivers: r.drivers ?? [],
    }));

    const reassignments = reassignmentsResult.rows.map((r) => ({
      id: r.reassignment_id ?? r.id,
      sourceBookingId: r.source_booking_id ?? r.sourceBookingId,
      sourceSlot: r.source_slot ?? r.sourceSlot,
      sourceMemberId: r.source_member_id ?? r.sourceMemberId,
      sourceMemberName: r.source_member_name ?? r.sourceMemberName,
      cancelReason: r.cancel_reason ?? r.cancelReason,
      recommendedFillMemberId: r.recommended_fill_member_id ?? r.recommendedFillMemberId,
      recommendedFillMemberName: r.recommended_fill_member_name ?? r.recommendedFillMemberName,
      recommendedFillHealthScore: r.recommended_fill_health_score ?? r.recommendedFillHealthScore,
      recommendedFillRiskLevel: r.recommended_fill_risk_level ?? r.recommendedFillRiskLevel,
      recommendedFillDuesAtRisk: r.recommended_fill_dues_at_risk ?? r.recommendedFillDuesAtRisk,
      recommendedFillDaysWaiting: r.recommended_fill_days_waiting ?? r.recommendedFillDaysWaiting,
      retentionRationale: r.retention_rationale ?? r.retentionRationale,
      status: r.status ?? 'pending',
      overrideMemberId: r.override_member_id ?? r.overrideMemberId,
      overrideMemberName: r.override_member_name ?? r.overrideMemberName,
      staffDecision: r.staff_decision ?? r.staffDecision,
      decidedAt: r.decided_at ?? r.decidedAt,
      outcome: r.outcome ?? 'pending',
      outcomeAt: r.outcome_at ?? r.outcomeAt,
      revenueRecovered: r.revenue_recovered ?? r.revenueRecovered ?? 0,
      healthScoreBefore: r.health_score_before ?? r.healthScoreBefore,
      healthScoreAfter: r.health_score_after ?? r.healthScoreAfter,
      auditTrail: r.audit_trail ?? r.auditTrail ?? [],
    }));

    const rawConfig = configResult.rows[0] ?? null;
    const config = rawConfig ? {
      clubId: rawConfig.club_id ?? rawConfig.clubId,
      confirmationLeadHours: rawConfig.confirmation_lead_hours ?? rawConfig.confirmationLeadHours,
      cancelThreshold: parseFloat(rawConfig.cancel_threshold ?? rawConfig.cancelThreshold ?? 0.3),
      autoReleaseHours: rawConfig.auto_release_hours ?? rawConfig.autoReleaseHours,
      priorityWeights: rawConfig.priority_weights ?? rawConfig.priorityWeights,
    } : null;

    res.status(200).json({ confirmations, reassignments, config });
  } catch (err) {
    console.error('/api/tee-sheet-ops error:', err);
    res.status(500).json({ error: err.message });
  }
}
