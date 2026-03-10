import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const results = {};

  try {
    const c = await sql`SELECT COUNT(*) AS n FROM email_campaigns`;
    results.email_campaigns = parseInt(c.rows[0].n);
  } catch(e) { results.email_campaigns = 'MISSING: ' + e.message.slice(0,100); }

  try {
    const e = await sql`SELECT COUNT(*) AS n FROM email_events`;
    results.email_events = parseInt(e.rows[0].n);
  } catch(e) { results.email_events = 'MISSING: ' + e.message.slice(0,100); }

  try {
    const m = await sql`SELECT COUNT(*) AS n FROM members WHERE membership_status = 'resigned'`;
    results.resigned_members = parseInt(m.rows[0].n);
  } catch(e) { results.resigned_members = 'ERROR: ' + e.message.slice(0,100); }

  try {
    const t = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'resigned_on'`;
    results.has_resigned_on = t.rows.length > 0;
  } catch(e) { results.has_resigned_on = 'ERROR: ' + e.message.slice(0,100); }

  try {
    const s = await sql`SELECT * FROM members WHERE membership_status = 'resigned' LIMIT 3`;
    results.sample_resigned = s.rows.map(r => ({ id: r.member_id, name: r.first_name + ' ' + r.last_name, status: r.membership_status }));
  } catch(e) { results.sample_resigned = e.message.slice(0,100); }

  try {
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
    results.all_tables = tables.rows.map(r => r.table_name);
  } catch(e) { results.all_tables = e.message.slice(0,100); }

  res.status(200).json(results);
}
