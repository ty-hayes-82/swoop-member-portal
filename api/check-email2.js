import { sql } from '@vercel/postgres';
export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG) return res.status(403).json({ error: 'Disabled in production' });
  const results = {};
  try {
    // Direct test of the heatmap query
    const test = await sql`
      SELECT
        ec.subject,
        m.archetype,
        COUNT(*) FILTER (WHERE ee.event_type = 'sent') AS sends,
        COUNT(*) FILTER (WHERE ee.event_type = 'opened') AS opens
      FROM email_campaigns ec
      JOIN email_events ee ON ec.campaign_id = ee.campaign_id
      JOIN members m ON ee.member_id::text = m.member_id::text
      GROUP BY ec.campaign_id, ec.subject, m.archetype
      ORDER BY sends DESC
      LIMIT 5
    `;
    results.heatmap_test = test.rows;
  } catch(e) { results.heatmap_test_error = e.message; }

  try {
    // Check campaign_id types
    const campType = await sql`SELECT campaign_id, pg_typeof(campaign_id) AS t FROM email_campaigns LIMIT 1`;
    const evtType = await sql`SELECT campaign_id, pg_typeof(campaign_id) AS t FROM email_events LIMIT 1`;
    results.campaign_id_types = {
      campaigns: campType.rows[0],
      events: evtType.rows[0],
    };
  } catch(e) { results.type_error = e.message; }

  try {
    // Simple count test
    const joinTest = await sql`
      SELECT COUNT(*) AS n
      FROM email_events ee
      WHERE ee.campaign_id IN (SELECT campaign_id FROM email_campaigns)
    `;
    results.matching_events = parseInt(joinTest.rows[0].n);
  } catch(e) { results.match_error = e.message; }

  try {
    // Check member join
    const memberJoin = await sql`
      SELECT COUNT(*) AS n
      FROM email_events ee
      JOIN members m ON ee.member_id::text = m.member_id::text
    `;
    results.member_join_count = parseInt(memberJoin.rows[0].n);
  } catch(e) { results.member_join_error = e.message; }

  res.status(200).json(results);
}
