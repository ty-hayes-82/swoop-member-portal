/**
 * Outcome Tracking Engine — Sprint 6
 * POST /api/track-outcomes?clubId=xxx
 *
 * Runs after health score recomputation. Checks interventions from the
 * past 60 days and measures whether the member's health improved.
 * Auto-flags "Member Saves" for the Board Report.
 */
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { clubId } = req.query;
  if (!clubId) {
    return res.status(400).json({ error: 'clubId query param required' });
  }

  try {
    // Find interventions from last 60 days that don't have outcomes measured yet
    const interventions = await sql`
      SELECT i.intervention_id, i.member_id, i.intervention_type, i.initiated_at,
             i.health_score_before, i.description,
             m.health_score as current_score, m.annual_dues, m.first_name, m.last_name
      FROM interventions i
      JOIN members m ON i.member_id = m.member_id
      WHERE i.club_id = ${clubId}
        AND i.outcome_measured_at IS NULL
        AND i.initiated_at >= NOW() - INTERVAL '60 days'
        AND i.health_score_before IS NOT NULL
    `;

    if (interventions.rows.length === 0) {
      return res.status(200).json({ message: 'No interventions to measure', measured: 0 });
    }

    let measured = 0;
    let saves = 0;
    const saveDetails = [];

    for (const intv of interventions.rows) {
      const scoreBefore = Number(intv.health_score_before);
      const scoreAfter = Number(intv.current_score);

      if (!Number.isFinite(scoreBefore) || !Number.isFinite(scoreAfter)) continue;

      const delta = scoreAfter - scoreBefore;
      const daysSince = Math.floor((Date.now() - new Date(intv.initiated_at).getTime()) / 86400000);

      // Only measure if at least 7 days have passed (give time for behavior change)
      if (daysSince < 7) continue;

      let outcome = '';
      let isSave = false;
      let duesProtected = 0;
      let revenueRecovered = 0;

      if (delta >= 15) {
        outcome = 'Strong recovery — health score improved significantly';
        isSave = true;
        duesProtected = Number(intv.annual_dues) || 0;
        revenueRecovered = Math.round(duesProtected * 0.25); // Estimated 25% incremental revenue
      } else if (delta >= 5) {
        outcome = 'Moderate improvement — member showing re-engagement signals';
        isSave = scoreBefore < 45; // Count as save only if was at-risk or critical
        duesProtected = isSave ? (Number(intv.annual_dues) || 0) : 0;
      } else if (delta >= 0) {
        outcome = 'Stabilized — no further decline detected';
        isSave = scoreBefore < 25 && scoreAfter >= 25; // Saved from critical
        duesProtected = isSave ? (Number(intv.annual_dues) || 0) : 0;
      } else if (delta >= -10) {
        outcome = 'Continued decline — intervention may need escalation';
      } else {
        outcome = 'Significant decline despite intervention — urgent follow-up needed';
      }

      // Update intervention with outcome
      await sql`
        UPDATE interventions
        SET outcome = ${outcome},
            outcome_measured_at = NOW(),
            health_score_after = ${scoreAfter},
            is_member_save = ${isSave},
            dues_protected = ${duesProtected},
            revenue_recovered = ${revenueRecovered}
        WHERE intervention_id = ${intv.intervention_id}
      `;

      measured++;

      if (isSave) {
        saves++;
        saveDetails.push({
          memberId: intv.member_id,
          memberName: `${intv.first_name} ${intv.last_name}`,
          interventionType: intv.intervention_type,
          scoreBefore,
          scoreAfter,
          delta,
          duesProtected,
          outcome,
        });
      }
    }

    // Log sync
    await sql`
      INSERT INTO data_syncs (club_id, source_type, status, records_processed, completed_at)
      VALUES (${clubId}, 'outcome_tracking', 'completed', ${measured}, NOW())
    `;

    res.status(200).json({
      clubId,
      totalInterventions: interventions.rows.length,
      measured,
      saves,
      saveDetails: saveDetails.slice(0, 20),
      message: `${measured} outcomes measured. ${saves} member saves detected.`,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
