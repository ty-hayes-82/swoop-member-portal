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

    const confirmations = confirmationsResult.rows;
    const reassignments = reassignmentsResult.rows;
    const config = configResult.rows[0] ?? null;

    res.status(200).json({ confirmations, reassignments, config });
  } catch (err) {
    console.error('/api/tee-sheet-ops error:', err);
    res.status(500).json({ error: err.message });
  }
}
